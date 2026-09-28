/* preceptoros.org · theGame · multijugador · la ARENA: duelos fantasma, patrullas y rating entero.

   MODELO FANTASMA (PLAN §3): se ataca una DEFENSA FIRMADA (tu Army de cara a los demas), no a la
   persona conectada. Asi se juega entre husos horarios y con la bateria baja.
   1. El defensor publica `defensa` en su tablon: `{tc, semilla}` de cada tropa, el `pack_sha` de
      los valores con los que juega y lo que declara `en_juego`.
   2. En una sesion de duelo (`modo: 'duelo'`, los dos pares) el atacante manda su `asalto`, que
      nombra la huella de esa defensa; los dos se comprometen y revelan (`sobres.js`).
   3. `resuelve` saca la semilla del commit-reveal y juega `combate`: rondas ENTERAS, sin decimales
      ni reloj. Cualquiera lo vuelve a jugar y sale igual: el resultado no se cree, se comprueba.

   LAS CIFRAS DE UNA TROPA NO VIAJAN: se REDERIVAN con `gacha.tirada(semilla, tc)` y los valores del
   mismo `pack_sha`. Nadie se fabrica una tropa con sus numeros. Limite dicho: la semilla sale de
   una firma y Ed25519 no es un VRF; para clasificar entre personas hace falta firma (auditoria §2.8).

   `en_juego` SE DECLARA Y VIAJA, NO SE APLICA: la perdida definitiva y el saqueo esperan firma
   (PLAN §11, pregunta 3). El RATING es un Elo entero y LOCAL: cada aparato lo calcula de los
   resultados verificados que tiene; no hay clasificacion central. Por defecto solo cuentan los
   duelos `humano`; los `sintetico` (patrullas, pruebas) se etiquetan y no puntuan.

   PURO: ni DOM, ni red, ni reloj, ni `Math.random`. A demanda, con el Army (valores + gacha). */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var G = enNode ? require('./gacha.js') : raiz.AtlasGacha;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var HEX64 = K.HEX64;
  var PROCEDENCIAS = ['humano', 'piloto_base', 'denso', 'lora', 'sintetico'];
  var GANA = ['defensa', 'asalto', 'empate'];
  /* Esperanza por mil de un Elo, 1000 / (1 + 10^(-d/400)), en tramos de 25 puntos de 0 a 800,
     precalculada y escrita en enteros: en ejecucion no hay ni un decimal. */
  var ESPERA = [500, 536, 571, 606, 640, 673, 703, 733, 760, 785, 808, 830, 849, 867, 882, 896, 909, 920,
                930, 939, 947, 954, 960, 965, 969, 973, 977, 980, 983, 985, 987, 989, 990];

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }

  /* La huella de la parte ENTERA de los valores: lo que decide una tirada y un combate. Dos
     personas con distinto `pack_sha` no juegan el mismo juego y el duelo no se resuelve. */
  function packSha(v) {
    v = v || V;
    return K.huella({ version: v.version, tcs: v.tcs, prefijos: v.prefijos, sufijos: v.sufijos, base: v.base,
                      simetria: v.simetria, terminos: v.terminos, army_tope: v.army_tope, combate: v.combate });
  }

  /* --- formas de los cuerpos ------------------------------------------------------------------ */
  function formaTropas(ts, v) {
    var P = (v || V).combate;
    if (!Array.isArray(ts) || ts.length < 1 || ts.length > P.tropas_max) { return 'tropas: 1 a ' + P.tropas_max; }
    for (var i = 0; i < ts.length; i++) {
      if (!mismas(ts[i], ['tc', 'semilla']) || !G.TCS[ts[i].tc] || !HEX64.test(ts[i].semilla)) { return 'tropa ' + i; }
    }
    return '';
  }
  function formaCesta(c) {
    return mismas(c, ['cobre', 'luz']) && entero(c.cobre, 0, 1000000) && entero(c.luz, 0, 1000000);
  }
  function formaDefensa(c) {
    if (!mismas(c, ['esquema', 'pack_sha', 'tropas', 'en_juego']) || c.esquema !== 'atlas.defensa/1') { return 'defensa: forma'; }
    if (!HEX64.test(c.pack_sha)) { return 'defensa: pack_sha'; }
    if (!formaCesta(c.en_juego)) { return 'defensa: en_juego'; }
    return formaTropas(c.tropas);
  }
  function formaAsalto(c) {
    if (!mismas(c, ['esquema', 'defensa', 'pack_sha', 'tropas']) || c.esquema !== 'atlas.asalto/1') { return 'asalto: forma'; }
    if (!HEX64.test(c.defensa) || !HEX64.test(c.pack_sha)) { return 'asalto: huellas'; }
    return formaTropas(c.tropas);
  }
  var RESULTADO = ['esquema', 'defensa', 'asalto', 'defensor', 'atacante', 'semilla', 'registro_sha', 'gana',
                   'rondas', 'procedencia', 'en_juego'];
  function formaResultado(c) {
    if (!mismas(c, RESULTADO) || c.esquema !== 'atlas.duelo_resultado/1') { return 'resultado: forma'; }
    var h = ['defensa', 'asalto', 'defensor', 'atacante', 'semilla', 'registro_sha'];
    for (var i = 0; i < h.length; i++) { if (!HEX64.test(c[h[i]])) { return 'resultado: ' + h[i]; } }
    if (GANA.indexOf(c.gana) < 0 || PROCEDENCIAS.indexOf(c.procedencia) < 0) { return 'resultado: enum'; }
    if (!entero(c.rondas, 1, 1000) || !formaCesta(c.en_juego)) { return 'resultado: cifras'; }
    return '';
  }

  /* --- el combate ----------------------------------------------------------------------------- */
  function unidades(ts, lado, v) {
    var A = v.combate.ataque;
    return ts.map(function (t, i) {
      var s = G.tirada(t.semilla, t.tc).stats;
      return { lado: lado, i: i, vida: s.vida, max: s.vida, arm: s.armadura, vel: s.velocidad, sig: s.sigilo,
               atk: A.base + A.aura * s.aura + A.inercia * s.inercia + A.profundidad * s.profundidad };
    });
  }
  function porMil(us) {
    var v = 0, m = 0;
    us.forEach(function (u) { v += u.vida; m += u.max; });
    return m ? Math.floor(v * 1000 / m) : 0;
  }

  /* `registro`: [ronda, lado (0 defensa, 1 asalto), atacante, objetivo, dano | -1 si esquiva]. */
  function combate(def, asa, semilla, v) {
    v = v || V;
    var P = v.combate, g = K.generador(semilla), U = [unidades(def, 0, v), unidades(asa, 1, v)];
    var todos = U[0].concat(U[1]), registro = [], ronda = 0;
    function vivos(l) { return U[l].filter(function (u) { return u.vida > 0; }); }
    while (ronda < P.rondas && vivos(0).length && vivos(1).length) {
      ronda++;
      /* Iniciativa: la velocidad manda; un empate lo deshace un sorteo por ronda. */
      var turno = todos.filter(function (u) { return u.vida > 0; })
        .map(function (u) { return { u: u, k: g.uniforme(1000000) }; })
        .sort(function (a, b) { return b.u.vel - a.u.vel || a.k - b.k || a.u.lado - b.u.lado || a.u.i - b.u.i; });
      turno.forEach(function (x) {
        var u = x.u, enemigos = vivos(1 - u.lado);
        if (u.vida <= 0 || !enemigos.length) { return; }
        var t = enemigos[0], esquiva = Math.min(P.esquiva.tope, t.sig * P.esquiva.por_sigilo);
        if (g.uniforme(1000) < esquiva) { registro.push([ronda, u.lado, u.i, t.i, -1]); return; }
        var d = Math.max(1, u.atk - Math.floor(t.arm / P.armadura_div));
        t.vida = Math.max(0, t.vida - d);
        registro.push([ronda, u.lado, u.i, t.i, d]);
      });
    }
    var vd = vivos(0).length, va = vivos(1).length, pd = porMil(U[0]), pa = porMil(U[1]);
    var gana = vd && !va ? 'defensa' : va && !vd ? 'asalto' : pd > pa ? 'defensa' : pa > pd ? 'asalto' : 'empate';
    return { esquema: 'atlas.combate/1', rondas: ronda, gana: gana, vida_por_mil: [pd, pa], registro: registro };
  }

  /* --- el duelo, de los sobres al resultado ---------------------------------------------------- */
  function resuelve(L, defensa, procedencia, v) {
    v = v || V;
    var m = S.forma(defensa) || (defensa.tipo !== 'defensa' ? 'no es una defensa' : '') || formaDefensa(defensa.cuerpo);
    if (m) { return { ok: false, motivo: m }; }
    if (L.politica.modo !== 'duelo' || L.politica.pares.length !== 2) { return { ok: false, motivo: 'la sesion no es un duelo de dos' }; }
    if (L.politica.pares.indexOf(defensa.de) < 0) { return { ok: false, motivo: 'el defensor no es par del duelo' }; }
    if (PROCEDENCIAS.indexOf(procedencia) < 0) { return { ok: false, motivo: 'procedencia' }; }
    var hd = S.huella(defensa);
    var as = S.aceptados(L, 'asalto').filter(function (s) { return s.cuerpo.defensa === hd; });
    if (as.length !== 1) { return { ok: false, motivo: as.length ? 'asalto duplicado' : 'NO_DATA · sin asalto a esta defensa' }; }
    var a = as[0], fa = formaAsalto(a.cuerpo);
    if (fa) { return { ok: false, motivo: fa }; }
    if (a.de === defensa.de) { return { ok: false, motivo: 'nadie se asalta a si mismo' }; }
    var pack = packSha(v);
    if (a.cuerpo.pack_sha !== pack || defensa.cuerpo.pack_sha !== pack) { return { ok: false, motivo: 'pack distinto: no es el mismo juego' }; }
    var sm = S.semilla(L);
    if (!sm.ok) { return sm; }
    var c = combate(defensa.cuerpo.tropas, a.cuerpo.tropas, sm.semilla, v);
    var r = { esquema: 'atlas.duelo_resultado/1', defensa: hd, asalto: S.huella(a), defensor: defensa.de, atacante: a.de,
              semilla: sm.semilla, registro_sha: K.huella(c.registro), gana: c.gana, rondas: c.rondas,
              procedencia: procedencia, en_juego: defensa.cuerpo.en_juego };
    return { ok: true, resultado: K.ordena(r), combate: c };
  }

  /* Un resultado que llega de otro aparato no se cree: se vuelve a jugar y tiene que salir igual. */
  function compruebaResultado(L, defensa, r, v) {
    var f = formaResultado(r);
    if (f) { return f; }
    var x = resuelve(L, defensa, r.procedencia, v);
    if (!x.ok) { return x.motivo; }
    return K.canon(x.resultado) === K.canon(r) ? '' : 'el resultado no sale al volver a jugarlo';
  }

  /* --- patrulla (PvE): una defensa que sale de la semilla del sector, jugable sin red ------------ */
  function patrulla(semillaSector, n, tc) {
    if (!HEX64.test(semillaSector) || !entero(n, 1, V.combate.tropas_max) || !G.TCS[tc]) { throw new Error('patrulla'); }
    var ts = [];
    for (var i = 0; i < n; i++) { ts.push({ tc: tc, semilla: K.sha(semillaSector + ':patrulla:' + i) }); }
    return { esquema: 'atlas.defensa/1', pack_sha: packSha(), tropas: ts, en_juego: { cobre: 0, luz: 0 } };
  }

  /* --- rating Elo entero ---------------------------------------------------------------------- */
  function esperado(ra, rb) {
    var d = ra - rb, e = ESPERA[Math.min(32, Math.floor(Math.abs(d) / 25))];
    return d < 0 ? 1000 - e : e;
  }
  /* `resultado` en milesimas para A: 1000 gana, 500 empate, 0 pierde. Redondeo simetrico: lo que
     gana uno lo pierde el otro, exacto. */
  function actualiza(ra, rb, resultado, partidas, v) {
    var P = (v || V).combate, prov = partidas < P.provisional_hasta, k = prov ? P.k_provisional : P.k;
    var e = esperado(ra, rb), delta = k * (resultado - e);
    var d = delta >= 0 ? Math.floor((delta + 500) / 1000) : -Math.floor((-delta + 500) / 1000);
    return { esquema: 'atlas.rating_actualizacion/1', antes: ra, despues: ra + d, k: k, esperado: e,
             resultado: resultado, provisional: prov };
  }
  /* La tabla LOCAL: resultados verificados, en orden canonico (su huella), solo de las procedencias
     que se cuentan (por defecto, `humano`). */
  function tabla(resultados, cuentan, v) {
    var P = (v || V).combate, R = {}, N = {};
    cuentan = cuentan || ['humano'];
    resultados.filter(function (r) { return !formaResultado(r) && cuentan.indexOf(r.procedencia) >= 0; })
      .map(function (r) { return { r: r, h: K.huella(r) }; })
      .sort(function (a, b) { return a.h < b.h ? -1 : a.h > b.h ? 1 : 0; })
      .forEach(function (x) {
        var r = x.r, a = r.atacante, d = r.defensor;
        [a, d].forEach(function (k) { if (!(k in R)) { R[k] = P.rating_inicial; N[k] = 0; } });
        var sa = r.gana === 'asalto' ? 1000 : r.gana === 'empate' ? 500 : 0;
        var ua = actualiza(R[a], R[d], sa, N[a], v), ud = actualiza(R[d], R[a], 1000 - sa, N[d], v);
        R[a] = ua.despues; R[d] = ud.despues; N[a]++; N[d]++;
      });
    return { ratings: R, partidas: N };
  }

  var AtlasArena = {
    PROCEDENCIAS: PROCEDENCIAS, ESPERA: ESPERA, packSha: packSha, formaDefensa: formaDefensa, formaAsalto: formaAsalto,
    formaResultado: formaResultado, combate: combate, resuelve: resuelve, compruebaResultado: compruebaResultado,
    patrulla: patrulla, esperado: esperado, actualiza: actualiza, tabla: tabla
  };
  if (enNode) { module.exports = AtlasArena; }
  else { raiz.AtlasArena = AtlasArena; }
})(this);
