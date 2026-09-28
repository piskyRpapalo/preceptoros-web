/* preceptoros.org · theGame · multijugador · la LIBRETA de duelos: lo que un aparato sabe de sus duelos, y
   como se GUARDA sin que guardar sea creer.

   Sugerencia firmada por el Soberano (2026-09-28): «guardar los duelos a medias en la base del aparato,
   para que cerrar la pestana no sea abandonar». La libreta tiene tu defensa (`mia`), las defensas que
   importaste, cada duelo con su libro de sobres (`sobres.js`), los resultados en el orden en que se
   cerraron (`hechos`, que es el orden del rating) y tu siguiente `seq` en cada sesion (`cabezas`).

   `vuelca()` da solo lo FIRMADO y lo que hace falta para seguir: los sobres, tu `r` de cada duelo (el
   secreto del commit-reveal: no sale del aparato) y los ciclos que ya esperaste. `carga(g)` no se lo
   cree: verifica cada firma, vuelve a anotar cada sobre en su libro, casa tu `r` con tu compromiso y
   vuelve a jugar cada resultado. Un guardado tocado no entra, o entra sin el duelo tocado y lo dice.
   Donde se guarda lo decide quien llama (`ui-duelo.js`, IndexedDB); el protocolo es `duelo.js`.

   PURO: ni DOM, ni red, ni reloj. La verificacion (`op.verifica`) y el ciclo (`op.ciclo`) se inyectan. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var A = enNode ? require('./arena.js') : raiz.AtlasArena;
  var ESQUEMA = 'atlas.duelos_guardados/1';

  function falla(m) { return Promise.reject(new Error(m)); }

  function crea(op) {
    var st = { defensas: {}, duelos: {}, resultados: [], hechos: [], mia: null, cabezas: {} };

    function fin(D, ses, r) { D.resultado = r; st.resultados.push(r); st.hechos.push(ses); }
    function anota(D, sobres) {
      for (var i = 0; i < sobres.length; i++) {
        var m = S.anota(D.L, sobres[i]);
        if (m && m !== 'duplicado') { return m; }
      }
      return '';
    }
    /* Tu `seq` en una sesion sale de tus propios sobres: nunca se reutiliza uno ya firmado. */
    function sube(s) {
      var c = st.cabezas[s.sesion] || (st.cabezas[s.sesion] = { seq: 0, prev: 'genesis' });
      if (s.de === op.pub && s.seq > c.seq) { c.seq = s.seq; c.prev = S.huella(s); }
    }

    function vuelca() {
      return { esquema: ESQUEMA, de: op.pub, mia: st.mia, hechos: st.hechos.slice(),
               defensas: Object.keys(st.defensas).map(function (h) { return st.defensas[h]; }),
               duelos: Object.keys(st.duelos).map(function (k) {
                 var D = st.duelos[k];
                 return { politica: D.politica, rol: D.rol, r: D.r, defensa: D.defensa, sobres: S.aceptados(D.L),
                          esperado: D.esperando == null ? null : Math.max(0, op.ciclo() - D.esperando) };
               }) };
    }

    function carga(g) {
      if (!g || g.esquema !== ESQUEMA || g.de !== op.pub || !Array.isArray(g.defensas) || !Array.isArray(g.duelos) ||
          !Array.isArray(g.hechos)) { return falla('guardado: forma u otra clave'); }
      if (st.mia || st.hechos.length || Object.keys(st.duelos).length) { return falla('guardado: solo en una libreta nueva'); }
      var ss = (g.mia ? [g.mia.sobre] : []).concat(g.defensas.map(function (d) { return d.sobre; }));
      g.duelos.forEach(function (d) { ss = ss.concat(d.sobres, [d.defensa]); });
      return Promise.all(ss.map(function (s) { return S.forma(s) ? false : S.verifica(s, op.verifica); })).then(function (oks) {
        if (oks.indexOf(false) >= 0) { throw new Error('guardado: una firma no verifica'); }
        var fuera = [];
        if (g.mia) {
          if (g.mia.sobre.de !== op.pub || S.sesion(g.mia.politica) !== g.mia.sobre.sesion) { throw new Error('guardado: tu defensa'); }
          st.mia = g.mia; sube(g.mia.sobre);
        }
        g.defensas.forEach(function (d) {
          if (A.formaDefensa(d.sobre.cuerpo) || d.sobre.cuerpo.pack_sha !== A.packSha()) { fuera.push('defensa de otro juego'); }
          else { st.defensas[S.huella(d.sobre)] = d; }
        });
        g.duelos.forEach(function (d) {
          var ses = S.sesion(d.politica), yo = d.rol === 'atacante', as;
          var D = { politica: d.politica, L: S.libro(d.politica), defensa: d.defensa, rol: d.rol, r: d.r, resultado: null,
                    esperando: d.esperado == null ? null : op.ciclo() - d.esperado };
          var m = d.rol !== 'atacante' && d.rol !== 'defensor' ? 'duelo: rol' : S.formaPolitica(d.politica) ? 'duelo: politica'
            : d.sobres.some(function (s) { return s.sesion !== ses; }) ? 'sobre de otra sesion' : anota(D, d.sobres);
          if (!m) {
            as = S.aceptados(D.L, 'asalto');
            if (as.length !== 1 || (yo ? d.defensa.de === op.pub : as[0].de === op.pub)) { m = 'duelo: rol'; }
            else if (D.r && S.conjunto(D.L)[op.pub] !== S.compromiso(D.r, op.pub, ses)) { m = 'tu r no casa con tu compromiso'; }
          }
          if (m) { fuera.push(m); return; }
          D.otro = yo ? d.defensa.de : as[0].de; D.pseudo = yo ? d.defensa.pseudonimo : as[0].pseudonimo;
          d.sobres.forEach(sube);
          st.duelos[ses] = D;
          var x = A.resuelve(D.L, D.defensa, 'humano'), rs = S.aceptados(D.L, 'resultado'), r = rs.length && rs[rs.length - 1].cuerpo;
          if (x.ok) { D.resultado = x.resultado; } else if (r && !A.compruebaResultado(D.L, D.defensa, r)) { D.resultado = r; }
        });
        g.hechos.forEach(function (ses) {
          var D = st.duelos[ses];
          if (D && D.resultado && st.hechos.indexOf(ses) < 0) { fin(D, ses, D.resultado); }
        });
        return { duelos: Object.keys(st.duelos).length, fuera: fuera };
      });
    }

    return { st: st, fin: fin, anota: anota, sube: sube, vuelca: vuelca, carga: carga };
  }

  var AtlasLibreta = { ESQUEMA: ESQUEMA, crea: crea };
  if (enNode) { module.exports = AtlasLibreta; }
  else { raiz.AtlasLibreta = AtlasLibreta; }
})(this);
