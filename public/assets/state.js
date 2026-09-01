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
  window.stateContext = function () {
    return '\n\n[SYSTEM STATE]\nLanguage: ' + (navigator.language || 'NO_DATA') +
           '\nDevice: ' + platform() +
           '\nRAM: ' + memory() +
           '\nSteps: ' + steps() +
           '\n[/SYSTEM STATE]';
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
  paint(T.brainNone, false);
  document.addEventListener('preceptor:brain', function (e) {
    var d = e.detail || {};
    paint(d.name || T.brainNone, d.live !== false, d.ms);
  });
})();
