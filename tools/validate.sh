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
for f in background.js popup.js utm-data.js test.js; do
  node --check "$f" && echo "ok $f" || fail=1
done

# The permission list is the whole privacy claim of this extension, so it is
# checked against what is written down rather than left to a reviewer to notice.
# webNavigation was declared here for a year and used as nothing but a clock; it
# hands over the URL of every navigation in the browser, which is the exact data
# the extension exists to keep away from other people.
step "Every permission is declared in the privacy policy, and no more"
node -e '
  const fs = require("fs");
  const declared = JSON.parse(fs.readFileSync("manifest.json", "utf8")).permissions || [];
  const policy = fs.readFileSync("docs/privacy-policy.html", "utf8");
  const fail = (msg) => { console.error("FAIL: " + msg); process.exitCode = 1; };
  // Bounded to the permissions list. Prose elsewhere on the page legitimately
  // names a permission (the alarms entry says what it replaced), and outside
  // this list that is history rather than a declaration.
  const section = (policy.split("<h2>Permissions explained</h2>")[1] || "").split("</ul>")[0];
  const explained = [...section.matchAll(/<strong><code>([a-zA-Z]+)<\/code><\/strong>/g)].map((m) => m[1]);
  for (const p of declared) {
    if (!explained.includes(p)) fail(`manifest declares ${p}, the privacy policy does not explain it`);
  }
  for (const e of explained) {
    if (!declared.includes(e)) fail(`the privacy policy explains ${e}, which the manifest does not declare`);
  }
  console.log("explained: " + declared.join(", "));
' || fail=1

step "The rules the extension installs are the rules it means to install"
node test.js || fail=1

# The icons are generated and committed, because Chrome loads this folder as it
# stands and an unpacked extension without its icons is a broken one. Committing
# a generated file is only honest if something proves it still matches the
# generator, or it quietly becomes a hand-edited file nobody can rebuild.
# meta/make_icons.py is pure stdlib and byte-reproducible, so the proof is cheap.
step "The committed icons are what the generator produces"
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
