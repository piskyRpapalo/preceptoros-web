// J1 · Estrella Hexelion capturable: una estrella se captura en su edificio enlazado, una vez, con semiotica medida.
// Lo no medido es NO_DATA con causa. Se ejecuta con: node atlas/estrella_captura_casos.mjs -> [{caso, ok, detalle}]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const E = require('../public/game/estrella_captura.js');
const dic = JSON.parse(readFileSync(new URL('../public/dictionary.json', import.meta.url), 'utf8'));

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const rechaza = (r, re) => (r.ok === false && re.test(r.motivo)) || `no rechazo con ${re}: ${JSON.stringify(r)}`;
const copia = (f) => { const d = JSON.parse(JSON.stringify(dic)); f(d); return d; };

caso('valido: D33 se captura en la Mesa de Firma y aparece en la constelacion con su color medido', () => {
  const r = E.captura({ capturadas: [] }, dic, 'D33', 'mesa_de_firma');
  if (!r.ok) return 'rechazo la captura valida: ' + r.motivo;
  const c = E.constelacion(r.estado, dic);
  return c.length === 1 && c[0].id === 'D33' && c[0].nombre === 'Human Hand' && /^#/.test(c[0].color) || 'constelacion: ' + JSON.stringify(c);
});

caso('violacion: estrella que no es la del edificio', () => rechaza(E.captura({ capturadas: [] }, dic, 'A1', 'mesa_de_firma'), /no se captura en mesa_de_firma/));

caso('violacion: edificio sin enlace declarado', () => rechaza(E.captura({ capturadas: [] }, dic, 'D33', 'biblioteca'), /edificio sin enlace/));

caso('violacion: captura doble de la misma estrella', () => {
  const st = E.captura({ capturadas: [] }, dic, 'D33', 'mesa_de_firma').estado;
  return rechaza(E.captura(st, dic, 'D33', 'mesa_de_firma'), /ya esta capturada/);
});

caso('violacion: D67 no es entrada del diccionario: captura en NO_DATA, no inventada', () => rechaza(E.captura({ capturadas: [] }, dic, 'D67', 'puerta_frontera'), /NO_DATA \(sin entrada/));

caso('violacion: estrella retirada del anexo publico no se captura', () => {
  const d = copia((x) => { x.withheld_ids = ['D33']; });
  return rechaza(E.captura({ capturadas: [] }, d, 'D33', 'mesa_de_firma'), /NO_DATA \(estrella retirada/);
});

caso('violacion: entrada sin semiotica medida no se captura', () => {
  const d = copia((x) => { delete x.entries.find((e) => e.id_interno === 'D33').semiotica; });
  return rechaza(E.captura({ capturadas: [] }, d, 'D33', 'mesa_de_firma'), /NO_DATA \(estrella D33 sin semiotica/);
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
