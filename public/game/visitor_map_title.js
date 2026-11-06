(function (root) {
  'use strict';
  var doc = root.document, visit = doc && doc.getElementById('visitor-play'), surface = doc && doc.getElementById('surface'), heading = doc && doc.getElementById('map-h');
  if (!visit || !surface || !heading) { return; }
  var name = null;
  function update() {
    var view = root.AtlasOpenworldView && root.AtlasOpenworldView(), controls = view && view.controls;
    var p = controls && controls.walker ? controls.walker() : null;
    var place = p && Number.isFinite(p.q) && Number.isFinite(p.r) ? 'Location · ' + p.q + ', ' + p.r : 'Location · NO_DATA: visitor position unavailable';
    heading.textContent = (name ? name + ' · ' : '') + place;
  }
  visit.addEventListener('visitor:render', function (event) {
    try { name = event.detail && event.detail.account ? event.detail.account.info().name : null; }
    catch (_) { name = null; }
    update();
  });
  visit.addEventListener('visitor:end', function () { name = null; update(); });
  surface.addEventListener('visitor:draw', update);
  update();
})(globalThis);
