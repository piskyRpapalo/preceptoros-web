import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const digest = b => createHash('sha256').update(b).digest('hex');
const baseline = 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939';
const protectedFiles = {
  'public/game/valores.js': '8892267206e4328ae9873b016c3c1d07eacab776bbb6614ed1df1d8c254a2e29',
  'public/assets/atlas-motor.js': '16e50ed537c5d6898815a2711a22dc3d7497d4e0a3cd6a0bae013241822e11c9',
  'public/game/gacha.js': 'b2a2d0e134576d913b3a30ccaf539532e4377d423c4211aceb1bc211081d11cc',
  'public/game/core.js': '1141d77af50dbdce03bbbddef11549683929685dee3de711b6434a7a5ffe8430',
  'public/game/ui-invoca.js': 'da62b8197243d464e54ca3e966af2e98bf6ba137548ba78c340176a5ee729295'
};
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
