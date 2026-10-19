// VT5 · pantallas F0-F3: modelo de vista puro + capa DOM sin innerHTML y con toque de 44 px.
// Se ejecuta con: node atlas/ui_tutorial_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const T = require('../public/game/tutorial_fases.js');
const U = require('../public/game/ui-tutorial-fases.js');

const casos = [];
function caso(nombre, fn) {
  try {
    const d = fn();
    casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) });
  } catch (e) {
    casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message });
  }
}
const rechaza = (ok, cond) => (ok === false && cond) || `no rechazo: ok=${ok}`;

// Documento de prueba: solo lo que usa la capa DOM (createElement, appendChild, removeChild, textContent, dataset, listeners).
function docFalso() {
  const nodo = (tag) => {
    const n = { tag, children: [], className: '', textContent: '', dataset: {}, disabled: false, listeners: {}, asignados: [] };
    n.appendChild = (c) => { n.children.push(c); return c; };
    n.removeChild = (c) => { n.children.splice(n.children.indexOf(c), 1); return c; };
    n.addEventListener = (ev, f) => { n.listeners[ev] = f; };
    Object.defineProperty(n, 'firstChild', { get: () => n.children[0] || null });
    return new Proxy(n, { set(t, k, v) { t.asignados.push(k); t[k] = v; return true; } });
  };
  return { createElement: nodo };
}
const buscaBotones = (n, out = []) => { if (n.tag === 'button') out.push(n); n.children.forEach((c) => buscaBotones(c, out)); return out; };

// recorrido real hasta F3 · salto, con la medida del edificio presente
function hastaSalto() {
  let st = T.elige(T.inicia(), 'niebla').estado;
  for (const [n, d] of [['pulso', {}], ['disipa', { dato: 'medido', etiqueta: 'boya:h1' }], ['arena101', {}], ['recompensa', { huevos: 3 }],
    ['campamento', {}], ['primer_edificio', { etiqueta: 'boya:h1' }], ['cartas', {}]]) {
    st = T.evento(st, n, d).estado;
  }
  return st;
}

caso('valido: F0 ofrece las dos puertas y el salto solo ofrece cruzar con clic humano', () => {
  const f0 = U.vista(T.inicia(), {});
  const dos = f0.acciones.map((a) => a.id).join(',') === 'directo,niebla';
  const s = U.vista(hastaSalto(), { etiqueta: 'boya:h1' });
  const cruza = s.acciones.find((a) => a.id === 'cruza');
  const r = U.alPulsar(hastaSalto(), cruza);
  return dos && cruza && cruza.datos.humano === true && r.ok && r.estado.red === true || `dos=${dos} cruza=${JSON.stringify(cruza)} r=${JSON.stringify(r)}`;
});

caso('violacion: el primer edificio sin etiqueta medida no se puede poner (boton bloqueado con causa)', () => {
  let st = T.elige(T.inicia(), 'niebla').estado;
  for (const [n, d] of [['pulso', {}], ['disipa', { dato: 'NO_DATA', causa: 'x' }], ['arena101', {}], ['recompensa', { huevos: 3 }], ['campamento', {}]]) st = T.evento(st, n, d).estado;
  const v = U.vista(st, {});
  const b = v.acciones[0];
  return (b.estado === 'bloqueada' && /NO_DATA/.test(b.causa)) || 'el primer edificio sin etiqueta sale activo: ' + JSON.stringify(b);
});

caso('violacion: un clic sobre un boton bloqueado no mueve la maquina', () => {
  const b = { id: 'x', etiqueta: 'x', evento: 'primer_edificio', datos: {}, estado: 'bloqueada', causa: 'NO_DATA (x)' };
  return rechaza(U.alPulsar(T.inicia(), b).ok, true);
});

caso('violacion: el evento cruza no se acepta fuera de F3 · salto (la red no se abre desde la UI)', () => {
  const b = { id: 'cruza', etiqueta: 'Cross', evento: 'cruza', datos: { humano: true }, estado: 'activa' };
  const st = T.elige(T.inicia(), 'niebla').estado;   // F1 · pulso
  const r = U.alPulsar(st, b);
  return rechaza(r.ok, /fuera de|solo en F3/.test(r.motivo || '')) === true || 'la UI abrio la red en F1: ' + JSON.stringify(r);
});

caso('violacion: ninguna pantalla asigna innerHTML en ningun nodo (solo textContent)', () => {
  const doc = docFalso();
  const estados = [T.inicia(), T.elige(T.inicia(), 'niebla').estado, hastaSalto(), T.elige(T.inicia(), 'directo').estado];
  const fallos = [];
  const recorre = (n) => { if (n.asignados.includes('innerHTML')) fallos.push(n.tag); n.children.forEach(recorre); };
  estados.forEach((st) => {
    const raiz = doc.createElement('div');
    U.monta(doc, raiz, st, {}, () => {});
    recorre(raiz);
  });
  return fallos.length === 0 || 'innerHTML asignado en: ' + fallos.join(',');
});

caso('violacion: cada boton activo es un objetivo tactil de 44 px como minimo (clase touch44)', () => {
  const doc = docFalso(), raiz = doc.createElement('div');
  U.monta(doc, raiz, T.inicia(), {}, () => {});
  const botones = buscaBotones(raiz);
  const todos = botones.every((b) => /touch44/.test(b.className)) && U.TOQUE_MIN === 44;
  const css = readFileSync(new URL('../public/game/tutorial-fases.css', import.meta.url), 'utf8');
  const regla = /\.tutorial-accion\.touch44\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/.test(css);
  return todos && botones.length === 2 && regla || `botones=${botones.length} touch=${todos} regla=${regla}`;
});

caso('violacion: el texto de las pantallas no lleva palabras prohibidas del canon', () => {
  const prohibidas = /oraculo|notario|depin|token|moneda|clearing|magia/i;
  const textos = Object.values(U.TEXTO).flatMap((t) => [t.t, t.x]);
  return textos.every((t) => !prohibidas.test(t)) || 'palabra prohibida en las pantallas';
});

const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
