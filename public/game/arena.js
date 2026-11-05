(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var G = enNode ? require('./gacha.js') : raiz.AtlasGacha;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var Rt = enNode ? require('./rating.js') : raiz.AtlasRating;
  var TL = enNode ? require('./taller.js') : raiz.AtlasTaller;
  var CT = enNode ? require('./combate_ticks.js') : raiz.AtlasCombateTicks;
  var HEX64 = K.HEX64;
  var PROCEDENCIAS = ['humano', 'piloto_base', 'denso', 'lora', 'sintetico'];
  var GANA = ['defensa', 'asalto', 'empate'], FINALES = ['combate', 'abandono'];

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }

    function packSha(v) {
    v = v || V;
    return K.huella({ version: v.version, tcs: v.tcs, prefijos: v.prefijos, sufijos: v.sufijos, base: v.base,
                      simetria: v.simetria, terminos: v.terminos, aristas: v.aristas, rareza_aristas: v.rareza_aristas, forma: v.forma,
                      army_tope: v.army_tope, combate: v.combate, taller: v.taller,
                      patrullas: v.patrullas });
  }

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
                   'rondas', 'procedencia', 'en_juego', 'final'];
  function formaResultado(c) {
    if (!mismas(c, RESULTADO) || c.esquema !== 'atlas.duelo_resultado/1') { return 'resultado: forma'; }
    var h = ['defensa', 'asalto', 'defensor', 'atacante', 'semilla', 'registro_sha'];
    for (var i = 0; i < h.length; i++) { if (!HEX64.test(c[h[i]])) { return 'resultado: ' + h[i]; } }
    if (GANA.indexOf(c.gana) < 0 || PROCEDENCIAS.indexOf(c.procedencia) < 0 || FINALES.indexOf(c.final) < 0) { return 'resultado: enum'; }
    if (!entero(c.rondas, c.final === 'abandono' ? 0 : 1, 1000) || !formaCesta(c.en_juego)) { return 'resultado: cifras'; }
    return '';
  }

    function combate(def, asa, semilla, v) { return CT.combate(def, asa, semilla, v); }

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
              procedencia: procedencia, en_juego: defensa.cuerpo.en_juego, final: 'combate' };
    return { ok: true, resultado: K.ordena(r), combate: c };
  }

    function abandono(L, defensa, quien) {
    var m = S.forma(defensa) || (defensa.tipo !== 'defensa' ? 'no es una defensa' : '');
    if (m) { return { ok: false, motivo: m }; }
    var hd = S.huella(defensa), as = S.aceptados(L, 'asalto').filter(function (s) { return s.cuerpo.defensa === hd; });
    if (as.length !== 1 || L.politica.modo !== 'duelo') { return { ok: false, motivo: 'NO_DATA · sin duelo que reclamar' }; }
    var a = as[0], otro = quien === a.de ? defensa.de : a.de;
    if (quien !== a.de && quien !== defensa.de) { return { ok: false, motivo: 'quien reclama no es par del duelo' }; }
    var cs = S.conjunto(L), revs = {};
    S.aceptados(L, 'revelacion').forEach(function (s) { revs[s.de] = true; });
    if (!cs[quien] || !revs[quien]) { return { ok: false, motivo: 'quien reclama no se comprometio y revelo' }; }
    if (!cs[otro]) { return { ok: false, motivo: 'el otro no llego a comprometerse: no hay duelo que abandonar' }; }
    if (revs[otro]) { return { ok: false, motivo: 'el otro ya revelo: no hay abandono' }; }
    var r = { esquema: 'atlas.duelo_resultado/1', defensa: hd, asalto: S.huella(a), defensor: defensa.de, atacante: a.de,
              semilla: S.huellaConjunto(cs), registro_sha: K.huella([]), gana: quien === a.de ? 'asalto' : 'defensa',
              rondas: 0, procedencia: 'humano', en_juego: defensa.cuerpo.en_juego, final: 'abandono' };
    return { ok: true, resultado: K.ordena(r) };
  }

    function compruebaResultado(L, defensa, r, v) {
    var f = formaResultado(r);
    if (f) { return f; }
    var x = r.final === 'abandono' ? abandono(L, defensa, r.gana === 'asalto' ? r.atacante : r.defensor)
      : resuelve(L, defensa, r.procedencia, v);
    if (!x.ok) { return x.motivo; }
    return K.canon(x.resultado) === K.canon(r) ? '' : 'el resultado no sale al volver a jugarlo';
  }

    function patrulla(semillaSector, n, tc) {
    if (!HEX64.test(semillaSector) || !entero(n, 1, V.combate.tropas_max) || !G.TCS[tc]) { throw new Error('patrulla'); }
    var ts = [];
    for (var i = 0; i < n; i++) { ts.push({ tc: tc, semilla: K.sha(semillaSector + ':patrulla:' + i) }); }
    return { esquema: 'atlas.defensa/1', pack_sha: packSha(), tropas: ts, en_juego: { cobre: 0, luz: 0 } };
  }

    function lugares(v) {
    return (v || V).patrullas.map(function (p) {
      var s = K.sha('atlas.patrulla/1:' + p.id);
      return { id: p.id, tc: p.tc, n: p.n, semilla: s, defensa: patrulla(s, p.n, p.tc) };
    });
  }

  var AtlasArena = {
    PROCEDENCIAS: PROCEDENCIAS, ESPERA: Rt.ESPERA, packSha: packSha, formaDefensa: formaDefensa, formaAsalto: formaAsalto,
    formaResultado: formaResultado, combate: combate, resuelve: resuelve, compruebaResultado: compruebaResultado,
    patrulla: patrulla, lugares: lugares, abandono: abandono, esperado: Rt.esperado, actualiza: Rt.actualiza,
    tabla: function (rs, cuentan, v) { return Rt.tabla(rs, cuentan, v, formaResultado); }
  };
  if (enNode) { module.exports = AtlasArena; }
  else { raiz.AtlasArena = AtlasArena; }
})(this);
