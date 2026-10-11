/* preceptoros.org · theGame · EL TERMINAL DEL CANGREJO (J7, plan de ronda firmado 2026-10-11).

   «Dar a los usuarios en sus terminales web las variables que pueden TOCAR en sus partidas,
   principalmente como cangrejos» (el Soberano). El cangrejo no programa: elige UNA accion del enum
   cerrado `atlas.accion/1` y el MOTOR decide. Este fichero no tiene ni una regla de juego.

   UNA SOLA PUERTA. Todo pasa por `AtlasJuego.aplica`, que traduce la accion a las MISMAS llamadas que
   los botones y devuelve el evento del motor (`atlas.evento/1`, con su `resultado`). Si el motor dice
   `fallo`, el terminal lo ensena tal cual: una accion ilegal la rechaza el motor, no un texto. El enum
   es el del piloto (`atlas-piloto.js`): una lista, no dos.

   TRANSPARENCIA (AI Act art. 50, por eso el nombre): cada linea dice que se pidio y que respondio la
   maquina, en JSON, el dialecto pequeno y tipado que leen igual una persona y una IA (J12). Lo que se
   puede tocar (recursos, profundidad, grieta) sale de la instantanea, no de una copia.

   Nada sale de la pestana: ni red, ni almacen, ni reloj, ni azar. */
(function (raiz) {
  'use strict';
  var Pi = (typeof module === 'object' && module.exports) ? null : raiz.AtlasPiloto;
  var ACCIONES = ['esperar', 'recoger', 'reparar', 'aplazar', 'bajar_a'];
  var BANDAS = ['arrecife', 'ruinas', 'bosque', 'nucleo'];

  function accion(nombre, banda) {
    var a = { esquema: 'atlas.accion/1', accion: nombre, origen: 'humano' };
    if (nombre === 'bajar_a') { a.banda = banda; }
    return a;
  }
  /* Una linea del terminal: lo pedido y lo que contesto el motor (o NO_DATA si no hay partida). */
  function linea(a, ev) {
    var pedido = { accion: a.accion };
    if (a.banda) { pedido.banda = a.banda; }
    var resp = ev === null || ev === undefined ? { estado: 'NO_DATA', causa: 'no game running in this tab' }
      : (ev.tipo ? { resultado: ev.resultado, tipo: ev.tipo, mision: ev.mision, profundidad: ev.profundidad } : { resultado: 'ok', nota: 'waited' });
    return '> ' + JSON.stringify(pedido) + '\n  ' + JSON.stringify(resp);
  }
  /* Lo tocable ahora, de la instantanea: recursos, profundidad, grieta. */
  function variables(i) {
    if (!i) { return '{"estado":"NO_DATA","causa":"no snapshot yet"}'; }
    return JSON.stringify({ recursos: i.recursos, profundidad: i.profundidad, grieta: i.grieta, integridad: i.integridad, ciclo: i.ciclo });
  }
  function ejecuta(a) {
    var J = raiz.AtlasJuego;
    return J && J.aplica ? J.aplica(a) : null;
  }

  function el(tag, clase, texto) { var n = raiz.document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }
  function monta(panel, T) {
    if (!panel || panel.querySelector('.terminal-cangrejo')) { return; }
    T = T || function (k, r) { return r; };
    var d = el('details', 'terminal-cangrejo thegame-pliego');
    d.appendChild(el('summary', null, T('term_h', 'Terminal · what your crab can touch')));
    d.appendChild(el('p', 'atlas-nota', T('term_nota', 'Pick one action. The engine decides and answers; nothing leaves this tab.')));
    var f = el('form', 'terminal-fila'), sa = el('select'), sb = el('select'), go = el('button', 'boton', T('term_run', 'Run'));
    sa.setAttribute('aria-label', 'action'); sb.setAttribute('aria-label', 'depth');
    (Pi && Pi.ACCIONES || ACCIONES).forEach(function (x) { sa.appendChild(el('option', null, x)).value = x; });
    BANDAS.forEach(function (x) { sb.appendChild(el('option', null, x)).value = x; });
    go.type = 'submit'; sb.hidden = true;
    sa.addEventListener('change', function () { sb.hidden = sa.value !== 'bajar_a'; });
    [sa, sb, go].forEach(function (n) { f.appendChild(n); });
    var vars = el('pre', 'terminal-vars'), log = el('pre', 'terminal-log');
    log.setAttribute('aria-live', 'polite'); log.setAttribute('role', 'log');
    function pintaVars() { vars.textContent = variables(raiz.AtlasJuego && raiz.AtlasJuego.instantanea && raiz.AtlasJuego.instantanea()); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = accion(sa.value, sb.value);
      log.textContent = (linea(a, ejecuta(a)) + '\n' + log.textContent).slice(0, 4000);
      pintaVars();
    });
    d.addEventListener('toggle', pintaVars);
    [f, vars, log].forEach(function (n) { d.appendChild(n); });
    panel.appendChild(d);
  }

  var AtlasTerminal = { ACCIONES: ACCIONES, BANDAS: BANDAS, accion: accion, linea: linea, variables: variables, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasTerminal; }
  else { raiz.AtlasTerminal = AtlasTerminal; }
})(this);
