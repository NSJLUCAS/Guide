//! Explicit administrator-only favicon discovery. Images are never requested or
//! stored; all results are HTTPS candidates, not claims of image availability.

use std::collections::HashSet;
use std::future::Future;
use std::net::IpAddr;
use std::time::Duration;

use axum::extract::rejection::JsonRejection;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use reqwest::{Client, Url};
use serde::{Deserialize, Serialize};

use crate::api::{answer, Admin};
use crate::service_target::{safe_addresses, target_allowed};
use crate::Shared;

const PATH: &str = "/api/services/discover-icon";
const TIMEOUT: Duration = Duration::from_secs(5);
const MAX_HTML: usize = 1024 * 1024;
const MAX_ICONS: usize = 20;
const MAX_REDIRECTS: usize = 3;
const MAX_URL: usize = 2048;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct DiscoverInput {
    url: String,
}

#[derive(Debug, Serialize)]
struct Discovery {
    icons: Vec<Icon>,
}

#[derive(Debug, Serialize)]
struct Icon {
    name: String,
    url: String,
}

#[derive(Debug, PartialEq, Eq)]
enum DiscoverError {
    Invalid,
    Denied,
    Fetch,
    TooLarge,
    Redirects,
    Timeout,
}

fn request_error(error: reqwest::Error) -> DiscoverError {
    if error.is_timeout() {
        DiscoverError::Timeout
    } else {
        DiscoverError::Fetch
    }
}

impl DiscoverError {
    fn response(self) -> Response {
        // Never expose URLs, resolver errors or reqwest's internal error chain.
        let (status, message) = match self {
            Self::Invalid => (
                StatusCode::BAD_REQUEST,
                "请填写有效的 HTTP / HTTPS 网站地址，最多 2048 个字符且不能含登录凭据",
            ),
            Self::Denied => (StatusCode::BAD_REQUEST, "该网站地址不允许用于图标发现"),
            Self::Fetch => (StatusCode::BAD_GATEWAY, "无法读取网站页面，请检查地址后重试"),
            Self::TooLarge => (StatusCode::BAD_REQUEST, "网站页面超过 1 MiB，无法发现图标"),
            Self::Redirects => (StatusCode::BAD_GATEWAY, "网站重定向超过 3 次，无法发现图标"),
            Self::Timeout => (StatusCode::GATEWAY_TIMEOUT, "图标发现超时，请重试或手动填写图标地址"),
        };
        answer(status, message)
    }
}

pub fn routes() -> Router<Shared> {
    Router::new().route(PATH, post(discover_icon))
}

async fn discover_icon(_: Admin, body: Result<Json<DiscoverInput>, JsonRejection>) -> Response {
    let client = match crate::service_check::client(TIMEOUT) {
        Ok(client) => client,
        Err(_) => return DiscoverError::Fetch.response(),
    };
    handle_with(body, &client, TIMEOUT, &validate_dns).await
}

async fn handle_with<F, Fut>(
    body: Result<Json<DiscoverInput>, JsonRejection>,
    client: &Client,
    timeout: Duration,
    dns: &F,
) -> Response
where
    F: Fn(Url) -> Fut + Sync,
    Fut: Future<Output = Result<(), DiscoverError>> + Send,
{
    let Ok(Json(input)) = body else {
        return answer(StatusCode::BAD_REQUEST, "图标发现请求格式不对");
    };
    match discover_with(&input.url, client, timeout, dns).await {
        Ok(result) => ([(header::CACHE_CONTROL, "no-store")], Json(result)).into_response(),
        Err(error) => error.response(),
    }
}

fn authority_has_userinfo(raw: &str) -> bool {
    let authority = if let Some(rest) = raw.strip_prefix("//") {
        Some(rest)
    } else {
        raw.split_once("://").map(|(_, rest)| rest)
    };
    authority.is_some_and(|rest| rest.split(['/', '?', '#']).next().unwrap_or("").contains('@'))
}

