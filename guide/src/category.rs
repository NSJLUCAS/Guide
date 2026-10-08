//! Managed navigation categories; service.category remains the compatible name.
use std::collections::HashSet;

use anyhow::Result;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

use crate::db::Db;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CategoryInput {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub sort: i64,
    pub count: i64,
}

pub fn category_name(name: &str) -> Result<String> {
    let name = name.trim();
    if name.is_empty() || name.chars().count() > 100 || name.chars().any(char::is_control) {
        refuse!("分类名称应为 1–100 个字符，不能包含控制字符");
    }
    Ok(name.to_owned())
}

/// Old service clients may still submit a new category by name. Append it, in
/// the same transaction as the service write, without reordering existing rows.
pub(crate) fn ensure_category(conn: &Connection, name: &str) -> Result<()> {
    if !name.is_empty() {
        conn.execute(
            "INSERT INTO category(name,sort) SELECT ?1,COALESCE(MAX(sort),-1)+1 FROM category
             HAVING NOT EXISTS(SELECT 1 FROM category WHERE name=?1)",
            [name],
        )?;
    }
    Ok(())
}

impl Db {
    pub fn categories(&self, full: bool) -> Result<Vec<Category>> {
        let conn = self.conn();
        let mut statement = conn.prepare(
            "SELECT c.id,c.name,c.sort,COUNT(s.id) FROM category c
             LEFT JOIN service s ON s.category=c.name AND (?1 OR (s.public=1 AND s.enabled=1))
             GROUP BY c.id ORDER BY c.sort,c.id",
        )?;
        let rows = statement.query_map([full], |r| {
            Ok(Category { id: r.get(0)?, name: r.get(1)?, sort: r.get(2)?, count: r.get(3)? })
        })?;
        Ok(rows.collect::<rusqlite::Result<_>>()?)
    }

    pub fn create_category(&self, name: &str) -> Result<()> {
        let name = category_name(name)?;
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        if tx.query_row("SELECT EXISTS(SELECT 1 FROM category WHERE name=?1)", [&name], |r| {
            r.get::<_, bool>(0)
        })? {
            refuse!("已有同名分类");
        }
        ensure_category(&tx, &name)?;
        tx.commit()?;
        Ok(())
    }

