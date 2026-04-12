// Shared UTM data — loaded via importScripts() in background.js
// and via <script src> in popup.html

const UTM_RULE_ID = 1;

const utmValues = {
  utm_source: [
    'carrier_pigeon',
    'smoke_signals',
    'telegram',
    'fortune_cookie',
    'ouija_board',
    'bathroom_wall',
    'fever_dream',
    'ancient_prophecy',
    'magic_8ball',
    'cryptic_skywriting',
    'conspiracy_theory',
    'wrong_number',
    'accidental_butt_dial',
    'message_in_bottle',
    'cave_painting',
    'interpretive_dance'
  ],
  utm_medium: [
    'carrier_pigeon',
    'telepathy',
    'morse_code',
    'semaphore_flags',
    'angry_letter',
    'passive_aggressive_note',
    'interpretive_jazz',
    'dramatic_reenactment',
    'smoke_signals',
    'cave_drawings',
    'strongly_worded_email',
    'vague_gesturing',
    'elaborate_mime',
    'skywriting',
    'tin_can_phone',
    'screaming_into_void'
  ],
  utm_campaign: [
    'operation_oops',
    'project_why_not',
    'initiative_regret',
    'plan_b_through_z',
    'strategy_chaos',
    'mission_impossible_budget',
    'campaign_wing_it',
    'operation_coffee_shortage',
    'project_deadline_panic',
    'initiative_what_could_go_wrong',
    'plan_ctrl_z',
    'strategy_fake_it',
    'mission_send_help',
    'campaign_budget_lol',
    'operation_hope_for_best',
    'project_technically_working'
  ],
  utm_term: [
    'free_puppies',
    'absolutely_not_a_scam',
    'totally_legitimate',
    'trust_me_bro',
    'seems_legit',
    'definitely_real',
    'not_suspicious_at_all',
    'what_could_go_wrong',
    'yolo',
    'professional_adult',
    'i_know_what_im_doing',
    'calculated_risk',
    'probably_fine',
    'ctrl_alt_defeat',
    'works_on_my_machine',
    'documented_somewhere'
  ],
  utm_content: [
    'that_button_nobody_clicks',
    'the_thing_in_the_corner',
    'mystery_link',
    'clickbait_supreme',
    'dubious_source',
    'comic_sans_edition',
    'enhanced_with_clipart',
    'legally_distinct',
    'artisanal_handcrafted_pixels',
    'vintage_web_1.0',
    'premium_mediocre',
    'suspiciously_specific',
    'technically_correct',
    'deprecated_but_functional',
    'feature_not_bug',
    'inspired_by_true_events'
  ],
  utm_region: [
    'narnia',
    'atlantis',
    'middle_earth',
    'wonderland',
    'neverland',
    'gotham',
    'wakanda',
    'mordor',
    'oz',
    'westeros',
    'district_12',
    'panem',
    'hogsmeade',
    'area_51',
    'bermuda_triangle'
  ],
  utm_channel: [
    'tin_cans_and_string',
    'messenger_owl',
    'raven_scroll',
    'fax_machine',
    'carrier_bat',
    'singing_telegram',
    'morse_code_tapping',
    'smoke_signals',
    'message_in_bottle',
    'passenger_pigeon',
    'pony_express',
    'telegraph',
    'semaphore',
    'drums',
    'yelling_really_loud'
  ],
  utm_id: [
    'definitely_not_42',
    'random_keyboard_smash',
    '8675309',
    '404_not_found',
    '123456789',
    'password123',
    'test_test_test',
    'lorem_ipsum',
    'todo_fix_this',
    'temporary_id',
    'placeholder',
    'asdf1234',
    'changeme',
    'example_id'
  ]
};

function getRandomValue(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// pins: { utm_source: 'carrier_pigeon', utm_medium: null, ... }
// null / missing key → randomize that param; string value → pin it
async function rotateRules(pins = {}) {
  const addOrReplaceParams = Object.entries(utmValues).map(([key, values]) => ({
    key,
    value: pins[key] != null ? pins[key] : getRandomValue(values),
    replaceOnly: true
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [UTM_RULE_ID],
    addRules: [{
      id: UTM_RULE_ID,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: { addOrReplaceParams }
          }
        }
      },
      condition: {
        regexFilter: '[?&][Uu][Tt][Mm]_',
        resourceTypes: ['main_frame', 'sub_frame']
      }
    }]
  });
}
