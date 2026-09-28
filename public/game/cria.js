/* preceptoros.org · theGame · la CRIA SOBERANA: el paquete de calibracion de huevos y tropas, validado.

   «El huevo no es una tragaperras: es un acto de creacion firmado, legible y reproducible» (addendum
   SISIL + Sovereign Brood). Este fichero NO calibra nada ni adopta nada: VALIDA. Un paquete de cria
   (`atlas.cria_calibracion/1`) es JSON declarativo con enteros acotados:
   - `rareza`: pesos enteros por TC, en el orden de `gacha.RAREZAS` (normal, magico, raro, unico);
   - `incubacion`: ciclos minimos y maximos por TC; SOLO ciclos de juego, ningun reloj;
   - `afijos`: cuantos por rareza y que prefijo excluye a que sufijo;
   - `presupuesto`: tope de la suma de stats por rareza y banda [min, max] por stat;
   - `armonicos`: terminos por rareza, amplitud y fase maximas, simetria por rareza.

   PUERTAS DURAS (`puertas`): lo que tumba un paquete aunque todo lo demas mejore. Invocar o adoptar
   sin persona, reloj de pared, decimales con autoridad, odds sin declarar, dinero real o cripto,
   tiradas de pago, FOMO, rachas que se pierden, cuentas atras enganosas, codigo o contenido remoto,
   costes del motor. Se buscan por NOMBRE de campo y por FORMA de valor, en todo el arbol.

   `desdeValores(V)` escribe el juego de hoy (`valores.js` + `gacha.js`) como paquete: la linea base
   con la que se compara cualquier propuesta. `compruebaTropa` mira que una tropa cumpla un paquete.
   PURO: ni DOM, ni red, ni reloj, ni azar. Nada de esto entra en la puerta del juego. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var G = enNode ? require('./gacha.js') : raiz.AtlasGacha;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var RAREZAS = G.RAREZAS, TCS = Object.keys(G.TCS), STATS = G.STATS;
  var CLAVES = ['esquema', 'version', 'base', 'rareza', 'incubacion', 'afijos', 'presupuesto', 'armonicos'];

  /* Nombres que ningun paquete puede llevar (addendum §5 y §9), y formas de valor prohibidas. */
  var NOMBRE_PROHIBIDO = new RegExp('invoca|invocation|human_only|adopt|auto_|reloj|clock|timer|timestamp|fecha|date|' +
    'segundos|seconds|_ms$|wall|countdown|cuenta_atras|streak|racha|fomo|reroll|pago|paid|payment|precio_real|dinero|money|' +
    'eur|usd|cripto|crypto|wallet|token|url|http|host|ip$|ruta_privada|private_path|codigo|code|script|payload|coste|cost|' +
    'probabilidad_float|float|motor|firma|signature|red$|network|precache|indexeddb|persist', 'i');
  var VALOR_PROHIBIDO = /https?:|javascript:|<script|=>|\bfunction\b|\{\{/i;

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }
  function banda(b, min, max) { return Array.isArray(b) && b.length === 2 && entero(b[0], min, max) && entero(b[1], b[0], max); }
  function porRareza(o, f) { return mismas(o, RAREZAS) && RAREZAS.every(function (r) { return f(o[r]); }); }
  function porTc(o, f) { return mismas(o, TCS) && TCS.every(function (t) { return f(o[t]); }); }

  /* --- puertas duras: se miran ANTES que la forma, en todo el arbol ---------------------------- */
  function puertas(p) {
    var fallos = [];
    (function mira(x, camino) {
      if (typeof x === 'number' && !Number.isSafeInteger(x)) { fallos.push('decimal con autoridad en ' + camino); }
      if (typeof x === 'string' && VALOR_PROHIBIDO.test(x)) { fallos.push('codigo o contenido remoto en ' + camino); }
      if (Array.isArray(x)) { x.forEach(function (y, i) { mira(y, camino + '[' + i + ']'); }); }
      else if (objeto(x)) {
        Object.keys(x).forEach(function (k) {
          if (NOMBRE_PROHIBIDO.test(k)) { fallos.push('campo prohibido: ' + camino + '.' + k); }
          mira(x[k], camino + '.' + k);
        });
      }
    })(p, 'paquete');
    if (objeto(p) && objeto(p.rareza)) {
      TCS.forEach(function (t) { if (!(t in p.rareza)) { fallos.push('odds sin declarar para ' + t); } });
    }
    return { ok: !fallos.length, fallos: fallos };
  }

  /* --- la forma ------------------------------------------------------------------------------- */
  function forma(p) {
    var pu = puertas(p);
    if (!pu.ok) { return 'puerta dura: ' + pu.fallos[0]; }
    if (!mismas(p, CLAVES) || p.esquema !== 'atlas.cria_calibracion/1') { return 'cria: forma'; }
    if (typeof p.version !== 'string' || p.version.length < 1 || p.version.length > 40 ||
        typeof p.base !== 'string' || p.base.length < 1 || p.base.length > 40) { return 'cria: version o base'; }
    if (!porTc(p.rareza, function (w) {
      return Array.isArray(w) && w.length === RAREZAS.length && w.every(function (x) { return entero(x, 0, 1000000); }) &&
        w.reduce(function (s, x) { return s + x; }, 0) > 0;
    })) { return 'cria: rareza (pesos enteros por TC, suma > 0)'; }
    if (!porTc(p.incubacion, function (b) { return banda(b, 1, 100000); })) { return 'cria: incubacion (ciclos [min, max])'; }
    var a = p.afijos;
    if (!mismas(a, ['max', 'exclusiones']) || !porRareza(a.max, function (n) { return entero(n, 0, 3); }) ||
        !Array.isArray(a.exclusiones) || a.exclusiones.length > 16 ||
        !a.exclusiones.every(function (e) { return Array.isArray(e) && e.length === 2 && e[0] in G.PREFIJOS && e[1] in G.SUFIJOS; })) {
      return 'cria: afijos';
    }
    var b = p.presupuesto;
    if (!mismas(b, ['suma', 'por_stat']) || !porRareza(b.suma, function (n) { return entero(n, 1, 100000); }) ||
        !mismas(b.por_stat, STATS) || !STATS.every(function (s) { return banda(b.por_stat[s], 0, 100000); })) {
      return 'cria: presupuesto';
    }
    var h = p.armonicos;
    if (!mismas(h, ['terminos', 'amplitud_max', 'fase_max', 'simetria']) ||
        !porRareza(h.terminos, function (x) { return banda(x, 1, 8); }) || !entero(h.amplitud_max, 1, 64) ||
        !entero(h.fase_max, 0, 63) || !porRareza(h.simetria, function (s) { return entero(s, 1, 12); })) {
      return 'cria: armonicos';
    }
    return '';
  }

  /* --- el juego de hoy como paquete (la linea base) ------------------------------------------- */
  function desdeValores(v) {
    v = v || V;
    var rar = {}, inc = {}, max = {}, suma = {}, term = {}, por = {};
    TCS.forEach(function (t) { rar[t] = G.odds(t); inc[t] = [v.tcs[t].incuba, v.tcs[t].incuba]; });
    RAREZAS.forEach(function (r) {
      max[r] = { normal: 0, magico: 2, raro: 3, unico: 3 }[r];
      term[r] = [v.terminos[r], v.terminos[r]];
    });
    STATS.forEach(function (s) { por[s] = [0, 100000]; });
    RAREZAS.forEach(function (r) { suma[r] = 100000; });
    return K.ordena({ esquema: 'atlas.cria_calibracion/1', version: 'base-' + v.version, base: v.version, rareza: rar,
                      incubacion: inc, afijos: { max: max, exclusiones: [] }, presupuesto: { suma: suma, por_stat: por },
                      armonicos: { terminos: term, amplitud_max: 24, fase_max: 63, simetria: v.simetria } });
  }

  /* Odds de un paquete en puntos basicos (por 10 000), exactas, y el resto dicho aparte. */
  function odds(p, tc) { return K.puntosBasicos(p.rareza[tc]); }

  /* Una tropa contra un paquete: rareza conocida, afijos dentro del maximo y sin exclusiones, suma y
     bandas de stats, numero de terminos, amplitud, fase y simetria (k = 1 +/- s*j). */
  function compruebaTropa(t, p) {
    if (!t || RAREZAS.indexOf(t.rareza) < 0) { return 'tropa: rareza'; }
    var n = (t.prefijo ? 1 : 0) + (t.sufijo ? 1 : 0), ex = p.afijos.exclusiones;
    if (n > p.afijos.max[t.rareza]) { return 'tropa: afijos de mas'; }
    if (ex.some(function (e) { return e[0] === t.prefijo && e[1] === t.sufijo; })) { return 'tropa: afijos excluidos'; }
    var suma = 0;
    for (var i = 0; i < STATS.length; i++) {
      var v = t.stats[STATS[i]], bd = p.presupuesto.por_stat[STATS[i]];
      if (!entero(v, bd[0], bd[1])) { return 'tropa: ' + STATS[i] + ' fuera de su banda'; }
      suma += v;
    }
    if (suma > p.presupuesto.suma[t.rareza]) { return 'tropa: pasa el presupuesto (' + suma + ')'; }
    var a = t.armonicos, h = p.armonicos, tb = h.terminos[t.rareza], s = h.simetria[t.rareza];
    if (!Array.isArray(a) || a.length < tb[0] || a.length > tb[1]) { return 'tropa: numero de terminos'; }
    for (var j = 0; j < a.length; j++) {
      var x = a[j];
      if (!x.every(Number.isSafeInteger)) { return 'tropa: armonico no entero'; }
      if (Math.abs(x[1]) > h.amplitud_max || Math.abs(x[2]) > h.amplitud_max) { return 'tropa: amplitud'; }
      if (x[3] < 0 || x[3] > h.fase_max) { return 'tropa: fase'; }
      if (j && Math.abs(x[0] - 1) % s !== 0) { return 'tropa: simetria'; }
    }
    return '';
  }

  var AtlasCria = { NOMBRE_PROHIBIDO: NOMBRE_PROHIBIDO, puertas: puertas, forma: forma, desdeValores: desdeValores,
                    odds: odds, compruebaTropa: compruebaTropa };
  if (enNode) { module.exports = AtlasCria; }
  else { raiz.AtlasCria = AtlasCria; }
})(this);
