/* preceptoros.org · EL PISO ABIERTO GOBIERNA EL CHAT.
 *
 * QUE PIDIO EL SOBERANO (2026-09-22), en cuatro frases:
 *   · «en home, abre por defecto el piso 1»;
 *   · «encima de la ventana del chat, el titulo, para que el usuario lo sepa»;
 *   · «este titulo debe cambiar cuando abre los otros paneles de la torre,
 *     cambiando tambien los modelos que hablan»;
 *   · «cuando el usuario abre el panel, el chat superior cambia directamente».
 *
 * QUIEN HABLA EN CADA PISO lo dice `cerebros.json` › `pisos`: reparto por
 * oficio, firmado ese mismo dia. Dos pisos --1 y 7-- contestan DESDE EL
 * NAVEGADOR, porque son los que prometen seguir en modo avion; los demas,
 * desde el rack. Este fichero no decide ninguno: lee el reparto y lo aplica.
 *
 * COMO LO APLICA SIN REESCRIBIR A NADIE. `camino.js` pinta los pisos y
 * `camino-papel.js` sabe vestir el chat con el papel de un piso (`viste`).
 * Aqui se ENVUELVE `TorrePapel.viste`: cualquiera que pida vestir un piso
 * --el propio `camino.js` al entrar, o este fichero al abrir uno-- pasa por
 * el reparto. `camino.js` busca `P.viste` en el momento de llamar, asi que
 * envolver el metodo basta y no hay que tocar aquel fichero.
 *
 * Y SE ABRE UNO CADA VEZ. Si dos pisos pudieran estar abiertos, «el piso
 * actual» no significaria nada y el titulo de arriba mentiria sobre uno de
 * los dos. Abrir uno cierra los demas.
 *
 * LA FIRMA VIVE EN EL CHAT. «Firmar este paso» estaba dentro de cada piso;
 * se monta ahora debajo del titulo, junto a la conversacion de la que habla.
 * El que la monta sigue siendo `TorrePapel.montaFirma`: aqui solo se le dice
 * donde.
 */
