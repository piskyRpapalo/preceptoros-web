
(function (raiz) {
  'use strict';
  var VIEJO = 120, TOPE = 60, R = {}, lista = [], ctx = null, ultimos = new WeakMap();

  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function T(k, d) { var t = ctx && ctx.T ? ctx.T(k) : ''; return t && t !== k ? t : d; }
  function cicloValido(c) { return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000; }
  function ciclo() {
    try {
      var J = raiz.AtlasJuego, i = J && typeof J.instantanea === 'function' ? J.instantanea() : null;
      return i && cicloValido(i.ciclo) ? i.ciclo : null;
    } catch (e) { return null; }
  }
  function selloDe(texto, pedido) {
    if (pedido) { return pedido; }
    if (/^\s*NO_DATA/.test(texto)) { return 'NO_DATA'; }
    if (/SIMULATED/.test(texto)) { return 'SIMULATED'; }
    return 'LIVE';
  }
  function edad(m) { var actual = ciclo(); return actual === null || !cicloValido(m.ciclo) || actual < m.ciclo ? null : actual - m.ciclo; }
  function sello(m) { var edadN = edad(m); return m.sello === 'LIVE' && edadN === null ? 'NO_DATA' : (m.sello === 'LIVE' && edadN > VIEJO ? 'STALE' : m.sello); }

  function burbuja(m) {
    var li = el('li', 'radio-msg'), s = sello(m), cab = el('p', 'radio-msg-cab');
    li.dataset.quien = m.quien; li.dataset.sello = s; li.dataset.fuente = m.fuente; li.dataset.ciclo = cicloValido(m.ciclo) ? String(m.ciclo) : 'NO_DATA';
    cab.appendChild(el('b', null, m.quien));
    cab.appendChild(el('span', 'radio-msg-sello', s));
    var edadN = edad(m), edadTexto = T('chat_edad', 'Δ {n} cycles').replace('{n}', edadN === null ? 'NO_DATA (game cycle unavailable or reset)' : String(edadN));
    cab.appendChild(el('span', 'radio-msg-meta', m.fuente + ' · ' + edadTexto));
    li.appendChild(cab); li.appendChild(el('p', 'radio-msg-texto', m.texto));
    return li;
  }
  function pinta() {
    if (!R.lista) { return; }
    R.lista.textContent = '';
    lista.forEach(function (m) { R.lista.appendChild(burbuja(m)); });
    var u = lista[lista.length - 1];
    R.ultimo.textContent = u ? u.quien + ' · ' + sello(u) + ' · ' + u.texto : T('chat_vacio', 'The Radio is listening.');
    R.lista.scrollTop = R.lista.scrollHeight;
  }

  function dice(m) {
    var texto = String(m.texto || '').trim();
    if (!texto) { return null; }
    var u = lista[lista.length - 1];
    if (u && u.texto === texto && u.fuente === m.fuente) { return u; }
    var e = { quien: m.quien || 'Radio', sello: selloDe(texto, m.sello), fuente: m.fuente || 'web', ciclo: ciclo(), texto: texto };
    lista.push(e); if (lista.length > TOPE) { lista.shift(); }
    pinta();
    return e;
  }

  function origen(n) {
    if (n.closest('#thegame-mapa')) { return { quien: T('hoja_mapa', 'Map'), fuente: 'mapa' }; }
    var p = n.closest('[aria-label],section[id],details[id],aside[id]');
    var quien = (p && (p.getAttribute('aria-label') || (p.querySelector('summary') || {}).textContent)) || 'Radio';
    return { quien: String(quien).trim().slice(0, 40), fuente: (p && p.id) || (n.className || n.tagName).toString().split(' ')[0] };
  }

  function observa(zona) {
    function mira(n) {
      if (!n || n.nodeType !== 1 || (R.caja && R.caja.contains(n))) { return; }
      var t = (n.textContent || '').trim();
      if (!t || ultimos.get(n) === t) { return; }
      ultimos.set(n, t);
      var o = origen(n);
      dice({ quien: o.quien, fuente: o.fuente, texto: t });
    }
    new MutationObserver(function (cambios) {
      cambios.forEach(function (c) {
        var n = c.target.nodeType === 1 ? c.target : c.target.parentElement;
        var s = n && n.closest ? n.closest('[role="status"],[aria-live]') : null;
        if (s) { mira(s); }
      });
    }).observe(zona, { subtree: true, childList: true, characterData: true });
  }
  function alterna(abrir) {
    var a = abrir == null ? R.caja.classList.contains('plegado') : abrir;
    R.caja.classList.toggle('plegado', !a); R.boton.setAttribute('aria-expanded', String(a));
    document.documentElement.classList.toggle('con-chat', a);
    if (a) { pinta(); }
  }
  function canal(id) {
    R.canal = id;
    Object.keys(R.canales).forEach(function (k) { R.canales[k].setAttribute('aria-selected', String(k === id)); R.canales[k].tabIndex = k === id ? 0 : -1; });
    var nd = id === 'echoes' ? T('channel_echoes_nd', 'NO_DATA · no separate Echoes feed is measured here') :
      T('channel_chat_nd', 'NO_DATA · global chat has no tested repository channel');
    var ecos = id === 'echoes' ? ecosDe() : [];
    R.lista.hidden = id !== 'radio'; R.ecos.hidden = !ecos.length; R.noData.hidden = id === 'radio' || ecos.length > 0;
    R.noData.textContent = nd;
    pintaEcos(ecos);
  }
  function ecosDe() {
    var W = raiz.AtlasWorldCreator;
    try { return W && typeof W.echoes === 'function' ? W.echoes() : []; } catch (e) { return []; }
  }
  function pintaEcos(ecos) {
    R.ecos.textContent = '';
    ecos.forEach(function (e) {
      var li = el('li', 'radio-msg'), cab = el('p', 'radio-msg-cab');
      li.dataset.sello = e.seal; li.dataset.fuente = 'world-creator';
      cab.appendChild(el('b', null, T('echo_who', 'World creator')));
      cab.appendChild(el('span', 'radio-msg-sello', e.seal));
      cab.appendChild(el('span', 'radio-msg-meta', e.passage ? e.passage.source + ' · ' + e.passage.seal : e.cause));
      li.appendChild(cab); li.appendChild(el('p', 'radio-msg-texto', e.text));
      if (e.sound && e.sound.texto) { li.appendChild(el('p', 'radio-msg-meta', e.sound.texto)); }
      R.ecos.appendChild(li);
    });
  }
  function monta(capa, c) {
    if (R.caja || !capa) { return; }
    ctx = c || {};
    R.caja = el('section', 'radio-chat plegado'); R.caja.id = 'radio-chat'; R.caja.setAttribute('aria-label', T('chat_aria', 'Radio chat: what the reef says, with its seal and source'));
    R.boton = el('button', 'radio-chat-alterna'); R.boton.type = 'button'; R.boton.id = 'radio-chat-alterna';
    R.boton.setAttribute('aria-controls', 'radio-chat-lista radio-chat-no-data'); R.boton.setAttribute('aria-expanded', 'false');
    var ico = el('span', 'radio-chat-ico', '♪'); ico.setAttribute('aria-hidden', 'true');
    R.ultimo = el('span', 'radio-chat-ultimo');
    R.boton.appendChild(ico); R.boton.appendChild(R.ultimo);
    R.boton.addEventListener('click', function () { alterna(); });
    R.tabs = el('div', 'radio-chat-tabs'); R.tabs.setAttribute('role', 'tablist'); R.tabs.setAttribute('aria-label', T('channel_aria', 'Communication channels'));
    R.canales = {};
    [['echoes', T('channel_echoes', 'Echoes')], ['chat', T('channel_chat', 'Chat')], ['radio', T('channel_radio', 'Radio')]].forEach(function (x) {
      var b = el('button', 'radio-chat-tab', x[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
      b.setAttribute('aria-controls', 'radio-chat-lista radio-chat-ecos radio-chat-no-data'); b.addEventListener('click', function () { canal(x[0]); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
        e.preventDefault(); var ids = Object.keys(R.canales), at = ids.indexOf(x[0]), step = e.key === 'ArrowRight' ? 1 : -1;
        var next = ids[(at + step + ids.length) % ids.length]; R.canales[next].focus(); canal(next);
      });
      R.tabs.appendChild(b); R.canales[x[0]] = b;
    });
    R.lista = el('ol', 'radio-chat-lista'); R.lista.id = 'radio-chat-lista'; R.lista.setAttribute('role', 'log'); R.lista.setAttribute('aria-live', 'polite');
    R.ecos = el('ol', 'radio-chat-lista'); R.ecos.id = 'radio-chat-ecos'; R.ecos.setAttribute('role', 'log'); R.ecos.setAttribute('aria-live', 'polite'); R.ecos.hidden = true;
    R.noData = el('p', 'radio-chat-no-data'); R.noData.id = 'radio-chat-no-data'; R.noData.setAttribute('role', 'status');
    R.screenBtn = el('button', 'radio-chat-screen', T('screen_read', 'Read the screen')); R.screenBtn.type = 'button'; R.screenBtn.id = 'radio-chat-screen';
    R.screenBtn.setAttribute('aria-keyshortcuts', 'Alt+S'); R.screenBtn.style.minHeight = '44px'; R.screenBtn.style.minWidth = '44px';
    R.screenBtn.addEventListener('click', function () { readScreen(); });
    R.caja.appendChild(R.boton); R.caja.appendChild(R.screenBtn); R.caja.appendChild(R.tabs); R.caja.appendChild(R.noData); R.caja.appendChild(R.ecos); R.caja.appendChild(R.lista); canal('radio');
    if (raiz.AtlasWorldCreator && typeof raiz.AtlasWorldCreator.onEcho === 'function') { raiz.AtlasWorldCreator.onEcho(function () { if (R.canal === 'echoes') { canal('echoes'); } }); }
    capa.appendChild(R.caja);
    document.addEventListener('keydown', function (e) { if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); alterna(); R.boton.focus(); } });
    document.addEventListener('keydown', function (e) { if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); readScreen(); } });
    observa(capa);
    pinta();
  }
  // The screen in one bubble (public/game/screen_frame.js): its sentence goes to the radio, and its measured bytes.
  function readScreen() {
    var S = raiz.AtlasScreenFrame, f = null;
    try { f = S && typeof S.read === 'function' ? S.read(document, raiz) : null; } catch (e) { f = null; }
    if (!f) { return dice({ quien: T('screen_who', 'Screen'), fuente: 'screen-frame', texto: 'NO_DATA · the screen reader is not loaded on this page' }); }
    dice({ quien: T('screen_who', 'Screen'), fuente: 'screen-frame', texto: f.sentence });
    dice({ quien: T('screen_who', 'Screen'), fuente: 'screen-frame-bytes', texto: 'Screen frame · ' + f.bytes + ' B' + (f.dropped ? ' · ' + f.dropped + ' atoms dropped' : '') });
    return f;
  }
  function registro() { return lista.map(function (m) { return { quien: m.quien, sello: sello(m), fuente: m.fuente, ciclo: m.ciclo, texto: m.texto }; }); }

  raiz.AtlasRadioChat = { VIEJO: VIEJO, monta: monta, dice: dice, readScreen: readScreen, alterna: alterna, registro: registro, selloDe: selloDe };
})(this);
