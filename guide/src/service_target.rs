//! Shared Service check policy: static URL checks and resolved-address checks.
//! Private navigation services are allowed; loopback and metadata checks are not.

use std::net::{IpAddr, SocketAddr};

use reqwest::dns::Addrs;
use reqwest::Url;

pub(crate) fn allowed_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => {
            !ip.is_unspecified()
                && !ip.is_loopback()
                && !ip.is_link_local()
                && !ip.is_multicast()
                && !ip.is_broadcast()
                && ip.octets() != [100, 100, 100, 200]
        }
        IpAddr::V6(ip) => {
            !ip.is_unspecified()
                && !ip.is_loopback()
                && !ip.is_unicast_link_local()
                && !ip.is_multicast()
                && ip.segments() != [0xfd00, 0xec2, 0, 0, 0, 0, 0, 0x254]
                && ip.to_ipv4_mapped().is_none_or(|v4| allowed_ip(IpAddr::V4(v4)))
        }
    }
}

/// No DNS or network activity on save. URL parsing normalizes alternative IPv4 forms.
pub(crate) fn target_allowed(url: &Url) -> bool {
    if !matches!(url.scheme(), "http" | "https") || !url.username().is_empty() || url.password().is_some() {
        return false;
    }
    let Some(host) = url.host_str() else { return false };
    let host = host.trim_matches(['[', ']']).trim_end_matches('.').to_ascii_lowercase();
    match host.parse::<IpAddr>() {
        Ok(ip) => allowed_ip(ip),
        Err(_) => {
            !host.is_empty()
                && host != "localhost"
                && !host.ends_with(".localhost")
                && host != "localhost.localdomain"
                && host != "metadata.google.internal"
        }
    }
}

/// Reject the whole answer if any resolved address is forbidden; never pick a
/// safe-looking address from a mixed DNS answer and leave unsafe fallbacks.
pub(crate) fn safe_addresses(addresses: Vec<SocketAddr>) -> std::io::Result<Addrs> {
    if addresses.is_empty() || addresses.iter().any(|address| !allowed_ip(address.ip())) {
        return Err(std::io::Error::new(std::io::ErrorKind::PermissionDenied, "check target denied"));
    }
    Ok(Box::new(addresses.into_iter()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn service_target_dns_rejects_denied_and_mixed_answers_without_network() {
        for denied in [
            "100.100.100.200:80",
            "169.254.169.254:80",
            "127.0.0.1:80",
            "[::1]:80",
            "[fd00:ec2::254]:80",
            "[::ffff:100.100.100.200]:80",
        ] {
            let address: SocketAddr = denied.parse().unwrap();
            assert!(safe_addresses(vec![address]).is_err());
            assert!(safe_addresses(vec!["192.168.1.2:80".parse().unwrap(), address]).is_err());
            let url = Url::parse(&format!("http://{address}/")).unwrap();
            assert!(!target_allowed(&url), "static and DNS must agree for {denied}");
        }
        assert!(safe_addresses(vec![]).is_err());
        let allowed =
            safe_addresses(vec!["10.0.0.1:80".parse().unwrap(), "[fd00::1]:80".parse().unwrap()]).unwrap();
        assert_eq!(allowed.count(), 2);
        assert!(target_allowed(&Url::parse("https://safe.example.com/").unwrap()));
    }
}
