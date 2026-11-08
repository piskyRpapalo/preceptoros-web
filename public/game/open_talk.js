// E0 · the basic open chat (Sovereign, 2026-11-08: «me interesa mucho que el chat de la web funcione, así podré enviar todos
// mis textos de ideas al rack en masa»; «el tope debe ser los 25 megas»; «solo un chat básico»). A text box and a file picker
// (many files at once, each one a message) in the Communication sheet. A message is cut in 256 KiB pieces, each with its
// SHA-256; the intake (/api/v1/ingesta on the API worker) stores a piece only if its bytes match. The minimal law is shown beside it.
// Nothing is kept on this device; every failure is NO_DATA with its cause.
(function (root) {
  'use strict';
  var API = 'https://api.preceptoros.org/api/v1/ingesta', V = 'preceptoros.ingesta/1', MAX = 25 * 1024 * 1024, PIECE = 256 * 1024;
  var LAW = 'Public chat to the rack: up to 25 MB per message. Only the text is kept, with no IP or account; it may be shown for a few hours and is erased within 24 hours. The rack reads it as data, never as orders.';
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function pieces(bytes) { var out = []; for (var i = 0; i < bytes.length; i += PIECE) { out.push(bytes.subarray(i, i + PIECE)); } return out; }
  // send(text, say, net): one message; resolves to the root, or rejects with the cause. net is fetch (a double in the cases).
  async function send(text, say, net, subtle) {
    var bytes = new TextEncoder().encode(text);
    if (!bytes.length) { throw new Error('empty message'); }
    if (bytes.length > MAX) { throw new Error('over 25 MB'); }
    var ps = pieces(bytes), hs = [];
    for (var i = 0; i < ps.length; i++) { hs.push(hex(await subtle.digest('SHA-256', ps[i]))); }
    var man = { v: V, bytes: bytes.length, sha256: hex(await subtle.digest('SHA-256', bytes)), piezas: hs };
    var r = await net(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(man) }), j = await r.json();
    if (!r.ok) { throw new Error(j && j.causa || 'intake ' + r.status); }
    for (var k = 0; k < ps.length; k++) {
      say('Sending piece ' + (k + 1) + ' of ' + ps.length + '…');
      var p = await net(API + '/' + j.raiz + '/' + k, { method: 'PUT', body: ps[k] }), pj = await p.json();
      if (!p.ok) { throw new Error(pj && pj.causa || 'piece ' + p.status); }
    }
    return j.raiz;
  }
  // chime(win): a soft two-note call in Acho (an FM pair up a fifth, under half a second); silent under reduced motion.
  function chime(win) {
    if (win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches) { return 'silent'; }
    var AC = win.AudioContext || win.webkitAudioContext; if (!AC) { return 'NO_DATA: Web Audio not available'; }
    try {
      var c = chime.ctx = chime.ctx || new AC(), t0 = c.currentTime + 0.01, g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45); g.connect(c.destination);
      [[440, 0], [660, 0.12]].forEach(function (n) {
        var o = c.createOscillator(), m = c.createOscillator(), d = c.createGain(), t = t0 + n[1];
        o.type = 'sine'; o.frequency.setValueAtTime(n[0], t); m.frequency.setValueAtTime(n[0] * 2, t); d.gain.setValueAtTime(n[0] * 0.2, t);
        m.connect(d); d.connect(o.frequency); o.connect(g); o.start(t); m.start(t); o.stop(t0 + 0.45); m.stop(t0 + 0.45);
      });
      return 'played';
    } catch (e) { return 'NO_DATA: ' + (e && e.name || 'audio'); }
  }
  // toast(doc, text): a nearly transparent note over the map for a few seconds; it never takes a tap.
  function toast(doc, text) {
    var stage = doc.getElementById('stage') || doc.body, t = doc.createElement('p');
    t.className = 'ot-toast'; t.setAttribute('role', 'status'); t.textContent = '✉ ' + text.slice(0, 90) + (text.length > 90 ? '…' : '');
    stage.appendChild(t); root.setTimeout(function () { t.remove(); }, 5000); return t;
  }
  // fresh(seen, list): the messages not seen before; the first look only learns what is there (no toast for old ones).
  function fresh(seen, list, first) { var out = []; list.forEach(function (m) { if (!seen[m.raiz]) { seen[m.raiz] = true; if (!first) { out.push(m); } } }); return out; }
  function draw(doc, day, list) {
    day.textContent = '';
    list.forEach(function (m) {
      var item = doc.createElement('li'), p = doc.createElement('p'), when = doc.createElement('small');
      p.textContent = m.avance + (m.bytes > 2048 ? ' …' : ''); when.textContent = String(m.creado).slice(11, 16) + ' UTC · ' + Math.ceil(m.bytes / 1024) + ' KB';
      item.append(when, p); day.appendChild(item);
    });
    if (!list.length) { var e = doc.createElement('li'); e.textContent = 'No messages in the last 24 hours.'; day.appendChild(e); }
  }
  function watch(doc, win, day) {
    var seen = {}, first = true, net = win.fetch && win.fetch.bind(win);
    if (!net) { return; }
    function look() {
      if (doc.visibilityState === 'hidden') { return; }
      net(API + '/dia', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        var list = (j && j.mensajes) || []; draw(doc, day, list);
        var news = fresh(seen, list, first); first = false;
        if (news.length) { toast(doc, news[0].avance); chime(win); }
      }).catch(function () { /* the intake may be closed: the list stays as it was */ });
    }
    look(); root.setInterval(look, 30000);
  }
  function mount(doc, win) {
    var list = doc.getElementById('voices');
    if (!list || doc.getElementById('open-chat')) { return null; }
    var li = doc.createElement('li'); li.className = 'voice'; li.id = 'open-chat'; li.dataset.speaker = 'Radio'; li.dataset.cat = 'Communication';
    li.style.display = 'none'; // shown with the Communication sheet (terminal_panel.js show)
    var h = doc.createElement('h3'); h.textContent = 'Chat to the rack';
    var law = doc.createElement('p'); law.className = 'state'; law.textContent = LAW;
    var box = doc.createElement('textarea'); box.id = 'open-chat-text'; box.rows = 5; box.setAttribute('aria-label', 'Your message');
    var files = doc.createElement('input'); files.type = 'file'; files.multiple = true; files.accept = 'text/*,.md,.txt,.json,.csv'; files.setAttribute('aria-label', 'Text files to send, each one a message');
    var go = doc.createElement('button'); go.type = 'button'; go.textContent = 'Send'; go.style.minHeight = '44px'; go.style.minWidth = '44px';
    var st = doc.createElement('p'); st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite');
    var pin = doc.createElement('p'); pin.className = 'ot-pin'; pin.textContent = '📌 Messages here are public and erased every 24 hours.';
    var day = doc.createElement('ol'); day.className = 'ot-day'; day.setAttribute('aria-label', 'Messages of the last 24 hours');
    li.append(pin, h, law, box, files, go, st, day); list.appendChild(li);
    watch(doc, win, day);
    function say(t) { st.textContent = t; }
    go.addEventListener('click', async function () {
      var subtle = win.crypto && win.crypto.subtle, net = win.fetch && win.fetch.bind(win);
      if (!subtle || !net) { say('NO_DATA: this browser cannot hash or send'); return; }
      var jobs = [], fl = Array.prototype.slice.call(files.files || []);
      if (box.value.trim()) { jobs.push(['message', box.value]); }
      for (var i = 0; i < fl.length; i++) { jobs.push([fl[i].name, await fl[i].text()]); }
      if (!jobs.length) { say('Write a message or choose files first.'); return; }
      go.disabled = true; var sent = 0;
      for (var j = 0; j < jobs.length; j++) {
        try { var root0 = await send(jobs[j][1], say, net, subtle); sent++; say('Sent ' + jobs[j][0] + ' · root ' + root0.slice(0, 12)); }
        catch (e) { say('NO_DATA: ' + jobs[j][0] + ' · ' + e.message); break; }
      }
      if (sent === jobs.length) { box.value = ''; files.value = ''; say('Sent ' + sent + ' message' + (sent === 1 ? '' : 's') + ' to the rack.'); }
      go.disabled = false;
    });
    return li;
  }
  var api = { API: API, MAX: MAX, PIECE: PIECE, LAW: LAW, pieces: pieces, send: send, fresh: fresh, toast: toast, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasOpenChat = api;
  if (root.document && root.document.getElementById && !(typeof module === 'object' && module.exports)) {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', function () { mount(root.document, root); }); } else { mount(root.document, root); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