fn parse_target(raw: &str) -> Result<Url, DiscoverError> {
    let raw = raw.trim();
    if raw.is_empty()
        || raw.chars().count() > MAX_URL
        || raw.chars().any(char::is_control)
        || raw.contains('\\')
        || authority_has_userinfo(raw)
        || !raw.contains("://")
    {
        return Err(DiscoverError::Invalid);
    }
    let mut url = Url::parse(raw).map_err(|_| DiscoverError::Invalid)?;
    check_target(&url)?;
    url.set_fragment(None);
    Ok(url)
}

fn check_target(url: &Url) -> Result<(), DiscoverError> {
    if !matches!(url.scheme(), "http" | "https")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.as_str().chars().count() > MAX_URL
    {
        return Err(DiscoverError::Invalid);
    }
    if !target_allowed(url) {
        return Err(DiscoverError::Denied);
    }
    Ok(())
}

fn join_target(base: &Url, raw: &str) -> Result<Url, DiscoverError> {
    let raw = raw.trim();
    if raw.is_empty()
        || raw.chars().count() > MAX_URL
        || raw.chars().any(char::is_control)
        || raw.contains('\\')
        || authority_has_userinfo(raw)
    {
        return Err(DiscoverError::Invalid);
    }
    let mut url = base.join(raw).map_err(|_| DiscoverError::Invalid)?;
    check_target(&url)?;
    url.set_fragment(None);
    Ok(url)
}

async fn validate_dns(url: Url) -> Result<(), DiscoverError> {
    let host = url.host_str().ok_or(DiscoverError::Invalid)?.trim_matches(['[', ']']);
    let port = url.port_or_known_default().ok_or(DiscoverError::Invalid)?;
    let addresses = if let Ok(ip) = host.parse::<IpAddr>() {
        vec![std::net::SocketAddr::new(ip, port)]
    } else {
        tokio::net::lookup_host((host, port)).await.map_err(|_| DiscoverError::Fetch)?.collect()
    };
    // Use the same complete-answer policy as the pinned connection resolver.
    safe_addresses(addresses).map(|_| ()).map_err(|_| DiscoverError::Denied)
}

async fn discover_with<F, Fut>(
    raw: &str,
    client: &Client,
    timeout: Duration,
    dns: &F,
) -> Result<Discovery, DiscoverError>
where
    F: Fn(Url) -> Fut + Sync,
    Fut: Future<Output = Result<(), DiscoverError>> + Send,
{
    // One timer wraps initial DNS, all redirect hops, the streamed body and all
    // candidate DNS checks. No redirect or candidate receives a fresh deadline.
    tokio::time::timeout(timeout, async {
        let mut page = parse_target(raw)?;
        let mut redirects = 0;
        let html = loop {
            check_target(&page)?;
            dns(page.clone()).await?;
            // The shared production client is no_proxy / redirect(none) and its
            // resolver filters the actual addresses used for this connection.
            let mut response = client.get(page.clone()).send().await.map_err(request_error)?;
            if response.status().is_redirection() {
                if redirects >= MAX_REDIRECTS {
                    return Err(DiscoverError::Redirects);
                }
                let location = response
                    .headers()
                    .get(header::LOCATION)
                    .and_then(|value| value.to_str().ok())
                    .ok_or(DiscoverError::Fetch)?;
                page = join_target(&page, location)?;
                redirects += 1;
                continue;
            }
            if !response.status().is_success() {
                return Err(DiscoverError::Fetch);
            }
            if response.headers().get(header::CONTENT_TYPE).is_some_and(|value| {
                value.to_str().ok().is_none_or(|value| {
                    let mime = value.split(';').next().unwrap_or("").trim();
                    !mime.eq_ignore_ascii_case("text/html")
                        && !mime.eq_ignore_ascii_case("application/xhtml+xml")
                })
            }) {
                return Err(DiscoverError::Fetch);
            }
            if response.content_length().is_some_and(|length| length > MAX_HTML as u64) {
                return Err(DiscoverError::TooLarge);
            }
            let mut body = Vec::new();
            while let Some(chunk) = response.chunk().await.map_err(request_error)? {
                if chunk.len() > MAX_HTML - body.len() {
                    return Err(DiscoverError::TooLarge);
                }
                body.extend_from_slice(&chunk);
            }
            break String::from_utf8_lossy(&body).into_owned();
        };
        let mut icons = Vec::new();
        for icon in declared_candidates(&page, &html) {
            let url = parse_target(&icon.url)?;
            if dns(url).await.is_ok() {
                icons.push(icon);
            }
        }
        if icons.is_empty() {
            let mut fallback = page.clone();
            fallback.set_scheme("https").map_err(|_| DiscoverError::Invalid)?;
            fallback.set_path("/favicon.ico");
            fallback.set_query(None);
            fallback.set_fragment(None);
            if check_target(&fallback).is_ok() && dns(fallback.clone()).await.is_ok() {
                icons.push(Icon { name: "Favicon".into(), url: fallback.to_string() });
            }
        }
        Ok(Discovery { icons })
    })
    .await
    .map_err(|_| DiscoverError::Timeout)?
}

