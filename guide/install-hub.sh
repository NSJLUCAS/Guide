#!/bin/sh
# Guide release notice. Installation and updates are intentionally disabled.
set -eu
printf '%s\n' \
  'Guide does not provide an automatic installer or updater.' \
  'Download the official Linux x86_64 release from:' \
  'https://github.com/NSJLUCAS/Guide/releases' \
  'Guide upstream installation/updates are disabled. No files or services were changed.' >&2
exit 1
