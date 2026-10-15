// UI integration: the actual radio module, with deterministic DOM and snapshot fixtures.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/assets/radio_message_log.js', import.meta.url), 'utf8');
function radio() {
  const nodes = [];
  function element(tag) {
    const n = { tagName: tag, dataset: {}, children: [], style: {}, _text: '',
      classList: { contains() { return true; }, toggle() {} },
      setAttribute() {}, addEventListener() {}, contains() { return false; },
      appendChild(child) { this.children.push(child); return child; },
      get textContent() { return this._text + this.children.map((x) => x.textContent).join(''); },
      set textContent(v) { this._text = String(v); this.children = []; }
    };
    nodes.push(n); return n;
  }
  const context = { document: { createElement: element, addEventListener() {} },
    MutationObserver: class { observe() {} } };
  vm.runInNewContext(source, context);
  context.AtlasRadioChat.monta(element('main'), {});
  return { context, api: context.AtlasRadioChat, nodes };
}
let total = 0;
function check(name, run) { run(); total++; }
for (const invalid of [undefined, null, NaN, Infinity, -1, 0.5, '1', 1000000001]) {
  check('invalid cycle ' + String(invalid), () => {
    const r = radio(); r.context.AtlasJuego = { instantanea: () => ({ ciclo: invalid }) };
    r.api.dice({ texto: 'A measured event', fuente: 'state' });
    const row = r.api.registro()[0];
    assert.equal(row.ciclo, null); assert.equal(row.sello, 'NO_DATA');
    const bubble = r.nodes.findLast((n) => n.className === 'radio-msg');
    assert.match(bubble.textContent, /NO_DATA \(.*cycle.*\)/);
    assert.doesNotMatch(bubble.textContent, /NaN|undefined/);
  });
}
for (const unavailable of [null, { instantanea() { throw new Error('PRIVATE_SENTINEL'); } }]) {
  check('missing or throwing snapshot', () => {
    const r = radio(); r.context.AtlasJuego = unavailable;
    assert.doesNotThrow(() => r.api.dice({ texto: 'An event', fuente: 'state' }));
    assert.equal(r.api.registro()[0].ciclo, null);
    assert.equal(r.api.registro()[0].sello, 'NO_DATA');
    assert.ok(r.nodes.every((n) => !n.textContent.includes('PRIVATE_SENTINEL')));
  });
}
check('age thresholds and cycle reset', () => {
  const r = radio(); let cycle = 10;
  r.context.AtlasJuego = { instantanea: () => ({ ciclo: cycle }) };
  r.api.dice({ texto: 'Measured', fuente: 'state' });
  assert.equal(r.api.registro()[0].sello, 'LIVE');
  cycle = 130; assert.equal(r.api.registro()[0].sello, 'LIVE');
  cycle = 131; assert.equal(r.api.registro()[0].sello, 'STALE');
  cycle = 9; assert.equal(r.api.registro()[0].sello, 'NO_DATA');
});
check('unavailable current cycle and recovery', () => {
  const r = radio(); let cycle = 0;
  r.context.AtlasJuego = { instantanea: () => ({ ciclo: cycle }) };
  r.api.dice({ texto: 'First event', fuente: 'state' });
  assert.equal(r.api.registro()[0].ciclo, 0);
  cycle = null; assert.equal(r.api.registro()[0].sello, 'NO_DATA');
  cycle = 20; assert.equal(r.api.registro()[0].sello, 'LIVE');
});
check('synthetic and unavailable source seals are preserved', () => {
  const r = radio();
  r.api.dice({ texto: 'SIMULATED scene', fuente: 'scene' });
  r.api.dice({ texto: 'NO_DATA (observation unavailable)', fuente: 'state' });
  assert.equal(r.api.registro()[0].sello, 'SIMULATED');
  assert.equal(r.api.registro()[1].sello, 'NO_DATA');
});
console.log(JSON.stringify({ cases: total, ok: true, fixture: 'SYNTHETIC DOM; actual source; no browser measurement' }));
