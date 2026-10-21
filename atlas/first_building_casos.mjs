import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const M = require('../public/game/en301_tutorial_model.js');
const B = require('../public/game/en301_tutorial_building.js');
const E = require('../public/game/etiqueta.js');
const T = require('../public/game/tutorial_fases.js');
let state = T.elige(T.inicia(), 'niebla').estado;
for (const event of ['pulso', 'disipa', 'arena101', 'recompensa', 'campamento']) {
  const result = M.advance(state, {event}, {practiceVerified: true});
  assert.equal(result.ok, true); state = result.estado;
}
const source = B.measure('radio');
const label = E.etiqueta(JSON.parse(source.etiqueta));
const advance = value => M.advance(state, {event: 'primer_edificio'}, {label: value});
assert.equal(advance(label).ok, true);
assert.equal(advance(label).estado.red, false);
assert.equal(advance(label).estado.paso, 'cartas');
const bare = E.etiqueta({title: 'Practice', rag_base_prompt: 'Explain this building.'});
assert.equal(advance(bare).ok, false, 'a title and prompt alone must not count as measured');
for (const change of [x => delete x.mesuras, x => x.mesuras.touch_px = 0,
  x => x.mesuras.tiles = [1, 99], x => x.source = 'unknown', x => x.authority = true]) {
  const altered = JSON.parse(label.texto); change(altered);
  assert.equal(advance(E.etiqueta(altered)).ok, false);
}
const prepared = M.prepareLabel({title: 'My radio', rag_base_prompt: 'Explain the measured contract.'}, label);
assert.equal(advance(prepared).ok, true);
assert.ok(label.bytes < 1024);
if (process.argv.includes('--sabotage')) assert.equal(advance(bare).ok, true, 'injected false completion');
console.log(JSON.stringify({checks: 16, label_bytes: label.bytes,
  sha256: createHash('sha256').update(label.texto).digest('hex')}));
