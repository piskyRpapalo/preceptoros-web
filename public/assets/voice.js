/* preceptoros.org · el microfono, y por que vuelve asi.
   Se retiro el 2026-08-26 y con razon: usaba `webkitSpeechRecognition`, que
   manda el audio a servidores de Google, mientras el producto promete que
   nada de lo dicho sale de la maquina. No se envolvio en un aviso — un aviso
   deja la fuga puesta y le pasa la decision a quien menos sabe.

   Vuelve porque hoy existe `processLocally`: reconocimiento EN EL APARATO.
   Cuando el navegador puede hacerlo local, se hace local y no se pregunta
   nada: no hay trato que ofrecer si no sale nada de la maquina.

   Y DESDE EL 2026-09-05 HAY UNA SEGUNDA VIA, pedida por el Soberano: si el
   navegador NO sabe dictar en el aparato pero sabe hacerlo por la nube, el
   boton la ofrece -- y solo la usa despues de que la persona acepte el trato,
   dicho entero: tu voz sale de aqui y va a Google.

   Esto NO es el aviso que se rechazo en agosto. Aquel dejaba la fuga puesta y
   avisaba; este no enciende nada hasta que hay un si, y el si dura una sesion
   --`sessionStorage`--: al recargar se vuelve a preguntar. Un permiso que se
   queda para siempre es el mismo agujero con mejores modales.

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
    /* LA EXPLICACION SE PIDE, NO SE PREDICA (2026-09-05). Estaba escrita en la
       pagina, permanente, al lado del boton: una linea larga sobre un
       reconocedor que no existe, para todo el que entra, dijera lo que dijera
       su navegador. Ocupaba sitio y era ruido para el 100 % de las visitas por
       un mando que usa una minoria.

       Ahora sale al PULSARLO. El boton no se desactiva --un boton apagado no
       se puede pulsar y entonces nadie llega a la explicacion-- sino que
       declara `aria-disabled`: se ve apagado, se puede tocar, y lo que hace es
       contar por que no hace lo otro. Quien no ve depende del dictado, y la
       respuesta honesta no puede ser un boton muerto sin motivo.

       El motivo tampoco es «no se puede»: es una DECISION. La unica
       alternativa al dictado en el aparato es mandar el audio a un servidor
       externo, y mientras esta web prometa que nada de lo dicho sale de la
       maquina, ese camino no se toma. Eso es lo que dice el aviso. */
    if (!SR) {
      // Ni local ni nube: no hay nada que ofrecer y se dice.
      boton.setAttribute('aria-disabled', 'true');
      boton.title = T.micSinLocal;
      fila.appendChild(boton);
      boton.addEventListener('click', function () { aviso(T.micSinLocal); });
      return;
    }
    /* Hay nube pero no aparato. El boton queda VIVO y lo primero que hace es
       contar el trato. `sessionStorage` y no `localStorage`: el permiso se
       apaga al cerrar, que es lo que lo mantiene siendo una decision y no un
       ajuste que se olvida encendido. */
    boton.title = T.micNubeTrato;
    fila.appendChild(boton);
    boton.addEventListener('click', function () {
      if (permiso()) { arranca(false); return; }
      aviso(T.micNubeTrato, T.micNubeSi, function () {
        try { sessionStorage.setItem('voz-nube', '1'); } catch (e) { /* modo privado */ }
        arranca(false);
      });
    });
    function permiso() {
      try { return sessionStorage.getItem('voz-nube') === '1'; } catch (e) { return false; }
    }
    return;
  }

  /* El aviso emergente: aparece pegado al boton, se cierra al pulsar fuera o
     con Escape, y se anuncia como `status` para quien usa lector. Uno solo a
     la vez -- dos avisos abiertos son dos cosas que cerrar. */
  function aviso(texto, rotuloSi, alAceptar) {
    var previo = document.querySelector('.voice-aviso');
    if (previo) { previo.remove(); return; }
    var caja = document.createElement('div');
    caja.className = 'voice-aviso';
    caja.setAttribute('role', 'status');
    var p = document.createElement('p');
    p.textContent = texto;
    caja.appendChild(p);
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'voice-aviso-cerrar'; x.textContent = '\u00d7';
    x.setAttribute('aria-label', T.micCerrarAviso);
    x.addEventListener('click', function () { caja.remove(); });
    caja.appendChild(x);
    /* El SI es un boton aparte y explicito. No hay «recordar» ni casilla
       premarcada: aceptar es un gesto, y tiene que costar uno. */
    if (rotuloSi && alAceptar) {
      var si = document.createElement('button');
      si.type = 'button'; si.className = 'voice-aviso-si';
      si.textContent = rotuloSi;
      si.addEventListener('click', function () { caja.remove(); alAceptar(); });
      caja.appendChild(si);
    }
    fila.appendChild(caja);
    function fuera(e) {
      if (caja.contains(e.target) || fila.contains(e.target)) return;
      caja.remove(); document.removeEventListener('click', fuera);
    }
    setTimeout(function () { document.addEventListener('click', fuera); }, 0);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { caja.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  var oyendo = false, rec = null;
  boton.addEventListener('click', function () { arranca(true); });

  /* UN SOLO MOTOR, DOS TRATOS. `local` decide si se pide `processLocally` y
     que se dice mientras escucha. Tener dos funciones casi iguales es como
     acaban divergiendo: una se arregla y la otra no. */
  function arranca(local) {
    if (oyendo && rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = navigator.language || 'es-ES';
    rec.interimResults = true;
    rec.continuous = false;
    // La linea que lo cambia todo: el audio se queda en el aparato. En la via
    // de nube NO se pone -- y por eso alli hubo que pedir permiso antes.
    if (local) rec.processLocally = true;
    var base = entrada.value;
    rec.onstart = function () { oyendo = true; boton.querySelector('.rotulo').textContent = T.micEscuchando; boton.setAttribute('aria-label', T.micEscuchando); boton.classList.add('oyendo'); decir(local ? T.micEnAparato : T.micEnNube, local ? 'tenue' : 'nodata'); };
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
      oyendo = false; boton.querySelector('.rotulo').textContent = T.micHablar; boton.setAttribute('aria-label', T.micHablar); boton.classList.remove('oyendo');
    };
    rec.onend = function () { oyendo = false; boton.querySelector('.rotulo').textContent = T.micHablar; boton.setAttribute('aria-label', T.micHablar); boton.classList.remove('oyendo'); };
    try { rec.start(); }
    catch (e) { decir(T.micFallo + ' ' + (e && e.message ? e.message : e), 'nodata'); }
  }
  fila.appendChild(boton);
})();
