//! Puts Guide's locally built navigation theme where `rust-embed` finds it.
//!
//! Build ../navigation-theme first. Missing local assets fail the build rather
//! than downloading or falling back to the upstream probe theme.

use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../navigation-theme/dist");
    println!("cargo:rerun-if-changed=../navigation-theme/theme.json");
    println!("cargo:rerun-if-changed=target/theme/theme.json");
    println!("cargo:rerun-if-changed=scripts/theme.sh");

    match Command::new("sh").arg("scripts/theme.sh").status() {
        Ok(status) if status.success() => {}
        Ok(status) => panic!("scripts/theme.sh failed ({status}); see the message above"),
        Err(e) => panic!("could not run scripts/theme.sh: {e}"),
    }
}
