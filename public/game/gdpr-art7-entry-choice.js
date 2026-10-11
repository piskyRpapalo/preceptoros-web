/* preceptoros.org · theGame · LA ENTRADA: elegir zona o nodo, y ver sus reglas antes de jugar (J8).

   FIRMADO como base de diseno (joya de PLAN_THEGAME_ESTRUCTURA, 2026-10-11): todos juegan como
   cangrejos; al entrar se elige el MAR ABIERTO (una zona sin nodo) o un NODO, y al elegirlo se acatan
   sus reglas, que se VEN antes (texto, no solo color). «Sin aceptacion, un visitante puede proponer,
   pero no asentar» (ideas6oct:1357): elegir un nodo no te da nada de el; te dice que reglas rigen.

   LAS REGLAS SALEN DE LO MEDIDO, no se escriben a mano: el admin, los dispositivos y lo que cada nodo
   midio vienen de las cedulas (`AtlasNodosCedulas`). Sin admin, nadie puede aceptarte: se dice. Una
   cifra sin medir no entra como numero: NO_DATA (ley de nodos.js).

   SIN VENTAJA (sabotaje en atlas/test_atlas.py): la eleccion no toca el motor ni el combate; solo
   colorea la casa y dice donde estas. Se guarda en ESTE aparato por db.js (la unica puerta). Elegir es
   un gesto (GDPR art. 7: consentimiento explicito); cambiar de opinion, un boton. */
(function (raiz) {
  'use strict';

  var MAR = 'mar-abierto';
  /* Las reglas de un territorio, en texto llano: lo que puedes hacer y lo que no. Pura. */
  function reglas(id, cedulas) {
    if (id === MAR) {
      return { id: MAR, titulo: 'Open sea', admin: null,
               puedes: ['play and fight the NPC patrols', 'propose'], no_puedes: ['settle: no node has accepted you'],
               sello: 'local' };
    }
    var c = ((cedulas && cedulas.nodos) || []).filter(function (n) { return n.nodo === id; })[0];
    if (!c) { return null; }
    /* El sello en palabras llanas para quien llega (MEDIDO -> la cifra; EMULADO -> emulated; NO_DATA ->
       not measured): el mismo dato, sin jerga en la primera visita. Una cifra sin medir no es un numero. */
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
  /* Monta la tarjeta de entrada (si no hay eleccion) o la ficha de donde estas, al principio del panel. */
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
