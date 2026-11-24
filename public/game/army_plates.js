// Army · three plates (Sovereign 2026-11-23, Codex coordination 2026-11-24: «Army is harmonic warfare; Quests live in
// Echoes»). Plate 1, the summoning window, is the visit's own call (visitor_play.js «House · summons», already here).
// This file recovers the two other pieces that lived on the retired /play/ page, unchanged:
//   plate 2 · Workshop — the Workshop sands one stat of one wave by a signed receipt chain (workshop.js, ui-workshop.js).
//             The visit's key signs invocations only, so the plate says it: NO_DATA(workshop_chain_not_on_visit). Each
//             wave's levels and costs are shown, honestly empty, inside its card.
//   plate 3 · Waves — the visit's army as a list: each wave drawn by its own harmonics (wave_render.js), its rarity and
//             life; a press opens the wave's existing card (army-wave-panel.js: maths, origin, stats, honest odds).
// Adapter only: army-wave-panel.js reads AtlasIncubadora.army(); when no older army exists, the visit's troops are
// offered under that name (state_vector.js then counts this visit's army). Eye: the drawing; ear: each row's words;
// machine: data-seed / data-tc on every row. Reduced motion: the drawings are still frames already.
(function (root) {
  'use strict';
  var doc = root.document, troops = [], ownIncubator = false;
  // rows(troops) → [{ seed, tc, rarity, life, label }] — pure; tested in army_plates_cases.
  function rows(list) {
    return (Array.isArray(list) ? list : []).map(function (x) { return x && x.adopcion && x.adopcion.tropa; }).filter(function (t) { return t && typeof t.semilla === 'string'; })
      .map(function (t) { var life = t.stats && Number.isFinite(t.stats.vida) ? t.stats.vida : null;
        return { seed: t.semilla, tc: t.tc, rarity: t.rareza || 'NO_DATA', life: life, label: 'Wave ' + (t.base || '?') + ' · ' + (t.rareza || 'NO_DATA') + ' · ' + t.tc + ' · life ' + (life === null ? 'NO_DATA' : life) }; });
  }
  function tropa(seed) { for (var i = 0; i < troops.length; i++) { var t = troops[i] && troops[i].adopcion && troops[i].adopcion.tropa; if (t && t.semilla === seed) { return t; } } return null; }
  function draw(t, size) {
    var O = root.AtlasOnda, cv = doc.createElement('canvas'), d = Math.min(2, root.devicePixelRatio || 1); cv.width = cv.height = Math.round(size * d);
    cv.style.width = cv.style.height = size + 'px'; cv.setAttribute('aria-hidden', 'true');
    if (O && O.dibuja && O.tono && Array.isArray(t.armonicos)) {
      O.dibuja(cv.getContext('2d'), t.armonicos, cv.width / 2, cv.height / 2, cv.width * 0.34, { t: 0, crece: 1, giro: 0, color: O.tono(t), grosor: 2 * d, brillo: 0.9, estela: 0, respira: false, calidad: 2,
        face: true, eye: O.eyeKind ? O.eyeKind(t) : 0, eyes: O.eyeCount ? O.eyeCount(t) : 2, eyeSeed: O.eyeSeed ? O.eyeSeed(t) : 0, desafina: 0 });
    }
    return cv;
  }
  function ficha(t, size) { return draw(t, size || 168); }
  ficha.nombre = function (t) { return 'Wave ' + (t.base || '?'); };
  function need(src, test, done) {
    if (test()) { done(); return; }
    var s = doc.createElement('script'); s.src = src; s.onload = done; s.onerror = done; doc.head.appendChild(s);
  }
  function open(seed, say) {
    if (!doc.getElementById('face-canon-css')) { var l = doc.createElement('link'); l.id = 'face-canon-css'; l.rel = 'stylesheet'; l.href = '/game/face_canon.css'; doc.head.appendChild(l); }
    need('/game/army-wave-panel.js', function () { return !!root.AtlasArmyWavePanel; }, function () {
      var P = root.AtlasArmyWavePanel, t = tropa(seed);
      if (!P || !t || !P.abre(t, ficha)) { say.textContent = 'NO_DATA · the wave card did not open (' + (P ? 'wave not in this visit' : 'piece_not_loaded') + ')'; }
    });
  }
  function plate(id, title) {
    var s = doc.getElementById(id) || doc.createElement('section'); s.id = id; s.className = 'ap-plate'; s.setAttribute('aria-labelledby', id + '-h'); s.replaceChildren();
    var h = doc.createElement('h3'); h.id = id + '-h'; h.textContent = title; s.appendChild(h); return s;
  }
  function render() {
    var li = doc.querySelector('#voices [data-speaker="Army"]'); if (!li) { return; }
    var shop = plate('ap-workshop', 'Workshop · sand one stat of one wave'), p = doc.createElement('p');
    p.textContent = 'The Workshop signs a receipt chain for every sanding. This visit\'s key signs invocations only: Workshop NO_DATA(workshop_chain_not_on_visit). Open a wave to see its levels and costs.';
    p.dataset.state = 'NO_DATA'; shop.appendChild(p);
    var waves = plate('ap-waves', 'Waves · your army'), R = rows(troops), say = doc.createElement('p'); say.setAttribute('role', 'status'); say.className = 'ap-say';
    if (!R.length) { var e = doc.createElement('p'); e.textContent = 'No wave yet · summon one in the call above, it hatches into this list.'; waves.appendChild(e); }
    else {
      var ol = doc.createElement('ol'); ol.className = 'ap-list';
      R.forEach(function (r) {
        var item = doc.createElement('li'), b = doc.createElement('button'), t = tropa(r.seed), w = doc.createElement('span');
        b.type = 'button'; b.className = 'ap-wave'; b.dataset.seed = r.seed.slice(0, 16); b.dataset.tc = r.tc; b.setAttribute('aria-label', r.label + '. Open its card.');
        w.textContent = r.label; b.append(draw(t, 52), w); b.addEventListener('click', function () { open(r.seed, say); }); item.appendChild(b); ol.appendChild(item);
      });
      waves.appendChild(ol);
    }
    waves.appendChild(say);
    if (shop.parentNode !== li) { li.appendChild(shop); } if (waves.parentNode !== li) { li.appendChild(waves); }
  }
  if (doc) {
    if (!root.AtlasIncubadora) { ownIncubator = true; root.AtlasIncubadora = { army: function () { return troops.slice(); }, visit: true }; }
    var box = doc.getElementById('visitor-play');
    if (box) { box.addEventListener('visitor:render', function (e) { troops = (e.detail && e.detail.state && e.detail.state.troops) || []; render(); }); box.addEventListener('visitor:end', function () { troops = []; render(); }); }
    if (!doc.getElementById('ap-css')) { var c = doc.createElement('link'); c.id = 'ap-css'; c.rel = 'stylesheet'; c.href = '/game/army_plates.css'; doc.head.appendChild(c); }
    render();
  }
  var api = { rows: rows, own: function () { return ownIncubator; } };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasArmyPlates = api;
})(typeof window !== 'undefined' ? window : globalThis);
