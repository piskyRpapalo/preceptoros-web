// Casos deterministas del motor de theGame. Los ejecuta `atlas/test_atlas.py`:
//     node atlas/motor_casos.mjs   -> una linea JSON: [{caso, ok, detalle}]
// El motor es puro: sin navegador, sin reloj, sin red. Mismo estado, mismo resultado.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const M = require('../public/assets/atlas-motor.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const igual = (a, b) => a === b || `${a} != ${b}`;
const lanza = (fn) => { try { fn(); return 'no lanzo'; } catch (e) { return true; } };
const DIA = '2026-09-26';
const LEY = M.leyes({ pruebas_web: 171, arnes_sw: '24/24', gzip_juego_b: 95000 });
const hasta = (e, n) => { for (let i = 0; i < n; i++) e = M.ciclo(e, LEY); return e; };

// 1 · curva XP OSRS
[[0, 1], [82, 1], [83, 2], [1153, 9], [1154, 10], [273741, 59], [273742, 60],
 [13034430, 98], [13034431, 99], [200000000, 99]].forEach(([xp, n]) =>
  caso(`nivel(${xp}) = ${n}`, () => igual(M.nivelDesdeXp(xp), n)));
caso('xpParaNivel(2/10/99)', () => igual([M.xpParaNivel(2), M.xpParaNivel(10), M.xpParaNivel(99)].join(), '83,1154,13034431'));
caso('tabla monotona creciente', () => M.XP.every((x, i) => i === 0 || x > M.XP[i - 1]) || 'no monotona');
caso('99 niveles', () => igual(M.XP.length, 99));
caso('XP negativa rechazada', () => lanza(() => M.nivelDesdeXp(-1)));
caso('XP no entera rechazada', () => lanza(() => M.nivelDesdeXp(1.5)));
caso('nivel 100 no existe', () => lanza(() => M.xpParaNivel(100)));
caso('subeDeNivel 80+5 -> 1 a 2', () => { const r = M.subeDeNivel(80, 5); return igual(`${r.antes}>${r.despues}`, '1>2'); });

// 2 · reparacion
caso('sin cobre: no repara y evento fallo', () => {
  const e = M.reparar(M.inicial(LEY), DIA), ev = e.eventos.at(-1);
  return igual(`${e.abierta}|${ev.tipo}|${ev.resultado}`, 'true|reparar|fallo');
});
caso('con cobre: sella, cobra 10 y sube integridad', () => {
  let e = hasta(M.inicial(LEY), 40); const antes = e;
  e = M.reparar(e, DIA);
  return igual(`${e.abierta}|${antes.cobre - e.cobre}|${e.integridad - antes.integridad}`, 'false|10|25');
});
caso('integridad no supera el maximo', () => {
  let e = hasta(M.inicial(LEY), 30); e.integridad = e.integridad_max - 3;
  e = M.reparar(e, DIA); return igual(e.integridad, e.integridad_max);
});
caso('integridad no baja de 0', () => { const e = hasta(M.inicial(LEY), 400); return (e.integridad >= 0) || e.integridad; });
caso('la grieta se reabre tras su ciclo de cierre', () => {
  let e = M.reparar(hasta(M.inicial(LEY), 40), DIA); const c = e.cierre;
  e = hasta(e, c); return igual(e.abierta, true);
});
caso('ley: 171 pruebas -> integridad maxima 117', () => igual(LEY.integridad_max, 117));
caso('ley: arnes en rojo duplica el dano', () => igual(M.leyes({ arnes_sw: '23/24' }).dano, 2));
caso('ley: sin mundo -> neutras y NO_DATA', () => { const l = M.leyes(null); return igual(`${l.nd}|${l.integridad_max}|${l.dano}`, 'true|100|1'); });

// 3 · mientras dormias, tope 24 h
const H = 3600000;
[[23, 23 * 3600], [24, 86400], [25, 86400]].forEach(([h, c]) =>
  caso(`dormir ${h} h -> ${c} ciclos`, () => igual(M.dormir(M.inicial(LEY), h * H).pendiente.ciclos, c)));
