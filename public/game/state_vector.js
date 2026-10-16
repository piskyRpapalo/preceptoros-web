/* preceptoros.org · theGame · EL VECTOR DEL JUEGO: leer theGame de UNA llamada (FIRMO 2026-10-12: «piensa vectorialmente»).

   Lo que es facil de leer para Claude es facil para un LLM pequeno en un Android de 8 GB. Aqui todo el estado VISIBLE
   cabe en un vector compacto (< 1 KB en JSON, claves cortas y estables, `esquema()` las explica): recursos, cangrejo y sus
   skills, el panel abierto con su sello y su edad, el paso del tutorial, los edificios, los lugares y su registro, los
   nodos, las lapidas y lo ultimo que dijo la Radio. Las demas proyecciones (color, sonido, gusanos) salen del MISMO
   estado: este vector las ve todas. Lo que falta va en `nd` con su causa: nunca un hueco callado, nunca un cero inventado.
   Solo LEE (jamas escribe ni decide). Sin red, sin azar, sin reloj de pared.
   Contrato de intercambio cerrado: data/atlas_vector_schema.json (JSON Schema 2020-12). */
(function (raiz) {
  'use strict';
  var validaContrato = (typeof module === 'object' && module.exports) ? require('./vector_contract.js').valida :
    raiz.AtlasVectorContract && raiz.AtlasVectorContract.valida;
  var TOPE = 1024;
  var ESQUEMA = {
    v: 'schema id', c: 'game cycle (the clock is the equation)', r: '[copper, light, biomass, oxygen]',
    k: 'crab [x, y offset from home, army, swim level, reach level] (level null = NO_DATA)',
    p: 'open panel [id, seal, age in cycles] or null', t: 'tutorial [step id, demonstrated actions] (null = done or skipped)',
    e: 'buildings [[id, phase, life/1000]]', l: 'places [[name, wins, losses]] (fought on this device only)',
    n: 'rack nodes [[id, measured/total]]', z: 'tombstones count', q: 'radio, last 3 [[who, seal, cycle]]',
    g: 'last panel transition (the worm) [from, to, text delta, times opened] or null',
    nd: '{key: cause} for everything missing'
  };
  function J() { var j = raiz.AtlasJuego; return j && j.instantanea ? j.instantanea() : null; }
  function agregaCausa(fallos, clave, causa) {
    if (!fallos[clave]) { fallos[clave] = causa; }
    else if (fallos[clave].split('; ').indexOf(causa) < 0) { fallos[clave] += '; ' + causa; }
  }
  function lee(f, clave, fallos, defecto) {
    try { return f(); } catch (e) { agregaCausa(fallos, clave, 'reader failed'); return defecto; }
  }
  /* Cuenta bytes UTF-8 sobre JSON ya serializado; JSON.stringify escapa sustitutos aislados. */
  function bytesUTF8(texto) {
    var bytes = 0;
    for (var i = 0; i < texto.length; i++) {
      var c = texto.charCodeAt(i);
      if (c < 0x80) { bytes += 1; }
      else if (c < 0x800) { bytes += 2; }
      else if (c >= 0xd800 && c <= 0xdbff && i + 1 < texto.length
          && texto.charCodeAt(i + 1) >= 0xdc00 && texto.charCodeAt(i + 1) <= 0xdfff) { bytes += 4; i++; }
      else { bytes += 3; }
    }
    return bytes;
  }

  /* Puro sobre lo que recibe: construye el vector desde las lecturas (las pruebas le pasan lecturas falsas). */
  function arma(L) {
    L = L && typeof L === 'object' && !Array.isArray(L) ? L : {};
    var v = { v: 'preceptoros.vector/1', c: null, r: null, k: null, p: null, t: null, e: [], l: [], n: [], z: 0, q: [], g: null, nd: {} };
    var i = L.instantanea;
    if (i && Number.isSafeInteger(i.ciclo) && i.ciclo >= 0 && i.ciclo <= 1000000000) { v.c = i.ciclo; } else { v.nd.c = L.causas && L.causas.c || 'NO_DATA: engine cycle unavailable or invalid'; }
    var tieneRecursos = i && Object.prototype.hasOwnProperty.call(i, 'recursos');
    if (tieneRecursos && i.recursos && typeof i.recursos === 'object' && !Array.isArray(i.recursos)) {
      var R = i.recursos, valores = [R.cobre, R.luz, R.biomasa, R.oxigeno], nombres = ['cobre', 'luz', 'biomasa', 'oxigeno'];
      v.r = valores.map(function (x, n) {
        if (typeof x !== 'number' || !Number.isFinite(x)) { v.nd.r = (v.nd.r ? v.nd.r + '; ' : 'NO_DATA: ') + nombres[n] + ' unavailable'; return null; }
        return x;
      });
    } else {
      v.r = null;
      v.nd.r = tieneRecursos ? 'NO_DATA: resources has invalid type' : 'NO_DATA: resources field absent';
    }
    if (L.cangrejo) {
      var K = L.cangrejo;
      if (Number.isFinite(K.dx) && Number.isFinite(K.dy)) {
        v.k = [Math.round(K.dx), Math.round(K.dy), Number.isSafeInteger(K.army) ? K.army : null,
          Number.isSafeInteger(K.swim) ? K.swim : null, Number.isSafeInteger(K.reach) ? K.reach : null];
        if (v.k.slice(2).some(function (x) { return x === null; })) { v.nd.k = L.causas && L.causas.k || 'NO_DATA: crab measures incomplete'; }
      } else { v.nd.k = L.causas && L.causas.k || 'NO_DATA: crab offset invalid'; }
    }
    else { v.nd.k = L.causas && L.causas.k || 'crab not on the map yet'; }
    if (L.panel) {
      var edadValida = Number.isSafeInteger(L.panel.edadN) && L.panel.edadN >= 0;
      v.p = [typeof L.panel.id === 'string' && L.panel.id.length ? L.panel.id : null, typeof L.panel.sello === 'string' && L.panel.sello.length ? L.panel.sello : null,
        edadValida ? L.panel.edadN : null];
      if (v.p.some(function (x) { return x === null; })) { v.nd.p = L.causas && L.causas.p || 'NO_DATA: panel fields incomplete'; }
    }
    else if (L.causas && L.causas.p) { v.nd.p = L.causas.p; }
    else if (!Object.prototype.hasOwnProperty.call(L, 'panel')) { v.nd.p = 'NO_DATA: panel reader result absent'; }
    if (L.tutorial) {
      if (L.tutorial.paso == null) { v.t = null; }
      else if (typeof L.tutorial.paso === 'string' && L.tutorial.paso.length && Number.isSafeInteger(L.tutorial.competencia) && L.tutorial.competencia >= 0) {
        v.t = [L.tutorial.paso, L.tutorial.competencia];
      } else { v.nd.t = L.causas && L.causas.t || 'NO_DATA: tutorial fields invalid'; }
    }
    else if (L.causas && L.causas.t) { v.nd.t = L.causas.t; }
    else if (!Object.prototype.hasOwnProperty.call(L, 'tutorial')) { v.nd.t = 'NO_DATA: tutorial reader result absent'; }
    if (Array.isArray(L.edificios)) {
      L.edificios.forEach(function (b) {
        if (!b || typeof b.id !== 'string' || !b.id.length || typeof b.fase !== 'string' || !b.fase.length
            || (b.vida != null && (!Number.isFinite(b.vida) || b.vida < 0))) { agregaCausa(v.nd, 'e', 'NO_DATA: building row invalid'); return; }
        v.e.push([b.id, b.fase, b.vida == null ? null : b.vida]);
        if (b.fase === 'NO_DATA' || b.vida == null) { agregaCausa(v.nd, 'e', b.causa || 'NO_DATA: building state unavailable'); }
      });
    }
    else { v.nd.e = 'NO_DATA: building list unavailable'; }
    if (Array.isArray(L.lugares)) {
      L.lugares.forEach(function (x) {
        if (!x || typeof x.nombre !== 'string' || !x.nombre.length || !Number.isSafeInteger(x.g) || x.g < 0 || !Number.isSafeInteger(x.p) || x.p < 0) {
          agregaCausa(v.nd, 'l', 'NO_DATA: place record invalid'); return;
        }
        v.l.push([x.nombre, x.g, x.p]);
      });
    }
    else { v.nd.l = 'NO_DATA: place list unavailable'; }
    if (Array.isArray(L.nodos)) {
      L.nodos.forEach(function (x) {
        if (!x || typeof x.id !== 'string' || !x.id.length || !Number.isSafeInteger(x.med) || x.med < 0 || !Number.isSafeInteger(x.tot) || x.tot < 0) { agregaCausa(v.nd, 'n', 'NO_DATA: node measurement invalid'); return; }
        v.n.push([x.id, x.med + '/' + x.tot]);
      });
    }
    else { v.nd.n = 'NO_DATA: node list unavailable'; }
    v.z = Number.isSafeInteger(L.lapidas) && L.lapidas >= 0 ? L.lapidas : null;
    if (v.z === null) { v.nd.z = L.causas && L.causas.z || 'NO_DATA: tombstone count unavailable'; }
    if (Array.isArray(L.radio)) {
      L.radio.slice(-3).forEach(function (m) {
        if (!m || typeof m.quien !== 'string' || !m.quien.length || typeof m.sello !== 'string' || !m.sello.length
            || (m.ciclo != null && (!Number.isSafeInteger(m.ciclo) || m.ciclo < 0 || m.ciclo > 1000000000))) { agregaCausa(v.nd, 'q', 'NO_DATA: radio record invalid'); return; }
        if (m.ciclo == null) { agregaCausa(v.nd, 'q', 'NO_DATA: radio cycle unavailable'); }
        v.q.push([m.quien, m.sello, m.ciclo == null ? null : m.ciclo]);
      });
    }
    else { v.nd.q = 'NO_DATA: radio list unavailable'; }
    if (L.gusano && L.gusano.S) {
      var G = L.gusano.S;
      if ((G.de == null || typeof G.de === 'string' && G.de.length) && typeof G.a === 'string' && G.a.length && Number.isSafeInteger(G.delta)
          && Number.isSafeInteger(G.intentos) && G.intentos >= 1) { v.g = [G.de == null ? null : G.de, G.a, G.delta, G.intentos]; }
      else { v.nd.g = L.causas && L.causas.g || 'NO_DATA: transition fields invalid'; }
    }
    else if (!Object.prototype.hasOwnProperty.call(L, 'gusano') && !(L.causas && L.causas.g)) { v.nd.g = 'NO_DATA: transition reader result absent'; }
    if (L.causas) {
      Object.keys(L.causas).forEach(function (key) {
        if (v.nd[key] && v.nd[key] !== L.causas[key]) { agregaCausa(v.nd, key, L.causas[key]); }
        else { v.nd[key] = L.causas[key]; }
      });
    }
    if (!v.e.length && !v.nd.e) { v.nd.e = 'no building in view (no home key yet?)'; }
    if (!v.l.length && !v.nd.l) { v.nd.l = 'no place fought on this device yet'; }
    return v;
  }
  /* Lee el juego vivo. Cada lectura falla sola (queda en nd), nunca tumba el vector. */
  function lecturas() {
    var fallos = {}, i = lee(function () { return J(); }, 'c', fallos, null);
    var Lb = raiz.AtlasCangrejoLibre, Ce = raiz.AtlasNodosCedulas, A = raiz.AtlasArrecife, W = raiz.AtlasVentana, Tu = raiz.AtlasTutorial, Rc = raiz.AtlasRadioChat;
    if (!Lb) { agregaCausa(fallos, 'k', 'crab reader unavailable'); }
    if (!W) { agregaCausa(fallos, 'p', 'panel reader unavailable'); }
    if (!Tu) { agregaCausa(fallos, 't', 'tutorial reader unavailable'); }
    if (!A) { agregaCausa(fallos, 'e', 'reef reader unavailable'); agregaCausa(fallos, 'z', 'tombstone reader unavailable'); }
    if (!A || typeof A.lapidas !== 'function') { agregaCausa(fallos, 'z', 'tombstone reader unavailable'); }
    if (!raiz.AtlasInspector) { agregaCausa(fallos, 'l', 'place reader unavailable'); }
    if (!Ce || !raiz.AtlasCorales) { agregaCausa(fallos, 'n', 'node reader unavailable'); }
    if (!Rc || typeof Rc.registro !== 'function') { agregaCausa(fallos, 'q', 'radio reader unavailable'); }
    if (!raiz.AtlasWorm) { agregaCausa(fallos, 'g', 'transition reader unavailable'); }
    var sk = Lb ? lee(function () { return Lb.skills(); }, 'k', fallos, null) : null;
    var d = Lb ? lee(function () { return Lb.desplazamiento(); }, 'k', fallos, null) : null;
    var army = raiz.AtlasIncubadora ? lee(function () { var l = raiz.AtlasIncubadora.army(); return Array.isArray(l) ? l.length : null; }, 'k', fallos, null) : null;
    var f = W ? lee(function () { return W.ficha(); }, 'p', fallos, null) : null;
    var edadPanel = f && typeof f.edad === 'string' ? /Δ (\d+)/.exec(f.edad) : null;
    if (f && (!f.id || !f.sello)) { agregaCausa(fallos, 'p', 'panel identity or seal unavailable'); }
    if (f && !edadPanel) { agregaCausa(fallos, 'p', 'panel age in cycles unavailable'); }
    var tutorial = Tu ? lee(function () { return Tu.ficha(); }, 't', fallos, null) : null;
    var edificios = A ? lee(function () {
      var lista = A.vectores(); if (!Array.isArray(lista)) { throw new Error('building list unavailable'); }
      return lista.map(function (b) { return { id: b.id, fase: b.fase, vida: b.vida, causa: b.causa }; });
    }, 'e', fallos, []) : [];
    var lapidas = A && A.lapidas ? lee(function () { return A.lapidas().length; }, 'z', fallos, null) : null;
    var lugares = raiz.AtlasInspector ? lee(function () {
      var lista = raiz.AtlasInspector.todas(); if (!Array.isArray(lista)) { throw new Error('place list unavailable'); }
      return lista.filter(function (x) { return /win share/.test(x[1][1]); })
        .map(function (x) { var m = /win share (\d+)\/1000 · (\d+) fights/.exec(x[1][1]); var n = +m[2], g = Math.round(+m[1] * n / 1000); return { nombre: x[0][1], g: g, p: n - g }; });
    }, 'l', fallos, []) : [];
    var nodos = Ce && raiz.AtlasCorales ? lee(function () {
      if (!Array.isArray(Ce.nodos)) { throw new Error('node list unavailable'); }
      return Ce.nodos.map(function (n) { var k = raiz.AtlasCorales.coral(n); return { id: n.nodo, med: k.medidas, tot: k.total }; });
    }, 'n', fallos, []) : [];
    var radio = Rc && Rc.registro ? lee(function () {
      var lista = Rc.registro(); if (!Array.isArray(lista)) { throw new Error('radio list unavailable'); }
      return lista;
    }, 'q', fallos, []) : [];
    var gusano = raiz.AtlasWorm ? lee(function () { return raiz.AtlasWorm.ficha(); }, 'g', fallos, null) : null;
    var cangrejo = null;
    if (Lb) {
      if (d && Number.isFinite(d.x) && Number.isFinite(d.y) && Array.isArray(sk) && sk.length >= 2 && sk[0] && sk[1]) {
        cangrejo = { dx: d.x, dy: d.y, army: army, swim: sk[0].nivel, reach: sk[1].nivel };
        if (!Number.isFinite(cangrejo.swim)) { cangrejo.swim = null; agregaCausa(fallos, 'k', 'swim: ' + (sk[0].causa || 'level unavailable')); }
        if (!Number.isFinite(cangrejo.reach)) { cangrejo.reach = null; agregaCausa(fallos, 'k', 'reach: ' + (sk[1].causa || 'level unavailable')); }
        if (!Number.isSafeInteger(army) || army < 0) { cangrejo.army = null; agregaCausa(fallos, 'k', 'crab army unavailable'); }
      } else { agregaCausa(fallos, 'k', 'reader returned incomplete data'); }
    }
    return {
      instantanea: i,
      cangrejo: cangrejo,
      panel: f ? { id: f.id || null, sello: f.sello || null, edadN: edadPanel ? +edadPanel[1] : null } : null,
      tutorial: tutorial,
      edificios: edificios,
      lugares: lugares,
      nodos: nodos,
      lapidas: lapidas,
      radio: radio,
      gusano: gusano,
      causas: fallos
    };
  }
  function noData(causa) {
    var nd = {}, keys = ['c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g'];
    keys.forEach(function (k) { nd[k] = causa; }); nd.recorte = causa;
    return { v: 'preceptoros.vector/1', c: null, r: null, k: null, p: null, t: null, e: [], l: [], n: [], z: null, q: [], g: null, nd: nd };
  }
  /* Contrato cerrado: vector final siempre < 1024 bytes UTF-8; si no cabe, devuelve solo NO_DATA. */
  function acota(vector) {
    var bytes = bytesUTF8(JSON.stringify(vector));
    if (bytes < TOPE) { return { vector: vector, bytes: bytes, estado: 'completo' }; }
    vector.q = [];
    vector.l = vector.l.slice(0, 3);
    vector.nd.recorte = 'vector over ' + TOPE + ' UTF-8 bytes after radio/place trim';
    bytes = bytesUTF8(JSON.stringify(vector));
    if (bytes < TOPE) { return { vector: vector, bytes: bytes, estado: 'recortado' }; }
    var cause = 'vector over ' + TOPE + ' UTF-8 bytes after trim; no partial state sent';
    var closed = noData(cause);
    bytes = bytesUTF8(JSON.stringify(closed));
    return { vector: closed, bytes: bytes, estado: 'fail-closed' };
  }
  function leer() {
    var vector = arma(lecturas());
    if (!validaContrato || !validaContrato(vector)) { vector = noData('NO_DATA: vector contract violation'); }
    return acota(vector).vector;
  }
  function esquema() { return JSON.parse(JSON.stringify(ESQUEMA)); }

  var AtlasVector = { leer: leer, arma: arma, acota: acota, esquema: esquema, TOPE: TOPE };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasVector; } else { raiz.AtlasVector = AtlasVector; }
})(this);
