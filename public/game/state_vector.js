/* preceptoros.org · theGame · EL VECTOR DEL JUEGO: leer theGame de UNA llamada (FIRMO 2026-10-12: «piensa vectorialmente»).

   Lo que es facil de leer para Claude es facil para un LLM pequeno en un Android de 8 GB. Aqui todo el estado VISIBLE
   cabe en un vector compacto (< 1 KB en JSON, claves cortas y estables, `esquema()` las explica): recursos, cangrejo y sus
   skills, el panel abierto con su sello y su edad, el paso del tutorial, los edificios, los lugares y su registro, los
   nodos, las lapidas y lo ultimo que dijo la Radio. Las demas proyecciones (color, sonido, gusanos) salen del MISMO
   estado: este vector las ve todas. Lo que falta va en `nd` con su causa: nunca un hueco callado, nunca un cero inventado.
   Solo LEE (jamas escribe ni decide). Sin red, sin azar, sin reloj de pared. */
(function (raiz) {
  'use strict';
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
  function intento(f) { try { return f(); } catch (e) { return undefined; } }

  /* Puro sobre lo que recibe: construye el vector desde las lecturas (las pruebas le pasan lecturas falsas). */
  function arma(L) {
    var v = { v: 'preceptoros.vector/1', c: null, r: null, k: null, p: null, t: null, e: [], l: [], n: [], z: 0, q: [], g: null, nd: {} };
    var i = L.instantanea;
    if (i && typeof i.ciclo === 'number') { v.c = i.ciclo; } else { v.nd.c = 'engine not loaded'; }
    if (i && i.recursos) { var R = i.recursos; v.r = [R.cobre, R.luz, R.biomasa, R.oxigeno].map(function (x) { return typeof x === 'number' ? x : null; }); } else { v.nd.r = 'resources not measured'; }
    if (L.cangrejo) { var K = L.cangrejo; v.k = [Math.round(K.dx), Math.round(K.dy), K.army == null ? null : K.army, K.swim, K.reach]; } else { v.nd.k = 'crab not on the map yet'; }
    if (L.panel) { v.p = [L.panel.id, L.panel.sello, typeof L.panel.edadN === 'number' ? L.panel.edadN : null]; }
    if (L.tutorial) { v.t = L.tutorial.paso ? [L.tutorial.paso, L.tutorial.competencia] : null; } else { v.nd.t = 'tutorial not loaded'; }
    (L.edificios || []).forEach(function (b) { v.e.push([b.id, b.fase, b.vida == null ? null : b.vida]); });
    (L.lugares || []).forEach(function (x) { v.l.push([x.nombre, x.g, x.p]); });
    (L.nodos || []).forEach(function (x) { v.n.push([x.id, x.med + '/' + x.tot]); });
    v.z = L.lapidas == null ? null : L.lapidas; if (v.z === null) { v.nd.z = 'reef not loaded'; }
    (L.radio || []).slice(-3).forEach(function (m) { v.q.push([m.quien, m.sello, m.ciclo]); });
    if (L.gusano && L.gusano.S) { var G = L.gusano.S; v.g = [G.de, G.a, G.delta, G.intentos]; }
    if (!v.e.length) { v.nd.e = 'no building in view (no home key yet?)'; }
    if (!v.l.length) { v.nd.l = 'no place fought on this device yet'; }
    return v;
  }
  /* Lee el juego vivo. Cada lectura falla sola (queda en nd), nunca tumba el vector. */
  function lecturas() {
    var i = J(), Lb = raiz.AtlasCangrejoLibre, Ce = raiz.AtlasNodosCedulas, A = raiz.AtlasArrecife, W = raiz.AtlasVentana, Tu = raiz.AtlasTutorial, Rc = raiz.AtlasRadioChat;
    var sk = Lb ? intento(function () { return Lb.skills(); }) : null, d = Lb ? Lb.desplazamiento() : null;
    var army = intento(function () { var l = raiz.AtlasIncubadora.army(); return Array.isArray(l) ? l.length : null; });
    var f = W ? W.ficha() : null;
    return {
      instantanea: i,
      cangrejo: d && sk ? { dx: d.x, dy: d.y, army: army === undefined ? null : army, swim: sk[0].nivel, reach: sk[1].nivel } : null,
      panel: f ? { id: f.id, sello: f.sello, edadN: +((/Δ (\d+)/.exec(f.edad) || [])[1]) } : null,
      tutorial: Tu ? Tu.ficha() : null,
      edificios: A ? A.vectores().map(function (b) { return { id: b.id, fase: b.fase, vida: b.vida }; }) : [],
      lugares: (intento(function () { return raiz.AtlasInspector.todas(); }) || []).filter(function (x) { return /win share/.test(x[1][1]); })
        .map(function (x) { var m = /win share (\d+)\/1000 · (\d+) fights/.exec(x[1][1]); var n = +m[2], g = Math.round(+m[1] * n / 1000); return { nombre: x[0][1], g: g, p: n - g }; }),
      nodos: Ce && raiz.AtlasCorales ? Ce.nodos.map(function (n) { var k = raiz.AtlasCorales.coral(n); return { id: n.nodo, med: k.medidas, tot: k.total }; }) : [],
      lapidas: A && A.lapidas ? A.lapidas().length : null,
      radio: Rc && Rc.registro ? Rc.registro() : [],
      gusano: raiz.AtlasWorm ? raiz.AtlasWorm.ficha() : null
    };
  }
  function leer() {
    var v = arma(lecturas()), s = JSON.stringify(v);
    if (s.length > TOPE) { v.q = []; v.l = v.l.slice(0, 3); v.nd.recorte = 'vector over ' + TOPE + ' B: radio and places trimmed'; }
    return v;
  }
  function esquema() { return JSON.parse(JSON.stringify(ESQUEMA)); }

  var AtlasVector = { leer: leer, arma: arma, esquema: esquema, TOPE: TOPE };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasVector; } else { raiz.AtlasVector = AtlasVector; }
})(this);
