// Corte D (2026-10-28): el lexicon de theGame (atlas-en.json) y sus etiquetas se retiraron con el juego.
// Lo que queda vivo: los hashes de los ficheros que comparte el juego y sostienen /face/ (valores, gacha, core).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const digest = b => createHash('sha256').update(b).digest('hex');
const protectedFiles = {
  'public/game/valores.js': '5b9ef910a40a4c4284f89062f1553db674382c41d0d9539ed272d1ceaf341d66',
  'public/game/gacha.js': 'f98302cf4f59f281b1ee2bdd90715c576a4630ec42316231191d4fba266d403c',
  'public/game/core.js': '94c30db677f51ac1b52b1cbe58e9c3d73a07961eee4b74e458798d7a1aa456e7'
};
function validate(files) {
  assert(!existsSync(new URL('public/atlas-en.json', root)), '[T3_LEXICON_RETIRADO] el lexicon de theGame volvio');
  for (const [file, hash] of Object.entries(protectedFiles)) {
    assert.equal(digest(files[file]), hash, '[T3_PROTECTED:' + file + ']');
  }
  return { piece: 'T3', protegidos: Object.keys(protectedFiles).length, retirado: 'lexicon atlas-en.json (corte D)' };
}
const attacks = {};
Object.keys(protectedFiles).forEach((file, i) => { attacks['protected-' + i] = 'T3_PROTECTED:' + file; });
if (process.argv.includes('--sabotages')) {
  for (const [attack, invariant] of Object.entries(attacks)) {
    const p = spawnSync(process.execPath, [new URL(import.meta.url).pathname, '--sabotage=' + attack], { encoding: 'utf8' });
    assert.equal(p.status, 1, attack + ': expected red');
    assert(p.stderr.includes('[' + invariant + ']'), attack + ': wrong failure: ' + p.stderr);
    console.log(JSON.stringify({ attack, red: true, invariant }));
  }
} else {
  const files = Object.fromEntries(Object.keys(protectedFiles).map(f => [f, readFileSync(new URL(f, root))]));
  const attack = process.argv.find(a => a.startsWith('--sabotage='))?.split('=')[1];
  if (attack) {
    assert(Object.hasOwn(attacks, attack), 'unknown sabotage');
    const f = Object.keys(protectedFiles)[Number(attack.split('-')[1])];
    files[f] = Buffer.concat([files[f], Buffer.from('\n')]);
  }
  console.log(JSON.stringify(validate(files)));
}
