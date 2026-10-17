
(function () {
  'use strict';

  var BASE = 'atlas-guardado', ALM = 'partidas', CLAVE = 'actual', AUTO_MS = 4000, auto = false, hechos = -1;

  var PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|\b\d{1,3}(\.\d{1,3}){3}\b/i;

  function db() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ALM); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { mal(r.error); };
    });
  }
  function op(modo, hacer) {
    return db().then(function (d) {
      return new Promise(function (ok, mal) {
        var tx = d.transaction(ALM, modo), q = hacer(tx.objectStore(ALM));
        tx.oncomplete = function () { d.close(); ok(q && q.result); };
        tx.onerror = function () { d.close(); mal(tx.error); };
      });
    });
  }
  function limpia(p) {
    var s = JSON.stringify(p);
    if (!p || p.esquema !== 'atlas.partida/1') { throw new Error('esquema'); }
    if (PROHIBIDO.test(s)) { throw new Error('la partida lleva algo que parece ruta, correo, URL o IP'); }
    return JSON.parse(s);
  }

  var J = null, T = function (k) { return (J && J.texto(k)) || ''; }, R = {}, pendiente = null;
  function el(t, c, x) { var n = document.createElement(t); if (c) { n.className = c; } if (x) { n.textContent = x; } return n; }
  function boton(x, f) { var b = el('button', 'boton-sec', x); b.type = 'button'; b.addEventListener('click', f); return b; }
  function rellena(t, v) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return k in v ? v[k] : ''; }); }
  function dice(t) { R.estado.textContent = t; }
  function preparaRetomar() {
    if (!R.retomar || !pendiente || !pendiente.final) { return; }
    R.retomar.textContent = rellena(T('retomar'), { c: pendiente.final.ciclo }); R.retomar.hidden = false;
  }


  function retoma(p, como) {
    var vis = {}, P = window.AtlasPartida, M = window.AtlasMotor, C = window.AtlasCarta;
    try {
      var e = J.retoma(limpia(p), function (s) { if (C) { vis[C.visita(P.instantanea(s, M))] = 1; } });
      if (window.AtlasMapa && window.AtlasMapa.visitas) { window.AtlasMapa.visitas(Object.keys(vis)); }
      dice(rellena(T('guardado_retomado'), { c: e.t, n: p.pasos.length, f: como }));
      return true;
    } catch (x) {
      dice(rellena(T('guardado_nd'), { m: x.message }));
      return false;
    }
  }


  function guarda(callado) {
    var p;
    if (callado === true && !auto) { return; }
    try { p = limpia(J.partida()); } catch (x) { if (callado !== true) { dice(rellena(T('guardado_nd'), { m: x.message })); } return; }
    if (callado === true && p.pasos.length === hechos) { return; }
    auto = true; hechos = p.pasos.length;
    op('readwrite', function (s) { return s.put(p, CLAVE); }).then(function () {
      if (callado === true) { return; }
      dice(rellena(T('guardado_ok'), { c: p.final.ciclo, n: p.pasos.length }));
      pendiente = null; if (R.retomar) { R.retomar.hidden = true; }
    }).catch(function (x) { dice(rellena(T('guardado_nd'), { m: x && x.message })); });
  }
  function olvida() {
    auto = false;
    op('readwrite', function (s) { return s.delete(CLAVE); }).then(function () {
      pendiente = null; dice(T('guardado_olvidado')); if (R.retomar) { R.retomar.hidden = true; }
    }).catch(function (x) { dice(rellena(T('guardado_nd'), { m: x && x.message })); });
  }
  function importa(f) {

    var TG = window.TheGame;
    Promise.all([f.text(), TG && TG.army ? TG.army() : null]).then(function (r) {
      var txt = r[0], o = JSON.parse(txt), p = o && o.esquema === 'atlas.partida.firmada/1' ? o.partida : o;
      var m = o && o.firma && /^ed25519:([0-9a-f]+)$/.exec(o.firma), A = window.AtlasArmy;
      var firma = m && A && o.clave_publica ? A.verificaWeb(JSON.stringify(p), m[1], o.clave_publica) : Promise.resolve(null);
      return firma.then(function (v) {
        retoma(p, T(v === true ? 'importada_firma_ok' : v === false ? 'importada_firma_mal' : 'importada_sin_firma'));
      });
    }).catch(function (x) { dice(rellena(T('guardado_nd'), { m: x && x.message })); });
  }

  function monta(capa) {
    J = window.AtlasJuego;
    var cab = capa && capa.querySelector('#atlas-piso .atlas-sello');
    if (!J || !J.retoma || !cab || !window.indexedDB || !T('guardar')) { return; }
    var caja = el('div', 'atlas-guardado');
    R.estado = el('p', 'atlas-nota'); R.estado.setAttribute('role', 'status');
    R.estado.classList.add('atlas-guardado-recibo'); caja.appendChild(R.estado);
    cab.parentNode.insertBefore(caja, cab.nextSibling);

    op('readonly', function (s) { return s.get(CLAVE); }).then(function (p) {
      if (p && p.final && !retoma(p, T('guardado_de_aqui'))) {
        pendiente = p; preparaRetomar(); return;
      }
      auto = true;
    }).catch(function () {});
    document.addEventListener('visibilitychange', function () { if (document.hidden) { guarda(true); } });
    window.addEventListener('pagehide', function () { guarda(true); });
    setInterval(function () { guarda(true); }, AUTO_MS);
  }


  function montaInspector(panel) {
    if (!panel || panel.querySelector('.atlas-guardado-controls') || !R.estado) { return; }
    var caja = el('div', 'atlas-guardado-controls'); caja.appendChild(el('h5', null, T('guardado_maquina') || 'Local save controls'));
    caja.appendChild(boton(T('guardar'), guarda));
    R.retomar = boton('', function () {
      op('readonly', function (s) { return s.get(CLAVE); }).then(function (p) {
        if (p && retoma(p, T('guardado_de_aqui'))) { pendiente = null; R.retomar.hidden = true; }
      });
    });
    R.retomar.hidden = true; caja.appendChild(R.retomar); preparaRetomar();
    caja.appendChild(boton(T('olvidar'), olvida));
    var fi = el('input'); fi.type = 'file'; fi.accept = 'application/json,.json'; fi.hidden = true;
    fi.addEventListener('change', function () { if (fi.files[0]) { importa(fi.files[0]); } fi.value = ''; });
    caja.appendChild(fi); caja.appendChild(boton(T('importar'), function () { fi.click(); }));
    panel.appendChild(caja);
  }

  window.AtlasGuardado = { monta: monta, montaInspector: montaInspector, limpia: limpia };
})();
