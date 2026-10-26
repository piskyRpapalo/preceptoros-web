// E (FIRMO 2026-10-12): el tutorial ES el esquema de acciones renderizado, bajo el teaching kernel del rack.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require(process.env.TUTO || '../public/game/genesis_tutorial.js');
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
// 'visit' existe desde la cura de enlaces muertos (web#344): los 9 lugares abren algo real ([1c]).
const ACCIONES = ['reach', 'swim', 'visit', 'fight', 'invocar', 'desintegra', 'radio'];
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
// [1c] · los pasos de visita son exactamente los 9 lugares vivos: las 4 partes de la casa (casa-medidas)
// y los 5 lugares con ficha (reef_place_cards), y cada uno se da por hecho solo tras visitarlo.
const PARTES = require('../public/game/casa-medidas.js').PARTES.map((p) => 'parte:' + p[0]);
const FICHAS = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'];
caso('[1c] · los pasos de visita son los 9 lugares vivos, ni uno mas ni uno menos', () => {
  const visitas = T.PASOS.filter((p) => p.accion === 'visit');
  return JSON.stringify(visitas.map((p) => p.lugar)) === JSON.stringify(PARTES.concat(FICHAS)) && visitas.every((p, n) => T.LUGARES[n] === p)
    || visitas.map((p) => p.lugar);
});
caso('[1c] · una parte de la casa cuenta como visitada solo cuando se toca su boton', () => {
  const antes = T.LUGARES.map((p) => p.hecho(0, p.mide()));
  if (antes.some(Boolean)) { return 'hecho sin visitar: ' + antes; }
  PARTES.forEach((k) => T.anota({ target: { closest: () => ({ dataset: { parte: k.slice(6) } }) } }));
  const casa = T.LUGARES.slice(0, 4).map((p) => p.hecho(0, p.mide())), arrecife = T.LUGARES.slice(4).map((p) => p.hecho(0, p.mide()));
  return casa.every(Boolean) && !arrecife.some(Boolean) || { casa, arrecife };
});
caso('[1c] · los lugares del arrecife sin casa dicen por que no, con su remedio', () =>
  T.LUGARES.slice(4, 8).every((p) => p.fallo && /create it/.test(p.fallo())) && !T.LUGARES[8].fallo || T.LUGARES.map((p) => p.id + ':' + !!p.fallo));
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
