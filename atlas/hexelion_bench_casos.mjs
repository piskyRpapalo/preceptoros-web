// RONDA 3 · payload de Hexelion (FIRMO 12-oct): las cifras son las del fichero, con su sha256; lo no medido es NO_DATA con causa.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const HB = require(process.env.HBENCH || '../public/game/hexelion_bench.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
// La ruta de la fuente NO va en el repo (guarda de higiene): se pasa por FUENTE_BENCH. Sin ella, el caso comprueba
// el formato del sha256 y declara que la comprobacion contra el fichero es NO_DATA en este checkout.
const FUENTE = process.env.FUENTE_BENCH || '';
caso('la fuente coincide con el sha256 del payload (si FUENTE_BENCH esta dado; si no, NO_DATA declarado)', () => {
  if (!FUENTE) { console.error('NO_DATA: FUENTE_BENCH no dado en este checkout (comprobado solo el formato)'); return /^[0-9a-f]{64}$/.test(HB.BENCH.fuente.sha256) || 'sha256 mal formado'; }
  let raw; try { raw = readFileSync(FUENTE); } catch (e) { return 'NO_DATA: fuente no accesible (' + e.code + ')'; }
  const h = createHash('sha256').update(raw).digest('hex');
  return h === HB.BENCH.fuente.sha256 || { payload: HB.BENCH.fuente.sha256.slice(0, 16), fichero: h.slice(0, 16) };
});
caso('ninguna cifra inventada: cada modelo es MEDIDO con cifra o NO_DATA con causa', () =>
  HB.BENCH.modelos.every((m) => (m.estado === 'MEDIDO' && typeof m.pp512_tok_s === 'number') || (m.estado === 'NO_DATA' && m.causa && m.causa.length > 5)) || HB.BENCH.modelos);
caso('la cifra que se pinta es la del fichero (embeddinggemma-2 pp512 ngl99 = 6459.63)', () => {
  const m = HB.BENCH.modelos.find((x) => x.estado === 'MEDIDO');
  return m.modelo === 'embeddinggemma-2 Q8_0' && m.pp512_tok_s === 6459.63 || m;
});
caso('el payload no pide nada a la red: sin fetch, sin XMLHttpRequest', () => !/fetch\(|XMLHttpRequest|https?:\/\//.test(readFileSync(new URL('../public/game/hexelion_bench.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')));
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
