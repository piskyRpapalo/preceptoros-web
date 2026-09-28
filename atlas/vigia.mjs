// preceptoros.org · theGame · el VIGIA del peso: cuanto margen queda antes de que la ley del mundo
// doble el dano de la grieta.
//
//     node atlas/vigia.mjs                          # mira public/atlas-mundo.json
//     node atlas/vigia.mjs otro-mundo.json
//
// EL UMBRAL NO SE ESCRIBE AQUI: se le pregunta al motor (`leyes`). Se busca, por biseccion, el primer
// `gzip_juego_b` que dobla el dano con el arnes en verde; si la ley cambia, el vigia cambia con ella.
// Sale con 1 si el mundo medido ya dana mas de lo neutro (por peso o por arnes) y con 0 si no.
// Avisa si quedan menos de 1 KB. Determinista, sin red, sin LLM. Lo corre cada dia `vigia.yml`.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const M = require('../public/assets/atlas-motor.js');
const MUNDO = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'atlas-mundo.json');
const AVISO_B = 1024;

// El primer peso que dobla el dano, o null si la ley ya no depende del peso.
export function umbral() {
  const dano = (g) => M.leyes({ gzip_juego_b: g, arnes_sw: '1/1' }).dano;
  const neutro = dano(0);
  let lo = 0, hi = 2 ** 30;
  if (dano(hi) === neutro) { return null; }
  while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (dano(m) > neutro) { hi = m; } else { lo = m; } }
  return hi;
}

export function vigia(mundo) {
  const u = umbral(), g = mundo && mundo.gzip_juego_b;
  const neutro = M.leyes({ gzip_juego_b: 0, arnes_sw: '1/1' }).dano, dano = M.leyes(mundo).dano;
  const margen = u === null || !Number.isInteger(g) ? null : u - 1 - g;
  return {
    ok: dano <= neutro, dano, dano_neutro: neutro,
    gzip_juego_b: Number.isInteger(g) ? g : 'NO_DATA', umbral_b: u === null ? 'NO_DATA' : u,
    margen_b: margen === null ? 'NO_DATA' : margen, arnes_sw: (mundo && mundo.arnes_sw) || 'NO_DATA',
    aviso: margen !== null && margen < AVISO_B
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let r;
  try { r = vigia(JSON.parse(readFileSync(process.argv[2] || MUNDO, 'utf8'))); }
  catch (x) { r = { ok: false, motivo: 'lectura: ' + x.message }; }
  process.stdout.write(JSON.stringify(r) + '\n');
  if (process.env.GITHUB_ACTIONS) {
    if (!r.ok) { console.log(`::error::la grieta dana x${r.dano || '?'}: peso ${r.gzip_juego_b} B, arnes ${r.arnes_sw}`); }
    else if (r.aviso) { console.log(`::warning::quedan ${r.margen_b} B antes de que el peso doble el dano de la grieta`); }
  }
  process.exit(r.ok ? 0 : 1);
}