/// Bounded tokenizer for link elements. Raw-text elements and comments are
/// skipped as units so example strings never become icon declarations. `base`
/// is deliberately ignored; relative paths resolve against the final page URL.
fn declared_candidates(page: &Url, html: &str) -> Vec<Icon> {
    let bytes = html.as_bytes();
    let lower = html.to_ascii_lowercase();
    let mut cursor = 0;
    let mut icons = Vec::new();
    let mut seen = HashSet::new();
    while cursor < bytes.len() && icons.len() < MAX_ICONS {
        let Some(offset) = html[cursor..].find('<') else { break };
        cursor += offset;
        if html[cursor..].starts_with("<!--") {
            let Some(end) = html[cursor + 4..].find("-->") else { break };
            cursor += end + 7;
            continue;
        }
        let start = cursor + 1;
        let closing = bytes.get(start) == Some(&b'/');
        let name_start = start + usize::from(closing);
        let mut name_end = name_start;
        if !bytes.get(name_start).is_some_and(u8::is_ascii_alphabetic) {
            cursor += 1;
            continue;
        }
        while bytes.get(name_end).is_some_and(|b| !b.is_ascii_whitespace() && !matches!(b, b'>' | b'/')) {
            name_end += 1;
        }
        if name_start == name_end {
            cursor += 1;
            continue;
        }
        let mut end = name_end;
        let mut quote = None;
        while end < bytes.len() {
            let byte = bytes[end];
            if let Some(expected) = quote {
                if byte == expected {
                    quote = None;
                }
            } else if matches!(byte, b'\'' | b'"') {
                quote = Some(byte);
            } else if byte == b'>' {
                break;
            }
            end += 1;
        }
        if end == bytes.len() {
            break;
        }
        let tag = &lower[name_start..name_end];
        cursor = end + 1;
        if closing {
            continue;
        }
        if matches!(
            tag,
            "script"
                | "style"
                | "textarea"
                | "title"
                | "xmp"
                | "iframe"
                | "noembed"
                | "noframes"
                | "noscript"
        ) {
            let needle = format!("</{tag}");
            let mut search = cursor;
            let mut found = None;
            while let Some(offset) = lower[search..].find(&needle) {
                let position = search + offset;
                let boundary = position + needle.len();
                if bytes.get(boundary).is_some_and(|b| b.is_ascii_whitespace() || matches!(b, b'>' | b'/')) {
                    found = Some(position);
                    break;
                }
                search = boundary;
            }
            let Some(position) = found else { break };
            cursor = position;
            continue;
        }
        if tag == "plaintext" {
            break;
        }
        if tag != "link" {
            continue;
        }
        let attributes = attributes(&html[name_end..end]);
        let Some(rel) = attributes.iter().find(|(key, _)| key == "rel").map(|(_, value)| value) else {
            continue;
        };
        let apple = rel.split_ascii_whitespace().any(|token| {
            token.eq_ignore_ascii_case("apple-touch-icon")
                || token.eq_ignore_ascii_case("apple-touch-icon-precomposed")
        });
        if !apple && !rel.split_ascii_whitespace().any(|token| token.eq_ignore_ascii_case("icon")) {
            continue;
        }
        let Some(href) = attributes.iter().find(|(key, _)| key == "href").map(|(_, value)| value) else {
            continue;
        };
        let Ok(url) = join_target(page, href) else { continue };
        if url.scheme() != "https" || !seen.insert(url.to_string()) {
            continue;
        }
        icons.push(Icon {
            name: if apple { "Apple Touch Icon" } else { "Favicon" }.into(),
            url: url.to_string(),
        });
    }
    icons
}

