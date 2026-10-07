#!/bin/sh
# Guide source-build notice. Installation and updates are intentionally disabled.
set -eu
printf '%s\n' \
  'Guide 1.0.0 has no published installer or automatic updater.' \
  'Build this project from source; see guide/README.md and docs/deployment/guide.service.' \
  'Guide upstream installation/updates are disabled. No files or services were changed.' >&2
exit 1