    pub fn rename_category(&self, id: i64, name: &str) -> Result<bool> {
        let name = category_name(name)?;
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let old: Option<String> =
            tx.query_row("SELECT name FROM category WHERE id=?1", [id], |r| r.get(0)).optional()?;
        let Some(old) = old else { return Ok(false) };
        if tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM category WHERE name=?1 AND id<>?2)",
            params![name, id],
            |r| r.get::<_, bool>(0),
        )? {
            refuse!("已有同名分类");
        }
        tx.execute("UPDATE category SET name=?2 WHERE id=?1", params![id, name])?;
        // Metadata-only: URL, service order and in-flight check revisions remain.
        tx.execute("UPDATE service SET category=?2 WHERE category=?1", params![old, name])?;
        tx.commit()?;
        Ok(true)
    }

    pub fn delete_category(&self, id: i64) -> Result<bool> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let found: bool =
            tx.query_row("SELECT EXISTS(SELECT 1 FROM category WHERE id=?1)", [id], |r| r.get(0))?;
        if !found {
            return Ok(false);
        }
        let deleted = tx.execute(
            "DELETE FROM category WHERE id=?1 AND NOT EXISTS(SELECT 1 FROM service WHERE category=category.name)", [id],
        )?;
        if deleted == 0 {
            refuse!("该分类仍有关联网站，请先迁移关联网站后再删除");
        }
        tx.commit()?;
        Ok(true)
    }

    pub fn reorder_categories(&self, ids: &[i64]) -> Result<()> {
        if ids.iter().collect::<HashSet<_>>().len() != ids.len() {
            refuse!("排序里有重复的分类");
        }
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let count: i64 = tx.query_row("SELECT COUNT(*) FROM category", [], |r| r.get(0))?;
        if count as usize != ids.len() {
            refuse!("分类列表已在别处改动，刷新后再排序");
        }
        for (sort, id) in ids.iter().enumerate() {
            if tx.execute("UPDATE category SET sort=?2 WHERE id=?1", params![id, sort as i64])? != 1 {
                refuse!("分类列表已在别处改动，刷新后再排序");
            }
        }
        tx.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::service::{CheckResult, ServiceInput};

    fn service(db: &Db, name: &str, category: &str, public: bool, enabled: bool) -> i64 {
        let mut input: ServiceInput = serde_json::from_value(serde_json::json!({
            "name": name, "url": "https://example.com", "category": category, "sort": 91,
            "public": public, "enabled": enabled
        }))
        .unwrap();
        input.validate().unwrap();
        db.create_service(&input).unwrap().id
    }

    #[test]
    fn empty_categories_counts_and_old_service_clients_are_supported() {
        let db = Db::open(":memory:").unwrap();
        db.create_category(" 空分类 ").unwrap();
        service(&db, "public", "工具", true, true);
        service(&db, "private", "工具", false, true);
        service(&db, "disabled", "工具", true, false);
        service(&db, "unclassified", "", true, true);
        let rows = db.categories(true).unwrap();
        assert_eq!(
            rows.iter().map(|c| (c.name.as_str(), c.count)).collect::<Vec<_>>(),
            vec![("空分类", 0), ("工具", 3)]
        );
        assert_eq!(db.categories(false).unwrap()[1].count, 1);
        for name in ["", "  ", "bad\nname", &"长".repeat(101), " 工具 "] {
            assert!(db.create_category(name).is_err());
        }
        assert_eq!(db.categories(true).unwrap().len(), 2);
    }

    #[test]
    fn rename_and_delete_are_atomic_and_keep_protected_measurements_and_order() {
        let db = Db::open(":memory:").unwrap();
        let id = service(&db, "one", "工具", true, true);
        let target = db.service_check_targets().unwrap().remove(0);
        db.save_service_check(
            &target,
            &CheckResult {
                status: "protected",
                response_ms: None,
                checked_at: 1000,
                http_status: Some(403),
                error_kind: Some("cloudflare_challenge"),
            },
        )
        .unwrap();
        let category = db.categories(true).unwrap().remove(0);
        db.create_category("影音").unwrap();
        assert!(db.rename_category(category.id, "影音").is_err());
        assert_eq!(db.services(true).unwrap()[0].category, "工具");
        assert!(db.delete_category(category.id).unwrap_err().to_string().contains("先迁移"));
        assert!(db.rename_category(category.id, "新工具").unwrap());
        let current = db.services(true).unwrap().remove(0);
        assert_eq!((current.id, current.sort, current.category.as_str()), (id, 91, "新工具"));
        assert_eq!(db.service_check_targets().unwrap()[0].revision, target.revision);
        assert_eq!(
            serde_json::to_value(db.service_views(true, 1000).unwrap()).unwrap()[0]["status"],
            "protected"
        );
        db.conn().execute("UPDATE service SET category='' WHERE id=?1", [id]).unwrap();
        assert!(db.delete_category(category.id).unwrap());
        assert!(!db.delete_category(category.id).unwrap());
        assert!(!db.rename_category(category.id, "missing").unwrap());
        assert_eq!(db.services(true).unwrap().len(), 1);
    }

    #[test]
    fn complete_order_is_required_and_deleted_ids_are_not_reused() {
        let db = Db::open(":memory:").unwrap();
        for name in ["a", "b", "c"] {
            db.create_category(name).unwrap();
        }
        let ids: Vec<i64> = db.categories(true).unwrap().iter().map(|c| c.id).collect();
        db.reorder_categories(&[ids[2], ids[0], ids[1]]).unwrap();
        let names = || db.categories(true).unwrap().into_iter().map(|c| c.name).collect::<Vec<_>>();
        for refused in [vec![ids[0]], vec![ids[0], ids[0], ids[1]], vec![ids[0], ids[1], 999]] {
            assert!(db.reorder_categories(&refused).is_err());
            assert_eq!(names(), vec!["c", "a", "b"]);
        }
        db.delete_category(ids[2]).unwrap();
        db.create_category("d").unwrap();
        assert_eq!(names(), vec!["a", "b", "d"]);
        assert_ne!(db.categories(true).unwrap()[2].id, ids[2]);
        assert!(db.reorder_categories(&ids).is_err());
    }
}
