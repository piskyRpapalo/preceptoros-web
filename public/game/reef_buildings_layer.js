/* preceptoros.org · theGame · LOS EDIFICIOS DEL ARRECIFE, pintados en el mapa (los 9 objetos, FIRMO 2026-10-12).

   Capa aparte (como `mar-anclas.js`): `mar.js` esta a ~1,3 KB de su techo y solo la llama. El TIEMPO de cada
   edificio sale de `reef_building_lifecycle.js` (puro: manifiesto + tic); aqui solo se pinta y se avisa.

   EL PRIMERO, LA BOYA DEL ESTADO: flota junto a tu casa y dice si tu mundo esta MEDIDO. Su «cuidado» es la ultima
   noticia LIVE de la Radio (el chat de abajo): mientras el juego dice cosas frescas, vive; sin noticias se despinta
   a 8 por mil cada ciclo y cae a NO_DATA justo despues de que el chat las marque STALE (120 ciclos). Un solo reloj.
   - El color es ∇C (el de la ficha, no decoracion) y el TAMANO es la vida medida (Escala Viva); NO_DATA, hueca y gris.
   - Al cambiar de fase da un PITIDO corto con envolvente ADSR (J-SN-14, ~60 ms; solo si la persona encendio el
     sonido) y lo cuenta en el chat con su sello. Al abrir no pita: se observa primero.
   - El lab lee `vectores()`, no los pixeles. Sin red, sin azar, sin reloj de pared. */
(function (raiz) {
  'use strict';
  var DESGASTE = 8, PITO = { vivo: 880, naciendo: 880, gastado: 660, NO_DATA: 440 };
  var ultima = null, vistos = [];

  /* El manifiesto de la boya: anclado a tu casa (entero, determinista). Sin casa medida, no hay boya. */
  function manifiestoBoya(casa) {
    if (!casa) { return null; }
    return { esquema: 'preceptoros.edificio/1', id: 'boya-estado', tipo: 'boya', col: Math.round(casa.x + 70), fila: Math.round(casa.y - 50),
             huella: 1, nace_tic: 0, madura_tics: 3, desgaste_por_tic: DESGASTE, carga: 300, escudo: 0, emboscable: false };
  }
  /* El ultimo ciclo con una noticia LIVE (o que lo fue y ya es STALE) en la Radio. Sin ninguna: null (no se inventa). */
  function cuidadoDe(registro) {
    var c = null;
    (registro || []).forEach(function (m) { if ((m.sello === 'LIVE' || m.sello === 'STALE') && (c === null || m.ciclo > c)) { c = m.ciclo; } });
    return c;
  }
  function ciclo() { var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null; return i && typeof i.ciclo === 'number' ? i.ciclo : null; }

  function pita(fase) {
    var S = raiz.AtlasSintesis, f = PITO[fase];
    if (S && S.suena && f) { S.suena({ tipo: 'onda', portadora: f, moduladora: f, indice: 0, dur: 0.06, gan: 0.05, adsr: [0.005, 0.02, 0.4, 0.02] }); }
  }
  function avisa(fase, v, texto) {
    pita(fase);
    var R = raiz.AtlasRadioChat, t = texto || function (k, d) { return d; };
    if (!R || !R.dice) { return; }
    var F = (t('boya_fases') || '').split('|'), i = ['naciendo', 'vivo', 'gastado'].indexOf(fase);
    var msg = fase === 'NO_DATA' ? 'NO_DATA · ' + (v.causa || '') : (F[i] || fase) + ' · ∇C ' + (v.hsl || []).join('/');
    R.dice({ quien: t('boya_estado', 'State buoy'), fuente: 'boya', texto: msg, sello: fase === 'NO_DATA' ? 'NO_DATA' : 'LIVE' });
  }

  /* g: contexto; P(x, y) -> pixeles; o: { pub, sha, dpr, t, quieto, texto(k) }. */
  function pinta(g, P, o) {
    var L = raiz.ReefBuildingLifecycle, N = raiz.AtlasNiebla, R = raiz.AtlasRadioChat, tic = ciclo();
    if (!L || !N || tic === null) { vistos = []; return; }
    var m = manifiestoBoya(N.sitioCasa(o.pub, o.sha));
    if (!m) { vistos = []; return; }
    var cu = cuidadoDe(R && R.registro ? R.registro() : []);
    if (cu !== null) { m.cuidado_tic = Math.max(cu, m.nace_tic); }
    var v = L.vector(m, tic), c = L.color(m, tic), dpr = o.dpr || 1;
    vistos = [v];
    if (ultima !== null && ultima !== v.fase) { avisa(v.fase, v, o.texto); }
    ultima = v.fase;
    var p = P(m.col, m.fila), y = p[1] + (o.quieto ? 0 : Math.sin((o.t || 0) * 0.002) * 2 * dpr);
    var r = (5 + (v.vida === null ? 3 : v.vida * 4 / 1000)) * dpr;
    g.strokeStyle = 'rgba(155,227,255,.6)'; g.lineWidth = 1.5 * dpr;
    g.beginPath(); g.moveTo(p[0], y + r); g.lineTo(p[0], y + r + 7 * dpr); g.stroke();
    g.beginPath(); g.arc(p[0], y, r, 0, 2 * Math.PI);
    if (c.nd) { g.setLineDash([2 * dpr, 2 * dpr]); g.strokeStyle = 'rgba(150,160,180,' + c.a + ')'; g.stroke(); g.setLineDash([]); }
    else { g.globalAlpha = c.a; g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)'; g.fill(); g.globalAlpha = 1; g.stroke(); }
    g.lineWidth = dpr; g.fillStyle = 'rgba(155,227,255,.75)';
    g.fillText(o.texto ? o.texto('boya_estado') : 'State buoy', p[0], y - r - 4 * dpr);
  }
  function vectores() { return vistos.slice(); }

  raiz.AtlasArrecife = { pinta: pinta, vectores: vectores, manifiestoBoya: manifiestoBoya, cuidadoDe: cuidadoDe, DESGASTE: DESGASTE };
})(this);