(function () {
  'use strict';
  if (window.PisoChat) return;
  window.PisoChat = true;

  var P = window.TorrePapel;
  if (!P || !P.viste) return;            // sin la Torre no hay pisos que gobernar
  var original = P.viste;
  var UI = window.TorreUI || null;
  var REG = null, PROSA = {};
  var actual = null;

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = String(x);
    return n;
  }
  function X(k) {
    var T = window.MotorTextosYa || {};
    return T[k] || k;
  }
  if (window.MotorTextos) {
    window.MotorTextos().then(function (T) { window.MotorTextosYa = T; if (actual) pintaBarra(actual); });
  }

  function estilo() {
    if (document.getElementById('piso-estilo')) return;
    var s = el('style'); s.id = 'piso-estilo';
    /* El titulo lleva la ESCENA del piso detras, con el mismo velo que el
       piso cerrado: quien baja a la Torre y vuelve reconoce arriba el mismo
       dibujo que acaba de abrir. La imagen la pone `torre-visuales.js`. */
    s.textContent =
      '#piso-actual{position:relative;margin:0 0 .6rem;padding:.7rem .9rem;' +
        'border-radius:var(--radius,.6rem);color:#fff;' +
        'border:1px solid rgba(242,208,138,.55);min-height:4.2rem;' +
        'background:linear-gradient(90deg,rgba(18,12,30,.9),rgba(18,12,30,.55) 60%,' +
        'rgba(18,12,30,.25)),var(--lamina,none) center 58%/cover no-repeat,#241a35;' +
        'text-shadow:0 1px 2px #000,0 0 10px rgba(0,0,0,.6)}' +
      '#piso-actual .piso-n{margin:0;font-size:.68rem;letter-spacing:.12em;' +
        'text-transform:uppercase;color:var(--oro,#f2d08a)}' +
      '#piso-actual .piso-titulo{margin:.1rem 0 .25rem;padding:0;border:0;' +
        'font-size:1.15rem;letter-spacing:.02em;text-transform:none;color:#fff}' +
      '#piso-actual .piso-habla{margin:0;font-size:.78rem;opacity:.92}' +
      '#piso-actual .piso-lleva{text-shadow:none}' +   // el halo es del titulo, no del boton
      '#piso-actual .torre-mandos{margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap}' +
      // `display:flex` le gana a `hidden` por especificidad: sin esto la firma
      // se ve aunque este escondida. Paso una vez, se vio en el navegador.
      '#piso-actual .torre-mandos[hidden]{display:none}' +
      '#piso-actual .veredicto{flex-basis:100%;text-shadow:none}' +
      '#piso-actual .veredicto-salida{margin-top:.4rem;padding:.5rem .7rem;' +
        'border-radius:var(--radius,.6rem);background:rgba(18,12,30,.78)}' +
      '#piso-actual .veredicto-capa{margin:.3rem 0 .15rem;font-size:.7rem;' +
        'letter-spacing:.08em;text-transform:uppercase;color:var(--oro,#f2d08a)}' +
      '#piso-actual .veredicto-reglas{margin:0;padding-left:1rem;font-size:.8rem}' +
      '#piso-actual .veredicto-reglas .ko{color:#ffb3a7}' +
      '#piso-actual .veredicto-juez{font-size:.82rem;white-space:pre-wrap;margin:.2rem 0 0}' +
      '#piso-actual .torre-firma{display:flex;flex-direction:column;gap:.4rem;margin-top:.5rem}' +
      '#piso-actual .torre-firma textarea{font:inherit;width:100%;box-sizing:border-box;' +
        'color:inherit;background:rgba(18,12,30,.6);border:1px solid rgba(242,208,138,.5);' +
        'border-radius:.3rem;padding:.4rem}';
    document.head.appendChild(s);
  }

  function barra() {
    var b = document.getElementById('piso-actual');
    if (b) return b;
    var chat = document.getElementById('chat');
    if (!chat || !chat.parentNode) return null;
    estilo();
    b = el('section', 'piso-actual'); b.id = 'piso-actual';
    b.setAttribute('aria-live', 'polite');
    chat.parentNode.insertBefore(b, chat);
    return b;
  }

  function cerebroDe(p) {
    var m = REG && REG.pisos && REG.pisos[p];
    if (!m) return null;
    var c = (REG.cerebros || []).filter(function (x) { return x.id === m.cerebro; })[0];
    return c ? { c: c, donde: m.donde } : null;
  }

  function pintaBarra(p) {
    var b = barra();
    if (!b || !UI) return;
    var d = document.getElementById('piso-' + p);
    var n = d && d.querySelector('.torre-n');
    var nivel = n ? n.textContent.replace(/[\s·]+$/, '') : (UI.torre_nivel || '');
    var q = cerebroDe(p);
    b.innerHTML = '';
    var lam = window.TorreLaminas && window.TorreLaminas[p];
    if (lam) b.style.setProperty('--lamina', 'url(/assets/torre/piso-' + lam + '.webp)');
    b.appendChild(el('p', 'piso-n', nivel));
    b.appendChild(el('h2', 'piso-titulo', UI['camino_' + p + '_titulo'] || p));
    /* UN BOTON VIOLETA, NO UNA LINEA (el Soberano, 2026-09-23): «Habla: El
       Mini · en tu navegador» pasa a ser una invitacion que se pulsa y lleva
       a la ficha del modelo, bajo el chat, que parpadea al llegar
       (`lleva.js`). En los pisos del navegador invita a descargar; en los del
       rack, a conocer a quien contesta. */
    if (q) {
      var nombre = (PROSA[q.c.id] || {}).nombre || q.c.id;
      var ir = el('button', 'piso-lleva', q.donde === 'navegador'
        ? X('pisoLlevaNav')
        : X('pisoLlevaRack').replace('{n}', nombre));
      ir.type = 'button';
      ir.setAttribute('data-lleva', '#especificaciones');
      b.appendChild(ir);
    } else {
      // Sin reparto para este piso no se inventa quien habla: se dice.
      b.appendChild(el('p', 'no-data', 'NO_DATA · cerebros.json › pisos › ' + p));
    }
    /* La firma, debajo del titulo. `montaFirma` pone su boton en `mandos` y su
       caja en el padre de `mandos`: aqui el padre es la propia barra.
       SOLO CUANDO YA SE HA HABLADO (el Soberano, al verla): firmar un paso que
       no se ha dado es firmar en blanco. Nace escondida y la destapa el primer
       turno que termina en este piso (`preceptor:turno`). */
    if (P.montaFirma) {
      var mandos = el('div', 'torre-mandos');
      mandos.id = 'piso-firma';
      mandos.hidden = !hablado[p];
      b.appendChild(mandos);
      P.montaFirma(p, UI, mandos, el);
      /* EL JUEZ, AL LADO DE LA FIRMA (2026-09-23): dos capas --reglas en el
         aparato y modelo juez en el rack-- contra el objetivo del piso. Nace
         escondido con la firma: juzgar sin respuesta no juzga nada. */
      if (window.Veredicto) {
        window.Veredicto.monta(mandos, {
          pregunta: function () { return ultimo().q; },
          respuesta: function () { return ultimo().r; },
          papel: function () { return P.papelDelPiso ? P.papelDelPiso(p, UI) : ''; },
          objetivo: function () { return window.Veredicto.texto('camino_' + p + '_aprender'); }
        });
      }
    }
  }
  var hablado = {};
  // La ultima pregunta de la persona y lo que contesto el modelo, del dialogo.
  function ultimo() {
    var ps = document.querySelectorAll('#dialogo p');
    for (var i = ps.length - 1; i >= 0; i--) {
      if (ps[i].classList.contains('tu')) {
        var r = ps[i + 1] ? ps[i + 1].textContent : '';
        return { q: ps[i].textContent, r: r };
      }
    }
    return { q: '', r: '' };
  }
  document.addEventListener('preceptor:turno', function () {
    if (!actual) return;
    hablado[actual] = true;
    var f = document.getElementById('piso-firma');
    if (f) f.hidden = false;
  });

  /* LOS ATAJOS DEL MODELO QUE HABLA (2026-09-23). El Soberano: «los atajos
     tienen residuo antiguo; deben estar preparados para los modelos
     presentados en la web». El catalogo ya los traia por modelo --el orden en
     `cerebros.json` › `atajos`, el rotulo y el prompt en `cerebros-<lengua>`--
     y su nota lo dice: son «la interfaz de las conductas entrenadas». Asi que
     la fila bajo el campo cambia con el piso, igual que el titulo.

     EL ATAJO ESCRIBE, NO MANDA. Deja su prompt en el campo y el cursor alli:
     quien lo pulsa lee lo que va a enviar antes de enviarlo. Un atajo que
     manda solo es un boton que habla por ti. */
  function pintaAtajos(c) {
    var caja = document.getElementById('atajos');
    var campo = document.getElementById('pregunta');
    if (!caja || !campo) return;
    caja.innerHTML = '';
    var prosa = (PROSA[c.id] || {}).atajos || {};
    (c.atajos || []).forEach(function (k) {
      var a = prosa[k];
      if (!a || !a.rotulo || !a.prompt) return;   // sin texto no hay boton
      var b = el('button', 'atajo', a.rotulo);
      b.type = 'button';
      b.title = a.prompt;
      b.addEventListener('click', function () {
        campo.value = a.prompt;
        campo.focus();
        campo.dispatchEvent(new Event('input', { bubbles: true }));
      });
      caja.appendChild(b);
    });
    caja.hidden = !caja.children.length;
  }

  /* VESTIR UN PISO, SEGUN EL REPARTO. */
  function ponPiso(p) {
    var q = cerebroDe(p);
    if (!q) return original(p, UI);      // sin reparto: como antes de hoy
    var cambia = p !== actual;
    actual = p;
    if (q.donde === 'navegador') {
      window.CerebroDelPiso = null;
      var N = REG.navegador || {};
      document.dispatchEvent(new CustomEvent('preceptor:companero', { detail: {
        id: 'torre-' + p, nombre: UI['camino_' + p + '_titulo'] || p,
        navegador: true, modelo: N.webllm || q.c.modelo,
        nido: P.papelDelPiso ? P.papelDelPiso(p, UI) : null, disponible: true } }));
    } else {
      window.CerebroDelPiso = q.c.modelo;
      original(p, UI);
    }
    if (window.CerebroFicha) window.CerebroFicha(q.c.modelo, REG, PROSA, q.donde);
    pintaAtajos(q.c);
    if (cambia) pintaBarra(p);
    /* La practica del piso se ve en el campo, como sugerencia y no como texto
       escrito: quien decide que mandar es la persona. */
    var entrada = document.getElementById('pregunta');
    var frase = UI['camino_' + p + '_frase'];
    if (entrada && frase) entrada.placeholder = frase;
    return true;
  }

  P.viste = function (p, ui) {
    if (ui) UI = ui;
    if (!REG || !UI) return false;       // quien llama reintenta al llegar el catalogo
    return ponPiso(p);
  };

  /* SIN MOTOR EN UN PISO DEL NAVEGADOR: el primer mensaje lo explica, y se
     señala el boton de descarga en vez de dejar un chat que no contesta. */
  window.sinMotor = function () {
    var q = actual && cerebroDe(actual);
    if (!q || q.donde !== 'navegador') return null;
    // Se le lleva a la ventana de descarga, y parpadea: ahi esta el boton.
    if (window.Lleva) window.Lleva('#especificaciones');
    return X('pisoBajaPrimero');
  };

  /* El piso abierto al entrar: el mismo que `camino.js` llama INICIAL. */
  var INICIAL = 'primeros_pasos';

  /* UNO ABIERTO CADA VEZ, Y EL PRIMERO ABIERTO AL ENTRAR. */
  function engancha() {
    var pisos = Array.prototype.slice.call(
      document.querySelectorAll('#torre details.torre-peldano'));
    pisos.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        pisos.forEach(function (o) { if (o !== d && o.open) o.open = false; });
        P.viste(d.id.replace(/^piso-/, ''), UI);
      });
    });
    /* `#piso-<id>` en la direccion abre ESE piso (lo usa la puerta theGame,
       que lleva a `#piso-atlas`); si no, el inicial. */
    function porDireccion() {
      var d = /^#piso-\w+$/.test(location.hash) && document.getElementById(location.hash.slice(1));
      if (d && d.classList.contains('torre-peldano')) { d.open = true; d.scrollIntoView(); return true; }
      return false;
    }
    window.addEventListener('hashchange', porDireccion);
    var uno = document.getElementById('piso-' + INICIAL);
    if (!porDireccion() && uno && !pisos.some(function (d) { return d.open; })) uno.open = true;
  }

  function conCatalogo(r) {
    REG = r.reg; PROSA = r.prosa || {};
    if (UI) ponPiso(actual || INICIAL);
  }
  if (window.CerebrosReg) conCatalogo(window.CerebrosReg);
  else document.addEventListener('preceptor:cerebros', function (e) {
    conCatalogo(window.CerebrosReg || e.detail || {});
  });

  function conTorre(ui) {
    UI = ui || UI;
    engancha();
    if (REG) ponPiso(actual || INICIAL);
  }
  if (window.TorreUI) conTorre(window.TorreUI);
  else window.addEventListener('preceptor:torre', function (e) {
    conTorre(e.detail && e.detail.ui);
  }, { once: true });
})();