fn attributes(raw: &str) -> Vec<(String, String)> {
    let bytes = raw.as_bytes();
    let mut cursor = 0;
    let mut result = Vec::new();
    while cursor < bytes.len() {
        while bytes.get(cursor).is_some_and(|b| b.is_ascii_whitespace() || *b == b'/') {
            cursor += 1;
        }
        let start = cursor;
        while bytes
            .get(cursor)
            .is_some_and(|b| !b.is_ascii_whitespace() && !matches!(b, b'=' | b'/' | b'>' | b'\'' | b'"'))
        {
            cursor += 1;
        }
        if cursor == start {
            cursor += 1;
            continue;
        }
        let key = raw[start..cursor].to_ascii_lowercase();
        while bytes.get(cursor).is_some_and(u8::is_ascii_whitespace) {
            cursor += 1;
        }
        let mut value = String::new();
        if bytes.get(cursor) == Some(&b'=') {
            cursor += 1;
            while bytes.get(cursor).is_some_and(u8::is_ascii_whitespace) {
                cursor += 1;
            }
            let quote = bytes.get(cursor).copied().filter(|b| matches!(b, b'\'' | b'"'));
            if quote.is_some() {
                cursor += 1;
            }
            let start = cursor;
            while let Some(&byte) = bytes.get(cursor) {
                if quote.map_or_else(|| byte.is_ascii_whitespace() || byte == b'>', |quote| byte == quote) {
                    break;
                }
                cursor += 1;
            }
            value = decode_entities(&raw[start..cursor]);
            if quote.is_some() && cursor < bytes.len() {
                cursor += 1;
            }
        }
        // HTML uses the first instance of an attribute; a duplicate must not
        // turn an inert href or rel into a different declaration.
        if matches!(key.as_str(), "rel" | "href") && !result.iter().any(|(existing, _)| existing == &key) {
            result.push((key, value));
        }
    }
    result
}

