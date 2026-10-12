/* preceptoros.org · theGame · EL CHAT DE LA RADIO: la cara ESCRITA de la Radio, abajo, en burbujas (FIRMO 2026-10-12,
   «la interfaz no-mapa es una terminal de chatbot»). No sustituye a la Radio que suena (melodia = estado + voz): la escribe.

   CADA MENSAJE DICE QUIEN HABLA, SU SELLO, SU FUENTE Y SU EDAD (en ciclos de juego, nunca reloj de pared). Los sellos,
   honestos y declarados aqui:
     LIVE      el estado de TU partida en este aparato, recien dicho (el motor corre aqui; nadie lo atesta fuera);
     STALE     lo mismo, cuando ya tiene mas de VIEJO ciclos;
     NO_DATA   el mensaje dice que algo no se pudo medir (empieza por «NO_DATA»);
     SIMULATED una voz o una narracion que no es dato (la voz del navegador, la zona NPC).
   Lo mantiene la WEB (zona NPC). El NODO del Soberano sera su autoridad SOLO cuando se active: hoy, no.

   SE ALIMENTA DE LO QUE YA EXISTE: escucha cada linea de estado del juego (`role="status"` / `aria-live`) y la pasa al chat;
   no inventa mensajes. AI FLUENCY: `registro()` devuelve las burbujas como datos (quien, sello, fuente, ciclo, texto) y cada
   burbuja los lleva en `data-*`: el lab lee el chat sin mirar pixeles. Colapsado en el telefono: jamas se come el mundo. */
(function (raiz) {
  'use strict';
  var VIEJO = 120, TOPE = 60, R = {}, lista = [], ctx = null, ultimos = new WeakMap();

  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function T(k, d) { var t = ctx && ctx.T ? ctx.T(k) : ''; return t && t !== k ? t : d; }
  function ciclo() { var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null; return i ? i.ciclo : 0; }
  function selloDe(texto, pedido) {
    if (pedido) { return pedido; }
    if (/^\s*NO_DATA/.test(texto)) { return 'NO_DATA'; }
    if (/SIMULATED/.test(texto)) { return 'SIMULATED'; }
    return 'LIVE';
  }
  function sello(m) { return m.sello === 'LIVE' && ciclo() - m.ciclo > VIEJO ? 'STALE' : m.sello; }

  function burbuja(m) {
    var li = el('li', 'radio-msg'), s = sello(m), cab = el('p', 'radio-msg-cab');
    li.dataset.quien = m.quien; li.dataset.sello = s; li.dataset.fuente = m.fuente; li.dataset.ciclo = String(m.ciclo);
    cab.appendChild(el('b', null, m.quien));
    cab.appendChild(el('span', 'radio-msg-sello', s));
    cab.appendChild(el('span', 'radio-msg-meta', m.fuente + ' · ' + T('chat_edad', 'Δ {n} cycles').replace('{n}', Math.max(0, ciclo() - m.ciclo))));
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
  /* Un mensaje nuevo. m: { quien, texto, fuente, sello? }. Los repetidos seguidos de la misma fuente no se duplican. */
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
  /* De donde viene una linea de estado: el panel que la contiene, con su nombre visible. */
  function origen(n) {
    if (n.closest('#thegame-mapa')) { return { quien: T('hoja_mapa', 'Map'), fuente: 'mapa' }; }  /* el mapa habla con su nombre */
    var p = n.closest('[aria-label],section[id],details[id],aside[id]');
    var quien = (p && (p.getAttribute('aria-label') || (p.querySelector('summary') || {}).textContent)) || 'Radio';
    return { quien: String(quien).trim().slice(0, 40), fuente: (p && p.id) || (n.className || n.tagName).toString().split(' ')[0] };
  }
  /* Escucha las lineas de estado del juego y las lleva al chat (sin inventar ninguna). */
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
  function monta(capa, c) {
    if (R.caja || !capa) { return; }
    ctx = c || {};
    R.caja = el('section', 'radio-chat plegado'); R.caja.id = 'radio-chat'; R.caja.setAttribute('aria-label', T('chat_aria', 'Radio chat: what the reef says, with its seal and source'));
    R.boton = el('button', 'radio-chat-alterna'); R.boton.type = 'button'; R.boton.id = 'radio-chat-alterna';
    R.boton.setAttribute('aria-controls', 'radio-chat-lista'); R.boton.setAttribute('aria-expanded', 'false');
    var ico = el('span', 'radio-chat-ico', '♪'); ico.setAttribute('aria-hidden', 'true');
    R.ultimo = el('span', 'radio-chat-ultimo');
    R.boton.appendChild(ico); R.boton.appendChild(R.ultimo);
    R.boton.addEventListener('click', function () { alterna(); });
    R.lista = el('ol', 'radio-chat-lista'); R.lista.id = 'radio-chat-lista'; R.lista.setAttribute('role', 'log'); R.lista.setAttribute('aria-live', 'polite');
    R.caja.appendChild(R.boton); R.caja.appendChild(R.lista);
    capa.appendChild(R.caja);
    document.addEventListener('keydown', function (e) { if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); alterna(); R.boton.focus(); } });
    observa(capa);
    pinta();
  }
  function registro() { return lista.map(function (m) { return { quien: m.quien, sello: sello(m), fuente: m.fuente, ciclo: m.ciclo, texto: m.texto }; }); }

  raiz.AtlasRadioChat = { VIEJO: VIEJO, monta: monta, dice: dice, alterna: alterna, registro: registro, selloDe: selloDe };
})(this);
