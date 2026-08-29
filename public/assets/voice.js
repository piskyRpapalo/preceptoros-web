/* preceptoros.org · el microfono, y por que vuelve asi.
   Se retiro el 2026-08-26 y con razon: usaba `webkitSpeechRecognition`, que
   manda el audio a servidores de Google, mientras el producto promete que
   nada de lo dicho sale de la maquina. No se envolvio en un aviso — un aviso
   deja la fuga puesta y le pasa la decision a quien menos sabe.

   Vuelve porque hoy existe `processLocally`: reconocimiento EN EL APARATO.
   Y vuelve con una regla dura: si el navegador no puede hacerlo local, el
   boton NO se activa y se dice por que. Nunca se cae al reconocedor de la
   nube. Preferimos no tener microfono a tener uno que filtra.

   Es ademas accesibilidad: quien no ve depende del dictado, y por eso la
   respuesta honesta no puede ser «no hay microfono» a secas, sino decir que
   falta exactamente. */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var block = document.getElementById('i18n');
  var fila = document.getElementById('voice');
  var entrada = document.getElementById('pregunta');
  if (!block || !fila || !entrada) return;
  var T = JSON.parse(block.textContent);

  function decir(texto, clase) {
    var p = fila.parentNode.querySelector('.voice-nota') || document.createElement('p');
    p.className = 'voice-nota ' + (clase || 'tenue');
    p.textContent = texto;
    if (!p.parentNode) fila.parentNode.appendChild(p);
  }

  // Icono en linea y no una imagen: cero peticiones, escala sin pixelarse y
  // hereda el color del canon. El dibujo de la app era bonito de cerca y una
  // calcomania de lejos.
  var MIC = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>';
  var boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'leve mic';
  boton.innerHTML = MIC + '<span class="rotulo">' + T.micHablar + '</span>';
  boton.setAttribute('aria-label', T.micHablar);

  if (!SR || !('processLocally' in SR.prototype)) {
    // Se declara la causa exacta y el boton queda apagado. No hay plan B: el
    // plan B era la nube, y ese es justamente el que no vuelve.
    boton.disabled = true;
    boton.title = T.micSinLocal;
    fila.appendChild(boton);
    decir(T.micSinLocal, 'nodata');
    return;
  }

  var oyendo = false, rec = null;
  boton.addEventListener('click', function () {
    if (oyendo && rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = navigator.language || 'es-ES';
    rec.interimResults = true;
    rec.continuous = false;
    // La linea que lo cambia todo: el audio se queda en el aparato.
    rec.processLocally = true;
    var base = entrada.value;
    rec.onstart = function () { oyendo = true; boton.querySelector('.rotulo').textContent = T.micEscuchando; boton.classList.add('oyendo'); decir(T.micEnAparato); };
    rec.onresult = function (e) {
      var t = '';
      for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      entrada.value = (base ? base + ' ' : '') + t;
      entrada.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = function (e) {
      // `service-not-allowed` y `language-not-supported` son la forma que tiene
      // el navegador de decir «esto solo lo se hacer en la nube». Se para.
      decir(T.micFallo + ' ' + (e.error || '?'), 'nodata');
      oyendo = false; boton.querySelector('.rotulo').textContent = T.micHablar; boton.classList.remove('oyendo');
    };
    rec.onend = function () { oyendo = false; boton.querySelector('.rotulo').textContent = T.micHablar; boton.classList.remove('oyendo'); };
    try { rec.start(); }
    catch (e) { decir(T.micFallo + ' ' + (e && e.message ? e.message : e), 'nodata'); }
  });
  fila.appendChild(boton);
})();
