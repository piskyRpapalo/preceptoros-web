(function () {
  'use strict';
  var Package = window.CreationPackage, Feedback = window.CreationFeedback;
  var editor = document.getElementById('editor-panel'), reader = document.getElementById('reader-panel');
  var description = document.getElementById('creation-description'), status = document.getElementById('creation-status');
  var voiceStatus = document.getElementById('voice-status'), sign = document.getElementById('sign-creation');
  var download = document.getElementById('download-creation'), audioFile = document.getElementById('voice-audio-file');
  var catalog = null, declaration = null, audioBytes = null, drawing = null, prepared = null, signedPackage = null;
  var sound = Feedback.create({ onError: function (cause) { voiceStatus.textContent = cause; } });
  var objectUrls = [];

  function invalidate(message) {
    prepared = null; signedPackage = null; sign.disabled = true; download.disabled = true;
    if (message) status.textContent = message;
  }
  function dataUrl(name, bytes, mime) {
    var url = URL.createObjectURL(new Blob([bytes], { type: mime })); objectUrls.push(url);
    var link = document.createElement('a'); link.href = url; link.download = name;
    link.textContent = 'Download ' + name; link.style.minHeight = '44px';
    document.getElementById('creation-status').appendChild(link);
  }
  async function fileText(input) {
    if (!input.files || input.files.length !== 1) throw new Error('Choose the requested local file.');
    var file = input.files[0];
    if (file.size > Package.MAX) throw new Error('File exceeds the creation limit.');
    return file.text();
  }
  function frameInput(frame) {
    var points = frame.atoms[0].i[0].pts;
    var surface = document.querySelector('#paint [data-surface="paint"]');
    if (!surface) return;
    var polyline = surface.querySelector('polyline');
    if (polyline) polyline.setAttribute('points', points.map(function (p) { return p.join(','); }).join(' '));
  }
  function renderVerified(value) {
    var f = value.frame, points = f.atoms[0].i[0].pts;
    var svg = document.createElementNS('http:' + '//' + 'www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 412 515'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Verified ribbon drawing with ' + points.length + ' points');
    var line = document.createElementNS(svg.namespaceURI, 'polyline');
    line.setAttribute('points', points.map(function (p) { return p.join(','); }).join(' '));
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'currentColor'); line.setAttribute('stroke-width', '5');
    line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round'); svg.appendChild(line);
    document.getElementById('creation-art').replaceChildren(svg);
    document.getElementById('creation-author').textContent = 'Author: ' + value.manifest.author;
    document.getElementById('reader-description').textContent = value.manifest.description;
    var player = document.getElementById('creation-audio'), url = URL.createObjectURL(new Blob([value.audio], { type: 'audio/wav' }));
    objectUrls.push(url); player.src = url;
    document.getElementById('reader-status').textContent = 'Signature verified · ' + value.id;
  }
  async function verifyFile(file) {
    if (!file || file.size > Package.MAX) throw new Error('Creation file is missing or exceeds 25 MiB.');
    renderVerified(await Package.verify(await file.text()));
  }
  async function readRackCreation(identifier) {
    if (!/^[a-f0-9]{64}$/.test(identifier) || !['127.0.0.1', 'localhost', '::1'].includes(location.hostname)) return;
    try {
      var response = await fetch('/api/creaciones/' + identifier, { cache: 'no-store' });
      if (!response.ok) throw new Error('Rack creation is unavailable.');
      var value = await Package.verify(await response.text());
      if (value.id !== identifier) throw new Error('Creation identifier mismatch.');
      reader.hidden = false; editor.hidden = true; renderVerified(value);
    } catch (error) { document.getElementById('reader-status').textContent = 'NO_DATA · ' + error.message; }
  }

  document.getElementById('load-voice').addEventListener('click', async function () {
    invalidate('Voice files changed. Sign the drawing again after loading them.');
    try {
      var c = await Feedback.loadCatalog(await fileText(document.getElementById('voice-catalog-file')));
      var d = JSON.parse(await fileText(document.getElementById('voice-declaration-file')));
      var required = ['schema', 'profile_id', 'text', 'size', 'sha256', 'data'];
      if (!d || Object.keys(d).sort().join('|') !== required.slice().sort().join('|') ||
          d.schema !== 'preceptoros.creation-declaration/1' || d.profile_id !== c.profile_id ||
          typeof d.text !== 'string' || !Number.isSafeInteger(d.size) || d.size < 1 ||
          !/^[a-f0-9]{64}$/.test(d.sha256)) throw new Error('Statement profile or fields are invalid.');
      var fromFile = new Uint8Array(await audioFile.files[0].arrayBuffer());
      var fromDescriptor = Package.decode(d.data);
      if (d.size !== fromFile.length || d.size !== fromDescriptor.length ||
          await Package.sha256(fromFile) !== d.sha256 || await Package.sha256(fromDescriptor) !== d.sha256 ||
          fromFile.some(function (byte, index) { return byte !== fromDescriptor[index]; })) throw new Error('Statement WAV does not match its descriptor.');
      Package.wav(fromFile); catalog = c; declaration = d; audioBytes = fromFile;
      await sound.setCatalog(c);
      voiceStatus.textContent = 'One local voice profile loaded · ' + c.profile_id;
      sign.disabled = !drawing;
    } catch (error) {
      catalog = declaration = audioBytes = null;
      voiceStatus.textContent = 'NO_DATA · ' + (error.message || String(error));
    }
  });
  audioFile.addEventListener('change', function () { catalog = declaration = audioBytes = null; invalidate('Voice audio changed. Load its matching files again.'); });
  document.getElementById('voice-catalog-file').addEventListener('change', function () { catalog = null; invalidate('Voice catalog changed. Load matching voice files again.'); });
  document.getElementById('voice-declaration-file').addEventListener('change', function () { declaration = audioBytes = null; invalidate('Statement changed. Load matching voice files again.'); });
  description.addEventListener('input', function () { invalidate('Description changed. Sign the creation again.'); });
  document.getElementById('listen-statement').addEventListener('click', function () {
    if (!declaration) return;
    sound.playAudio(declaration.data).then(function () { status.textContent = 'Statement playback finished.'; })
      .catch(function (error) { status.textContent = 'NO_DATA · ' + error.message; });
  });
  document.getElementById('sign-creation').addEventListener('click', async function () {
    invalidate('Signing drawing and statement…');
    try {
      if (!drawing || !catalog || !declaration || !audioBytes) throw new Error('A valid drawing and one voice profile are required.');
      if (!window.Identity || !Identity.quien() || !Identity.publica || !Identity.firmarTexto) throw new Error('Create or unlock your web identity first.');
      var frame = drawing.frame();
      prepared = await Package.prepare({ author: Identity.quien(), description: description.value,
        voice_profile: catalog.profile_id, frame: frame, audio: audioBytes });
      var publicKey = await Identity.publica(), signature = await Identity.firmarTexto(prepared.manifest);
      signedPackage = await Package.finish(prepared, publicKey, signature);
      download.disabled = false; status.textContent = 'Drawing and statement signed by ' + Identity.quien() + '.';
      await sound.playClip('signed');
    } catch (error) { invalidate('NO_DATA · ' + (error.message || String(error))); }
  });
  document.getElementById('download-creation').addEventListener('click', async function () {
    if (!signedPackage) return;
    var blob = new Blob([JSON.stringify(signedPackage)], { type: 'application/json' });
    var url = URL.createObjectURL(blob); objectUrls.push(url);
    var link = document.createElement('a'); link.href = url; link.download = 'preceptoros-creation.json';
    link.click(); status.textContent = 'Signed creation exported as a file.';
    sound.playClip('exported').catch(function () {});
  });
  document.getElementById('creation-file').addEventListener('change', async function (event) {
    try { renderVerified(await Package.verify(await fileText(event.target))); }
    catch (error) { document.getElementById('reader-status').textContent = 'NO_DATA · ' + error.message; }
  });
  drawing = window.AtlasBubblePaint.mount(document.getElementById('paint'), {
    band: 'cyan', stroke: 'ink', feedback: sound,
    onChange: function (frame) { drawing.frameValue = frame; invalidate(frame ? 'Drawing changed. Sign the creation again.' : 'NO_DATA · drawing is invalid.');
      sign.disabled = !frame || !catalog || !declaration; }
  });
  sign.disabled = true;
  document.getElementById('listen-statement').disabled = false;
  document.getElementById('listen-statement').addEventListener('click', function () {
    if (!declaration) voiceStatus.textContent = 'NO_DATA · load a local statement first.';
  });
  var pathId = /^\/creaciones\/([a-f0-9]{64})\/?$/.exec(location.pathname);
  var hashId = new URLSearchParams(location.hash.slice(1)).get('creation');
  readRackCreation(pathId ? pathId[1] : hashId);
  window.addEventListener('pagehide', function () { objectUrls.forEach(URL.revokeObjectURL); });
})();
