#!/bin/sh
# Prepare Guide's locally built navigation theme for rust-embed.
# web-theme.pin records upstream provenance only; no remote archive is fetched
# or accepted, so its SHA is neither changed nor replaced with a fake stamp.
set -eu

cd "$(dirname "$0")/.."
SOURCE=../navigation-theme
DEST=target/theme
if [ ! -f "$SOURCE/dist/index.html" ] || [ ! -f "$SOURCE/theme.json" ]; then
  echo "navigation-theme is missing: build ../navigation-theme with npm ci && npm run build first" >&2
  exit 1
fi

# Only replace the generated theme staging directory, never an installed theme.
if [ -L target ] || [ -L "$DEST" ]; then
  echo "refusing to replace a symlinked theme staging directory" >&2
  exit 1
fi
mkdir -p target
rm -rf "$DEST"
mkdir -p "$DEST/dist"
cp -R "$SOURCE/dist/." "$DEST/dist/"
cp "$SOURCE/theme.json" "$DEST/theme.json"
echo "local navigation-theme prepared in $DEST"
