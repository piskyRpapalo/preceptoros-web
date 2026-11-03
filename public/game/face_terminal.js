// The world panel mounts Radio, Chat and Echoes; the model conversation stays in its own log.
(function (root) {
  'use strict';
  var doc = root.document, C = root.AtlasRadioChat, log = doc.getElementById('log');
  var caja = log && log.closest('section');
  if (!C || !caja) { return; }
  // H9 (2026-11-01): a page may name a wider layer (data-radio-capa) so the radio hears everything it says aloud — on
  // /openworld/ that is the whole map: nodes, zoom, the visit, the tutorial. The box still opens inside the chat section.
  var capa = doc.querySelector('[data-radio-capa]') || caja;
  // Where the chat is always on screen (/openworld/), the radio's conversation channel is not a second «Chat» button.
  C.monta(capa, {});
  if (capa !== caja) { var box = doc.getElementById('radio-chat'); if (box) { caja.appendChild(box); } }
  C.alterna(true);
})(window);
