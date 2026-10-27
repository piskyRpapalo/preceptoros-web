import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const digest = b => createHash('sha256').update(b).digest('hex');
const baseline = 'e8a92e1d4fe223929f1cf2afb5f234a6ae593282cefc8efffdfd68a5cb8a5040'; /* updated 2026-10-19: rar_magico 'Magic' -> 'Uncommon' (banned word out of the UI); measured from the gate itself */
const protectedFiles = { /* hashes actualizados 2026-10-16 por D1-laws: los comentarios salieron del codigo (canon en docs/); la logica intacta */
  // armi 30 (web#278): army_tope 60->30; pin re-medido por el gate el 2026-10-23.
  // [W] O2 (2026-10-27, REQUIERE_FIRMA bajo el decreto O1..O5): voz del duelo (voz_hz, acorde, acorde_paso); pins re-medidos.
  // [W] O3 (2026-10-27, REQUIERE_FIRMA bajo el decreto O1..O5): pulso_grosor_max gana su lector (fila semantica); pin re-medido.
  'public/game/valores.js': '5b9ef910a40a4c4284f89062f1553db674382c41d0d9539ed272d1ceaf341d66',
  'public/assets/atlas-motor.js': 'c31c2b2e51df15707242bbc5d8d80bf1801fce51764d472dd4bcdb15903a0051',
  'public/game/gacha.js': 'f98302cf4f59f281b1ee2bdd90715c576a4630ec42316231191d4fba266d403c',
  'public/game/core.js': '94c30db677f51ac1b52b1cbe58e9c3d73a07961eee4b74e458798d7a1aa456e7',
  // G5b: awaited device commit and serialized invocations; original D1 digest remains in Git history.
  'public/game/ui-invoca.js': '33ef891f7a434ab9845e6b077d9038e52bcb3f3b2e865a3144f0bf7a79f9984b'};
function validate(raw, files) {
  assert(raw.length < 16384, '[T3_SIZE]');
  const v = JSON.parse(raw);
  assert.equal(raw.toString(), JSON.stringify(v) + '\n', '[T3_COMPACT]');
  assert.equal(v.ui.inc_h, 'WavesCraft', '[T3_LABEL_INC_H]');
  assert.equal(v.ui.army_carga, 'Opening WavesCraft…', '[T3_LABEL_ARMY]');
  assert(!JSON.stringify(v).includes('Forest Incubator'), '[T3_OLD_LABEL]');
  const reverted = structuredClone(v);
  reverted.ui.inc_h = 'Forest Incubator';
  reverted.ui.army_carga = 'Opening the Forest Incubator…';
  assert.equal(digest(JSON.stringify(reverted)), baseline, '[T3_DELTA]');
  for (const [file, hash] of Object.entries(protectedFiles)) {
    assert.equal(digest(files[file]), hash, '[T3_PROTECTED:' + file + ']');
  }
  return { piece:'T3', bytes:raw.length, object_sha256:digest(JSON.stringify(v)),
    bytes_sha256:digest(raw), reverted_object_sha256:digest(JSON.stringify(reverted)) };
}
const attacks = {inc_h:'T3_LABEL_INC_H', army:'T3_LABEL_ARMY', third:'T3_DELTA', compact:'T3_COMPACT', size:'T3_SIZE'};
Object.keys(protectedFiles).forEach((file, i) => { attacks['protected-' + i] = 'T3_PROTECTED:' + file; });
if (process.argv.includes('--sabotages')) {
  for (const [attack, invariant] of Object.entries(attacks)) {
    const p = spawnSync(process.execPath, [new URL(import.meta.url).pathname, '--sabotage=' + attack], {encoding:'utf8'});
    assert.equal(p.status, 1, attack + ': expected red');
    assert(p.stderr.includes('[' + invariant + ']'), attack + ': wrong failure: ' + p.stderr);
    console.log(JSON.stringify({attack,red:true,invariant}));
  }
} else {
  let raw = readFileSync(new URL('public/atlas-en.json', root));
  const files = Object.fromEntries(Object.keys(protectedFiles).map(f => [f, readFileSync(new URL(f, root))]));
  const attack = process.argv.find(a => a.startsWith('--sabotage='))?.split('=')[1];
  if (attack) {
    assert(Object.hasOwn(attacks, attack), 'unknown sabotage');
    const v = JSON.parse(raw);
    if (attack === 'inc_h') v.ui.inc_h = 'Forest Incubator';
    if (attack === 'army') v.ui.army_carga = 'Opening the Forest Incubator…';
    if (attack === 'third') v.ui.cobre = 'altered fixture';
    raw = Buffer.from(JSON.stringify(v) + '\n');
    if (attack === 'compact') raw = Buffer.concat([raw, Buffer.from('\n')]);
    if (attack === 'size') raw = Buffer.concat([raw, Buffer.alloc(16384, 32)]);
    if (attack.startsWith('protected-')) {
      const file = Object.keys(protectedFiles)[Number(attack.split('-')[1])];
      files[file] = Buffer.concat([files[file], Buffer.from('\n')]);
    }
  }
  const report = validate(raw, files);
  assert(readFileSync(new URL('public/game/ui.js',root),'utf8').includes("T('inc_h')"));
  // NORTE 5 [3] (2026-10-27): thegame.js (the loader that printed army_carga) left; the label stays pinned in atlas-en.json above.
  console.log(JSON.stringify(report));
}
