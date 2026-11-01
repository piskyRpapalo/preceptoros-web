// preceptoros.org · the INTRO's Tools door and its release line (NORTE 7, PR 1).
// Reads only the same-origin release card (/release.json). Nothing here loads an external resource.
// Whatever cannot be read or measured stays NO_DATA with its cause, never a guessed figure.
(function (raiz) {
  'use strict';
  var doc = raiz.document;
  var boton = doc.getElementById('door-tools');
  var estado = doc.getElementById('tools-estado');
  var dispositivo = doc.getElementById('tools-dispositivo');

  function sinDatos(causa) { return 'NO_DATA: ' + causa; }

  // Tools is a direct click: if the browser kept its install offer, the click makes the install.
  // If not, the click opens the device list below, and the label says why.
  function pintaTools() {
    if (!boton || !estado || !raiz.PreceptorPwa) { return; }
    if (raiz.PreceptorPwa.instalada()) {
      estado.textContent = 'Already installed on this device.';
    } else if (raiz.PreceptorPwa.instalable()) {
      estado.textContent = 'Install the app on this device with one click.';
    } else {
      estado.textContent = sinDatos('this browser has not offered to install the app. Pick a download below.');
    }
  }

  // Accessibility: Tools opens and closes in place. Opening moves focus to the heading; closing returns focus
  // to the Tools door; Escape closes it too. The close button is a real button, at least 44 px.
  var closeButton = doc.getElementById('close-tools');
  var titulo = doc.getElementById('tools-h');
  function closeTools() {
    if (!dispositivo || dispositivo.hidden) { return; }
    dispositivo.hidden = true;
    if (boton) { boton.setAttribute('aria-expanded', 'false'); boton.focus(); }
  }
  function openTools() {
    if (!dispositivo) { return; }
    dispositivo.hidden = false;
    if (boton) { boton.setAttribute('aria-expanded', 'true'); }
    if (titulo) { titulo.focus(); }
    dispositivo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (closeButton) { closeButton.addEventListener('click', closeTools); }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeTools(); } });
  // The intro shows only the doors. Tools opens the device list in place (hidden until pressed).
  if (boton) {
    boton.addEventListener('click', function () {
      if (raiz.PreceptorPwa && raiz.PreceptorPwa.instalable()) {
        raiz.PreceptorPwa.instala().then(pintaTools);
      } else if (dispositivo) {
        if (dispositivo.hidden) { openTools(); } else { closeTools(); }
        pintaTools();
      }
    });
  }
  raiz.addEventListener('pwa-oferta', pintaTools);
  pintaTools();

  function pinta(tarjeta) {
    var campos = {
      version: tarjeta.version || sinDatos('the card has no version.'),
      fecha: tarjeta.fecha ? 'released ' + tarjeta.fecha + ', measured ' + String(tarjeta.medido || '').slice(0, 10) + (tarjeta.seal ? ' · seal ' + tarjeta.seal : '') : sinDatos('no release date in the card.')
    };
    var instalador = (tarjeta.assets || []).filter(function (a) { return a.nombre === 'install.sh'; })[0];
    campos.sha = instalador && instalador.sha256 ? instalador.sha256 : sinDatos('install.sh has no fingerprint in the card.');
    Object.keys(campos).forEach(function (k) {
      var el = doc.querySelector('[data-rel="' + k + '"]');
      if (el) { el.textContent = campos[k]; }
    });
    var nota = doc.querySelector('[data-rel="estado"]');
    if (nota) {
      nota.textContent = 'Read from the release card on this site. Re-check the fingerprint against the release before you rely on it.';
    }
  }

  if (!raiz.fetch) {
    return;
  }
  raiz.fetch('/release.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) { throw new Error('status ' + r.status); } return r.json(); })
    .then(pinta)
    .catch(function (e) {
      var nota = doc.querySelector('[data-rel="estado"]');
      if (nota) { nota.textContent = sinDatos('the release card could not be read (' + (e && e.message ? e.message : 'unknown') + ').'); }
    });
})(window);
