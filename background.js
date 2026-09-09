importScripts('utm-data.js');

// How often the non-pinned parameters are re-rolled. One minute is the floor
// chrome.alarms enforces, and it is well under how long anyone spends on a page,
// so consecutive visits still land in an analytics dashboard as unrelated
// nonsense.
//
// This used to hang off webNavigation.onCompleted, which re-rolled after every
// page load. That read better on paper and cost more than it was worth: the
// permission it needs hands this extension the URL of every top-level navigation
// in the browser, which is precisely the data the extension exists to keep out
// of other people's hands, and it was used for nothing but its timing. An alarm
// is a clock, and a clock is all this ever wanted. It also stops rewriting the
// dynamic rule set, which is stored on disk, once per page load.
const ROTATE_ALARM = 'rotate';
const ROTATE_MINUTES = 1;

async function applySettings() {
  const { enabled = true, pins = {} } = await chrome.storage.local.get(['enabled', 'pins']);
  if (enabled) {
    await rotateRules(pins);
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [UTM_RULE_ID] });
  }
}

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name !== ROTATE_ALARM) return;
  // Settings are read fresh each time, so a pin set in the popup takes effect
  // on the next roll without the popup having to reach in here.
  const { enabled = true, pins = {} } = await chrome.storage.local.get(['enabled', 'pins']);
  if (enabled) await rotateRules(pins);
});

// create() replaces an alarm of the same name, so running this on every service
// worker start is idempotent rather than a way to accumulate alarms.
chrome.alarms.create(ROTATE_ALARM, { periodInMinutes: ROTATE_MINUTES });

// Apply settings on service worker startup (e.g. browser launch, extension update).
applySettings();
