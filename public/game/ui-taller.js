/* preceptoros.org · theGame · EL POLVO DE TALLER en pantalla (P9, firmado el 2026-10-11).

   La puerta es `AtlasTallerUI.monta(zona)`, en la pestana TALLER. Las reglas viven en `taller.js` (puro); aqui
   solo se pintan, se pide la FIRMA de la persona y se guarda la cadena por `db.js` (cajaWeb, la unica puerta
   de almacenamiento del juego).

   VALOR VISIBLE ANTES DE DESTRUIR: cada onda dice cuantos gramos daria. DESINTEGRAR saca la tropa del Army
   solo con su recibo firmado (`AtlasIncubadora.retira`); LIJAR sube un stat y cuesta mas en cada nivel. La
   cadena guardada se COMPRUEBA al volver (enlaces, cuentas y firmas): si un eslabon falla, se dice cual y el
   Taller no opera sobre una cadena rota. Sin red, sin azar, sin reloj. */
(function () {
  'use strict';
  var TL = window.AtlasTaller, A = window.AtlasArmy, V = window.AtlasValores, G = window.AtlasGacha;
  var R = {}, cadena = [], est = null, roto = '', caja = null;

  function T(k, d) { var C = window.AtlasCasa, J = window.AtlasJuego, t = (C && C.texto && C.texto(k)) || (J && J.texto(k)); return t && t !== k ? t : d; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function boton(texto, clase) { var b = el('button', clase || 'boton-sec', texto); b.type = 'button'; return b; }
  function dice(t) { R.estado.textContent = t; }
  function army() { var I = window.AtlasIncubadora; return (I && I.army && I.army()) || []; }

  /* Firma de la persona sobre el recibo tal cual (la cadena compara el JSON exacto). */
  function firma(rec) {
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) { return Promise.reject(new Error(T('taller_sin_id', 'Create your key first (top of the page): every Workshop act is signed.'))); }
    return I.firmar(rec).then(function (f) { return f.firma; });
  }
  function clave() { var I = window.Identity; return I && I.quien && I.quien() ? I.publica() : Promise.reject(new Error('sin identidad')); }

  function guarda() { if (caja) { caja.pon(cadena); } }
  function opera(op, despues) {
    if (roto) { dice('NO_DATA · ' + roto); return; }
    clave().then(function (k) {
      var rec = TL.recibo(est, op, k);
      return firma(rec).then(function (f) { return despues(rec, f); });
    }).catch(function (e) { dice(String((e && e.message) || e)); });
  }
  function desintegra(t) {
    opera({ op: 'desintegra', tropa: t }, function (rec, f) {
      return window.AtlasIncubadora.retira(rec, f).then(function () {
        cadena.push({ recibo: rec, firma: f }); est = TL.estado(cadena); guarda();
        if (window.AtlasArrecife && window.AtlasArrecife.entierraTropa) { window.AtlasArrecife.entierraTropa(rec); }  /* amor 4: su lapida */
        dice(T('taller_hecho_d', 'Dissolved: +{g} g of static residue.').replace('{g}', rec.gramos)); pinta();
      });
    });
  }
  /* P10 · tenir una onda al color de TU bandera (la de «Customize»). */
  function tine(t, b) {
    opera({ op: 'tinte', semilla: t.semilla, bandera: b }, function (rec, f) {
      cadena.push({ recibo: rec, firma: f }); est = TL.estado(cadena); guarda();
      dice(T('taller_hecho_t', 'Tinted to your flag.')); pinta();
      var I = window.AtlasIncubadora; if (I && I.repinta) { I.repinta(); }
      return Promise.resolve();
    });
  }
  function bandera() { var C = window.AtlasCasa, c = C && C.casa ? C.casa() : null; return c && c.bandera; }
  function lija(t, stat) {
    opera({ op: 'lija', semilla: t.semilla, stat: stat }, function (rec, f) {
      cadena.push({ recibo: rec, firma: f }); est = TL.estado(cadena); guarda();
      dice(T('taller_hecho_l', 'Sanded: {s} to level {n}. The edges stay the same.').replace('{s}', stat).replace('{n}', rec.nivel)); pinta();
      return Promise.resolve();
    });
  }

  function pinta() {
    if (!R.lista) { return; }
    R.saldo.textContent = T('taller_saldo', 'Static residue: {g} g').replace('{g}', est ? est.saldo : 'NO_DATA');
    R.lista.textContent = '';
    var L = V.taller.lija, us = army();
    if (!us.length) { R.lista.appendChild(el('li', 'atlas-nota', T('army_vacio', 'Your Army is empty.'))); }
    us.forEach(function (u) {
      var t = u.adopcion.tropa, li = el('li', 'taller-fila'), lj = (est && est.lijas[t.semilla]) || {};
      li.appendChild(el('b', null, (t.aristas || G.aristas(t)) + ' ' + T('taller_aristas', 'edges') + ' · ' + T('rar_' + t.rareza, t.rareza)));
      var d = boton(T('taller_desintegra', 'Dissolve · +{g} g').replace('{g}', TL.residuo(t)));
      d.addEventListener('click', function () { desintegra(t); });
      li.appendChild(d);
      var s = el('select'); s.setAttribute('aria-label', T('taller_stat', 'stat to sand'));
      L.stats.forEach(function (k) { s.appendChild(el('option', null, k + ' ' + (t.stats[k] + (lj[k] || 0) * L.paso))).value = k; });
      var b = boton('');
      function rotula() {
        var nv = (lj[s.value] || 0) + 1;
        b.textContent = nv > L.max ? T('taller_tope', 'Max level') : T('taller_lija', 'Sand to level {n} · −{c} g').replace('{n}', nv).replace('{c}', TL.coste(nv));
        b.disabled = !est || !!roto || nv > L.max || est.saldo < TL.coste(nv);
      }
      s.addEventListener('change', rotula); b.addEventListener('click', function () { lija(t, s.value); });
      rotula(); li.appendChild(s); li.appendChild(b);
      var bd = bandera(), tb = boton(bd ? T('taller_tinte', 'Tint to my flag · −{c} g').replace('{c}', V.taller.tinte.coste) : T('taller_sin_bandera', 'Pick a flag in Customize to tint'));
      tb.disabled = !bd || !est || !!roto || (est.tintes[t.semilla] === bd) || est.saldo < V.taller.tinte.coste;
      tb.addEventListener('click', function () { tine(t, bd); });
      li.appendChild(tb); R.lista.appendChild(li);
    });
    R.cola.textContent = est && est.n ? '#' + est.ultimo.slice(0, 8) + '… · ' + est.n + ' ' + T('taller_eslabones', 'receipts') : T('taller_vacia', 'No receipts yet.');
  }

  function monta(zona) {
    if (!zona || zona.querySelector('.taller-polvo') || !TL || !A || !A.cajaWeb) { return; }
    var s = el('section', 'taller-polvo');
    s.appendChild(el('h5', null, T('taller_h', 'Workshop dust')));
    s.appendChild(el('p', 'atlas-nota', T('taller_nota', 'Dissolving a wave gives static residue: 1 g per edge, three times as much for a Leviathan. Sanding raises one stat and costs more at each level; it never adds edges (that is a new summon). Nothing is bought. Sanded stats count in practice against the NPC places; in duels between people they do not count yet.')));
    R.saldo = el('p', 'atlas-medido'); s.appendChild(R.saldo);
    R.lista = el('ul', 'taller-lista'); s.appendChild(R.lista);
    R.estado = el('p', 'atlas-vivo'); R.estado.setAttribute('role', 'status'); s.appendChild(R.estado);
    var d = el('details', 'thegame-tecnico'); d.appendChild(el('summary', null, T('taller_cadena', 'Receipt chain (atlas.taller/1)')));
    R.cola = el('p', 'atlas-medido'); d.appendChild(R.cola); s.appendChild(d);
    zona.appendChild(s);
    caja = A.cajaWeb('atlas-taller', 'taller', 'cadena');
    caja.lee().then(function (c) {
      cadena = Array.isArray(c) ? c : []; est = TL.estado(cadena);
      if (est.error) { roto = est.error; est = null; pinta(); dice('NO_DATA · ' + roto); return; }
      return TL.verificaFirmas(cadena, A.verificaWeb).then(function (ok) {
        if (!ok) { roto = T('taller_firma_rota', 'a saved receipt does not verify'); est = null; dice('NO_DATA · ' + roto); }
        pinta();
        var I = window.AtlasIncubadora; if (I && I.repinta) { I.repinta(); }
      });
    });
    document.addEventListener('atlas:tropa', pinta);
  }
  /* Lo lijado de cada tropa, para la escuadra de PRACTICA (ui-arena.js). Una cadena rota no presta nada. */
  function lijas() { return est && !roto ? est.lijas : {}; }
  /* P10: el tono de la bandera a la que se tino una onda, o null (nunca un color decidido por otro). */
  function tono(semilla) { var b = est && !roto ? est.tintes[semilla] : null; return b ? V.banderas[b] : null; }

  window.AtlasTallerUI = { monta: monta, lijas: lijas, tono: tono, pinta: pinta };
})();
