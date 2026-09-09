# Third-party material in carrier-pigeon

carrier-pigeon is MIT licensed and its source was written for this project. This
file records anything that came from elsewhere.

## Dependencies

None. The extension is plain HTML, CSS and JavaScript against the Chrome
extension APIs, and ships no bundled library.

## Icons and screenshots

`icons/`, `docs/` and `screenshots/` were produced for this project.

## Replacement strings

The implausible alternatives the extension writes in place of UTM parameters
were written for this project. Where one references something recognisable, it
is a joke about it, which is what parody is for, and it never claims to come
from it.

## Reviewed and cleared

Findings from `oss provenance utm-randomizer` that turn out to be convergent
output rather than copying, with the date and the reasoning.

**2026-09-09, two lines of ordinary JavaScript.** The gate flagged both against
copyleft repositories on the 1.1.0 release:

```js
return Object.entries(utmValues).map(([key, values]) => ({
const explained = [...section.matchAll(/<strong><code>([a-zA-Z]+)<\/code><\/strong>/g)].map((m) => m[1])
```

Both were written here, and both are the canonical spelling of what they do:
turning an object into an array of derived records, and collecting the first
capture group of every match. Neither has an alternative phrasing a JavaScript
author would reach for first.

The matches are the evidence for that rather than against it. Twenty
unrelated repositories, among them a WordPress plugin, an ArcGIS widget set, a
Kotlin exercise and several landing-page builders, share one of these lines
with each other as much as with us. A copy leaves a trail of one; an idiom
leaves a trail of twenty with nothing else in common.

Two of the twenty are copyleft, an Overleaf analytics helper and a WordPress
plugin. Nothing was taken from either, and neither was opened before the gate
named it.

They were listed here by name for a day, because naming a repository is what
used to close a finding. That was the wrong fix: it would have meant naming
whichever strangers happened to share the next ordinary line, release after
release, until this file was a list of people who had done nothing. The gate
counts separate owners now, so a line twenty of them hold does not block.
