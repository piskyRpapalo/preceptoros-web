/* preceptoros.org · theGame · EL TERMINAL DEL CANGREJO (J7, plan de ronda firmado 2026-10-11).

   «Dar a los usuarios en sus terminales web las variables que pueden TOCAR en sus partidas,
   principalmente como cangrejos» (el Soberano). El cangrejo no programa: elige UNA accion del enum
   cerrado `atlas.accion/1` y el MOTOR decide. Este fichero no tiene ni una regla de juego.

   UNA SOLA PUERTA. Todo pasa por `AtlasJuego.aplica`, que traduce la accion a las MISMAS llamadas que
   los botones y devuelve el evento del motor (`atlas.evento/1`, con su `resultado`). Si el motor dice
   `fallo`, el terminal lo ensena tal cual: una accion ilegal la rechaza el motor, no un texto. El enum
   es el del piloto (`atlas-piloto.js`): una lista, no dos.

   TRANSPARENCIA (AI Act art. 50, por eso el nombre): cada linea dice en texto que se pidio y que respondio
   la maquina. Lo que se puede tocar (recursos, profundidad, grieta) sale de la instantanea, no de una copia.

   LO DE LA PARTIDA VA PLEGADO AQUI (R2, plan «el refresco»: la pestana Help desaparece). `monta` recibe la
   caja de la partida (guardar/exportar, la ayuda, el pie) y la mete dentro; el contador de farmeo y opinar
   firmado se crean aqui y su codigo baja AL PULSAR (`atlas-hud.js`, `atlas-opina.js`), fuera de la puerta.

   Nada sale de la pestana: ni red, ni almacen, ni reloj, ni azar. */
