import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_DEFAULTS } from '../dist/business.js';
import { DEFAULTS } from '../dist/model.js';
import { STORAGE_KEY, validateInput, freshState, loadState, saveState, buildHash, parseHash } from '../dist/state.js';

function memoryStorage(initial = null) {
  let raw = initial;
  return {
    getItem(key) { assert.equal(key, STORAGE_KEY); return raw; },
    setItem(key, value) { assert.equal(key, STORAGE_KEY); raw = value; },
    read() { return raw; },
  };
}

function saved(mode = 'business', id = 'one', input = mode === 'business' ? BUSINESS_DEFAULTS : DEFAULTS) {
  return { id, mode, name: `Saved ${id}`, input: { ...input } };
}

test('fresh sessions do not share mutable inputs or saved scenarios', () => {
  const first = freshState();
  first.business.revenue = 10;
  first.policy.carbonPrice = 0;
  first.saved.push(saved());
  assert.deepEqual(freshState(), { version: 1, business: { ...BUSINESS_DEFAULTS }, policy: { ...DEFAULTS }, saved: [] });
});

test('complete business and policy links preserve all numerical assumptions', () => {
  for (const [mode, input] of [
    ['business', { ...BUSINESS_DEFAULTS, revenue: 400000, annualTonnes: 40.125, carbonPrice: 0, reductionPercent: 100 }],
    ['policy', { carbonPrice: 200, rebateShare: 100, response: 40, householdSize: 1.7 }],
  ]) {
    const hash = buildHash(mode, input);
    assert.ok(hash.startsWith(`#${mode}?`));
    assert.deepEqual(parseHash(hash), { mode, input, error: '' });
  }
});

test('plain routes preserve existing inputs and unknown routes fall back safely', () => {
  for (const [hash, mode] of [['', 'business'], ['#business', 'business'], ['#policy', 'policy'], ['#contribute', 'contribute'], ['#missing', 'business']]) {
    assert.deepEqual(parseHash(hash), { mode, input: null, error: '' });
  }
  assert.deepEqual(parseHash('#contribute?anything=ignored'), { mode: 'contribute', input: null, error: '' });
});

test('broken shared links reject missing, duplicate, nonfinite, out-of-range and injected values', () => {
  const valid = buildHash('policy', DEFAULTS);
  const cases = [
    '#policy?carbonPrice=50',
    valid + '&carbonPrice=75',
    valid.replace('carbonPrice=50', 'carbonPrice='),
    valid.replace('carbonPrice=50', 'carbonPrice=%20%20'),
    valid.replace('carbonPrice=50', 'carbonPrice=NaN'),
    valid.replace('carbonPrice=50', 'carbonPrice=Infinity'),
    valid.replace('carbonPrice=50', 'carbonPrice=1e999'),
    valid.replace('carbonPrice=50', 'carbonPrice=-1'),
    valid.replace('carbonPrice=50', 'carbonPrice=201'),
    valid.replace('householdSize=2.5', 'householdSize=0'),
    valid.replace('carbonPrice=50', 'carbonPrice=%3Cscript%3Ealert(1)%3C%2Fscript%3E'),
  ];
  for (const hash of cases) {
    const result = parseHash(hash);
    assert.equal(result.mode, 'policy');
    assert.equal(result.input, null, hash);
    assert.ok(result.error, hash);
  }
});

test('validation accepts only complete numeric inputs and supported lab modes', () => {
  for (const mode of ['missing', 'contribute', 'constructor', 'toString', '__proto__']) {
    assert.throws(() => validateInput(mode, {}), undefined, mode);
    assert.throws(() => buildHash(mode, {}), undefined, mode);
  }
  for (const value of [null, [], '50', { ...DEFAULTS, carbonPrice: '50' }, { ...DEFAULTS, response: NaN }, { ...DEFAULTS, householdSize: 7 }, {}]) {
    assert.throws(() => validateInput('policy', value));
  }
  assert.deepEqual(validateInput('business', { ...BUSINESS_DEFAULTS, unexpected: '<script>' }), BUSINESS_DEFAULTS);
});

