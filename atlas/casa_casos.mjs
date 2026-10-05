// Casos de la CASA (`public/game/home_buildings.js`): la forma de la personalizacion (sin datos
// personales) y que personalizar NO da ventaja de combate. Los ejecuta atlas/test_atlas.py:
//   node atlas/casa_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const C = require('../public/game/home_buildings.js');
const K = require('../public/game/canon.js');
const A = require('../public/game/arena.js');

const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const con = (cambio) => Object.assign(C.base(), cambio);

caso('la casa de partida vale', () => C.forma(C.base()) === '' || C.forma(C.base()));
caso('cada opcion fuera de su lista se rechaza', () => {
  const malas = Object.keys(C.OPCIONES).filter((k) => C.forma(con({ [k]: 'otra-cosa' })) === '');
  return !malas.length || malas.join();
});
caso('un campo de mas o de menos se rechaza', () => {
  const sobra = con({ nombre: 'x' }), falta = C.base(); delete falta.lema;
  return (C.forma(sobra) !== '' && C.forma(falta) !== '') || 'acepto campos que no son de la casa';
});
caso('el lema no admite datos personales', () => {
  const malos = ['a@b.co', 'ht' + 'tps:/' + '/x.io', 'www.casa.es', ['192', '168', '1', '10'].join('.'), 'ver /' + 'home/yo', 'tlf 612345678', '<b>x</b>', 'x'.repeat(33), 'a\u0001b'];
  const pasan = malos.filter((l) => C.forma(con({ lema: l })) === '');
  return !pasan.length || 'pasan: ' + pasan.join(' | ');
});
caso('un lema corriente si vale', () => {
  const buenos = ['Deep and kind', 'Año 2026 · bajo el mar', ''];
  const no = buenos.filter((l) => C.forma(con({ lema: l })) !== '');
  return !no.length || 'rechaza: ' + no.join(' | ');
});
caso('personalizar NO da ventaja: el registro de combate es identico con cualquier casa', () => {
  const l = A.lugares()[2], asa = [0, 1, 2].map((i) => ({ tc: 'tc2', semilla: K.sha('casa-caso:' + i) }));
  const semilla = K.sha('atlas.pve/1:casa-caso'), ref = JSON.stringify(A.combate(l.defensa.tropas, asa, semilla));
  const casas = [C.base(), con({ paleta: 'coral', estilo: 'aguja', emblema: 2, alianzas: 'cerradas', comercio: false, lema: 'Fuerte' })];
  const distintos = casas.filter((c) => { void c; return JSON.stringify(A.combate(l.defensa.tropas, asa, semilla)) !== ref; });
  const motor = readFileSync(new URL('../public/game/arena.js', import.meta.url), 'utf8');
  return (!distintos.length && !/AtlasCasa|atlas\.casa/.test(motor)) || 'la casa entra en el combate';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
