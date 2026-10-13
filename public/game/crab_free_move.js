/* preceptoros.org · theGame · EL CANGREJO FUNCIONAL (B, FIRMO 2026-10-12): manejo libre ENCIMA del paseo J1.

   El paseo automatico (`AtlasCangrejo.paseo`) sigue siendo suyo e INTOCABLE: esto suma un DESPLAZAMIENTO libre a donde
   el paseo lo pone. Tocar mar vacio lo manda alli (desliza, VEL unidades por cuadro); W/A/S/D lo empujan PASO unidades.
   La NIEBLA es honesta: lo no medido no se pisa. Si el siguiente paso cae en niebla (>= 0,5), se para y la Radio dice
   por que (NO_DATA: no medido).

   SKILLS REALES (B2), de lo que el cangrejo HACE hoy, y de nada mas:
   - SWIM: cada LLEGADA es un evento append-only {tipo:'nado', ciclo, dist}. Nivel = floor(sqrt(llegadas)).
   - REACH: tocar una pieza A SU ALCANCE (a menos de ALCANCE del cangrejo) es un evento {tipo:'alcance', ciclo, que}.
     Nivel = floor(sqrt(alcances)). La PRIMERA vez abre el tutorial (E), si existe.
   Sin eventos: NO_DATA, nunca «nivel 0». Los eventos viven en esta pestana: persistirlos espera firma (declarado).
   Sin red, sin azar; el reloj solo mide el cuadro. */
