#!/bin/sh
# Build the Chrome Web Store package, and check it before it goes anywhere.
#
# The zip that was uploaded by hand in April held nine entries: the manifest,
# the three scripts, the popup, and the three icons. This reproduces exactly
# that, from the tree rather than from memory, so the next upload cannot
# quietly differ from the one that is live.
#
# The store rejects a package containing anything the extension does not need,
# so the list is explicit rather than a wildcard: screenshots, meta, docs and
# the README stay out of it.
set -eu
cd "$(dirname "$0")/.."

version=$(node -p "require('./manifest.json').version")
zip_name="carrier-pigeon-${version}.zip"
rm -f "$zip_name" carrier-pigeon.zip

zip -rq "$zip_name" \
  manifest.json background.js utm-data.js popup.html popup.js icons \
  -x '*.DS_Store'

echo "packed $zip_name"
# `head -n -2` is GNU only and BSD head refuses it, so awk does the trimming.
unzip -Z1 "$zip_name" | awk '{print "  " $0}'

# Every file the manifest names has to be in there, or the extension loads
# broken and only the store review says so, days later.
node -e '
  const { execSync } = require("child_process");
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const inZip = execSync(`unzip -Z1 ${JSON.stringify(process.argv[1])}`, {encoding: "utf8"})
    .split("\n").filter(Boolean);
  const needed = [
    m.background.service_worker,
    m.action && m.action.default_popup,
    ...Object.values(m.icons || {}),
  ].filter(Boolean);
  let bad = 0;
  for (const f of needed) {
    if (!inZip.includes(f)) { console.error("FAIL: manifest names " + f + ", the package lacks it"); bad = 1; }
  }
  // The popup pulls these in, and neither is named in the manifest.
  for (const f of ["popup.js", "utm-data.js"]) {
    if (!inZip.includes(f)) { console.error("FAIL: " + f + " is missing"); bad = 1; }
  }
  if (bad) process.exit(1);
  console.log("ok, every referenced file is packed, version " + m.version);
' "$zip_name"
