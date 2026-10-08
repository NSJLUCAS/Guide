//! Navigation routes on the existing Hub, using its session and Admin extractor.

use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, put};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::api::{answer, fail, Admin};
use crate::auth::authed;
use crate::category::CategoryInput;
use crate::service::ServiceInput;
use crate::Shared;

pub fn routes() -> Router<Shared> {
    Router::new()
        .route("/api/services", get(list).post(create))
        .route("/api/services/order", put(reorder))
        .route("/api/services/{id}", put(update).delete(delete))
        .route("/api/categories", get(categories).post(create_category))
        .route("/api/categories/order", put(reorder_categories))
        .route("/api/categories/{id}", put(rename_category).delete(delete_category))
}

async fn categories(State(app): State<Shared>, headers: HeaderMap) -> Response {
    let full = authed(&app, &headers);
    if !full && !app.public_page() {
        return answer(StatusCode::UNAUTHORIZED, "需要登录后查看");
    }
    match app.db.categories(full) {
        Ok(rows) => ([(header::CACHE_CONTROL, "no-store")], Json(rows)).into_response(),
        Err(e) => fail(e),
    }
}

fn category_input(body: Result<Json<CategoryInput>, JsonRejection>) -> Result<String, Response> {
    let Ok(Json(input)) = body else {
        return Err(answer(StatusCode::BAD_REQUEST, "分类数据格式不对"));
    };
    crate::category::category_name(&input.name).map_err(fail)
}

async fn create_category(
    _: Admin,
    State(app): State<Shared>,
    body: Result<Json<CategoryInput>, JsonRejection>,
) -> Response {
    let name = match category_input(body) {
        Ok(name) => name,
        Err(response) => return response,
    };
    match app.db.create_category(&name) {
        Ok(()) => (StatusCode::CREATED, Json(json!({"ok": true}))).into_response(),
        Err(e) => fail(e),
    }
}

async fn rename_category(
    _: Admin,
    State(app): State<Shared>,
    Path(id): Path<i64>,
    body: Result<Json<CategoryInput>, JsonRejection>,
) -> Response {
    let name = match category_input(body) {
        Ok(name) => name,
        Err(response) => return response,
    };
    match app.db.rename_category(id, &name) {
        Ok(true) => StatusCode::NO_CONTENT.into_response(),
        Ok(false) => answer(StatusCode::NOT_FOUND, "分类已被删除，请刷新"),
        Err(e) => fail(e),
    }
}

async fn delete_category(_: Admin, State(app): State<Shared>, Path(id): Path<i64>) -> Response {
    match app.db.delete_category(id) {
        Ok(true) => StatusCode::NO_CONTENT.into_response(),
        Ok(false) => answer(StatusCode::NOT_FOUND, "分类已被删除，请刷新"),
        Err(e) => fail(e),
    }
}

async fn reorder_categories(
    _: Admin,
    State(app): State<Shared>,
    body: Result<Json<Order>, JsonRejection>,
) -> Response {
    let Ok(Json(order)) = body else {
        return answer(StatusCode::BAD_REQUEST, "分类排序数据格式不对");
    };
    match app.db.reorder_categories(&order.ids) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => fail(e),
    }
}

async fn list(State(app): State<Shared>, headers: HeaderMap) -> Response {
    let full = authed(&app, &headers);
    if !full && !app.public_page() {
        return answer(StatusCode::UNAUTHORIZED, "需要登录后查看");
    }
    match app.db.service_views(full, chrono::Utc::now().timestamp()) {
        Ok(services) => ([(header::CACHE_CONTROL, "no-store")], Json(services)).into_response(),
        Err(e) => fail(e),
    }
}

fn input(body: Result<Json<ServiceInput>, JsonRejection>) -> Result<ServiceInput, Response> {
    let Ok(Json(mut service)) = body else {
        return Err(answer(StatusCode::BAD_REQUEST, "网站数据格式不对"));
    };
    service.validate().map_err(fail)?;
    Ok(service)
}

async fn create(
    _: Admin,
    State(app): State<Shared>,
    body: Result<Json<ServiceInput>, JsonRejection>,
) -> Response {
    let service = match input(body) {
        Ok(service) => service,
        Err(response) => return response,
    };
    match app.db.create_service(&service) {
        Ok(service) => (StatusCode::CREATED, Json(service.view())).into_response(),
        Err(e) => fail(e),
    }
}

