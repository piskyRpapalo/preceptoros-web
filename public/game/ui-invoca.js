/* preceptoros.org · theGame v1.5 · INVOCAR (satelite de ui.js, FIRMO M1 2026-10-13: dividir ui.js).

   Sale de `ui.js` SIN CAMBIO DE CONDUCTA: la identidad al invocar (firma), la cadena de invocaciones (G0) y el
   acto de invocar. El estado compartido (`cadena`, `clave`, `causa`, `huevos`) vive en `Z`, que crea `ui.js` y
   comparte con el nido, la eclosion y el army. `crea(c)` lo ata a lo que `ui.js` ya tenia. Sin red, sin azar. */
(function (raiz) {
  'use strict';
  function crea(c) {
    var G = c.G, A = c.A, S = c.S, T = c.T, el = c.el, lienzo = c.lienzo, traza = c.traza, quieto = c.quieto, boton = c.boton, rellena = c.rellena, dice = c.dice, ins = c.ins, cicloMedido = c.cicloMedido,
        calor = c.calor, R = c.R, Z = c.Z, pinta = c.pinta;
  function pintaNido() {
    var i = ins(), ciclo = cicloMedido(i);
    while (R.nido.firstChild) { R.nido.removeChild(R.nido.firstChild); }
    if (!Z.huevos.length) { R.nido.appendChild(el('li', 'atlas-nota', T('nido_vacio'))); return; }
    Z.huevos.forEach(function (h) {
      var li = el('li'), p = ciclo === null ? null : Math.min(100, Math.floor((ciclo - h.desde) * 100 / (h.hasta - h.desde)));
      var cv = lienzo(72, T('huevo_aria'));
      li.appendChild(cv);
      li.appendChild(el('span', null, p === null ? T('inc_ciclo_nd') : rellena(T('huevo'), { tc: T(h.tc), p: Math.max(0, p) })));
      R.nido.appendChild(li);
      traza(cv, G.HUEVO, 'huevo', ciclo === null || quieto() ? 1 : 1 + 0.06 * Math.sin(ciclo));
    });
  }
  /* --- invocar ------------------------------------------------------------ */
  function firma(obj) {
    if (!window.Identity) { return Promise.reject(new Error('sin identidad')); }
    return window.Identity.publica().then(function (pub) {
      obj.pseudonimo = window.Identity.quien(); obj.clave_publica = pub;
      return window.Identity.firmar(obj).then(function (f) { return { obj: obj, firma: f.firma }; });
    });
  }
  function sinIdentidad(e, reintenta) {
    var msg = String((e && e.message) || e || '');
    dice(/sin identidad/.test(msg) ? T('piloto_sin_id') : msg);
    if (!/sin identidad/.test(msg) || !window.Identity || !window.Identity.crear || R.caja.querySelector('.crear-id')) { return; }
    var b = boton(T('piloto_crear_id')); b.classList.add('crear-id');
    b.addEventListener('click', function () {
      b.disabled = true;
      window.Identity.crear().then(function (creada) { if (creada) { b.remove(); reintenta(); } }, function () {
        b.disabled = false; dice('NO_DATA (identity could not be created)');
      });
    });
    R.caja.appendChild(b);
  }
  /* G0 · LA CADENA DE INVOCACIONES (`db.js`): se carga y se re-verifica (firma y semilla) al tener clave, y con ella
     VUELVEN los huevos pagados (antes vivian solo en memoria: recargar cobraba el cobre y devolvia 0 Z.huevos). */
  function cadenaLista() {
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) { return Promise.reject(new Error('sin identidad')); }
    return I.publica().then(function (pub) {
      if (pub === Z.clave && Z.cadena) { return Z.cadena; }
      return A.cadenaWeb(pub).lee().then(function (c) {
        c = c || [];
        return A.verificaCadena(c, pub, A.verificaWeb, A.semillaWeb).then(function (x) {
          Z.clave = pub; Z.causa = x; Z.cadena = x ? null : c;
          Z.huevos = Z.cadena ? A.huevos(Z.cadena) : [];
          if (x) { dice('NO_DATA · ' + x); }
          pinta();
          return Z.cadena;
        });
      });
    });
  }
  function invoca(tc) {
    var i = ins(), TC = G.TCS[tc];
    if (!i || !cicloMedido || cicloMedido(i) === null) { dice(T('inc_ciclo_nd')); return; }
    if (i.recursos.cobre < TC.coste.cobre || i.recursos.luz < TC.coste.luz) { dice(T('inc_falta')); return; }
    cadenaLista().then(function (c) {
      if (!c) { dice('NO_DATA · ' + Z.causa); return; }
      var o = A.eslabon(c, tc, Z.clave);
      return window.Identity.firmar(o).then(function (f) {
        return A.semillaWeb(f.firma).then(function (semilla) {
          var actual = ins(), desde = cicloMedido(actual);
          if (desde === null) { dice(T('inc_ciclo_nd')); return; }
          var ev = window.AtlasJuego.invoca(TC.coste);
          if (!ev || ev.resultado !== 'ok') { dice(T('inc_falta')); return; }
          Z.cadena = A.anexa(Z.cadena, o, f.firma, semilla, desde, desde + TC.incuba);
          A.cadenaWeb(Z.clave).pon(Z.cadena);
          Z.huevos.push({ tc: tc, semilla: semilla, desde: desde, hasta: desde + TC.incuba, seq: o.seq });
          S.suena('pop', calor());
          dice(rellena(T('inc_hecha'), { tc: T(tc) }));
          pinta();
        });
      });
    }).catch(function (e) { sinIdentidad(e, function () { invoca(tc); }); });
  }
    return { firma: firma, sinIdentidad: sinIdentidad, cadenaLista: cadenaLista, invoca: invoca, pintaNido: pintaNido };
  }
  raiz.AtlasInvoca = { crea: crea };
})(this);
