#!/bin/sh
# Every check this extension has. Run it directly, through `oss check
# utm-randomizer`, or from CI, which calls this file and nothing else.
set -eu
cd "$(dirname "$0")/.."

fail=0
step() { printf '\n== %s\n' "$1"; }

step "manifest.json is well-formed JSON"
node -e "const m=JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('ok, version ' + m.version)" || fail=1

step "JavaScript parses"
for f in background.js popup.js utm-data.js; do
  node --check "$f" && echo "ok $f" || fail=1
done

if [ "$fail" -ne 0 ]; then printf '\nvalidate: FAILED\n'; exit 1; fi
printf '\nvalidate: everything passes\n'
