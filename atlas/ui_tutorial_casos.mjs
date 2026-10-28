// VT5 · pantallas F0-F3: modelo de vista puro + capa DOM sin innerHTML y con toque de 44 px.
// Se ejecuta con: node atlas/ui_tutorial_casos.mjs  -> [{caso, ok, detalle}]  (sale != 0 si alguno falla)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

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
















const fallos = casos.filter((c) => !c.ok).length;
console.log(JSON.stringify(casos, null, 2));
if (fallos) process.exitCode = 1;
