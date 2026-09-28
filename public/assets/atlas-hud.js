/* preceptoros.org · theGame · EL CONTADOR DE FARMEO: solo lo medido, o NO_DATA.

   Lee las instantaneas que ya reparte la voz del Preceptor (via `AtlasMapa.estado`) y calcula el
   RITMO real de tu base: cuanto subio o bajo cada recurso por cada 100 ciclos, entre la primera y
   la ultima instantanea de una ventana de 300 ciclos. Sin dos puntos no hay ritmo: NO_DATA.

   NO PROMETE LO QUE NO MIDE. La energia y la temperatura del aparato no las ve un navegador: se
   dicen NO_DATA con su causa, no se estiman. En PC queda fijo en una esquina; en movil va en su
   sitio. Es un `<details>`: se pliega, y plegado no molesta.

   SE CARGA AL ABRIRLO (2026-09-28): `thegame.js` pone el rotulo plegado y trae esta pieza al
   desplegarlo, porque el peso de la puerta del juego es una ley del mundo. El ritmo empieza a
   medirse desde ahi: hasta tener dos lecturas, NO_DATA. */
(function () {
  'use strict';

  var VENTANA = 300, hist = [], R = null;

  function monta(capa, d) {
    var J = window.AtlasJuego;
    if (!J || !d || !J.texto('hud_t')) { return; }
    var T = function (k) { return J.texto(k) || ''; };
    R = { T: T, d: d };
    R.dl = document.createElement('dl'); R.d.appendChild(R.dl);
    var nd = document.createElement('p'); nd.className = 'atlas-nota'; nd.textContent = T('hud_nd');
    R.d.appendChild(nd);
    pinta();
    var ins = J.instantanea && J.instantanea();
    if (ins) { estado(ins); }
  }

  function fila(k, v) {
    var dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = R.T(k); dd.textContent = v;
    R.dl.appendChild(dt); R.dl.appendChild(dd);
  }
  function ritmo(k) {
    if (hist.length < 2) { return 'NO_DATA'; }
    var a = hist[0], b = hist[hist.length - 1], dc = b.ciclo - a.ciclo;
    if (dc <= 0) { return 'NO_DATA'; }
    var r = (b.recursos[k] - a.recursos[k]) * 100 / dc;
    return (r > 0 ? '+' : '') + r.toFixed(1);
  }
  function pinta() {
    if (!R) { return; }
    while (R.dl.firstChild) { R.dl.removeChild(R.dl.firstChild); }
    var u = hist[hist.length - 1];
    fila('hud_ciclo', u ? String(u.ciclo) : 'NO_DATA');
    fila('hud_luz', ritmo('luz'));
    fila('hud_bio', ritmo('biomasa'));
    fila('hud_cobre', ritmo('cobre'));
    fila('hud_flujo', u ? u.recursos.flujo + '%' : 'NO_DATA');
    fila('hud_energia', 'NO_DATA');
  }
  function estado(ins) {
    if (!ins || ins.esquema !== 'atlas.instantanea/1') { return; }
    var u = hist[hist.length - 1];
    /* Una partida retomada o reiniciada no se mezcla con la anterior: si el ciclo vuelve atras, se empieza de cero. */
    if (u && ins.ciclo < u.ciclo) { hist = []; }
    hist.push({ ciclo: ins.ciclo, recursos: ins.recursos });
    while (hist.length > 2 && hist[hist.length - 1].ciclo - hist[0].ciclo > VENTANA) { hist.shift(); }
    pinta();
  }

  window.AtlasHud = { monta: monta, estado: estado };
})();
