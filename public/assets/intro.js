// preceptoros.org · the INTRO's Tools door and its release line (NORTE 7, PR 1).
// Reads only the same-origin release card (/release.json). Nothing here loads an external resource.
// Whatever cannot be read or measured stays NO_DATA with its cause, never a guessed figure.
(function (raiz) {
  'use strict';
  var doc = raiz.document;
  var boton = doc.getElementById('door-tools');
  var estado = doc.getElementById('tools-estado');
  var dispositivo = doc.getElementById('tools-dispositivo');
  var instalar = doc.getElementById('tools-install');
  var installStatus = doc.getElementById('tools-install-status');

  function sinDatos(causa) { return 'NO_DATA: ' + causa; }

  // Tools is the catalogue door. Installation is a separate, explicit action.
  function pintaTools() {
    if (!boton || !estado) { return; }
    estado.textContent = 'Choose what to install or explore.';
    if (!instalar || !installStatus) { return; }
    if (raiz.PreceptorPwa && raiz.PreceptorPwa.instalada()) {
      instalar.disabled = true;
      installStatus.textContent = 'The web app is already installed on this device.';
    } else if (raiz.PreceptorPwa && raiz.PreceptorPwa.instalable()) {
      instalar.disabled = false;
      installStatus.textContent = 'The browser can install the web app on this device.';
    } else {
      instalar.disabled = true;
      installStatus.textContent = sinDatos('this browser has not offered an installation.');
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
      if (dispositivo) {
        if (dispositivo.hidden) { openTools(); } else { closeTools(); }
        pintaTools();
      }
    });
  }
  if (instalar) instalar.addEventListener('click', function () {
    if (!raiz.PreceptorPwa || !raiz.PreceptorPwa.instalable()) { pintaTools(); return; }
    instalar.disabled = true;
    raiz.PreceptorPwa.instala().then(pintaTools, function () {
      pintaTools(); installStatus.textContent = sinDatos('the browser could not open the installation offer.');
    });
  });
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
