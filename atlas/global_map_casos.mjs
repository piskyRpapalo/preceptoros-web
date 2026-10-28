// Gate of the global map (ODD isometric-colony · the first three nodes). Pure cases in node; the bitmap gate lives in
// atlas/global_map_visual.html (headless Chrome). Each sabotage must be able to go red: a check that cannot fail is
// not a gate.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const M = require('../public/game/global_map.js');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const enDos = (x) => JSON.stringify(x);
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

// 1 · liveness: the cabin is always here; the others only while listed alive; unknown ids are not drawn.
const solo = M.estado({ nodes: [] });
ok(solo.length === 1 && solo[0].id === 'cabin', 'only the cabin when no node is alive');
const tres = M.estado({ nodes: [{ id: 'atlantis' }, { id: 'risen' }, { id: 'fantasma' }] });
ok(tres.map((r) => r.id).join() === 'cabin,atlantis,risen', 'the three nodes in fixed order, unknown id not drawn');
ok(M.estado({ nodes: [{ id: 'atlantis' }] }).length === 2, 'a node that is not listed does not exist on the map');

// 2 · orphan_visual_node: a visible node without a lexicon key is refused (sabotage: clear the key, then restore).
const clave = M.NODES[1].clave;
M.NODES[1].clave = '';
assert.throws(() => M.estado({ nodes: [{ id: 'atlantis' }] }), /orphan_visual_node: atlantis/);
M.NODES[1].clave = clave;
ok(M.estado({ nodes: [{ id: 'atlantis' }] }).length === 2, 'key restored, the node is drawn again');

// 3 · every frame under 1,024 bytes and its sound declared, measured/NO_DATA mana, many ticks.
for (const t of [0, 1, 37, 120, 239, 240, 1000, -5]) {
  for (const mana of [undefined, { valor: 0 }, { valor: 100 }, { valor: 42.5 }]) {
    const sc = M.mapa({ t, cabin: { mana }, nodes: [{ id: 'atlantis' }, { id: 'risen' }] });
    ok(M.bytes(sc.cielo) < 1024 && M.valida(sc.cielo).length === 0, 'sky frame under 1,024 bytes at t=' + t);
    for (const node of sc.nodes) {
      ok(M.bytes(node.frame) < 1024, node.id + ' frame under 1,024 bytes at t=' + t);
      ok(M.valida(node.frame).length === 0, node.id + ' frame obeys the law at t=' + t);
    }
  }
}

// 4 · sound comes from the frame's own data: every bubble carries its sea wave; a measured mana adds a second wave;
// NO_DATA adds no wave and says so, with its cause, in the sentence the reader sees.
const waves = (f) => f.atoms[0].i.filter((x) => x.o === 'wave').length;
const medido = M.marco(M.estado({ nodes: [], cabin: { mana: { valor: 60 } } })[0], 0);
ok(medido.sound === 'ok' && waves(medido) === 2, 'measured mana adds its own wave on top of the sea wave');
const sinDato = M.marco(M.estado({ nodes: [] })[0], 0);
ok(sinDato.sound === 'ok' && waves(sinDato) === 1, 'no measure: the sea wave still sounds, and no mana wave is invented');
ok(/mana NO_DATA \(no mana measurement/.test(sinDato.atoms[0].r), 'no measure: the sentence says NO_DATA with its cause');

// 4b · terrain field: 19 hex cells, every frame under 1,024 bytes, the same bytes on every call, no node key.
const campo = M.terreno({ nodes: [] });
ok(campo.length === 19, 'terrain field has 19 hex cells');
ok(campo.every((c) => M.bytes(c.frame) < 1024 && M.valida(c.frame).length === 0), 'every terrain frame under 1,024 bytes and obeys the law');
ok(JSON.stringify(M.terreno({ nodes: [] })) === JSON.stringify(campo), 'terrain is the same bytes on every call');
ok(!campo.some((c) => /^node\./.test(c.frame.atoms[0].k)), 'no terrain cell carries a node key');

// 5 · palette is a function of the tick alone: periodic, integer, night at midnight, day at noon.
for (let t = -300; t < 300; t += 7) {
  ok(M.paleta(t).cielo === M.paleta(t + M.CYCLE).cielo && M.paleta(t).tinta === M.paleta(t + M.CYCLE).tinta, 'palette periodic at t=' + t);
}
ok(M.paleta(0).dia === 0 && M.paleta(M.CYCLE / 2).dia === 256, 'midnight is night (0), noon is day (256)');
ok(M.paleta(0).cielo === '#17131f', 'night sky is the house theme colour');

// 6 · sabotage: a wall clock in the palette would change its output. Poison Date and prove the output does not move.
const antes = enDos(M.mapa({ t: 77, nodes: [{ id: 'risen' }] }));
const DateOriginal = globalThis.Date, nowOriginal = Date.now;
globalThis.Date = class extends DateOriginal { constructor() { super(); throw new Error('clock read in render path'); } };
Date.now = () => { throw new Error('clock read in render path'); };
let despues;
try { despues = enDos(M.mapa({ t: 77, nodes: [{ id: 'risen' }] })); }
finally { globalThis.Date = DateOriginal; Date.now = nowOriginal; }
ok(antes === despues, 'the scene reads no clock (Date poisoned, same bytes)');

// 7 · n=2 byte-identical: the same vector, two runs, the same bytes and the same hash.
const vector = { t: 120, cabin: { mana: { valor: 60 } }, nodes: [{ id: 'atlantis', mana: { valor: 12 } }, { id: 'risen' }] };
const corrida1 = enDos(M.mapa(vector)), corrida2 = enDos(M.mapa(vector));
ok(corrida1 === corrida2, 'n=2 byte-identical scenes');
ok(M.hash32(corrida1) === M.hash32(corrida2), 'n=2 identical hash');

// 8 · the hash detector goes red when a bitmap hash changes without a state change (sabotage: jitter one frame).
const receta = (scene) => scene.nodes.map((x) => M.hash32(enDos(x.frame))).join(':');
const base = receta(M.mapa(vector));
const jitter = M.mapa(vector);
jitter.nodes[0].frame.atoms[0].i[0].lw = 3.0001;
ok(receta(jitter) !== base, 'a changed frame moves the hash (the detector can go red)');
ok(receta(M.mapa(vector)) === base, 'no state change, no hash change');

// 9 · visible changes travel as frames: a node that appears and one that leaves, each under 1,024 bytes.
const cam = M.cambios({ nodes: [] }, { nodes: [{ id: 'atlantis' }] }, 5);
ok(cam.length === 1 && /appears/.test(cam[0].change[0]) && M.bytes(cam[0]) < 1024, 'appearance is one frame');
const sale = M.cambios({ nodes: [{ id: 'risen' }] }, { nodes: [] }, 5);
ok(sale.length === 1 && /leaves/.test(sale[0].change[0]), 'a fallen node leaves as one frame, with no placeholder');

// 10 · grep gate: the render path reads no clock, no random, no network. Sabotage: a synthetic file must go red.
const PROHIBIDO = /Math\.random|Date\.now|new Date\(|performance\.now|\bfetch\(|XMLHttpRequest/;
const sinProhibidos = (texto) => !PROHIBIDO.test(texto);
ok(sinProhibidos(readFileSync(RAIZ + 'public/game/global_map.js', 'utf8')), 'global_map.js has no clock, random or network');
ok(!sinProhibidos('const x = Math.random();'), 'sabotage: a Math.random in the render path is caught');

console.log('mapa global cases: ' + n + '/' + n);
