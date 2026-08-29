/* preceptoros.org · el chat.
   Regla que manda sobre todo: hasta que pulsas un boton esta pagina NO ha
   hablado con nadie. El import() de WebLLM vive dentro del clic, no arriba del
   fichero — por eso «nunca auto-arrancar» no es UX, es lo que hace cierta la
   frase del pie.

   Orden, del mas soberano al menos: LanguageModel ya instalado ·
   LanguageModel por descargar (2,7-4 GB, el peso se dice ANTES) · WebLLM
   (~945 MB, una vez) · el JSON para la IA que ya tengas. */
(function () {
  var caja = document.getElementById('chat');
  if (!caja) return;
  var T = JSON.parse(document.getElementById('i18n').textContent);
  var MODELO = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
  var CDN = 'https://esm.run/@mlc-ai/web-llm';

  var entrada = document.getElementById('pregunta');
  var enviar = document.getElementById('enviar');
  var motorZona = document.getElementById('motor');
  var dialogo = document.getElementById('dialogo');
  var motor = null, via = null, sesion = null;

  function di(texto, mio) {
    var p = document.createElement('p');
    if (mio) p.className = 'tu';
    p.textContent = texto;
    (window.fluido || function (f) { f(); })(function () {
      dialogo.appendChild(p);
      dialogo.scrollTop = dialogo.scrollHeight;
    });
    return p;
  }
  function estado(texto, clase) {
    motorZona.innerHTML = '';
    var p = document.createElement('p');
    p.className = clase || 'tenue';
    p.textContent = texto;
    motorZona.appendChild(p);
    return p;
  }
  function boton(texto, clase, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = clase || ''; b.textContent = texto;
    b.addEventListener('click', alPulsar);
    return b;
  }
  function nota(texto) {
    var p = document.createElement('p');
    p.className = 'tenue'; p.style.marginTop = '.6rem'; p.textContent = texto;
    motorZona.appendChild(p);
    return p;
  }
  function fila() {
    var d = document.createElement('div');
    d.className = 'fila'; motorZona.appendChild(d); return d;
  }
  // El papel es el del instalador y nada mas. La memoria local y el camino de
  // aprendizaje viven en el MVP, en la maquina de la persona: esta web es
  // instalacion y comunidad, y no tiene nada de eso que ofrecer.
  // Cuanto mas sabe el frontend, menos adivina el modelo. El bloque de estado
  // va DESPUES del papel y ANTES de lo que escribe la persona.
  function papel() {
    return T.papel + (window.stateContext ? window.stateContext() : '');
  }
  function sobre() {
    return { origen: 'preceptoros.org', papel: papel(), reglas: T.reglas,
             pregunta: entrada.value.trim() };
  }
  // Recibe el TEXTO, no la clave: asi toda cadena traducida se referencia con el
  // prefijo T y un test puede cruzar chat.js contra los tres bloques i18n sin
  // conocer casos especiales. Codigo facil de comprobar > comprobador listo.
  function avisa(n) { document.dispatchEvent(new CustomEvent('preceptor:' + n)); }
  function listo(texto, marca) {
    via = marca; estado(texto, 'nodata'); entrada.focus();
    document.dispatchEvent(new CustomEvent('preceptor:brain', { detail: {
      name: marca === 'webllm' ? MODELO.split('-q4')[0] + ' (Edge)' : T.brainBrowser } }));
    calentar();
  }
  // Cinco tokens a ciegas antes de que nadie mida. WebGPU compila sus shaders
  // en la primera generacion: sin esta rafaga, el primer TTFT mide al
  // compilador y no a la maquina, y sale entre tres y diez veces peor.
  function calentar() {
    try {
      if (via === 'webllm') {
        motor.chat.completions.create({ messages: [{ role: 'user', content: 'ok' }],
          max_tokens: 5 }).catch(function () {});
      } else if (sesion) { sesion.prompt('ok').catch(function () {}); }
    } catch (e) { /* el calentamiento nunca rompe el turno de nadie */ }
  }

  /* --- 4. El JSON vive en fallback.js. Aqui solo el puente. --- */
  function ofrecerJSON(causa) { window.Respaldo.ofrecerJSON(causa); }
  function salida() { return window.Respaldo.salida(); }
  window.Respaldo.instalar({ motorZona: motorZona, entrada: entrada, sobre: sobre,
    T: T, boton: boton, fila: fila, nota: nota });

  /* --- El motor vive en engine.js. Aqui solo el puente. --- */
  window.Engine.install({
    zone: motorZona, T: T, CDN: CDN, MODELO: MODELO,
    estado: estado, boton: boton, fila: fila, nota: nota, listo: listo,
    salida: salida, ofrecerJSON: ofrecerJSON,
    setEngine: function (m) { motor = m; }, setSession: function (s) { sesion = s; }
  });

  /* --- Enviar --- */
  function responder() {
    var texto = entrada.value.trim();
    if (!texto) return;
    // El motor se ofrece desde que carga la pagina: si aun no hay `via`, es
    // que no se ha elegido, y la eleccion ya esta en pantalla.
    if (!via) return;
    di(texto, true);
    entrada.value = '';
    var p = di('…');
    var fin = function (t) {
      p.textContent = t;
      dialogo.scrollTop = dialogo.scrollHeight;
    };
    var falla = function (e) { fin(T.falloRespuesta + ' — ' + (e && e.message ? e.message : e)); };
    var t0 = performance.now(), t1 = null, acc = '', tokens = null;
    // El sello es un sensor, no un adorno: piensa mientras no hay token y
    // habla en cuanto llega el primero.
    avisa('pensando');
    // `tokens` sale del motor o no sale. Contar trozos y llamarlos tokens seria
    // decorar una cifra, que es lo unico que este producto no hace.
    function cerrar() {
      fin(acc || T.falloVacio);
      document.dispatchEvent(new CustomEvent('preceptor:turno', { detail: {
        ttft: t1 === null ? null : t1 - t0, ms: performance.now() - t0,
        tokens: tokens, via: via } }));
    }
    // ?debug enseña el prompt entero antes de enviarlo. Detras de una bandera
    // y no siempre: un console.log permanente es ruido en la consola de otro.
    if (/[?&]debug/.test(location.search)) console.log(papel() + '\n\n' + texto);
    if (via === 'webllm') {
      motor.chat.completions.create({
        messages: [{ role: 'system', content: papel() }, { role: 'user', content: texto }],
        temperature: 0.6, stream: true, stream_options: { include_usage: true }
      }).then(async function (flujo) {
        for await (var t of flujo) {
          if (t.usage) tokens = t.usage.completion_tokens;
          var d = (t.choices[0] && t.choices[0].delta.content) || '';
          if (d && t1 === null) { t1 = performance.now(); avisa('hablando'); }
          if (d) { acc += d; p.textContent = acc; }
        }
        cerrar();
      }).catch(falla);
    } else {
      (async function () {
        for await (var t of sesion.promptStreaming(papel() + '\n\n' + texto)) {
          if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
          // La Prompt API emite TROZOS, no el texto entero. Asignar en vez de
          // acumular dejaba solo el ultimo: respuestas de un caracter, «!» y
          // «.». Se acumula, y se contempla el caso contrario porque la version
          // vieja de la API si emitia acumulado: si el trozo ya empieza por lo
          // que llevamos, es acumulado y se asigna.
          acc = (t.indexOf(acc) === 0 && acc) ? t : acc + t;
          p.textContent = acc;
        }
        cerrar();
      })().catch(falla);
    }
  }
  enviar.addEventListener('click', responder);
  entrada.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(); }
  });

})();
