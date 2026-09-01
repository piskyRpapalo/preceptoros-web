/* preceptoros.org · elegir y arrancar el motor.
   Sale de chat.js por el limite de 10 KB, y la frontera es limpia: aqui se
   decide QUE cerebro corre y como se enciende; alli, que pasa en un turno.

   La deteccion ocurre AL CARGAR y no rompe la promesa del pie: preguntar si
   hay WebGPU o LanguageModel son preguntas al propio aparato, cero red. Lo
   que si viaja —el import() de WebLLM y la descarga— sigue detras del clic.

   chat.js entrega su contexto una vez con install(); a cambio recibe el motor
   listo por el callback `onReady`. */
(function () {
  var C = null;
  /* El motor guarda SUS PROPIAS referencias (2026-09-01). Antes vivian en
     chat.js, que las recibia por `setEngine`/`setSession` y luego escribia a
     mano una rama de generacion por cada una. Eso puso a chat.js en 11.183 B
     --por encima del tope de 10 KB-- el dia que entro el cerebro del rack.

     La frontera correcta no es «el chat lo sabe todo»: engine.js decide QUE
     cerebro corre, asi que tambien sabe COMO se le pide un turno. chat.js se
     queda con lo suyo --el turno-- y llama a `stream()` sin saber si detras
     hay WebLLM o la Prompt API. Es la misma doctrina que ya partio fallback.js
     y localai.js: partir por lo que es, no recortar comentarios. */
  var motor = null, sesion = null;
  // Estado del propio motor. Vivia en chat.js y se quedo alli al partir el
  // fichero: `decidir()` se mudo sin su guarda y reventaba en la primera
  // linea. Lo que es del motor viaja con el motor.
  var decidido = false;
  var quieto = document.getElementById('quieto');
  function install(ctx) { C = ctx; start(); }

    /* --- 3. WebLLM: se descarga solo si lo pides, y se dice a quien. --- */
    function ofrecerDescarga() {
      C.zone.innerHTML = '';
      var b = C.boton(C.T.descargar, '', function () { bajarWebLLM(b); });
      var f = C.fila(); f.appendChild(b); f.appendChild(C.salida());
      C.nota(C.T.avisoRed);
      C.nota(C.T.avisoCifra);
    }
    function bajarWebLLM(b) {
      b.disabled = true;
      var linea = C.estado(C.T.arrancando);
      import(/* webpackIgnore: true */ C.CDN).then(function (webllm) {
        return webllm.CreateMLCEngine(C.MODELO, {
          initProgressCallback: function (info) { linea.textContent = info.text || C.T.arrancando; }
        });
      }).then(function (m) { motor = m; C.setEngine(m); C.listo(C.T.listoLocal, 'webllm'); calentar(); })
        .catch(function (e) {
          C.estado(C.T.falloDescarga + ' — ' + (e && e.message ? e.message : e), 'nodata');
          C.zone.appendChild(C.salida());
        });
    }

    /* --- 1 y 2. El modelo del propio navegador (Prompt API). --- */
    function ofrecerNavegador(yaEsta) {
      C.zone.innerHTML = '';
      var b = C.boton(yaEsta ? C.T.usarNavegador : C.T.bajarNavegador, '', function () {
        b.disabled = true;
        var linea = C.estado(C.T.arrancando);
        LanguageModel.create({
          monitor: function (m) {
            m.addEventListener('downloadprogress', function (e) {
              linea.textContent = C.T.bajando + ' ' + Math.round((e.loaded || 0) * 100) + '%';
            });
          }
        }).then(function (s) { sesion = s; C.setSession(s); C.listo(yaEsta ? C.T.navListo : C.T.navBajado, 'navegador'); calentar(); })
          .catch(function (e) {
            C.estado(C.T.falloNavegador + ' — ' + (e && e.message ? e.message : e), 'nodata');
            rutaGpu();
          });
      });
      var f = C.fila(); f.appendChild(b); f.appendChild(C.salida());
      // Si hay que bajar Gemini Nano, el peso se dice ANTES de que pulses: son
      // 2,7-4 GB, mas que el modelo de esta pagina. Ocultarlo seria vender
      // "cero descargas" a cambio de la descarga mas grande de las dos.
      C.nota(yaEsta ? C.T.navYaEsta : C.T.navPesa);
    }

    /* --- La rama WebGPU. --- */
    function rutaGpu() {
      if (!navigator.gpu) { C.ofrecerJSON(C.T.causaSinApi); return; }
      C.estado(C.T.mirandoGpu);
      navigator.gpu.requestAdapter().then(function (adaptador) {
        if (adaptador) ofrecerDescarga(); else C.ofrecerJSON(C.T.causaSinAdaptador);
      }).catch(function (e) { C.ofrecerJSON(C.T.causaError + ' ' + (e && e.message ? e.message : e)); });
    }

    /* --- La deteccion ocurre AL CARGAR, y no rompe la promesa del pie. ------
       Mirar si hay WebGPU o LanguageModel son preguntas al propio aparato: cero
       red. Lo que si viaja —el import() de WebLLM y la descarga del modelo—
       sigue detras del clic. Antes esperaba al primer tecleo y el boton de
       descarga no existia hasta entonces: quien llegaba no sabia que podia. */
    function decidir() {
      if (decidido) return;
      decidido = true;
      if (quieto) quieto.hidden = true;
      // `LanguageModel`, no `window.ai`: la forma antigua quedo atras, y mirar
      // solo esa mandaria a bajar 945 MB al navegador mas capaz de todos.
      if (typeof LanguageModel !== 'undefined' && LanguageModel.availability) {
        C.estado(C.T.mirandoNavegador);
        LanguageModel.availability().then(function (d) {
          if (d === 'available') ofrecerNavegador(true);
          else if (d === 'downloadable' || d === 'downloading') ofrecerNavegador(false);
          else rutaGpu();
        }).catch(rutaGpu);
        return;
      }
      rutaGpu();
    }

  /* Cinco tokens a ciegas antes de que nadie mida. WebGPU compila sus shaders
     en la primera generacion: sin esta rafaga, el primer TTFT mide al
     compilador y no a la maquina, y sale entre tres y diez veces peor.
     Se GUARDA en una promesa y el turno la espera. WebLLM atiende una
     generacion cada vez: si el turno real entra mientras la rafaga sigue
     viva, las dos comparten estado y la respuesta sale como ensalada de
     palabras. Se vio en el movil del Soberano con el 3B del navegador. */
  var calentando = null;
  function calentar() {
    try {
      if (motor) {
        calentando = motor.chat.completions.create({
          messages: [{ role: 'user', content: 'ok' }], max_tokens: 5
        }).catch(function () {});
      } else if (sesion) {
        calentando = sesion.prompt('ok').catch(function () {});
      }
    } catch (e) { /* el calentamiento nunca rompe el turno de nadie */ }
  }

  /* Un turno contra el cerebro que este cargado. Devuelve los tokens que
     DECLARE el motor, o null: contar trozos y llamarlos tokens seria decorar
     una cifra, que es lo unico que este producto no hace. */
  function stream(sistema, texto, alTrozo) {
    if (motor) {
      var tokens = null;
      return motor.chat.completions.create({
        messages: [{ role: 'system', content: sistema }, { role: 'user', content: texto }],
        temperature: 0.6, stream: true, stream_options: { include_usage: true }
      }).then(async function (flujo) {
        for await (var t of flujo) {
          if (t.usage) tokens = t.usage.completion_tokens;
          var d = (t.choices[0] && t.choices[0].delta.content) || '';
          if (d) alTrozo(d);
        }
        return tokens;
      });
    }
    return (async function () {
      var acc = '';
      for await (var t of sesion.promptStreaming(sistema + '\n\n' + texto)) {
        // La Prompt API emite TROZOS, no el texto entero. Asignar en vez de
        // acumular dejaba solo el ultimo: respuestas de un caracter, «!» y
        // «.». Se acumula, y se contempla el caso contrario porque la version
        // vieja de la API si emitia acumulado: si el trozo ya empieza por lo
        // que llevamos, es acumulado y se manda solo lo nuevo.
        var nuevo = (t.indexOf(acc) === 0 && acc) ? t.slice(acc.length) : t;
        acc = (t.indexOf(acc) === 0 && acc) ? t : acc + t;
        if (nuevo) alTrozo(nuevo);
      }
      return null;      // la Prompt API no declara cuantos tokens genero
    })();
  }

  // Arranca cuando chat.js entrega el contexto, no antes: sin `C` esto
  // reventaria en la primera linea.
  function start() { decidir(); }
  window.Engine = {
    install: install, stream: stream,
    espera: function () { return Promise.resolve(calentando); }
  };
})();
