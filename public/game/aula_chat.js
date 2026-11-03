// P3 · the visitor talks to Hexelion (odd/tasks/chat-del-aula.md · doctrine ·6593579266).
// Nothing is requested on load: the only call is the visitor's Send, to api.preceptoros.org (never the tunnel).
// The visit is the ephemeral crab (visitor_account.js); only its seed (a hash) travels. Turns live in this device's
// IndexedDB and nowhere else. Every failure is said in plain words with its cause: never silence.
(function (root) {
  'use strict';
  var API = 'https://api.preceptoros.org/api/v1/chat', V = 'preceptoros.chat/1', MAX = 600, DB = 'aula-chat';
  var PLAIN = {
    nodo_dormido: 'Hexelion is asleep right now.', aula_rechaza: 'Hexelion is not taking visitors right now.',
    respuesta_fuera_de_ley: 'Hexelion answered something we cannot show.', aula_sin_llave: 'The door to Hexelion is not set up yet.',
    limitador_ausente: 'The door to Hexelion is not set up yet.', tiempo_agotado: 'Hexelion took too long to answer.',
    limite_visita: 'Wait a minute before the next message.', limite_red: 'Too many messages from your network; wait a minute.',
    visita_agotada: 'This visit has used all its turns. Leave and come back for a new one.',
    stale: 'Your chat was out of step; it starts again.', cief_invalido: 'That message could not be sent as it is.',
    offline: 'You are offline, so nothing was sent.', red: 'The door did not answer. Try again in a moment.'
  };
  function plain(cause) { return 'NO_DATA · ' + (PLAIN[cause] || 'Hexelion could not answer.') + ' (' + cause + ')'; }
  // The CIEF of one turn: state + intent + context + expected hash + tic (doctrine 1).
  function cief(visita, text, chain, page) {
    return { v: V, estado: { visita: visita }, intencion: 'chat', contexto: { texto: text, pagina: page || '/chat/' },
      hash_esperado: chain.tic ? chain.hash : null, tic: chain.tic + 1, sello: chain.tic ? chain.sello : undefined };
  }
  async function sha(text) {
    var b = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }
  // One turn against the door. Returns {ok, text, cause, chain}; it never throws at the page.
  async function turn(fetcher, visita, text, chain, page) {
    if (root.navigator && root.navigator.onLine === false) return { ok: false, cause: 'offline', chain: chain };
    var res, body;
    try {
      res = await fetcher(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cief(visita, text, chain, page)) });
      body = await res.json();
    } catch (e) { return { ok: false, cause: 'red', chain: chain }; }
    if (res.status === 200 && body && body.estado === 'OK' && body.burbuja && typeof body.burbuja.texto === 'string' && body.sello) {
      var mine = await sha(body.burbuja.texto);
      return { ok: true, text: body.burbuja.texto, cut: body.burbuja.recortada === true, chain: { tic: body.sello.tic, hash: mine, sello: body.sello } };
    }
    var cause = body && typeof body.causa === 'string' ? body.causa : 'red';
    return { ok: false, cause: cause, retry: body && body.retry_after, chain: cause === 'stale' ? { tic: 0, hash: null, sello: null } : chain };
  }
  function store(win) {
    function open() {
      return new Promise(function (ok, ko) {
        if (!win.indexedDB) { ko(new Error('NO_DATA: no IndexedDB')); return; }
        var r = win.indexedDB.open(DB, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('turns', { autoIncrement: true }); };
        r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ko(r.error); };
      });
    }
    function tx(mode, fn) { return open().then(function (db) { return new Promise(function (ok, ko) { var t = db.transaction('turns', mode), s = t.objectStore('turns'), out = fn(s); t.oncomplete = function () { ok(out && out.result); }; t.onerror = function () { ko(t.error); }; }); }); }
    return { add: function (row) { return tx('readwrite', function (s) { return s.add(row); }); },
      all: function () { return tx('readonly', function (s) { return s.getAll(); }); },
      clear: function () { return tx('readwrite', function (s) { return s.clear(); }); } };
  }
  function beep(win, ok) {
    try {
      var A = win.AudioContext || win.webkitAudioContext; if (!A) return;
      var c = beep.c || (beep.c = new A()), o = c.createOscillator(), g = c.createGain();
      o.frequency.value = ok ? 660 : 220; g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.2);
    } catch (e) { /* sound is a courtesy; the words already said it */ }
  }
  function mount(win) {
    var doc = win.document, $ = function (id) { return doc.getElementById(id); };
    var form = $('chat-form'), box = $('chat-text'), list = $('chat-log'), send = $('chat-send'), pos = $('chat-position');
    if (!form || !box || !list) return null;
    var db = store(win), account = null, chain = { tic: 0, hash: null, sello: null }, busy = false;
    function show(who, text, kind) {
      var li = doc.createElement('li'); li.className = 'turn ' + kind;
      var b = doc.createElement('b'); b.textContent = who + ': '; li.appendChild(b); li.appendChild(doc.createTextNode(text));
      list.appendChild(li); li.scrollIntoView && li.scrollIntoView({ block: 'nearest' });
    }
    db.all().then(function (rows) { (rows || []).forEach(function (r) { show(r.who, r.text, r.kind); }); }).catch(function () { /* history is optional */ });
    doc.addEventListener('focusin', function (e) {
      if (!pos || !e.target.getBoundingClientRect) return;
      var r = e.target.getBoundingClientRect(); pos.textContent = 'Focus: ' + (e.target.textContent || e.target.getAttribute('aria-label') || e.target.id).trim().slice(0, 30) + ' · x ' + Math.round(r.left) + ', y ' + Math.round(r.top) + ' CSS px';
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var text = box.value.trim(); if (!text || busy) return;
      if ([...text].length > MAX) { show('Door', plain('cief_invalido'), 'nodata'); return; }
      busy = true; send.disabled = true; send.textContent = 'Sending…';
      try {
        if (!account) { account = await win.AtlasVisitorAccount.create(true); }
        var visita = account.info().seed;
        show('You', text, 'me'); db.add({ who: 'You', text: text, kind: 'me' }).catch(function () {});
        box.value = '';
        var r = await turn(win.fetch.bind(win), visita, text, chain, '/chat/');
        if (!r.ok && r.cause === 'stale') { chain = r.chain; r = await turn(win.fetch.bind(win), visita, text, chain, '/chat/'); }
        chain = r.chain;
        var line = r.ok ? r.text + (r.cut ? ' [shortened]' : '') : plain(r.cause) + (r.retry ? ' · wait ' + r.retry + ' s' : '');
        show(r.ok ? 'Hexelion' : 'Door', line, r.ok ? 'them' : 'nodata');
        db.add({ who: r.ok ? 'Hexelion' : 'Door', text: line, kind: r.ok ? 'them' : 'nodata' }).catch(function () {});
        beep(win, r.ok);
      } catch (err) {
        show('Door', 'NO_DATA · ' + String(err && err.message || err).slice(0, 120), 'nodata'); beep(win, false);
      } finally { busy = false; send.disabled = false; send.textContent = 'Send'; }
    });
    var forget = $('chat-forget');
    if (forget) forget.addEventListener('click', function () { db.clear().catch(function () {}); list.textContent = ''; show('Door', 'This chat is forgotten on this device.', 'nodata'); });
    return { turn: turn };
  }
  var api = { cief: cief, turn: turn, plain: plain, mount: mount, API: API };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasAulaChat = api;
  if (root.document && root.document.getElementById) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { mount(root); }); else mount(root);
  }
})(typeof window !== 'undefined' ? window : globalThis);
