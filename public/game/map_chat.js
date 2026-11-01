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
  // Guide mode (guide_tools.js): questions go through the tool loop. Default ON once the brain is loaded.
  var guide = doc.createElement('button'); guide.type = 'button'; guide.id = 'guide-mode'; guide.style.minHeight = '44px'; guide.hidden = true;
  function guideSay(on) { guide.setAttribute('aria-pressed', on ? 'true' : 'false'); guide.textContent = 'Guide mode: ' + (on ? 'ON · it can read the screen, open tabs, walk and point; you press' : 'OFF · plain answers'); }
  guideSay(false); guide.addEventListener('click', function () { guideSay(guide.getAttribute('aria-pressed') !== 'true'); }); zone.append(guide);
  var selected = doc.createElement('p'); selected.id = 'brain-context'; selected.textContent = context; zone.append(selected);
  function line(who, text) { var item = doc.createElement('li'); item.textContent = text.startsWith('NO_DATA') ? text : who + ' · ' + text; log.append(item); }
  function script(src, name) {
    if (root[name]) { return Promise.resolve(root[name]); }
    return new Promise(function (ok, fail) {
      var s = doc.createElement('script'); s.src = src;
      s.onload = function () { ok(root[name]); }; s.onerror = function () { fail(new Error(src + ' did not load')); }; doc.head.append(s);
    });
  }
  function brain() { return script('/game/guide_tools.js', 'AtlasGuideTools').then(function () { return script('/game/web_node_brain.js', 'AtlasWebNodeBrain'); }); }
  function radio(text) { line('Guide', text.replace(/^Guide · /, '')); }  // each tool step is one bubble frame in the chat log
  start.addEventListener('click', function () {
    if (ready || loading) { return; }
    loading = true; start.disabled = true; note.textContent = 'Loading the web node brain…';
    brain().then(function (B) { return B.load({ consent: true, say: function (t) { note.textContent = t; } }); }).then(function () {
      ready = true; note.textContent = model + ' · ready on this device. Ask the tutorial guide anything.'; start.textContent = 'Web node brain ready'; guide.hidden = false; guideSay(true);
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
      var B = root.AtlasWebNodeBrain, answer;
      if (guide.getAttribute('aria-pressed') === 'true' && root.AtlasGuideTools) {
        var g = await root.AtlasGuideTools.run(text, { complete: B.complete, env: { doc: doc, win: root }, log: radio, facts: B.FACTS + ' Selected on the map: ' + context + '.', now: function () { return root.performance.now(); } });
        var h = Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(g.answer))), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        answer = { verified: true, model: 'SmolLM2-135M-Instruct-Q4_K_M', text: g.answer, sha: h, steps: g.steps };
        doc.dispatchEvent(new CustomEvent('guide:steps', { detail: { steps: g.steps } }));
      } else { answer = await B.reply(text, context); }
      line(answer.model, answer.text); note.textContent = 'Local answer from the web node brain · ' + context;
      doc.dispatchEvent(new CustomEvent('brain:answer', { detail: { verified: answer.verified, model: answer.model, text: answer.text, sha: answer.sha } }));
    }
    catch (error) { line('Companion', 'NO_DATA · ' + (error.cause || 'model_unavailable') + ': ' + error.message); }
    finally { busy = false; form.querySelector('button[type="submit"]').disabled = false; }
  });
  root.addEventListener('pagehide', function () { ready = false; log.replaceChildren(); });
})(globalThis);
