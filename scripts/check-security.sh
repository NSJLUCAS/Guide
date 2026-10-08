#!/bin/bash
# Pinned official binaries, verified before execution. Run from repository root.
set -euo pipefail
test "$(git rev-parse --is-shallow-repository)" = false
tool_dir=$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/guide-security.XXXXXX")
trap 'rm -rf -- "$tool_dir"' EXIT

download() {
  local url=$1 name=$2 expected=$3
  curl -fsSL --proto '=https' --proto-redir '=https' --retry 3 "$url" -o "$tool_dir/$name"
  printf '%s  %s\n' "$expected" "$tool_dir/$name" | sha256sum --check -
}

download https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz \
  shellcheck.tar.xz 8c3be12b05d5c177a04c29e3c78ce89ac86f1595681cab149b65b97c4e227198
tar -xJf "$tool_dir/shellcheck.tar.xz" -C "$tool_dir" shellcheck-v0.11.0/shellcheck
download https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz \
  gitleaks.tar.gz 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
tar -xzf "$tool_dir/gitleaks.tar.gz" -C "$tool_dir" gitleaks
download https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz \
  actionlint.tar.gz 8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8
tar -xzf "$tool_dir/actionlint.tar.gz" -C "$tool_dir" actionlint

"$tool_dir/shellcheck-v0.11.0/shellcheck" --version
python3 scripts/check-shell.py "$tool_dir/shellcheck-v0.11.0/shellcheck"
# All workflow shell blocks were checked above without ShellCheck exclusions.
"$tool_dir/actionlint" -shellcheck '' -pyflakes '' .github/workflows/ci.yml .github/workflows/release.yml
"$tool_dir/gitleaks" version
"$tool_dir/gitleaks" dir . --redact=100
"$tool_dir/gitleaks" git . --log-opts=--all --redact=100