fn decode_entities(raw: &str) -> String {
    let mut output = String::with_capacity(raw.len());
    let mut cursor = 0;
    while let Some(offset) = raw[cursor..].find('&') {
        let start = cursor + offset;
        output.push_str(&raw[cursor..start]);
        let tail = &raw[start + 1..];
        // Entity names are short. Never repeatedly scan an unbounded tail.
        let end = tail.bytes().take(32).position(|b| b == b';');
        let decoded = end.and_then(|end| {
            let entity = &tail[..end];
            match entity {
                "amp" | "AMP" => Some('&'),
                "quot" | "QUOT" => Some('"'),
                "apos" => Some('\''),
                "lt" | "LT" => Some('<'),
                "gt" | "GT" => Some('>'),
                "nbsp" => Some('\u{a0}'),
                _ => {
                    let number =
                        if let Some(hex) = entity.strip_prefix("#x").or_else(|| entity.strip_prefix("#X")) {
                            u32::from_str_radix(hex, 16).ok()
                        } else {
                            entity.strip_prefix('#').and_then(|decimal| decimal.parse::<u32>().ok())
                        };
                    number.and_then(char::from_u32)
                }
            }
        });
        if let Some(character) = decoded {
            output.push(character);
            cursor = start + end.unwrap() + 2;
        } else {
            output.push('&');
            cursor = start + 1;
        }
    }
    output.push_str(&raw[cursor..]);
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::{sha256, COOKIE};
    use crate::db::Db;
    use crate::App;
    use reqwest::dns::{Name, Resolve, Resolving};
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    // DNS fixtures undergo the production address policy before this test-only
    // transport maps their permitted LAN address onto the controlled listener.
    struct FixtureResolver;
    impl Resolve for FixtureResolver {
        fn resolve(&self, name: Name) -> Resolving {
            let host = name.as_str().to_owned();
            Box::pin(async move {
                safe_addresses(fixture_addresses(&host))?.for_each(drop);
                Ok(Box::new(vec!["127.0.0.1:0".parse().unwrap()].into_iter()) as reqwest::dns::Addrs)
            })
        }
    }

    fn fixture_addresses(host: &str) -> Vec<std::net::SocketAddr> {
        match host {
            "icon-page.test" | "icon-cdn.test" => vec!["192.168.1.2:0".parse().unwrap()],
            "icon-denied.test" => vec!["169.254.169.254:0".parse().unwrap()],
            "icon-mixed.test" => vec!["192.168.1.2:0".parse().unwrap(), "100.100.100.200:0".parse().unwrap()],
            _ => vec![],
        }
    }

    async fn fixture_dns(url: Url) -> Result<(), DiscoverError> {
        safe_addresses(fixture_addresses(url.host_str().unwrap_or("")))
            .map(|_| ())
            .map_err(|_| DiscoverError::Denied)
    }

    struct Server {
        url: String,
        requests: Arc<AtomicUsize>,
        task: tokio::task::JoinHandle<()>,
    }

    impl Drop for Server {
        fn drop(&mut self) {
            self.task.abort();
        }
    }

    impl Server {
        async fn new() -> Self {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let url = format!("http://icon-page.test:{}", listener.local_addr().unwrap().port());
            let requests = Arc::new(AtomicUsize::new(0));
            let count = requests.clone();
            let task = tokio::spawn(async move {
                let mut connections = tokio::task::JoinSet::new();
                loop {
                    tokio::select! {
                        incoming = listener.accept() => {
                            let Ok((mut stream, _)) = incoming else { break };
                            let count = count.clone();
                            connections.spawn(async move {
                                let mut buffer = [0u8; 4096];
                                let Ok(length) = stream.read(&mut buffer).await else { return };
                                let request = String::from_utf8_lossy(&buffer[..length]);
                                let path = request.split_whitespace().nth(1).unwrap_or("/");
                                count.fetch_add(1, Ordering::SeqCst);
                                let response = match path {
                                    "/icons" => {
                                        let body = "<link rel=icon href=https://icon-cdn.test/icon.png><p>hello</p>";
                                        format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{body}", body.len())
                                    }
                                    "/deny" => "HTTP/1.1 302 Found\r\nLocation: http://169.254.169.254/\r\nContent-Length: 0\r\n\r\n".to_owned(),
                                    "/dns-deny" => "HTTP/1.1 302 Found\r\nLocation: http://icon-denied.test/\r\nContent-Length: 0\r\n\r\n".to_owned(),
                                    "/redirect" => "HTTP/1.1 302 Found\r\nLocation: /final\r\nContent-Length: 0\r\n\r\n".to_owned(),
                                    "/loop" => "HTTP/1.1 302 Found\r\nLocation: /loop\r\nContent-Length: 0\r\n\r\n".to_owned(),
                                    "/slow-redirect" => {
                                        tokio::time::sleep(Duration::from_millis(70)).await;
                                        "HTTP/1.1 302 Found\r\nLocation: /slow-redirect\r\nContent-Length: 0\r\n\r\n".to_owned()
                                    }
                                    "/image" => "HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nContent-Length: 99999999\r\n\r\n".to_owned(),
                                    "/large-length" => format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n", MAX_HTML + 1),
                                    "/chunked" => format!("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n{:x}\r\n{}\r\n0\r\n\r\n", MAX_HTML + 1, "x".repeat(MAX_HTML + 1)),
                                    "/slow-body" => {
                                        let _ = stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 1\r\n\r\n").await;
                                        tokio::time::sleep(Duration::from_secs(2)).await;
                                        "x".to_owned()
                                    }
                                    "/bad-icons" => {
                                        let body = "<link rel=icon href=https://icon-denied.test/x><link rel=icon href=https://icon-mixed.test/x><link rel=icon href=https://169.254.169.254/x>";
                                        format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{body}", body.len())
                                    }
                                    _ => "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n".to_owned(),
                                };
                                let _ = stream.write_all(response.as_bytes()).await;
                            });
                        }
                        _ = connections.join_next(), if !connections.is_empty() => {}
                    }
                }
            });
            Self { url, requests, task }
        }

        fn client(&self) -> Client {
            Client::builder()
                .no_proxy()
                .redirect(reqwest::redirect::Policy::none())
                .timeout(Duration::from_secs(3))
                .dns_resolver(Arc::new(FixtureResolver))
                .build()
                .unwrap()
        }
    }

    #[test]
    fn supported_rel_tokens_entities_and_paths_ignore_fake_links() {
        let page = Url::parse("https://icon-page.test/section/page").unwrap();
        let html = r#"<!-- <link rel=icon href=/comment> -->
          <script>const fake = '<link rel=icon href=/script>';</script>
          <STYLE><link rel=icon href=/style></STYLE>
          <textarea><link rel=icon href=/textarea></textarea>
          <LINK HREF='../favicon.ico?x=1&amp;y=2' REL='SHORTCUT ICON'>
          <link href=//icon-cdn.test/apple.png rel=apple-touch-icon>
          <link rel=ICON href="/i&#99;on&#x2e;png?name=&quot;x&quot;">
          <link rel=stylesheet href=/not-an-icon>
          <link-custom rel=icon href=/not-a-link>
          <link rel=icon href=../favicon.ico?x=1&amp;y=2>"#;
        let icons = declared_candidates(&page, html);
        assert_eq!(
            icons.iter().map(|i| i.url.as_str()).collect::<Vec<_>>(),
            vec![
                "https://icon-page.test/favicon.ico?x=1&y=2",
                "https://icon-cdn.test/apple.png",
                "https://icon-page.test/icon.png?name=%22x%22",
            ]
        );
    }

    #[test]
    fn invalid_and_static_denied_targets_never_pass_url_validation() {
        for raw in [
            "",
            "file:///etc/passwd",
            "https://u:p@icon-page.test",
            "https://@icon-page.test",
            "https://localhost/",
            "https://127.0.0.1/",
            "https://169.254.169.254/",
            "https://100.100.100.200/",
            "https://[fd00:ec2::254]/",
            "https://icon-page.test/\nsecret",
            "https:\\@icon-page.test/",
        ] {
            assert!(parse_target(raw).is_err(), "{raw}");
        }
        assert!(parse_target(&format!("https://icon-page.test/{}", "x".repeat(2048))).is_err());
        assert_eq!(parse_target("  https://icon-page.test  ").unwrap().as_str(), "https://icon-page.test/");
        let page = Url::parse("https://icon-page.test/").unwrap();
        assert!(declared_candidates(&page, "<link rel=icon href=https://169.254.169.254/x><link rel=icon href=https://@icon-cdn.test/x><link rel=icon href=data:image/png,x>").is_empty());
    }

    #[test]
    fn candidate_count_and_https_only_are_bounded() {
        let page = Url::parse("http://icon-page.test/").unwrap();
        let html =
            (0..100).map(|i| format!("<link rel=icon href=https://icon-cdn.test/{i}>")).collect::<String>();
        assert_eq!(declared_candidates(&page, &html).len(), MAX_ICONS);
        assert!(declared_candidates(&page, "<link rel=icon href=/plain-http.png>").is_empty());
    }

    #[tokio::test]
    async fn page_discovery_does_not_download_images_and_empty_page_has_origin_fallback() {
        let server = Server::new().await;
        let client = server.client();
        let result =
            discover_with(&format!("{}/icons", server.url), &client, TIMEOUT, &fixture_dns).await.unwrap();
        assert_eq!(result.icons[0].url, "https://icon-cdn.test/icon.png");
        assert_eq!(server.requests.load(Ordering::SeqCst), 1);
        let result =
            discover_with(&format!("{}/redirect", server.url), &client, TIMEOUT, &fixture_dns).await.unwrap();
        assert_eq!(result.icons[0].url, format!("{}/favicon.ico", server.url.replacen("http:", "https:", 1)));
        assert_eq!(server.requests.load(Ordering::SeqCst), 3);
    }

    #[tokio::test]
    async fn forbidden_dns_candidates_are_filtered_and_redirects_are_checked_and_limited() {
        let server = Server::new().await;
        let client = server.client();
        let result = discover_with(&format!("{}/bad-icons", server.url), &client, TIMEOUT, &fixture_dns)
            .await
            .unwrap();
        assert_eq!(result.icons.len(), 1);
        assert!(result.icons[0].url.ends_with("/favicon.ico"));
        for host in ["icon-denied.test", "icon-mixed.test"] {
            assert_eq!(
                discover_with(&format!("http://{host}/"), &client, TIMEOUT, &fixture_dns).await.unwrap_err(),
                DiscoverError::Denied
            );
        }
        let before = server.requests.load(Ordering::SeqCst);
        for path in ["/deny", "/dns-deny"] {
            assert_eq!(
                discover_with(&format!("{}{path}", server.url), &client, TIMEOUT, &fixture_dns)
                    .await
                    .unwrap_err(),
                DiscoverError::Denied
            );
        }
        assert_eq!(server.requests.load(Ordering::SeqCst), before + 2);
        assert_eq!(
            discover_with(&format!("{}/loop", server.url), &client, TIMEOUT, &fixture_dns).await.unwrap_err(),
            DiscoverError::Redirects
        );
        assert_eq!(
            server.requests.load(Ordering::SeqCst),
            before + 6,
            "three followed redirects, no fifth GET"
        );
    }

    #[tokio::test]
    async fn content_length_and_chunked_bodies_have_the_same_limit() {
        let server = Server::new().await;
        for path in ["/large-length", "/chunked"] {
            assert_eq!(
                discover_with(&format!("{}{path}", server.url), &server.client(), TIMEOUT, &fixture_dns)
                    .await
                    .unwrap_err(),
                DiscoverError::TooLarge
            );
        }
    }

    #[tokio::test]
    async fn one_deadline_covers_body_and_candidate_dns() {
        let server = Server::new().await;
        let client = server.client();
        assert_eq!(
            discover_with(
                &format!("{}/slow-body", server.url),
                &client,
                Duration::from_millis(80),
                &fixture_dns
            )
            .await
            .unwrap_err(),
            DiscoverError::Timeout
        );
        assert_eq!(
            discover_with(
                &format!("{}/slow-redirect", server.url),
                &client,
                Duration::from_millis(100),
                &fixture_dns
            )
            .await
            .unwrap_err(),
            DiscoverError::Timeout
        );
        let slow_dns = |url: Url| async move {
            if url.scheme() == "https" {
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
            fixture_dns(url).await
        };
        assert_eq!(
            discover_with(&format!("{}/icons", server.url), &client, Duration::from_millis(80), &slow_dns)
                .await
                .unwrap_err(),
            DiscoverError::Timeout
        );
        let initial_dns = |url: Url| async move {
            tokio::time::sleep(Duration::from_secs(2)).await;
            fixture_dns(url).await
        };
        assert_eq!(
            discover_with(&server.url, &client, Duration::from_millis(80), &initial_dns).await.unwrap_err(),
            DiscoverError::Timeout
        );
    }

    #[tokio::test]
    async fn no_safe_https_candidate_returns_empty_instead_of_unsafe_address() {
        let server = Server::new().await;
        let dns = |url: Url| async move {
            if url.scheme() == "https" {
                Err(DiscoverError::Denied)
            } else {
                fixture_dns(url).await
            }
        };
        let result = discover_with(&server.url, &server.client(), TIMEOUT, &dns).await.unwrap();
        assert!(result.icons.is_empty());
    }

    #[tokio::test]
    async fn non_html_response_is_rejected_before_reading_body() {
        let server = Server::new().await;
        assert_eq!(
            discover_with(&format!("{}/image", server.url), &server.client(), TIMEOUT, &fixture_dns)
                .await
                .unwrap_err(),
            DiscoverError::Fetch
        );
    }

    #[tokio::test]
    async fn production_route_requires_admin_before_any_outbound_request() {
        let app = Arc::new(App::for_test(Db::open(":memory:").unwrap()));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let router = routes().with_state(app);
        let task = tokio::spawn(async move {
            axum::serve(listener, router).await.unwrap();
        });
        let response = Client::builder()
            .no_proxy()
            .build()
            .unwrap()
            .post(format!("{base}/api/services/discover-icon"))
            .json(&serde_json::json!({"url":"http://169.254.169.254/"}))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        task.abort();
    }

    #[tokio::test]
    async fn authenticated_route_returns_candidates_without_mutating_database() {
        let fixture = Server::new().await;
        let app = Arc::new(App::for_test(Db::open(":memory:").unwrap()));
        app.db.create_session(&sha256("icon-admin"), chrono::Utc::now().timestamp() + 3600).unwrap();
        app.db.set("icon-test-marker", "preserved").unwrap();
        let input: crate::service::ServiceInput = serde_json::from_value(
            serde_json::json!({"name":"saved", "url":"https://icon-page.test", "icon":"old", "public":true}),
        )
        .unwrap();
        app.db.create_service(&input).unwrap();
        let before = db_snapshot(&app);
        let client = fixture.client();
        // The exact registered route uses the real Admin extractor and response
        // function; only outbound networking and DNS are replaced by fixtures.
        let router = Router::<Shared>::new()
            .route(
                PATH,
                post(move |_: Admin, body: Result<Json<DiscoverInput>, JsonRejection>| {
                    let client = client.clone();
                    async move { handle_with(body, &client, TIMEOUT, &fixture_dns).await }
                }),
            )
            .with_state(app.clone());
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let task = tokio::spawn(async move {
            axum::serve(listener, router).await.unwrap();
        });
        let incoming = Client::builder().no_proxy().build().unwrap();
        let request = || {
            incoming
                .post(format!("{base}{PATH}"))
                .json(&serde_json::json!({"url":format!("{}/icons", fixture.url)}))
        };
        assert_eq!(request().send().await.unwrap().status(), StatusCode::UNAUTHORIZED);
        assert_eq!(fixture.requests.load(Ordering::SeqCst), 0);
        let response = request().header(header::COOKIE, format!("{COOKIE}=icon-admin")).send().await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
        let json: serde_json::Value = response.json().await.unwrap();
        assert_eq!(json["icons"][0]["url"], "https://icon-cdn.test/icon.png");
        assert_eq!(json.as_object().unwrap().len(), 1);
        assert_eq!(db_snapshot(&app), before);
        task.abort();
    }

    fn db_snapshot(app: &Shared) -> Vec<u8> {
        let conn = app.db.conn();
        let mut tables =
            conn.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").unwrap();
        let names = tables
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .collect::<rusqlite::Result<Vec<_>>>()
            .unwrap();
        let mut output = String::new();
        for name in names {
            output.push_str(&name);
            let mut stmt =
                conn.prepare(&format!("SELECT * FROM \"{}\" ORDER BY 1", name.replace('"', "\"\""))).unwrap();
            let columns = stmt.column_count();
            let mut rows = stmt.query([]).unwrap();
            while let Some(row) = rows.next().unwrap() {
                for column in 0..columns {
                    output.push_str(&format!("{:?};", row.get_ref(column).unwrap()));
                }
            }
        }
        output.into_bytes()
    }
}
