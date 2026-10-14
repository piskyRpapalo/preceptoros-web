// Q5: el motor gobierna el retorno por ciclos y la grieta declara su efecto económico.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../public/assets/atlas-motor.js');
const R = require('../public/game/aiact-art50-state-radio.js');
const ley = M.leyes({ pruebas_web: 172, arnes_sw: '22/22', gzip_juego_b: 90432 });
const fallos = [];
function simula(abierta, n) {
  let e = M.inicial(ley);
  e.abierta = abierta;
  e.cierre = abierta ? 0 : n + 1;
  for (let i = 0; i < n; i++) e = M.ciclo(e, ley);
  return e;
}
const abierta = simula(true, 1000);
const sellada = simula(false, 1000);
if (abierta.cobre !== 400) fallos.push(`open rift should produce base 1x: ${abierta.cobre}`);
if (sellada.cobre !== 800) fallos.push(`sealed rift should retain Q4 2x: ${sellada.cobre}`);

let e = M.inicial(ley);
for (let i = 0; i < 40; i++) e = M.ciclo(e, ley);
e = M.reparar(e, '2026-10-14');
const remaining = e.cierre;
for (let i = 0; i < remaining - 1; i++) e = M.ciclo(e, ley);
if (e.abierta || e.cierre !== 1) fallos.push(`rift reopened before the final cycle: ${e.abierta}/${e.cierre}`);
e = M.ciclo(e, ley);
if (!e.abierta || e.cierre !== 0 || !e.avisos.includes('grieta')) fallos.push('rift did not reopen on its final game cycle');

const base = { esquema: 'atlas.instantanea/1', ciclo: 10, fase: 1, profundidad: 100,
  integridad: 100, integridad_max: 117, nivel_nucleo: 1,
  recursos: { cobre: 3, luz: 2, biomasa: 1, oxigeno: 280 }, grieta: { abierta: true, cierre: 0 } };
const rb = R.boletin(base);
if (!rb.includes('Resource gain: base (1x)')) fallos.push(`radio omitted open-rift rate: ${rb}`);
base.grieta = { abierta: false, cierre: 120 };
const rs = R.boletin(base);
if (!rs.includes('Resource gain: doubled (2x)')) fallos.push(`radio omitted sealed-rift rate: ${rs}`);
console.log(JSON.stringify({ abierta_cobre_1000: abierta.cobre, sellada_cobre_1000: sellada.cobre,
  ciclos_reapertura: remaining, estado_final_abierta: e.abierta, radio_abierta: rb, radio_sellada: rs,
  fallos, ok: fallos.length === 0 }));
process.exitCode = fallos.length ? 1 : 0;
