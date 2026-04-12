// State mirrored from storage
const state = { enabled: true, pins: {} };

// ── Render ────────────────────────────────────────────────────────────────────

function renderParams() {
  const container = document.getElementById('params');
  const disabled = !state.enabled;

  container.innerHTML = Object.entries(utmValues).map(([key, values]) => {
    const pinned = state.pins[key] ?? '';
    const opts = [
      `<option value="">↺ random</option>`,
      ...values.map(v =>
        `<option value="${v}"${v === pinned ? ' selected' : ''}>${v}</option>`
      )
    ].join('');

    return `
      <div class="param-row">
        <label class="key" for="sel-${key}">${key}</label>
        <select id="sel-${key}" data-key="${key}"${disabled ? ' disabled' : ''}>${opts}</select>
      </div>`;
  }).join('');

  // Wire change events
  for (const key of Object.keys(utmValues)) {
    document.getElementById(`sel-${key}`).addEventListener('change', onParamChange);
  }
}

function renderToggle() {
  const on = state.enabled;
  document.getElementById('toggle').checked = on;
  document.getElementById('toggle-label').textContent = on ? 'ON' : 'OFF';
  document.getElementById('roll-btn').disabled = !on;
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function onParamChange(e) {
  const key = e.target.dataset.key;
  const value = e.target.value;

  if (value === '') {
    delete state.pins[key];
  } else {
    state.pins[key] = value;
  }

  await chrome.storage.local.set({ pins: state.pins });
  if (state.enabled) await rotateRules(state.pins);
}

document.getElementById('toggle').addEventListener('change', async (e) => {
  state.enabled = e.target.checked;
  await chrome.storage.local.set({ enabled: state.enabled });

  if (state.enabled) {
    await rotateRules(state.pins);
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [UTM_RULE_ID] });
  }

  renderToggle();
  renderParams(); // re-render to enable/disable selects
});

document.getElementById('roll-btn').addEventListener('click', async () => {
  const btn = document.getElementById('roll-btn');
  btn.textContent = 'Rolled! 🎲';
  btn.disabled = true;
  await rotateRules(state.pins);
  setTimeout(() => {
    btn.textContent = '🎲 Roll random params again';
    btn.disabled = false;
  }, 900);
});

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const stored = await chrome.storage.local.get(['enabled', 'pins']);
  state.enabled = stored.enabled ?? true;
  state.pins = stored.pins ?? {};

  renderToggle();
  renderParams();
}

init();
