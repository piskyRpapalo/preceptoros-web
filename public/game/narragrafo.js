
(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var S = enNode ? require('./sobres.js') : raiz.AtlasSobres;
  var HEX64 = K.HEX64, DIM = 8;
  var OPS = ['nodo', 'arco', 'voto', 'poda'];
  var MODOS = ['cooperativo', 'competitivo', 'hibrido'];

  var TEXTO_MALO = /[<>`]|https?:|javascript:|data:|\{\{|\}\}|=>|\bfunction\b|(^|[^0-9])\/[a-z]|@|\b\d{1,3}(\.\d{1,3}){3}\b/i;

  function objeto(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mismas(o, claves) {
    return objeto(o) && Object.keys(o).length === claves.length && claves.every(function (k) { return k in o; });
  }
  function entero(x, min, max) { return Number.isSafeInteger(x) && x >= min && x <= max; }
  function vector(v) { return Array.isArray(v) && v.length === DIM && v.every(function (x) { return entero(x, 0, 255); }); }

  function formaNodo(n) {
    if (!mismas(n, ['esquema', 'texto', 'etiquetas', 'afinidad']) || n.esquema !== 'atlas.mgno_nodo/1') { return 'nodo: forma'; }
    if (typeof n.texto !== 'string' || n.texto.length < 1 || n.texto.length > 280) { return 'nodo: texto 1..280'; }
    if (TEXTO_MALO.test(n.texto)) { return 'nodo: el texto lleva etiquetas, enlaces, codigo, rutas o IPs'; }
    if (!Array.isArray(n.etiquetas) || n.etiquetas.length > 6 ||
        n.etiquetas.some(function (e, i) { return !/^[a-z_]{1,24}$/.test(e) || n.etiquetas.indexOf(e) !== i; })) { return 'nodo: etiquetas'; }
    return vector(n.afinidad) ? '' : 'nodo: afinidad (8 enteros 0..255)';
  }
  function formaArco(a) {
    return mismas(a, ['de', 'a', 'peso']) && HEX64.test(a.de) && HEX64.test(a.a) && a.de !== a.a && entero(a.peso, 1, 100);
  }
  function formaOp(o) {
    if (!objeto(o) || o.esquema !== 'atlas.mgno_operacion/1' || OPS.indexOf(o.op) < 0) { return 'op: forma'; }
    if (!mismas(o, ['esquema', 'op', o.op])) { return 'op: campos'; }
    if (o.op === 'nodo') { return formaNodo(o.nodo); }
    if (o.op === 'arco') { return formaArco(o.arco) ? '' : 'op: arco'; }
    if (o.op === 'voto') {
      var v = o.voto;
      return mismas(v, ['de', 'a', 'delta']) && HEX64.test(v.de) && HEX64.test(v.a) && (v.delta === 1 || v.delta === -1) ? '' : 'op: voto';
    }
    return HEX64.test(o.poda) ? '' : 'op: poda';
  }
  function formaPreferencia(p) {
    if (!mismas(p, ['esquema', 'vector', 'procedencia']) || p.esquema !== 'atlas.mgno_preferencia/1') { return 'preferencia: forma'; }
    if (['declarada', 'firmada'].indexOf(p.procedencia) < 0) { return 'preferencia: solo declarada o firmada'; }
    return vector(p.vector) ? '' : 'preferencia: vector';
  }


  function funde(L) {
    var nodos = {}, arcos = {}, podas = {}, votos = {}, rechazos = [];
    S.ordenCanonico(S.aceptados(L, 'mgno_op')).forEach(function (s) {
      var o = s.cuerpo, m = formaOp(o);
      if (m) { rechazos.push({ huella: S.huella(s), motivo: m }); return; }
      if (o.op === 'nodo') { nodos[K.huella(o.nodo)] = o.nodo; }
      else if (o.op === 'arco') {
        var k = o.arco.de + '>' + o.arco.a;
        arcos[k] = { de: o.arco.de, a: o.arco.a, peso: Math.max(o.arco.peso, arcos[k] ? arcos[k].peso : 0) };
      } else if (o.op === 'voto') {
        var kv = o.voto.de + '>' + o.voto.a;
        (votos[kv] = votos[kv] || {})[s.de] = o.voto.delta;
      } else { podas[o.poda] = true; }
    });
    var vivos = {}, lista = [];
    Object.keys(nodos).sort().forEach(function (id) { if (!podas[id]) { vivos[id] = nodos[id]; } });
    Object.keys(arcos).sort().forEach(function (k) {
      var a = arcos[k];
      if (!vivos[a.de] || !vivos[a.a]) { return; }
      var suma = 0;
      Object.keys(votos[k] || {}).forEach(function (p) { suma += votos[k][p]; });
      lista.push([a.de, a.a, K.satura(a.peso + suma, 1, 200)]);
    });
    var grafo = { esquema: 'atlas.mgno_grafo/1', sesion: L.sesion, nodos: Object.keys(vivos), arcos: lista,
                  podas: Object.keys(podas).sort() };
    return { grafo: grafo, huella: K.huella(grafo), nodos: vivos, rechazos: rechazos };
  }

  function mediana(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }); return s[(s.length - 1) >> 1]; }


  function phi(modo, prefs, afinidad, pesos) {
    if (MODOS.indexOf(modo) < 0) { throw new Error('phi: modo ' + modo); }
    if (!prefs.length || !prefs.every(vector) || !vector(afinidad) ||
        !(Array.isArray(pesos) && pesos.length === DIM && pesos.every(function (w) { return entero(w, 0, 100); }))) {
      throw new Error('phi: vectores');
    }
    var med = [], base = 0, mejor = -1, dmax = -1;
    for (var d = 0; d < DIM; d++) {
      med[d] = mediana(prefs.map(function (p) { return p[d]; }));
      base += pesos[d] * med[d] * afinidad[d];
      var dev = Math.max.apply(null, prefs.map(function (p) { return p[d]; })) - med[d];
      if (dev > dmax) { dmax = dev; mejor = d; }
    }
    base = Math.floor(base / 255);
    if (modo === 'cooperativo') { return K.satura(base, 0, 1000000000); }
    var bono = Math.floor(pesos[mejor] * dmax * afinidad[mejor] / 255);
    return K.satura(base + (modo === 'competitivo' ? bono : bono >> 1), 0, 1000000000);
  }


  function elige(estado, desde, prefs, modo, pesos, semilla) {
    var cand = estado.grafo.arcos.filter(function (a) { return a[0] === desde; });
    if (!cand.length) { return { ok: false, motivo: 'NO_DATA · no sale ningun arco de ese nodo' }; }
    var ps = prefs.map(function (p) {
      var m = formaPreferencia(p);
      if (m) { throw new Error(m); }
      return p.vector;
    });
    var w = cand.map(function (a) { return 1 + a[2] + phi(modo, ps, estado.nodos[a[1]].afinidad, pesos); });
    var i = K.loteria(w, K.generador(semilla));
    return { ok: true, nodo: cand[i][1], candidatos: cand.map(function (a, j) { return [a[1], w[j]]; }), odds: K.puntosBasicos(w) };
  }

  var AtlasNarragrafo = {
    DIM: DIM, OPS: OPS, MODOS: MODOS, TEXTO_MALO: TEXTO_MALO, formaNodo: formaNodo, formaOp: formaOp,
    formaPreferencia: formaPreferencia, funde: funde, phi: phi, elige: elige
  };
  if (enNode) { module.exports = AtlasNarragrafo; }
  else { raiz.AtlasNarragrafo = AtlasNarragrafo; }
})(this);
