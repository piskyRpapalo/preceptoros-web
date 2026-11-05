// LA LEY DEL SUELO · casos de la proyeccion isometrica 2:1 (firmada 2026-10-12). Puros, sin DOM ni reloj.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const I = require(process.env.ISO || '../public/game/isometric_floor_projection.js');
const casos = [];
function caso(nombre, f) {
  try { const r = f(); casos.push({ caso: nombre, ok: r === true, detalle: r === true ? '' : JSON.stringify(r).slice(0, 300) }); }
  catch (e) { casos.push({ caso: nombre, ok: false, detalle: String(e && e.message || e) }); }
}
const W = 64;
caso('el rombo es la ley: x=(col-fila)*W/2, y=(col+fila)*H/2 con H=W/2', () => {
  const p = I.proyecta(3, 1, W);
  return p.x === (3 - 1) * 32 && p.y === (3 + 1) * 16 || p;
});
caso('el rombo es 2:1 (ancho = 2 x alto)', () => {
  const v = I.vertices(0, 0, W), ancho = v[1][0] - v[3][0], alto = v[2][1] - v[0][1];
  return ancho === 2 * alto || { ancho, alto };
});
caso('la inversa devuelve la celda (ida y vuelta exacta en 400 celdas)', () => {
  for (let c = -10; c < 10; c++) for (let f = -10; f < 10; f++) {
    const p = I.proyecta(c, f, W), q = I.celdaDe(p.x, p.y, W);
    if (q.col !== c || q.fila !== f) { return { c, f, q }; }
  }
  return true;
});
caso('el dedo dentro del rombo cae en ESE rombo (cerca del borde tambien)', () => {
  const p = I.proyecta(2, 5, W), dentro = [[0, 0], [W / 2 - 3, 0], [0, W / 4 - 2], [-(W / 2 - 3), 0], [0, -(W / 4 - 2)]];
  return dentro.every(([dx, dy]) => { const q = I.celdaDe(p.x + dx, p.y + dy, W); return q.col === 2 && q.fila === 5; }) || 'fuera';
});
caso('todo objeto ancla al CENTRO de su rombo; el grande, al centro de su huella', () => {
  const uno = I.ancla(4, 4, 1, W), c = I.proyecta(4, 4, W), dos = I.ancla(4, 4, 2, W), c2 = I.proyecta(4.5, 4.5, W);
  return uno.x === c.x && uno.y === c.y && dos.x === c2.x && dos.y === c2.y || { uno, dos };
});
caso('orden de pintor: atras (col+fila menor) antes, delante despues; empate estable por col', () => {
  const arbolAtras = { n: 'atras', col: 1, fila: 1 }, cangrejo = { n: 'cangrejo', col: 2, fila: 2 }, arbolDelante = { n: 'delante', col: 3, fila: 2 };
  const o = I.ordena([arbolDelante, cangrejo, arbolAtras]).map((x) => x.n);
  const e = I.ordena([{ n: 'b', col: 2, fila: 0 }, { n: 'a', col: 0, fila: 2 }]).map((x) => x.n);
  return JSON.stringify(o) === '["atras","cangrejo","delante"]' && JSON.stringify(e) === '["a","b"]' || { o, e };
});
caso('el grande tapa segun su rombo mas adelantado (huella), no su esquina', () => {
  const grande = { n: 'grande', col: 0, fila: 0, huella: 3 }, chico = { n: 'chico', col: 2, fila: 1 };
  const o = I.ordena([grande, chico]).map((x) => x.n);
  return JSON.stringify(o) === '["chico","grande"]' || o;
});
caso('suelo antes que lo de encima en la misma celda (capa)', () => {
  const o = I.ordena([{ n: 'cangrejo', col: 1, fila: 1, capa: 1 }, { n: 'suelo', col: 1, fila: 1, capa: 0 }]).map((x) => x.n);
  return JSON.stringify(o) === '["suelo","cangrejo"]' || o;
});
caso('ordena no muta la lista recibida (determinista y sin efectos)', () => {
  const l = [{ col: 2, fila: 2 }, { col: 0, fila: 0 }], antes = JSON.stringify(l); I.ordena(l);
  return JSON.stringify(l) === antes;
});
console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
