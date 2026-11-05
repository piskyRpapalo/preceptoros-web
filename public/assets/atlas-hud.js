(function () {
  'use strict';

  var VENTANA = 300, hist = [], R = null, causaEstado = null;
  function cicloValido(c) { return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000; }

  function monta(capa, d) {
    var J = window.AtlasJuego;
    if (!J || !d || !J.texto('hud_t')) { return; }
    var T = function (k) { return J.texto(k) || ''; };
    R = { T: T, d: d };
    R.dl = document.createElement('dl'); R.d.appendChild(R.dl);
    var nd = document.createElement('p'); nd.className = 'atlas-nota'; nd.textContent = T('hud_nd');
    R.d.appendChild(nd);
    pinta();
    try { estado(J.instantanea && J.instantanea()); }
    catch (_) { estado(null); }
  }

  function fila(k, v) {
    var dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = R.T(k); dd.textContent = v;
    R.dl.appendChild(dt); R.dl.appendChild(dd);
  }
  function ritmo(k) {
    if (hist.length < 2) { return causaEstado || 'NO_DATA (two measured snapshots required)'; }
    var a = hist[0], b = hist[hist.length - 1], dc = b.ciclo - a.ciclo;
    if (dc <= 0) { return 'NO_DATA (distinct game cycles required)'; }
    var r = (b.recursos[k] - a.recursos[k]) * 100 / dc;
    if (!Number.isFinite(r)) { return 'NO_DATA (resource rate outside finite range)'; }
    return (r > 0 ? '+' : '') + r.toFixed(1);
  }
  function pinta() {
    if (!R) { return; }
    while (R.dl.firstChild) { R.dl.removeChild(R.dl.firstChild); }
    var u = hist[hist.length - 1];
    fila('hud_ciclo', u ? String(u.ciclo) : (causaEstado || 'NO_DATA (game snapshot unavailable)'));
    fila('hud_luz', ritmo('luz'));
    fila('hud_bio', ritmo('biomasa'));
    fila('hud_cobre', ritmo('cobre'));
    fila('hud_flujo', u ? u.recursos.flujo + '%' : (causaEstado || 'NO_DATA (game snapshot unavailable)'));
    fila('hud_energia', 'NO_DATA (device energy not measured by this browser)');
  }
  function estado(ins) {
    if (!ins || ins.esquema !== 'atlas.instantanea/1') {
      hist = []; causaEstado = 'NO_DATA (game snapshot unavailable or unsupported)'; pinta(); return;
    }
    if (!cicloValido(ins.ciclo)) {
      hist = []; causaEstado = 'NO_DATA (game cycle unavailable or invalid)'; pinta(); return;
    }
    var recursos = ins.recursos, campos = ['luz', 'biomasa', 'cobre', 'flujo'];
    if (!recursos || typeof recursos !== 'object' || Array.isArray(recursos)
        || campos.some(function (k) { return typeof recursos[k] !== 'number' || !Number.isFinite(recursos[k]); })) {
      hist = []; causaEstado = 'NO_DATA (game resource snapshot invalid)'; pinta(); return;
    }
    causaEstado = null;
    var u = hist[hist.length - 1];

    if (u && ins.ciclo < u.ciclo) { hist = []; }
    hist.push({ ciclo: ins.ciclo, recursos: Object.assign({}, ins.recursos) });
    while (hist.length > 2 && hist[hist.length - 1].ciclo - hist[0].ciclo > VENTANA) { hist.shift(); }
    pinta();
  }

  window.AtlasHud = { monta: monta, estado: estado };
})();
