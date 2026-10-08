#!/bin/sh
# Isolated source validation only: never installs or manages a Guide service.
set -eu
umask 077
cd "$(dirname "$0")/.."
if [ "$(uname -s)" != Linux ]; then
  echo "Run this source test on Linux in a fresh, isolated directory." >&2
  exit 1
fi
for tool in python3 node npm cargo rustc cc; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Missing required tool: $tool" >&2; exit 1; }
done
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) { console.error("Node.js 24+ required for TypeScript tests"); process.exit(1) }'
python3 _test/verify-source.py
node --version
npm --version
rustc --version
cargo --version
for frontend in guide/web-admin navigation-theme; do
  (
    cd "$frontend"
    npm ci
    npm run test
    npm run lint
    npm run build
  )
done
(
  cd guide
  cargo fmt --all --check
  cargo test --locked
  cargo build --locked --release
  ./target/release/guide-hub --version
)
echo "PASS: source checks, both frontends, full Rust tests and locked Linux release build."
