/* preceptoros.org · theGame · el GENOMA de SISIL: lo unico que el laboratorio puede proponer cambiar.

   UN GENOMA NO ES CODIGO: son parametros ENTEROS con limites DECLARADOS aqui, agrupados en los dominios
   que el addendum permite (§4): incubacion, rareza, afijos, presupuesto, armonicos, combate, mercado,
   novedad, legibilidad. Un parametro que no esta en `LIMITES` no existe; uno fuera de su banda, o con
   decimales, tumba el genoma. Los dominios PROHIBIDOS (§5, §9) se rechazan por nombre aunque vinieran
   dentro de un dominio permitido: quien puede invocar, lo solo-humano, costes o fisica del motor,
   firma, red, persistencia, precache, presupuestos de peso, reloj, odds ocultas, adoptar o invocar
   solo, dinero real, rutas, hosts, IPs, datos personales.

   `paramHash` es la huella canonica de los dominios: dos genomas iguales con las claves en otro orden
   tienen la misma. La maquina MEJORA PROPUESTAS; la persona ADOPTA mejoras con su firma. Este fichero
   no adopta, no activa y no guarda nada. PURO: ni DOM, ni red, ni reloj, ni azar. */
(function (raiz) {
  'use strict';

  var K = (typeof module === 'object' && module.exports) ? require('./canon.js') : raiz.AtlasCanon;

  function tc(prefijo, banda) {
    var o = {};
    ['tc1', 'tc2', 'tc3', 'tc4'].forEach(function (t) { o[prefijo + t] = banda; });
    return o;
  }
  function une() {
    var o = {};
    Array.prototype.forEach.call(arguments, function (x) { Object.keys(x).forEach(function (k) { o[k] = x[k]; }); });
    return o;
  }
  /* Bandas [min, max] de cada parametro permitido. Enteros; los pesos, en puntos basicos. */
  var LIMITES = {
    incubacion: une(tc('ciclos_min_', [1, 5000]), tc('ciclos_max_', [1, 5000])),
    rareza: une(tc('normal_', [0, 10000]), tc('magico_', [0, 10000]), tc('raro_', [0, 10000]), tc('unico_', [0, 10000])),
    afijos: { max_magico: [1, 2], max_raro: [2, 3], max_unico: [2, 3], fuerza_banda: [1, 20] },
    presupuesto: { suma_normal: [1, 2000], suma_magico: [1, 2000], suma_raro: [1, 2000], suma_unico: [1, 2000] },
    armonicos: { terminos_min: [1, 8], terminos_max: [1, 8], amplitud_max: [1, 64], fase_max: [0, 63] },
    combate: { k: [8, 64], rondas: [5, 100], esquiva_tope: [0, 500], poder_proxy_version: [1, 9] },
    mercado: { expira_max_ciclos: [1, 100000], escasez_banda: [0, 1000] },
    novedad: { enfriamiento_ciclos: [1, 100000], rumor_por_mil: [0, 200], sequia_max_ciclos: [1, 100000] },
    legibilidad: { odds_precision_pb: [1, 100], explicacion_nivel: [1, 3] }
  };
  var PROHIBIDO = new RegExp('invoca|invocation|human_only|humano_solo|motor|coste|cost|fisica|physics|firma|signature|' +
    'red$|network|fetch|persist|indexeddb|precache|peso_b|gzip|budget_bytes|reloj|clock|timer|wall|fecha|date|' +
    'oculta|hidden|float|auto_|adopt|dinero|money|real_money|eur|usd|url|remote|' +
    'host|ip$|path|ruta_privada|personal|email|correo|payload|code|codigo|script|leaderboard|clasificacion_central', 'i');
  var PROCEDENCIAS = ['humano', 'piloto_base', 'denso', 'lora', 'sintetico', 'emulado'];

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  function valida(g) {
    if (!objeto(g) || Object.keys(g).sort().join() !== 'base,dominios,esquema,procedencia' || g.esquema !== 'atlas.genoma/1') {
      return 'genoma: forma';
    }
    if (!K.HEX64.test(g.base)) { return 'genoma: base (param_hash de la linea base)'; }
    if (PROCEDENCIAS.indexOf(g.procedencia) < 0) { return 'genoma: procedencia'; }
    if (!objeto(g.dominios) || !Object.keys(g.dominios).length) { return 'genoma: sin dominios'; }
    var ds = Object.keys(g.dominios);
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i], ps = g.dominios[d];
      if (PROHIBIDO.test(d)) { return 'dominio prohibido: ' + d; }
      if (!LIMITES[d]) { return 'dominio desconocido: ' + d; }
      if (!objeto(ps) || !Object.keys(ps).length) { return d + ': sin parametros'; }
      var ks = Object.keys(ps);
      for (var j = 0; j < ks.length; j++) {
        var k = ks[j], v = ps[k], b = LIMITES[d][k];
        if (PROHIBIDO.test(k)) { return 'parametro prohibido: ' + d + '.' + k; }
        if (!b) { return 'parametro desconocido: ' + d + '.' + k; }
        if (!Number.isSafeInteger(v)) { return d + '.' + k + ': solo enteros'; }
        if (v < b[0] || v > b[1]) { return d + '.' + k + ': fuera de [' + b[0] + ', ' + b[1] + ']'; }
      }
    }
    var inc = g.dominios.incubacion;
    if (inc) {
      for (var t = 1; t <= 4; t++) {
        var mn = inc['ciclos_min_tc' + t], mx = inc['ciclos_max_tc' + t];
        if (mn !== undefined && mx !== undefined && mn > mx) { return 'incubacion: min > max en tc' + t; }
      }
    }
    return '';
  }

  function paramHash(g) { return K.huella(g.dominios); }

  var AtlasGenoma = { LIMITES: LIMITES, PROHIBIDO: PROHIBIDO, PROCEDENCIAS: PROCEDENCIAS, valida: valida, paramHash: paramHash };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasGenoma; }
  else { raiz.AtlasGenoma = AtlasGenoma; }
})(this);
