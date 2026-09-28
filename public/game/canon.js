/* preceptoros.org · theGame · multijugador · lo CANONICO: los mismos bytes en cualquier aparato.

   Entre personas no se comparte estado, se comparten PRUEBAS (PLAN §2). Una prueba solo vale si
   dos aparatos sacan los mismos bytes del mismo objeto. Por eso:
   - `canon(x)`: JSON con las claves ordenadas, sin espacios, SOLO ENTEROS seguros (un decimal no
     tiene la misma forma en todos los motores y aqui se rechaza) y todo lo que no es ASCII
     escapado (`\uXXXX`). Es el texto que se firma y se resume.
   - `huella(x)`: sha256 de `canon(x)`, con el SHA-256 puro de `atlas-coord.js`: el mismo en la
     pestana, en node y en el rack.
   - `generador(semilla)`: PRNG entero (mulberry32 sembrado con los 32 primeros bits de una
     semilla de 64 hex). `uniforme(n)` usa RECHAZO: sin el sesgo del modulo, las odds que se
     ensenan son exactamente los pesos enteros.
   - `loteria(pesos, g)`: la loteria entera acumulada del brief (§5): el primer cubo cuyo peso
     acumulado supera el sorteo.

   PURO: ni DOM, ni red, ni reloj, ni azar del sistema. La semilla la trae quien llama (commit-
   reveal en `sobres.js`). Lo carga quien lo necesite, a demanda; la puerta del juego no. */
(function (raiz) {
  'use strict';

  var C = (typeof module === 'object' && module.exports) ? require('../assets/atlas-coord.js') : raiz.AtlasCoord;

  function ascii(s) {
    return s.replace(/[^\x20-\x7e]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); });
  }

  function canon(x) {
    if (x === null) { return 'null'; }
    if (typeof x === 'boolean') { return x ? 'true' : 'false'; }
    if (typeof x === 'number') {
      if (!Number.isSafeInteger(x)) { throw new RangeError('canon: solo enteros seguros (' + x + ')'); }
      return String(x);
    }
    if (typeof x === 'string') { return ascii(JSON.stringify(x)); }
    if (Array.isArray(x)) { return '[' + x.map(canon).join(',') + ']'; }
    if (typeof x === 'object') {
      return '{' + Object.keys(x).sort().map(function (k) { return ascii(JSON.stringify(k)) + ':' + canon(x[k]); }).join(',') + '}';
    }
    throw new TypeError('canon: tipo ' + typeof x);
  }

  function sha(texto) { return C.sha256(texto); }
  function huella(x) { return sha(canon(x)); }

  /* Copia con las claves en orden canonico: `JSON.stringify` de la copia == `canon` del original
     (para quien firme con `Identity.firmar`, que firma `JSON.stringify`). */
  function ordena(x) {
    if (Array.isArray(x)) { return x.map(ordena); }
    if (x && typeof x === 'object') {
      var o = {};
      Object.keys(x).sort().forEach(function (k) { o[k] = ordena(x[k]); });
      return o;
    }
    return x;
  }

  var HEX64 = /^[0-9a-f]{64}$/;

  function generador(semilla) {
    if (!HEX64.test(semilla || '')) { throw new Error('semilla: 64 hex'); }
    var a = parseInt(semilla.slice(0, 8), 16) | 0;
    function u32() {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return (t ^ t >>> 14) >>> 0;
    }
    /* Entero uniforme en [0, n) SIN sesgo: se descartan los sorteos del ultimo tramo incompleto. */
    function uniforme(n) {
      if (!Number.isSafeInteger(n) || n < 1 || n > 4294967296) { throw new RangeError('uniforme: n ' + n); }
      var tope = 4294967296 - (4294967296 % n), x;
      do { x = u32(); } while (x >= tope);
      return x % n;
    }
    return { u32: u32, uniforme: uniforme };
  }

  /* Pesos enteros >= 0 con suma > 0 -> indice elegido. */
  function loteria(pesos, g) {
    var total = 0;
    pesos.forEach(function (p) {
      if (!Number.isSafeInteger(p) || p < 0) { throw new RangeError('loteria: peso ' + p); }
      total += p;
    });
    if (total < 1) { throw new RangeError('loteria: sin peso'); }
    var r = g.uniforme(total), acum = 0;
    for (var i = 0; i < pesos.length; i++) { acum += pesos[i]; if (r < acum) { return i; } }
    throw new Error('loteria: inalcanzable');
  }

  /* Odds en puntos basicos (por 10 000), redondeadas hacia abajo; el resto se dice aparte para
     que la suma ensenada no mienta. */
  function puntosBasicos(pesos) {
    var total = pesos.reduce(function (s, p) { return s + p; }, 0);
    var pb = pesos.map(function (p) { return Math.floor(p * 10000 / total); });
    return { pb: pb, resto: 10000 - pb.reduce(function (s, p) { return s + p; }, 0) };
  }

  /* Suma saturada: un entero nunca se desborda en silencio. */
  function satura(x, min, max) { return x < min ? min : x > max ? max : x; }

  var AtlasCanon = { canon: canon, huella: huella, sha: sha, ordena: ordena, generador: generador,
                     loteria: loteria, puntosBasicos: puntosBasicos, satura: satura, HEX64: HEX64 };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCanon; }
  else { raiz.AtlasCanon = AtlasCanon; }
})(this);
