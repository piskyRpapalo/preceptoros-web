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
  if (capa !== caja) { var box = doc.getElementById('radio-chat'), radio = doc.querySelector('#voices [data-speaker="Radio"]'); if (box) { (radio || caja).appendChild(box); } }
  // The existing chat becomes the Chat channel of the player. Move its nodes,
  // preserving their listeners and the single conversation; do not clone them.
  var player = doc.getElementById('radio-chat'), entry = doc.getElementById('entry'), title = doc.getElementById('chat-h');
  if (player && entry && radio) {
    if (title) player.appendChild(title);
    player.appendChild(log); player.appendChild(entry);
    var extra = doc.createElement('details'), summary = doc.createElement('summary');
    summary.textContent = 'Map radio controls'; extra.appendChild(summary);
    Array.prototype.slice.call(radio.children).forEach(function (child) {
      if (child !== player && !child.classList.contains('who')) extra.appendChild(child);
    });
    radio.appendChild(extra);
    caja.hidden = true; capa.classList.add('with-showcase-player');
    C.canal('chat');
    var skip = doc.querySelector('a.skip[href="#chat"]');
    if (skip) skip.addEventListener('click', function (event) {
      event.preventDefault();
      if (root.AtlasTerminalPanel && root.AtlasTerminalPanel.mounted) root.AtlasTerminalPanel.mounted.show('Communication');
      C.canal('chat');
      var input = doc.getElementById('question'); if (input) input.focus();
    });
  }
  C.alterna(true);
})(window);
