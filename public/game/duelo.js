/* preceptoros.org · theGame · multijugador · el DUELO entre personas, por PAQUETES firmados.

   SIN SERVIDOR (PLAN §2-§3): dos aparatos se pasan paquetes `atlas.paquete_mp/1` por el canal que la
   persona elija (Send, Copy, fichero). Cada paquete lleva sobres ya firmados (`sobres.js`) y la
   politica de su sesion. El duelo fantasma en tres idas y vueltas:
   1. DEFENSA   · B publica su defensa en su tablon (tropas `{tc, semilla}` + lo que declara en juego).
   2. DESAFIO   · A la importa, elige escuadra y manda asalto + su COMPROMISO (su `r` no sale).
   3. RESPUESTA · B acepta: se compromete y REVELA a la vez (A ya no puede cambiar su `r`).
   4. REVELACION· A revela y los dos vuelven a jugar el MISMO combate con la semilla de los dos `r`.
   Si A no revela en `combate.abandono_ciclos` ciclos de juego de B, B reclama el ABANDONO (firmado
   por el Soberano, 2026-09-28): queda como resultado y como deuda a la vista.

   IMPORTAR NO ES CREER: cada sobre se VERIFICA (firma Ed25519) y se anota en el libro de su sesion
   (`seq`, `prev`, trampa, replica). Un desafio a una defensa que no es la tuya se rechaza. El resultado
   no se envia para que lo crean: cada lado lo vuelve a jugar.

   PLATAFORMA INYECTADA: `firma(texto)`, `verifica(texto, firma, clave)` (promesas), `azar()` (64 hex)
   y `azar32()` (32 hex) de `crypto.getRandomValues` en la pestana, deterministas en las pruebas;
   `ciclo()` = el ciclo de juego de este aparato. GUARDAR (firmado por el Soberano, 2026-09-28: cerrar la
   pestana no es abandonar): `vuelca()` da lo FIRMADO y tus `r`; `carga()` no se lo cree: verifica cada
   firma, vuelve a anotar cada sobre, casa tu `r` con tu compromiso y vuelve a jugar cada resultado.
   El estado y su guardado viven en `libreta.js`; la forma del paquete, en `enlace.js`; donde se
   guarda lo decide quien llama (`ui-duelo.js`).
   Ni DOM, ni red, ni reloj. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var A = enNode ? require('./arena.js') : raiz.AtlasArena;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var E = enNode ? require('./enlace.js') : raiz.AtlasEnlace;
  var Lb = enNode ? require('./libreta.js') : raiz.AtlasLibreta;

  var paquete = E.paquete, formaPaquete = E.formaPaquete;
  function falla(m) { return Promise.reject(new Error(m)); }

  function crea(op) {
    var B = Lb.crea(op), st = B.st, defensas = st.defensas, duelos = st.duelos, cabezas = st.cabezas;
    var fin = B.fin, anota = B.anota;

    function politica(modo, pares) {
      return K.ordena({ esquema: 'atlas.mp_sesion/1', modo: modo, pares: pares.slice().sort(), quorum: pares.length,
                        max_bytes: 8192, max_ops: 16, semilla: 'commit_reveal', conflicto: 'poda_gana',
                        contenido_v: op.contenido_v, nonce: op.azar32() });
    }
    /* Mi siguiente sobre en una sesion: el `seq` y el `prev` los lleva este aparato. */
    function firmaSobre(sesion, tipo, cuerpo) {
      var c = cabezas[sesion] || (cabezas[sesion] = { seq: 0, prev: 'genesis' });
      var s = { esquema: 'atlas.sobre/1', tipo: tipo, sesion: sesion, de: op.pub, pseudonimo: op.pseudonimo,
                seq: c.seq + 1, prev: c.prev, contenido_v: op.contenido_v, cuerpo: K.ordena(cuerpo) };
      return Promise.resolve(op.firma(S.mensaje(s))).then(function (h) {
        s.firma = 'ed25519:' + h; c.seq = s.seq; c.prev = S.huella(s);
        return K.ordena(s);
      });
    }
    /* Todas las firmas del paquete, verificadas antes de tocar nada. */
    function verificaTodo(p) {
      var ss = p.sobres.concat(p.defensa ? [p.defensa.sobre] : []);
      return Promise.all(ss.map(function (s) { return S.verifica(s, op.verifica); })).then(function (oks) {
        if (oks.indexOf(false) >= 0) { throw new Error('una firma no verifica'); }
      });
    }

    function publica(tropas, enJuego) {
      var pol = politica('tablon', [op.pub]), ses = S.sesion(pol);
      var cuerpo = { esquema: 'atlas.defensa/1', pack_sha: A.packSha(), tropas: tropas, en_juego: enJuego || { cobre: 0, luz: 0 } };
      var m = A.formaDefensa(cuerpo);
      if (m) { return falla(m); }
      return firmaSobre(ses, 'defensa', cuerpo).then(function (s) {
        st.mia = { politica: pol, sobre: s };
        return paquete('defensa', pol, [s], null);
      });
    }

    function importa(p) {
      if (typeof p === 'string') { try { p = JSON.parse(p); } catch (x) { return falla('no es JSON'); } }
      var m = formaPaquete(p);
      if (m) { return falla(m); }
      var ses = S.sesion(p.politica);
      if (p.sobres.some(function (s) { return s.sesion !== ses; })) { return falla('un sobre es de otra sesion (replica)'); }
      return verificaTodo(p).then(function () {
        var s0 = p.sobres[0], D = duelos[ses];
        if (p.tipo === 'defensa') {
          if (s0.tipo !== 'defensa' || p.sobres.length !== 1) { throw new Error('paquete de defensa sin defensa'); }
          if (s0.de === op.pub) { throw new Error('es tu propia defensa'); }
          var fd = A.formaDefensa(s0.cuerpo);
          if (fd) { throw new Error(fd); }
          if (s0.cuerpo.pack_sha !== A.packSha()) { throw new Error('pack distinto: no es el mismo juego'); }
          var h = S.huella(s0);
          defensas[h] = { politica: p.politica, sobre: s0 };
          return { tipo: 'defensa', huella: h, sobre: s0 };
        }
        if (p.tipo === 'desafio') {
          if (!st.mia || !p.defensa || S.huella(p.defensa.sobre) !== S.huella(st.mia.sobre)) { throw new Error('ese desafio no es a tu defensa'); }
          if (p.politica.modo !== 'duelo' || p.politica.pares.indexOf(op.pub) < 0 || p.politica.pares.length !== 2) {
            throw new Error('la sesion no es un duelo contigo');
          }
          if (D) { throw new Error('ese desafio ya lo tienes'); }
          D = { politica: p.politica, L: S.libro(p.politica), defensa: st.mia.sobre, rol: 'defensor', r: null, esperando: null, resultado: null };
          var ma = anota(D, p.sobres);
          if (ma) { throw new Error(ma); }
          var as = S.aceptados(D.L, 'asalto');
          if (as.length !== 1 || as[0].cuerpo.defensa !== S.huella(st.mia.sobre)) { throw new Error('el asalto no es a tu defensa'); }
          D.otro = as[0].de; D.pseudo = as[0].pseudonimo;
          duelos[ses] = D;
          return { tipo: 'desafio', sesion: ses, de: D.pseudo, asalto: as[0].cuerpo };
        }
        if (!D) { throw new Error('NO_DATA · no conozco ese duelo'); }
        var mb = anota(D, p.sobres);
        if (mb) { throw new Error(mb); }
        if (p.tipo === 'respuesta') { return { tipo: 'respuesta', sesion: ses, de: D.pseudo }; }
        if (p.tipo === 'revelacion') {
          var x = A.resuelve(D.L, D.defensa, 'humano');
          if (!x.ok) { throw new Error(x.motivo); }
          fin(D, ses, x.resultado);
          return { tipo: 'revelacion', sesion: ses, resultado: x.resultado, combate: x.combate, defensa: D.defensa,
                   asalto: S.aceptados(D.L, 'asalto')[0].cuerpo };
        }
        var rs = S.aceptados(D.L, 'resultado');
        var r = rs[rs.length - 1].cuerpo, mc = A.compruebaResultado(D.L, D.defensa, r);
        if (mc) { throw new Error(mc); }
        fin(D, ses, r);
        return { tipo: 'resultado', sesion: ses, resultado: r };
      });
    }

    function reta(huellaDefensa, tropas) {
      var d = defensas[huellaDefensa];
      if (!d) { return falla('NO_DATA · no tengo esa defensa'); }
      var pol = politica('duelo', [op.pub, d.sobre.de]), ses = S.sesion(pol), r = op.azar();
      var D = { politica: pol, L: S.libro(pol), defensa: d.sobre, rol: 'atacante', r: r, otro: d.sobre.de,
                pseudo: d.sobre.pseudonimo, resultado: null };
      var cuerpo = { esquema: 'atlas.asalto/1', defensa: huellaDefensa, pack_sha: A.packSha(), tropas: tropas };
      var m = A.formaAsalto(cuerpo);
      if (m) { return falla(m); }
      return firmaSobre(ses, 'asalto', cuerpo).then(function (a) {
        return firmaSobre(ses, 'compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(r, op.pub, ses) }).then(function (c) {
          var mm = anota(D, [a, c]);
          if (mm) { throw new Error(mm); }
          duelos[ses] = D;
          return { sesion: ses, paquete: paquete('desafio', pol, [a, c], { politica: d.politica, sobre: d.sobre }) };
        });
      });
    }

    function acepta(ses) {
      var D = duelos[ses];
      if (!D || D.rol !== 'defensor' || D.r) { return falla('NO_DATA · no hay desafio pendiente'); }
      var r = op.azar();
      return firmaSobre(ses, 'compromiso', { esquema: 'atlas.compromiso/1', c: S.compromiso(r, op.pub, ses) }).then(function (c) {
        var m = anota(D, [c]);
        if (m) { throw new Error(m); }
        var hc = S.huellaConjunto(S.conjunto(D.L));
        return firmaSobre(ses, 'revelacion', { esquema: 'atlas.revelacion/1', r: r, compromisos: hc }).then(function (v) {
          var m2 = anota(D, [v]);
          if (m2) { throw new Error(m2); }
          D.r = r; D.esperando = op.ciclo();
          return paquete('respuesta', D.politica, [c, v], null);
        });
      });
    }

    function revela(ses) {
      var D = duelos[ses];
      if (!D || D.rol !== 'atacante' || D.resultado) { return falla('NO_DATA · no hay nada que revelar'); }
      if (!S.conjunto(D.L)[D.otro]) { return falla('NO_DATA · el otro aun no se ha comprometido'); }
      var hc = S.huellaConjunto(S.conjunto(D.L));
      return firmaSobre(ses, 'revelacion', { esquema: 'atlas.revelacion/1', r: D.r, compromisos: hc }).then(function (v) {
        var m = anota(D, [v]);
        if (m) { throw new Error(m); }
        var x = A.resuelve(D.L, D.defensa, 'humano');
        if (!x.ok) { throw new Error(x.motivo); }
        fin(D, ses, x.resultado);
        return { paquete: paquete('revelacion', D.politica, [v], null), resultado: x.resultado, combate: x.combate,
                 defensa: D.defensa, asalto: S.aceptados(D.L, 'asalto')[0].cuerpo };
      });
    }

    /* Ciclos que le quedan al otro para revelar antes del abandono (NO_DATA si no espero nada). */
    function plazo(ses) {
      var D = duelos[ses];
      if (!D || D.rol !== 'defensor' || D.esperando === null || D.resultado) { return null; }
      return Math.max(0, V.combate.abandono_ciclos - (op.ciclo() - D.esperando));
    }
    function abandona(ses) {
      var D = duelos[ses], q = plazo(ses);
      if (q === null) { return falla('NO_DATA · no espero a nadie en ese duelo'); }
      if (q > 0) { return falla('aun no: faltan ' + q + ' ciclos'); }
      var x = A.abandono(D.L, D.defensa, op.pub);
      if (!x.ok) { return falla(x.motivo); }
      return firmaSobre(ses, 'resultado', x.resultado).then(function (s) {
        var m = anota(D, [s]);
        if (m) { throw new Error(m); }
        fin(D, ses, x.resultado);
        return { paquete: paquete('resultado', D.politica, [s], null), resultado: x.resultado };
      });
    }

    return {
      publica: publica, importa: importa, reta: reta, acepta: acepta, revela: revela, plazo: plazo, abandona: abandona,
      vuelca: B.vuelca, carga: B.carga,
      mia: function () { return st.mia; },
      defensas: function () { return Object.keys(defensas).map(function (h) { return { huella: h, sobre: defensas[h].sobre }; }); },
      duelos: function () {
        return Object.keys(duelos).map(function (k) {
          var D = duelos[k];
          var fase = D.resultado ? 'hecho' : D.rol === 'defensor' ? (D.r ? 'espera' : 'recibido')
            : S.conjunto(D.L)[D.otro] ? 'revelar' : 'retado';
          return { sesion: k, rol: D.rol, de: D.pseudo, fase: fase };
        });
      },
      resultados: function () { return st.resultados.slice(); },
      rating: function () {
        var t = A.tabla(st.resultados);
        return { rating: op.pub in t.ratings ? t.ratings[op.pub] : V.combate.rating_inicial, partidas: t.partidas[op.pub] || 0 };
      }
    };
  }

  var AtlasDuelo = { TIPOS: E.TIPOS, paquete: paquete, formaPaquete: formaPaquete, crea: crea };
  if (enNode) { module.exports = AtlasDuelo; }
  else { raiz.AtlasDuelo = AtlasDuelo; }
})(this);
