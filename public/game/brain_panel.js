// OpenWorld's model panel: fetch once after an explicit open, then paint only Acho frames.
(function (root) {
  'use strict';
  var doc = root.document;
  var chat = doc && doc.getElementById('chat');
  var note = doc && doc.getElementById('chat-note');
  if (!chat || !note) { return; }

  var panel = doc.createElement('section');
  panel.id = 'model-frames-panel'; panel.className = 'voice';
  var disclosure = doc.createElement('details'); disclosure.id = 'model-catalog';
  var summary = doc.createElement('summary'); summary.textContent = 'Model frames · Acho';
  var status = doc.createElement('p'); status.id = 'model-catalog-state'; status.className = 'state'; status.setAttribute('role', 'status'); status.textContent = 'Not loaded until opened.';
  var list = doc.createElement('ol'); list.id = 'model-frames'; list.className = 'model-frames'; list.setAttribute('aria-label', 'Declared model frames');
  disclosure.append(summary, status, list); panel.appendChild(disclosure); chat.insertBefore(panel, note);

  var started = false;
  function noData(cause) {
    status.textContent = 'Model frames: NO_DATA (' + cause + ').';
    list.replaceChildren();
  }
  function paint(frame) {
    var item = doc.createElement('li');
    item.className = 'model-frame';
    var heading = doc.createElement('h3');
    heading.textContent = frame.id.slice('brain-'.length);
    var canvas = doc.createElement('canvas');
    canvas.width = 320; canvas.height = 96;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', frame.atoms[0].r);
    var note = doc.createElement('p');
    note.textContent = 'NO_DATA · residency not measured';
    item.append(heading, canvas, note);
    var ctx = canvas.getContext('2d');
    root.AtlasComicAtoms.paint(ctx, root.AtlasAcho.compile(frame));
    list.appendChild(item);
  }
  function load() {
    if (started) { return; }
    started = true;
    status.textContent = 'Loading declared model frames…';
    if (!root.AtlasCerebroFrame || !root.AtlasAcho || !root.AtlasComicAtoms) {
      noData('Acho renderer unavailable'); return;
    }
    root.fetch('/brains.json', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) { throw new Error('catalog HTTP ' + response.status); }
        return response.json();
      })
      .then(function (catalog) {
        var result = root.AtlasCerebroFrame.project(catalog);
        if (!result.ok) { noData(result.cause); return; }
        result.frames.forEach(paint);
        status.textContent = result.frames.length
          ? result.frames.length + ' declared model frames · live residency remains NO_DATA.'
          : 'NO_DATA (the catalogue has no declared models).';
      })
      .catch(function () { noData('catalog unavailable'); });
  }
  disclosure.addEventListener('toggle', function () { if (disclosure.open) { load(); } });
})(typeof globalThis === 'object' ? globalThis : this);
