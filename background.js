importScripts('utm-data.js');

async function applySettings() {
  const { enabled = true, pins = {} } = await chrome.storage.local.get(['enabled', 'pins']);
  if (enabled) {
    await rotateRules(pins);
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [UTM_RULE_ID] });
  }
}

// After each top-level navigation, rotate the non-pinned params.
// Reads fresh settings each time so pin changes from the popup take effect immediately.
chrome.webNavigation.onCompleted.addListener(async ({ frameId }) => {
  if (frameId !== 0) return;
  const { enabled = true, pins = {} } = await chrome.storage.local.get(['enabled', 'pins']);
  if (enabled) rotateRules(pins);
});

// Apply settings on service worker startup (e.g. browser launch, extension update).
applySettings();
