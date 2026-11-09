(function (root) {
  'use strict';
  var doc = root.document, form = doc.getElementById('entry'), log = doc.getElementById('log'), note = doc.getElementById('chat-note');
  if (!form || !log) { return; }
  // The joystick stays as the page serves it: the companion does not move or fold page controls.
  // The web node brain (web_node_brain.js): a same-origin model in 5 verified chunks, run on this device's CPU.
  var ready = false, busy = false, loading = false, offline = false;
  var model = 'SmolLM2-135M-Instruct', context = 'The map · local visitor practice';
  var zone = doc.createElement('div'); zone.id = 'map-brain';
  var guide = doc.querySelector('#voices [data-speaker="Models"]');
  if (guide) { guide.appendChild(zone); if (note) { guide.appendChild(note); } } else { form.before(zone); }
  // Terminal familia (TF-1): one simple sentence visible; the full disclosure (bytes, SHA-256, licences) stays, folded.
  var simple = doc.createElement('p'); simple.textContent = 'The guide runs on your device; nothing leaves it.'; zone.append(simple);
  var how = doc.createElement('details'), howSummary = doc.createElement('summary'); howSummary.textContent = 'How the guide works'; howSummary.style.cssText = 'min-height:44px;display:flex;align-items:center;cursor:pointer'; how.append(howSummary);
  var disclosure = doc.createElement('p'); disclosure.textContent = 'Web node brain: SmolLM2 135M Instruct (Apache-2.0) · 105,454,144 weight bytes in 5 chunks plus the wllama runtime (MIT) · 9,146,582 bytes, all from this site, each checked by SHA-256. It runs on this device\'s processor; no graphics card needed. Nothing downloads until you choose; after that it stays on this device. Your chat text stays on this device. The model advises; it never signs or plays for you.'; how.append(disclosure); zone.append(how);
  var start = doc.createElement('button'); start.type = 'button'; start.id = 'brain-load'; start.textContent = 'Download the web node brain and verify it'; start.style.minHeight = '44px'; zone.append(start);
  var selected = doc.createElement('p'); selected.id = 'brain-context'; selected.textContent = context; zone.append(selected);
  var modeLabel = doc.createElement('label'); modeLabel.htmlFor = 'chat-destination'; modeLabel.textContent = 'Who answers';
  var mode = doc.createElement('select'); mode.id = 'chat-destination'; mode.style.minHeight = '44px';
  [['local', 'Device guide'], ['hexelion', 'Hexelion · remote']].forEach(function (item) {
    var option = doc.createElement('option'); option.value = item[0]; option.textContent = item[1]; mode.append(option);
  });
  zone.prepend(modeLabel, mode);
  var remoteNotice = doc.createElement('p'); remoteNotice.textContent = 'Hexelion is an AI on the rack. Sending shares your message and an ephemeral visit identifier with the gateway. It advises; it never signs.'; remoteNotice.hidden = true; zone.append(remoteNotice);
  var aulaLoad = null;
  function loadAula() {
    if (root.AtlasAulaChat) return Promise.resolve(root.AtlasAulaChat);
    if (!aulaLoad) aulaLoad = new Promise(function (resolve, reject) {
      var script = doc.createElement('script'); script.src = '/game/classroom_chat.js';
      script.onload = function () { resolve(root.AtlasAulaChat); };
      script.onerror = function () { aulaLoad = null; reject(new Error('gateway module unavailable')); }; doc.head.append(script);
    });
    return aulaLoad;
  }
  var visitAccount = null, chain = { tic: 0, hash: null, sello: null }, visitGeneration = 0;
  var visitPanel = doc.getElementById('visitor-play');
  visitPanel.addEventListener('visitor:render', function (event) { visitAccount = event.detail.account; });
  visitPanel.addEventListener('visitor:end', function () { visitAccount = null; chain = { tic: 0, hash: null, sello: null }; visitGeneration++; });
  mode.addEventListener('change', function () {
    remoteNotice.hidden = mode.value !== 'hexelion';
    var heading = doc.getElementById('chat-h'); if (heading) heading.textContent = mode.value === 'hexelion' ? 'Hexelion' : (ready ? model : 'Guide');
  });
  // LAS VOCES (terminal_panel.js): model answers and page-grounded guide facts have distinct speakers.
  function line(who, text) { var P = root.AtlasTerminalPanel; if (P && P.decir) { P.decir(doc, log, who === 'You' ? 'you' : who === 'Hexelion' ? 'hexelion' : who.indexOf('OpenWorld guide') === 0 ? 'script' : 'chunk', text, who === 'You' || who === 'Companion' ? null : who); return; }
    var item = doc.createElement('li'); item.textContent = text.startsWith('NO_DATA') ? text : who + ' · ' + text; log.append(item); }
  function brain() {
    if (root.AtlasWebNodeBrain) { return Promise.resolve(root.AtlasWebNodeBrain); }
    return new Promise(function (ok, fail) {
      var s = doc.createElement('script'); s.src = '/game/web_node_brain.js';
      s.onload = function () { ok(root.AtlasWebNodeBrain); }; s.onerror = function () { fail(new Error('the brain module did not load')); }; doc.head.append(s);
    });
  }
  start.addEventListener('click', function () {
    if (ready || loading) { return; }
    loading = true; start.disabled = true; note.textContent = 'Loading the web node brain…';
    var B = null; brain().then(function (b) { B = b; return B.load({ consent: true, say: function (t) { note.textContent = t; } }); }).then(function () {
      offline = !!(B.offline && B.offline());
      // Airplane mode: once the brain is kept, the page's own scripts are asked once through the service worker, which
      // keeps them, so /openworld/ and its guide open with the network off. Same origin only; ready waits for it.
      if (offline || !root.navigator.serviceWorker || !root.navigator.serviceWorker.controller) { return null; }
      note.textContent = 'Keeping this page on this device for airplane mode…';
      var urls = Array.prototype.map.call(doc.scripts, function (s) { return s.src; }).filter(function (u) { return u && u.indexOf(root.location.origin + '/') === 0; }).concat(['/openworld/state.json']);
      return Promise.all(urls.map(function (u) { return root.fetch(u).then(function (r) { return r.ok; }, function () { return false; }); }));
    }).then(function () {
      ready = true; var loaded = B && typeof B.model === 'function' ? B.model() : ''; if (typeof loaded === 'string' && loaded) { model = loaded; }
      var heading = doc.getElementById('chat-h'); if (heading && mode.value === 'local') { heading.textContent = model; }
      note.textContent = model + ' · ready on this device' + (offline ? ' · offline' : '') + '. Ask the tutorial guide anything.'; start.textContent = 'Web node brain ready';
    }, function (error) { note.textContent = 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message; start.disabled = false; }).then(function () { loading = false; });
  });
  doc.addEventListener('map:context', function (event) { choose(event.detail.label); });
  function choose(label) { context = String(label).slice(0, 160); selected.textContent = 'Companion context: ' + context + ' · node backend link NO_DATA unless explicitly measured'; }
  // The compact terminal (2026-11-02): the map and the voices of the panel (the visit's buttons live there now) choose the context.
  doc.getElementById('map').addEventListener('click', pick);
  var voices = doc.getElementById('voices'); if (voices) { voices.addEventListener('click', pick); }
  function pick(event) {
    var button = event.target.closest('button');
    if (button && button.id !== 'brain-load') { choose(button.textContent); }
  }
  doc.getElementById('visitor-play').addEventListener('visitor:battle', function (event) { choose('Practice battle at ' + event.detail.place + ' · ' + event.detail.combat.gana + ' · balance NO_DATA'); });
  form.addEventListener('submit', async function (event) {
    if (mode.value !== 'hexelion') return;
    event.preventDefault(); event.stopImmediatePropagation();
    var input = doc.getElementById('question'), text = input.value.trim();
    if (!text || busy) return;
    if (!visitAccount) { line('Hexelion', 'NO_DATA · Start an ephemeral visit before sending to Hexelion.'); return; }
    if (new TextEncoder().encode(text).length > 600) { line('Hexelion', 'NO_DATA · Message exceeds 600 UTF-8 bytes.'); return; }
    var generation = visitGeneration, account = visitAccount, seed;
    busy = true;
    try { await loadAula(); } catch (_) { busy = false; line('Hexelion', 'NO_DATA · Chat gateway module unavailable.'); return; }
    if (generation !== visitGeneration || account !== visitAccount) { busy = false; return; }
    try { seed = account.info().seed; } catch (_) { busy = false; line('Hexelion', 'NO_DATA · This visit has ended.'); return; }
    line('You', text); input.value = ''; busy = true;
    var send = form.querySelector('button[type="submit"]'); send.disabled = true;
    try {
      var result = await root.AtlasAulaChat.turn(root.fetch.bind(root), seed, text, chain, '/openworld/');
      if (generation !== visitGeneration || account !== visitAccount) return;
      if (!result.ok && result.cause === 'stale') {
        chain = result.chain;
        result = await root.AtlasAulaChat.turn(root.fetch.bind(root), seed, text, chain, '/openworld/');
      }
      if (generation !== visitGeneration || account !== visitAccount) return;
      chain = result.chain;
      line('Hexelion', result.ok ? result.text + (result.cut ? ' [shortened]' : '') : root.AtlasAulaChat.plain(result.cause));
      if (result.ok && root.AtlasAulaChat.renderReceipt) root.AtlasAulaChat.renderReceipt(doc, log, result.receiptState);
    } catch (_) { if (generation === visitGeneration) line('Hexelion', 'NO_DATA · The chat gateway did not answer.'); }
    finally { busy = false; send.disabled = false; }
  }, true);
  form.addEventListener('submit', async function (event) {
    if (!ready) { return; }  // no brain loaded: the page router answers with its honest NO_DATA
    event.preventDefault();
    event.stopImmediatePropagation();  // the browser brain answers here, and only here
    var input = doc.getElementById('question'), text = input.value.trim();
    if (!text || busy) { event.preventDefault(); return; }
    if (new TextEncoder().encode(text).length > 600) { note.textContent = 'NO_DATA: message exceeds 600 UTF-8 bytes.'; return; }
    line('You', text); input.value = '';
    if (!ready) { line('Companion', 'NO_DATA: choose and load the web node brain first.'); return; }
    busy = true; form.querySelector('button[type="submit"]').disabled = true;
    try {
      var answer = await root.AtlasWebNodeBrain.reply(text, context);
      var speaker = /^page-/.test(answer.source) ? 'OpenWorld guide · ' + (answer.source === 'page-controls' ? 'page controls' : 'page missions') : answer.model + (offline ? ' · offline' : '');
      line(speaker, answer.text); note.textContent = /^page-/.test(answer.source) ? 'From this page · ' + context : 'Local answer from the web node brain · ' + context;
      doc.dispatchEvent(new CustomEvent('brain:answer', { detail: { verified: answer.verified, source: answer.source, model: answer.model, text: answer.text, sha: answer.sha } }));
    }
    catch (error) { line('Companion', 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message); }
    finally { busy = false; form.querySelector('button[type="submit"]').disabled = false; }
  });
  root.addEventListener('pagehide', function () { ready = false; log.replaceChildren(); });
})(globalThis);
