/* Q3 · Base access reuses the live summon buttons and exact rules from the existing Army. */
(function (root) {
  'use strict';
  function modelo(V, G) {
    if (!V || !G || !V.combate || !G.TCS) { return { causa: 'NO_DATA (summon rules are unavailable)' }; }
    return { limiteEquipo: Number.isSafeInteger(V.combate.tropas_max) ? V.combate.tropas_max : null,
      opciones: Object.keys(G.TCS).map(function (tc) {
        var c = G.TCS[tc].coste;
        return { tc: tc, cobre: Number.isSafeInteger(c.cobre) ? c.cobre : null, luz: Number.isSafeInteger(c.luz) ? c.luz : null };
      }) };
  }
  function monta() {
    var d = root.document, V = root.AtlasValores, G = root.AtlasGacha;
    if (!d || d.getElementById('summon-access')) { return false; }
    var target = d.getElementById('casa-estado'), controls = d.querySelector('.atlas-incubadora .atlas-inc-mandos');
    if (!target || !controls) { return false; }
    var M = modelo(V, G); if (M.causa) { return false; }
    var card = d.createElement('section'); card.id = 'summon-access'; card.className = 'summon-access';
    var header = d.createElement('header'), symbol = d.createElement('span'); symbol.className = 'summon-access-symbol'; symbol.setAttribute('aria-hidden', 'true'); symbol.textContent = '∿';
    var title = d.createElement('h2'); title.textContent = 'Summon a wave'; header.appendChild(symbol); header.appendChild(title); card.appendChild(header);
    var cap = d.createElement('p'); cap.className = 'summon-access-cap';
    cap.textContent = M.limiteEquipo === null ? 'NO_DATA (team limit is not declared in measured combat rules)' : 'Team limit: ' + M.limiteEquipo + ' waves'; card.appendChild(cap);
    var list = d.createElement('div'); list.className = 'summon-access-options';
    M.opciones.forEach(function (o) {
      var original = controls.querySelector('#invoca-' + o.tc); if (!original) { return; }
      var row = d.createElement('div'); row.className = 'summon-access-row';
      var cost = d.createElement('p'); cost.className = 'summon-access-cost';
      cost.textContent = o.cobre === null || o.luz === null ? 'NO_DATA (summon cost is not declared)' : 'Cost: ' + o.cobre + ' copper · ' + o.luz + ' light';
      original.classList.add('summon-access-button');
      original.setAttribute('aria-label', original.textContent.trim() + ' · ' + cost.textContent + ' · ' + cap.textContent);
      row.appendChild(original); row.appendChild(cost); list.appendChild(row);
    });
    card.appendChild(list); target.insertBefore(card, target.firstChild);
    return true;
  }
  var API = { modelo: modelo, monta: monta, destino: '#casa-estado', simbolo: '∿' };
  if (typeof module === 'object' && module.exports) { module.exports = API; }
  else {
    root.AtlasSummonAccess = API;
    if (!monta() && root.MutationObserver && root.document) {
      var panel = root.document.getElementById('thegame-estado');
      if (panel) {
        var observer = new root.MutationObserver(function () { if (monta()) { observer.disconnect(); } });
        observer.observe(panel, { childList: true, subtree: true });
      }
    }
  }
})(typeof window === 'object' ? window : globalThis);
