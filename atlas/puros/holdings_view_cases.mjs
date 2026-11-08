import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const V = createRequire(import.meta.url)(process.env.HOLDINGS_VIEW_JS || '../../public/game/holdings_view.js');

// Hand-made DOM.
const find = (n, p) => { for (const c of n.children) { if (p(c)) { return c; } const r = find(c, p); if (r) { return r; } } return null; };
function makeDoc() {
  const mk = (tag) => ({
    tagName: tag.toUpperCase(), children: [], attrs: {}, parentNode: null, _text: '', _h: {},
    get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); },
    set textContent(v) { this.children = []; this._text = String(v); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    appendChild(n) { if (n.parentNode) { const p = n.parentNode.children; p.splice(p.indexOf(n), 1); } n.parentNode = this; this.children.push(n); return n; },
    replaceChild(nw, old) { this.children[this.children.indexOf(old)] = nw; nw.parentNode = this; old.parentNode = null; return old; },
    addEventListener(t, f) { this._h[t] = f; },
    click() { this._h.click(); },
    querySelector(sel) { const [, c] = /"([^"]+)"/.exec(sel); return find(this, (n) => n.attrs['data-speaker'] === c); },
  });
  const body = mk('body');
  return { body, createElement: mk, getElementById: (id) => find(body, (n) => n.attrs.id === id) || null };
}
// Fake API, contract shape.
function fakeApi({ copper = 20, biomass = 5, holdings = [{ id: 7, kind: 0, life: 500, waves: 2 }] } = {}) {
  const calls = [];
  return { calls, balances: () => ({ copper, light: 0, biomass, oxygen: 0 }), holdings: () => holdings,
    healCost: () => 15, army: () => 3, heal: (step, id) => { calls.push([step, id]); return null; } };
}
const btnOf = (sec) => find(sec, (n) => n.attrs.class === 'holdings-heal');

test('NO_DATA shows the cause only', () => {
  const sec = V.render(makeDoc(), { estado: 'NO_DATA', causa: 'WASM not loaded' }, 0);
  assert.match(sec.textContent, /Buildings owned: NO_DATA · WASM/);
  assert.equal(btnOf(sec), null);
});

test('no buildings', () => {
  const sec = V.render(makeDoc(), fakeApi({ holdings: [] }), 0);
  assert.match(sec.textContent, /No buildings yet: win a fight at a grey building to hold it\./);
  assert.match(sec.textContent, /Copper 20 · Light 0 · Biomass 5 · Oxygen 0/);
  assert.match(sec.textContent, /Army at home: 3 waves/);
});

test('ids and labels', () => {
  const sec = V.render(makeDoc(), fakeApi(), 0), h3 = find(sec, (n) => n.tagName === 'H3');
  assert.deepEqual([sec.tagName, sec.attrs.class, sec.attrs['aria-labelledby']], ['SECTION', 'holdings', 'holdings-title']);
  assert.deepEqual([h3.textContent, h3.attrs.id], ['Buildings owned', 'holdings-title']);
});

test('workshop life 500 enabled', () => {
  const sec = V.render(makeDoc(), fakeApi(), 0), btn = btnOf(sec);
  assert.equal(btn.disabled, false);
  assert.equal(btn.textContent, 'Heal 10 % · 15 copper + 5 biomass');
  assert.match(sec.textContent, /Workshop/);
  assert.match(sec.textContent, /garrison: 2 waves/);
  assert.equal(find(sec, (n) => n.tagName === 'METER').attrs['aria-label'], 'Life 50 %');
});

test('copper 3: disabled, Not enough copper', () => {
  const btn = btnOf(V.render(makeDoc(), fakeApi({ copper: 3 }), 0));
  assert.equal(btn.disabled, true);
  assert.equal(btn.textContent, 'Not enough copper');
});

test('biomass 4: disabled, Not enough biomass', () => {
  const btn = btnOf(V.render(makeDoc(), fakeApi({ biomass: 4 }), 0));
  assert.equal(btn.disabled, true);
  assert.equal(btn.textContent, 'Not enough biomass');
});

test('life 1000: disabled, Full life', () => {
  const btn = btnOf(V.render(makeDoc(), fakeApi({ holdings: [{ id: 7, kind: 0, life: 1000, waves: 2 }] }), 0));
  assert.equal(btn.disabled, true);
  assert.equal(btn.textContent, 'Full life');
});

test('click heals once', () => {
  const doc = makeDoc(), api = fakeApi(), voices = doc.createElement('ol');
  voices.setAttribute('id', 'voices'); doc.body.appendChild(voices);
  const sec = V.mount(doc, api, 4);
  btnOf(sec).click();
  assert.deepEqual(api.calls, [[4, 7]]);
  assert.notEqual(doc.getElementById('holdings'), sec);
  assert.equal(voices.children.length, 1);
});

test('mount: Army, replace, fallback', () => {
  const doc = makeDoc();
  assert.equal(V.mount(doc, fakeApi(), 0), null);
  const voices = doc.createElement('ol'); voices.setAttribute('id', 'voices'); doc.body.appendChild(voices);
  const army = doc.createElement('li'); army.setAttribute('data-speaker', 'Army'); voices.appendChild(army);
  assert.equal(V.mount(doc, fakeApi(), 0).parentNode, army);
  V.mount(doc, fakeApi({ copper: 3 }), 0);
  assert.equal(army.children.length, 1);
  assert.match(doc.getElementById('holdings').textContent, /Not enough copper/);
  const d2 = makeDoc(), v2 = d2.createElement('ol'); v2.setAttribute('id', 'voices'); d2.body.appendChild(v2);
  assert.equal(V.mount(d2, fakeApi(), 0).parentNode, v2);
});
