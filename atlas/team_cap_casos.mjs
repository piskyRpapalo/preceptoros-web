// Q7 sabotage: the signed team ceiling, wire schemas and tutorial must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const V = require('../public/game/valores.js');
const fail = [];
if (V.combate.tropas_max !== 10) fail.push(`team cap is ${V.combate.tropas_max}, expected 10`);
for (const name of ['atlas_defensa_schema.json', 'atlas_asalto_schema.json']) {
  const s = JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url)));
  if (s.properties.tropas.maxItems !== 10) fail.push(`${name} accepts ${s.properties.tropas.maxItems}, expected 10`);
}
const context = { module: { exports: {} }, AtlasValores: V, setInterval: null };
vm.runInNewContext(fs.readFileSync(new URL('../public/game/genesis_tutorial.js', import.meta.url), 'utf8'), context);
const T = context.module.exports;
if (!T.hazPaso || !T.hazPaso(T.PASOS.find((p) => p.id === 'fight')).includes('10 waves')) fail.push('tutorial does not teach the 10-wave team cap');
assert.deepEqual(fail, [], fail.join('; '));
console.log(JSON.stringify({ cap: V.combate.tropas_max, schemas: 2, tutorial: true, fallos: fail }));
