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
  var via = null, modeloRack = null;

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
  /* --- 4. El JSON vive en fallback.js. Aqui solo el puente. --- */
  function ofrecerJSON(causa) { window.Respaldo.ofrecerJSON(causa); }
  function salida() { return window.Respaldo.salida(); }
  window.Respaldo.instalar({ motorZona: motorZona, entrada: entrada, sobre: sobre,
    T: T, boton: boton, fila: fila, nota: nota });

  /* --- El motor vive en engine.js. Aqui solo el puente. ------------------
     Y desde el 2026-09-01 engine.js NO viaja en la portada: el buscador de
     motor se mudo al Benchmark, que es donde se elige y se mide uno. Asi que
     el puente se cruza solo si el otro lado existe.

     Sin esta guarda la portada se quedaba MUDA y sin un error visible: el
     `window.Engine.install(...)` reventaba en la primera linea, el IIFE
     entero moria con el, y con el se iban el boton de Enviar, el microfono y
     los comandos. Un fallo de carga que no se ve es peor que uno que se ve. */
  /* Se RAMIFICA, no se sale. Un `return` aqui parecia equivalente y no lo
     era: esta linea vive a media altura del IIFE, y abortarlo se llevaba por
     delante el `addEventListener` de Enviar que se registra mas abajo. El
     chat se quedaba con su caja de texto y sin nadie escuchando el boton. */
  if (window.Engine) {
    window.Engine.install({
      zone: motorZona, T: T, CDN: CDN, MODELO: MODELO,
      estado: estado, boton: boton, fila: fila, nota: nota, listo: listo,
      salida: salida, ofrecerJSON: ofrecerJSON,
      setEngine: function () {}, setSession: function () {}
    });
  } else if (window.Rack) {
    /* El cerebro del rack no se busca ni se descarga: ya esta. Lo unico que
       falta saber es QUE companero contesta, y eso lo dice el router. */
    document.addEventListener('preceptor:companero', function (e) {
      var d = e.detail || {};
      if (!d.disponible || !d.modelo) {
        via = null; modeloRack = null;
        estado(T.rackSinAdaptador, 'nodata');
        motorZona.appendChild(salida());
        return;
      }
      via = 'rack'; modeloRack = d.modelo;
      estado(T.rackListo + ' ' + d.modelo, 'nodata');
      // `live:false`: el modelo esta DECLARADO, no comprobado. Se pone en
      // verde cuando un turno vuelve, no antes. Un badge vivo sin un turno
      // detras es exactamente la cifra decorativa que aqui no se hace.
      document.dispatchEvent(new CustomEvent('preceptor:brain', {
        detail: { name: d.modelo + ' (rack)', live: false } }));
    });
  } else {
    ofrecerJSON(T.causaEnBenchmark);
  }

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
    // El calentamiento de shaders lo guarda engine.js, que es de quien es.
    var espera = window.Engine ? window.Engine.espera() : Promise.resolve();
    espera.then(generar, generar);
    function generar() {
    if (via === 'rack') {
      window.Rack.stream(modeloRack, papel() + '\n\n' + texto, function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; p.textContent = acc;
      }).then(function (n) {
        tokens = n;
        document.dispatchEvent(new CustomEvent('preceptor:brain', {
          detail: { name: modeloRack + ' (rack)', live: true } }));
        cerrar();
      }).catch(function (e) {
        // El tunel todavia no apunta a la Ollama del rack. Se dice, con su
        // causa, y se ofrece el JSON: quedarse en blanco seria peor.
        fin(T.rackFallo + ' ' + (e && e.message ? e.message : e));
        ofrecerJSON(T.rackCausa);
      });
    } else if (via === 'ollama') {
      window.LocalAI.stream(papel() + '\n\n' + texto, function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; p.textContent = acc;
      }).then(function (n) { tokens = n; cerrar(); }).catch(falla);
    } else {
      // WebLLM y la Prompt API generan DENTRO de engine.js: es quien decidio
      // que cerebro corre, asi que es quien sabe como pedirle un turno.
      window.Engine.stream(papel(), texto, function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; p.textContent = acc;
      }).then(function (n) { tokens = n; cerrar(); }).catch(falla);
    }
    }
  }
  // Su propia IA manda sobre cualquier otra: es la mas soberana que hay.
  document.addEventListener('preceptor:localai', function (e) {
    via = 'ollama';
    estado(T.laiListo + ' ' + e.detail.modelo, 'nodata');
    document.dispatchEvent(new CustomEvent('preceptor:brain', {
      detail: { name: e.detail.modelo + ' (Local)', ms: e.detail.ms } }));
  });
  enviar.addEventListener('click', responder);
  entrada.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(); }
  });

})();