caso('dos siestas no pasan de 24 h', () => {
  const e = M.dormir(M.dormir(M.inicial(LEY), 20 * H), 20 * H); return igual(e.pendiente.ciclos, 86400);
});
caso('recoger suma y vacia el pendiente', () => {
  const d = M.dormir(M.inicial(LEY), H), r = M.recoger(d, DIA);
  return igual(`${r.cobre === d.cobre + d.pendiente.cobre}|${r.pendiente}|${r.eventos.at(-1).resultado}`, 'true|null|ok');
});
caso('nada es negativo tras 24 h y 2000 ciclos', () => {
  let e = M.recoger(M.dormir(M.inicial(LEY), 24 * H), DIA); e = hasta(e, 2000);
  return ['luz', 'biomasa', 'cobre', 'o2', 'integridad'].every((k) => e[k] >= 0) || JSON.stringify(e);
});

// 4 · profundidad y oxigeno
caso('300 m+ bloqueado sin Ingenieria 60', () => {
  const e = M.bajarA(M.inicial(LEY), 'nucleo', DIA);
  return igual(`${e.prof}|${e.eventos.at(-1).resultado}`, 'ruinas|fallo');
});
caso('300 m+ abierto con Ingenieria 60', () => {
  const e = M.inicial(LEY); e.xp[M.OFICIOS.indexOf('ingenieria')] = M.xpParaNivel(60);
  return igual(M.bajarA(e, 'nucleo', DIA).prof, 'nucleo');
});
caso('el consumo de oxigeno crece con la profundidad', () => {
  const gasto = (p) => { let e = M.bajarA(M.inicial(LEY), p, DIA); return e.o2 - M.ciclo(e, LEY).o2; };
  const g = ['ruinas', 'bosque'].map(gasto);
  return (g[0] > 0 && g[1] > g[0]) || g.join();
});
caso('sin oxigeno: ascenso al arrecife y no se puede bajar', () => {
  let e = M.bajarA(M.inicial(LEY), 'bosque', DIA); e.o2 = 3; e = M.ciclo(e, LEY);
  const b = M.bajarA(Object.assign({}, e, { o2: 0 }), 'ruinas', DIA);
  return igual(`${e.prof}|${e.o2}|${b.prof}`, 'arrecife|0|arrecife');
});

// 5 · eventos atlas.evento/1
const CAMPOS = 'contenido_v,dia,esquema,mision,nota,profundidad,resultado,sector,tipo,valoracion';
caso('cada accion deja un evento con el esquema cerrado', () => {
  let e = M.inicial(LEY);
  e = M.aplazar(e, DIA); e = M.bajarA(e, 'arrecife', DIA); e = M.reparar(e, DIA); e = M.recoger(e, DIA);
  const ok = e.eventos.every((ev) => Object.keys(ev).sort().join() === CAMPOS && ev.esquema === 'atlas.evento/1'
    && M.CATALOGO.misiones.includes(ev.mision) && M.CATALOGO.sectores.includes(ev.sector)
    && M.CATALOGO.profundidades.includes(ev.profundidad));
  return (ok && e.eventos.length === 4) || JSON.stringify(e.eventos);
});
caso('ningun evento lleva rutas ni datos personales', () => {
  const e = M.reparar(M.aplazar(M.inicial(LEY), DIA), DIA);
  return !/\/home\/|\\\\|@|http/.test(JSON.stringify(e.eventos)) || 'fuga';
});
caso('determinista: mismo estado, mismo resultado', () =>
  igual(JSON.stringify(hasta(M.inicial(LEY), 500)), JSON.stringify(hasta(M.inicial(LEY), 500))));
caso('fases: 1 al empezar, 5 con el Nucleo a 70', () => {
  const e = M.inicial(LEY); const a = M.fase(e); e.xp[0] = M.xpParaNivel(70);
  return igual(`${a}|${M.fase(e)}`, '1|5');
});

console.log(JSON.stringify(casos));
