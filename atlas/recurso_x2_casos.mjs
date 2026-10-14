// Q4 · compara una corrida determinista completa con el ritmo firmado.
// 1.000 ciclos = 1.000 s. El piloto medido antes producía 400 cobre;
// la orden duplica el flujo a 800 sin cambiar costes ni semilla.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../public/assets/atlas-motor.js');
const ley = M.leyes({ pruebas_web: 171, arnes_sw: '22/22', gzip_juego_b: 90385 });
let e = M.inicial(ley);
for (let i = 0; i < 1000; i++) e = M.ciclo(e, ley);
let tirada = M.inicial(ley);
while (tirada.cobre < 50 && tirada.t < 10000) tirada = M.ciclo(tirada, ley);
const ok = e.t === 1000 && e.cobre === 800 && tirada.t === 63;
console.log(JSON.stringify({ ciclos: e.t, segundos: e.t * M.CICLO_MS / 1000, cobre: e.cobre,
  esperado: 800, cobre_por_ciclo: e.cobre / e.t,
  ciclos_para_50_cobre: tirada.t, segundos_por_cobre: tirada.t * M.CICLO_MS / 1000 / 50, ok }));
if (!ok) process.exitCode = 1;
