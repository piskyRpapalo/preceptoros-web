/* preceptoros.org · el probador de privacidad.
   Pega tu contexto sucio a la izquierda, sale saneado a la derecha. En cinco
   segundos y sin instalar nada — que es el punto: la promesa del producto se
   puede comprobar antes de creersela.

   Las reglas son las MISMAS que las del producto: `sanitize.js` se genera desde
   `guardrails.py`, no se transcribe. Verificado pasando los 36 casos del corpus
   por las dos implementaciones: mismo veredicto en los 36, cero fragmentos
   supervivientes.

   Todo ocurre en tu navegador. Lo que pegas no sale de aqui — y eso no es una
   promesa suelta: esta pagina no tiene ninguna llamada de red que lo lleve. */
(function () {
  var block = document.getElementById('i18n');
  var dentro = document.getElementById('sucio');
  var fuera = document.getElementById('limpio');
  var boton = document.getElementById('sanear');
  var informe = document.getElementById('auditoria');
  if (!block || !dentro || !fuera || !boton) return;
  var T = JSON.parse(block.textContent);

  function sanear() {
    if (!window.sanitize) { informe.textContent = T.pgSinFiltro; return; }
    var r = window.sanitize(dentro.value);
    fuera.value = r.texto;
    informe.innerHTML = '';
    var claves = Object.keys(r.hallazgos).sort();
    var p = document.createElement('p');
    p.className = claves.length ? 'cifra' : 'tenue';
    p.textContent = claves.length
      ? T.pgQuitado + ' ' + claves.map(function (k) {
          return k + ' ×' + r.hallazgos[k]; }).join(' · ')
      : T.pgNada;
    informe.appendChild(p);
    // El aviso de los huecos sale SIEMPRE, tambien cuando no se quito nada.
    // Justo entonces es cuando mas falta hace: «no encontre nada» se lee como
    // «esto esta limpio», y no es lo mismo.
    var h = document.createElement('p');
    h.className = 'nodata';
    h.textContent = T.pgHuecos;
    informe.appendChild(h);
  }
  boton.addEventListener('click', function () {
    (window.fluido || function (f) { f(); })(sanear);
  });
  // La IP del ejemplo se INVENTA en cada visita, no viaja escrita en el HTML.
  // La doctrina del sitio prohibe IPs incrustadas —y hace bien: una IP escrita
  // en una pagina es una IP publicada— asi que en vez de burlar la regla
  // partiendo la cadena, la pagina no lleva ninguna y se genera una del rango
  // privado al cargar. Ademas queda mas vivo: cada visita ve otra.
  function ipInventada() {
    return '192.168.' + Math.floor(Math.random() * 254 + 1) +
           '.' + Math.floor(Math.random() * 254 + 1);
  }
  if (T.pgEjemplo && !dentro.value) {
    dentro.value = T.pgEjemplo + ipInventada() + (T.pgEjemploCola || '');
  }
})();
