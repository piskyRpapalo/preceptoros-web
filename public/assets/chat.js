/* preceptoros.org · el chat.
   Regla que manda sobre todo lo demas: hasta que pulsas un boton, esta pagina
   NO ha hablado con nadie. Cero peticiones externas al cargar; el import() de
   WebLLM vive dentro del manejador del clic, no arriba del fichero. Por eso
   "nunca auto-arrancar" no es una preferencia de UX: es lo que hace cierta la
   frase del pie.

   Orden de preferencia, del mas soberano al menos:
     1. LanguageModel  · el modelo YA esta en el dispositivo. Cero red.
     2. LanguageModel  · esta disponible pero hay que bajarlo (Gemini Nano,
                         2,7-4 GB). Se dice el peso ANTES de ofrecerlo: es mas
                         que el modelo de esta pagina, y quien elige es quien lee.
     3. WebLLM         · ~945 MB por la red, una vez.
     4. El JSON        · te lo llevas a la IA que ya tengas. */
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
  var cabeza = document.querySelector('.cabeza');
  var quieto = document.getElementById('quieto');
  var decidido = false, motor = null, via = null, sesion = null;

  function di(texto, mio) {
    var p = document.createElement('p');
    if (mio) p.className = 'tu';
    p.textContent = texto;
    dialogo.appendChild(p);
    dialogo.scrollTop = dialogo.scrollHeight;
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
  // El papel del modelo lleva pegado el Cahier de la persona. Se compone en
  // cada turno y no se cachea: si el Cahier cambia, el proximo turno lo ve.
  function papel() {
    return T.papel + (window.Cahier ? window.Cahier.contexto() : '');
  }
  function sobre() {
    return { origen: 'preceptoros.org', papel: papel(), reglas: T.reglas,
             pregunta: entrada.value.trim() };
  }
  // Recibe el TEXTO, no la clave: asi toda cadena traducida se referencia con el
  // prefijo T y un test puede cruzar chat.js contra los tres bloques i18n sin
  // conocer casos especiales. Codigo facil de comprobar > comprobador listo.
  function listo(texto, marca) {
    via = marca; estado(texto, 'nodata'); entrada.focus();
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

  /* --- 4. El JSON vive en respaldo.js. Aqui solo el puente. --- */
  function ofrecerJSON(causa) { window.Respaldo.ofrecerJSON(causa); }
  function salida() { return window.Respaldo.salida(); }
  window.Respaldo.instalar({ motorZona: motorZona, entrada: entrada, sobre: sobre,
    T: T, boton: boton, fila: fila, nota: nota });

  /* --- 3. WebLLM: se descarga solo si lo pides, y se dice a quien. --- */
  function ofrecerDescarga() {
    motorZona.innerHTML = '';
    var b = boton(T.descargar, '', function () { bajarWebLLM(b); });
    var f = fila(); f.appendChild(b); f.appendChild(salida());
    nota(T.avisoRed);
    nota(T.avisoCifra);
  }
  function bajarWebLLM(b) {
    b.disabled = true;
    var linea = estado(T.arrancando);
    import(/* webpackIgnore: true */ CDN).then(function (webllm) {
      return webllm.CreateMLCEngine(MODELO, {
        initProgressCallback: function (info) { linea.textContent = info.text || T.arrancando; }
      });
    }).then(function (m) { motor = m; listo(T.listoLocal, 'webllm'); })
      .catch(function (e) {
        estado(T.falloDescarga + ' — ' + (e && e.message ? e.message : e), 'nodata');
        motorZona.appendChild(salida());
      });
  }

  /* --- 1 y 2. El modelo del propio navegador (Prompt API). --- */
  function ofrecerNavegador(yaEsta) {
    motorZona.innerHTML = '';
    var b = boton(yaEsta ? T.usarNavegador : T.bajarNavegador, '', function () {
      b.disabled = true;
      var linea = estado(T.arrancando);
      LanguageModel.create({
        monitor: function (m) {
          m.addEventListener('downloadprogress', function (e) {
            linea.textContent = T.bajando + ' ' + Math.round((e.loaded || 0) * 100) + '%';
          });
        }
      }).then(function (s) { sesion = s; listo(yaEsta ? T.navListo : T.navBajado, 'navegador'); })
        .catch(function (e) {
          estado(T.falloNavegador + ' — ' + (e && e.message ? e.message : e), 'nodata');
          rutaGpu();
        });
    });
    var f = fila(); f.appendChild(b); f.appendChild(salida());
    // Si hay que bajar Gemini Nano, el peso se dice ANTES de que pulses: son
    // 2,7-4 GB, mas que el modelo de esta pagina. Ocultarlo seria vender
    // "cero descargas" a cambio de la descarga mas grande de las dos.
    nota(yaEsta ? T.navYaEsta : T.navPesa);
  }

  /* --- La rama WebGPU. --- */
  function rutaGpu() {
    if (!navigator.gpu) { ofrecerJSON(T.causaSinApi); return; }
    estado(T.mirandoGpu);
    navigator.gpu.requestAdapter().then(function (adaptador) {
      if (adaptador) ofrecerDescarga(); else ofrecerJSON(T.causaSinAdaptador);
    }).catch(function (e) { ofrecerJSON(T.causaError + ' ' + (e && e.message ? e.message : e)); });
  }

  /* --- La deteccion ocurre al primer tecleo, no al cargar. --- */
  function decidir() {
    if (decidido) return;
    decidido = true;
    if (quieto) quieto.hidden = true;
    // El global es `LanguageModel`, no `window.ai`: la forma antigua
    // (window.ai.canCreateTextSession) quedo atras, y comprobar solo esa
    // significaria NO ver el modelo del navegador justo donde si existe, y
    // mandar a descargar ~945 MB al navegador mas capaz de todos.
    if (typeof LanguageModel !== 'undefined' && LanguageModel.availability) {
      estado(T.mirandoNavegador);
      LanguageModel.availability().then(function (d) {
        if (d === 'available') ofrecerNavegador(true);
        else if (d === 'downloadable' || d === 'downloading') ofrecerNavegador(false);
        else rutaGpu();
      }).catch(rutaGpu);
      return;
    }
    rutaGpu();
  }
  entrada.addEventListener('input', decidir);

  /* --- Enviar --- */
  function responder() {
    var texto = entrada.value.trim();
    if (!texto) return;
    if (!via) { decidir(); return; }
    di(texto, true);
    entrada.value = '';
    var p = di('…');
    if (cabeza) cabeza.classList.add('habla');
    var fin = function (t) {
      p.textContent = t;
      if (cabeza) cabeza.classList.remove('habla');
      dialogo.scrollTop = dialogo.scrollHeight;
    };
    var falla = function (e) { fin(T.falloRespuesta + ' — ' + (e && e.message ? e.message : e)); };
    var t0 = performance.now(), t1 = null, acc = '', tokens = null;
    // `tokens` sale del motor o no sale. Contar trozos y llamarlos tokens seria
    // decorar una cifra, que es lo unico que este producto no hace.
    function cerrar() {
      fin(acc);
      document.dispatchEvent(new CustomEvent('preceptor:turno', { detail: {
        ttft: t1 === null ? null : t1 - t0, ms: performance.now() - t0,
        tokens: tokens, via: via } }));
    }
    if (via === 'webllm') {
      motor.chat.completions.create({
        messages: [{ role: 'system', content: papel() }, { role: 'user', content: texto }],
        temperature: 0.6, stream: true, stream_options: { include_usage: true }
      }).then(async function (flujo) {
        for await (var t of flujo) {
          if (t.usage) tokens = t.usage.completion_tokens;
          var d = (t.choices[0] && t.choices[0].delta.content) || '';
          if (d && t1 === null) t1 = performance.now();
          if (d) { acc += d; p.textContent = acc; }
        }
        cerrar();
      }).catch(falla);
    } else {
      (async function () {
        for await (var t of sesion.promptStreaming(papel() + '\n\n' + texto)) {
          if (t1 === null) t1 = performance.now();
          acc = t; p.textContent = acc;
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
