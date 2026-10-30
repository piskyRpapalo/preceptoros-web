(function (root) {
  'use strict';
  var doc = root.document, form = doc.getElementById('entry'), log = doc.getElementById('log'), note = doc.getElementById('chat-note');
  if (!form || !log) { return; }
  var joystick = doc.getElementById('joy'), actions = joystick.querySelector('[aria-label="Node and tutorial"]'), preference = joystick.querySelector('select');
  if (actions && preference) {
    var fold = doc.createElement('details'), summary = doc.createElement('summary'); summary.textContent = 'Terminal and tutorial';
    fold.append(summary, actions, preference); joystick.querySelector('[role="group"]').append(fold);
  }
  var worker = null, next = 0, pending = new Map(), ready = false, busy = false;
  var model = 'Qwen3-1.7B-q4f16_1-MLC', context = 'Tutorial cabin · local visitor practice';
  var zone = doc.createElement('div'); zone.id = 'map-brain'; form.before(zone);
  var disclosure = doc.createElement('p'); disclosure.textContent = 'Optional browser brain: Qwen3 1.7B · 968,001,536 weight bytes plus runtime/configuration files (extra size NO_DATA). Download sources: jsDelivr, Hugging Face and MLC GitHub. About 2,037 MB GPU memory required. Your chat text stays on this device; no download starts until you choose it. The model advises; it never signs or plays for you.'; zone.append(disclosure);
  var start = doc.createElement('button'); start.type = 'button'; start.id = 'brain-load'; start.textContent = 'Download and verify the browser brain'; start.style.minHeight = '44px'; zone.append(start);
  var selected = doc.createElement('p'); selected.id = 'brain-context'; selected.textContent = context; zone.append(selected);
  function line(who, text) { var item = doc.createElement('li'); item.textContent = text.startsWith('NO_DATA') ? text : who + ' · ' + text; log.append(item); }
  function call(type, payload) {
    return new Promise(function (resolve, reject) {
      var id = ++next; pending.set(id, { resolve: resolve, reject: reject }); worker.postMessage(Object.assign({ id: id, type: type }, payload));
    });
  }
  start.addEventListener('click', async function () {
    if (worker) { return; }
    if (!root.navigator.gpu) { note.textContent = 'NO_DATA: WebGPU is unavailable in this browser.'; return; }
    start.disabled = true; note.textContent = 'Loading the declared browser model…';
    worker = new Worker('/game/map_brain_worker.js', { type: 'module' });
    worker.onmessage = function (event) {
      var data = event.data;
      if (data.progress) { note.textContent = data.progress; return; }
      var request = pending.get(data.id); if (!request) { return; } pending.delete(data.id);
      if (data.error) { request.reject(new Error(data.error)); } else { request.resolve(data); }
    };
    worker.onerror = function () { pending.forEach(function (p) { p.reject(new Error('Browser brain worker failed')); }); pending.clear(); };
    try { var answer = await call('load', { consent: true }); ready = answer.ready; note.textContent = model + ' · ready on this device.'; start.textContent = 'Browser brain ready'; }
    catch (error) { note.textContent = 'NO_DATA: ' + error.message; worker.terminate(); worker = null; start.disabled = false; }
  });
  doc.addEventListener('map:context', function (event) { choose(event.detail.label); });
  function choose(label) { context = String(label).slice(0, 160); selected.textContent = 'Companion context: ' + context + ' · node backend link NO_DATA unless explicitly measured'; }
  doc.getElementById('map').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (button && button.id !== 'brain-load') { choose(button.textContent); }
  });
  doc.getElementById('visitor-play').addEventListener('visitor:battle', function (event) { choose('Practice battle at ' + event.detail.place + ' · ' + event.detail.combat.gana + ' · balance NO_DATA'); });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var input = doc.getElementById('question'), text = input.value.trim();
    if (!text || busy) { return; }
    if (new TextEncoder().encode(text).length > 600) { note.textContent = 'NO_DATA: message exceeds 600 UTF-8 bytes.'; return; }
    line('You', text); input.value = '';
    if (!ready) { line('Companion', 'NO_DATA: choose and load the browser brain first.'); return; }
    busy = true; form.querySelector('button[type="submit"]').disabled = true;
    try { var answer = await call('reply', { text: text, context: context }); line(answer.model, answer.text); note.textContent = 'Local browser answer · ' + context; }
    catch (error) { line('Companion', 'NO_DATA: ' + error.message); }
    finally { busy = false; form.querySelector('button[type="submit"]').disabled = false; }
  });
  root.addEventListener('pagehide', function () { if (worker) { worker.terminate(); worker = null; } ready = false; pending.clear(); log.replaceChildren(); });
})(globalThis);
