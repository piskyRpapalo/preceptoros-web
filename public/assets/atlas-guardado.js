/* preceptoros.org · theGame · GUARDAR, RETOMAR, IMPORTAR: solo cuando la persona pulsa.

   LO QUE SE GUARDA ES LA PARTIDA, NO UN ESTADO. `atlas.partida/1` (la ley y los pasos, con su
   origen) es ya un esquema cerrado: sin rutas, sin hosts, sin IPs, sin claves, sin datos de la
   persona, sin fechas de reloj. Al retomar no se cree: se vuelve a jugar con el motor puro, y si
   no sale el mismo final o la version de contenido no es esta, se dice la causa y no se carga.
   Un guardado manipulado no vuelve a entrar, por construccion.

   SE GUARDA SOLO (plan firmado 2026-10-05, capa C1: «salir del juego hace perder recursos y army:
   eso se arregla»). Al abrir, lo guardado se RETOMA (reproducido, como siempre); despues se guarda al
   ocultarse la pestana, al salir y cada AUTO_MS si hubo pasos nuevos. Nunca antes de haber leido lo
   guardado: una partida nueva no pisa la vieja. «Olvidar» apaga el autoguardado hasta pulsar Guardar.
   Importar sigue siendo un boton. Se guarda en ESTE dispositivo (IndexedDB,
   una base propia `atlas-guardado` con un unico registro): `auth.js` sigue siendo el unico dueno
   de la base `preceptoros`. Nada sale del aparato; para llevarlo a otro, se exporta firmado.

   Exportar ya existe (firmado, en `atlas-piloto-capa.js`). Importar acepta la partida pelada o
   la firmada; la firma se comprueba con el verificador de la web (`AtlasArmy.verificaWeb`) y la
   partida se reproduce siempre, firmada o no. */
(function () {
  'use strict';

  var BASE = 'atlas-guardado', ALM = 'partidas', CLAVE = 'actual', AUTO_MS = 4000, auto = false, hechos = -1;
  /* La guarda del esquema: lo que parezca ruta, correo, URL o IP no se guarda (joya: el dato que
     sale de la partida no lleva nada de la maquina ni de la persona). */
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

  var J = null, T = function (k) { return (J && J.texto(k)) || ''; }, R = {};
  function el(t, c, x) { var n = document.createElement(t); if (c) { n.className = c; } if (x) { n.textContent = x; } return n; }
  function boton(x, f) { var b = el('button', 'boton-sec', x); b.type = 'button'; b.addEventListener('click', f); return b; }
  function rellena(t, v) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return k in v ? v[k] : ''; }); }
  function dice(t) { R.estado.textContent = t; }
  function sello(t) { var s = document.querySelector('#atlas-piso .atlas-sello'); if (s && t) { s.textContent = t; } }

  /* Retomar: se reproduce la partida y, de paso, se recogen las visitas para la niebla real. */
  function retoma(p, como) {
    var vis = {}, P = window.AtlasPartida, M = window.AtlasMotor, C = window.AtlasCarta;
    try {
      var e = J.retoma(limpia(p), function (s) { if (C) { vis[C.visita(P.instantanea(s, M))] = 1; } });
      if (window.AtlasMapa && window.AtlasMapa.visitas) { window.AtlasMapa.visitas(Object.keys(vis)); }
      dice(rellena(T('guardado_retomado'), { c: e.t, n: p.pasos.length, f: como }));
      sello(rellena(T('sello_guardado'), { c: e.t }));
      return true;
    } catch (x) {
      dice(rellena(T('guardado_nd'), { m: x.message }));
      return false;
    }
  }

  /* `callado`: el autoguardado. Solo escribe si esta encendido y hubo pasos nuevos, y no habla. */
  function guarda(callado) {
    var p;
    if (callado === true && !auto) { return; }
    try { p = limpia(J.partida()); } catch (x) { if (callado !== true) { dice(rellena(T('guardado_nd'), { m: x.message })); } return; }
    if (callado === true && p.pasos.length === hechos) { return; }
    auto = true; hechos = p.pasos.length;
    op('readwrite', function (s) { return s.put(p, CLAVE); }).then(function () {
      if (callado === true) { sello(rellena(T('sello_guardado'), { c: p.final.ciclo })); return; }
      dice(rellena(T('guardado_ok'), { c: p.final.ciclo, n: p.pasos.length }));
      sello(rellena(T('sello_guardado'), { c: p.final.ciclo }));
      R.retomar.hidden = true;
    }).catch(function (x) { dice(rellena(T('guardado_nd'), { m: x && x.message })); });
  }
  function olvida() {
    auto = false;
    op('readwrite', function (s) { return s.delete(CLAVE); }).then(function () {
      dice(T('guardado_olvidado')); sello(T('sello')); R.retomar.hidden = true;
    }).catch(function (x) { dice(rellena(T('guardado_nd'), { m: x && x.message })); });
  }
  function importa(f) {
    /* El verificador de la firma vive con el Army, que se carga con su pestana: se pide antes. */
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
    caja.appendChild(boton(T('guardar'), guarda));
    R.retomar = boton('', function () {
      op('readonly', function (s) { return s.get(CLAVE); }).then(function (p) {
        if (p && retoma(p, T('guardado_de_aqui'))) { R.retomar.hidden = true; }
      });
    });
    R.retomar.hidden = true; caja.appendChild(R.retomar);
    caja.appendChild(boton(T('olvidar'), olvida));
    var fi = el('input'); fi.type = 'file'; fi.accept = 'application/json,.json'; fi.hidden = true;
    fi.addEventListener('change', function () { if (fi.files[0]) { importa(fi.files[0]); } fi.value = ''; });
    caja.appendChild(fi);
    caja.appendChild(boton(T('importar'), function () { fi.click(); }));
    R.estado = el('p', 'atlas-nota'); R.estado.setAttribute('role', 'status');
    caja.appendChild(R.estado);
    cab.parentNode.insertBefore(caja, cab.nextSibling);
    /* Leer lo guardado no saca nada del aparato. Si hay partida, se retoma sola; si no se puede, se
       dice la causa y queda el boton. Solo despues se enciende el autoguardado. */
    op('readonly', function (s) { return s.get(CLAVE); }).then(function (p) {
      if (p && p.final && !retoma(p, T('guardado_de_aqui'))) {
        R.retomar.textContent = rellena(T('retomar'), { c: p.final.ciclo }); R.retomar.hidden = false; return;
      }
      auto = true;
    }).catch(function () {});
    document.addEventListener('visibilitychange', function () { if (document.hidden) { guarda(true); } });
    window.addEventListener('pagehide', function () { guarda(true); });
    setInterval(function () { guarda(true); }, AUTO_MS);
  }

  window.AtlasGuardado = { monta: monta, limpia: limpia };
})();
