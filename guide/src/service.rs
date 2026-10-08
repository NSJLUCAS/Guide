//! Website navigation configuration, independent of monitored nodes.

use std::collections::HashSet;

use anyhow::Result;
use chrono::{DateTime, SecondsFormat, Utc};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};

use crate::db::Db;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub description: String,
    pub icon: Option<String>,
    pub category: String,
    pub sort: i64,
    pub public: bool,
    pub enabled: bool,
    pub check_enabled: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ServiceInput {
    pub name: String,
    pub url: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub sort: i64,
    #[serde(default)]
    pub public: bool,
    #[serde(default = "enabled")]
    pub enabled: bool,
    #[serde(default = "enabled", rename = "checkEnabled", alias = "check_enabled")]
    pub check_enabled: bool,
}

fn enabled() -> bool {
    true
}

impl ServiceInput {
    pub fn validate(&mut self) -> Result<()> {
        self.name = self.name.trim().to_owned();
        self.url = self.url.trim().to_owned();
        self.description = self.description.trim().to_owned();
        self.category = self.category.trim().to_owned();
        self.icon = self.icon.take().map(|s| s.trim().to_owned()).filter(|s| !s.is_empty());
        if self.name.is_empty() || self.name.chars().count() > 100 || self.name.chars().any(char::is_control)
        {
            refuse!("网站名称不能为空，最多 100 个字符且不能包含控制字符");
        }
        if self.url.is_empty() || self.url.chars().count() > 2048 || self.url.chars().any(char::is_control) {
            refuse!("请填写有效的网站地址，最多 2048 个字符");
        }
        let parsed = reqwest::Url::parse(&self.url)
            .map_err(|_| anyhow::Error::msg(crate::Shown("网站地址格式不正确".into())))?;
        let authority =
            self.url.split_once("://").map(|(_, rest)| rest.split(['/', '?', '#']).next().unwrap_or(""));
        if !matches!(parsed.scheme(), "http" | "https")
            || parsed.host_str().is_none()
            || !parsed.username().is_empty()
            || parsed.password().is_some()
            || authority.is_none_or(|host| host.is_empty() || host.contains('@'))
        {
            refuse!("网站地址只允许不含用户名和密码的 HTTP / HTTPS 地址");
        }
        self.url = parsed.to_string();
        if self.url.chars().count() > 2048 {
            refuse!("规范化后的网站地址最多 2048 个字符");
        }
        if self.check_enabled && !crate::service_target::target_allowed(&parsed) {
            refuse!("在线检测不允许云元数据、回环、链路本地或其他禁止目标；仅作导航链接请关闭在线检测");
        }
        if self.description.chars().count() > 2000
            || self.category.chars().count() > 100
            || self.icon.as_ref().is_some_and(|s| s.chars().count() > 2048)
        {
            refuse!("简介最多 2000 个字符，分类最多 100 个字符，图标最多 2048 个字符");
        }
        if !self.category.is_empty() {
            self.category = crate::category::category_name(&self.category)?;
        }
        Ok(())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceView {
    #[serde(flatten)]
    service: Service,
    status: &'static str,
    response_ms: Option<i64>,
    checked_at: Option<String>,
}

/// Configuration snapshot owned by the checker; no database lock survives it.
#[derive(Debug, Clone)]
pub struct CheckTarget {
    pub id: i64,
    pub url: String,
    pub revision: String,
}

#[derive(Debug, Clone)]
pub struct CheckResult {
    pub status: &'static str,
    pub response_ms: Option<i64>,
    pub checked_at: i64,
    pub http_status: Option<u16>,
    pub error_kind: Option<&'static str>,
}

pub const CLOUDFLARE_CHALLENGE: &str = "cloudflare_challenge";

impl Service {
    pub fn view(self) -> ServiceView {
        let status = if self.check_enabled { "unknown" } else { "unchecked" };
        ServiceView { service: self, status, response_ms: None, checked_at: None }
    }
}

const LIST_ALL: &str = "SELECT id,name,url,description,icon,category,sort,public,enabled,created_at,updated_at,check_enabled FROM service ORDER BY sort,id";
const LIST_PUBLIC: &str = "SELECT id,name,url,description,icon,category,sort,public,enabled,created_at,updated_at,check_enabled FROM service WHERE public=1 AND enabled=1 ORDER BY sort,id";
const GET_SERVICE: &str = "SELECT id,name,url,description,icon,category,sort,public,enabled,created_at,updated_at,check_enabled FROM service WHERE id=?1";
const CREATE_SERVICE: &str = "INSERT INTO service (name,url,description,icon,category,sort,public,enabled,created_at,updated_at,check_enabled,check_revision) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9,?10,?11)";
const UPDATE_SERVICE: &str = "UPDATE service SET name=?1,url=?2,description=?3,icon=?4,category=?5,sort=?6,public=?7,enabled=?8,updated_at=?9,check_enabled=?10,check_revision=?11 WHERE id=?12";
const REORDER_SERVICE: &str = "UPDATE service SET sort=?2,updated_at=?3 WHERE id=?1";
const DELETE_SERVICE: &str = "DELETE FROM service WHERE id=?1";
const CHECK_TARGETS: &str =
    "SELECT id,url,check_revision FROM service WHERE enabled=1 AND check_enabled=1 ORDER BY sort,id";
const SAVE_CHECK: &str =
    "INSERT INTO service_status (service_id,status,response_ms,checked_at,http_status,error_kind)
    SELECT id,?4,?5,?6,?7,?8 FROM service
    WHERE id=?1 AND url=?2 AND check_revision=?3 AND enabled=1 AND check_enabled=1
    ON CONFLICT(service_id) DO UPDATE SET status=excluded.status,response_ms=excluded.response_ms,
        checked_at=excluded.checked_at,http_status=excluded.http_status,error_kind=excluded.error_kind";
const LIST_VIEWS: &str = "SELECT s.id,s.name,s.url,s.description,s.icon,s.category,s.sort,s.public,s.enabled,
    s.created_at,s.updated_at,s.check_enabled,st.status,st.response_ms,st.checked_at,st.error_kind
    FROM service s LEFT JOIN service_status st ON st.service_id=s.id
    WHERE ?1 OR (s.public=1 AND s.enabled=1) ORDER BY s.sort,s.id";

fn row(r: &rusqlite::Row<'_>) -> rusqlite::Result<Service> {
    Ok(Service {
        id: r.get(0)?,
        name: r.get(1)?,
        url: r.get(2)?,
        description: r.get(3)?,
        icon: r.get(4)?,
        category: r.get(5)?,
        sort: r.get(6)?,
        public: r.get(7)?,
        enabled: r.get(8)?,
        created_at: r.get(9)?,
        updated_at: r.get(10)?,
        check_enabled: r.get(11)?,
    })
}

impl Db {
    pub fn service_check_targets(&self) -> Result<Vec<CheckTarget>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(CHECK_TARGETS)?;
        let rows =
            stmt.query_map([], |r| Ok(CheckTarget { id: r.get(0)?, url: r.get(1)?, revision: r.get(2)? }))?;
        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    /// One conditional statement validates the current configuration and writes
    /// the result atomically. The HTTP request has already finished outside Db.
    pub fn save_service_check(&self, target: &CheckTarget, result: &CheckResult) -> Result<bool> {
        let response_ms = if result.status == "online" { result.response_ms } else { None };
        // Keep schema 13's online/offline CHECK and old-reader compatibility.
        // Only the public view translates this internal diagnostic to protected.
        let (status, error_kind) = if result.status == "protected" {
            ("offline", Some(CLOUDFLARE_CHALLENGE))
        } else {
            (result.status, result.error_kind)
        };
        Ok(self.conn().execute(
            SAVE_CHECK,
            params![
                target.id,
                target.url,
                target.revision,
                status,
                response_ms,
                result.checked_at,
                result.http_status.map(i64::from),
                error_kind
            ],
        )? == 1)
    }

    /// Configuration and latest results come from the same locked snapshot.
    pub fn service_views(&self, full: bool, now: i64) -> Result<Vec<ServiceView>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(LIST_VIEWS)?;
        let rows = stmt.query_map([full], |r| {
            let service = row(r)?;
            let status: Option<String> = r.get(12)?;
            let response_ms: Option<i64> = r.get(13)?;
            let checked_at: Option<i64> = r.get(14)?;
            let error_kind: Option<String> = r.get(15)?;
            let active = service.enabled && service.check_enabled;
            let mut view = service.view();
            if active {
                view.checked_at = checked_at
                    .and_then(|ts| DateTime::<Utc>::from_timestamp(ts, 0))
                    .map(|ts| ts.to_rfc3339_opts(SecondsFormat::Secs, true));
                if checked_at.is_some_and(|ts| ts <= now && now.saturating_sub(ts) <= 180) {
                    match status.as_deref() {
                        Some("online") => {
                            view.status = "online";
                            view.response_ms = response_ms;
                        }
                        Some("offline") => {
                            view.status = if error_kind.as_deref() == Some(CLOUDFLARE_CHALLENGE) {
                                "protected"
                            } else {
                                "offline"
                            };
                        }
                        _ => {}
                    }
                }
            }
            Ok(view)
        })?;
        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    pub fn services(&self, full: bool) -> Result<Vec<Service>> {
        let conn = self.conn();
        let mut stmt = conn.prepare(if full { LIST_ALL } else { LIST_PUBLIC })?;
        let rows = stmt.query_map([], row)?;
        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    pub fn create_service(&self, s: &ServiceInput) -> Result<Service> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        crate::category::ensure_category(&tx, &s.category)?;
        tx.execute(
            CREATE_SERVICE,
            params![
                s.name,
                s.url,
                s.description,
                s.icon,
                s.category,
                s.sort,
                s.public,
                s.enabled,
                Utc::now().timestamp(),
                s.check_enabled,
                crate::auth::random_token()
            ],
        )?;
        let service = tx.query_row(GET_SERVICE, [tx.last_insert_rowid()], row)?;
        tx.commit()?;
        Ok(service)
    }

    pub fn update_service(&self, id: i64, s: &ServiceInput) -> Result<Option<Service>> {
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let changed = tx.execute(
            UPDATE_SERVICE,
            params![
                s.name,
                s.url,
                s.description,
                s.icon,
                s.category,
                s.sort,
                s.public,
                s.enabled,
                Utc::now().timestamp(),
                s.check_enabled,
                crate::auth::random_token(),
                id
            ],
        )?;
        if changed != 0 {
            crate::category::ensure_category(&tx, &s.category)?;
        }
        tx.execute("DELETE FROM service_status WHERE service_id=?1", [id])?;
        let service = tx.query_row(GET_SERVICE, [id], row).optional()?;
        tx.commit()?;
        Ok(service)
    }

    pub fn delete_service(&self, id: i64) -> Result<bool> {
        Ok(self.conn().execute(DELETE_SERVICE, [id])? == 1)
    }

    pub fn reorder_services(&self, ids: &[i64]) -> Result<()> {
        if ids.iter().collect::<HashSet<_>>().len() != ids.len() {
            refuse!("排序里有重复的条目");
        }
        let mut conn = self.conn();
        let tx = conn.transaction()?;
        let count: i64 = tx.query_row("SELECT COUNT(*) FROM service", [], |r| r.get(0))?;
        if count as usize != ids.len() {
            refuse!("列表已在别处改动，刷新后再排序");
        }
        let now = Utc::now().timestamp();
        for (sort, id) in ids.iter().enumerate() {
            if tx.execute(REORDER_SERVICE, params![id, sort as i64, now])? != 1 {
                refuse!("列表已在别处改动，刷新后再排序");
            }
        }
        tx.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Node;

    fn input(name: &str) -> ServiceInput {
        serde_json::from_value(serde_json::json!({"name": name, "url": "https://example.com"})).unwrap()
    }

    #[test]
    fn service_validation_rejects_denied_check_targets_but_preserves_navigation_only_links() {
        for url in [
            "http://100.100.100.200/latest/meta-data/",
            "http://169.254.169.254/",
            "http://[fd00:ec2::254]/",
            "http://127.0.0.1/",
            "http://127.9.8.7/",
            "http://[::1]/",
            "http://[::ffff:127.0.0.1]/",
            "http://[::ffff:100.100.100.200]/",
            "http://localhost/",
            "http://LOCALHOST./",
            "http://app.localhost/",
            "http://metadata.google.internal./",
            "http://0.0.0.0/",
            "http://224.0.0.1/",
            "http://[fe80::1]/",
            "http://[ff02::1]/",
            "http://255.255.255.255/",
            "http://2130706433/",
            "http://0x7f000001/",
        ] {
            let mut value = input("denied");
            value.url = url.into();
            assert!(value.validate().is_err(), "checking must reject {url}");
            value.check_enabled = false;
            assert!(value.validate().is_ok(), "navigation-only must preserve {url}");
        }
        for url in [
            "http://10.0.0.1/",
            "http://172.16.0.1/",
            "http://192.168.1.2/",
            "http://intranet.example/",
            "http://[fd00::1]/",
        ] {
            let mut value = input("private");
            value.url = url.into();
            assert!(value.validate().is_ok(), "private services remain allowed: {url}");
        }
        for checking in [true, false] {
            for url in ["ftp://example.com/", "https://user:pass@example.com/", "not a url"] {
                let mut value = input("invalid");
                value.url = url.into();
                value.check_enabled = checking;
                assert!(value.validate().is_err());
            }
        }
    }

    fn result(status: &'static str, at: i64) -> CheckResult {
        CheckResult {
            status,
            response_ms: Some(37),
            checked_at: at,
            http_status: Some(200),
            error_kind: Some("private-diagnostic"),
        }
    }

    #[test]
    fn check_switch_defaults_true_accepts_both_names_and_is_public() {
        assert!(input("old-client").check_enabled);
        for field in ["checkEnabled", "check_enabled"] {
            let mut body = serde_json::json!({"name": "unchecked", "url": "https://example.com"});
            body[field] = serde_json::json!(false);
            let config: ServiceInput = serde_json::from_value(body).unwrap();
            let db = Db::open(":memory:").unwrap();
            let view = serde_json::to_value(db.create_service(&config).unwrap().view()).unwrap();
            assert_eq!(view["checkEnabled"], false);
            assert_eq!(view["status"], "unchecked");
            assert!(view["responseMs"].is_null() && view["checkedAt"].is_null());
            assert!(view.get("checkRevision").is_none() && view.get("check_revision").is_none());
        }
    }

    #[test]
    fn protected_checks_survive_reopen_backup_and_restore_with_legacy_rows() {
        let path = std::env::temp_dir().join(format!("guide-protected-{}.db", crate::auth::random_token()));
        let backup = path.with_extension("backup.db");
        {
            let db = Db::open(path.to_str().unwrap()).unwrap();
            for status in ["online", "offline", "protected"] {
                let mut config = input(status);
                config.public = true;
                let service = db.create_service(&config).unwrap();
                let target =
                    db.service_check_targets().unwrap().into_iter().find(|t| t.id == service.id).unwrap();
                let mut check = result(status, 1000);
                if status == "protected" {
                    check.error_kind = Some("cloudflare_challenge");
                }
                assert!(db.save_service_check(&target, &check).unwrap());
            }
            db.backup_into(backup.to_str().unwrap()).unwrap();
        }
        for restoring in [false, true] {
            let db = Db::open(path.to_str().unwrap()).unwrap();
            if restoring {
                db.restore_from(backup.to_str().unwrap()).unwrap();
            }
            let views = serde_json::to_value(db.service_views(false, 1000).unwrap()).unwrap();
            assert_eq!(views[0]["status"], "online");
            assert_eq!(views[1]["status"], "offline");
            assert_eq!(views[2]["status"], "protected");
            assert!(views[1]["responseMs"].is_null() && views[2]["responseMs"].is_null());
            assert_eq!(
                db.conn().query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0)).unwrap(),
                crate::db::SCHEMA_VERSION
            );
        }
        std::fs::remove_file(path).unwrap();
        std::fs::remove_file(backup).unwrap();
    }

    #[test]
    fn protected_checks_preserve_schema_old_states_and_expiry() {
        let db = Db::open(":memory:").unwrap();
        let mut config = input("challenge");
        config.public = true;
        db.create_service(&config).unwrap();
        let target = db.service_check_targets().unwrap().remove(0);
        assert!(db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "protected",
                    response_ms: Some(999),
                    checked_at: 1000,
                    http_status: Some(403),
                    error_kind: Some("cloudflare_challenge"),
                }
            )
            .unwrap());
        let stored: (String, Option<i64>, String) = db
            .conn()
            .query_row("SELECT status,response_ms,error_kind FROM service_status", [], |r| {
                Ok((r.get(0)?, r.get(1)?, r.get(2)?))
            })
            .unwrap();
        assert_eq!(stored, ("offline".into(), None, "cloudflare_challenge".into()));
        assert_eq!(
            db.conn().query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0)).unwrap(),
            crate::db::SCHEMA_VERSION
        );
        let view = |now| serde_json::to_value(db.service_views(false, now).unwrap()).unwrap();
        for now in [1000, 1180] {
            assert_eq!(view(now)[0]["status"], "protected");
            assert!(view(now)[0]["responseMs"].is_null());
            assert!(view(now)[0].get("errorKind").is_none());
        }
        for now in [999, 1181] {
            assert_eq!(view(now)[0]["status"], "unknown");
        }
        for status in ["offline", "online"] {
            assert!(db.save_service_check(&target, &result(status, 1200)).unwrap());
            assert_eq!(view(1200)[0]["status"], status);
        }
        config.check_enabled = false;
        db.update_service(target.id, &config).unwrap();
        assert_eq!(view(1200)[0]["status"], "unchecked");
        assert!(!db.save_service_check(&target, &result("protected", 1201)).unwrap());
    }

    #[test]
    fn service_views_return_fresh_results_and_expire_without_inventing_latency() {
        let db = Db::open(":memory:").unwrap();
        let mut config = input("public");
        config.public = true;
        let service = db.create_service(&config).unwrap();
        let view = |now| serde_json::to_value(db.service_views(false, now).unwrap()).unwrap();
        assert_eq!(view(1000)[0]["status"], "unknown");
        let target = db.service_check_targets().unwrap().remove(0);
        assert!(db.save_service_check(&target, &result("online", 1000)).unwrap());
        let fresh = view(1180);
        assert_eq!(fresh[0]["status"], "online");
        assert_eq!(fresh[0]["responseMs"], 37);
        assert!(fresh[0].get("httpStatus").is_none());
        assert_eq!(fresh[0]["checkedAt"], "1970-01-01T00:16:40Z");
        assert!(fresh[0].get("errorKind").is_none());
        let stale = view(1181);
        assert_eq!(stale[0]["status"], "unknown");
        assert!(stale[0]["responseMs"].is_null());
        assert_eq!(view(999)[0]["status"], "unknown", "future timestamps cannot be fresh");
        assert!(db.save_service_check(&target, &result("offline", 1200)).unwrap());
        assert_eq!(view(1200)[0]["status"], "offline");
        assert!(view(1200)[0]["responseMs"].is_null());
        db.create_service(&input("private")).unwrap();
        let mut disabled = config;
        disabled.enabled = false;
        let disabled_id = db.create_service(&disabled).unwrap().id;
        db.conn().execute("INSERT INTO service_status(service_id,status,response_ms,checked_at,http_status) VALUES(?1,'online',9,1200,200)", [disabled_id]).unwrap();
        assert_eq!(db.service_views(true, 1200).unwrap().len(), 3);
        assert_eq!(
            serde_json::to_value(db.service_views(true, 1200).unwrap()).unwrap()[2]["status"],
            "unknown"
        );
        assert_eq!(db.service_views(false, 1200).unwrap().len(), 1);
        assert_eq!(db.service_check_targets().unwrap().len(), 2);
        let mut unchecked = input("unchecked");
        unchecked.public = true;
        unchecked.check_enabled = false;
        db.update_service(service.id, &unchecked).unwrap();
        assert_eq!(view(1200)[0]["status"], "unchecked");
        assert!(view(1200)[0]["checkedAt"].is_null());
        assert_eq!(db.service_check_targets().unwrap().len(), 1);
        assert!(!db.save_service_check(&target, &result("online", 1201)).unwrap());
    }

    #[test]
    fn saving_a_check_requires_every_current_target_condition() {
        let db = Db::open(":memory:").unwrap();
        let service = db.create_service(&input("a")).unwrap();
        let target = db.service_check_targets().unwrap().remove(0);
        for (changed, restored) in [
            ("enabled=0", "enabled=1"),
            ("check_enabled=0", "check_enabled=1"),
            ("url='https://other.example/'", "url='https://example.com'"),
        ] {
            db.conn().execute(&format!("UPDATE service SET {changed} WHERE id=?1"), [service.id]).unwrap();
            assert!(!db.save_service_check(&target, &result("online", 1000)).unwrap(), "{changed}");
            db.conn().execute(&format!("UPDATE service SET {restored} WHERE id=?1"), [service.id]).unwrap();
        }
        assert!(db.save_service_check(&target, &result("online", 1000)).unwrap());
    }

    #[test]
    fn editing_url_aba_or_deleting_rejects_inflight_results_but_reorder_keeps_them() {
        let db = Db::open(":memory:").unwrap();
        let mut config = input("a");
        let service = db.create_service(&config).unwrap();
        let original = db.service_check_targets().unwrap().remove(0);
        db.reorder_services(&[service.id]).unwrap();
        assert!(db.save_service_check(&original, &result("online", 1000)).unwrap());
        config.url = "https://example.org/".into();
        db.update_service(service.id, &config).unwrap();
        assert_eq!(
            serde_json::to_value(db.service_views(true, 1000).unwrap()).unwrap()[0]["status"],
            "unknown"
        );
        config.url = original.url.clone();
        db.update_service(service.id, &config).unwrap();
        assert!(!db.save_service_check(&original, &result("online", 1000)).unwrap());
        let current = db.service_check_targets().unwrap().remove(0);
        assert_ne!(original.revision, current.revision);
        assert!(db.save_service_check(&current, &result("online", 1000)).unwrap());
        db.delete_service(service.id).unwrap();
        assert_eq!(
            db.conn().query_row("SELECT COUNT(*) FROM service_status", [], |r| r.get::<_, i64>(0)).unwrap(),
            0
        );
        let replacement = db.create_service(&config).unwrap();
        assert_eq!(replacement.id, service.id, "SQLite reuses the deleted highest id");
        assert!(!db.save_service_check(&current, &result("online", 1001)).unwrap());
    }

    #[test]
    fn service_validation_trims_and_rejects_bad_values() {
        let mut s = input("  服务  ");
        s.url = " https://example.com/path ".into();
        s.category = "  影音娱乐  ".into();
        s.icon = Some("  ".into());
        s.validate().unwrap();
        assert_eq!(s.name, "服务");
        assert_eq!(s.url, "https://example.com/path");
        assert_eq!(s.category, "影音娱乐");
        assert_eq!(s.icon, None);
        assert!(!s.public);
        assert!(s.enabled);
        for name in ["", "   ", &"字".repeat(101)] {
            assert!(input(name).validate().is_err());
        }
        for url in [
            "",
            "invalid",
            "ftp://example.com",
            "javascript:alert(1)",
            "https://user:pass@example.com",
            "https://user@example.com",
            "https:///",
            "https://example.com/\npath",
        ] {
            let mut s = input("服务");
            s.url = url.into();
            assert!(s.validate().is_err(), "{url}");
        }
        let mut s = input("服务");
        s.url = format!("https://example.com/{}", "字".repeat(230));
        assert!(s.validate().is_err());
        let mut s = input("服务");
        s.description = "字".repeat(2001);
        assert!(s.validate().is_err());
        s.description.clear();
        s.category = "字".repeat(101);
        assert!(s.validate().is_err());
    }

    #[test]
    fn service_crud_visibility_and_order_preserve_nodes() {
        let db = Db::open(":memory:").unwrap();
        let node = db.create_node(&Node { name: "原节点".into(), ..Node::default() }, "node-token").unwrap();
        let before = serde_json::to_value(db.node(node).unwrap()).unwrap();
        let mut first = input("第一个");
        first.public = true;
        let a = db.create_service(&first).unwrap();
        let b = db.create_service(&input("私有")).unwrap();
        let mut disabled = input("停用");
        disabled.public = true;
        disabled.enabled = false;
        let c = db.create_service(&disabled).unwrap();
        assert_eq!(db.services(false).unwrap().iter().map(|s| s.id).collect::<Vec<_>>(), vec![a.id]);
        assert_eq!(db.services(true).unwrap().len(), 3);
        first.name = "已编辑".into();
        assert_eq!(db.update_service(a.id, &first).unwrap().unwrap().name, "已编辑");
        assert!(db.update_service(999, &first).unwrap().is_none());
        db.reorder_services(&[c.id, b.id, a.id]).unwrap();
        let ordered = db.services(true).unwrap();
        assert_eq!(ordered.iter().map(|s| s.id).collect::<Vec<_>>(), vec![c.id, b.id, a.id]);
        for ids in [vec![a.id, a.id, c.id], vec![a.id], vec![a.id, b.id, 999]] {
            assert!(db.reorder_services(&ids).is_err());
            assert_eq!(
                serde_json::to_value(db.services(true).unwrap()).unwrap(),
                serde_json::to_value(&ordered).unwrap()
            );
        }
        assert!(db.delete_service(b.id).unwrap());
        assert!(!db.delete_service(b.id).unwrap());
        assert_eq!(serde_json::to_value(db.node(node).unwrap()).unwrap(), before);
        let view = serde_json::to_value(a.view()).unwrap();
        assert_eq!(view["status"], "unknown");
        assert!(view["responseMs"].is_null());
        assert!(view["checkedAt"].is_null());
    }
}
