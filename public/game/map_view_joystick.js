// Map joysticks. The left stick is the camera (the old pan): it pushes the view, so the map slides the opposite way to
// a drag (Sovereign, 2026-11-08). The right stick, reserved by decree 2026-11-07, is born with the character: it walks
// the visitor's companion one hex at a time (map_chunks.js dirOf; colony_controls.js step). Turn and zoom stay on wheel,
// pinch and keys.
(function (root) {
  'use strict';
  var doc = root.document, stage = doc && doc.getElementById('stage');
  var canvas = doc && doc.getElementById('surface'), pan = root.AtlasMapPan;
  if (!stage || !canvas || !pan || doc.getElementById('view-joystick')) return;

  var status = doc.createElement('span'); status.className = 'sr'; status.setAttribute('role', 'status'); stage.appendChild(status);
  function announce(message) { status.textContent = message; }
  function size() { var r = canvas.getBoundingClientRect(); return r.width ? canvas.width / r.width : 1; }
  function state() { return 'Map view: ' + (Number(canvas.dataset.panx) || 0) + ', ' + (Number(canvas.dataset.pany) || 0) + '; zoom ' + (canvas.dataset.zoom || '1.00') + '; angle ' + (canvas.dataset.angle || '0') + ' degrees.'; }

  // make(id, side, glyph, label, move): one stick; move(dx, dy) receives the drag or key step in CSS pixels.
  function make(id, side, glyph, label, move) {
    var group = doc.createElement('div'); group.id = id; group.className = 'view-joy ' + side;
    group.setAttribute('role', 'group'); group.setAttribute('aria-label', label.group);
    var stick = doc.createElement('button'); stick.type = 'button'; stick.className = 'view-stick'; stick.setAttribute('aria-label', label.stick);
    var knob = doc.createElement('span'); knob.setAttribute('aria-hidden', 'true'); knob.textContent = glyph;
    stick.appendChild(knob); group.appendChild(stick); stage.appendChild(group);
    // View controls are not a selected building or a new chat context.
    group.addEventListener('click', function (event) { event.stopPropagation(); });
    var active = null;
    stick.addEventListener('pointerdown', function (event) {
      if (active !== null || event.button !== 0) return;
      event.preventDefault(); active = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
      stick.setAttribute('data-on', ''); if (stick.setPointerCapture) stick.setPointerCapture(event.pointerId);
    });
    stick.addEventListener('pointermove', function (event) {
      if (!active || event.pointerId !== active.id) return;
      event.preventDefault(); var dx = event.clientX - active.x, dy = event.clientY - active.y;
      active.x = event.clientX; active.y = event.clientY; move(dx, dy);
      var x = Math.max(-14, Math.min(14, event.clientX - active.startX));
      var y = Math.max(-14, Math.min(14, event.clientY - active.startY));
      knob.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    function finish(event) {
      if (!active || event.pointerId !== active.id) return;
      active = null; stick.removeAttribute('data-on'); knob.style.transform = ''; move(0, 0, true); announce(state());
    }
    stick.addEventListener('pointerup', finish); stick.addEventListener('pointercancel', finish); stick.addEventListener('lostpointercapture', finish);
    stick.addEventListener('keydown', function (event) {
      var delta = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
      if (!delta) return;
      event.preventDefault(); event.stopPropagation(); move(delta[0], delta[1]); announce(state());
    });
  }

  make('view-joystick', 'left', '✥', { group: 'Map camera control', stick: 'Move the camera. Drag, or use arrow keys.' }, function (dx, dy) {
    var scale = size(); pan.move(-dx * scale, -dy * scale);
  });
  // The character stick: past 18 px from where the finger landed it steps toward the push, and keeps stepping while held.
  var lean = [0, 0], timer = null;
  function walkOnce() {
    var ow = root.AtlasOpenworldView && root.AtlasOpenworldView(), M = root.AtlasMapChunks, CP = root.AtlasColoniaPagina;
    if (!ow || !ow.controls || !M) { announce('NO_DATA: the character is not on the map yet.'); return; }
    if (Math.abs(lean[0]) + Math.abs(lean[1]) < 18) { return; }
    ow.controls.step(M.dirOf(lean[0], lean[1], Number(canvas.dataset.angle) || 0, CP && CP.SQUASH));
  }
  make('character-joystick', 'right', '✥', { group: 'Character control', stick: 'Walk your character. Push toward a direction, or use arrow keys.' }, function (dx, dy, end) {
    if (end) { lean = [0, 0]; root.clearInterval(timer); timer = null; return; }
    var key = Math.abs(dx) === 24 || Math.abs(dy) === 24;
    lean = [lean[0] + dx, lean[1] + dy];
    if (key) { walkOnce(); lean = [0, 0]; return; }
    if (!timer && Math.abs(lean[0]) + Math.abs(lean[1]) >= 18) { delete canvas.dataset.look; walkOnce(); timer = root.setInterval(walkOnce, 260); }
  });
  // The gamepad (gamepad.js) gathers both sticks and the account buttons under the map.
  var pad = doc.createElement('script'); pad.src = '/game/gamepad.js'; doc.head.appendChild(pad);
})(typeof window !== 'undefined' ? window : globalThis);
