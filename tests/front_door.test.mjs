import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Norte 7 D (decision D2, 2026-10-28): este contrato era del juego de /play/, retirado con su pagina.
// Guarda de retirada (patron mapa_viejo_desmontado): el fichero no vuelve y no queda precacheado.

const RETIRADOS = [
  'public/game/front_door.js',
  'public/assets/front_door_view.js',
  'public/assets/front_door.css'
];

test('the retired game files are absent from the tree', () => {
  assert.deepEqual(RETIRADOS.filter(p => existsSync(p)), []);
});

test('the service worker does not precache them', () => {
  const sw = readFileSync('public/sw-listas.js', 'utf8');
  for (const p of RETIRADOS) {
    assert.equal(sw.includes("'/" + p.replace(/^public\//, '') + "'"), false, p);
  }
});
