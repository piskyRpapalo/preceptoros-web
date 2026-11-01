// Decreto p0 (buzon#30 · 6557670225, 2026-11-01): hasta que los PCs del rack se desplieguen con la app, la web no
// nombra «Atlantis» ni «the Risen» (ni su aspecto «zombie»), y no ofrece el «shared map». Esta guarda lee cada
// fichero servido bajo public/ (comentarios incluidos) y falla si alguno lo nombra. retirados/ y la historia de git
// sí lo conservan: son el recibo, no se sirven. Uso: node --test atlas/nombres_retirados_casos.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const PROHIBIDO = /atlantis|risen|zombie|shared map/gi;
const ficheros = (dir, out = []) => {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? ficheros(p, out) : out.push(p); }
  return out;
};

test('ningún fichero servido bajo public/ nombra Atlantis, the Risen, zombie ni el shared map', () => {
  const hallazgos = [];
  let leidos = 0;
  for (const p of ficheros(PUBLIC)) {
    const b = readFileSync(p);
    if (b.includes(0)) continue;               // binario: imágenes y fuentes no llevan texto que nombre nada
    leidos += 1;
    b.toString('utf8').split('\n').forEach((linea, i) => {
      const m = linea.match(PROHIBIDO);
      if (m) hallazgos.push(relative(PUBLIC, p) + ':' + (i + 1) + ' · ' + [...new Set(m.map((x) => x.toLowerCase()))].join(', '));
    });
  }
  assert.ok(leidos > 50, 'la guarda leyó ' + leidos + ' ficheros de texto: demasiado pocos para ser public/');
  assert.deepEqual(hallazgos, [], 'nombres retirados por el decreto p0 siguen servidos:\n' + hallazgos.join('\n'));
});
