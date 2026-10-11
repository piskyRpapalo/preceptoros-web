/* preceptoros.org · theGame · LA LEY DEL SUELO: proyeccion isometrica 2:1 (firmada por el Soberano, 2026-10-12).

   EL ROMBO ES LA LEY. Cada celda del mundo es un diamante 2:1 (ancho W, alto H = W/2):
     (col, fila) -> pantalla  x = (col - fila) * W/2 ,  y = (col + fila) * H/2
   y TODO objeto se ancla al CENTRO de su rombo, nunca a una esquina.

   LA PROFUNDIDAD SE PINTA SOLAPANDO. Orden de pintor por (col + fila): un solo eje de profundidad; lo de delante
   (suma mayor) se pinta despues y tapa lo de atras. Empate: por `col` (estable), y si sigue, por `capa` (suelo antes
   que lo que esta encima). Prohibido fingir profundidad con parallax o sombras: aqui no hay ni una.

   EL TAMANO HABLA (Escala Viva): una unidad grande ocupa mas rombos (`huella`), y se ancla al centro de su huella.

   Puro, sin DOM, sin reloj, sin azar: lo mismo en la pestana, en node y en el lab. El lab lee el VECTOR (col, fila,
   huella), no los pixeles. Es el Canvas 2D de siempre con otra proyeccion: sin assets, sin motor 3D. */
(function (raiz) {
  'use strict';

  /* Centro del rombo (col, fila) en coordenadas de mundo-pantalla (sin camara). */
  function proyecta(col, fila, W) {
    var H = W / 2;
    return { x: (col - fila) * W / 2, y: (col + fila) * H / 2 };
  }
  /* La inversa: de un punto de pantalla al rombo (fraccionario) que lo contiene. Para saber que celda toca el dedo. */
  function aCelda(x, y, W) {
    var H = W / 2, a = x / (W / 2), b = y / (H / 2);
    return { col: (a + b) / 2, fila: (b - a) / 2 };
  }
  /* La celda entera que contiene el punto (redondeo al rombo mas cercano por su centro). */
  function celdaDe(x, y, W) {
    var c = aCelda(x, y, W);
    return { col: Math.round(c.col), fila: Math.round(c.fila) };
  }
  /* Los cuatro vertices del rombo (arriba, derecha, abajo, izquierda) alrededor de su centro. */
  function vertices(col, fila, W) {
    var p = proyecta(col, fila, W), H = W / 2;
    return [[p.x, p.y - H / 2], [p.x + W / 2, p.y], [p.x, p.y + H / 2], [p.x - W / 2, p.y]];
  }
  /* Ancla de un objeto con huella n x n que empieza en (col, fila): el centro de toda su huella. */
  function ancla(col, fila, huella, W) {
    var n = Math.max(1, huella || 1);
    return proyecta(col + (n - 1) / 2, fila + (n - 1) / 2, W);
  }
  /* El orden de pintor: devuelve una COPIA ordenada de atras a delante. Cada objeto: { col, fila, huella?, capa? }.
     La profundidad de un objeto grande es la de su rombo mas adelantado (col+fila+2*(n-1)). */
  function profundidad(o) { var n = Math.max(1, o.huella || 1); return o.col + o.fila + 2 * (n - 1); }
  function ordena(lista) {
    return lista.map(function (o, i) { return { o: o, i: i }; }).sort(function (a, b) {
      return (profundidad(a.o) - profundidad(b.o)) || (a.o.col - b.o.col) || ((a.o.capa || 0) - (b.o.capa || 0)) || (a.i - b.i);
    }).map(function (x) { return x.o; });
  }

  var IsometricFloor = { proyecta: proyecta, aCelda: aCelda, celdaDe: celdaDe, vertices: vertices, ancla: ancla,
                         profundidad: profundidad, ordena: ordena };
  if (typeof module === 'object' && module.exports) { module.exports = IsometricFloor; } else { raiz.IsometricFloor = IsometricFloor; }
})(this);
