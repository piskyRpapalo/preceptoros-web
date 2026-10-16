(function (raiz) {
  'use strict';

  var ESQUEMA = 'atlas.casa/1';
    var OPCIONES = { estilo: ['cupula', 'aguja', 'concha'], emblema: [0, 1, 2],
                   alianzas: ['abiertas', 'cerradas'], comercio: [true, false],
                   formacion: ['agresiva', 'defensiva', 'flanqueo'],
                                      bandera: [null, 'teal', 'ambar', 'hielo', 'violeta', 'coral', 'kelp', 'oro', 'rosa'] };
  var PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|www\.|\b\d{1,3}(\.\d{1,3}){3}\b|\d{6,}/i;
  function base() { return { esquema: ESQUEMA, estilo: 'cupula', emblema: 0, alianzas: 'abiertas', comercio: true, formacion: 'agresiva', lema: '', bandera: null }; }
    function migra(c) {
    if (c && typeof c === 'object') { if (!('bandera' in c)) { c.bandera = null; } delete c.paleta; }
    return c;
  }
    function forma(c) {
    if (!c || typeof c !== 'object' || c.esquema !== ESQUEMA) { return 'esquema'; }
    var k = Object.keys(c).sort().join();
    if (k !== Object.keys(base()).sort().join()) { return 'campos'; }
    for (var o in OPCIONES) { if (OPCIONES[o].indexOf(c[o]) < 0) { return o; } }
    if (typeof c.lema !== 'string' || c.lema.length > 32 || /[\u0000-\u001f<>]/.test(c.lema)) { return 'lema'; }
    if (PROHIBIDO.test(c.lema)) { return 'lema: sin datos personales (correo, URL, ruta, IP o telefono)'; }
    return '';
  }
  if (typeof module === 'object' && module.exports) { module.exports = { forma: forma, base: base, migra: migra, OPCIONES: OPCIONES, ESQUEMA: ESQUEMA }; return; }

  var TX = null, R = {}, casa = base(), pub = null;
    var CM = raiz.AtlasCasaMedidas, PARTES = CM.PARTES, DENTRO = CM.DENTRO;

  function T(k) { return (TX && TX[k]) || k; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function boton(texto, clase) { var b = el('button', clase, texto); b.type = 'button'; return b; }

    function db() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open('atlas-casa', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('casa'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
    });
  }
  function lee() {
    return db().then(function (d) {
      return new Promise(function (ok) { var q = d.transaction('casa').objectStore('casa').get('mia'); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(null); }; });
    }).catch(function () { return null; });
  }
  function guarda() {
    if (forma(casa)) { return; }
    db().then(function (d) { d.transaction('casa', 'readwrite').objectStore('casa').put(casa, 'mia'); }).catch(function () {});
  }

  function estado() {
    var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null;
    return i ? { nucleo: i.nivel_nucleo, grieta: i.grieta && i.grieta.abierta, i: i } : { nucleo: 1, grieta: false, i: null };
  }
    function cangrejo() {
    var i = estado().i, C = raiz.AtlasNodosCedulas, m = medidas(), nodo = false, CJ = raiz.AtlasCangrejo;
    if (pub && C) {
      nodo = C.nodos.some(function (n) { return (n.dispositivos || []).some(function (d) { return d.clave_publica === pub && d.estado === 'linkeado'; }); });
    }
    function nv(k) { return m[k] ? m[k].nivel : null; }
    return { semilla: pub || 'visitante', ciclo: i ? i.ciclo : 0, army: m.army ? m.army.nivel : 0, nodo: nodo, latido: null,
             cuerpo: CJ ? CJ.cuerpo({ nucleo: nv('nucleo'), army: nv('army'), bosque: nv('bosque'), faro: nv('faro') }) : null };
  }
    function medidas() {
    var inc = raiz.AtlasIncubadora, C = raiz.AtlasNodosCedulas, army = null;
    try { army = inc && inc.army ? (inc.army() || []).length : null; } catch (x) { army = null; }
    var nodos = C ? C.nodos.filter(function (n) { var m = n.aparato.medidas; return Object.keys(m).some(function (k) { return m[k].estado === 'MEDIDO'; }); }).length : null;
    return CM.medidas(estado().i, army, nodos, T);
  }
    function entra(id) {
    var a = PARTES.filter(function (e) { return e[0] === id; })[0];
    if (a && a[2] === 'faro') { var J = raiz.AtlasJuego; if (J && J.aplica) { J.aplica({ esquema: 'atlas.accion/1', accion: 'mover', dir: 'faro', origen: 'humano' }); } return; }
    if (a && a[2]) { if (raiz.TheGame && raiz.TheGame.ve) { raiz.TheGame.ve(a[2]); } return; }
    R.titulo.textContent = T('parte_' + id); R.cuerpo.textContent = '';
    DENTRO[id].split('|').forEach(function (s) { Array.prototype.forEach.call(R.alm.querySelectorAll(s), function (n) { R.cuerpo.appendChild(n); }); });
    R.dentro = id; R.int.hidden = false; R.est.hidden = true; R.volver.focus();
  }
  function sale() {
    if (!R.dentro) { return; }
    Array.prototype.slice.call(R.cuerpo.children).forEach(function (n) { R.alm.appendChild(n); });
    var id = R.dentro; R.dentro = null; R.int.hidden = true; R.est.hidden = false;
    var b = document.getElementById('parte-' + id); if (b) { b.focus(); }
  }

      function personaliza() {
    raiz.AtlasCasaPersonaliza.abre({ casa: casa, opciones: OPCIONES, T: T, forma: forma, guarda: guarda, raiz: R.raiz });
  }

    function textos() {
    var l = (raiz.AtlasLengua && raiz.AtlasLengua.actual) || 'en';
    return fetch('/atlas-casa-' + l + '.json').then(function (r) { if (!r.ok) { throw new Error('atlas-casa-' + l + '.json ' + r.status); } return r.json(); })
      .then(function (d) { TX = d.ui; });
  }
  function monta(panel) {
    if (!panel || panel.querySelector('.casa')) { return Promise.resolve(); }
    return textos().then(function () { construye(panel); }, function (e) { panel.appendChild(el('p', 'no-data', 'NO_DATA · ' + e.message)); });
  }
    function identidad() {
    var I = raiz.Identity, B = raiz.AtlasValores && raiz.AtlasValores.banderas, n = I && I.quien && I.quien();
    var c = cangrejo();
    R.quien.textContent = n || T('visitante');
    R.clase.textContent = T(c.nodo ? 'state_class_coral' : 'state_class_mar') || (c.nodo ? 'coral' : 'sea crab');
    R.color.style.background = casa.bandera && B ? 'hsl(' + B[casa.bandera] + ' 85% 60%)' : 'transparent';
    R.color.setAttribute('aria-label', T('p_bandera') + ' · ' + T('bandera_' + (casa.bandera || 'ninguna')));
  }
  function construye(panel) {
    if (!document.getElementById('casa-hoja')) {
      var h = document.createElement('link'); h.id = 'casa-hoja'; h.rel = 'stylesheet'; h.href = '/game/home.css'; document.head.appendChild(h);
    }
    R.raiz = el('div', 'casa'); R.raiz.id = 'casa-estado';
    R.alm = el('div', 'casa-almacen'); R.alm.hidden = true;
    var fila = el('div', 'casa-identidad'); R.quien = el('b', 'casa-quien'); R.clase = el('span', 'casa-clase'); R.clase.id = 'casa-clase';
    R.color = el('span', 'casa-color'); R.color.setAttribute('role', 'img');
    var pers = boton('✦ ' + T('personaliza'), 'boton-sec casa-pers-b'); pers.id = 'casa-personaliza'; pers.addEventListener('click', personaliza);
    fila.appendChild(R.quien); fila.appendChild(R.clase); fila.appendChild(R.color); fila.appendChild(pers);
    R.est = el('div', 'casa-cuerpo');
    raiz.AtlasCasaLateral.monta(R.est, { T: T, medidas: medidas, entra: entra });
    var tira = el('div', 'casa-tira');
    Array.prototype.slice.call(panel.children).forEach(function (n) {
      if (/atlas-cab|atlas-recursos|atlas-vivo|atlas-alerta|no-data/.test(n.className)) { tira.appendChild(n); } else { R.alm.appendChild(n); }
    });
    R.est.appendChild(tira);
    R.int = el('section', 'casa-interior'); R.int.hidden = true;
    var cab = el('div', 'casa-int-cab'); R.volver = boton('← ' + T('volver'), 'boton-sec'); R.volver.id = 'casa-volver'; R.volver.addEventListener('click', sale);
    R.titulo = el('h3'); cab.appendChild(R.volver); cab.appendChild(R.titulo); R.int.appendChild(cab);
    R.cuerpo = el('div', 'casa-int-cuerpo'); R.int.appendChild(R.cuerpo);
    R.raiz.appendChild(fila); R.raiz.appendChild(R.est); R.raiz.appendChild(R.int); R.raiz.appendChild(R.alm);
    panel.appendChild(R.raiz);
    if (raiz.AtlasCrabStateScreen) { raiz.AtlasCrabStateScreen.monta(R.raiz, { T: T }); }
    var I = raiz.Identity;
    (I && I.quien && I.quien() ? I.publica().then(function (k) { pub = k; }, function () {}) : Promise.resolve())
      .then(lee).then(function (g) { g = migra(g); if (g && !forma(g)) { casa = g; } identidad(); });
    identidad(); document.addEventListener('preceptor:identity', identidad);
  }

    function pon(k, v) { if (OPCIONES[k] && OPCIONES[k].indexOf(v) >= 0) { casa[k] = v; guarda(); if (R.quien) { identidad(); } } }
    raiz.AtlasCasa = { texto: function (k) { return (TX && TX[k]) || ''; }, pon: pon, monta: monta, forma: forma, casa: function () { return casa; },
                     medidas: medidas, entra: entra, sale: sale, cangrejo: cangrejo };
})(this);
