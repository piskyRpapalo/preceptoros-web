/* preceptoros.org · theGame · EL CANGREJO FUNCIONAL (B, FIRMO 2026-10-12): manejo libre ENCIMA del paseo J1.

   El paseo automatico (`AtlasCangrejo.paseo`) sigue siendo suyo e INTOCABLE: esto suma un DESPLAZAMIENTO libre a donde
   el paseo lo pone. Tocar mar vacio lo manda alli (desliza, VEL unidades por cuadro); los botones direccionales lo
   empujan PASO unidades. El control por voz sigue NO_DATA: reconocimiento local no habilitado ni medido.
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
  var off = { x: 0, y: 0 }, dest = null, eventos = [], conteos = { nado: 0, alcance: 0 }, revisionEventos = 0;
  var recorrido = 0, avisado = '', base0 = null, panel = null, pintados = -1;
  var audioActivado = false;

  /* Reusa el contrato del ciclo del arrecife/NPC: entero seguro no negativo hasta 1e9. */
  function ciclo() {
    try {
      var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null, c = i && i.ciclo;
      return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000 ? c : null;
    } catch (_) { return null; }
  }
  function anota(e) {
    eventos.push(e); if (eventos.length > MAX_EVENTOS) { eventos.shift(); }
    if (Object.prototype.hasOwnProperty.call(conteos, e.tipo)) { conteos[e.tipo]++; }
    revisionEventos++;
    if (audioActivado) {
      var A = raiz.AudioFeedbackManager, tipo = e.tipo === 'nado' ? 'swim' : (e.tipo === 'alcance' ? 'reach' : null);
      if (A && tipo) { reflejaAudio(A.procesar({ habilidad: tipo, eventos: Math.min(MAX_EVENTOS, conteos[e.tipo]) })); }
    }
  }
  function di(texto, sello) { var R = raiz.AtlasRadioChat; if (R && R.dice) { R.dice({ quien: 'Your crab', fuente: 'cangrejo', texto: texto, sello: sello }); } }

  /* Puro: el nivel de una skill de una lista de eventos. Sin eventos, null (NO_DATA). */
  function nivel(evs, tipo) { var n = evs.filter(function (e) { return e.tipo === tipo; }).length; return n ? Math.floor(Math.sqrt(n)) : null; }
  function nivelContado(n) { return n ? Math.floor(Math.sqrt(n)) : null; }
  /* Puro: un paso desde `a` hacia `b`, como mucho `v`. Devuelve [x, y, llego]. */
  function avanza(a, b, v) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d <= v) { return [b.x, b.y, true]; }
    return [a.x + dx / d * v, a.y + dy / d * v, false];
  }

  /* Cada cuadro, desde mar-cangrejos (solo TU cangrejo): base = donde lo pone el paseo; circ = lo despejado. */
  function paso(base, circ, niebla) {
    base0 = { x: base.x, y: base.y };
    if (pintados !== revisionEventos) { pintaPanel(); }
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
      di('arrived · swim level ' + nivelContado(conteos.nado) + ' (' + conteos.nado + ' trips this tab)', 'LIVE');
    }
    return off;
  }
  /* Ir a un punto del MUNDO (base = donde esta el paseo ahora). */
  function va(base, x, y) { dest = { x: Math.round(x - base.x), y: Math.round(y - base.y) }; avisado = ''; return dest; }
  function empuja(dir) {
    var v = { north: [0, -1], west: [-1, 0], south: [0, 1], east: [1, 0] }[dir];
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
    var primera = conteos.alcance === 0;
    anota({ tipo: 'alcance', ciclo: ciclo(), que: String(que || 'piece') });
    if (primera && guia !== false && raiz.AtlasTutorial && raiz.AtlasTutorial.abre) { raiz.AtlasTutorial.abre('reach'); return 'tutorial'; }
    return true;
  }
  /* Las skills, legibles (para su panel y para el lab). */
  function skills() {
    var n = conteos.nado, a = conteos.alcance;
    return [{ id: 'swim', nombre: 'Swim', nivel: nivelContado(n), eventos: n, causa: n ? null : 'the crab has not swum yet (tap empty sea)' },
            { id: 'reach', nombre: 'Reach', nivel: nivelContado(a), eventos: a, causa: a ? null : 'nothing touched within reach yet: swim close, then tap it' }];
  }

  function reflejaAudio(r) {
    var p = panel && panel.querySelector('[data-audio-status]');
    if (!p) { return; }
    p.textContent = r && r.estado === 'SONADO' ? 'Audio feedback: local synthesis scheduled.' :
      (r && r.estado === 'HABILITADO' ? 'Audio feedback is enabled. Local synthesis is scheduled on the next Swim or Reach event.' :
      'Audio feedback: ' + (r && r.causa ? r.causa : 'NO_DATA: audio feedback manager unavailable'));
  }

  /* El panel «Skills» del cajon (el menu lo descubre solo). Se repinta solo cuando llega un evento. */
  function pintaPanel() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja) { return; }
    if (!panel || !panel.isConnected) {
      panel = D.createElement('details'); panel.className = 'thegame-pliego'; panel.id = 'pliego-skills'; panel.open = true;
      var s = D.createElement('summary'); s.textContent = 'Skills'; panel.appendChild(s);
      var listaSkills = D.createElement('ul'); listaSkills.setAttribute('aria-live', 'polite'); panel.appendChild(listaSkills);
      var nota = D.createElement('p'); nota.className = 'atlas-nota';
      nota.textContent = 'Only what your crab really does. Tap empty sea or use the directional buttons to swim. Events stay in this tab; saving waits for a signature. Totals last for this tab; recent detail keeps 400 events (older rows roll off).';
      panel.appendChild(nota);
      var mandos = D.createElement('div'); mandos.className = 'crab-joystick'; mandos.setAttribute('role', 'group'); mandos.setAttribute('aria-label', 'Crab movement');
      [['north', '↑', 'Move north'], ['west', '←', 'Move west'], ['south', '↓', 'Move south'], ['east', '→', 'Move east']].forEach(function (d) {
        var b = D.createElement('button'); b.type = 'button'; b.className = 'boton-sec'; b.textContent = d[1]; b.setAttribute('aria-label', d[2]);
        b.addEventListener('click', function () { empuja(d[0]); }); mandos.appendChild(b);
      });
      panel.appendChild(mandos);
      var voz = D.createElement('p'); voz.className = 'atlas-nota'; voz.setAttribute('data-voice-control', 'NO_DATA');
      voz.textContent = 'Voice movement: NO_DATA (speech recognition is not enabled or measured here).'; panel.appendChild(voz);
      var botonAudio = D.createElement('button'); botonAudio.type = 'button'; botonAudio.textContent = 'Enable audio feedback'; botonAudio.setAttribute('aria-pressed', 'false');
      var estadoAudio = D.createElement('p'); estadoAudio.setAttribute('data-audio-status', ''); estadoAudio.setAttribute('role', 'status'); estadoAudio.textContent = 'Audio feedback is off.';
      botonAudio.addEventListener('click', function () {
        var A = raiz.AudioFeedbackManager;
        if (!A) { audioActivado = false; botonAudio.setAttribute('aria-pressed', 'false'); reflejaAudio(null); return; }
        if (audioActivado) {
          A.deshabilitar(); audioActivado = false; botonAudio.textContent = 'Enable audio feedback'; botonAudio.setAttribute('aria-pressed', 'false');
          estadoAudio.textContent = 'Audio feedback is off.';
        } else {
          var r = A.habilitar(); audioActivado = r.estado === 'HABILITADO';
          botonAudio.textContent = audioActivado ? 'Turn off audio feedback' : 'Enable audio feedback'; botonAudio.setAttribute('aria-pressed', audioActivado ? 'true' : 'false'); reflejaAudio(r);
        }
      });
      panel.appendChild(botonAudio); panel.appendChild(estadoAudio);
      caja.appendChild(panel); pintados = -1;
    }
    if (pintados === revisionEventos) { return; }
    pintados = revisionEventos;
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
