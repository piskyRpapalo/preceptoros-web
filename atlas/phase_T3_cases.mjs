import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const digest = b => createHash('sha256').update(b).digest('hex');
const baseline = 'e8a92e1d4fe223929f1cf2afb5f234a6ae593282cefc8efffdfd68a5cb8a5040'; /* updated 2026-10-19: rar_magico 'Magic' -> 'Uncommon' (banned word out of the UI); measured from the gate itself */
const protectedFiles = { /* hashes actualizados 2026-10-16 por D1-laws: los comentarios salieron del codigo (canon en docs/); la logica intacta */
  'public/game/valores.js': 'a6b8358b3c22363899644c7df6ffa0c2df15fb1fcd53bf2205f11d5a44ff47df',
  'public/assets/atlas-motor.js': 'c31c2b2e51df15707242bbc5d8d80bf1801fce51764d472dd4bcdb15903a0051',
  'public/game/gacha.js': 'f98302cf4f59f281b1ee2bdd90715c576a4630ec42316231191d4fba266d403c',
  'public/game/core.js': 'f7f126fde151931830f772be35aecdd84fa97f7c5be4b257f80d9674a66f6a0d',
  // D1 asunto 12: ui-invoca.js 4,907 -> 4,151 B (-756 B), comment-only reduction; digest measured by this gate.
  'public/game/ui-invoca.js': 'dffdfffb5d57f579d1e4e025ca9bb9568d5d1844ab92824154b0aecbb69b4147'};
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
  assert(readFileSync(new URL('public/assets/thegame.js',root),'utf8').includes("T('army_carga')"));
  console.log(JSON.stringify(report));
}
