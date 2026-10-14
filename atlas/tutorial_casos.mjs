// E (FIRMO 2026-10-12): el tutorial ES el esquema de acciones renderizado, bajo el teaching kernel del rack.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require(process.env.TUTO || '../public/game/genesis_tutorial.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const ACCIONES = ['reach', 'swim', 'fight', 'invocar', 'desintegra', 'radio', 'inspect-place', 'open-panel'];
caso('cada paso es una ACCION que existe hoy, y solo esas (sin adelantos)', () => T.esquema().every((p) => ACCIONES.includes(p.accion)) || T.esquema().map((p) => p.accion));
caso('cada paso cita su canon, declara su sonido y su coordenada (un tip sin canon es una opinion)', () =>
  T.PASOS.every((p) => p.haz && p.canon && p.canon.length > 10 && p.sonido && p.coord && typeof p.mide === 'function' && typeof p.hecho === 'function') || T.PASOS.map((p) => p.id));
caso('kernel 1 · dry_run_obligatorio: toda accion irreversible ensena antes que pasara', () => {
  const irr = T.PASOS.filter((p) => p.irreversible);
  return irr.length >= 2 && irr.every((p) => typeof p.ensayo === 'function' && /^Dry run:/.test(p.ensayo())) || irr.map((p) => p.id);
});
caso('kernel 1 · sin cifras medidas, el ensayo dice NO_DATA con causa (no inventa el coste)', () => /NO_DATA \(/.test(T.PASOS.find((p) => p.id === 'summon').ensayo()));
caso('kernel 4 · fading: al empezar, la ayuda es completa (verbosidad 2)', () => T.ficha().verbosidad === 2 || T.ficha());
caso('la ficha del paso es texto legible, sin undefined ni NaN, y la meta del paso es medible', () => {
  const j = JSON.stringify(T.ficha());
  return !/undefined|NaN/.test(j) && T.ficha().paso === 'reach' || j;
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
