// T2 · pruebas de la tarjeta NORTE7-T2-ALTURA-LOG. Uso: node atlas/t2_altura_casos.mjs ; exit 0 solo si todas pasan.
import { readFileSync } from 'node:fs';
const A = await import('./fixtures/t2_altura.mjs');
const REG = JSON.parse(readFileSync(new URL('./fixtures/constantes.json', import.meta.url), 'utf8')).constantes;
const casos = [];
function caso(nombre, fn) {
  try { const d = fn(); casos.push({ caso: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: 'excepcion: ' + e.message }); }
}
const reg = (n) => REG.find((c) => c.nombre === n);

caso('h0 se deriva: ceil(16 / 0.6) = 27 px ref, y en pantalla al zoom minimo queda >= 16 px', () => {
  if (A.H0 !== 27) return `h0=${A.H0}`;
  return A.H0 * 0.6 >= 16 || `en pantalla ${A.H0 * 0.6}`;
});

caso('k se deriva: h(100) cae en 2.5 h0 (punto medio de la ventana 2-3 de la regla [1])', () => {
  const r = A.altura(100).h / A.H0;
  return Math.abs(r - 2.5) < 0.01 || `ratio ${r.toFixed(3)}`;
});

caso('h(100) queda dentro de la ventana 2-3 veces h0 (regla [1])', () => {
  const r = A.altura(100).h / A.H0;
  return (r >= 2 && r <= 3) || `ratio ${r.toFixed(3)}`;
});

caso('h(0) = h0: sin mana, la altura es el suelo', () => {
  const a = A.altura(0);
  return (Math.abs(a.h - A.H0) < 1e-9 && a.estado === 'MEDIDO') || `h(0)=${a.h}`;
});

caso('la altura crece estrictamente con el mana (0..100)', () => {
  let prev = -Infinity;
  for (let m = 0; m <= 100; m++) {
    const h = A.altura(m).h;
    if (!(h > prev)) return `no crece en mana=${m}`;
    prev = h;
  }
  return true;
});

caso('el crecimiento es logaritmico: la pendiente baja a medida que sube el mana', () => {
  const d1 = A.altura(10).h - A.altura(0).h, d2 = A.altura(100).h - A.altura(90).h;
  return d1 > d2 || `pendiente inicial ${d1.toFixed(2)} no supera la final ${d2.toFixed(2)}`;
});

caso('crecer es altura, no anchura: la funcion solo devuelve altura y estado', () => {
  const claves = Object.keys(A.altura(50)).sort().join(',');
  return claves === 'causa,estado,h' || `claves: ${claves}`;
});

caso('sin dato (null/undefined): altura de suelo h0 con causa NO_DATA', () => {
  for (const x of [null, undefined]) {
    const a = A.altura(x);
    if (a.estado !== 'NO_DATA' || a.h !== A.H0 || !a.causa) return `mal con ${x}`;
  }
  return true;
});

caso('mana fuera de rango o no entero: NO_DATA con causa, nunca un valor inventado', () => {
  for (const x of [-1, 101, 2.5, NaN, '50']) {
    const a = A.altura(x);
    if (a.estado !== 'NO_DATA' || a.h !== A.H0 || !a.causa) return `acepto ${x}`;
  }
  return true;
});

caso('h0 y k del fixture coinciden con el registro (MEDIDO con procedencia)', () => {
  const h0 = reg('ALTURA_H0'), k = reg('ALTURA_K');
  if (!h0 || !k) return 'falta en el registro';
  if (h0.valor !== A.H0 || k.valor !== A.K) return `registro ${h0.valor}/${k.valor} vs fixture ${A.H0}/${A.K}`;
  if (h0.estado !== 'MEDIDO' || k.estado !== 'MEDIDO') return `estado ${h0.estado}/${k.estado}`;
  if (!/derivad/i.test(h0.procedencia) || !/derivad/i.test(k.procedencia)) return 'procedencia sin derivacion';
  return true;
});

caso('el fixture no usa azar del sistema ni reloj', () => {
  const t = readFileSync(new URL('./fixtures/t2_altura.mjs', import.meta.url), 'utf8');
  return !/Math\.random|Date\.now|performance\.now/.test(t) || 'usa azar o reloj';
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
