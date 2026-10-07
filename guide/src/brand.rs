//! Guide identity and compatibility boundaries; never migrate database contents.

/// Normalize only known old defaults; preserve explicit custom names without writing settings.
pub fn site_name(saved: Option<String>) -> String {
    match saved {
        None => "Guide".into(),
        Some(name)
            if name.trim().is_empty()
                || name.trim().eq_ignore_ascii_case("Monitor")
                || name.trim().eq_ignore_ascii_case("Monitor Hub") =>
        {
            "Guide".into()
        }
        Some(name) => name,
    }
}

/// Fresh installs use Guide's filename. Existing files are never renamed or copied.
/// If both names exist, require --db rather than silently selecting a different dataset.
pub fn default_database(directory: &std::path::Path) -> anyhow::Result<String> {
    let current = directory.join("guide.db").exists();
    let legacy = directory.join("monitor.db").exists();
    anyhow::ensure!(
        !(current && legacy),
        "multiple database files found; explicitly select the existing database with --db"
    );
    Ok(if legacy { "monitor.db" } else { "guide.db" }.into())
}

/// Legacy logging directives still refer to the renamed crate target.
pub fn log_directives(raw: &str) -> String {
    raw.replace("monitor_hub", "guide_hub")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn guide_brand_names_preserve_custom_site_names() {
        assert_eq!(site_name(None), "Guide");
        for value in ["", "  ", "Monitor", "monitor", " Monitor Hub "] {
            assert_eq!(site_name(Some(value.to_owned())), "Guide");
        }
        assert_eq!(site_name(Some("我的导航".into())), "我的导航");
        assert_eq!(site_name(Some("My Monitor service".into())), "My Monitor service");
    }

    #[test]
    fn guide_brand_database_default_never_moves_or_overwrites_legacy_data() {
        let dir = std::env::temp_dir().join(format!("guide-brand-{}", rand::random::<u64>()));
        std::fs::create_dir(&dir).unwrap();
        assert_eq!(default_database(&dir).unwrap(), "guide.db");
        std::fs::write(dir.join("monitor.db"), b"legacy fixture bytes").unwrap();
        assert_eq!(default_database(&dir).unwrap(), "monitor.db");
        assert_eq!(std::fs::read(dir.join("monitor.db")).unwrap(), b"legacy fixture bytes");
        assert!(!dir.join("guide.db").exists());
        std::fs::write(dir.join("guide.db"), b"new fixture bytes").unwrap();
        assert!(default_database(&dir).is_err());
        assert_eq!(std::fs::read(dir.join("guide.db")).unwrap(), b"new fixture bytes");
        std::fs::remove_file(dir.join("monitor.db")).unwrap();
        assert_eq!(default_database(&dir).unwrap(), "guide.db");
        std::fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn guide_brand_legacy_log_targets_follow_the_new_crate() {
        assert_eq!(log_directives("monitor_hub=debug,tower_http=warn"), "guide_hub=debug,tower_http=warn");
        assert_eq!(log_directives("guide_hub=trace"), "guide_hub=trace");
    }

    #[tokio::test]
    async fn guide_brand_api_normalizes_old_defaults_without_a_settings_write() {
        let app = std::sync::Arc::new(crate::App::for_test(crate::db::Db::open(":memory:").unwrap()));
        app.db.set("site_name", "Monitor").unwrap();
        let axum::Json(me) =
            crate::api::me(axum::extract::State(app.clone()), axum::http::HeaderMap::new()).await;
        assert_eq!(me["site_name"], "Guide");
        let axum::Json(settings) =
            crate::api::settings(crate::api::Admin, axum::extract::State(app.clone())).await;
        assert_eq!(settings["site_name"], "Guide");
        assert_eq!(app.db.get("site_name").as_deref(), Some("Monitor"));
        app.db.set("site_name", "我的导航").unwrap();
        let axum::Json(settings) = crate::api::settings(crate::api::Admin, axum::extract::State(app)).await;
        assert_eq!(settings["site_name"], "我的导航");
    }
}
