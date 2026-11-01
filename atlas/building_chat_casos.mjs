// P6 · casos del chatbot de edificio (public/game/building_chat.js). Uso: node --test atlas/building_chat_casos.mjs
// Cada tipo del catálogo (AtlasEdificios.FORMAS) y la cabaña tienen guion; cada línea es un marco < 1.024 B con texto;
// la intención desconocida es NO_DATA con la causa de chunk_router.js; mismo texto, mismo marco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../public/game/building_chat.js');
const E = require('../public/game/colonia_edificios.js');
const F = require('../public/game/state_frames.js');
const R = require('../public/game/chunk_router.js');

// Un edificio de cada forma (el id decide la forma) y el de la cabaña.
function muestras() {
  const out = [{ id: 'b-cabin', node: 'cabin' }];
  for (const forma of E.FORMAS) {
    for (let i = 0; i < 200; i++) { const id = 'b-' + i; if (E.formaDe(id) === forma) { out.push({ id, node: 'n-' + i }); break; } }
  }
  return out;
}

test('cada forma del catálogo y la cabaña tienen guion', () => {
  for (const k of [...E.FORMAS, 'cabin']) { assert.ok(C.KINDS.includes(k), 'sin guion: ' + k); }
  assert.equal(muestras().length, E.FORMAS.length + 1);
  for (const b of muestras()) { assert.equal(C.opening(b).length, 3); }
});

test('todas las líneas son marcos válidos bajo 1.024 B con texto', () => {
  for (const b of muestras()) {
    const marcos = [...C.opening(b), ...C.INTENTS.map((i) => C.reply(b, i, R)), C.reply(b, 'zzz', R)];
    for (const m of marcos) {
      assert.deepEqual(F.valida(m), [], JSON.stringify(m).slice(0, 80));
      assert.ok(Buffer.byteLength(JSON.stringify(m), 'utf8') < 1024);
      assert.ok(m.atoms[0].r.trim().length > 0);
    }
  }
});

test('intención desconocida = NO_DATA con la causa del router', () => {
  const b = { id: 'b-cabin', node: 'cabin' };
  const m = C.reply(b, 'tell me a poem', R);
  assert.equal(m.atoms[0].r, R.responde('tell me a poem', null).causa);
  assert.equal(m.atoms[0].r, 'NO_DATA · model_not_installed');
  assert.equal(m.seal, 'NO_DATA');
  assert.equal(C.reply(b, 'tell me a poem', null).atoms[0].r, 'NO_DATA · router_not_loaded');
  assert.equal(C.reply(b, 'help', R).seal, 'LIVE');
});

test('determinismo: mismo edificio y texto, mismo marco; sin Math.random ni Date', async () => {
  for (const b of muestras()) {
    assert.deepEqual(C.opening(b), C.opening(b));
    assert.deepEqual(C.reply(b, 'what is this', R), C.reply(b, 'what is this', R));
  }
  const fuente = (await import('node:fs')).readFileSync(new URL('../public/game/building_chat.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\b/.test(fuente));
});
