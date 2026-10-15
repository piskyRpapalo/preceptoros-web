/* HEXELION STAR · one static, English-first catalogue. The entries below are public references from
   the Soberano's signed 2026-10-15 annex; this module requests only the two same-origin JSON files.
   REF_ABIERTA index (machine-readable anchors also live in /dictionary.json and llms.txt):
   A1 W3C-CSP-Level3 / NIST-SP-800-207 / Wikidata:Q104889869; A2 ECMA-262-ESModules / SLSA-Level-3;
   A3 ISBN:978-1491986363 / ISO-25010; A4 W3C-ServiceWorkers-1 / NDN-Content-Addressed-Storage;
   A5 InkAndSwitch-LocalFirst-7Ideals / Chaos-Engineering-Principles; A6 Reproducible-Builds-Spec / Pure-Functional-Pipeline;
   A7 IEEE-1516-HLA-Lockstep / Lamport-State-Machine-Replication; A8 ETSI-MEC-003 / NIST-SP-500-325-Fog;
   A9 JEDEC-LPDDR5X-JESD209-5B / HSA-SysArch; A10 W3C-WebAssembly-Core / WASI-Object-Capability;
   A11 IETF-RFC-6455 / POSIX-IPC-Loopback; A12 IEEE-829-Test-Stubs / Deterministic-HIL-Simulation.
   B13 IETF-RFC-8032 / NIST-SP-800-63B; B14 NIST-SP-800-53-SC-7 / OWASP-ASVS-Data-Classification;
   B15 ISO-IEC-20889 / HIPAA-Safe-Harbor-164.514; B16 W3C-DID-Core-1.0 / IETF-RFC-7517;
   B17 IETF-RFC-9334-RATS / GlobalPlatform-TEE; B18 IETF-RFC-9381-ECVRF / Deterministic-Signature-Seeded-PRNG;
   B19 IETF-RFC-9421 / detached-Ed25519-payload. B20-B21 are withheld from public data.
   C22 Licklider-1960-Man-Computer-Symbiosis / Kasparov-Advanced-Chess;
   C23 UNESCO-AI-Competency-Framework / Vygotsky-ZPD; C24 Kleene-Three-Valued-Logic / Explicit-Epistemic-Uncertainty;
   C25 arXiv:2305.14325 / Constitutional-AI; C26 Popperian-Falsifiability / ML-Ablation-Methodology;
   C27 Shadow-Mode-Deployment / Interleaved-Preference-Testing;
   C28 Progressive-Disclosure-HCI / Self-Contained-Zero-Install-Runtime; C29 ISO-17100 / Structural-String-Parity-Verification;
   C30 permacomputing.net-Principles / SCI-ISO-IEC-21031; C31 arXiv:2106.09685;
   C32 W3C-WCAG-2.1-Contrast / Peirce-Triadic-Semiotics.
   D33 EUR-Lex-CELEX:32024R1689-Art14; D34 EUR-Lex-CELEX:32024R1689-Art13;
   D35 EUR-Lex-CELEX:32024R1689-Art12; D36 EUR-Lex-CELEX:32024R1689-Art15;
   D37 EUR-Lex-CELEX:32024R1689-Art10; D38 EUR-Lex-CELEX:32024R1689-Art4;
   D39 EUR-Lex-CELEX:32023R2854; D40 EUR-Lex-CELEX:32024R2847; D41 EUR-Lex-CELEX:32022R2554;
   D42 ISO-IEC-42001:2023; D43 ISO-IEC-27001:2022; D44 EUR-Lex-CELEX:32016R0679-Art25;
   D45 IEEE-Std-7001-2021 / IEEE-P7003.
   No network lookups, storage, wall clock, random choice, or capture/reward are part of this piece. */
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
    detail.setAttribute('aria-live', 'polite'); host.appendChild(detail);
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
