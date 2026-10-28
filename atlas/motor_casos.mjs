// Casos deterministas del motor de theGame. Los ejecuta `atlas/test_atlas.py`:
//     node atlas/motor_casos.mjs   -> una linea JSON: [{caso, ok, detalle}]
// El motor es puro: sin navegador, sin reloj, sin red. Mismo estado, mismo resultado.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${a} != ${b}`;
const lanza = (fn) => { try { fn(); return 'no lanzo'; } catch (e) { return true; } };
const DIA = '2026-09-26';



// 1 · curva XP OSRS









// 2 · reparacion









// 3 · mientras dormias, tope 24 h
const H = 3600000;





// 4 · profundidad y oxigeno





// 5 · eventos atlas.evento/1
const CAMPOS = 'contenido_v,dia,esquema,mision,nota,profundidad,resultado,sector,tipo,valoracion';





// 6 · M18-B (opcion B firmada el 2026-10-11; los casos M18-bis que fijaban el espectro viejo se rompen A
// PROPOSITO y se reescriben). La puerta de M18: una onda de 7 ARISTAS (7 lobulos medidos), todos sus k
// cumplen k = 1 (mod 7). Semilla medida el 2026-10-11: sha256('m18b-14'), la primera de esa serie que da 7
// aristas en tc4 con todos sus armonicos de detalle vivos (amplitud > 0).
const G = require('../public/game/gacha.js');
const SEM7 = 'f8f7efb6a1b32b0878d0a7bb5a588a3d20844971bdd7aa0f157c1a822e9597e0';
const ARM7 = '[[1,24,24,0],[-6,16,16,44],[15,4,4,40],[-20,1,1,4]]';
const huella = (x) => require('crypto').createHash('sha256').update(JSON.stringify(x)).digest('hex');
caso('M18-B: la semilla medida da 7 aristas (magico, 4 terminos) y se dibujan 7 lobulos', () => {
  const t = G.tirada(SEM7, 'tc4');
  return igual(`${t.aristas}|${t.rareza}|${t.armonicos.length}|${G.aristas(t)}`, '7|magico|4|7');
});
caso('M18-B: 7 ejes de giro, todo k = 1 (mod 7)', () => {
  const ks = G.tirada(SEM7, 'tc4').armonicos.map((h) => h[0]);
  return ks.every((k) => ((k % 7) + 7) % 7 === 1) || `k fuera de la simetria: ${ks}`;
});
caso('M18: el espectro medido hoy no cambia (misma semilla, mismo byte en cualquier maquina)', () =>
  igual(JSON.stringify(G.tirada(SEM7, 'tc4').armonicos), ARM7));
caso('M18: dos corridas identicas, sha256 identico (divergencia 0)', () =>
  igual(huella(G.tirada(SEM7, 'tc4')), huella(G.tirada(SEM7, 'tc4'))));
caso('M18: la tirada sale del motor y se sella medido', () => igual(G.tirada(SEM7, 'tc4').campo_origen, 'medido'));
caso('M18: medido (o sin campo, tropas viejas) se dibuja con el espectro completo', () => {
  const t = G.tirada(SEM7, 'tc4'), v = Object.assign({}, t);
  delete v.campo_origen;
  return igual(`${JSON.stringify(G.espectro(t))}|${JSON.stringify(G.espectro(v))}`, `${ARM7}|${ARM7}`);
});
caso('M18: emulado conserva los dos primeros terminos y desvanece los altos (niebla)', () => {
  const t = Object.assign({}, G.tirada(SEM7, 'tc4'), { campo_origen: 'emulado' });
  const e = G.espectro(t), a = t.armonicos;
  if (e.length !== a.length) { return 'cambia el numero de terminos'; }
  if (JSON.stringify(e.slice(0, 2)) !== JSON.stringify(a.slice(0, 2))) { return 'toco los terminos bajos'; }
  for (let i = 2; i < e.length; i++) {
    if (e[i][0] !== a[i][0] || e[i][3] !== a[i][3]) { return `toco k o fase en ${i}`; }
    if (!(Math.abs(e[i][1]) < Math.abs(a[i][1]) || a[i][1] === 0)) { return `no desvanecio ax en ${i}`; }
  }
  return true;
});
caso('M18: el espectro emulado es determinista y no muta la tropa', () => {
  const t = Object.assign({}, G.tirada(SEM7, 'tc4'), { campo_origen: 'emulado' });
  const a = huella(G.espectro(t)), b = huella(G.espectro(t));
  return (a === b && JSON.stringify(t.armonicos) === ARM7) || 'diverge o muta';
});
caso('M18: un campo_origen desconocido no se adivina: se rechaza', () => lanza(() =>
  G.espectro(Object.assign({}, G.tirada(SEM7, 'tc4'), { campo_origen: 'inventado' }))));

console.log(JSON.stringify(casos));
