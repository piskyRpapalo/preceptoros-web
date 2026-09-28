/* preceptoros.org · theGame · multijugador · el MERCADO entre personas (y, mañana, entre agentes).

   UNA OFERTA NO ES FINAL HASTA QUE FIRMA EL CARBONO (IronClaw). Viajan tres sobres:
   - `oferta` (o `contraoferta`): quien da, que da y que pide, en RECURSOS DEL MOTOR (luz, biomasa,
     cobre, flujo, oxigeno); nunca dinero real ni una moneda nueva (addendum §2.6). Caduca
     por CICLO de juego (`expira_ciclo`), nunca por reloj. `para` nombra a una persona o a
     «cualquiera». Un borrador de agente (`procedencia: 'agente_borrador'`) no se liquida: la
     persona tiene que firmarlo como suyo.
   - `aceptacion`: la otra parte, con su ciclo.
   - `liquida` las casa y escribe un ASIENTO encadenado por hash (`atlas.asiento/1`): nonce no
     reutilizado, sin doble liquidacion, sin aceptar lo propio, dentro de plazo.

   EL ASIENTO REGISTRA LA OBLIGACION FIRMADA POR LAS DOS PARTES; NO MUEVE RECURSOS. El motor no
   tiene una accion de transferencia y anadirla es un parche de motor que pide firma (auditoria
   §2.7). Sin pagos automaticos, sin agencia economica desatendida.

   PURO: ni DOM, ni red, ni reloj. El libro vive en memoria; guardarlo pide firma. */
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var HEX64 = K.HEX64, HEX32 = /^[0-9a-f]{32}$/;
  var RECURSOS = ['luz', 'biomasa', 'cobre', 'flujo', 'oxigeno'];
  var PROCEDENCIAS = ['humano', 'agente_borrador'];
  /* Defensa en profundidad: las formas son cerradas, y aun asi un nombre de valor real se rechaza. */
  var VALOR_REAL = /eur|usd|dinero|money|precio_real|pago|payment|saldo_real/i;

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }
  function claves(o, fuera) {
    var hay = '';
    (function mira(x) {
      if (Array.isArray(x)) { x.forEach(mira); return; }
      if (objeto(x)) { Object.keys(x).forEach(function (k) { if (fuera.test(k)) { hay = hay || k; } mira(x[k]); }); }
    })(o);
    return hay;
  }

  function formaCesta(c) {
    if (!objeto(c)) { return false; }
    var ks = Object.keys(c);
    return ks.length >= 1 && ks.length <= RECURSOS.length &&
      ks.every(function (k) { return RECURSOS.indexOf(k) >= 0 && entero(c[k], 1, 1000000); });
  }
  function comun(o, extra) {
    var v = claves(o, VALOR_REAL);
    if (v) { return 'valor real prohibido: ' + v; }
    if (!formaCesta(o.da) || !formaCesta(o.pide)) { return 'cesta: recursos del motor, enteros 1..1000000'; }
    if (!entero(o.expira_ciclo, 0, 1000000000)) { return 'expira_ciclo'; }
    if (!HEX32.test(o.nonce) || PROCEDENCIAS.indexOf(o.procedencia) < 0) { return 'nonce o procedencia'; }
    return extra || '';
  }
  function formaOferta(o) {
    if (!mismas(o, ['esquema', 'da', 'pide', 'expira_ciclo', 'nonce', 'para', 'procedencia']) || o.esquema !== 'atlas.oferta/1') {
      return claves(o, VALOR_REAL) ? 'valor real prohibido: ' + claves(o, VALOR_REAL) : 'oferta: forma';
    }
    return comun(o, o.para === 'cualquiera' || HEX64.test(o.para) ? '' : 'para');
  }
  function formaContraoferta(o) {
    if (!mismas(o, ['esquema', 'oferta', 'da', 'pide', 'expira_ciclo', 'nonce', 'procedencia']) || o.esquema !== 'atlas.contraoferta/1') {
      return claves(o, VALOR_REAL) ? 'valor real prohibido: ' + claves(o, VALOR_REAL) : 'contraoferta: forma';
    }
    return comun(o, HEX64.test(o.oferta) ? '' : 'oferta');
  }
  function formaAceptacion(o) {
    if (!mismas(o, ['esquema', 'oferta', 'ciclo']) || o.esquema !== 'atlas.aceptacion_oferta/1') { return 'aceptacion: forma'; }
    return HEX64.test(o.oferta) && entero(o.ciclo, 0, 1000000000) ? '' : 'aceptacion: cifras';
  }

  function libro() { return { asientos: [], cabeza: 'genesis', nonces: {}, liquidadas: {} }; }

  /* Las dos firmas ya verificadas por quien llama (`sobres.verifica`). */
  function liquida(LM, propuesta, aceptacion) {
    var m = S.forma(propuesta) || S.forma(aceptacion);
    if (m) { return { ok: false, motivo: m }; }
    var tipo = propuesta.tipo, o = propuesta.cuerpo, a = aceptacion.cuerpo;
    if (tipo !== 'oferta' && tipo !== 'contraoferta') { return { ok: false, motivo: 'no es una oferta' }; }
    if (aceptacion.tipo !== 'aceptacion') { return { ok: false, motivo: 'no es una aceptacion' }; }
    m = (tipo === 'oferta' ? formaOferta(o) : formaContraoferta(o)) || formaAceptacion(a);
    if (m) { return { ok: false, motivo: m }; }
    if (o.procedencia !== 'humano') { return { ok: false, motivo: 'borrador de agente: no es final sin firma humana' }; }
    var h = S.huella(propuesta);
    if (a.oferta !== h) { return { ok: false, motivo: 'la aceptacion es de otra oferta' }; }
    if (aceptacion.de === propuesta.de) { return { ok: false, motivo: 'nadie acepta su propia oferta' }; }
    if (tipo === 'oferta' && o.para !== 'cualquiera' && o.para !== aceptacion.de) { return { ok: false, motivo: 'la oferta era para otra persona' }; }
    if (a.ciclo > o.expira_ciclo) { return { ok: false, motivo: 'caducada: ciclo ' + a.ciclo + ' > ' + o.expira_ciclo }; }
    if (LM.liquidadas[h]) { return { ok: false, motivo: 'doble liquidacion' }; }
    var n = propuesta.de + ':' + o.nonce;
    if (LM.nonces[n] && LM.nonces[n] !== h) { return { ok: false, motivo: 'nonce reutilizado' }; }
    var asiento = K.ordena({ esquema: 'atlas.asiento/1', n: LM.asientos.length + 1, prev: LM.cabeza, oferta: h,
                             aceptacion: S.huella(aceptacion), de: propuesta.de, a: aceptacion.de, da: o.da, pide: o.pide, ciclo: a.ciclo });
    LM.asientos.push(asiento); LM.cabeza = K.huella(asiento); LM.liquidadas[h] = true; LM.nonces[n] = h;
    return { ok: true, asiento: asiento };
  }

  /* La cadena de asientos se comprueba sola: numeros seguidos y cada `prev`, la huella del anterior. */
  function compruebaCadena(asientos) {
    var prev = 'genesis';
    for (var i = 0; i < asientos.length; i++) {
      var x = asientos[i];
      if (!objeto(x) || x.esquema !== 'atlas.asiento/1' || x.n !== i + 1) { return 'asiento ' + (i + 1) + ': forma o numero'; }
      if (x.prev !== prev) { return 'asiento ' + (i + 1) + ': la cadena se rompe'; }
      prev = K.huella(x);
    }
    return '';
  }

  var AtlasMercado = {
    RECURSOS: RECURSOS, VALOR_REAL: VALOR_REAL, formaOferta: formaOferta, formaContraoferta: formaContraoferta,
    formaAceptacion: formaAceptacion, libro: libro, liquida: liquida, compruebaCadena: compruebaCadena
  };
  if (enNode) { module.exports = AtlasMercado; }
  else { raiz.AtlasMercado = AtlasMercado; }
})(this);
