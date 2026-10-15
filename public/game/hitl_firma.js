/* preceptoros.org · theGame · G3 ONE-CLICK CRYPTOGRAPHIC HITL (PROPUESTA mistral/g3).
   WHAT. One click signs the current action and shows the ATTESTATION RECEIPT:
   action id, world coordinate, public key, Ed25519 signature, game cycle.
   The private key NEVER leaves the device: `Identity` (assets/auth.js) is the
   only owner of the key store; this piece only ASKS it to sign.
   VOCABULARY (canon ideas13oct). This is a Cryptographic HITL (EU AI Act
   Art. 14, CELEX 32024R1689; IETF RFC 8032 Ed25519). The receipt is an
   Attestation Receipt. Zero Retention with Attestation Receipt: nothing is
   sent anywhere; zero new network requests (cero red nueva).
   CONTRACT BEFORE SIGNATURE. The dialog shows what it does, what it costs and
   what exactly gets signed, before the button does anything. Cancel and
   Escape sign nothing.
   DETERMINISM. Same state + same action = same signed message, except the
   game cycle field which is read at click time and shown in the receipt.
   A11Y. Mouse, keyboard, touch; Escape cancels; role=dialog aria-modal;
   focus moved and restored; buttons >= 44 px (home.css budget).
   FIRMOs OPEN (NOT decided here): receipt date UTC vs game cycles; receipt
   push identity (receipts branch only, never main, never jetson); stamp cost. */
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
      var mensaje = 'hitl/1|' + accionId() + '|' + k[0] + ',' + k[1] + '|' + c;
      window.Identity.publica().then(function (pub) {
        return window.Identity.firmarTexto(mensaje).then(function (h) { return { pub: pub, h: h }; });
      }).then(function (r) {
        recibo.textContent = 'Attestation Receipt · action: ' + accionId() +
          ' · world coordinate: [' + k[0] + ', ' + k[1] + '] · cycle: ' + c +
          ' · public key: ' + r.pub + ' · signature: ed25519:' + r.h.slice(0, 16) + '… (' + r.h.length + ' hex chars)';
      }).catch(function (e) {
        recibo.textContent = 'NO_DATA · signature failed: ' + (e && e.message ? e.message : e) + '. Nothing was signed.';
      });
    });
    no.addEventListener('click', function () { cierra(true); });
    document.body.appendChild(box);
    firma.focus();
  }
  window.AtlasHitlFirma = { monta: monta };
  if (window.AtlasDeepLinks && window.AtlasDeepLinks.monta) {
    /* The deep link is the door of G3: after landing, the sign panel can be opened by the host page. */
  }
})();
