//! CLI version queries must never open a database or start the HTTP server.
use std::process::Command;

#[test]
fn version_exits_successfully_without_opening_the_requested_database() {
    let output = Command::new(env!("CARGO_BIN_EXE_guide-hub"))
        .args(["--version", "--db", "/nonexistent-guide-version-test/data.db"])
        .output()
        .expect("run guide-hub");
    assert!(output.status.success());
    assert_eq!(
        String::from_utf8(output.stdout).unwrap(),
        format!("guide-hub {}\n", env!("CARGO_PKG_VERSION"))
    );
    assert!(output.stderr.is_empty());
}

#[test]
fn help_first_line_remains_compatible_with_the_legacy_updater_fallback() {
    let output = Command::new(env!("CARGO_BIN_EXE_guide-hub")).arg("--help").output().expect("run guide-hub");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert_eq!(stdout.lines().next(), Some(format!("guide-hub {}", env!("CARGO_PKG_VERSION")).as_str()));
}
