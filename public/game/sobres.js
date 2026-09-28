/* preceptoros.org · theGame · multijugador · los SOBRES firmados y la SEMILLA que nadie elige a solas.

   SIN SERVIDOR (PLAN §2): entre dos aparatos viajan sobres `atlas.sobre/1`, cada uno firmado con la
   identidad Ed25519 de quien lo manda. La firma cubre `mensaje(s)`: el JSON canonico del sobre sin
   su campo `firma` (`canon.js`). En la pestana se firma con `Identity.firmarTexto(mensaje(s))`.

   EL LIBRO DE UNA SESION (`libro` / `anota`) acepta un sobre solo si:
   - su forma es exacta y la sesion es la suya (un sobre de otra sesion es una REPLICA);
   - quien lo manda es par de la sesion;
   - su `seq` es el siguiente y su `prev` enlaza con la huella del anterior del mismo autor;
   - no lo habia visto ya y no pasa de los bytes ni de las operaciones de la politica.
   Dos sobres del mismo autor con el mismo `seq` y distinto cuerpo son una PRUEBA DE TRAMPA (dos
   firmas suyas que se contradicen): se guardan las dos huellas, que cualquiera puede verificar, y
   ese autor queda fuera.
   La firma la verifica quien llama ANTES de anotar (`verifica`, con la plataforma que haya:
   WebCrypto en la pestana, `crypto` en node). Este fichero no elige plataforma.

   COMMIT-REVEAL (brief §5; sustituye a la semilla del PLAN §3, que era sha256 de dos firmas y la
   podia moldear quien firmaba el ultimo). Cada par elige `r` al azar en su aparato, publica
   `compromiso(r, clave, sesion)` y, cuando todos se han comprometido, revela `r`. La revelacion
   ATESTIGUA el conjunto de compromisos que vio: un compromiso tardio, hecho despues de ver una
   revelacion, invalida la semilla en vez de elegirla. Limite dicho: el ultimo en revelar puede
   ABORTAR (no revelar), no ELEGIR; su compromiso sin revelacion queda a la vista como deuda.

   PURO: ni DOM, ni red, ni reloj, ni azar (el `r` lo pone quien llama). Nada se guarda. */
