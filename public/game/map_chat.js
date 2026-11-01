(function (root) {
  'use strict';
  var doc = root.document, form = doc.getElementById('entry'), log = doc.getElementById('log'), note = doc.getElementById('chat-note');
  if (!form || !log) { return; }
  // The joystick stays as the page serves it: the companion does not move or fold page controls.
  // The web node brain (web_node_brain.js): a same-origin model in 5 verified chunks, run on this device's CPU.
  var ready = false, busy = false, loading = false;
  var model = 'SmolLM2-135M-Instruct', context = 'Tutorial cabin · local visitor practice';
  var zone = doc.createElement('div'); zone.id = 'map-brain'; form.before(zone);
  var disclosure = doc.createElement('p'); disclosure.textContent = 'Web node brain: SmolLM2 135M Instruct (Apache-2.0) · 105,454,144 weight bytes in 5 chunks plus the wllama runtime (MIT) · 9,146,582 bytes, all from this site, each checked by SHA-256. It runs on this device\'s processor; no graphics card needed. Nothing downloads until you choose; after that it stays on this device. Your chat text stays on this device. The model advises; it never signs or plays for you.'; zone.append(disclosure);
  var start = doc.createElement('button'); start.type = 'button'; start.id = 'brain-load'; start.textContent = 'Download the web node brain and verify it'; start.style.minHeight = '44px'; zone.append(start);
  var selected = doc.createElement('p'); selected.id = 'brain-context'; selected.textContent = context; zone.append(selected);
  function line(who, text) { var item = doc.createElement('li'); item.textContent = text.startsWith('NO_DATA') ? text : who + ' · ' + text; log.append(item); }
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
    brain().then(function (B) { return B.load({ consent: true, say: function (t) { note.textContent = t; } }); }).then(function () {
      ready = true; note.textContent = model + ' · ready on this device. Ask the tutorial guide anything.'; start.textContent = 'Web node brain ready';
    }, function (error) { note.textContent = 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message; start.disabled = false; }).then(function () { loading = false; });
  });
  doc.addEventListener('map:context', function (event) { choose(event.detail.label); });
  function choose(label) { context = String(label).slice(0, 160); selected.textContent = 'Companion context: ' + context + ' · node backend link NO_DATA unless explicitly measured'; }
  doc.getElementById('map').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (button && button.id !== 'brain-load') { choose(button.textContent); }
  });
  doc.getElementById('visitor-play').addEventListener('visitor:battle', function (event) { choose('Practice battle at ' + event.detail.place + ' · ' + event.detail.combat.gana + ' · balance NO_DATA'); });
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
      var answer = await root.AtlasWebNodeBrain.reply(text, context); line(answer.model, answer.text); note.textContent = 'Local answer from the web node brain · ' + context;
      doc.dispatchEvent(new CustomEvent('brain:answer', { detail: { verified: answer.verified, model: answer.model, text: answer.text, sha: answer.sha } }));
    }
    catch (error) { line('Companion', 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message); }
    finally { busy = false; form.querySelector('button[type="submit"]').disabled = false; }
  });
  root.addEventListener('pagehide', function () { ready = false; log.replaceChildren(); });
})(globalThis);
