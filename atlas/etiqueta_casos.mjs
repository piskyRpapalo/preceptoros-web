// VT2 · etiqueta <= 1.024 B con title y rag_base_prompt a primer nivel, y par de 2.048 B para la mini-IA.
// Se ejecuta con: node atlas/etiqueta_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);


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

















const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
