/* preceptoros.org · theGame · EL INSPECTOR HONESTO (lote 0d, FIRMO 2026-10-12; salida de la auditoria A1B8).

   Tocar cualquier onda, tropa o edificio del mapa abre su FICHA en texto legible: que es, su estado, su COORDENADA y
   el SONIDO que declara. Donde falte un dato se escribe NO_DATA con su causa: jamas «undefined». No calcula nada
   nuevo: cada capa ya sabe lo suyo y lo entrega como `ficha()` al encolarse para pintar (la cola de pintor del paso 3
   lleva el sitio de cada pieza); aqui solo se guarda donde quedo cada pieza en pantalla y se lee la mas cercana al dedo.

   Ficha: { que, estado, sonido?, tropa?, causas? }. Si trae `tropa`, su voz sale de `AtlasSintesis.vozDe` (la misma que
   suena). Lo que no declara sonido es «NO_DATA sonoro», declarado. Sin red, sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  var piezas = [], panel = null, ultima = null, T = function (k) { return ''; };

  /* El UNICO formateo de lo ausente (A1B8): null, undefined, '' o NaN se escriben NO_DATA con su causa. */
  function nd(v, causa) {
    if (v === null || v === undefined || v === '' || (typeof v === 'number' && v !== v)) { return 'NO_DATA (' + (causa || 'not measured') + ')'; }
    /* Y dentro de un texto ya armado («army » + algo ausente): la palabra suelta tambien se vuelve NO_DATA. */
    return String(v).replace(/\b(undefined|NaN|null)\b/g, 'NO_DATA');
  }
  function sonidoDe(f) {
    if (f.sonido) { return f.sonido; }
    var S = raiz.AtlasSintesis;
    if (f.tropa && S && S.vozDe) { var r = S.vozDe(f.tropa); if (r && r.portadora) { return 'FM voice · carrier ' + r.portadora + ' Hz'; } }
    return nd(null, f.tropa ? 'sound engine not loaded' : (T('ins_sin_sonido') || 'this piece declares no sound'));
  }
  /* Las lineas de la ficha, puras: el lab y el test las leen igual que la persona. */
  function lineas(f, x, y) {
    f = f || {};
    var R = (T('ins_campos') || 'What|State|Coordinate|Sound|Note').split('|');
    var lin = [[R[0], nd(f.que, 'unnamed piece')], [R[1], nd(f.estado, 'no state declared')],
               [R[2], isFinite(x) && isFinite(y) ? 'world (' + Math.round(x) + ', ' + Math.round(y) + ') · depth ' + Math.round(x + y) : nd(null, 'no position')],
               [R[3], sonidoDe(f)]];
    (f.causas || []).forEach(function (c) { lin.push([R[4], nd(c, 'empty note')]); });
    return lin;
  }
  /* mar.js, tras ordenar la cola: guarda donde quedo cada pieza con ficha (pixeles del lienzo). */
  function registra(cola, P, texto) {
    if (texto) { T = texto; }
    piezas = [];
    cola.forEach(function (it) { if (it.ficha) { var p = P(it.col, it.fila); piezas.push({ x: p[0], y: p[1], col: it.col, fila: it.fila, ficha: it.ficha }); } });
  }
  function abre(lin) {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja) { return; }
    if (!panel || !panel.isConnected) {
      panel = D.createElement('details'); panel.className = 'thegame-pliego'; panel.id = 'pliego-ficha'; panel.open = true;
      var s = D.createElement('summary'); s.textContent = T('ins_nombre') || 'Inspector'; panel.appendChild(s);
      panel.appendChild(D.createElement('dl')); caja.appendChild(panel);
    }
    var dl = panel.querySelector('dl'); dl.textContent = '';
    lin.forEach(function (l) { var dt = D.createElement('dt'), dd = D.createElement('dd'); dt.textContent = l[0]; dd.textContent = l[1]; dl.appendChild(dt); dl.appendChild(dd); });
    /* El menu descubre el panel con un MutationObserver (microtarea): se abre DESPUES de que exista su entrada. */
    Promise.resolve().then(function () { var b = D.getElementById('menu-pliego-ficha'); if (b && panel.hidden) { b.click(); } });
  }
  /* El toque corto (pixeles del lienzo): la pieza mas cercana a menos de `radio`. Devuelve sus lineas o null. */
  function toca(px, py, radio) {
    var mejor = null, d0 = radio || 44;
    piezas.forEach(function (q) { var d = Math.hypot(q.x - px, q.y - py); if (d < d0) { d0 = d; mejor = q; } });
    if (!mejor) { return null; }
    ultima = lineas(mejor.ficha(), mejor.col, mejor.fila);
    abre(ultima);
    return ultima;
  }
  function vista() { return ultima ? ultima.slice() : null; }
  /* Todas las fichas del ultimo cuadro (el lab y el arnes sin_undefined las leen sin tocar la pantalla). */
  function todas() { return piezas.map(function (q) { return lineas(q.ficha(), q.col, q.fila); }); }

  var AtlasInspector = { nd: nd, lineas: lineas, registra: registra, toca: toca, vista: vista, todas: todas };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasInspector; } else { raiz.AtlasInspector = AtlasInspector; }
})(this);
