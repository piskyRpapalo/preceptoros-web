// VT3 · arena por ramificacion de ticks: fork en el tick K con la misma semilla, recibo < 200 B,
// y verificacion que reproduce desde el tick 0. Se ejecuta con: node atlas/arena_ticks_casos.mjs
// -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../public/game/canon.js');
const V = require('../public/game/valores.js');
const CT = require('../public/game/combate_ticks.js');

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const tcs = Object.keys(V.tcs);
const tropas = (q, k) => Array.from({ length: k }, (_, j) => ({ tc: tcs[(j + q) % tcs.length], semilla: K.sha(`vt3:${q}:${j}`) }));
const def = tropas(0, 3), asa = tropas(1, 3), semilla = K.sha('vt3:semilla');
const rondasBase = CT.combate(def, asa, semilla).rondas;

caso('valido: recibo < 200 B y la verificacion desde el tick 0 reproduce el veredicto', () => {
  const r = CT.recibo(def, asa, semilla, []);
  if (!r.ok) return 'recibo rechazado: ' + r.motivo;
  if (r.texto.length >= CT.RECIBO_TOPE) return `recibo de ${r.texto.length} B`;
  const v = CT.verifica(r.recibo, def, asa);
  return v.ok ? true : 'verificacion: ' + v.motivo;
});

caso('fork: antes del tick K el registro es identico a la partida sin ordenes', () => {
  if (rondasBase < 3) return 'combate de ' + rondasBase + ' rondas: no sirve para bifurcar en K=2';
  const base = CT.combate(def, asa, semilla).registro;
  const f = CT.simula(def, asa, semilla, [{ tick: 2, lado: 0, i: 0, accion: 'retira' }]);
  if (!f.ok) return 'fork rechazado: ' + f.motivo;
  const antes = (r) => JSON.stringify(r.filter((x) => x[0] < 2));
  return antes(f.combate.registro) === antes(base) || 'el prefijo anterior al tick K cambio';
});

caso('violacion: tick fuera de rango (0 o mas alla de las rondas)', () => {
  const malos = [{ tick: 0, lado: 0, i: 0, accion: 'retira' }, { tick: V.combate.rondas + 1, lado: 0, i: 0, accion: 'retira' }];
  const noRechazados = malos.filter((o) => {
    const r = CT.simula(def, asa, semilla, [o]);
    return !(r.ok === false && /fuera de/.test(r.motivo));
  });
  return noRechazados.length === 0 || 'no rechazo los ticks: ' + noRechazados.map((o) => o.tick).join(',');
});

caso('violacion: orden sobre una unidad que no existe', () => {
  const r = CT.simula(def, asa, semilla, [{ tick: 1, lado: 1, i: 9, accion: 'retira' }]);
  return r.ok === false && /no existe/.test(r.motivo) || 'no rechazo: ' + JSON.stringify(r);
});

caso('violacion: accion desconocida', () => {
  const r = CT.simula(def, asa, semilla, [{ tick: 1, lado: 0, i: 0, accion: 'teletransporta' }]);
  return r.ok === false && /accion desconocida/.test(r.motivo) || 'no rechazo: ' + JSON.stringify(r);
});

caso('violacion: recibo alterado (veredicto cambiado) no verifica', () => {
  const r = CT.recibo(def, asa, semilla, []);
  const alterado = { ...r.recibo, v: { ...r.recibo.v, g: 'asalto' === r.recibo.v.g ? 'defensa' : 'asalto' } };
  const v = CT.verifica(alterado, def, asa);
  return v.ok === false || 'el recibo alterado verifico';
});

caso('violacion: recibo mayor de 200 B se rechaza al emitirlo', () => {
  const muchas = Array.from({ length: 12 }, () => ({ tick: 1, lado: 0, i: 0, accion: 'retira' }));
  const r = CT.recibo(def, asa, semilla, muchas);
  return r.ok === false && /supera 200/.test(r.motivo) || 'no rechazo: ' + JSON.stringify(r).slice(0, 80);
});

caso('violacion: semilla mal formada no verifica', () => {
  const r = CT.recibo(def, asa, semilla, []);
  const v = CT.verifica({ ...r.recibo, s: 'XYZ' }, def, asa);
  return v.ok === false && /semilla/.test(v.motivo) || 'no rechazo: ' + JSON.stringify(v);
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
