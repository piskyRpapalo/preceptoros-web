(function () {
  'use strict';

  var C = window.AtlasCarta;

  var CAUSA = { ingenieria: 'causa_ing', observatorio: 'causa_ojo', ya: 'causa_aqui', nada: 'causa_nada',
                sellada: 'causa_sellada', sin: 'causa_nd' };
  var NB = { arrecife: 'b1', ruinas: 'b2', bosque: 'b3', nucleo: 'b4' };

  function monta(v) {
    var J = window.AtlasJuego, caja = v.caja;
    if (!C || !J) { return; }
    function T(k) { return J.texto(k) || ''; }
    function rellena(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return k in o ? o[k] : ''; }); }
    function el(t, c, x) { var n = document.createElement(t); if (c) { n.className = c; } if (x) { n.textContent = x; } return n; }
    var sec = caja.parentNode;

    var ficha = el('section', 'atlas-ficha'); ficha.hidden = true;
    sec.insertBefore(ficha, caja.nextSibling);
    var abierta = null;
    function nombre(id) { return id === 'base' ? T('nodo_tuyo') : T('s_' + id); }
    function linea(e) {
      var s = e.estado;
      if (!s) { return 'NO_DATA'; }
      if (e.id === 'nucleo') { return rellena(T('ficha_nucleo'), { i: s.integridad, m: s.integridad_max, n: s.nivel, f: s.fase }); }
      if (e.id === 'grieta') { return T(s.abierta ? 'ficha_grieta_abierta' : 'ficha_grieta_sellada'); }
      if (e.id === 'base') { return rellena(T('ficha_base'), { f: s.flujo, b: s.biomasa }); }
      return 'NO_DATA';
    }
    function abre(id) {

      var ins = J.instantanea && J.instantanea();
      if (ins) { v.estado(ins); }
      var e = v.edificios().filter(function (x) { return x.id === id; })[0];
      while (ficha.firstChild) { ficha.removeChild(ficha.firstChild); }
      abierta = id;
      if (!e) {
        ficha.appendChild(el('p', 'no-data', id === 'base' ? T('nodo_nd') : 'NO_DATA'));
        ficha.hidden = false; return;
      }
      ficha.appendChild(el('h5', null, nombre(id)));
      ficha.appendChild(el('p', null, linea(e)));
      var nd = v.nodo(), xy = nd ? C.coord(nd.pub, id, e.x, e.y).corta : null;
      ficha.appendChild(el('p', 'atlas-medido', xy ? rellena(T('ficha_coord'), { c: xy }) : T('coord_nd')));
      if (e.accion) {
        var a = e.accion, b = el('button', 'boton', a.accion === 'bajar_a'
          ? rellena(T('ir_a'), { b: T(NB[a.banda]) }) : T(a.accion));
        b.type = 'button';
        b.addEventListener('click', function () {
          if (a.accion === 'reparar') {

            var g = caja.querySelector('[data-sector="grieta"]');
            if (g && g.tagName === 'BUTTON') { g.click(); return; }
          }
          J.aplica(a); abre(id);
        });
        ficha.appendChild(b);
      } else {
        ficha.appendChild(el('p', 'atlas-nota', T(CAUSA[String(e.causa).split(' ')[0]] || '') || e.causa));
      }
      ficha.hidden = false;
    }

    function controles() {
      var l = Array.prototype.slice.call(caja.querySelectorAll('[data-sector]'));
      if (v.nodo()) { l.push(v.etq); }
      return l.sort(function (a, b) { return xDe(a) - xDe(b); });
    }
    function xDe(b) { return b === v.etq ? v.nodo().x : C.SECTORES[b.dataset.sector]; }
    function idDe(b) { return b === v.etq ? 'base' : b.dataset.sector; }
    Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
      if (b.tagName !== 'BUTTON') {

        b.tabIndex = 0; b.setAttribute('role', 'button'); b.style.pointerEvents = 'auto';
        b.addEventListener('click', function () { abre(b.dataset.sector); });
        b.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abre(b.dataset.sector); }
        });
      } else {

        b.addEventListener('focus', function () { abre('grieta'); });
      }
    });
    v.etq.addEventListener('click', function () { abre('base'); });
    caja.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') { return; }
      var l = controles(), i = l.indexOf(document.activeElement);
      if (i < 0) { return; }
      ev.preventDefault();
      var n = l[(i + (ev.key === 'ArrowRight' ? 1 : l.length - 1)) % l.length];
      n.focus(); v.mira(xDe(n));
      if (abierta) { abre(idDe(n)); }
    });
    var nota = sec.querySelector('.atlas-nota');
    if (nota && T('mapa_mover')) { nota.textContent += ' ' + T('mapa_mover'); }

    var toma = null;
    caja.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('button,[role="button"]')) { return; }
      toma = { x: ev.clientX, y: ev.clientY, cam: v.cam(), id: ev.pointerId, t: ev.timeStamp, u: ev.clientX, v: 0 };
      caja.style.cursor = 'grabbing';
    });
    caja.addEventListener('pointermove', function (ev) {
      var g = v.g();
      if (!toma || ev.pointerId !== toma.id || !g) { return; }
      toma.v = (toma.u - ev.clientX) / g.sh; toma.u = ev.clientX;
      if (Math.abs(ev.clientX - toma.x) > 6) { v.arrastra(toma.cam - (ev.clientX - toma.x) / g.sh, 0); }
    });
    function suelta(ev) {
      if (!toma) { return; }
      var r = caja.getBoundingClientRect();
      if (ev.type === 'pointerup' && Math.abs(ev.clientX - toma.x) <= 6 && Math.abs(ev.clientY - toma.y) <= 6 &&
          ev.timeStamp - toma.t < 400) {
        v.toca(ev.clientX - r.left, ev.clientY - r.top);
      } else { v.arrastra(v.cam(), toma.v); }
      toma = null; caja.style.cursor = 'grab';
    }
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { caja.addEventListener(n, suelta); });

    if (T('superficie')) {
      var sw = el('button', 'boton-sec atlas-superficie', T('superficie'));
      sw.type = 'button'; sw.setAttribute('aria-pressed', 'false'); sw.title = T('superficie_nota');
      sw.addEventListener('click', function () {
        var on = sw.getAttribute('aria-pressed') !== 'true';
        sw.setAttribute('aria-pressed', String(v.superficie(on)));
        sec.classList.toggle('en-superficie', on);
      });
      var h = sec.querySelector('h4');
      if (h) { h.appendChild(sw); } else { sec.insertBefore(sw, caja); }
    }
    v.etq.setAttribute('aria-label', T('nodo_tuyo') + ' ' + v.etq.textContent);
  }

  function aqui(ultima, texto, sector) {
    if (!ultima || !ultima.parentNode) { return; }
    var p = ultima.parentNode.querySelector('.atlas-mapa-aqui');
    if (!p) {
      p = document.createElement('p');
      p.className = 'atlas-nota atlas-mapa-aqui';
      p.setAttribute('role', 'status');
      ultima.parentNode.insertBefore(p, ultima.nextSibling);
    }
    p.textContent = texto;
    Array.prototype.forEach.call(ultima.querySelectorAll('[data-sector]'), function (b) {
      if (b.dataset.sector === sector) { b.setAttribute('aria-current', 'location'); }
      else { b.removeAttribute('aria-current'); }
    });
  }
  window.AtlasGesto = { monta: monta, aqui: aqui };
})();
