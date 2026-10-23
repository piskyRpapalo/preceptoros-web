(function () {
  'use strict';

  var LIENZO_POR_DEFECTO = { w: 380, h: 380 };
  var montaje = null;
  var escena = null;

  function escala() {
    return Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
  }

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) { e.className = clase; }
    if (texto !== undefined) { e.textContent = texto; }
    return e;
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

  function reading(id) {
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
    reading(id).forEach(function (r) {
      ol.appendChild(el('li', null, r.what + ' · ' + r.uses.join('+') + ' · ' + r.stamp + ' · ' + r.bytes + ' B · #' + r.hash));
    });
    d.appendChild(ol);
    return d;
  }

  function puertas(despertar, hayCuenta) {
    var d = el('div', 'descent-doors');
    d.appendChild(boton('descent-enter descent-skip', 'Check the rift', despertar));
    if (hayCuenta) { d.appendChild(botonCuenta()); }
    d.appendChild(questions());
    d.appendChild(el('p', 'descent-ai', 'Connect your local AI with the app later, from the terminal.'));
    return d;
  }

  function epilogue() {
    var d = el('section', 'descent-epilogue');
    var status = el('p', 'descent-status');
    status.setAttribute('aria-live', 'polite');
    var b = el('button', 'descent-tutorial', 'Start the guided tutorial');
    b.type = 'button';
    b.addEventListener('click', function () {
      if (window.TheGame && typeof window.TheGame.tutorial === 'function') { window.TheGame.tutorial(); return; }
      status.textContent = 'The guided tutorial is not loaded yet.';
    });
    d.appendChild(el('h2', null, 'Your own place, by your choice'));
    d.appendChild(el('p', null, 'Goal: Build a sovereign structure in an AI Safe environment: your device holds its state, AI proposes, and you review what changes.'));
    d.appendChild(el('p', null, 'The guided tutorial helps you prepare your first beacon. You can keep playing locally. Visiting a node or deploying a structure always needs your explicit choice.'));
    d.appendChild(b);
    d.appendChild(status);
    return d;
  }

  function engines() {
    var own = typeof window.LanguageModel !== 'undefined';
    return [
      ['Model inside this browser', own ? 'LIVE' : 'NO_DATA', own ? 'offered by this browser; it starts only when you ask' : 'this browser offers no built-in model'],
      ['Small web model in pieces', 'NO_DATA', 'not built yet; each piece must stay under 25 MiB'],
      ['Hexelion node', 'NO_DATA', 'reaching the node waits a signature'],
      ['Your own local AI', 'NO_DATA', 'connect it with the app, from the terminal']
    ];
  }

  function questions() {
    var d = el('details', 'descent-ask');
    d.appendChild(el('summary', 'descent-ask-open', 'Questions???'));
    d.appendChild(el('p', 'descent-ask-lead', 'Who answers you: every engine says what it is, measured on this device.'));
    var ul = el('ul', 'descent-engines');
    engines().forEach(function (m) {
      var li = el('li');
      li.setAttribute('data-stamp', m[1]);
      li.appendChild(el('span', 'descent-stamp', m[1]));
      li.appendChild(document.createTextNode(' ' + m[0] + ': ' + m[2]));
      ul.appendChild(li);
    });
    d.appendChild(ul);
    if (window.AtlasWorldCreator) {
      var wrapper = el('div', 'descent-local-query');
      wrapper.appendChild(window.AtlasWorldCreator.panel(document));
      var result = el('p', 'descent-local-result', 'Answers from the local lore stay on this device.');
      result.setAttribute('aria-live', 'polite');
      wrapper.appendChild(result);
      d.appendChild(wrapper);
    }
    return d;
  }


  function monta(panel, despertar, otra) {
    if (montaje) { montaje.limpia(); }
    escena = otra || window.AtlasCodexScene;
    var ids = escena.SECTIONS || escena.PAGES, id = ids[ids.length - 1];
    var size = escena.CANVAS || LIENZO_POR_DEFECTO, d = escala();
    var N = AtlasComicTokens.NEUTRAL, A = AtlasComicAccents.ACCENTS;
    var raiz = el('section', 'descent');
    raiz.setAttribute('aria-label', 'Your own place, by your choice');
    ['ink', 'paper', 'ocean', 'cyan'].forEach(function (k) { raiz.style.setProperty('--d-' + k, N[k]); });
    raiz.style.setProperty('--d-yellow', A['comic yellow'].bands.base);
    var stage = el('div', 'descent-stage'), canvas = el('canvas', 'descent-art');
    canvas.width = size.w * d; canvas.height = size.h * d;
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    AtlasComicAtoms.paint(ctx, escena.items(id));
    stage.appendChild(canvas); raiz.appendChild(stage);
    var pane = el('div', 'descent-pane'), box = el('div', 'descent-box');
    box.appendChild(epilogue());
    box.appendChild(puertas(despertar, !!(window.Identity && typeof window.Identity.crear === 'function')));
    pane.appendChild(box); raiz.appendChild(pane);
    var st = { activo: id, audio: null, oye: false, limpia: null };
    var D = window.AtlasDescentSound;
    if (D) {
      var sound = el('button', 'descent-sound-toggle', 'Sound');
      sound.type = 'button'; sound.setAttribute('aria-pressed', 'false');
      sound.addEventListener('click', function () {
        st.oye = !st.oye; sound.setAttribute('aria-pressed', String(st.oye));
        if (!st.oye) { return; }
        if (!st.audio) { var C = window.AudioContext || window.webkitAudioContext; st.audio = C ? new C() : null; }
        if (st.audio) { D.play(st.audio, D.score(escena.frame(id)).voices, st.audio.currentTime); }
        else { sound.textContent = 'NO_DATA · sound is unavailable on this device'; }
      });
      box.appendChild(sound);
    }
    box.appendChild(espejo(id));
    st.limpia = function () {
      if (st.audio && typeof st.audio.close === 'function') { Promise.resolve(st.audio.close()).then(null, function () {}); }
      st.audio = null;
    };
    panel.textContent = ''; panel.appendChild(raiz); montaje = st;
  }

  function cuadro(t) {
    if (!montaje) { return { motion: 'NO_DATA', cause: 'descent not mounted' }; }
    if (typeof t !== 'number' || !isFinite(t)) { return { motion: 'NO_DATA', cause: 'scroll position is not a finite number' }; }
    return escena.frame(montaje.activo);
  }

  window.AtlasDescentView = { monta: monta };
  window.AtlasReading = {
    section: function () { return montaje ? montaje.activo : null; },
    objects: function (id) { return montaje ? reading(id || montaje.activo) : []; }
  };
  window.AtlasDescenso = { frame: cuadro };
})();
