// Synthetic DOM integration with the actual resource HUD; no browser or physical measurements.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/assets/atlas-hud.js', import.meta.url), 'utf8');
function fixture(snapshot) {
  function element(tag) {
    return { tag, children: [], textContent: '',
      appendChild(n) { this.children.push(n); return n; },
      removeChild(n) { this.children.splice(this.children.indexOf(n), 1); },
      get firstChild() { return this.children[0] || null; }
    };
  }
  const context = { window: { AtlasJuego: { texto: (k) => k, instantanea: snapshot } }, document: { createElement: element } };
  vm.runInNewContext(source, context);
  const panel = element('details');
  context.window.AtlasHud.monta(null, panel);
  function rows() {
    const children = panel.children.find((n) => n.tag === 'dl').children;
    return Object.fromEntries(children.filter((_, i) => !(i % 2)).map((n, i) => [n.textContent, String(children[i * 2 + 1].textContent)]));
  }
  return { api: context.window.AtlasHud, rows };
}
const snapshot = (cycle, values = {}) => ({ esquema: 'atlas.instantanea/1', ciclo: cycle,
  recursos: { luz: 10, biomasa: 20, cobre: 30, flujo: 25, ...values } });
let total = 0;
const check = (name, fn) => { fn(); total++; };
check('rates reflect actual differences and valid zero', () => {
  const h = fixture(() => snapshot(0));
  assert.equal(h.rows().hud_ciclo, '0'); assert.match(h.rows().hud_luz, /^NO_DATA \(/);
  h.api.estado(snapshot(100, { luz: 20, biomasa: 10, cobre: 30 }));
  assert.equal(h.rows().hud_luz, '+10.0'); assert.equal(h.rows().hud_bio, '-10.0');
  assert.equal(h.rows().hud_cobre, '0.0'); assert.equal(h.rows().hud_flujo, '25%');
});
for (const invalid of [null, {}, { esquema: 'other' }, snapshot(null), snapshot(NaN), snapshot(1000000001),
  snapshot(1, { luz: NaN }), snapshot(1, { cobre: '30' }), { ...snapshot(1), recursos: null }]) {
  check('invalid reading clears old measurements', () => {
    const h = fixture(() => snapshot(0)); h.api.estado(snapshot(100, { luz: 20 }));
    assert.doesNotThrow(() => h.api.estado(invalid));
    for (const value of Object.values(h.rows())) assert.match(value, /^NO_DATA \(.+\)$/);
    h.api.estado(snapshot(110)); assert.equal(h.rows().hud_ciclo, '110');
    assert.match(h.rows().hud_luz, /^NO_DATA \(/);
  });
}
check('throwing initial snapshot is isolated without private text', () => {
  const h = fixture(() => { throw new Error('PRIVATE_SENTINEL'); });
  for (const value of Object.values(h.rows())) { assert.match(value, /^NO_DATA \(/); assert.ok(!value.includes('PRIVATE_SENTINEL')); }
});
check('reset and repeated cycle do not manufacture rates', () => {
  const h = fixture(() => snapshot(100)); h.api.estado(snapshot(100, { luz: 99 }));
  assert.match(h.rows().hud_luz, /^NO_DATA \(/);
  h.api.estado(snapshot(1)); assert.match(h.rows().hud_luz, /^NO_DATA \(/);
  h.api.estado(snapshot(101, { luz: 20 })); assert.equal(h.rows().hud_luz, '+10.0');
});
check('historical samples cannot change when a reader reuses its object', () => {
  const shared = snapshot(0); const h = fixture(() => shared);
  shared.ciclo = 100; shared.recursos.luz = 20; h.api.estado(shared);
  assert.equal(h.rows().hud_luz, '+10.0');
});
check('arithmetic overflow produces a cause instead of Infinity', () => {
  const h = fixture(() => snapshot(0, { luz: -1e308 }));
  h.api.estado(snapshot(1, { luz: 1e308 }));
  assert.match(h.rows().hud_luz, /^NO_DATA \(/);
});
console.log(JSON.stringify({ cases: total, ok: true, fixture: 'SYNTHETIC DOM; actual HUD source' }));
