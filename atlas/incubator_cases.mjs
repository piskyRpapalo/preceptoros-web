import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const source = readFileSync(fileURLToPath(new URL('../public/game/ui-invoca.js', import.meta.url)), 'utf8');
const root = {};
vm.runInNewContext(source, root);
const Invoca = root.AtlasInvoca;

function list() {
  const rows = [];
  return { rows, get firstChild() { return rows[0] || null; },
    appendChild(row) { rows.push(row); return row; }, removeChild(row) { rows.splice(rows.indexOf(row), 1); } };
}
function view(cycle, eggs = [{ tc: 'tc1', desde: 10, hasta: 20 }]) {
  const status = [], traces = [], nido = list();
  const ui = Invoca.crea({
    G: { HUEVO: {}, TCS: { tc1: { coste: { cobre: 1, luz: 1 } } } }, A: {}, S: {},
    T: (key) => ({ nido_vacio: 'No egg incubating.', huevo_aria: 'Incubating egg',
      inc_ciclo_nd: 'NO_DATA · game cycle unavailable', huevo: '{tc} · {p}%' }[key] || key),
    el: (tag, className, text) => ({ tag, className, textContent: text || '', children: [], appendChild(child) { this.children.push(child); } }),
    lienzo: () => ({ tag: 'canvas' }), traza: (...args) => traces.push(args), quieto: () => false,
    boton: () => ({}), rellena: (pattern, values) => pattern.replace(/\{(\w+)\}/g, (_, key) => values[key]),
    dice: (text) => status.push(text), ins: () => cycle === 'throw' ? null : { ciclo: cycle },
    cicloMedido: (s) => Number.isSafeInteger(s && s.ciclo) && s.ciclo >= 0 && s.ciclo <= 1000000000 ? s.ciclo : null,
    calor: () => 0, R: { nido }, Z: { huevos: eggs }, pinta: () => {}
  });
  return { ui, status, traces, nido };
}

const measured = view(15); measured.ui.pintaNido();
assert.equal(measured.nido.rows[0].children[1].textContent, 'tc1 · 50%');
assert.equal(measured.traces.length, 1);

for (const cycle of [null, 'throw', -1, 1.5, 1000000001]) {
  const missing = view(cycle); missing.ui.pintaNido();
  assert.equal(missing.nido.rows[0].children[1].textContent, 'NO_DATA · game cycle unavailable');
  assert.equal(missing.traces[0][3], 1, 'missing cycle must not animate from a fabricated zero');
}

const empty = view(null, []); empty.ui.pintaNido();
assert.equal(empty.nido.rows[0].textContent, 'No egg incubating.');

let debits = 0, messages = [];
let identityCalls = 0;
root.window = { AtlasJuego: { invoca() { debits++; } }, Identity: { quien() { identityCalls++; return 'synthetic'; } } };
const action = Invoca.crea({ G: { TCS: { tc1: { coste: { cobre: 1, luz: 1 } } } }, A: {}, S: {},
  T: (key) => key === 'inc_ciclo_nd' ? 'NO_DATA · game cycle unavailable' : key,
  boton: () => ({}), rellena: (x) => x, dice: (x) => messages.push(x), ins: () => ({ ciclo: null, recursos: { cobre: 10, luz: 10 } }),
  cicloMedido: () => null, calor: () => 0, R: { nido: list() }, Z: { huevos: [] }, pinta: () => {} });
await action.invoca('tc1');
assert.deepEqual(messages, ['NO_DATA · game cycle unavailable']);
assert.equal(debits, 0);
assert.equal(identityCalls, 0);
console.log(JSON.stringify({ cases: 8, state: 'MEDIDO', provenance: 'SYNTHETIC' }));
