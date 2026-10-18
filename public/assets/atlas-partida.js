(function (raiz) {
  'use strict';

  var MAX_PASOS = 5000, SIN_DIA = 'sin-dia';

  function instantanea(E, M) {
    if (!E) { return null; }
    var niveles = {};
    M.OFICIOS.forEach(function (k, i) { niveles[k] = M.nivelDesdeXp(E.xp[i]); });
    return JSON.parse(JSON.stringify({
      esquema: 'atlas.instantanea/1', contenido_v: M.CATALOGO.contenido_v,
      ciclo: E.t, fase: M.fase(E), nivel_nucleo: M.nivelNucleo(E),
      profundidad: M.BANDAS[E.prof].lab,
      recursos: { luz: E.luz, biomasa: E.biomasa, cobre: E.cobre, flujo: E.flujo, oxigeno: E.o2 },
      integridad: E.integridad, integridad_max: E.integridad_max,
      grieta: { abierta: E.abierta, cierre: E.cierre }, niveles: niveles,
      pendiente_ciclos: E.pendiente ? E.pendiente.ciclos : 0,
      eventos: E.eventos.slice(-20)
    }));
  }

  function final(E, M) {
    var i = instantanea(E, M);
    if (i) { delete i.eventos; }
    return i;
  }

  function reproduce(p, M, cada) {
    if (!p || p.esquema !== 'atlas.partida/1') { throw new Error('esquema'); }

    var ver = cada || function () {};
    var ley = { nd: p.ley.nd, integridad_max: p.ley.integridad_max, dano: p.ley.dano };
    var e = M.inicial(ley), f = { recoger: M.recoger, reparar: M.reparar, aplazar: M.aplazar };
    p.pasos.forEach(function (s, n) {
      if ('sugerencia' in s) { return; }
      if ('ciclos' in s) { for (var i = 0; i < s.ciclos; i++) { e = M.ciclo(e, ley); ver(e); } return; }
      else if ('dormir_ms' in s) { e = M.dormir(e, s.dormir_ms); }
      else if (s.accion === 'bajar_a') { e = M.bajarA(e, s.banda, SIN_DIA); }
      else if (s.accion === 'invocar') { e = M.invocar(e, s.coste, SIN_DIA); }
      else if (f[s.accion]) { e = f[s.accion](e, SIN_DIA); }
      else { throw new Error('paso ' + n + ' desconocido'); }
      ver(e);
    });
    return e;
  }

  var G = { ley: null, pasos: [], truncada: false, origen: 'humano' };
  function empuja(s) {
    if (G.pasos.length >= MAX_PASOS) { G.truncada = true; return; }
    G.pasos.push(s);
  }
  function graba(M) {

    var puro = {};
    Object.keys(M).forEach(function (k) { puro[k] = M[k]; });
    var o = {};
    ['inicial', 'ciclo', 'dormir', 'recoger', 'reparar', 'aplazar', 'bajarA', 'invocar']
      .forEach(function (k) { o[k] = M[k]; });
    M.inicial = function (ley) {
      G.ley = { nd: !!ley.nd, integridad_max: ley.integridad_max, dano: ley.dano };
      G.pasos = []; G.truncada = false;
      return o.inicial(ley);
    };
    M.ciclo = function (e, ley) {
      var u = G.pasos[G.pasos.length - 1];
      if (u && 'ciclos' in u) { u.ciclos += 1; } else { empuja({ ciclos: 1 }); }
      return o.ciclo(e, ley);
    };
    M.dormir = function (e, ms) { empuja({ dormir_ms: ms }); return o.dormir(e, ms); };
    ['recoger', 'reparar', 'aplazar'].forEach(function (k) {
      M[k] = function (e, dia) { empuja({ accion: k, origen: G.origen }); return o[k](e, dia); };
    });
    M.bajarA = function (e, prof, dia) {
      empuja({ accion: 'bajar_a', banda: prof, origen: G.origen });
      return o.bajarA(e, prof, dia);
    };
    M.invocar = function (e, coste, dia) {
      empuja({ accion: 'invocar', coste: { cobre: coste.cobre, luz: coste.luz }, origen: G.origen });
      return o.invocar(e, coste, dia);
    };
    return puro;
  }

  function partida(E, M) {
    if (!G.ley || !E) { return null; }
    return JSON.parse(JSON.stringify({
      esquema: 'atlas.partida/1', contenido_v: M.CATALOGO.contenido_v,
      ley: G.ley, pasos: G.pasos, truncada: G.truncada, final: final(E, M)
    }));
  }

  function retoma(p, M, cada) {
    if (!p || p.esquema !== 'atlas.partida/1') { throw new Error('esquema'); }
    if (p.contenido_v !== M.CATALOGO.contenido_v) {
      throw new Error('contenido_v ' + p.contenido_v + ' != ' + M.CATALOGO.contenido_v);
    }
    var e = reproduce(p, M, cada);
    if (p.final && JSON.stringify(final(e, M)) !== JSON.stringify(p.final)) { throw new Error('final'); }
    G.ley = { nd: !!p.ley.nd, integridad_max: p.ley.integridad_max, dano: p.ley.dano };
    G.pasos = JSON.parse(JSON.stringify(p.pasos)); G.truncada = !!p.truncada;
    return e;
  }

  function anota(a, respuesta) {
    var s = { accion: a.accion };
    if (a.banda) { s.banda = a.banda; }
    empuja({ sugerencia: s, respuesta: respuesta });
  }

  function como(origen, hacer) {
    var antes = G.origen;
    G.origen = origen;
    try { return hacer(); } finally { G.origen = antes; }
  }

  var AtlasPartida = {
    MAX_PASOS: MAX_PASOS, instantanea: instantanea, final: final,
    reproduce: reproduce, retoma: retoma, partida: partida, como: como, anota: anota
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasPartida; }
  else {
    raiz.AtlasPartida = AtlasPartida;
    if (raiz.AtlasMotor) { AtlasPartida.puro = graba(raiz.AtlasMotor); }
  }
})(this);
