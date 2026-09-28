/* preceptoros.org · theGame · EL GESTO: todo lo del mapa que responde a la mano.

   Arrastrar, tocar, el teclado, la FICHA de cada sitio y el modo SUPERFICIE. Se separo de
   `atlas-mapa.js` (2026-09-28) porque el mapa pinta y esto escucha: dos oficios, dos ficheros, y
   el mapa ya rozaba los 16 KiB. El mapa le presta una vista `v` (camara, toque, dato de cada
   sitio); esta pieza no pinta nada en el lienzo.

   NADA DE ZONAS MUERTAS. Cada rotulo del mapa es un control: abre su ficha, que dice su estado
   (leido de `atlas.carta/1`, que lo lee de la instantanea) y ofrece SOLO la accion que el motor
   admite ahi. Si no hay accion, dice por que. La accion la pulsa la persona: es suya (`humano`).

   TECLADO. Las flechas pasan de sitio en sitio en el orden del mundo (da la vuelta), Enter abre
   la ficha y Escape lo sigue cerrando el `<dialog>` nativo, que es la trampa de foco que respetan
   los lectores de pantalla. Cada control lleva nombre accesible sacado del texto de la lengua.

   SUPERFICIE: un boton con `aria-pressed`. Vive en esta pestana y en memoria: no se recuerda al
   volver, porque el juego no guarda nada sin que se pulse Guardar (y el boton lo dice). */
(function () {
  'use strict';

  var C = window.AtlasCarta;
  /* La causa de la carta (para agentes, en castellano interno) a su clave de texto (para la persona). */
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

    /* --- la ficha --------------------------------------------------------------------- */
    var ficha = el('section', 'atlas-ficha'); ficha.hidden = true;
    ficha.setAttribute('aria-live', 'polite');
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
      /* La ficha habla con la partida de AHORA, no con la ultima que le llego al mapa. */
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
            /* Reparar tiene su dialogo con el Preceptor: se abre el mismo, no se salta. */
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

    /* --- los controles del mapa --------------------------------------------------------- */
    function controles() {
      var l = Array.prototype.slice.call(caja.querySelectorAll('[data-sector]'));
      if (v.nodo()) { l.push(v.etq); }
      return l.sort(function (a, b) { return xDe(a) - xDe(b); });
    }
    function xDe(b) { return b === v.etq ? v.nodo().x : C.SECTORES[b.dataset.sector]; }
    function idDe(b) { return b === v.etq ? 'base' : b.dataset.sector; }
    Array.prototype.forEach.call(caja.querySelectorAll('[data-sector]'), function (b) {
      if (b.tagName !== 'BUTTON') {
        /* Los rotulos que eran texto pasan a ser controles: nada que parezca boton sin serlo. */
        b.tabIndex = 0; b.setAttribute('role', 'button'); b.style.pointerEvents = 'auto';
        b.addEventListener('click', function () { abre(b.dataset.sector); });
        b.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abre(b.dataset.sector); }
        });
      } else {
        /* La grieta ya abre su dialogo; ademas, su ficha al enfocarla con teclado. */
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

    /* --- arrastre y toque ---------------------------------------------------------------- */
    /* Un toque (poco recorrido, poco tiempo) perturba el agua; un arrastre mueve la camara. La
       inercia es determinista en fotogramas (x 0,9 cada uno): mismo gesto, misma frenada. */
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

    /* --- Superficie ---------------------------------------------------------------------- */
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

  /* ESTAS AQUI (2026-09-28). Una linea bajo el lienzo dice donde estas, en que nivel, con que
     rol y que acaba de pasar, leido de la partida real por la voz del Preceptor. El sector se
     marca con `aria-current` y con un anillo en el lienzo, no solo con color. */
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