test('saved session restores both labs and comparison cards', () => {
  const state = freshState();
  state.business = { ...BUSINESS_DEFAULTS, investment: 90000 };
  state.policy = { ...DEFAULTS, rebateShare: 100 };
  state.saved = [saved('business', 'business-one', state.business), saved('policy', 'policy-one', state.policy)];
  const storage = memoryStorage();
  assert.equal(saveState(storage, state), true);
  assert.equal(JSON.parse(storage.read()).version, 1);
  assert.deepEqual(loadState(storage), { state, warning: '' });
});

test('empty storage starts normally; corrupt or incompatible storage recovers with a warning', () => {
  assert.deepEqual(loadState(memoryStorage()), { state: freshState(), warning: '' });
  for (const raw of ['{bad json', 'null', '[]', '{"version":2}', '"not a session"']) {
    const result = loadState(memoryStorage(raw));
    assert.deepEqual(result.state, freshState());
    assert.ok(result.warning);
  }
});

test('blocked or full browser storage does not stop calculations or claim a successful save', () => {
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); } };
  const result = loadState(blocked);
  assert.deepEqual(result.state, freshState());
  assert.ok(result.warning);
  assert.equal(saveState(blocked, result.state), false);
  assert.deepEqual(validateInput('business', result.state.business), BUSINESS_DEFAULTS);
  const cyclic = freshState();
  cyclic.saved.push(cyclic);
  assert.equal(saveState(memoryStorage(), cyclic), false);
});

test('malformed saved inputs are discarded while valid lab values and cards survive', () => {
  const data = {
    version: 1,
    business: { ...BUSINESS_DEFAULTS, carbonPrice: -1 },
    policy: { ...DEFAULTS, householdSize: 3 },
    saved: [null, saved('business', 'bad', { ...BUSINESS_DEFAULTS, annualTonnes: '250' }), saved('constructor', 'bad-mode', {}), saved('policy', 'valid')],
  };
  const { state } = loadState(memoryStorage(JSON.stringify(data)));
  assert.deepEqual(state.business, BUSINESS_DEFAULTS);
  assert.deepEqual(state.policy, { ...DEFAULTS, householdSize: 3 });
  assert.deepEqual(state.saved, [saved('policy', 'valid')]);
});

test('restored cards have usable unique IDs so a Load action cannot select another lab', () => {
  const data = freshState();
  data.saved = [saved('business', 'same'), saved('policy', 'same'), saved('policy', ''), saved('policy', null), saved('policy', 'valid')];
  const { state } = loadState(memoryStorage(JSON.stringify(data)));
  assert.equal(new Set(state.saved.map(s => s.id)).size, state.saved.length);
  assert.ok(state.saved.every(s => typeof s.id === 'string' && s.id.trim() !== '' && s.id !== 'null'));
  assert.ok(state.saved.some(s => s.id === 'valid' && s.mode === 'policy'));
});

test('restored comparison lists respect the three-cards-per-lab limit', () => {
  const data = freshState();
  data.saved = Array.from({ length: 6 }, (_, index) => saved('business', `card-${index}`));
  const { state } = loadState(memoryStorage(JSON.stringify(data)));
  assert.equal(state.saved.filter(s => s.mode === 'business').length, 3);
});

test('stored names and IDs stay inert when the real app renders comparison cards', async () => {
  const payload = '\"><img src=x onerror=alert(1)><script>x</script>&\'';
  const data = freshState();
  data.saved = [{ ...saved('business', payload), name: payload }];
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', addEventListener() {}, focus() {}, classList: { add() {}, remove() {}, toggle() {} } });
    return nodes.get(selector);
  };
  const original = Object.fromEntries(['window', 'document', 'location'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    globalThis.window = { localStorage: memoryStorage(JSON.stringify(data)), addEventListener() {} };
    globalThis.document = { querySelector: node, querySelectorAll: () => [], title: '' };
    globalThis.location = { hash: '#business' };
    await import('../dist/app.js?state-escaping-test');
    const html = node('#saved-content').innerHTML;
    assert.ok(html.includes('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;x&lt;/script&gt;&amp;&#39;'));
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes('<script'));
    assert.ok(!html.includes('data-load="\"><'));
    assert.equal(document.title, 'Carbon Commons — Business lab');
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
