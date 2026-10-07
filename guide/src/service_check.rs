//! Bounded Hub-side website checks. No response bodies or visitor-side probes.

use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use chrono::Utc;
use reqwest::dns::{Name, Resolve, Resolving};
use reqwest::{Client, Url};
use tokio::sync::watch;
use tokio::task::JoinSet;
use tokio::time::{Instant, MissedTickBehavior};

use crate::db::Db;
use crate::service::{CheckResult, CheckTarget};
use crate::service_target::{safe_addresses, target_allowed};
use crate::Shared;

pub const INTERVAL: Duration = Duration::from_secs(60);
pub const TIMEOUT: Duration = Duration::from_secs(5);
pub const CONCURRENCY: usize = 4;

struct CheckResolver;

impl Resolve for CheckResolver {
    fn resolve(&self, name: Name) -> Resolving {
        let host = name.as_str().to_owned();
        Box::pin(async move {
            let addresses = tokio::net::lookup_host((host.as_str(), 0)).await?.collect();
            Ok(safe_addresses(addresses)?)
        })
    }
}

pub(crate) fn client(timeout: Duration) -> Result<Client> {
    Ok(Client::builder()
        .timeout(timeout)
        .redirect(reqwest::redirect::Policy::none())
        .no_proxy()
        .dns_resolver(Arc::new(CheckResolver))
        .user_agent("navigation-service-check/1")
        .build()?)
}

async fn probe(client: &Client, target: &CheckTarget) -> CheckResult {
    let mut result = CheckResult {
        status: "offline",
        response_ms: None,
        checked_at: 0,
        http_status: None,
        error_kind: None,
    };
    let authority =
        target.url.split_once("://").map(|(_, rest)| rest.split(['/', '?', '#']).next().unwrap_or(""));
    let parsed = Url::parse(&target.url).ok().filter(target_allowed);
    if parsed.is_none() || authority.is_none_or(|value| value.is_empty() || value.contains('@')) {
        result.error_kind = Some("invalid_or_denied_url");
    } else {
        // send() resolves on response headers. Do not read text/bytes/stream.
        let start = Instant::now();
        match client.get(parsed.unwrap()).send().await {
            Ok(response) => {
                let code = response.status();
                result.http_status = Some(code.as_u16());
                if code.is_success() || code.is_redirection() {
                    result.status = "online";
                    result.response_ms = Some(start.elapsed().as_millis().min(i64::MAX as u128) as i64);
                } else {
                    result.error_kind = Some("http_status");
                }
                drop(response);
            }
            Err(error) => {
                result.error_kind = Some(if error.is_timeout() {
                    "timeout"
                } else if error.is_connect() {
                    "connect"
                } else {
                    "request"
                });
            }
        }
    }
    result.checked_at = Utc::now().timestamp();
    result
}

/// One batch holds no SQLite guard across an await, and at most four futures.
/// Returns true when stopped. Configuration snapshots are validated on write.
async fn cycle(db: &Db, client: &Client, stop: &mut watch::Receiver<bool>) -> bool {
    if *stop.borrow() || stop.has_changed().is_err() {
        return true;
    }
    let targets = match db.service_check_targets() {
        Ok(targets) => targets,
        Err(_) => {
            tracing::warn!("could not read service check configuration");
            return false;
        }
    };
    let mut pending = targets.into_iter();
    let mut requests = JoinSet::new();
    loop {
        if *stop.borrow() || stop.has_changed().is_err() {
            requests.shutdown().await;
            return true;
        }
        while requests.len() < CONCURRENCY {
            let Some(target) = pending.next() else { break };
            let client = client.clone();
            requests.spawn(async move {
                let result = probe(&client, &target).await;
                (target, result)
            });
        }
        if requests.is_empty() {
            return false;
        }
        tokio::select! {
            biased;
            changed = stop.changed() => {
                if changed.is_err() || *stop.borrow() {
                    requests.shutdown().await;
                    return true;
                }
            }
            completed = requests.join_next() => {
                if let Some(Ok((target, result))) = completed {
                    if !*stop.borrow() && db.save_service_check(&target, &result).is_err() {
                        // Never log request URLs, headers or internal network errors.
                        tracing::warn!("could not save a service check result");
                    }
                }
            }
        }
    }
}

