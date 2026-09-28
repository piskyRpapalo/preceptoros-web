/* preceptoros.org · theGame · multijugador · el PAQUETE en el cable: su forma y su ENLACE.

   Un paquete `atlas.paquete_mp/1` lleva sobres ya firmados y la politica de su sesion (`duelo.js` los
   produce y los consume). Aqui vive su FORMA, cerrada (lo que no cabe no entra), y su version para un
   ENLACE (sugerencia firmada por el Soberano, 2026-09-28: «el paquete por QR, cara a cara»): el mismo
   paquete, sin la defensa si es un desafio (quien lo recibe ya la tiene, porque es SUYA, y se comprueba
   por su huella), comprimido y en base64url detras de `#thegame/duelo=`. El fragmento de una direccion
   no sale nunca hacia el servidor: el enlace viaja de un telefono a otro (un QR en pantalla, un mensaje)
   y la web lo abre sin pedirle nada a nadie. Abrir no es creer: `duelo.js` verifica cada firma.

   PURO: la compresion se inyecta (CompressionStream en la pestana, zlib en node). Ni DOM, ni red. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var TIPOS = ['defensa', 'desafio', 'respuesta', 'revelacion', 'resultado'];
  var TOPE_B = 65536, PREFIJO = '#thegame/duelo=';
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  function paquete(tipo, politica, sobres, defensa) {
    return K.ordena({ esquema: 'atlas.paquete_mp/1', tipo: tipo, politica: politica, sobres: sobres, defensa: defensa || null });
  }
  function formaPaquete(p) {
    if (!objeto(p) || Object.keys(p).sort().join() !== 'defensa,esquema,politica,sobres,tipo' || p.esquema !== 'atlas.paquete_mp/1') {
      return 'paquete: forma';
    }
    if (TIPOS.indexOf(p.tipo) < 0) { return 'paquete: tipo'; }
    var m = S.formaPolitica(p.politica);
    if (m) { return m; }
    if (!Array.isArray(p.sobres) || p.sobres.length < 1 || p.sobres.length > 8) { return 'paquete: sobres'; }
    for (var i = 0; i < p.sobres.length; i++) { m = S.forma(p.sobres[i]); if (m) { return m; } }
    if (p.defensa !== null && !(objeto(p.defensa) && Object.keys(p.defensa).sort().join() === 'politica,sobre' &&
        !S.formaPolitica(p.defensa.politica) && !S.forma(p.defensa.sobre))) { return 'paquete: defensa'; }
    try { if (K.canon(p).length > TOPE_B) { return 'paquete: pasa de ' + TOPE_B + ' B'; } }
    catch (x) { return 'paquete: ' + x.message; }
    return '';
  }

  /* base64url sin relleno, puro: bytes <-> texto. */
  function aTexto(b) {
    var s = '', i, n;
    for (i = 0; i + 2 < b.length; i += 3) {
      n = b[i] << 16 | b[i + 1] << 8 | b[i + 2];
      s += B64[n >> 18 & 63] + B64[n >> 12 & 63] + B64[n >> 6 & 63] + B64[n & 63];
    }
    if (b.length - i === 1) { n = b[i] << 16; s += B64[n >> 18 & 63] + B64[n >> 12 & 63]; }
    if (b.length - i === 2) { n = b[i] << 16 | b[i + 1] << 8; s += B64[n >> 18 & 63] + B64[n >> 12 & 63] + B64[n >> 6 & 63]; }
    return s;
  }
  function aBytes(s) {
    if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) { throw new Error('enlace: base64url roto'); }
    var out = new Uint8Array(Math.floor(s.length * 3 / 4)), acc = 0, bits = 0, j = 0;
    for (var i = 0; i < s.length; i++) {
      acc = (acc << 6 | B64.indexOf(s[i])) & 0xFFFFFF; bits += 6;
      if (bits >= 8) { bits -= 8; out[j++] = acc >> bits & 255; }
    }
    return out;
  }

  /* Delgado para el enlace: un desafio viaja sin la defensa, solo con su huella. */
  function delgado(p) {
    var m = formaPaquete(p);
    if (m) { throw new Error(m); }
    var d = JSON.parse(K.canon(p));
    if (d.tipo === 'desafio' && d.defensa) { d.defensa = { huella: S.huella(d.defensa.sobre) }; }
    return K.canon(d);
  }
  /* Y de vuelta: la defensa de un desafio sale de la TUYA (`mia`), si su huella casa. */
  function grueso(texto, mia) {
    var d;
    try { d = JSON.parse(texto); } catch (x) { throw new Error('enlace: no es JSON'); }
    if (objeto(d) && objeto(d.defensa) && Object.keys(d.defensa).join() === 'huella') {
      if (!mia || S.huella(mia.sobre) !== d.defensa.huella) { throw new Error('ese desafio no es a tu defensa'); }
      d.defensa = { politica: mia.politica, sobre: mia.sobre };
    }
    var m = formaPaquete(d);
    if (m) { throw new Error(m); }
    return d;
  }

  /* El fragmento: 'z' + base64url(deflate) o, sin compresor, 'j' + base64url(json). */
  function aEnlace(p, comprime) {
    var b = new TextEncoder().encode(delgado(p));
    return Promise.resolve(comprime ? comprime(b) : null).then(function (z) {
      return PREFIJO + (z ? 'z' + aTexto(z) : 'j' + aTexto(b));
    });
  }
  function esEnlace(h) { return typeof h === 'string' && h.indexOf(PREFIJO) === 0; }
  function deEnlace(h, descomprime, mia) {
    if (!esEnlace(h)) { return Promise.reject(new Error('no es un enlace de duelo')); }
    var c = h.charAt(PREFIJO.length), b;
    if (c !== 'z' && c !== 'j') { return Promise.reject(new Error('enlace: formato')); }
    if (c === 'z' && !descomprime) { return Promise.reject(new Error('NO_DATA · sin descompresor')); }
    try { b = aBytes(h.slice(PREFIJO.length + 1)); } catch (x) { return Promise.reject(x); }
    return Promise.resolve(c === 'z' ? descomprime(b) : b).then(function (u) {
      return grueso(new TextDecoder().decode(u), mia);
    });
  }

  var AtlasEnlace = { TIPOS: TIPOS, PREFIJO: PREFIJO, paquete: paquete, formaPaquete: formaPaquete, aTexto: aTexto,
                      aBytes: aBytes, delgado: delgado, grueso: grueso, aEnlace: aEnlace, esEnlace: esEnlace, deEnlace: deEnlace };
  if (enNode) { module.exports = AtlasEnlace; }
  else { raiz.AtlasEnlace = AtlasEnlace; }
})(this);