(function (raiz) {
  'use strict';
  var Pi = (typeof module === 'object' && module.exports) ? null : raiz.AtlasPiloto;
  var ACCIONES = ['esperar', 'recoger', 'reparar', 'aplazar', 'bajar_a', 'mover'];
  var BANDAS = ['arrecife', 'ruinas', 'bosque', 'nucleo'];
  var DIRS = ['izq', 'arr', 'aba', 'der', 'casa', 'faro'];

  /* `extra` es la banda de `bajar_a` o la direccion de `mover` (la flecha del mapa, R2c). */
  function accion(nombre, extra) {
    var a = { esquema: 'atlas.accion/1', accion: nombre, origen: 'humano' };
    if (nombre === 'bajar_a') { a.banda = extra; }
    if (nombre === 'mover') { a.dir = extra; }
    return a;
  }
  /* Una linea del terminal: lo pedido y lo que contesto el motor (o NO_DATA si no hay partida). */
  function linea(a, ev) {
    var pedido = a.accion + (a.banda ? ' · ' + a.banda : '') + (a.dir ? ' · ' + a.dir : '');
    if (ev === null || ev === undefined) { return 'Action: ' + pedido + '\nResult: NO_DATA · no game running in this tab'; }
    var resultado = ev.resultado || 'ok', detalle = ev.mision || ev.profundidad || ev.dir || 'engine replied';
    return 'Action: ' + pedido + '\nResult: ' + resultado + (ev.tipo ? ' · ' + ev.tipo : '') + ' · ' + detalle;
  }
  /* Lo tocable ahora, en texto humano desde la misma instantanea. */
  function variables(i) {
    if (!i) { return 'NO_DATA · no snapshot yet'; }
    var r = i.recursos || {}, d = function (v) { return v === undefined || v === null ? 'NO_DATA' : v; };
    return 'Cycle: ' + d(i.ciclo) + '\nCore integrity: ' + d(i.integridad) + '\nDepth: ' + d(i.profundidad) +
      '\nRift: ' + (i.grieta ? (i.grieta.abierta ? 'open' : 'sealed · ' + d(i.grieta.cierre) + ' cycles') : 'NO_DATA') +
      '\nFiltered sunlight: ' + d(r.luz) + '\nBiomass: ' + d(r.biomasa) + '\nFlow: ' + d(r.flujo) + '\nCopper: ' + d(r.cobre);
  }
  function ejecuta(a) {
    var J = raiz.AtlasJuego;
    return J && J.aplica ? J.aplica(a) : null;
  }

  function el(tag, clase, texto) { var n = raiz.document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }
  /* El contador de farmeo y opinar firmado, en la caja de la partida; su guion se pide al pulsar. */
  function partida(caja) {
    var d = raiz.document, capa = d.getElementById('thegame'), J = raiz.AtlasJuego, th = J && J.texto('hud_t');
    function pide(src, listo) { var s = d.createElement('script'); s.src = src; s.onload = listo; d.head.appendChild(s); }
    if (th) {
      var h = el('details', 'atlas-hud-farmeo'); h.appendChild(el('summary', null, th)); caja.appendChild(h);
      h.addEventListener('toggle', function () { if (h.open && !raiz.AtlasHud) { pide('/assets/atlas-hud.js', function () { raiz.AtlasHud.monta(capa, h); }); } });
    }
    var bo = el('button', 'boton-sec thegame-opina', J ? J.texto('opina') : 'Opinion'); bo.type = 'button';
    bo.addEventListener('click', function () {
      if (raiz.AtlasOpina) { raiz.AtlasOpina.abre(capa); } else { pide('/assets/atlas-opina.js', function () { raiz.AtlasOpina.abre(capa); }); }
    });
    caja.appendChild(bo);
  }
  function monta(panel, T, caja) {
    if (!panel || panel.querySelector('.terminal-cangrejo')) { return; }
    T = T || function (k, r) { return r; };
    var d = el('details', 'terminal-cangrejo thegame-pliego');
    d.appendChild(el('summary', null, T('term_h', 'Terminal · what your crab can touch')));
    d.appendChild(el('p', 'atlas-nota', T('term_nota', 'Pick one action. The engine decides and answers; nothing leaves this tab.')));
    var f = el('form', 'terminal-fila'), sa = el('select'), sb = el('select'), sd = el('select'), go = el('button', 'boton', T('term_run', 'Run'));
    sa.setAttribute('aria-label', 'action'); sb.setAttribute('aria-label', 'depth'); sd.setAttribute('aria-label', 'direction');
    (Pi && Pi.ACCIONES || ACCIONES).forEach(function (x) { sa.appendChild(el('option', null, x)).value = x; });
    BANDAS.forEach(function (x) { sb.appendChild(el('option', null, x)).value = x; });
    (Pi && Pi.DIRS || DIRS).forEach(function (x) { sd.appendChild(el('option', null, x)).value = x; });
    go.type = 'submit'; sb.hidden = true; sd.hidden = true;
    sa.addEventListener('change', function () { sb.hidden = sa.value !== 'bajar_a'; sd.hidden = sa.value !== 'mover'; });
    [sa, sb, sd, go].forEach(function (n) { f.appendChild(n); });
    var vars = el('pre', 'terminal-vars'), log = el('pre', 'terminal-log');
    log.setAttribute('aria-live', 'polite'); log.setAttribute('role', 'log');
    function pintaVars() { vars.textContent = variables(raiz.AtlasJuego && raiz.AtlasJuego.instantanea && raiz.AtlasJuego.instantanea()); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = accion(sa.value, sa.value === 'mover' ? sd.value : sb.value);
      log.textContent = (linea(a, ejecuta(a)) + '\n' + log.textContent).slice(0, 4000);
      pintaVars();
    });
    d.addEventListener('toggle', pintaVars);
    [f, vars, log].forEach(function (n) { d.appendChild(n); });
    if (caja) { partida(caja); d.appendChild(caja); }
    panel.appendChild(d);
  }

  var AtlasTerminal = { ACCIONES: ACCIONES, BANDAS: BANDAS, DIRS: DIRS, accion: accion, linea: linea, variables: variables, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTerminal; }
  else { raiz.AtlasTerminal = AtlasTerminal; }
})(this);
