//! Stored icon-library sources. Validation never fetches a library URL.

use std::collections::HashSet;

use serde::Deserialize;

pub const INITIAL: &str = r#"{"activeId":"","libraries":[]}"#;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Libraries {
    active_id: String,
    libraries: Vec<Library>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Library {
    id: String,
    name: String,
    url: String,
}

/// Validate the complete JSON text before the settings handler writes any key.
pub fn validate(value: &str) -> Result<(), String> {
    if value.len() > 60 * 1024 {
        return Err("图标库配置不能超过 60 KiB".into());
    }
    let config: Libraries = serde_json::from_str(value)
        .map_err(|_| "图标库配置格式不对，必须包含 activeId 和 libraries，且不能有额外字段".to_owned())?;
    if config.libraries.len() > 20 {
        return Err("图标库来源最多 20 个".into());
    }
    let mut ids = HashSet::new();
    for library in &config.libraries {
        if library.id.is_empty()
            || library.id.len() > 64
            || !library.id.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-')
        {
            return Err("图标库 id 必须是 1 到 64 位的英文字母、数字、下划线或短横线".into());
        }
        if !ids.insert(library.id.as_str()) {
            return Err("图标库 id 不能重复".into());
        }
        let name = library.name.trim();
        if name.is_empty() || name.chars().count() > 100 {
            return Err("图标库名称不能为空，且最多 100 个字符".into());
        }
        let text = library.url.trim();
        if text.chars().count() > 2048 {
            return Err("图标库 URL 最多 2048 个字符".into());
        }
        let url = reqwest::Url::parse(text).map_err(|_| "图标库 URL 必须是有效的 HTTPS 地址".to_owned())?;
        // URL parsing can discard an empty userinfo prefix (https://@host).
        // Inspect the original authority as well so even that form is refused.
        let authority = text
            .split_once("://")
            .map(|(_, rest)| rest.split(['/', '?', '#']).next().unwrap_or_default())
            .unwrap_or_default();
        if url.scheme() != "https"
            || url.host_str().is_none()
            || authority.is_empty()
            || authority.contains('@')
            || !url.username().is_empty()
            || url.password().is_some()
        {
            return Err("图标库 URL 必须使用 HTTPS，且不能包含登录凭据".into());
        }
    }
    if config.libraries.is_empty() {
        if !config.active_id.is_empty() {
            return Err("没有图标库来源时 activeId 必须为空字符串".into());
        }
    } else if !ids.contains(config.active_id.as_str()) {
        return Err("activeId 必须指向现有图标库来源".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    fn config(id: &str, name: &str, url: &str) -> Value {
        json!({"activeId": id, "libraries": [{"id": id, "name": name, "url": url}]})
    }

    fn accepted(value: Value) {
        assert_eq!(validate(&value.to_string()), Ok(()), "{value}");
    }

    fn refused(value: Value) {
        assert!(validate(&value.to_string()).is_err(), "accepted {value}");
    }

    #[test]
    fn the_initial_empty_list_and_custom_libraries_are_valid() {
        assert_eq!(validate(INITIAL), Ok(()));
        accepted(json!({"activeId": "", "libraries": []}));
        accepted(config("custom_1-X", " 自定义 ", " https://example.com/icons.json "));
    }

    #[test]
    fn the_shape_is_strict_and_selection_must_exist() {
        for value in [
            json!(null),
            json!([]),
            json!({}),
            json!({"activeId": 1, "libraries": []}),
            json!({"activeId": "", "libraries": null}),
            json!({"activeId": "missing", "libraries": []}),
            json!({"activeId": "", "libraries": [], "other": true}),
            json!({"activeId": "a", "libraries": [{"id":"a", "name":"A", "url":"https://example.com", "other":true}]}),
            json!({"activeId": "a", "libraries": [{"id":"a", "name":"A"}]}),
        ] {
            refused(value);
        }
        let mut value = config("a", "A", "https://example.com");
        value["activeId"] = json!("missing");
        refused(value);
        assert!(validate("not json").is_err());
        assert!(validate(r#"{"activeId":"","activeId":"","libraries":[]}"#).is_err());
    }

    #[test]
    fn ids_are_unique_ascii_and_names_have_unicode_limits() {
        for id in ["", "含中文", "a b", " a", "a."] {
            refused(config(id, "A", "https://example.com"));
        }
        accepted(config(&"a".repeat(64), &"图".repeat(100), "https://example.com"));
        refused(config(&"a".repeat(65), "A", "https://example.com"));
        refused(config("a", &"图".repeat(101), "https://example.com"));
        refused(config("a", " \n\t ", "https://example.com"));
        let mut value = config("a", "A", "https://example.com");
        let duplicate = value["libraries"][0].clone();
        value["libraries"].as_array_mut().unwrap().push(duplicate);
        refused(value);
    }

    #[test]
    fn urls_require_https_and_refuse_even_empty_credentials() {
        for url in [
            "http://example.com/icons.json",
            "//example.com",
            "not-a-url",
            "https://",
            "https://user:pass@example.com",
            "https://user@example.com",
            "https://@example.com",
            "https://:pass@example.com",
            "https://example.com\\@evil.example.com/icons.json",
        ] {
            refused(config("a", "A", url));
        }
        accepted(config("a", "A", "https://example.com/icons.json?email=a@b#fragment"));
        accepted(config("a", "A", &("https://example.com/".to_owned() + &"a".repeat(2028))));
        refused(config("a", "A", &("https://example.com/".to_owned() + &"a".repeat(2029))));
    }

    #[test]
    fn source_count_and_json_byte_limits_are_bounded() {
        let libraries: Vec<_> = (0..20)
            .map(|n| {
                json!({
                    "id": format!("lib-{n}"), "name": "图标", "url": "https://example.com/icons.json"
                })
            })
            .collect();
        let mut value = json!({"activeId": "lib-0", "libraries": libraries});
        accepted(value.clone());
        value["libraries"].as_array_mut().unwrap().push(json!({
            "id":"lib-20", "name":"图标", "url":"https://example.com/icons.json"
        }));
        refused(value);
        let empty = r#"{"activeId":"","libraries":[]}"#;
        let at_limit = format!("{}{}", empty, " ".repeat(60 * 1024 - empty.len()));
        assert_eq!(validate(&at_limit), Ok(()));
        assert!(validate(&(at_limit + " ")).is_err());
    }
}
