(function (raiz) {
  'use strict';

  var MAR = 'mar-abierto';
    function reglas(id, cedulas) {
    if (id === MAR) {
      return { id: MAR, titulo: 'Open sea', admin: null,
               puedes: ['play and fight the NPC patrols', 'propose'], no_puedes: ['settle: no node has accepted you'],
               sello: 'local' };
    }
    var c = ((cedulas && cedulas.nodos) || []).filter(function (n) { return n.nodo === id; })[0];
    if (!c) { return null; }
        var LLANO = { EMULADO: 'emulated', NO_DATA: 'not measured' };
    var med = Object.keys(c.aparato.medidas).map(function (k) { var m = c.aparato.medidas[k]; return k + ': ' + (m.estado === 'MEDIDO' ? m.valor : (LLANO[m.estado] || 'not measured')); });
    var vinculados = (c.dispositivos || []).filter(function (d) { return d.estado === 'linkeado'; }).length;
    return { id: id, titulo: id, admin: c.admin || null,
             puedes: ['play and fight the NPC patrols', 'propose to this node'],
             no_puedes: [c.admin ? 'settle until its admin accepts you (two signatures)' : 'settle: this node has no admin yet, nobody can accept you'],
             medidas: med, vinculados: vinculados, sello: c.firma ? 'signed card' : 'unsigned card (not verified)' };
  }
  function territorios(cedulas) {
    return [MAR].concat(((cedulas && cedulas.nodos) || []).map(function (n) { return n.nodo; }));
  }

  function el(tag, clase, texto) { var n = raiz.document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }
    function monta(panel) {
    if (!panel || panel.querySelector('.entrada-cangrejo')) { return; }
    var Y = raiz.AtlasArmy, caja = Y && Y.cajaWeb ? Y.cajaWeb('atlas-entrada', 'entrada', 'territorio') : null;
    var C = raiz.AtlasNodosCedulas, raizEl = el('section', 'entrada-cangrejo');
    raizEl.setAttribute('aria-label', 'Where you play');
    panel.insertBefore(raizEl, panel.firstChild);
    function ficha(id) {
      raizEl.textContent = '';
      var r = reglas(id, C);
      if (!r) { tarjeta(); return; }
      var p = el('p', 'entrada-ficha');
      p.appendChild(el('b', null, 'You play in: ' + r.titulo));
      p.appendChild(raiz.document.createTextNode(' · ' + r.sello + ' · you cannot ' + r.no_puedes[0] + '. '));
      var b = el('button', 'boton-sec entrada-cambia', 'Change'); b.type = 'button';
      b.addEventListener('click', function () { if (caja) { caja.pon(null); } tarjeta(); });
      p.appendChild(b);
      raizEl.appendChild(p);
    }
    function tarjeta() {
      raizEl.textContent = '';
      raizEl.appendChild(el('h3', null, 'Enter as a crab: choose where you play'));
      raizEl.appendChild(el('p', 'atlas-nota', 'Every territory shows its rules before you enter. Choosing gives you no advantage in battle.'));
      var lista = el('ul', 'entrada-lista');
      territorios(C).forEach(function (id) {
        var r = reglas(id, C), li = el('li', 'entrada-territorio');
        li.appendChild(el('h4', null, r.titulo + ' · ' + r.sello));
        li.appendChild(el('p', null, 'You can: ' + r.puedes.join(', ') + '.'));
        li.appendChild(el('p', null, 'You cannot: ' + r.no_puedes.join(', ') + '.'));
        if (r.medidas) { li.appendChild(el('p', 'atlas-nota', 'Measured: ' + r.medidas.join(' · ') + ' · linked devices: ' + r.vinculados)); }
        var b = el('button', 'boton', 'Enter ' + (id === MAR ? 'the open sea' : 'this node')); b.type = 'button';
        b.addEventListener('click', function () { if (caja) { caja.pon(id); } ficha(id); });
        li.appendChild(b);
        lista.appendChild(li);
      });
      raizEl.appendChild(lista);
    }
    if (caja) { caja.lee().then(function (v) { if (v && reglas(v, C)) { ficha(v); } else { tarjeta(); } }); } else { tarjeta(); }
  }

  var AtlasEntrada = { MAR: MAR, reglas: reglas, territorios: territorios, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasEntrada; }
  else { raiz.AtlasEntrada = AtlasEntrada; }
})(this);