pub async fn run(app: Shared, stop: watch::Receiver<bool>) -> Result<()> {
    run_loop(app, stop, client(TIMEOUT)?).await
}

async fn run_loop(app: Shared, mut stop: watch::Receiver<bool>, client: Client) -> Result<()> {
    let mut timer = tokio::time::interval(INTERVAL);
    timer.set_missed_tick_behavior(MissedTickBehavior::Skip);
    loop {
        if *stop.borrow() || stop.has_changed().is_err() {
            break;
        }
        tokio::select! {
            biased;
            changed = stop.changed() => {
                if changed.is_err() || *stop.borrow() { break; }
            }
            _ = timer.tick() => {
                if cycle(&app.db, &client, &mut stop).await { break; }
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::service::ServiceInput;
    use crate::service_target::allowed_ip;
    use crate::App;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    struct Server {
        url: String,
        started: Arc<AtomicUsize>,
        peak: Arc<AtomicUsize>,
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
            let url = format!("http://service-check.test:{}", listener.local_addr().unwrap().port());
            let started = Arc::new(AtomicUsize::new(0));
            let active = Arc::new(AtomicUsize::new(0));
            let peak = Arc::new(AtomicUsize::new(0));
            let count = started.clone();
            let maximum = peak.clone();
            let task = tokio::spawn(async move {
                let mut connections = JoinSet::new();
                loop {
                    tokio::select! {
                        incoming = listener.accept() => {
                            let Ok((mut stream, _)) = incoming else { break };
                            let count = count.clone();
                            let active = active.clone();
                            let maximum = maximum.clone();
                            connections.spawn(async move {
                                let mut buffer = [0u8; 2048];
                                let Ok(length) = stream.read(&mut buffer).await else { return };
                                let text = String::from_utf8_lossy(&buffer[..length]);
                                assert!(text.starts_with("GET "));
                                let path = text.split_whitespace().nth(1).unwrap_or("/").to_owned();
                                count.fetch_add(1, Ordering::SeqCst);
                                let running = active.fetch_add(1, Ordering::SeqCst) + 1;
                                maximum.fetch_max(running, Ordering::SeqCst);
                                tokio::time::sleep(if path == "/slow" {
                                    Duration::from_secs(10)
                                } else { Duration::from_millis(30) }).await;
                                active.fetch_sub(1, Ordering::SeqCst);
                                let head = match path.as_str() {
                                    "/redirect" => "HTTP/1.1 302 Found\r\nLocation: http://169.254.169.254/\r\nContent-Length: 0\r\n\r\n",
                                    "/fail" => "HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\n\r\n",
                                    "/headers" => "HTTP/1.1 200 OK\r\nContent-Length: 99999999\r\n\r\n",
                                    _ => "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n",
                                };
                                let _ = stream.write_all(head.as_bytes()).await;
                                if path == "/headers" { tokio::time::sleep(Duration::from_secs(10)).await; }
                            });
                        }
                        _ = connections.join_next(), if !connections.is_empty() => {}
                    }
                }
            });
            Self { url, started, peak, task }
        }

        async fn wait_started(&self) {
            tokio::time::timeout(Duration::from_secs(2), async {
                while self.started.load(Ordering::SeqCst) == 0 {
                    tokio::time::sleep(Duration::from_millis(1)).await;
                }
            })
            .await
            .unwrap();
        }

        fn target(&self, path: &str) -> CheckTarget {
            CheckTarget { id: 1, url: format!("{}{path}", self.url), revision: "test".into() }
        }
    }

    fn input(url: &str, checking: bool) -> ServiceInput {
        let mut value: ServiceInput = serde_json::from_value(serde_json::json!({
            "name": "test", "url": url, "public": true, "enabled": true, "checkEnabled": checking
        }))
        .unwrap();
        value.validate().unwrap();
        value
    }

    fn app() -> Shared {
        Arc::new(App::for_test(Db::open(":memory:").unwrap()))
    }

    // Only test clients map a reserved test name to a local controlled server.
    // Production client construction always uses CheckResolver and the full policy.
    fn test_client(timeout: Duration) -> Client {
        Client::builder()
            .timeout(timeout)
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .resolve("service-check.test", "127.0.0.1:0".parse().unwrap())
            .build()
            .unwrap()
    }

    #[tokio::test]
    async fn service_check_200_302_500_and_headers_only_latency() {
        let server = Server::new().await;
        let client = test_client(Duration::from_secs(1));
        for (path, status, code) in
            [("/ok", "online", 200), ("/redirect", "online", 302), ("/fail", "offline", 500)]
        {
            let result = probe(&client, &server.target(path)).await;
            assert_eq!(result.status, status);
            assert_eq!(result.http_status, Some(code));
            assert_eq!(result.response_ms.is_some(), status == "online");
            assert!(result.checked_at > 0);
        }
        let result =
            tokio::time::timeout(Duration::from_millis(800), probe(&client, &server.target("/headers")))
                .await
                .unwrap();
        assert_eq!(result.status, "online");
        assert!(result.response_ms.unwrap() >= 20);
        assert_eq!(server.started.load(Ordering::SeqCst), 4, "redirect was not followed");
    }

    #[tokio::test]
    async fn service_check_timeout_and_refused_connection_have_no_fake_latency() {
        let server = Server::new().await;
        let client = test_client(Duration::from_millis(80));
        let result = probe(&client, &server.target("/slow")).await;
        assert_eq!(result.status, "offline");
        assert_eq!(result.error_kind, Some("timeout"));
        assert!(result.response_ms.is_none() && result.http_status.is_none());
        let socket = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://service-check.test:{}", socket.local_addr().unwrap().port());
        drop(socket);
        let result = probe(&client, &CheckTarget { id: 1, url, revision: "test".into() }).await;
        assert_eq!(result.status, "offline");
        assert!(result.response_ms.is_none());
    }

    #[test]
    fn service_check_address_policy_blocks_metadata_and_dns_rebinding() {
        for ip in [
            "169.254.169.254",
            "100.100.100.200",
            "0.0.0.0",
            "224.0.0.1",
            "255.255.255.255",
            "::",
            "fe80::1",
            "ff02::1",
            "::ffff:169.254.169.254",
            "::ffff:100.100.100.200",
            "fd00:ec2::254",
        ] {
            assert!(!allowed_ip(ip.parse().unwrap()), "{ip}");
        }
        assert!(!allowed_ip("127.0.0.1".parse().unwrap()));
        assert!(!allowed_ip("::1".parse().unwrap()));
        assert!(!allowed_ip("::ffff:127.0.0.1".parse().unwrap()));
        assert!(allowed_ip("192.168.1.2".parse().unwrap()));
        assert!(allowed_ip("fd00::1".parse().unwrap()));
        assert!(safe_addresses(vec!["127.0.0.1:0".parse().unwrap(), "169.254.169.254:0".parse().unwrap()])
            .is_err());
        assert!(safe_addresses(vec!["[fd00:ec2::254]:0".parse().unwrap()]).is_err());
        assert!(!target_allowed(&Url::parse("http://[fd00:ec2::254]/").unwrap()));
        assert!(safe_addresses(vec!["100.100.100.200:0".parse().unwrap()]).is_err());
        assert!(!target_allowed(&Url::parse("http://100.100.100.200/").unwrap()));
        assert!(!target_allowed(&Url::parse("https://user:pass@localhost").unwrap()));
    }

    #[tokio::test]
    async fn service_check_denied_targets_never_start_requests_even_when_save_is_bypassed() {
        let server = Server::new().await;
        let port = Url::parse(&server.url).unwrap().port().unwrap();
        // A local proxy is a trap: even if a guard regresses, metadata cannot be contacted.
        let trap = Client::builder()
            .timeout(TIMEOUT)
            .no_proxy()
            .proxy(reqwest::Proxy::all(format!("http://127.0.0.1:{port}")).unwrap())
            .build()
            .unwrap();
        for url in [
            "http://100.100.100.200/latest/meta-data/",
            "http://169.254.169.254/",
            "http://[fd00:ec2::254]/",
            "http://127.0.0.1/",
            "http://[::1]/",
            "http://localhost/",
        ] {
            let target = CheckTarget { id: 1, url: url.into(), revision: "bypassed-save".into() };
            let result = probe(&trap, &target).await;
            assert_eq!(result.status, "offline");
            assert_eq!(result.error_kind, Some("invalid_or_denied_url"));
            assert!(result.response_ms.is_none() && result.http_status.is_none());
        }
        assert_eq!(server.started.load(Ordering::SeqCst), 0, "denial must happen before send()");
    }

    #[tokio::test]
    async fn service_check_cycle_limits_concurrency_and_skips_disabled_checks() {
        let server = Server::new().await;
        let app = app();
        for _ in 0..10 {
            app.db.create_service(&input(&format!("{}/ok", server.url), true)).unwrap();
        }
        app.db.create_service(&input(&format!("{}/slow", server.url), false)).unwrap();
        let (_stop, mut receiver) = watch::channel(false);
        assert!(!cycle(&app.db, &test_client(TIMEOUT), &mut receiver).await);
        assert_eq!(server.started.load(Ordering::SeqCst), 10);
        assert_eq!(server.peak.load(Ordering::SeqCst), CONCURRENCY);
        let values =
            serde_json::to_value(app.db.service_views(true, Utc::now().timestamp()).unwrap()).unwrap();
        assert_eq!(values[10]["status"], "unchecked");
    }

    #[tokio::test]
    async fn service_check_inflight_edit_or_delete_does_not_write_old_results() {
        for deleting in [false, true] {
            let server = Server::new().await;
            let app = app();
            let service = app.db.create_service(&input(&format!("{}/headers", server.url), true)).unwrap();
            let (_stop, mut receiver) = watch::channel(false);
            let worker_app = app.clone();
            let task =
                tokio::spawn(
                    async move { cycle(&worker_app.db, &test_client(TIMEOUT), &mut receiver).await },
                );
            server.wait_started().await;
            if deleting {
                app.db.delete_service(service.id).unwrap();
            } else {
                app.db.update_service(service.id, &input(&format!("{}/ok", server.url), true)).unwrap();
            }
            task.await.unwrap();
            let values =
                serde_json::to_value(app.db.service_views(true, Utc::now().timestamp()).unwrap()).unwrap();
            if deleting {
                assert_eq!(values.as_array().unwrap().len(), 0);
            } else {
                assert_eq!(values[0]["status"], "unknown");
            }
        }
    }

    #[tokio::test]
    async fn service_check_shutdown_cancels_and_joins_inflight_work() {
        let server = Server::new().await;
        let app = app();
        app.db.create_service(&input(&format!("{}/slow", server.url), true)).unwrap();
        let (stop, receiver) = watch::channel(false);
        let task = tokio::spawn(run_loop(app.clone(), receiver, test_client(TIMEOUT)));
        server.wait_started().await;
        stop.send(true).unwrap();
        tokio::time::timeout(Duration::from_millis(800), task).await.unwrap().unwrap().unwrap();
        let values =
            serde_json::to_value(app.db.service_views(true, Utc::now().timestamp()).unwrap()).unwrap();
        assert_eq!(values[0]["status"], "unknown");
    }
}
