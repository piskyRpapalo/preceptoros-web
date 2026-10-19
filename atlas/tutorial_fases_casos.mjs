// VT5 · tutorial «De Onda a Nodo Soberano» (F0-F3): doble puerta, orden de fases, 3 huevos medidos,
// primer edificio con NO_DATA con causa cuando no hay medida, y la red solo tras el cruce humano.
// Se ejecuta con: node atlas/tutorial_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const T = require('../public/game/tutorial_fases.js');

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const ok = (r) => r.ok === true;
const rechaza = (r, re) => (r.ok === false && re.test(r.motivo)) || `no rechazo con ${re}: ${JSON.stringify(r)}`;

// recorrido completo por la niebla: pulso -> disipa (NO_DATA: sin medida) -> arena101 -> recompensa -> F2 -> F3 -> humano cruza
function recorrido() {
  let st = T.inicia(), r;
  r = T.elige(st, 'niebla'); if (!ok(r)) throw new Error('niebla: ' + r.motivo); st = r.estado;
  for (const [n, d] of [['pulso', {}], ['disipa', { dato: 'NO_DATA', causa: 'edificio sin etiqueta medida' }], ['arena101', {}], ['recompensa', { huevos: 3 }],
    ['campamento', {}], ['primer_edificio', { etiqueta: 'boya:h1' }], ['cartas', {}]]) {
    r = T.evento(st, n, d); if (!ok(r)) throw new Error(n + ': ' + r.motivo); st = r.estado;
  }
  return st;
}

caso('valido: recorrido niebla -> F3 y la red solo se abre con el cruce del humano', () => {
  const st = recorrido();
  if (st.fase !== 'F3' || st.paso !== 'salto') return `llega a ${st.fase}/${st.paso}`;
  if (st.huevos !== 3) return `huevos ${st.huevos}`;
  if (st.primer_edificio.dato !== 'medido') return 'el primer edificio debia venir medido';
  const cruz = T.evento(st, 'cruza', { humano: true });
  return ok(cruz) && cruz.estado.red === true && T.invariantes(cruz.estado) === null || 'cruce humano no abre la red';
});

caso('doble puerta: directo lleva a las cartas (F3) sin pasar por la Onda', () => {
  const r = T.elige(T.inicia(), 'directo');
  return ok(r) && r.estado.fase === 'F3' && r.estado.paso === 'cartas' || 'directo no llega a F3 · cartas';
});

caso('violacion: la red se abre sin cruce humano', () => {
  const st = recorrido();
  return rechaza(T.evento(st, 'cruza', { humano: false }), /la red solo la abre el humano/);
});

caso('violacion: evento fuera de orden (arena101 en pulso)', () => {
  const r = T.elige(T.inicia(), 'niebla');
  return rechaza(T.evento(r.estado, 'arena101', {}), /fuera de orden/);
});

caso('violacion: recompensa con dos huevos en vez de tres', () => {
  let st = T.elige(T.inicia(), 'niebla').estado;
  st = T.evento(st, 'pulso', {}).estado;
  st = T.evento(st, 'disipa', { dato: 'NO_DATA', causa: 'sin medida' }).estado;
  st = T.evento(st, 'arena101', {}).estado;
  return rechaza(T.evento(st, 'recompensa', { huevos: 2 }), /3 huevos medidos/);
});

caso('violacion: primer edificio sin etiqueta medida', () => {
  let st = T.elige(T.inicia(), 'niebla').estado;
  for (const [n, d] of [['pulso', {}], ['disipa', { dato: 'NO_DATA', causa: 'x' }], ['arena101', {}], ['recompensa', { huevos: 3 }], ['campamento', {}]]) {
    st = T.evento(st, n, d).estado;
  }
  return rechaza(T.evento(st, 'primer_edificio', {}), /sin etiqueta medida/);
});

caso('violacion: puerta desconocida', () => rechaza(T.elige(T.inicia(), 'mapa'), /puerta desconocida/));

caso('violacion: estado con la red abierta antes de F3 · cruzado', () => {
  const st = { ...T.inicia(), fase: 'F1', paso: 'pulso', red: true };
  return T.invariantes(st) !== null || 'el invariante no detecta la red abierta en F1';
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
