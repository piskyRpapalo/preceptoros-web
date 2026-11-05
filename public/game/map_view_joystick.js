// Map view joystick. It controls the existing view engines, never the visitor.
(function (root) {
  'use strict';
  var doc = root.document, stage = doc && doc.getElementById('stage');
  var canvas = doc && doc.getElementById('surface'), pan = root.AtlasMapPan;
  if (!stage || !canvas || !pan || doc.getElementById('view-joystick')) return;

  var group = doc.createElement('div');
  group.id = 'view-joystick'; group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Map view controls');
  group.style.cssText = 'position:absolute;left:4px;bottom:4px;z-index:3;display:grid;justify-items:center;gap:2px;max-width:110px';
  var stick = doc.createElement('button'); stick.type = 'button'; stick.id = 'view-stick';
  stick.style.cssText = 'width:88px;height:88px;min-width:44px;min-height:44px;border:2px solid currentColor;border-radius:50%;background:var(--bg);color:var(--fg);touch-action:none;display:grid;place-items:center;cursor:grab';
  var knob = doc.createElement('span'); knob.setAttribute('aria-hidden', 'true');
  knob.style.cssText = 'width:32px;height:32px;border:2px solid currentColor;border-radius:50%;background:var(--soft)';
  stick.appendChild(knob);
  var mode = doc.createElement('button'); mode.type = 'button'; mode.id = 'view-stick-mode';
  mode.style.cssText = 'min-width:88px;min-height:44px;padding:4px;background:var(--bg);color:var(--fg);border:2px solid currentColor';
  var status = doc.createElement('span'); status.className = 'sr'; status.setAttribute('role', 'status');
  group.append(stick, mode, status); stage.appendChild(group);
  var turning = false, active = null, carryX = 0, carryY = 0;
  function announce(message) { status.textContent = message; }
  function refreshMode() {
    mode.textContent = turning ? 'Turn / zoom' : 'Pan';
    mode.setAttribute('aria-pressed', String(turning));
    mode.setAttribute('aria-label', turning ? 'Map joystick mode: turn and zoom. Switch to pan.' : 'Map joystick mode: pan. Switch to turn and zoom.');
    stick.setAttribute('aria-label', turning ? 'Turn and zoom the map. Drag, or use arrow keys.' : 'Pan the map. Drag, or use arrow keys.');
  }
  mode.addEventListener('click', function () { turning = !turning; carryX = carryY = 0; refreshMode(); announce('Map joystick: ' + mode.textContent); });
  function size() { var r = canvas.getBoundingClientRect(); return r.width ? canvas.width / r.width : 1; }
  function click(id) { var button = doc.getElementById(id); if (button) button.click(); }
  function camera(dx, dy) {
    if (!turning) { var scale = size(); pan.move(dx * scale, dy * scale); return; }
    carryX += dx; carryY += dy;
    while (Math.abs(carryX) >= 24) { var sx = Math.sign(carryX); click(sx > 0 ? 'rotate-right' : 'rotate-left'); carryX -= sx * 24; }
    while (Math.abs(carryY) >= 24) { var sy = Math.sign(carryY); click(sy > 0 ? 'zoom-out' : 'zoom-in'); carryY -= sy * 24; }
  }
  function state() { return 'Map view: ' + (Number(canvas.dataset.panx) || 0) + ', ' + (Number(canvas.dataset.pany) || 0) + '; zoom ' + (canvas.dataset.zoom || '1.00') + '; angle ' + (canvas.dataset.angle || '0') + ' degrees.'; }
  stick.addEventListener('pointerdown', function (event) {
    if (active !== null || event.button !== 0) return;
    event.preventDefault(); active = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
    mode.disabled = true; carryX = carryY = 0; if (stick.setPointerCapture) stick.setPointerCapture(event.pointerId);
  });
  stick.addEventListener('pointermove', function (event) {
    if (!active || event.pointerId !== active.id) return;
    event.preventDefault(); var dx = event.clientX - active.x, dy = event.clientY - active.y;
    active.x = event.clientX; active.y = event.clientY; camera(dx, dy);
    var x = Math.max(-20, Math.min(20, event.clientX - active.startX));
    var y = Math.max(-20, Math.min(20, event.clientY - active.startY));
    knob.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });
  function finish(event) {
    if (!active || event.pointerId !== active.id) return;
    active = null; mode.disabled = false; carryX = carryY = 0; knob.style.transform = ''; announce(state());
  }
  stick.addEventListener('pointerup', finish); stick.addEventListener('pointercancel', finish); stick.addEventListener('lostpointercapture', finish);
  stick.addEventListener('keydown', function (event) {
    var delta = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
    if (!delta) return;
    event.preventDefault(); event.stopPropagation(); camera(delta[0], delta[1]); announce(state());
  });
  refreshMode();
})(typeof window !== 'undefined' ? window : globalThis);
