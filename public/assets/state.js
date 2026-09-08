/* preceptoros.org · State Context + Live Brain badge.
   Dos caras de la misma idea: cuanto mas sabe el frontend, menos tiene que
   adivinar el modelo. Un 3B que no sabe en que idioma le hablan ni con que
   maquina gasta capacidad en deducirlo; si se lo damos hecho, la gasta en
   responder.
   TODO se lee del propio navegador. Cero peticiones de red: si esto pidiera
   algo a un servidor, la frase del pie dejaria de ser cierta. */
(function () {
  function memory() {
    var g = navigator.deviceMemory;
    return g ? g + ' GB' : 'NO_DATA';        // Firefox y Safari no lo exponen
  }
  function platform() {
    var d = navigator.userAgentData;
    return (d && d.platform) || 'NO_DATA';   // se declara, no se adivina del UA
  }
  function steps() {
    // localStorage aqui es LEGITIMO: no guarda soberania, guarda por que paso
    // de la instalacion iba alguien. Si se pierde, no se pierde nada suyo.
    try { return localStorage.getItem('install_steps') || '0'; }
    catch (e) { return '0'; }
  }
  // Bloque delimitado y en ingles: el modelo lo lee como datos, no como una
  // frase mas del sistema, y no se mezcla con lo que escribe la persona.
  /* Los papeles del modelo viven en `prompts-<idioma>.js`, que se carga antes
     que nada. Si ese fichero faltara --404, cache a medias--, `PR` no
     existiria y el chat reventaria al componer el papel en vez de contestar
     peor. Esta linea es la diferencia entre degradar y romper. */
  window.PR = window.PR || {};

  window.stateContext = function () {
    return '\n\n[SYSTEM STATE]\nLanguage: ' + (navigator.language || 'NO_DATA') +
           '\nDevice: ' + platform() +
           '\nRAM: ' + memory() +
           '\nSteps: ' + steps() +
           '\n[/SYSTEM STATE]';
  };

  /* --- Y LO QUE SE INYECTA, SE RETIRA SI VUELVE ---------------------------
     En la captura del telefono del 2026-09-07 se leia, DENTRO de la
     conversacion: `[SYSTEM STATE] ... Device: Android Steps: 1 [/SYSTEM`.
     Cortado por la mitad, que es la firma de un modelo recitando su prompt
     mientras la respuesta se transmite token a token.

     La web no lo estaba pintando mal: el bloque va en el papel del sistema y
     ahi es donde tiene que ir. Lo devolvia el modelo. Un 7B cuantizado recita
     el reglamento cuando el prompt es largo, y eso no se arregla desde aqui.

     Pero SI se puede no enseñarlo. Quien inyecta un bloque delimitado es quien
     tiene que saber retirarlo, y por eso vive en esta hoja y no en el chat: el
     dia que el bloque cambie de forma, la forma y su antidoto se editan
     juntos. El precedente es de la casa -- el chat ya tacha las URLs del
     torrente por la misma razon.

     SE CUENTA LO QUE SE TACHA. Un filtro silencioso convierte un fallo del
     modelo en un fallo invisible, y este proyecto mide los huecos en vez de
     taparlos: cada vez que hay que limpiar se dispara `preceptor:fuga`, que es
     lo que permitira saber si la ronda siguiente del LoRA recita menos.

     Y SE CORTA TAMBIEN LO QUE NO CIERRA. En el torrente la etiqueta de cierre
     llega tarde o no llega: si se esperara a verla, la fuga se quedaria en
     pantalla justo el rato en que alguien la lee. Desde `[SYSTEM` hasta el
     final, fuera. No hay continuacion legitima de esa palabra. */
  var FUGA = /\[\s*\/?\s*SYSTEM[\s\S]*$/i;
  var FUGA_CERRADA = /\[SYSTEM STATE\][\s\S]*?\[\/SYSTEM STATE\]/gi;

  window.sinFuga = function (texto) {
    if (!texto) return texto;
    var limpio = texto.replace(FUGA_CERRADA, '').replace(FUGA, '');
    limpio = limpio.replace(/\n{3,}/g, '\n\n').trim();
    if (limpio !== texto.trim()) {
      document.dispatchEvent(new CustomEvent('preceptor:fuga', {
        detail: { quitado: texto.length - limpio.length }
      }));
    }
    return limpio;
  };

  /* --- El badge del cerebro vivo ---------------------------------------- */
  // Quien mira tiene derecho a saber QUE le esta contestando. «Una IA» no es
  // una respuesta: un 3B en el navegador y un 30B en el rack no son lo mismo.
  var block = document.getElementById('i18n');
  var zone = document.getElementById('brain');
  if (!block || !zone) return;
  var T = JSON.parse(block.textContent);
  // La latencia va SIN clave de i18n a proposito: «ms» se lee igual en los tres
  // idiomas, y una clave mas es una clave mas que puede faltar en uno de ellos.
  // Y solo aparece si se MIDIO: un motor del navegador no tiene sonda barata
  // que cronometrar, asi que ahi el badge se calla en vez de inventar un cero.
  // Un hueco declarado por ausencia es honesto; un cero no lo es.
  function paint(name, live, ms) {
    zone.textContent = T.brainLabel + ' ';
    var n = document.createElement('b');
    n.textContent = name;
    zone.appendChild(n);
    if (typeof ms === 'number' && isFinite(ms)) {
      zone.appendChild(document.createTextNode(' · ' + ms + ' ms'));
    }
    zone.className = 'brain' + (live ? ' live' : '');
    zone.title = live ? T.brainLive : T.brainAsleep;
  }
  /* La fase de espera del cerebro. Vive AQUI y no en chat.js por dos razones:
     #brain es de esta hoja --`zone` ya esta cacheado-- y chat.js esta a dos
     centenares de bytes del techo de 10 KB.

     Y escribe un ATRIBUTO, no una clase. `.brain.live` no vale de enganche
     aunque lo parezca: esa clase ya significa otra cosa --un turno que VOLVIO
     vivo-- y `paint()`, tres lineas mas arriba, reescribe `className` entero
     en cada evento. Reusarla dejaria el anillo girando despues de la
     respuesta. Un atributo no lo pisa nadie.

     El giro, el anillo y el texto en tres idiomas los pinta chat.css sola:
     aqui no hay ni una linea de animacion. */
  window.Fase = function (n) { zone.dataset.fase = n; };

  paint(T.brainNone, false);
  document.addEventListener('preceptor:brain', function (e) {
    var d = e.detail || {};
    paint(d.name || T.brainNone, d.live !== false, d.ms);
  });
})();
