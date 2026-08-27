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
  var MODELO = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
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
  function sobre() {
    return { origen: 'preceptoros.org', papel: T.papel, reglas: T.reglas,
             pregunta: entrada.value.trim() };
  }
  // Recibe el TEXTO, no la clave: asi toda cadena traducida se referencia con el
  // prefijo T y un test puede cruzar chat.js contra los tres bloques i18n sin
  // conocer casos especiales. Codigo facil de comprobar > comprobador listo.
  function listo(texto, marca) {
    via = marca; estado(texto, 'nodata'); entrada.focus();
  }

  /* --- 4. El JSON: te lo llevas a la IA que ya tienes. --- */
  function ofrecerJSON(causa) {
    motorZona.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'nodata';
    // NO_DATA con causa: "no hay WebGPU" y "hay WebGPU pero ninguna GPU
    // utilizable" son dos averias distintas, y quien lee merece saber cual.
    p.textContent = T.sinMotor + ' ' + (typeof causa === 'string' ? causa : T.causaDesconocida)
                  + ' ' + T.llevate;
    motorZona.appendChild(p);

    var area = document.createElement('textarea');
    area.readOnly = true;
    area.setAttribute('aria-label', T.etiquetaJson);
    area.value = JSON.stringify(sobre(), null, 2);
    motorZona.appendChild(area);
    entrada.addEventListener('input', function () {
      area.value = JSON.stringify(sobre(), null, 2);
    });

    var f = fila();
    T.destinos.forEach(function (nombre) {
      f.appendChild(boton(T.copiarPara + ' ' + nombre, 'leve', function () {
        var b = this, antes = b.textContent;
        copiar(area.value, area, function (ok) {
          b.textContent = ok ? T.copiado : T.copiaManual;
          setTimeout(function () { b.textContent = antes; }, 2200);
        });
      }));
    });
    nota(T.mismoTexto);
  }
  function copiar(texto, area, hecho) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto)
        .then(function () { hecho(true); },
              function () { area.select(); hecho(false); });
    } else { area.select(); hecho(false); }
  }
  function salida() { return boton(T.prefieroJson, 'leve', function () { ofrecerJSON(T.causaElegida); }); }

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
    if (via === 'webllm') {
      motor.chat.completions.create({
        messages: [{ role: 'system', content: T.papel }, { role: 'user', content: texto }],
        temperature: 0.6
      }).then(function (r) { fin(r.choices[0].message.content); }).catch(falla);
    } else {
      sesion.prompt(T.papel + '\n\n' + texto).then(fin).catch(falla);
    }
  }
  enviar.addEventListener('click', responder);
  entrada.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(); }
  });
})();
