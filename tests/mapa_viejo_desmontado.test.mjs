import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const sizes = [
  'public/assets/atlas-piso.js',
  'public/assets/atlas-guardado.js',
  'public/assets/thegame.js',
  'public/sw-listas.js',
  'public/game/casa-medidas.js',
  'public/assets/atlas-opina.js',
  'public/assets/terminal_menu_shell.js',
  'public/assets/atlas.css',
  'public/assets/thegame.css',
  'public/assets/base.css'
];

test('the old map script is absent from startup and the offline cache', () => {
  assert.doesNotMatch(read('public/assets/thegame.js'), /\['atlas-mapa\.js'\]/);
  assert.doesNotMatch(read('public/assets/thegame.js'), /['"]atlas-mapa\.css['"]/);
  assert.doesNotMatch(read('public/sw-listas.js'), /\/assets\/atlas-mapa\.(?:js|css)/);
});

test('the old canvas is not mounted or called from game replay', () => {
  assert.doesNotMatch(read('public/assets/atlas-piso.js'), /AtlasMapa\.monta/);
  assert.doesNotMatch(read('public/assets/atlas-piso.js'), /atlas-mapa|atlas-lienzo|atlas-sector/);
  assert.doesNotMatch(read('public/assets/atlas-guardado.js'), /AtlasMapa\.visitas/);
});

test('the new map remains the map view and painter', () => {
  assert.match(read('public/game/ui-arena.js'), /AtlasMar\.crea/);
  assert.match(read('public/game/mar.js'), /AtlasMapNodes\.pinta/);
});

test('obsolete map selector fallbacks are removed while the shared panel remains', () => {
  assert.doesNotMatch(read('public/assets/thegame.js'), /\.atlas-mapa/);
  assert.doesNotMatch(read('public/game/casa-medidas.js'), /\.atlas-mapa/);
  assert.match(read('public/assets/atlas-opina.js'), /#atlas-piso \.atlas-alerta/);
  assert.match(read('public/assets/terminal_menu_shell.js'), /#atlas-piso/);
  assert.doesNotMatch(read('public/assets/atlas-opina.js'), /#atlas-piso \.atlas-mapa/);
});

test('remaining styles do not target the removed map panel', () => {
  assert.doesNotMatch(read('public/assets/atlas.css'), /\.atlas-mapa/);
  assert.doesNotMatch(read('public/assets/thegame.css'), /\.atlas-mapa/);
  assert.doesNotMatch(read('public/assets/base.css'), /\.atlas-mapa/);
});

test('the panel and every touched file stay under the declared ceiling', () => {
  assert.match(read('public/assets/atlas-piso.js'), /AtlasJuego/);
  for (const path of sizes) assert.ok(statSync(path).size < 16384, path + ' exceeds file ceiling');
});
