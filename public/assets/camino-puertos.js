/* preceptoros.org · LA TORRE DE PUERTOS EN MODO JUEGO, dentro del piso 4.

   QUE PIDIO EL SOBERANO (2026-09-25): «implementa la logica de escaneo
   sintetico dentro del piso existente de la web publica. NO crees nueva URL.
   Que NUNCA haga peticiones reales a redes externas ni locales desde el
   navegador».

   ES UNA MAQUINA INVENTADA, Y SE DICE EN EL SELLO. La lista de abajo no sale
   de ningun aparato: es una ficha escrita a mano. Un navegador no puede ni
   debe sondear puertos --seria exactamente el escaneo de red que esta casa no
   hace-- y fingir que lo hace seria peor. Lo que se ensena es a LEER una
   salida de `ss -ltn`, que es lo que el piso pide hacer en la maquina propia.

   EL VEREDICTO SALE DE LA FICHA DE USO, NO DEL PUERTO. El piso dice «un puerto
   abierto no es una brecha; decidir cual sobra exige saber para que usas el
   aparato». Por eso la maquina viene con su ficha --que usa su duena y que
   no-- y cada acierto se explica contra ella. Sin ficha, el juego ensenaria lo
   contrario de lo que el piso predica.

   LA LECCION QUE ATA TODO ES LA DIRECCION. `127.0.0.1` solo habla con la
   propia maquina; `0.0.0.0` escucha a toda la red de casa. Es la misma
   leccion que el rack aprendio el 2026-09-25 cerrando Redis a la LAN.

   SIN WORKER, y es medido: son ocho lineas y cero calculo. Un Web Worker
   costaria un fichero y una peticion mas para no descargar a la interfaz de
   nada. El «escaneo» es un temporizador que pinta una linea cada vez.

   UNA SOLA SALIDA, AL PROPIO ORIGEN: `puertos-<lengua>.json`, al pulsar, con
   la prosa traducida. Ninguna otra: la guarda de `test_web.py` lee este codigo
   sin comentarios y exige que no haya mas. */
