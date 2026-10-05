/* preceptoros.org · theGame · EL MAPA GLOBAL DE LA CASA y LA CUENTA MAESTRA, dentro de la Arena.

   EL MAPA (Soberano, 2026-10-04: «mapa global con nodo hexelion activo»). Cada nodo de la casa es un
   punto; Hexelion es el centro. «Activo» lo dice `AtlasCuenta.estadoNodo` desde la cedula (medidas
   MEDIDO con fecha) y el latido vivo es NO_DATA: la web no lee al rack al cargar. Se dice asi en
   pantalla, sin adorno que lo disimule.

   LA CUENTA MAESTRA. Se ensena la PANTALLA y el FORMATO (`preceptoros.cuenta-maestra/1`): el nodo
   y la clave publica de la identidad de este navegador, que crea `auth.js` cuando la persona lo
   pide. Nace PROPUESTA; el vinculo con la app local y con el lab es NO_DATA hasta que el Soberano la
   firme en el registro del rack. Ni red, ni reloj, ni azar, ni almacen en este fichero. */
(function () {
  'use strict';

  var C = window.AtlasNodosCedulas, Q = window.AtlasCuenta, T = function (k) { return k; };

  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }

  function cifra(c, e) {
    var m = c.aparato.medidas[e];
    if (!m || m.valor === null) { return null; }
    return (e === 'gen_cps' ? (m.valor / 100) + ' tok/s' : Math.floor(m.valor / 1024) + ' GiB') + ' ' + T('nodos_est_' + m.estado);
  }

  /* --- el mapa: un punto por nodo, Hexelion en el centro --------------------------------------- */
  function punto(c) {
    var e = Q.estadoNodo(c), vivo = e.activo === 'DECLARADO';
    var li = el('li', 'atlas-rack-nodo' + (vivo ? ' activo' : '') + (c.nodo === Q.MAESTRO ? ' maestro' : ''));
    var pin = el('span', 'atlas-rack-pin'); pin.setAttribute('aria-hidden', 'true'); li.appendChild(pin);
    li.appendChild(el('strong', null, c.nodo));
    li.appendChild(el('span', 'atlas-nota', c.aparato.dispositivo));
    li.appendChild(el('span', vivo ? 'atlas-medido' : 'no-data',
      vivo ? rellena(T('rack_activo'), { d: e.desde, n: e.medidas }) : T('rack_inactivo')));
    var cs = ['ram_mib', 'gen_cps'].map(function (k) { return cifra(c, k); }).filter(Boolean);
    if (cs.length) { li.appendChild(el('span', 'atlas-casa', cs.join(' · '))); }
    li.appendChild(el('span', 'no-data', T('rack_latido')));
    return li;
  }

  /* --- la cuenta maestra -------------------------------------------------------------------------- */
  function cuenta(caja) {
    caja.textContent = '';
    caja.appendChild(el('h6', null, T('cuenta_h')));
    caja.appendChild(el('p', 'atlas-nota', T('cuenta_nota')));
    caja.appendChild(el('p', 'atlas-casa', T('cuenta_estado')));
    var lista = el('ul', 'atlas-cuenta-une'), web = el('li');
    lista.appendChild(web);
    ['cuenta_app', 'cuenta_lab'].forEach(function (k) { lista.appendChild(el('li', 'no-data', T(k))); });
    caja.appendChild(lista);
    var tec = el('details', 'thegame-tecnico'); tec.appendChild(el('summary', null, T('cuenta_formato')));
    var pre = el('pre', 'atlas-arena-log'); tec.appendChild(pre);
    caja.appendChild(tec);
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) {
      web.className = 'no-data'; web.textContent = T('cuenta_web_sin');
      pre.textContent = T('cuenta_sin_formato');
      if (I && I.crear) {
        var b = el('button', 'boton-sec', T('nodos_crear_id')); b.type = 'button';
        b.addEventListener('click', function () { I.crear().then(function () { cuenta(caja); }, function () {}); });
        web.appendChild(document.createTextNode(' ')); web.appendChild(b);
      }
      return;
    }
    I.publica().then(function (pub) {
      var c = Q.cuentaMaestra(C, pub);
      web.className = 'atlas-medido';
      web.textContent = rellena(T('cuenta_web'), { q: I.quien(), h: pub.slice(0, 16) });
      pre.textContent = JSON.stringify(c, null, 1);
    }, function (e) {
      web.className = 'no-data'; web.textContent = 'NO_DATA · ' + (e && e.message);
    });
  }

  function monta(cont, textos) {
    if (!cont || cont.firstChild || !C || !Q) { return; }
    T = textos || T;
    var s = el('section', 'atlas-rack');
    s.appendChild(el('h5', null, T('rack_h')));
    s.appendChild(el('p', 'atlas-nota', T('rack_nota')));
    var mapa = el('ol', 'atlas-rack-mapa');
    mapa.setAttribute('aria-label', T('rack_h'));
    C.nodos.forEach(function (c) { mapa.appendChild(punto(c)); });
    s.appendChild(mapa);
    var caja = el('div', 'panel atlas-cuenta'); s.appendChild(caja);
    cuenta(caja);
    cont.appendChild(s);
  }

  window.AtlasRackUI = { monta: monta };
})();
