// AtlasHoldingsView · the «Buildings owned» panel. Global AtlasHoldingsView.
// render(doc, api, step) builds a section from the holdings API (see holdings_wasm.js) and returns it.
// mount(doc, api, step) places it at the end of the Army voice (data-speaker Army) inside #voices, or of #voices itself, and replaces an old one.
// Every number comes from the ledger. A heal that cannot be paid is disabled, and its button says why.
(function (root) {
  'use strict';
  var KINDS = ['workshop', 'lottery', 'customs', 'hostel', 'tower', 'choir', 'agora', 'doctor', 'coliseum', 'visitor-house'];
  var FULL = 1000, HEAL_PERCENT = 10, HEAL_BIOMASS = 5;

  function el(doc, tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) { n.setAttribute('class', cls); }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // A kind may come as an index (0..9) from the ledger or as a name; anything else is shown as it is.
  function kindName(k) { return typeof k === 'number' ? (KINDS[k] || 'unknown kind') : String(k); }

  // card(): one building. The heal button is disabled with the cause as its text; a click heals once and redraws.
  function card(doc, api, step, h, bal, sec) {
    var li = el(doc, 'li', 'holdings-item'), cost = api.healCost(h.life);
    var cause = h.life >= FULL ? 'Full life'
      : bal.copper < cost ? 'Not enough copper'
      : bal.biomass < HEAL_BIOMASS ? 'Not enough biomass' : '';
    var m = el(doc, 'meter');
    m.setAttribute('min', '0'); m.setAttribute('max', String(FULL)); m.setAttribute('value', String(h.life));
    m.setAttribute('aria-label', 'Life ' + Math.round(h.life / 10) + ' %');
    var btn = el(doc, 'button', 'holdings-heal', cause || 'Heal ' + HEAL_PERCENT + ' % · ' + cost + ' copper + ' + HEAL_BIOMASS + ' biomass');
    btn.setAttribute('type', 'button');
    btn.disabled = cause !== '';
    btn.addEventListener('click', function () {
      if (btn.disabled) { return; }
      api.heal(step, h.id);
      var next = render(doc, api, step);
      if (sec.parentNode) { sec.parentNode.replaceChild(next, sec); }
    });
    li.appendChild(el(doc, 'p', 'holdings-name', cap(kindName(h.kind))));
    li.appendChild(el(doc, 'p', 'holdings-garrison', 'garrison: ' + h.waves + ' waves'));
    li.appendChild(m);
    li.appendChild(btn);
    return li;
  }

  function render(doc, api, step) {
    var sec = el(doc, 'section', 'holdings');
    sec.setAttribute('id', 'holdings');
    sec.setAttribute('aria-labelledby', 'holdings-title');
    var title = el(doc, 'h3', null, 'Buildings owned');
    title.setAttribute('id', 'holdings-title');
    sec.appendChild(title);
    if (api && api.estado === 'NO_DATA') {
      sec.appendChild(el(doc, 'p', 'holdings-state', 'Buildings owned: NO_DATA · ' + api.causa));
      return sec;
    }
    var bal = api.balances(), list = api.holdings();
    sec.appendChild(el(doc, 'p', 'holdings-res', 'Copper ' + bal.copper + ' · Light ' + bal.light + ' · Biomass ' + bal.biomass + ' · Oxygen ' + bal.oxygen));
    if (list.length) {
      var ul = el(doc, 'ul', 'holdings-list');
      list.forEach(function (h) { ul.appendChild(card(doc, api, step, h, bal, sec)); });
      sec.appendChild(ul);
    } else {
      sec.appendChild(el(doc, 'p', 'holdings-empty', 'No buildings yet: win a fight at a grey building to hold it.'));
    }
    sec.appendChild(el(doc, 'p', 'holdings-army', 'Army at home: ' + api.army() + ' waves'));
    return sec;
  }

  function mount(doc, api, step) {
    var voices = doc.getElementById('voices');
    if (!voices) { return null; }
    var sec = render(doc, api, step), old = doc.getElementById('holdings');
    if (old && old.parentNode) { old.parentNode.replaceChild(sec, old); return sec; }
    (voices.querySelector('li[data-speaker="Army"]') || voices).appendChild(sec);
    return sec;
  }

  var api = { KINDS: KINDS, render: render, mount: mount };
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  root.AtlasHoldingsView = api;
})(typeof window !== 'undefined' ? window : globalThis);
