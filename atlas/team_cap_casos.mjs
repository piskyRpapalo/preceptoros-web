// Q7 sabotage: the signed team ceiling and the wire schemas must agree. (Corte D, 2026-10-28: el tutorial
// genesis_tutorial.js se retiro con el juego; su comprobacion sale con el.)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require('../public/game/valores.js');
const fail = [];
if (V.combate.tropas_max !== 10) fail.push(`team cap is ${V.combate.tropas_max}, expected 10`);
for (const name of ['atlas_defensa_schema.json', 'atlas_asalto_schema.json']) {
  const s = JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url)));
  if (s.properties.tropas.maxItems !== 10) fail.push(`${name} accepts ${s.properties.tropas.maxItems}, expected 10`);
}
assert.deepEqual(fail, [], fail.join('; '));
console.log(JSON.stringify({ cap: V.combate.tropas_max, schemas: 2, fallos: fail }));