(function (raiz) {
  'use strict';

  var K = (typeof module === 'object' && module.exports) ? require('./canon.js') : raiz.AtlasCanon;
  var HEX64 = K.HEX64, HEX32 = /^[0-9a-f]{32}$/, FIRMA = /^ed25519:[0-9a-f]{128}$/;
  var TECHO = 16384;
  /* tipo del sobre -> esquema de su cuerpo. */
  var CUERPO = {
    compromiso: 'atlas.compromiso/1', revelacion: 'atlas.revelacion/1', defensa: 'atlas.defensa/1',
    asalto: 'atlas.asalto/1', resultado: 'atlas.duelo_resultado/1', oferta: 'atlas.oferta/1',
    contraoferta: 'atlas.contraoferta/1', aceptacion: 'atlas.aceptacion_oferta/1', mgno_op: 'atlas.mgno_operacion/1'
  };
  var CLAVES = ['esquema', 'tipo', 'sesion', 'de', 'pseudonimo', 'seq', 'prev', 'contenido_v', 'cuerpo', 'firma'];
  var MODOS = ['duelo', 'tablon', 'cooperativo', 'competitivo', 'hibrido', 'mercado'];
  var POLITICA = ['esquema', 'modo', 'pares', 'quorum', 'max_bytes', 'max_ops', 'semilla', 'conflicto', 'contenido_v', 'nonce'];
  /* La misma guarda que las opiniones: ni rutas, ni correos, ni enlaces, ni IPs, ni etiquetas. */
  var PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|\b\d{1,3}(\.\d{1,3}){3}\b|[<>]/i;

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }
  function cadena(x, min, max) { return typeof x === 'string' && x.length >= min && x.length <= max; }

  /* --- la politica de sesion (`atlas.mp_sesion/1`); su huella ES la sesion ----------------------- */
  function formaPolitica(p) {
    if (!mismas(p, POLITICA) || p.esquema !== 'atlas.mp_sesion/1') { return 'politica: forma'; }
    if (MODOS.indexOf(p.modo) < 0) { return 'politica: modo'; }
    if (!Array.isArray(p.pares) || p.pares.length < 1 || p.pares.length > 16) { return 'politica: pares'; }
    for (var i = 0; i < p.pares.length; i++) {
      if (!HEX64.test(p.pares[i]) || (i && p.pares[i] <= p.pares[i - 1])) { return 'politica: pares ordenados y sin repetir'; }
    }
    if (!entero(p.quorum, 1, p.pares.length)) { return 'politica: quorum'; }
    if (!entero(p.max_bytes, 512, TECHO) || !entero(p.max_ops, 1, 500)) { return 'politica: topes'; }
    if (p.semilla !== 'commit_reveal' || p.conflicto !== 'poda_gana') { return 'politica: semilla o conflicto'; }
    if (!cadena(p.contenido_v, 1, 40) || !HEX32.test(p.nonce)) { return 'politica: version o nonce'; }
    return '';
  }
  function sesion(p) {
    var m = formaPolitica(p);
    if (m) { throw new Error(m); }
    return K.huella(p);
  }

  /* --- el sobre ------------------------------------------------------------------------------- */
  function forma(s) {
    if (!mismas(s, CLAVES) || s.esquema !== 'atlas.sobre/1') { return 'sobre: forma'; }
    if (!CUERPO[s.tipo]) { return 'sobre: tipo'; }
    if (!HEX64.test(s.sesion) || !HEX64.test(s.de)) { return 'sobre: sesion o clave'; }
    if (!cadena(s.pseudonimo, 1, 64) || PROHIBIDO.test(s.pseudonimo)) { return 'sobre: pseudonimo'; }
    if (!entero(s.seq, 1, 1000000)) { return 'sobre: seq'; }
    if (s.seq === 1 ? s.prev !== 'genesis' : !HEX64.test(s.prev)) { return 'sobre: prev'; }
    if (!cadena(s.contenido_v, 1, 40)) { return 'sobre: contenido_v'; }
    if (!FIRMA.test(s.firma)) { return 'sobre: firma'; }
    var c = s.cuerpo;
    if (!objeto(c) || c.esquema !== CUERPO[s.tipo]) { return 'sobre: cuerpo'; }
    if (s.tipo === 'compromiso' && !(mismas(c, ['esquema', 'c']) && HEX64.test(c.c))) { return 'sobre: compromiso'; }
    if (s.tipo === 'revelacion' && !(mismas(c, ['esquema', 'r', 'compromisos']) && HEX64.test(c.r) && HEX64.test(c.compromisos))) {
      return 'sobre: revelacion';
    }
    try { if (K.canon(s).length > TECHO) { return 'sobre: pasa de ' + TECHO + ' B'; } }
    catch (x) { return 'sobre: ' + x.message; }
    return '';
  }

  function sinFirma(s) {
    var o = {};
    Object.keys(s).forEach(function (k) { if (k !== 'firma') { o[k] = s[k]; } });
    return o;
  }
  /* Lo que se firma: el sobre sin su firma, canonico. */
  function mensaje(s) { return K.canon(sinFirma(s)); }
  /* El nombre del sobre: su huella con la firma dentro. */
  function huella(s) { return K.huella(s); }
  /* `v(texto, firmaHex, claveHex) -> bool | Promise<bool>`. */
  function verifica(s, v) {
    return Promise.resolve().then(function () { return v(mensaje(s), s.firma.slice(8), s.de); })
      .then(function (ok) { return ok === true; }, function () { return false; });
  }

  /* --- el libro de la sesion ------------------------------------------------------------------ */
  function libro(politica) {
    return { sesion: sesion(politica), politica: politica, cabeza: {}, vistos: {}, orden: [], trampas: [], fuera: {} };
  }

  function anota(L, s) {
    var m = forma(s);
    if (m) { return m; }
    if (s.sesion !== L.sesion) { return 'sesion ajena: replica de otra sesion'; }
    if (L.politica.pares.indexOf(s.de) < 0) { return 'no es par de la sesion'; }
    if (L.fuera[s.de]) { return 'par con trampa probada'; }
    if (K.canon(s).length > L.politica.max_bytes) { return 'pasa de los bytes de la politica'; }
    var h = huella(s);
    if (L.vistos[h]) { return 'duplicado'; }
    var cab = L.cabeza[s.de] || (L.cabeza[s.de] = { seq: 0, huella: 'genesis', porSeq: {} });
    if (cab.porSeq[s.seq] && cab.porSeq[s.seq] !== h) {
      L.trampas.push({ de: s.de, seq: s.seq, a: cab.porSeq[s.seq], b: h });
      L.fuera[s.de] = true;
      return 'trampa: mismo seq con otro cuerpo (dos firmas que se contradicen)';
    }
    if (s.seq <= cab.seq) { return 'seq viejo'; }
    if (s.seq !== cab.seq + 1) { return 'falta el seq ' + (cab.seq + 1); }
    if (s.prev !== cab.huella) { return 'prev no enlaza'; }
    if (L.orden.length >= L.politica.max_ops) { return 'pasa de las operaciones de la politica'; }
    cab.seq = s.seq; cab.huella = h; cab.porSeq[s.seq] = h;
    L.vistos[h] = s; L.orden.push(h);
    return '';
  }

  /* El orden de llegada no importa: se ordena por (autor, seq, huella) y se anota en ese orden. */
  function ordenCanonico(sobres) {
    return sobres.slice().sort(function (a, b) {
      return a.de < b.de ? -1 : a.de > b.de ? 1 : a.seq - b.seq || (huella(a) < huella(b) ? -1 : 1);
    });
  }
  function anotaTodos(L, sobres) {
    return ordenCanonico(sobres).map(function (s) { return { huella: huella(s), motivo: anota(L, s) }; });
  }
  function aceptados(L, tipo) {
    return L.orden.map(function (h) { return L.vistos[h]; }).filter(function (s) { return !tipo || s.tipo === tipo; });
  }

  /* --- commit-reveal -------------------------------------------------------------------------- */
  function compromiso(r, clave, sesionId) {
    if (!HEX64.test(r) || !HEX64.test(clave) || !HEX64.test(sesionId)) { throw new Error('compromiso: 64 hex'); }
    return K.sha([r, K.sha(clave), sesionId].join(':'));
  }
  /* El conjunto de compromisos que hay en el libro, en orden de clave: lo que atestigua una revelacion. */
  function conjunto(L) {
    var cs = {};
    aceptados(L, 'compromiso').forEach(function (s) { cs[s.de] = cs[s.de] ? 'duplicado' : s.cuerpo.c; });
    return cs;
  }
  function huellaConjunto(cs) {
    return K.huella(Object.keys(cs).sort().map(function (k) { return [k, cs[k]]; }));
  }

  function semilla(L) {
    var cs = conjunto(L), claves = Object.keys(cs).sort(), rs = {};
    for (var i = 0; i < claves.length; i++) {
      if (cs[claves[i]] === 'duplicado') { return { ok: false, motivo: 'compromiso duplicado de ' + claves[i].slice(0, 8) }; }
    }
    if (claves.length < L.politica.quorum) { return { ok: false, motivo: 'NO_DATA · faltan compromisos (' + claves.length + '/' + L.politica.quorum + ')' }; }
    var hc = huellaConjunto(cs);
    var revs = aceptados(L, 'revelacion');
    for (var j = 0; j < revs.length; j++) {
      var s = revs[j];
      if (!cs[s.de]) { return { ok: false, motivo: 'revelacion sin compromiso de ' + s.de.slice(0, 8) }; }
      if (rs[s.de]) { return { ok: false, motivo: 'revelacion duplicada de ' + s.de.slice(0, 8) }; }
      if (s.cuerpo.compromisos !== hc) { return { ok: false, motivo: 'revelacion con otro conjunto de compromisos (compromiso tardio)' }; }
      if (compromiso(s.cuerpo.r, s.de, L.sesion) !== cs[s.de]) { return { ok: false, motivo: 'revelacion falsa de ' + s.de.slice(0, 8) }; }
      rs[s.de] = s.cuerpo.r;
    }
    var falta = claves.filter(function (k) { return !rs[k]; });
    if (falta.length) { return { ok: false, motivo: 'NO_DATA · falta la revelacion de ' + falta.map(function (k) { return k.slice(0, 8); }).join(', ') }; }
    return { ok: true, semilla: K.sha([L.sesion, hc, claves.map(function (k) { return rs[k]; }).join(',')].join('|')),
             pares: claves.length };
  }

  var AtlasSobres = {
    TECHO: TECHO, CUERPO: CUERPO, MODOS: MODOS, PROHIBIDO: PROHIBIDO,
    formaPolitica: formaPolitica, sesion: sesion, forma: forma, mensaje: mensaje, huella: huella, verifica: verifica,
    libro: libro, anota: anota, ordenCanonico: ordenCanonico, anotaTodos: anotaTodos, aceptados: aceptados,
    compromiso: compromiso, conjunto: conjunto, huellaConjunto: huellaConjunto, semilla: semilla
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSobres; }
  else { raiz.AtlasSobres = AtlasSobres; }
})(this);
