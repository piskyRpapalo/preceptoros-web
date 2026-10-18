(function () {
  'use strict';

  var LIENZO_POR_DEFECTO = { w: 380, h: 380 };
  var UMBRAL = 0.75;
  var PASOS = 24;
  var montaje = null;
  var escena = null;

  function escala() {
    return Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
  }

  function secciones() {
    return Array.isArray(escena.SECTIONS) ? escena.SECTIONS : escena.PAGES;
  }

  function textoDe(intro, id) {
    var fuente = intro ? escena.TEXT[intro] : escena.TEXT;
    return (fuente && fuente[id]) || {};
  }

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) { e.className = clase; }
    if (texto !== undefined) { e.textContent = texto; }
    return e;
  }

  function llenaCopia(contenedor, T) {
    contenedor.textContent = '';
    if (T.h) { contenedor.appendChild(el('h2', null, T.h)); }
    (T.p || []).forEach(function (linea) { contenedor.appendChild(el('p', null, linea)); });
    if (T.sound) {
      var s = el('p', 'descent-sound');
      s.appendChild(el('span', 'descent-stamp', 'NO_DATA'));
      s.appendChild(document.createTextNode(' Sound: not playing yet. Planned: ' + T.sound));
      contenedor.appendChild(s);
    }
  }

  function boton(clase, texto, accion) {
    var b = el('button', clase, texto);
    b.type = 'button';
    b.addEventListener('click', function () {
      if (b.disabled) { return; }
      b.disabled = true;
      accion();
    });
    return b;
  }

  function botonCuenta() {
    var b = boton('descent-account', "Create this device's key", function () {
      var r = window.Identity.crear();
      if (r && typeof r.then === 'function') {
        r.then(null, function () {
          b.disabled = false;
          b.textContent = 'NO_DATA · the key was not created';
        });
      }
    });
    return b;
  }

  function telemetria(id) {
    var f = typeof escena.frame === 'function' ? escena.frame(id) : null, st = escena.ST || 'STATIC', B = window.AtlasBubble, G = window.AtlasBubbleGame;
    return (f && Array.isArray(f.atoms) ? f.atoms : []).map(function (a) {
      var j = JSON.stringify(a), usa = [];
      (a.i || []).forEach(function (it) { if (usa.indexOf(it.o) < 0) { usa.push(it.o); } });
      return { section: id, k: a.k, what: a.r, uses: usa, stamp: st, bytes: j.length,
        hash: B && B.hash32 ? ('0000000' + (B.hash32(j) >>> 0).toString(16)).slice(-8) : 'NO_DATA',
        skin: G && G.skin ? G.skin() : 'atlantis' };
    });
  }

  function espejo(id) {
    var d = el('details', 'descent-tele');
    d.appendChild(el('summary', null, 'What is drawn'));
    var ol = el('ol');
    telemetria(id).forEach(function (r) {
      ol.appendChild(el('li', null, r.what + ' · ' + r.uses.join('+') + ' · ' + r.stamp + ' · ' + r.bytes + ' B · #' + r.hash));
    });
    d.appendChild(ol);
    return d;
  }

  function puertas(despertar, hayCuenta) {
    var d = el('div', 'descent-doors');
    d.appendChild(boton('descent-enter', 'Check the rift', despertar));
    if (escena === window.AtlasDescentScene && window.TheGame && typeof window.TheGame.codex === 'function') {
      d.appendChild(boton('descent-codex', 'See the game in pictures', function () { window.TheGame.codex(); }));
    }
    if (hayCuenta) { d.appendChild(botonCuenta()); }
    d.appendChild(el('p', 'descent-ai', 'Connect your local AI with the app later, from the terminal.'));
    return d;
  }


  function monta(panel, despertar, otra) {
    escena = otra || window.AtlasDescentScene;
    if (montaje) { montaje.limpia(); }
    var ids = secciones();
    var lienzoCss = escena.CANVAS || LIENZO_POR_DEFECTO;
    var dual = !!(escena.TEXT.kids && escena.TEXT.tech);
    var hayCuenta = !!(window.Identity && typeof window.Identity.crear === 'function');
    var N = AtlasComicTokens.NEUTRAL;
    var A = AtlasComicAccents.ACCENTS;

    var raiz = document.createElement('section');
    raiz.className = 'descent';
    raiz.setAttribute('aria-label', 'The story of the statue');
    raiz.style.setProperty('--d-ink', N.ink);
    raiz.style.setProperty('--d-paper', N.paper);
    raiz.style.setProperty('--d-ocean', N.ocean);
    raiz.style.setProperty('--d-cyan', N.cyan);
    raiz.style.setProperty('--d-vermilion', A['vermilion'].bands.base);
    raiz.style.setProperty('--d-yellow', A['comic yellow'].bands.base);
    if (typeof AtlasSemantica !== 'undefined' && AtlasSemantica && typeof AtlasSemantica.bandas === 'function') {
      raiz.style.setProperty('--d-violet', AtlasSemantica.bandas(AtlasSemantica.TABLA.FIRMADO, AtlasSemantica.SAT, AtlasSemantica.LUZ).base);
    }

    var x = boton('descent-skip', 'x', despertar);
    x.setAttribute('aria-label', 'Skip the story and check the rift');
    raiz.appendChild(x);

    var d = escala();
    var lienzo = document.createElement('canvas');
    lienzo.className = 'descent-art';
    lienzo.setAttribute('aria-hidden', 'true');
    lienzo.width = lienzoCss.w * d;
    lienzo.height = lienzoCss.h * d;
    var ctx = lienzo.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    var escenario = el('div', 'descent-stage');
    escenario.appendChild(lienzo);
    raiz.appendChild(escenario);
    var hoja = el('div', 'descent-pane');
    hoja.setAttribute('data-scroller', '');
    hoja.setAttribute('role', 'region');
    hoja.setAttribute('aria-label', 'The story text');
    hoja.tabIndex = 0;
    raiz.appendChild(hoja);

    var intros = [];
    if (dual) {
      var selector = el('div', 'descent-intro');
      [['kids', 'For kids'], ['tech', 'Technical']].forEach(function (par) {
        var b = el('button', null, par[1]);
        b.type = 'button';
        b.setAttribute('aria-pressed', par[0] === 'kids' ? 'true' : 'false');
        b.addEventListener('click', function () { eligeIntro(par[0]); });
        selector.appendChild(b);
        intros.push({ clave: par[0], el: b });
      });
      hoja.appendChild(selector);
    }

    var pasos = ids.map(function (id, i) {
      var s = el('section', 'descent-step');
      s.setAttribute('data-frame', id);
      var caja = el('div', 'descent-box');
      var copia = el('div', 'descent-copy');
      llenaCopia(copia, textoDe(dual ? 'kids' : null, id));
      caja.appendChild(copia);
      caja.appendChild(espejo(id));
      if (i === ids.length - 1) { caja.appendChild(puertas(despertar, hayCuenta)); }
      s.appendChild(caja);
      hoja.appendChild(s);
      return { id: id, el: s, copia: copia };
    });

    var st = { pasos: pasos, hoja: hoja, activo: ids[0], q: 0, limpia: null, vibrado: false, fondoDe: null };
    var S = escena;
    var capas = typeof S.fondo === 'function' && typeof S.frente === 'function';
    var quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var fondo = capas ? document.createElement('canvas') : null;
    var fctx = null;
    if (fondo) {
      fondo.width = lienzo.width;
      fondo.height = lienzo.height;
      fctx = fondo.getContext('2d');
    }

    function eligeIntro(clave) {
      intros.forEach(function (b) { b.el.setAttribute('aria-pressed', b.clave === clave ? 'true' : 'false'); });
      pasos.forEach(function (p) { llenaCopia(p.copia, textoDe(clave, p.id)); });
    }

    function drawSection(id, q) {
      ctx.clearRect(0, 0, lienzoCss.w, lienzoCss.h);
      if (!capas) { AtlasComicAtoms.paint(ctx, S.items(id)); return; }
      if (st.fondoDe !== id) {
        fctx.setTransform(d, 0, 0, d, 0, 0);
        fctx.clearRect(0, 0, lienzoCss.w, lienzoCss.h);
        AtlasComicAtoms.paint(fctx, S.fondo(id));
        st.fondoDe = id;
      }
      ctx.drawImage(fondo, 0, 0, lienzoCss.w, lienzoCss.h);
      AtlasComicAtoms.paint(ctx, S.frente(id, quieto ? undefined : q / PASOS));
    }

    function vibra(id) {
      if (id !== 'TREMOR' || st.vibrado) { return; }
      st.vibrado = true;
      var n = window.navigator;
      if (!n || typeof n.vibrate !== 'function') { return; }
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
      try { n.vibrate([24, 60, 24, 60, 40]); } catch (e) { return; }
    }

    function marca(id) {
      pasos.forEach(function (p) { p.el.setAttribute('aria-current', p.id === id ? 'step' : 'false'); });
    }

    function activa() {
      var R = hoja.getBoundingClientRect(), linea = R.top + R.height * UMBRAL;
      var elegida = pasos[0], r = null;
      pasos.forEach(function (p) {
        var b = p.el.getBoundingClientRect();
        if (b.top < linea) { elegida = p; r = b; }
      });
      var q = r && !quieto ? Math.floor((linea - r.top) / Math.max(1, r.height) * PASOS) : 0;
      return { id: elegida.id, q: Math.min(Math.max(q, 0), PASOS - 1) };
    }

    function alMover() {
      var a = activa();
      if (a.id === st.activo && a.q === st.q) { return; }
      var nueva = a.id !== st.activo;
      st.activo = a.id;
      st.q = a.q;
      drawSection(a.id, a.q);
      if (nueva) { marca(a.id); vibra(a.id); }
    }

    var io = null;
    hoja.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', alMover, { passive: true });
    if (typeof window.IntersectionObserver === 'function') {
      io = new window.IntersectionObserver(alMover, { root: hoja, rootMargin: '-75% 0px -25% 0px' });
      pasos.forEach(function (p) { io.observe(p.el); });
    }
    st.limpia = function () {
      if (io) { io.disconnect(); }
      hoja.removeEventListener('scroll', alMover);
      window.removeEventListener('resize', alMover);
    };

    marca(ids[0]);
    drawSection(ids[0], 0);
    panel.textContent = '';
    panel.appendChild(raiz);
    montaje = st;
    alMover();

    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(function () { if (montaje === st) { st.fondoDe = null; drawSection(st.activo, st.q); } });
    }
  }

  function cuadro(t) {
    if (!montaje) { return { motion: 'NO_DATA', cause: 'descent not mounted' }; }
    if (typeof t !== 'number' || !isFinite(t)) {
      return { motion: 'NO_DATA', cause: 'scroll position is not a finite number' };
    }
    var limite = t + montaje.hoja.getBoundingClientRect().height * UMBRAL;
    var elegida = montaje.pasos[0];
    montaje.pasos.forEach(function (p) {
      if (p.el.offsetTop < limite) { elegida = p; }
    });
    return escena.frame(elegida.id);
  }

  window.AtlasDescentView = { monta: monta };
  window.AtlasTelemetry = {
    section: function () { return montaje ? montaje.activo : null; },
    objects: function (id) { return montaje ? telemetria(id || montaje.activo) : []; }
  };
  window.AtlasDescenso = { frame: cuadro };
})();
