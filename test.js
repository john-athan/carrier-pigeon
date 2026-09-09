// What the extension actually sends, checked without a browser.
//
// `utm-data.js` is split so the deciding and the shaping are pure functions and
// only `rotateRules` needs chrome. Run directly (`node test.js`), through
// `tools/validate.sh`, or from CI, which calls that script and nothing else.

const assert = require('node:assert/strict');
const { utmValues, UTM_RULE_ID, chooseValues, buildRule } = require('./utm-data.js');

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log(`  ok ${name}`); };

check('every parameter gets a value from its own list', () => {
  for (const p of chooseValues()) {
    assert.ok(utmValues[p.key], `${p.key} is a parameter this extension knows`);
    assert.ok(utmValues[p.key].includes(p.value), `${p.key}=${p.value} is one of its values`);
  }
});

check('a pin is used verbatim and the rest still roll', () => {
  const params = chooseValues({ utm_source: 'ouija_board' });
  const source = params.find((p) => p.key === 'utm_source');
  assert.equal(source.value, 'ouija_board');
  assert.equal(params.length, Object.keys(utmValues).length, 'nothing was dropped');
});

check('a pin that is not one of the listed values is still honoured', () => {
  // The popup only offers listed values, but a pin comes out of storage and
  // storage is not a menu. Whatever is in there is what the user chose.
  const params = chooseValues({ utm_campaign: 'anything_at_all' });
  assert.equal(params.find((p) => p.key === 'utm_campaign').value, 'anything_at_all');
});

check('nothing is ever added to a URL that had no UTM parameters', () => {
  // The whole extension turns on this flag. Without it, a request that carried
  // no tracking parameters would leave here carrying some, which would make this
  // a tracker rather than a joke about one.
  for (const p of chooseValues()) assert.equal(p.replaceOnly, true, `${p.key} is replace-only`);
});

check('the rule replaces one id rather than piling up', () => {
  assert.equal(buildRule(chooseValues()).id, UTM_RULE_ID);
});

check('the rule only fires on URLs that already carry a UTM parameter', () => {
  const { regexFilter, resourceTypes } = buildRule(chooseValues()).condition;
  const re = new RegExp(regexFilter);
  for (const url of ['http://x.test/?utm_source=a', 'http://x.test/?a=1&utm_medium=b',
                     'http://x.test/?UTM_SOURCE=a', 'http://x.test/?a=1&Utm_Term=b']) {
    assert.ok(re.test(url), `matches ${url}`);
  }
  for (const url of ['http://x.test/', 'http://x.test/?a=1',
                     'http://x.test/utm_source/page', 'http://x.test/?sutm_source=a']) {
    assert.ok(!re.test(url), `leaves ${url} alone`);
  }
  assert.deepEqual(resourceTypes, ['main_frame', 'sub_frame'], 'documents only, not subresources');
});

check('rolling twice actually changes something', () => {
  // Every list is long enough that two consecutive rolls agreeing on all eight
  // parameters is not going to happen; if it does, the randomisation broke.
  const a = chooseValues().map((p) => p.value).join();
  let differed = false;
  for (let i = 0; i < 20 && !differed; i++) {
    differed = chooseValues().map((p) => p.value).join() !== a;
  }
  assert.ok(differed, 'twenty rolls produced twenty identical sets');
});

check('the redirect keeps the rest of the URL', () => {
  // queryTransform touches named parameters only. Anything that rewrote the
  // path or the host would break every link the user clicks.
  const { redirect } = buildRule(chooseValues()).action;
  assert.deepEqual(Object.keys(redirect), ['transform']);
  assert.deepEqual(Object.keys(redirect.transform), ['queryTransform']);
  assert.deepEqual(Object.keys(redirect.transform.queryTransform), ['addOrReplaceParams']);
});

console.log(`\ntest: ${checks} checks passed`);
