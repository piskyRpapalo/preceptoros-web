import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Norte 7 D (decision D2, 2026-10-28): this contract belonged to the /play/ game, retired together with its page.
// Retirement guard (old_map_dismantled pattern): the file does not come back and is not precached.

const RETIRED = [
  'public/assets/thegame.js',
  'public/assets/thegame.css',
  'public/assets/atlas-piso.js',
  'public/assets/atlas-guardado.js',
  'public/assets/atlas-opina.js',
  'public/assets/terminal_menu_shell.js',
  'public/assets/atlas.css',
  'public/assets/base.css',
  'public/game/casa-medidas.js'
];

test('the retired game files are absent from the tree', () => {
  assert.deepEqual(RETIRED.filter(p => existsSync(p)), []);
});

test('the service worker does not precache them', () => {
  const sw = readFileSync('public/sw-listas.js', 'utf8');
  for (const p of RETIRED) {
    assert.equal(sw.includes("'/" + p.replace(/^public\//, '') + "'"), false, p);
  }
});
