/* preceptoros.org · theGame · los NODOS COMO CUENTA y su duelo.

   UNA CUENTA = UN NODO (orquestador, 2026-10-04: «Hexelion y Doogee equilibrados, con 1 nodo cada
   uno como cuenta»). `validaCedulas` exige el 1:1, la forma heredada de `preceptoros.cedula-nodo/1`
   y su `sha256` (cedula tocada: FALLO_INTEGRIDAD). Una cifra sin medir NO entra como numero: si su
   estado es NO_DATA, su valor es null y el eje es NIEBLA.

   EL COMBATE ES UN LOG CERRADO que sale de una semilla: `combate` escribe los eventos (`inicio`,
   `golpe`, `esquiva`, `fin`) y nada mas. El render NO decide: `reproduce` saca de cada evento el
   estado que se pinta, y el ultimo coincide con `fin` por construccion.

   JUGAR NO SACA NADA DEL NAVEGADOR. Firmar la partida (`Identity.firmar` del registro, que ata la
   huella del log) es la N1. Enviar pide ademas un GESTO de verdad y una SEGUNDA firma, la del
   consentimiento (consent 1); `envio` es la puerta, y sin las tres cosas lanza.

   PURO: ni DOM, ni red, ni reloj, ni azar del sistema. A demanda, con la Arena. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var ESTADOS = ['MEDIDO', 'EMULADO', 'NO_DATA'], EJES = ['ram_mib', 'gen_cps'];
  var RASGOS = ['vida', 'ataque', 'armadura', 'velocidad', 'esquiva_pm'];
  var EVENTOS = { inicio: ['t', 'tick', 'vida'], golpe: ['t', 'tick', 'de', 'dano', 'vida'],
                  esquiva: ['t', 'tick', 'de', 'vida'], fin: ['t', 'tick', 'gana', 'vida'] };
  var NOMBRE = /^nodo\.[0-9]{1,6}\.[a-z0-9][a-z0-9-]{0,30}$/, FECHA = /^\d{4}-\d{2}-\d{2}$/;

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function entero(x) { return Number.isSafeInteger(x); }
  function texto(x) { return typeof x === 'string' && x.length > 0 && x.length <= 120; }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).sort().join() === claves.slice().sort().join();
  }

  /* --- las cedulas ------------------------------------------------------------------------------ */
  function formaMedida(m) {
    if (!objeto(m) || ESTADOS.indexOf(m.estado) < 0) { return 'estado fuera del vocabulario'; }
    if (m.estado === 'NO_DATA') {
      return m.valor === null && texto(m.causa) ? '' : 'NO_DATA con numero o sin causa';
    }
    if (!entero(m.valor) || m.valor <= 0) { return m.estado + ' sin valor entero'; }
    if (m.estado === 'MEDIDO') {
      return texto(m.fuente) && FECHA.test(m.fecha || '') ? '' : 'MEDIDO sin fuente o sin fecha';
    }
    return texto(m.base) && texto(m.causa) ? '' : 'EMULADO sin base o sin causa';
  }
  function formaCedula(c) {
    if (!objeto(c) || c.esquema !== 'preceptoros.cedula-nodo/1' || !NOMBRE.test(c.nodo || '')) { return 'cedula: forma'; }
    if (c.firma !== null || !/^NO_DATA/.test(c.autenticidad || '')) { return c.nodo + ': la cedula no va firmada'; }
    var cuerpo = {};
    Object.keys(c).forEach(function (k) { if (k !== 'sha256') { cuerpo[k] = c[k]; } });
    if (K.huella(cuerpo) !== c.sha256) { return 'FALLO_INTEGRIDAD ' + c.nodo; }
    var a = c.aparato;
    if (!objeto(a) || !texto(a.dispositivo) || !mismas(a.medidas, EJES)) { return c.nodo + ': aparato'; }
    for (var i = 0; i < EJES.length; i++) {
      var e = formaMedida(a.medidas[EJES[i]]);
      if (e) { return c.nodo + ' ' + EJES[i] + ': ' + e; }
    }
    return '';
  }
  function validaCedulas(C) {
    if (!objeto(C) || C.esquema !== 'atlas.cedulas_nodo/1' || !Array.isArray(C.cuentas) || !Array.isArray(C.nodos)) {
      return 'cedulas: forma';
    }
    var vistos = {}, cuentas = {};
    for (var i = 0; i < C.nodos.length; i++) {
      var e = formaCedula(C.nodos[i]);
      if (e) { return e; }
      vistos[C.nodos[i].nodo] = 0;
    }
    for (var j = 0; j < C.cuentas.length; j++) {
      var u = C.cuentas[j];
      if (!mismas(u, ['cuenta', 'nodo']) || !/^[a-z0-9-]{3,40}$/.test(u.cuenta) || cuentas[u.cuenta]) { return 'cuenta: forma'; }
      if (!(u.nodo in vistos)) { return u.cuenta + ': nodo sin cedula'; }
      cuentas[u.cuenta] = true; vistos[u.nodo] += 1;
    }
    var mal = Object.keys(vistos).filter(function (n) { return vistos[n] !== 1; });
    return mal.length ? 'cada cuenta es un nodo y cada nodo una cuenta: ' + mal.join() : '';
  }
  function validaPesos(P) {
    if (!objeto(P) || P.esquema !== 'atlas.pesos_nodos/1') { return 'pesos: forma'; }
    if (P.estado !== 'PROPUESTA' || P.firma !== null) { return 'los pesos son PROPUESTA sin firma hasta que se firmen'; }
    if (!texto(P.version) || !mismas(P.ejes, EJES) || !mismas(P.base, RASGOS)) { return 'pesos: forma'; }
    for (var i = 0; i < EJES.length; i++) {
      var x = P.ejes[EJES[i]];
      if (!Array.isArray(x.escalones) || x.escalones.length !== 4 ||
          !x.escalones.every(function (v, k) { return entero(v) && (k === 0 || v > x.escalones[k - 1]); })) { return 'escalones'; }
      var malo = Object.keys(x.rasgos || {}).filter(function (r) {
        var f = x.rasgos[r];
        return RASGOS.indexOf(r) < 0 || !Array.isArray(f) || f.length !== 5 || !f.every(entero) || f[2] !== P.base[r] ||
               EJES.some(function (o) { return o !== EJES[i] && r in P.ejes[o].rasgos; });
      });
      if (malo.length || !Object.keys(x.rasgos || {}).length) { return 'tabla de rasgos: ' + malo.join(); }
    }
    var c = P.combate;
    return objeto(c) && entero(c.ticks) && entero(c.umbral) && entero(c.varia_div) && entero(c.dano_min) ? '' : 'combate';
  }

  /* --- los rasgos ------------------------------------------------------------------------------- */
  function nivel(valor, escalones) {
    return escalones.filter(function (e) { return valor >= e; }).length;
  }
  function rasgosDeNiveles(niveles, P) {
    var r = {}, niebla = [];
    RASGOS.forEach(function (k) { r[k] = P.base[k]; });
    EJES.forEach(function (e) {
      var l = niveles[e];
      if (l === null) { niebla.push(e); return; }
      Object.keys(P.ejes[e].rasgos).forEach(function (k) { r[k] = P.ejes[e].rasgos[k][l]; });
    });
    r.niveles = niveles; r.niebla = niebla;
    return r;
  }
  function rasgos(cedula, P) {
    var e = formaCedula(cedula);
    if (e) { throw new Error(e); }
    var n = {};
    EJES.forEach(function (x) {
      var m = cedula.aparato.medidas[x];
      n[x] = m.estado === 'NO_DATA' ? null : nivel(m.valor, P.ejes[x].escalones);
    });
    return rasgosDeNiveles(n, P);
  }

  /* --- el combate: un log cerrado --------------------------------------------------------------- */
  function combate(a, b, semilla, P) {
    var g = K.generador(semilla), c = P.combate, f = [a, b], vida = [a.vida, b.vida], carga = [0, 0];
    var ev = [{ t: 'inicio', tick: 0, vida: vida.slice() }];
    function golpea(de, tick) {
      var x = f[de], y = f[1 - de];
      if (g.uniforme(1000) < y.esquiva_pm) { ev.push({ t: 'esquiva', tick: tick, de: de, vida: vida.slice() }); return; }
      var d = Math.max(c.dano_min, x.ataque + g.uniforme(Math.floor(x.ataque / c.varia_div) + 1) - y.armadura);
      vida[1 - de] = Math.max(0, vida[1 - de] - d);
      ev.push({ t: 'golpe', tick: tick, de: de, dano: d, vida: vida.slice() });
    }
    var tick = 0;
    while (tick < c.ticks && vida[0] > 0 && vida[1] > 0) {
      tick += 1;
      carga[0] += f[0].velocidad; carga[1] += f[1].velocidad;
      var orden = carga[0] !== carga[1] ? (carga[0] > carga[1] ? [0, 1] : [1, 0]) : (g.uniforme(2) ? [1, 0] : [0, 1]);
      for (var i = 0; i < 2 && vida[0] > 0 && vida[1] > 0; i++) {
        var q = orden[i];
        while (carga[q] >= c.umbral && vida[0] > 0 && vida[1] > 0) { carga[q] -= c.umbral; golpea(q, tick); }
      }
    }
    var pa = Math.floor(vida[0] * 1000 / a.vida), pb = Math.floor(vida[1] * 1000 / b.vida);
    ev.push({ t: 'fin', tick: tick, gana: pa === pb ? -1 : pa > pb ? 0 : 1, vida: vida.slice() });
    return { esquema: 'atlas.log_nodos/1', semilla: semilla, max: [a.vida, b.vida], eventos: ev };
  }
  function formaLog(L) {
    if (!mismas(L, ['esquema', 'semilla', 'max', 'eventos']) || L.esquema !== 'atlas.log_nodos/1' || !K.HEX64.test(L.semilla)) {
      return 'log: forma';
    }
    if (!Array.isArray(L.eventos) || L.eventos.length < 2) { return 'log: sin eventos'; }
    for (var i = 0; i < L.eventos.length; i++) {
      var e = L.eventos[i], claves = EVENTOS[e && e.t];
      if (!claves) { return 'evento fuera del vocabulario: ' + (e && e.t); }
      if (!mismas(e, claves)) { return 'evento ' + i + ': claves'; }
      if ((e.t === 'inicio') !== (i === 0) || (e.t === 'fin') !== (i === L.eventos.length - 1)) { return 'evento ' + i + ': orden'; }
    }
    return '';
  }
  /* Lo que se pinta, evento a evento, sacado SOLO del log. */
  function reproduce(L) {
    var e = formaLog(L);
    if (e) { throw new Error(e); }
    return L.eventos.map(function (x) {
      return { t: x.t, tick: x.tick, de: 'de' in x ? x.de : null, dano: x.dano || 0, vida: x.vida.slice(),
               pm: [Math.floor(x.vida[0] * 1000 / L.max[0]), Math.floor(x.vida[1] * 1000 / L.max[1])],
               gana: x.t === 'fin' ? x.gana : null };
    });
  }

  /* --- la partida, su firma y su envio ---------------------------------------------------------- */
  function semillaDe(a, b, n) { return K.sha('atlas.nodos/1:' + a + ':' + b + ':' + n); }
  function partida(C, P, ca, cb, n) {
    var e = validaCedulas(C) || validaPesos(P);
    if (e) { throw new Error(e); }
    if (!entero(n) || n < 0 || ca === cb) { throw new Error('partida: n entero y dos cuentas'); }
    var ced = [ca, cb].map(function (q) {
      var u = C.cuentas.filter(function (x) { return x.cuenta === q; })[0];
      if (!u) { throw new Error('cuenta desconocida: ' + q); }
      return C.nodos.filter(function (x) { return x.nodo === u.nodo; })[0];
    });
    var ra = rasgos(ced[0], P), rb = rasgos(ced[1], P), s = semillaDe(ca, cb, n), log = combate(ra, rb, s, P);
    var fin = log.eventos[log.eventos.length - 1];
    var registro = K.ordena({ esquema: 'atlas.partida_nodos/1', cuentas: [ca, cb], nodos: [ced[0].nodo, ced[1].nodo],
      n: n, semilla: s, pesos: P.version, cedulas_sha: K.huella(C), log_sha: K.huella(log), gana: fin.gana,
      ticks: fin.tick, eventos: log.eventos.length, niebla: [ra.niebla, rb.niebla] });
    return { registro: registro, log: log, rasgos: [ra, rb], cedulas: ced };
  }
  function consentimiento(registro) {
    return K.ordena({ esquema: 'atlas.consentimiento/1', consent: 1, partida: registro.log_sha,
                      destino: 'review queue of the rack: nothing is published automatically' });
  }
  function envio(o) {
    if (!o || o.gesto !== true) { throw new Error('sin gesto no sale nada'); }
    if (!o.partida || !/^(ed25519:)?[0-9a-f]{128}$/.test(o.firma || '')) { throw new Error('sin la firma de la partida'); }
    var cs = o.consentimiento;
    if (!cs || cs.consent !== 1 || cs.partida !== o.partida.log_sha || !/^(ed25519:)?[0-9a-f]{128}$/.test(o.firma_consent || '')) {
      throw new Error('sin consent 1 firmado');
    }
    if (!K.HEX64.test(o.publica || '')) { throw new Error('sin clave publica'); }
    return [{ partida: o.partida, firma: o.firma, consentimiento: cs, firma_consent: o.firma_consent, publica: o.publica }];
  }

  var AtlasNodos = { validaCedulas: validaCedulas, validaPesos: validaPesos, rasgos: rasgos, rasgosDeNiveles: rasgosDeNiveles,
                     combate: combate, formaLog: formaLog, reproduce: reproduce, semilla: semillaDe, partida: partida,
                     consentimiento: consentimiento, envio: envio, EJES: EJES, ESQUEMA_ENVIO: 'atlas/partida_nodos/1' };
  if (enNode) { module.exports = AtlasNodos; } else { raiz.AtlasNodos = AtlasNodos; }
})(this);
