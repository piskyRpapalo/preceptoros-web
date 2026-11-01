(function (root) {
  'use strict';
  var doc = root.document, form = doc.getElementById('entry'), log = doc.getElementById('log'), note = doc.getElementById('chat-note');
  if (!form || !log) { return; }
  // The joystick stays as the page serves it: the companion does not move or fold page controls.
  // The web node brain (web_node_brain.js): a same-origin model in 5 verified chunks, run on this device's CPU.
  var ready = false, busy = false, loading = false;
  var model = 'SmolLM2-135M-Instruct', context = 'Tutorial cabin · local visitor practice';
  var zone = doc.createElement('div'); zone.id = 'map-brain'; form.before(zone);
  // Two models of the same size, the visitor chooses (2026-11-01): the base, or the house guide (a LoRA of the same base
  // trained only on this map's labels and laws; receipt in /models/web-node-guide/manifest.json). Default: the base.
  var MODELS = [
    { id: 'base', manifest: '/models/web-node/manifest.json', name: 'SmolLM2-135M-Instruct',
      label: 'Base model · SmolLM2 135M Instruct · 105 MB · general small model' },
    { id: 'guide', manifest: '/models/web-node-guide/manifest.json', name: 'PreceptorOS guide',
      label: 'House guide · SmolLM2 135M LoRA · 105 MB · tuned on this map\'s facts' }
  ], pick = MODELS[0];
  var disclosure = doc.createElement('p'); disclosure.textContent = 'Web node brain: choose one of two models of the same size, both SmolLM2 135M (Apache-2.0): the base model, or the house guide, a LoRA of it trained on this map\'s labels (held-out test of 52 questions: base 5, guide 33). Each is about 105,450,000 weight bytes in 5 chunks plus the wllama runtime (MIT) · 9,146,582 bytes, all from this site, each checked by SHA-256. It runs on this device\'s processor; no graphics card needed. Nothing downloads until you choose; after that it stays on this device. Your chat text stays on this device. The model advises; it never signs or plays for you.'; zone.append(disclosure);
  var chooser = doc.createElement('div'); chooser.id = 'brain-choice'; chooser.setAttribute('role', 'group'); chooser.setAttribute('aria-label', 'Choose the web node brain'); chooser.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px'; zone.append(chooser);
  MODELS.forEach(function (m) {
    var b = doc.createElement('button'); b.type = 'button'; b.id = 'brain-pick-' + m.id; b.textContent = m.label; b.style.minHeight = '44px';
    b.setAttribute('aria-pressed', m === pick ? 'true' : 'false');
    b.addEventListener('click', function () {
      if (loading || busy || m === pick) { return; }
      pick = m; model = m.name; ready = false; start.disabled = false; start.textContent = 'Download the web node brain and verify it';
      chooser.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      note.textContent = 'Chosen: ' + m.label + '. Press download to load it.';
    });
    chooser.append(b);
  });
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
    brain().then(function (B) { return B.load({ consent: true, manifest: pick.manifest, say: function (t) { note.textContent = t; } }); }).then(function () {
      ready = true; note.textContent = model + ' · ready on this device. Ask the tutorial guide anything.'; start.textContent = 'Web node brain ready';
    }, function (error) { note.textContent = 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message; start.disabled = false; }).then(function () { loading = false; });
  });
  doc.addEventListener('map:context', function (event) { choose(event.detail.label); });
  function choose(label) { context = String(label).slice(0, 160); selected.textContent = 'Companion context: ' + context + ' · node backend link NO_DATA unless explicitly measured'; }
  doc.getElementById('map').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (button && button.id !== 'brain-load' && !button.closest('#brain-choice')) { choose(button.textContent); }
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
