
(function (root) {
  'use strict';
  var data = null, words = null, cause = 'the same-origin dictionary has not loaded';
  var COLORS = { A: 0, B: 1, C: 2, D: 3 }, LINES = { double: 0, dotted: 1, spiral: 2, star6: 3 };
  function load(path) {
    return fetch(path, { cache: 'force-cache', credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) { throw new Error(path + ' returned ' + r.status); }
      return r.json();
    });
  }
  var ready = (typeof fetch === 'function' ? Promise.all([load('/dictionary.json'), load('/dictionary-en.json')]) : Promise.reject(new Error('fetch unavailable')))
    .then(function (r) { data = r[0]; words = r[1].entries; cause = ''; return api.state(); })
    .catch(function (e) { cause = 'dictionary data unavailable from this same-origin release'; return { estado: 'NO_DATA', causa: cause }; });
  function state() {
    if (!data || !words) { return { estado: 'NO_DATA', causa: cause }; }
    return { estado: 'MEDIDO', entradas: data.entries.length, retenidas: data.withheld_ids.length, total: data.total_status,
      movimiento: data.movement_cause, cause: null };
  }
  function entry(id) { return data && data.entries.find(function (e) { return e.id_interno === id; }) || null; }
  function list(host) {
    var D = root.document, heading = D.createElement('h3'), note = D.createElement('p'), buttons = D.createElement('div');
    heading.textContent = 'Vocabulary crystals'; heading.id = 'hexelion-dictionary-title';
    note.className = 'no-data';
    note.textContent = data.entries.length + ' public entries · two held for safe naming. Final total: NO_DATA (the earlier table is unavailable for comparison).';
    buttons.className = 'hexelion-crystals';
    data.entries.forEach(function (e) {
      var b = D.createElement('button'); b.type = 'button'; b.className = 'boton-sec hexelion-crystal';
      b.textContent = e.nombre_juego; b.dataset.id = e.id_interno;
      b.addEventListener('click', function () { show(host, e); }); buttons.appendChild(b);
    });
    host.appendChild(heading); host.appendChild(note); host.appendChild(buttons);
    var detail = D.createElement('section'); detail.className = 'hexelion-crystal-detail'; detail.id = 'hexelion-crystal-detail';
    host.appendChild(detail);
    show(host, data.entries[0]);
  }
  function show(host, e) {
    var D = root.document, detail = host.querySelector('.hexelion-crystal-detail');
    if (!detail || !e) { return; }
    detail.textContent = '';
    var title = D.createElement('h4'), standard = D.createElement('p'), plain = D.createElement('p');
    title.textContent = e.nombre_juego; standard.textContent = e.estandar_humano;
    plain.textContent = words[e.id_interno] || 'NO_DATA (plain-language explanation is missing from the English file)';
    detail.appendChild(title); detail.appendChild(standard); detail.appendChild(plain);
    var group = data.destination_groups[e.id_interno.charAt(0)], dest = D.createElement('p');
    dest.textContent = 'Destination group · ' + group + ' · transport is not active in this piece.'; detail.appendChild(dest);
    var slot = D.createElement('div'); slot.className = 'semiotic-slot'; detail.appendChild(slot);
    if (root.AtlasGlyph) { root.AtlasGlyph.monta(slot, e.glyph, plain.textContent); }
  }
  function monta(panel) {
    var D = root.document, old = panel.querySelector('.hexelion-vocabulary');
    if (old) { old.remove(); }
    var host = D.createElement('section'); host.className = 'hexelion-vocabulary'; host.setAttribute('aria-labelledby', 'hexelion-dictionary-title');
    panel.appendChild(host);
    ready.then(function (r) {
      if (!data || !words) { var n = D.createElement('p'); n.className = 'no-data'; n.textContent = 'NO_DATA (' + r.causa + ')'; host.appendChild(n); return; }
      list(host);
    });
    return ready;
  }
  function estrella(g, p, dpr) {
    var r = 13 * dpr; g.save(); g.beginPath();
    for (var i = 0; i < 12; i++) { var a = -Math.PI / 2 + i * Math.PI / 6, q = i % 2 ? r * 0.46 : r;
      var x = p[0] + Math.cos(a) * q, y = p[1] + Math.sin(a) * q; if (!i) { g.moveTo(x, y); } else { g.lineTo(x, y); } }
    g.closePath(); g.fillStyle = '#E6A817'; g.strokeStyle = '#00D2FF'; g.lineWidth = 2 * dpr; g.fill(); g.stroke();
    g.beginPath(); g.arc(p[0], p[1], r + 4 * dpr, 0, Math.PI * 2); g.lineWidth = 1.5 * dpr; g.stroke(); g.restore();
  }
  function pinta(g, P, o) {
    var N = root.AtlasMapNodes, nodes = N && N.casas ? N.casas() : [], node = nodes.find(function (n) { return n.nodo === 'nodo.0.hexelion'; });
    if (!node || !o.pon) { return false; }
    var x = node.x + 110, y = node.y + 90, dpr = o.dpr || 1, t = o.texto || function (k) { return k; };
    o.pon(x, y, function () { estrella(g, P(x, y), dpr); g.fillStyle = '#F2F6FA'; g.textAlign = 'center'; g.font = 'bold ' + (10 * dpr) + 'px sans-serif';
      g.fillText('HEXELION STAR', P(x, y)[0], P(x, y)[1] + 26 * dpr); g.textAlign = 'start';
    }, function () { var s = state(); return { kind: 'hexelion-star', que: 'HEXELION Star', estado: s.estado === 'MEDIDO' ? s.entradas + ' public entries · final total NO_DATA' : 'NO_DATA (' + s.causa + ')',
      sonido: 'NO_DATA (the earlier catalogue table is unavailable for comparison)', glyph: [4, 2, 3, 1],
      explanation: 'A shared star holds public vocabulary crystals. Select one to read its simple explanation.',
      causas: [s.total || s.causa, s.movimiento].filter(Boolean), actions: [], actionCause: 'The catalogue can be read; transport and rewards are not active in this piece.' }; });
    return true;
  }
  var api = { ready: ready, state: state, entry: entry, monta: monta, pinta: pinta, color: COLORS, line: LINES };
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.AtlasHexelionDictionary = api; }
})(typeof window !== 'undefined' ? window : globalThis);
