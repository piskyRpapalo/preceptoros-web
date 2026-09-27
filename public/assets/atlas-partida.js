/* preceptoros.org · theGame · la PARTIDA de ATLAS: instantanea, grabadora y
   reproduccion.

   LA PARTIDA SON LA LEY Y LAS ACCIONES, NO LOS ESTADOS (sugerencia firmada por
   el Soberano, 2026-09-27). El motor es puro: con la ley y los pasos, cualquiera
   --la Aduana del rack incluida-- vuelve a jugarla en node y comprueba que el
   final sale igual. Un estado inventado no se puede reproducir, y esa es la
   defensa contra el envenenamiento del corpus: no hay que creerse la partida,
   se juega otra vez.

   LA GRABADORA envuelve, en memoria y solo en la pestana, las funciones del
   motor que cambian el estado. El FICHERO del motor no cambia ni sabe que lo
   graban. Cada accion lleva su origen: `humano` si la hizo la persona,
   `piloto_base` si la propuso la regla fija. Nada se guarda: la partida muere
   con la pestana salvo que la persona la exporte, firmada, como fichero.

   SIN FECHAS DE RELOJ. El tiempo de la partida es `ciclos` y `dormir_ms`,
   que es tiempo de juego; el `dia` de los eventos no viaja. */
(function (raiz) {
  'use strict';

  var MAX_PASOS = 5000, SIN_DIA = 'sin-dia';

  /* LA INSTANTANEA (`atlas.instantanea/1`): la unica puerta entre la partida
     y quien la lee (la guia, el piloto, el final de una partida exportada).
     Copia serializable; no se guarda ni se envia. */
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

  /* El final que se compara: la instantanea sin eventos (llevan `dia`). */
  function final(E, M) {
    var i = instantanea(E, M);
    if (i) { delete i.eventos; }
    return i;
  }

  /* VOLVER A JUGAR una partida con el mismo motor. Devuelve el estado final o
     lanza con la causa. Un paso que no es de la forma conocida no se salta:
     se rechaza, porque saltarlo seria jugar otra partida. */
  function reproduce(p, M) {
    if (!p || p.esquema !== 'atlas.partida/1') { throw new Error('esquema'); }
    var ley = { nd: p.ley.nd, integridad_max: p.ley.integridad_max, dano: p.ley.dano };
    var e = M.inicial(ley), f = { recoger: M.recoger, reparar: M.reparar, aplazar: M.aplazar };
    p.pasos.forEach(function (s, n) {
      if ('sugerencia' in s) { return; }
      if ('ciclos' in s) { for (var i = 0; i < s.ciclos; i++) { e = M.ciclo(e, ley); } }
      else if ('dormir_ms' in s) { e = M.dormir(e, s.dormir_ms); }
      else if (s.accion === 'bajar_a') { e = M.bajarA(e, s.banda, SIN_DIA); }
      else if (f[s.accion]) { e = f[s.accion](e, SIN_DIA); }
      else { throw new Error('paso ' + n + ' desconocido'); }
    });
    return e;
  }

  /* LA GRABADORA. Solo en la pestana (en node no hay nada que grabar). */
  var G = { ley: null, pasos: [], truncada: false, origen: 'humano' };
  function empuja(s) {
    if (G.pasos.length >= MAX_PASOS) { G.truncada = true; return; }
    G.pasos.push(s);
  }
  function graba(M) {
    var o = {};
    ['inicial', 'ciclo', 'dormir', 'recoger', 'reparar', 'aplazar', 'bajarA']
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
  }

  /* La partida tal cual, para exportarla. `E` es el estado de la pestana. */
  function partida(E, M) {
    if (!G.ley || !E) { return null; }
    return JSON.parse(JSON.stringify({
      esquema: 'atlas.partida/1', contenido_v: M.CATALOGO.contenido_v,
      ley: G.ley, pasos: G.pasos, truncada: G.truncada, final: final(E, M)
    }));
  }

  /* HUMANO + PILOTO (sugerencia firmada por el Soberano, 2026-09-27): la
     regla PROPONE y la persona decide. Se anota que se propuso y que se
     respondio; si la persona la hace, la accion que sigue es suya (`humano`).
     Es el corpus que un LoRA necesita para ganarle a la regla: donde la
     persona discrepa. No cambia el estado: la reproduccion lo salta. */
  function anota(a, respuesta) {
    var s = { accion: a.accion };
    if (a.banda) { s.banda = a.banda; }
    empuja({ sugerencia: s, respuesta: respuesta });
  }

  /* Quien actua ahora: la persona, salvo mientras el piloto aplica su accion. */
  function como(origen, hacer) {
    var antes = G.origen;
    G.origen = origen;
    try { return hacer(); } finally { G.origen = antes; }
  }

  var AtlasPartida = {
    MAX_PASOS: MAX_PASOS, instantanea: instantanea, final: final,
    reproduce: reproduce, partida: partida, como: como, anota: anota
  };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasPartida; }
  else {
    raiz.AtlasPartida = AtlasPartida;
    if (raiz.AtlasMotor) { graba(raiz.AtlasMotor); }
  }
})(this);
