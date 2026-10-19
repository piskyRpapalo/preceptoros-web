// VT2 · etiqueta <= 1.024 B con title y rag_base_prompt a primer nivel, y par de 2.048 B para la mini-IA.
// Se ejecuta con: node atlas/etiqueta_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../public/game/etiqueta.js');

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

const edificio = (extra = {}) => ({
  title: 'Boya de vigilancia',
  rag_base_prompt: 'Edificio del mapa que escucha la radio de estado del nodo.',
  tipo: 'boya',
  estado: 'LIVE',
  ...extra,
});

caso('valido: etiqueta con title y rag_base_prompt, <= 1.024 B, claves ordenadas', () => {
  const r = E.etiqueta(edificio());
  if (!r.ok) return 'rechazo un objeto valido: ' + r.motivo;
  if (r.bytes > E.TOPE) return `pesa ${r.bytes} B`;
  return r.texto.startsWith('{"estado"') || 'claves no ordenadas: ' + r.texto.slice(0, 40);
});

caso('violacion: etiqueta mayor de 1.024 B', () =>
  rechaza(E.etiqueta(edificio({ relleno: 'x'.repeat(1100) })), /supera el techo de 1024/));

caso('violacion: title ausente', () => {
  const o = edificio(); delete o.title;
  return rechaza(E.etiqueta(o), /title ausente/);
});

caso('violacion: rag_base_prompt ausente', () => {
  const o = edificio(); delete o.rag_base_prompt;
  return rechaza(E.etiqueta(o), /rag_base_prompt ausente/);
});

caso('violacion: title vacio o solo espacios', () => rechaza(E.etiqueta(edificio({ title: '   ' })), /title ausente/));

caso('violacion: objeto con ciclo, no serializable', () => {
  const o = edificio(); o.yo = o;
  return rechaza(E.etiqueta(o), /no serializable/);
});

caso('violacion: la vecina de la comparacion supera su techo y el par se rechaza', () =>
  rechaza(E.compara(edificio(), edificio({ relleno: 'b'.repeat(1100) })), /vecina: .*supera el techo de 1024/));

caso('par valido: dos etiquetas <= 1.024 B suman <= 2.048 B', () => {
  const r = E.compara(edificio({ tipo: 'propia' }), edificio({ tipo: 'vecina' }));
  return r.ok && r.bytes <= E.TOPE_PAR ? true : 'par rechazado: ' + JSON.stringify(r);
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
