// The egg-opening reveal (summon_reveal.js) puts the new troop's stats as chips under its caption, from the House board's
// stats() (visitor_view.js). A fake document and a vm sandbox run the real file; node --test atlas/puros/hatch_stats_cases.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const VIEW = readFileSync(new URL('../../public/game/visitor_view.js', import.meta.url), 'utf8');
const SUMMON = readFileSync(new URL('../../public/game/summon_reveal.js', import.meta.url), 'utf8');

function node(tag) {
  return {
    tag, children: [], className: '', hidden: false, textContent: '', attrs: {}, style: {}, clientWidth: 300, clientHeight: 200,
    appendChild(c) { this.children.push(c); return c; },
    append(...cs) { this.children.push(...cs); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    addEventListener() {}, removeEventListener() {}, focus() {}, remove() {},
    classList: { add() {}, toggle() {} },
    getContext() { return new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = () => {})), set: (t, k, v) => { t[k] = v; return true; } }); },
  };
}

// Runs the real visitor_view.js (optional) and summon_reveal.js in a vm sandbox; requestAnimationFrame only stores the frame.
function run({ board }) {
  const frames = [];
  const doc = { ...node('document'), body: node('body'), head: node('head'), activeElement: null, getElementById: () => null, createElement: node };
  const sandbox = {
    document: doc, requestAnimationFrame: (cb) => { frames.push(cb); return frames.length; }, cancelAnimationFrame() {},
    AtlasOnda: { riqueza: () => 1, tono: () => [171, 78], dibuja() {} }, AtlasEscena: { hash: () => 0.5 },
    AtlasGacha: { RAREZAS: ['normal', 'magico', 'raro', 'unico'] },
  };
  vm.createContext(sandbox);
  if (board) { vm.runInContext(VIEW, sandbox, { filename: 'visitor_view.js' }); }
  vm.runInContext(SUMMON, sandbox, { filename: 'summon_reveal.js' });
  return { sandbox, frames, body: doc.body };
}
const text = (n) => (typeof n === 'string' ? n : (n.children.length ? n.children.map(text).join('') : n.textContent));
const TROOP = { rareza: 'magico', aristas: 5, armonicos: [[1, 24, 24, 0]], semilla: 'abcdef12', stats: { vida: 10, armadura: 4, velocidad: 10, sigilo: 0 } };

test('the caption gets the troop stats as chips, after the caption text', () => {
  const { sandbox, frames, body } = run({ board: true });
  sandbox.AtlasRevela.muestra(TROOP);
  const fondo = body.children[body.children.length - 1], pie = fondo.children[1];
  const txt = pie.children[0], chips = pie.children[1];
  assert.equal(chips.tag, 'ul');
  assert.equal(chips.className, 'chips reveal-stats');
  assert.equal(chips.hidden, true, 'chips wait for the caption');
  assert.equal(txt.textContent, '', 'caption is empty before the reveal finishes');
  frames[0]();                                   // one frame with no game cycle: the reveal is finished
  assert.equal(txt.textContent, 'Magic · 5 edges');
  assert.equal(chips.hidden, false);
  assert.deepEqual(chips.children.map(text), ['Rank Magic', 'Life 10', 'Armour 4', 'Speed 10']);
  assert.deepEqual(chips.children.map((li) => li.children[1].tag), ['b', 'b', 'b', 'b']);
  assert.deepEqual(chips.children.map((li) => String(li.children[1].textContent)), ['Magic', '10', '4', '10']);
});

test('without the House board there are no chips, and the caption still opens', () => {
  const { sandbox, frames, body } = run({ board: false });
  sandbox.AtlasRevela.muestra(TROOP);
  const pie = body.children[body.children.length - 1].children[1];
  assert.equal(pie.children.some((c) => c.className === 'chips reveal-stats'), false);
  frames[0]();
  assert.equal(pie.children[0].textContent, 'Magic · 5 edges');
});
