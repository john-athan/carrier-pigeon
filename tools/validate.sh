#!/bin/sh
# Every check this extension has. Run it directly, through `oss check
# utm-randomizer`, or from CI, which calls this file and nothing else.
#
# The checks every extension in the fleet shares live in tools/webext.mjs,
# which oss-kit owns; what is particular to this one is in webext.json and
# below. The permission list is the whole privacy claim, so webext.json checks
# it against docs/privacy-policy.html: webNavigation was declared for a year as
# nothing but a clock, and it hands over the URL of every navigation.
set -eu
cd "$(dirname "$0")/.."

fail=0
node tools/webext.mjs validate || fail=1

printf '\n== The rules the extension installs are the rules it means to install\n'
node test.js || fail=1

# The icons are generated and committed, because Chrome loads this folder as it
# stands and an unpacked extension without its icons is a broken one. Committing
# a generated file is only honest if something proves it still matches the
# generator, or it quietly becomes a hand-edited file nobody can rebuild.
# meta/make_icons.py is pure stdlib and byte-reproducible, so the proof is cheap.
printf '\n== The committed icons are what the generator produces\n'
python3 meta/make_icons.py >/dev/null || fail=1
if git diff --quiet -- icons; then
  echo "ok, icons match meta/make_icons.py"
else
  echo "FAIL: the generator no longer matches the committed icons:"
  git diff --stat -- icons
  git checkout -- icons
  fail=1
fi

if [ "$fail" -ne 0 ]; then printf '\nvalidate: FAILED\n'; exit 1; fi
printf '\nvalidate: everything passes\n'