(function () {
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  /* LA MAQUINA. Datos sin prosa: puerto, direccion, proceso y lo que la ficha
     de uso decide. La explicacion de cada uno vive en `puertos-<lengua>.json`
     bajo la misma clave. */
  var MAQUINA = [
    { p: 22,    dir: '0.0.0.0',    proc: 'sshd',              ok: 'deja' },
    { p: 53,    dir: '127.0.0.1',  proc: 'dnsmasq',           ok: 'deja' },
    { p: 631,   dir: '127.0.0.1',  proc: 'cupsd',             ok: 'deja' },
    { p: 2377,  dir: '0.0.0.0',    proc: 'dockerd',           ok: 'cierra' },
    { p: 5432,  dir: '127.0.0.1',  proc: 'postgres',          ok: 'deja' },
    { p: 6379,  dir: '0.0.0.0',    proc: 'redis-server',      ok: 'cierra' },
    { p: 8000,  dir: '0.0.0.0',    proc: 'python3',           ok: 'cierra' },
    { p: 11434, dir: '127.0.0.1',  proc: 'ollama',            ok: 'deja' }
  ];
  var PASO_MS = 260;

  var TXT = null;
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function T(k) { return (TXT && TXT.ui && TXT.ui[k]) || ''; }

  /* La prosa se pide AL PULSAR: la mayoria no abre el piso 4, y cobrarle a
     todos el texto de un juego que no juegan es el reves de la Torre perezosa.
     Si la lengua no llega, se dice con su causa; no se cae al castellano en
     silencio, que seria traducir por la puerta de atras. */
  function textos() {
    if (TXT) { return Promise.resolve(TXT); }
    return fetch('/puertos-' + lang + '.json').then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    }).then(function (d) { TXT = d; return d; });
  }

  function linea(m) {
    return 'LISTEN  0  128  ' + (m.dir + ':' + m.p + '          ').slice(0, 18) +
           '  users:(("' + m.proc + '"))';
  }

  function juega(caja) {
    while (caja.firstChild) { caja.removeChild(caja.firstChild); }
    caja.appendChild(el('h4', null, T('ficha_titulo')));
    caja.appendChild(el('p', 'ks-tenue', T('ficha')));
    var pre = el('pre', 'pp-salida', '$ ss -ltnp');
    pre.setAttribute('aria-live', 'polite');
    /* La salida de un terminal se lee de izquierda a derecha tambien en
       arabe: heredar `rtl` ponia el `$` al final de la orden. */
    pre.dir = 'ltr';
    caja.appendChild(pre);
    var lista = el('ol', 'pp-lista');
    caja.appendChild(lista);
    var aciertos = 0, hechos = 0;

    function fila(m) {
      var li = el('li', 'pp-fila');
      var cod = el('code', null, m.dir + ':' + m.p + ' · ' + m.proc);
      cod.dir = 'ltr';
      li.appendChild(cod);
      var mandos = el('span', 'pp-mandos');
      var dice = el('p', 'ks-tenue pp-dice');
      ['deja', 'cierra'].forEach(function (v) {
        var b = el('button', 'leve', T(v));
        b.type = 'button';
        b.addEventListener('click', function () {
          mandos.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          var bien = v === m.ok;
          if (bien) { aciertos++; }
          hechos++;
          li.setAttribute('data-veredicto', bien ? 'bien' : 'mal');
          dice.textContent = (bien ? T('acierto') : T('fallo')) + ' ' +
            ((TXT.puertos || {})[String(m.p)] || '');
          if (hechos === MAQUINA.length) { final(); }
        });
        mandos.appendChild(b);
      });
      li.appendChild(mandos);
      li.appendChild(dice);
      lista.appendChild(li);
    }

    function final() {
      caja.appendChild(el('p', 'pp-nota', T('resultado')
        .replace('{n}', aciertos).replace('{t}', MAQUINA.length)));
      caja.appendChild(el('p', null, T('leccion')));
      var otra = el('button', 'leve', T('otra_vez'));
      otra.type = 'button';
      otra.addEventListener('click', function () { juega(caja); });
      caja.appendChild(otra);
    }

    /* EL ESCANEO ES UN RELOJ, no una red. Pinta una linea por paso y, al
       terminar, abre las preguntas: primero se lee, despues se decide. */
    var i = 0;
    (function paso() {
      if (i < MAQUINA.length) {
        pre.textContent += '\n' + linea(MAQUINA[i++]);
        setTimeout(paso, PASO_MS);
        return;
      }
      MAQUINA.forEach(fila);
    })();
  }

  function pinta(cuerpo) {
    var caja = el('section', 'panel-peligro pp-panel');
    caja.id = 'pp-panel';
    var cab = el('div', 'ks-cab');
    var h = el('h3', null, '');
    var sello = el('span', 'ks-sello', '');
    cab.appendChild(h); cab.appendChild(sello);
    caja.appendChild(cab);
    var zona = el('div');
    var boton = el('button', 'boton', '▶');
    boton.type = 'button';
    zona.appendChild(boton);
    caja.appendChild(zona);
    cuerpo.appendChild(caja);

    boton.addEventListener('click', function () {
      boton.disabled = true;
      textos().then(function () {
        h.textContent = T('titulo');
        sello.textContent = T('sello');
        juega(zona);
      }).catch(function (e) {
        boton.disabled = false;
        zona.appendChild(el('p', 'no-data',
          'NO_DATA · puertos-' + lang + '.json: ' + (e && e.message ? e.message : e)));
      });
    });
    /* El rotulo del boton sale de `caminos-<lengua>.json`, que la Torre ya
       trajo: el panel se ve nombrado ANTES de pedir nada. */
    var ui = window.TorreUI || {};
    if (ui.pp_abrir) { boton.textContent = '▶ ' + ui.pp_abrir; }
    if (ui.pp_sello) { sello.textContent = ui.pp_sello; }
    if (ui.camino_puertos_titulo) { h.textContent = ui.camino_puertos_titulo; }
  }

  /* Mismo contrato que `camino-killswitch.js`: se espera al aviso de la Torre,
     y si ya paso, se monta al llegar. */
  function monta() {
    var piso = document.getElementById('piso-puertos');
    if (!piso || piso.querySelector('#pp-panel')) { return; }
    pinta(piso.querySelector('.torre-cuerpo') || piso);
  }
  window.addEventListener('preceptor:torre', monta);
  if (document.getElementById('piso-puertos') && window.TorreUI) { monta(); }
})();
