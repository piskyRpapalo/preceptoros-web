(function () {
  'use strict';
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }
  function ciclo() {
    try { return window.AtlasVector && window.AtlasVector.leer().c; } catch (e) { return null; }
  }
  function coordenada() {
    try { return window.AtlasVector && window.AtlasVector.leer().k; } catch (e) { return null; }
  }
  function accionId() {
    try { return new URLSearchParams(window.location.search).get('action') || '(current state)'; }
    catch (e) { return '(current state)'; }
  }
  function monta() {
    if (document.getElementById('hitl-firma')) { return; }
    if (!window.Identity) { return; }
    var prev = document.activeElement;
    var box = el('section', 'hitl-firma');
    box.id = 'hitl-firma'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'hitl-firma-t');
    box.appendChild(el('h2', 'hitl-firma-t', 'Sign this action (Cryptographic HITL)')).id = 'hitl-firma-t';
    box.appendChild(el('p', 'hitl-firma-que',
      'What it does: signs the current action with your visitor key (Ed25519, RFC 8032). ' +
      'What it costs: 0 (a signature, not a resource). ' +
      'What gets signed: action id, world coordinate, game cycle. ' +
      'The private key never leaves this device. Nothing is sent to anyone.'));
    var recibo = el('p', 'hitl-firma-recibo', 'Receipt appears here after you sign.');
    recibo.id = 'hitl-firma-recibo'; recibo.setAttribute('role', 'status');
    box.appendChild(recibo);
    var row = el('div', 'hitl-firma-row');
    var firma = el('button', 'hitl-firma-btn', 'Sign'); firma.type = 'button';
    var no = el('button', 'hitl-firma-no', 'Cancel'); no.type = 'button';
    row.appendChild(firma); row.appendChild(no); box.appendChild(row);
    function cierra(devuelve) {
      box.remove();
      if (devuelve && prev && prev.focus) { prev.focus(); }
    }
    function tecla(e) { if (e.key === 'Escape') { cierra(true); } }
    document.addEventListener('keydown', tecla, true);
    firma.addEventListener('click', function () {
      if (!window.Identity.quien || !window.Identity.quien()) {
        recibo.textContent = 'NO_DATA · no visitor key: create your key first (identity.create). Nothing was signed.';
        return;
      }
      var c = ciclo(), k = coordenada();
      if (c == null || !k) {
        recibo.textContent = 'NO_DATA · game cycle or world coordinate unavailable (state vector not ready). Nothing was signed.';
        return;
      }
            var utc = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      var mensaje = 'hitl/1|' + accionId() + '|' + k[0] + ',' + k[1] + '|' + c + '|' + utc;
      window.Identity.publica().then(function (pub) {
        return window.Identity.firmarTexto(mensaje).then(function (h) { return { pub: pub, h: h }; });
      }).then(function (r) {
        recibo.textContent = 'Attestation Receipt · action: ' + accionId() +
          ' · world coordinate: [' + k[0] + ', ' + k[1] + '] · cycle: ' + c +
          ' · utc (declared, no authority): ' + utc +
          ' · public key: ' + r.pub + ' · signature: ed25519:' + r.h.slice(0, 16) + '… (' + r.h.length + ' hex chars)';
      }).catch(function (e) {
        recibo.textContent = 'NO_DATA · signature failed: ' + (e && e.message ? e.message : e) + '. Nothing was signed.';
      });
    });
    no.addEventListener('click', function () { cierra(true); });
    document.body.appendChild(box);
    firma.focus();
  }
    window.AtlasHitlFirma = { monta: monta, estado: function () { return 'NO_DATA: waiting G4 wiring'; } };
})();
