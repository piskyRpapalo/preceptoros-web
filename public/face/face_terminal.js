// NORTE 5 [2] (2026-10-27, decree ·6452880777, pre-signed ·6452956804): the chat terminal, conserved from the old map, is
// THE chat panel of the worlds. The radio chat (assets/radio_message_log.js, the same module /play/ mounts) goes into the
// world's chat section, open. What the world says aloud ([role=status], [aria-live]) lands in it by its own observer; every
// line of the conversation (#log) is copied in with its seal as TEXT: what you write is LIVE (you, now); an answer that
// says NO_DATA is NO_DATA, because no model is connected to the worlds yet. Nothing is sent anywhere: the call to the lab
// stays a later piece with its own signature.
(function (root) {
  'use strict';
  var doc = root.document, C = root.AtlasRadioChat, log = doc.getElementById('log');
  var caja = log && log.closest('section');
  if (!C || !caja) { return; }
  C.monta(caja, { T: function () { return ''; } });
  C.alterna(true);
  function copia(li) {
    var txt = li.querySelector('.txt'), t = txt ? txt.textContent : li.textContent, yo = li.classList.contains('me');
    C.dice({ quien: yo ? 'You' : 'Preceptor', fuente: 'chat', sello: yo ? 'LIVE' : /NO_DATA/.test(t) ? 'NO_DATA' : 'LIVE', texto: t });
  }
  Array.prototype.forEach.call(log.children, copia);
  new root.MutationObserver(function (cambios) {
    cambios.forEach(function (c) { Array.prototype.forEach.call(c.addedNodes, function (n) { if (n.nodeType === 1) { copia(n); } }); });
  }).observe(log, { childList: true });
})(window);