(function (raiz) {
  'use strict';
  var VEL = 7, PASO = 60, ALCANCE = 160, MAX_EVENTOS = 400;
  var off = { x: 0, y: 0 }, dest = null, eventos = [], recorrido = 0, avisado = '', base0 = null, panel = null, pintados = -1;

  function ciclo() { var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null; return i && typeof i.ciclo === 'number' ? i.ciclo : null; }
  function anota(e) { eventos.push(e); if (eventos.length > MAX_EVENTOS) { eventos.shift(); } }
  function di(texto, sello) { var R = raiz.AtlasRadioChat; if (R && R.dice) { R.dice({ quien: 'Your crab', fuente: 'cangrejo', texto: texto, sello: sello }); } }

  /* Puro: el nivel de una skill de una lista de eventos. Sin eventos, null (NO_DATA). */
  function nivel(evs, tipo) { var n = evs.filter(function (e) { return e.tipo === tipo; }).length; return n ? Math.floor(Math.sqrt(n)) : null; }
  /* Puro: un paso desde `a` hacia `b`, como mucho `v`. Devuelve [x, y, llego]. */
  function avanza(a, b, v) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d <= v) { return [b.x, b.y, true]; }
    return [a.x + dx / d * v, a.y + dy / d * v, false];
  }

  /* Cada cuadro, desde mar-cangrejos (solo TU cangrejo): base = donde lo pone el paseo; circ = lo despejado. */
  function paso(base, circ, niebla) {
    base0 = { x: base.x, y: base.y };
    pintaPanel();
    if (!dest) { return off; }
    var N = niebla || raiz.AtlasNiebla, s = avanza(off, dest, VEL);
    if (N && N.niebla && N.niebla(base.x + s[0], base.y + s[1], circ || []) >= 0.5) {
      dest = null;
      if (avisado !== 'niebla') { avisado = 'niebla'; di('NO_DATA · fog: not measured yet, the crab will not swim into it', 'NO_DATA'); }
      return off;
    }
    recorrido += Math.sqrt((s[0] - off.x) * (s[0] - off.x) + (s[1] - off.y) * (s[1] - off.y));
    off = { x: s[0], y: s[1] };
    if (s[2]) {
      anota({ tipo: 'nado', ciclo: ciclo(), dist: Math.round(recorrido) }); recorrido = 0; dest = null; avisado = '';
      di('arrived · swim level ' + nivel(eventos, 'nado') + ' (' + eventos.filter(function (e) { return e.tipo === 'nado'; }).length + ' trips this session)', 'LIVE');
    }
    return off;
  }
  /* Ir a un punto del MUNDO (base = donde esta el paseo ahora). */
  function va(base, x, y) { dest = { x: Math.round(x - base.x), y: Math.round(y - base.y) }; avisado = ''; return dest; }
  function empuja(dir) {
    var v = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0] }[dir];
    if (!v) { return null; }
    dest = { x: Math.round((dest || off).x + v[0] * PASO), y: Math.round((dest || off).y + v[1] * PASO) }; avisado = '';
    return dest;
  }
  /* ¿Esta (x, y) al alcance del cangrejo (donde lo puso el paseo en el ultimo cuadro + off)? Si si, evento REACH. */
  function alcanza(x, y, que, base, guia) {
    base = base || base0;
    if (!base) { return false; }
    var cx = base.x + off.x, cy = base.y + off.y, d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    if (d > ALCANCE) { return false; }
    var primera = nivel(eventos, 'alcance') === null;
    anota({ tipo: 'alcance', ciclo: ciclo(), que: String(que || 'piece') });
    if (primera && guia !== false && raiz.AtlasTutorial && raiz.AtlasTutorial.abre) { raiz.AtlasTutorial.abre('reach'); return 'tutorial'; }
    return true;
  }
  /* Las skills, legibles (para su panel y para el lab). */
  function skills() {
    var n = eventos.filter(function (e) { return e.tipo === 'nado'; }).length, a = eventos.filter(function (e) { return e.tipo === 'alcance'; }).length;
    return [{ id: 'swim', nombre: 'Swim', nivel: nivel(eventos, 'nado'), eventos: n, causa: n ? null : 'the crab has not swum yet (tap empty sea)' },
            { id: 'reach', nombre: 'Reach', nivel: nivel(eventos, 'alcance'), eventos: a, causa: a ? null : 'nothing touched within reach yet: swim close, then tap it' }];
  }

  /* El panel «Skills» del cajon (el menu lo descubre solo). Se repinta solo cuando llega un evento. */
  function pintaPanel() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja) { return; }
    if (!panel || !panel.isConnected) {
      panel = D.createElement('details'); panel.className = 'thegame-pliego'; panel.id = 'pliego-skills'; panel.open = true;
      var s = D.createElement('summary'); s.textContent = 'Skills'; panel.appendChild(s);
      panel.appendChild(D.createElement('ul'));
      var nota = D.createElement('p'); nota.className = 'atlas-nota';
      nota.textContent = 'Only what your crab really does. Tap empty sea to swim; W A S D also work. These events live in this tab (saving them waits for a signature).';
      panel.appendChild(nota); caja.appendChild(panel); pintados = -1;
    }
    if (pintados === eventos.length) { return; }
    pintados = eventos.length;
    var ul = panel.querySelector('ul'); ul.textContent = '';
    skills().forEach(function (k) {
      var li = D.createElement('li'); li.dataset.skill = k.id; li.dataset.nivel = k.nivel === null ? 'NO_DATA' : String(k.nivel);
      li.textContent = k.nombre + ' · ' + (k.nivel === null ? 'NO_DATA (' + k.causa + ')' : 'level ' + k.nivel + ' · ' + k.eventos + ' actions');
      ul.appendChild(li);
    });
  }

  var AtlasCangrejoLibre = { paso: paso, va: va, empuja: empuja, alcanza: alcanza, skills: skills, nivel: nivel, avanza: avanza,
    desplazamiento: function () { return { x: off.x, y: off.y }; }, base: function () { return base0; }, eventos: function () { return eventos.slice(); }, VEL: VEL, PASO: PASO, ALCANCE: ALCANCE };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCangrejoLibre; } else { raiz.AtlasCangrejoLibre = AtlasCangrejoLibre; }
})(this);