async fn update(
    _: Admin,
    State(app): State<Shared>,
    Path(id): Path<i64>,
    body: Result<Json<ServiceInput>, JsonRejection>,
) -> Response {
    let service = match input(body) {
        Ok(service) => service,
        Err(response) => return response,
    };
    match app.db.update_service(id, &service) {
        Ok(Some(service)) => Json(service.view()).into_response(),
        Ok(None) => answer(StatusCode::NOT_FOUND, "网站不存在，可能已被删除"),
        Err(e) => fail(e),
    }
}

async fn delete(_: Admin, State(app): State<Shared>, Path(id): Path<i64>) -> Response {
    match app.db.delete_service(id) {
        Ok(true) => Json(json!({"ok": true})).into_response(),
        Ok(false) => answer(StatusCode::NOT_FOUND, "网站不存在，可能已被删除"),
        Err(e) => fail(e),
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Order {
    ids: Vec<i64>,
}

async fn reorder(_: Admin, State(app): State<Shared>, body: Result<Json<Order>, JsonRejection>) -> Response {
    let Ok(Json(order)) = body else {
        return answer(StatusCode::BAD_REQUEST, "排序数据格式不对");
    };
    match app.db.reorder_services(&order.ids) {
        Ok(()) => Json(json!({"ok": true})).into_response(),
        Err(e) => fail(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::{sha256, COOKIE};
    use crate::db::{Db, Node};
    use crate::App;
    use serde_json::Value;
    use std::sync::Arc;

    struct Server {
        app: Shared,
        base: String,
        client: reqwest::Client,
        task: tokio::task::JoinHandle<()>,
    }

    impl Drop for Server {
        fn drop(&mut self) {
            self.task.abort();
        }
    }

    impl Server {
        async fn new() -> Self {
            let app = Arc::new(App::for_test(Db::open(":memory:").unwrap()));
            app.db
                .create_session(&sha256("service-test-admin"), chrono::Utc::now().timestamp() + 3600)
                .unwrap();
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let base = format!("http://{}", listener.local_addr().unwrap());
            let router = routes()
                .layer(tower_http::limit::RequestBodyLimitLayer::new(64 * 1024))
                .layer(axum::middleware::map_response(crate::api::plain_errors))
                .with_state(app.clone());
            let task = tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
            let client =
                reqwest::Client::builder().timeout(std::time::Duration::from_secs(5)).build().unwrap();
            Self { app, base, client, task }
        }

        fn request(&self, method: reqwest::Method, path: &str, admin: bool) -> reqwest::RequestBuilder {
            let request = self.client.request(method, format!("{}{path}", self.base));
            if admin {
                request.header("Cookie", format!("{COOKIE}=service-test-admin"))
            } else {
                request
            }
        }

        async fn add(&self, name: &str, public: bool, enabled: bool) -> Value {
            let response = self.request(reqwest::Method::POST, "/api/services", true)
                .json(&json!({"name": name, "url": "https://example.com", "public": public, "enabled": enabled}))
                .send().await.unwrap();
            assert_eq!(response.status(), StatusCode::CREATED);
            response.json().await.unwrap()
        }
    }

    #[tokio::test]
    async fn service_category_names_reject_controls_without_mutating_data() {
        let server = Server::new().await;
        let existing = server.add("existing", true, true).await;
        let before = database_snapshot(&server.app.db);
        for category in ["ops\ninternal", "ops\tinternal", "ops\u{007f}internal", "ops\u{0085}internal"] {
            for (method, path) in [
                (reqwest::Method::POST, "/api/services".to_owned()),
                (reqwest::Method::PUT, format!("/api/services/{}", existing["id"])),
            ] {
                let response = server
                    .request(method, &path, true)
                    .json(&json!({"name":"changed","url":"https://example.com","category":category}))
                    .send()
                    .await
                    .unwrap();
                assert_eq!(response.status(), StatusCode::BAD_REQUEST, "{category:?}");
                assert_eq!(database_snapshot(&server.app.db), before);
            }
        }
        for category in ["", "  ", " 新分类 "] {
            let response = server
                .request(reqwest::Method::POST, "/api/services", true)
                .json(&json!({"name":"legacy client","url":"https://example.com","category":category}))
                .send()
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::CREATED);
            assert_eq!(response.json::<Value>().await.unwrap()["category"], category.trim());
        }
        assert_eq!(server.app.db.categories(true).unwrap()[0].name, "新分类");
    }

    #[tokio::test]
    async fn category_http_auth_validation_and_stale_order_are_enforced() {
        let server = Server::new().await;
        for (method, path, body) in [
            (reqwest::Method::POST, "/api/categories", json!({"name":"empty"})),
            (reqwest::Method::PUT, "/api/categories/1", json!({"name":"new"})),
            (reqwest::Method::DELETE, "/api/categories/1", json!({})),
            (reqwest::Method::PUT, "/api/categories/order", json!({"ids":[]})),
        ] {
            assert_eq!(
                server.request(method, path, false).json(&body).send().await.unwrap().status(),
                StatusCode::UNAUTHORIZED
            );
        }
        for name in ["", "   ", "bad\nname", &"长".repeat(101)] {
            assert_eq!(
                server
                    .request(reqwest::Method::POST, "/api/categories", true)
                    .json(&json!({"name":name}))
                    .send()
                    .await
                    .unwrap()
                    .status(),
                StatusCode::BAD_REQUEST
            );
        }
        assert_eq!(
            server
                .request(reqwest::Method::POST, "/api/categories", true)
                .json(&json!({"name":" 空分类 "}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::CREATED
        );
        assert_eq!(
            server
                .request(reqwest::Method::POST, "/api/categories", true)
                .json(&json!({"name":"空分类"}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            server
                .request(reqwest::Method::POST, "/api/categories", true)
                .json(&json!({"name":"x","unknown":true}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::BAD_REQUEST
        );
        for method in [reqwest::Method::PUT, reqwest::Method::DELETE] {
            assert_eq!(
                server
                    .request(method, "/api/categories/999", true)
                    .json(&json!({"name":"missing"}))
                    .send()
                    .await
                    .unwrap()
                    .status(),
                StatusCode::NOT_FOUND
            );
        }
        for ids in [json!([]), json!([1, 1]), json!([999])] {
            assert_eq!(
                server
                    .request(reqwest::Method::PUT, "/api/categories/order", true)
                    .json(&json!({"ids":ids}))
                    .send()
                    .await
                    .unwrap()
                    .status(),
                StatusCode::BAD_REQUEST
            );
        }
        assert_eq!(server.app.db.categories(true).unwrap().len(), 1);
        server.app.db.set("public_page", "off").unwrap();
        assert_eq!(
            server.request(reqwest::Method::GET, "/api/categories", false).send().await.unwrap().status(),
            StatusCode::UNAUTHORIZED
        );
    }

    #[tokio::test]
    async fn category_http_empty_order_rename_migration_and_occupied_delete() {
        use crate::service::CheckResult;
        let server = Server::new().await;
        for name in ["空分类", "影音", "工具"] {
            server.app.db.create_category(name).unwrap();
        }
        for (name, public, enabled) in
            [("visible", true, true), ("private", false, true), ("disabled", true, false)]
        {
            let response=server.request(reqwest::Method::POST,"/api/services",true).json(&json!({
                "name":name,"url":"https://example.com","category":"工具","sort":81,"public":public,"enabled":enabled
            })).send().await.unwrap();
            assert_eq!(response.status(), StatusCode::CREATED);
        }
        let target = server.app.db.service_check_targets().unwrap().remove(0);
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "protected",
                    response_ms: None,
                    checked_at: chrono::Utc::now().timestamp(),
                    http_status: Some(403),
                    error_kind: Some("cloudflare_challenge"),
                },
            )
            .unwrap();
        let ids: Vec<i64> = server.app.db.categories(true).unwrap().iter().map(|c| c.id).collect();
        assert_eq!(
            server
                .request(reqwest::Method::PUT, "/api/categories/order", true)
                .json(&json!({"ids":[ids[2],ids[0],ids[1]]}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::NO_CONTENT
        );
        for admin in [false, true] {
            let response =
                server.request(reqwest::Method::GET, "/api/categories", admin).send().await.unwrap();
            assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
            let rows: Vec<Value> = response.json().await.unwrap();
            assert_eq!(
                rows.iter().map(|c| c["name"].as_str().unwrap()).collect::<Vec<_>>(),
                vec!["工具", "空分类", "影音"]
            );
            assert_eq!(rows[0]["count"], if admin { 3 } else { 1 });
            assert_eq!(rows[1]["count"], 0);
        }
        assert_eq!(
            server
                .request(reqwest::Method::PUT, &format!("/api/categories/{}", ids[2]), true)
                .json(&json!({"name":"新工具"}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::NO_CONTENT
        );
        assert!(server.app.db.services(true).unwrap().iter().all(|s| s.category == "新工具" && s.sort == 81));
        assert_eq!(
            serde_json::to_value(server.app.db.service_views(true, chrono::Utc::now().timestamp()).unwrap())
                .unwrap()[0]["status"],
            "protected"
        );
        let response = server
            .request(reqwest::Method::DELETE, &format!("/api/categories/{}", ids[2]), true)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert!(response.text().await.unwrap().contains("先迁移"));
        for service in server.app.db.services(true).unwrap() {
            assert_eq!(server.request(reqwest::Method::PUT,&format!("/api/services/{}",service.id),true).json(&json!({
                "name":service.name,"url":service.url,"category":"影音","sort":service.sort,"public":service.public,"enabled":service.enabled
            })).send().await.unwrap().status(),StatusCode::OK);
        }
        assert_eq!(
            server
                .request(reqwest::Method::DELETE, &format!("/api/categories/{}", ids[2]), true)
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::NO_CONTENT
        );
        assert_eq!(server.app.db.services(true).unwrap().len(), 3);
        assert_eq!(server.app.db.categories(true).unwrap()[0].name, "空分类");
    }

    #[tokio::test]
    async fn service_http_denied_create_returns_400_without_database_changes() {
        let server = Server::new().await;
        let before = database_snapshot(&server.app.db);
        for url in [
            "http://100.100.100.200/latest/meta-data/",
            "http://169.254.169.254/",
            "http://127.0.0.1/",
            "http://[::1]/",
            "http://[fd00:ec2::254]/",
        ] {
            for enabled in [true, false] {
                let response = server.request(reqwest::Method::POST, "/api/services", true)
                    .json(&json!({"name":"reject","url":url,"public":true,"enabled":enabled,"checkEnabled":true}))
                    .send().await.unwrap();
                assert_eq!(response.status(), StatusCode::BAD_REQUEST, "{url}");
                assert_eq!(database_snapshot(&server.app.db), before);
            }
        }
        let response = server.request(reqwest::Method::POST, "/api/services", true)
            .json(&json!({"name":"link only","url":"http://100.100.100.200/latest/meta-data/","checkEnabled":false}))
            .send().await.unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let created: Value = response.json().await.unwrap();
        assert_eq!(created["status"], "unchecked");
        assert!(server.app.db.service_check_targets().unwrap().is_empty());
    }

    fn database_snapshot(db: &Db) -> Vec<Vec<Vec<String>>> {
        let conn = db.conn();
        ["service", "service_status", "category", "node"]
            .into_iter()
            .map(|table| {
                let mut stmt = conn.prepare(&format!("SELECT * FROM {table} ORDER BY 1")).unwrap();
                let width = stmt.column_count();
                let rows = stmt
                    .query_map([], |row| {
                        (0..width)
                            .map(|i| {
                                row.get::<_, rusqlite::types::Value>(i).map(|value| format!("{value:?}"))
                            })
                            .collect::<rusqlite::Result<Vec<_>>>()
                    })
                    .unwrap();
                let values = rows.collect::<rusqlite::Result<Vec<_>>>().unwrap();
                values
            })
            .collect()
    }

    #[tokio::test]
    async fn service_http_denied_update_and_enable_preserve_config_revision_sort_and_status() {
        use crate::service::CheckResult;
        let server = Server::new().await;
        let service = server.add("safe", true, true).await;
        let target = server.app.db.service_check_targets().unwrap().remove(0);
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "online",
                    response_ms: Some(86),
                    checked_at: chrono::Utc::now().timestamp(),
                    http_status: Some(200),
                    error_kind: None,
                },
            )
            .unwrap();
        let before = database_snapshot(&server.app.db);
        let path = format!("/api/services/{}", service["id"]);
        let response = server.request(reqwest::Method::PUT, &path, true)
            .json(&json!({"name":"changed","url":"http://100.100.100.200/latest/meta-data/","category":"must-not-create","sort":999,"public":false,"enabled":true,"checkEnabled":true}))
            .send().await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(database_snapshot(&server.app.db), before);
        let response = server.request(reqwest::Method::PUT, &path, true)
            .json(&json!({"name":"link only","url":"http://100.100.100.200/latest/meta-data/","sort":7,"checkEnabled":false}))
            .send().await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let before_enable = database_snapshot(&server.app.db);
        let response = server.request(reqwest::Method::PUT, &path, true)
            .json(&json!({"name":"changed","url":"http://100.100.100.200/latest/meta-data/","sort":999,"check_enabled":true}))
            .send().await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(database_snapshot(&server.app.db), before_enable);
    }

    #[tokio::test]
    async fn service_http_exposes_real_status_and_check_switch_without_diagnostics() {
        use crate::service::CheckResult;
        let server = Server::new().await;
        let a = server.add("public", true, true).await;
        server.add("private", false, true).await;
        server.add("disabled", true, false).await;
        let target = server.app.db.service_check_targets().unwrap().remove(0);
        let now = chrono::Utc::now().timestamp();
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "online",
                    response_ms: Some(41),
                    checked_at: now,
                    http_status: Some(204),
                    error_kind: Some("private-diagnostic"),
                },
            )
            .unwrap();
        let public: Vec<Value> = server
            .request(reqwest::Method::GET, "/api/services", false)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(public.len(), 1);
        assert_eq!(public[0]["status"], "online");
        assert_eq!(public[0]["responseMs"], 41);
        assert_eq!(public[0]["checkEnabled"], true);
        assert!(public[0]["checkedAt"].is_string());
        for field in
            ["httpStatus", "http_status", "errorKind", "error_kind", "checkRevision", "check_revision"]
        {
            assert!(public[0].get(field).is_none(), "{field} must stay internal");
        }
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "offline",
                    response_ms: Some(999),
                    checked_at: now,
                    http_status: Some(500),
                    error_kind: Some("http_status"),
                },
            )
            .unwrap();
        let all: Vec<Value> = server
            .request(reqwest::Method::GET, "/api/services", true)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(all.len(), 3);
        assert_eq!(all[0]["status"], "offline");
        assert!(all[0]["responseMs"].is_null());
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "protected",
                    response_ms: Some(999),
                    checked_at: now,
                    http_status: Some(403),
                    error_kind: Some("cloudflare_challenge"),
                },
            )
            .unwrap();
        for admin in [false, true] {
            let response = server.request(reqwest::Method::GET, "/api/services", admin).send().await.unwrap();
            assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
            let rows: Vec<Value> = response.json().await.unwrap();
            assert_eq!(rows[0]["status"], "protected");
            assert!(rows[0]["responseMs"].is_null());
            assert!(rows[0]["checkedAt"].is_string());
            for field in
                ["httpStatus", "http_status", "errorKind", "error_kind", "checkRevision", "check_revision"]
            {
                assert!(rows[0].get(field).is_none());
            }
        }
        server
            .app
            .db
            .save_service_check(
                &target,
                &CheckResult {
                    status: "online",
                    response_ms: Some(41),
                    checked_at: now - 181,
                    http_status: Some(200),
                    error_kind: None,
                },
            )
            .unwrap();
        let stale: Vec<Value> = server
            .request(reqwest::Method::GET, "/api/services", false)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(stale[0]["status"], "unknown");
        assert!(stale[0]["responseMs"].is_null());
        let path = format!("/api/services/{}", a["id"]);
        for field in ["checkEnabled", "check_enabled"] {
            let mut body = json!({"name":"public","url":"https://example.com","public":true});
            body[field] = json!(false);
            let updated: Value = server
                .request(reqwest::Method::PUT, &path, true)
                .json(&body)
                .send()
                .await
                .unwrap()
                .json()
                .await
                .unwrap();
            assert_eq!(updated["status"], "unchecked");
            assert_eq!(updated["checkEnabled"], false);
            assert!(updated["responseMs"].is_null() && updated["checkedAt"].is_null());
            assert!(!server
                .app
                .db
                .save_service_check(
                    &target,
                    &CheckResult {
                        status: "online",
                        response_ms: Some(1),
                        checked_at: now,
                        http_status: Some(200),
                        error_kind: None,
                    }
                )
                .unwrap());
        }
        let restored: Value = server
            .request(reqwest::Method::PUT, &path, true)
            .json(&json!({"name":"public","url":"https://example.com","public":true}))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(restored["checkEnabled"], true, "old clients default to checking");
        assert_eq!(restored["status"], "unknown");
    }

    #[tokio::test]
    async fn service_http_crud_order_and_unknown_status_preserve_nodes() {
        let server = Server::new().await;
        let id = server
            .app
            .db
            .create_node(&Node { name: "原节点".into(), ..Node::default() }, "node-token")
            .unwrap();
        let node_before = serde_json::to_value(server.app.db.node(id).unwrap()).unwrap();
        let a = server.add("  公开服务  ", true, true).await;
        let b = server.add("私有", false, true).await;
        server.add("停用", true, false).await;
        assert_eq!(a["name"], "公开服务");
        assert_eq!(a["status"], "unknown");
        assert!(a["responseMs"].is_null() && a["checkedAt"].is_null());
        let public: Vec<Value> = server
            .request(reqwest::Method::GET, "/api/services", false)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(public.len(), 1);
        assert_eq!(public[0]["id"], a["id"]);
        let cached = server.request(reqwest::Method::GET, "/api/services", true).send().await.unwrap();
        assert_eq!(cached.headers().get("cache-control").unwrap(), "no-store");
        let all: Vec<Value> = server
            .request(reqwest::Method::GET, "/api/services", true)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(all.len(), 3);
        let ids: Vec<i64> = all.iter().rev().map(|s| s["id"].as_i64().unwrap()).collect();
        let response = server
            .request(reqwest::Method::PUT, "/api/services/order", true)
            .json(&json!({"ids": ids}))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(server.app.db.services(true).unwrap().iter().map(|s| s.id).collect::<Vec<_>>(), ids);
        let path = format!("/api/services/{}", a["id"]);
        let updated = server.request(reqwest::Method::PUT, &path, true)
            .json(&json!({"name": "已编辑", "url": "http://example.com/new", "category": "工具", "public": true}))
            .send().await.unwrap();
        assert_eq!(updated.status(), StatusCode::OK);
        assert_eq!(updated.json::<Value>().await.unwrap()["name"], "已编辑");
        let deleted = format!("/api/services/{}", b["id"]);
        assert_eq!(
            server.request(reqwest::Method::DELETE, &deleted, true).send().await.unwrap().status(),
            StatusCode::OK
        );
        assert_eq!(
            server.request(reqwest::Method::DELETE, &deleted, true).send().await.unwrap().status(),
            StatusCode::NOT_FOUND
        );
        assert_eq!(serde_json::to_value(server.app.db.node(id).unwrap()).unwrap(), node_before);
    }

    #[tokio::test]
    async fn service_http_refuses_anonymous_writes_invalid_fields_and_stale_orders() {
        let server = Server::new().await;
        for (method, path) in [
            (reqwest::Method::POST, "/api/services"),
            (reqwest::Method::PUT, "/api/services/1"),
            (reqwest::Method::DELETE, "/api/services/1"),
            (reqwest::Method::PUT, "/api/services/order"),
        ] {
            assert_eq!(
                server.request(method, path, false).json(&json!({})).send().await.unwrap().status(),
                StatusCode::UNAUTHORIZED
            );
        }
        for body in [
            json!({"name": "", "url": "https://example.com"}),
            json!({"name": "有效", "url": "javascript:alert(1)"}),
            json!({"name": "有效", "url": "https://user:pass@example.com"}),
            json!({"name": "缺 URL"}),
            json!({"name": "有效", "url": "https://example.com", "public": "yes"}),
            json!({"name": "有效", "url": "https://example.com", "checkEnabled": "yes"}),
            json!({"name": "有效", "url": "https://example.com", "id": 99}),
        ] {
            assert_eq!(
                server
                    .request(reqwest::Method::POST, "/api/services", true)
                    .json(&body)
                    .send()
                    .await
                    .unwrap()
                    .status(),
                StatusCode::BAD_REQUEST
            );
        }
        assert!(server.app.db.services(true).unwrap().is_empty());
        let a = server.add("a", true, true).await;
        let b = server.add("b", false, true).await;
        for ids in [json!([a["id"], a["id"]]), json!([a["id"]]), json!([b["id"], 999])] {
            assert_eq!(
                server
                    .request(reqwest::Method::PUT, "/api/services/order", true)
                    .json(&json!({"ids": ids}))
                    .send()
                    .await
                    .unwrap()
                    .status(),
                StatusCode::BAD_REQUEST
            );
        }
        assert_eq!(
            server.app.db.services(true).unwrap().iter().map(|s| s.name.clone()).collect::<Vec<_>>(),
            vec!["a", "b"]
        );
        server.app.db.set("public_page", "off").unwrap();
        assert_eq!(
            server.request(reqwest::Method::GET, "/api/services", false).send().await.unwrap().status(),
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            server.request(reqwest::Method::GET, "/api/services", true).send().await.unwrap().status(),
            StatusCode::OK
        );
        assert_eq!(
            server
                .request(reqwest::Method::PUT, "/api/services/999", true)
                .json(&json!({"name": "有效", "url": "https://example.com"}))
                .send()
                .await
                .unwrap()
                .status(),
            StatusCode::NOT_FOUND
        );
    }
}
