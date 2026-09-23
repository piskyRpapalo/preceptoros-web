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
  /* EL MINI, EL MISMO DEL RACK (2026-09-22). Era Llama 3.2 3B (1,8 GB): un
     modelo que no aparecia en ningun otro sitio de la web. Ahora el piso 1
     promete el Mini y el navegador baja el Mini --Qwen3 1.7B, 984 MB--, y lo
     que se aprende hablando con el en modo avion vale para el del rack. */
  var MODELO = 'Qwen3-1.7B-q4f16_1-MLC';
  var CDN = 'https://esm.run/@mlc-ai/web-llm';

  var entrada = document.getElementById('pregunta');
  var enviar = document.getElementById('enviar');
  var motorZona = document.getElementById('motor');
  var dialogo = document.getElementById('dialogo');
  var via = null, modeloRack = null, nido = null;
  /* QUE QUIERE EL PISO Y QUE MOTOR ESTA LISTO SON DOS COSAS (2026-09-22).
     `via` era una sola variable que escribian dos: el compañero del rack y el
     motor local al terminar de bajar. Con los pisos de la Torre eso ya no
     basta: bajar el Mini en el piso 1 no puede secuestrar el piso 4, que habla
     con el rack, y volver al piso 1 tiene que encontrar el Mini ya listo. */
  var quiere = null, motorListo = null;

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
  function papel() { return nido || PR.papel || ''; }

  /* EL BLOQUE DE ESTADO VA DESPUES DE LA PREGUNTA. Medido el 2026-09-14, y
     hasta hoy iba antes.
     El sitio importaba mucho mas de lo que parecia: puesto justo delante de la
     pregunta, un modelo pequeno lo CONTINUA -- `llama3.2:1b` abria su
     respuesta recitando `[SYSTEM STATE] Language: es-ES ...`. Y entonces
     `sinFuga`, que corta desde `[SYSTEM` hasta el final porque en el torrente
     la etiqueta de cierre llega tarde o no llega, se comia la respuesta
     ENTERA: turno en blanco. El antidoto era correcto; lo que estaba mal era
     darle de beber el veneno al modelo en el ultimo sorbo.
     Medido sobre cuatro modelos y dos preguntas: 1 turno vacio de 8 antes,
     0 de 8 despues. Y de regalo el bloque se USA mas -- `preceptor-v7` pasa de
     «no conozco tu sistema» a «Mira tu sistema: Linux x86_64». */
  function estado() {
    return window.stateContext ? window.stateContext() : '';
  }
  function conEstado(texto) { return texto + estado(); }

  function sobre() {
    // El sobre que se lleva la persona NO cambia: papel y estado juntos, como
    // siempre. Lo que cambio es donde se le pone al modelo, no que se exporta.
    return { origen: 'preceptoros.org', papel: papel() + estado(),
             reglas: PR.reglas, pregunta: entrada.value.trim() };
  }
  // Recibe el TEXTO, no la clave: asi toda cadena traducida se referencia con el
  // prefijo T y un test puede cruzar chat.js contra los tres bloques i18n sin
  // conocer casos especiales. Codigo facil de comprobar > comprobador listo.
  function avisa(n) { document.dispatchEvent(new CustomEvent('preceptor:' + n));
    if (window.Fase) Fase(n); }   // el anillo lo pinta chat.css
  function listo(texto, marca) {
    motorListo = marca;
    if (quiere !== 'rack') via = marca;   // un piso del rack no se lo quita el local
    estado(texto, 'nodata'); entrada.focus();
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
  /* DOS ZONAS, Y LAS DOS A LA VEZ. Hasta el 2026-09-20 esto era un `if/else`:
     donde habia motor local NO habia rack, y al reves. Por eso el motor se
     habia mudado al LorAtelier --- «que es donde se elige y se mide uno»,
     decia el comentario de abajo --- y por eso la portada no tenia forma de
     descargar nada.

     EL SOBERANO LO CAZO MIRANDO EL MOVIL: el piso 1 de la Torre promete «pon
     el aparato en modo avion y sigue hablando», y en la portada no habia
     ningun boton que bajara el modelo que hace eso posible. La promesa era
     imposible de cumplir desde la pagina que la hace.

     Que sean excluyentes era el error. El rack y el modelo del navegador no
     compiten: el rack contesta HOY y sin descargar nada, y el local es lo
     unico que contesta SIN RED. Se ofrecen los dos, cada uno en su sitio, y
     elige quien lee.

     CADA UNO EN SU SITIO, literalmente. `ofrecerDescarga()` empieza con
     `zone.innerHTML = ''`, asi que compartir zona con el rack borraria su
     estado en cuanto el motor pintase --- y al reves. Por eso el motor recibe
     ayudantes atados a SU zona: no es un adorno de orden, es lo que impide que
     uno se lleve por delante al otro sin que nadie lo vea. */
  function ayudantes(zona) {
    return {
      zone: zona,
      estado: function (texto, clase) {
        zona.innerHTML = '';
        var q = document.createElement('p');
        q.className = clase || 'tenue';
        q.textContent = texto;
        zona.appendChild(q);
        return q;
      },
      nota: function (texto) {
        var q = document.createElement('p');
        q.className = 'tenue'; q.style.marginTop = '.6rem';
        q.textContent = texto;
        zona.appendChild(q);
        return q;
      },
      fila: function () {
        var d = document.createElement('div');
        d.className = 'fila'; zona.appendChild(d); return d;
      },
      boton: boton, listo: listo, salida: salida, ofrecerJSON: ofrecerJSON
    };
  }

  if (window.Engine) {
    var zonaLocal = document.createElement('div');
    zonaLocal.id = 'motor-local';
    motorZona.parentNode.insertBefore(zonaLocal, motorZona.nextSibling);
    var ay = ayudantes(zonaLocal);
    ay.T = T; ay.CDN = CDN; ay.MODELO = MODELO;
    ay.setEngine = function () {}; ay.setSession = function () {};
    window.Engine.install(ay);
  }
  if (window.Rack) {
    /* El cerebro del rack no se busca ni se descarga: ya esta. Lo unico que
       falta saber es QUE companero contesta, y eso lo dice el router. */
    document.addEventListener('preceptor:companero', function (e) {
      var d = e.detail || {};
      nido = d.nido || null;   // ya compuesto por chat-router.js
      /* Un piso del NAVEGADOR: contesta el motor local si ya esta bajado, y si
         no, nadie --y lo explica `window.sinMotor` al primer mensaje--. */
      if (d.navegador) {
        quiere = 'navegador'; via = motorListo; modeloRack = null;
        document.dispatchEvent(new CustomEvent('preceptor:brain', {
          detail: { name: d.modelo + ' (navegador)', live: !!motorListo } }));
        return;
      }
      quiere = 'rack';
      if (!d.disponible || !d.modelo) {
        via = null; modeloRack = null;
        estado(T.rackSinAdaptador, 'nodata');
        motorZona.appendChild(salida());
        // Y el badge se APAGA. Se quedaba con el nombre del modelo del
        // companero anterior mientras en pantalla habia uno sin servir: la
        // pagina decia «Modelo: qwen3-coder-30b» debajo de un companero que
        // no tiene ninguno. Es el mismo falso verde que acaba de costarnos el
        // catalogo, a escala de un badge.
        document.dispatchEvent(new CustomEvent('preceptor:brain', {
          detail: { name: T.brainNone, live: false } }));
        return;
      }
      via = 'rack'; modeloRack = d.modelo;
      // `live:false`: el modelo esta DECLARADO, no comprobado. Se pone en
      // verde cuando un turno vuelve, no antes. Un badge vivo sin un turno
      // detras es exactamente la cifra decorativa que aqui no se hace.
      document.dispatchEvent(new CustomEvent('preceptor:brain', {
        detail: { name: d.modelo, live: false } }));
    });
  }
  /* Y el respaldo SOLO si no hay ninguno de los dos. Antes colgaba del `else`
     de la cadena, asi que bastaba con que existiera uno para no ofrecerlo
     nunca --- correcto con la cadena, y falso en cuanto dejo de serlo. */
  if (!window.Engine && !window.Rack) {
    ofrecerJSON(T.causaEnBenchmark);
  }

  /* --- Enviar --- */
  function responder() {
    var texto = entrada.value.trim();
    if (!texto) return;
    // El motor se ofrece desde que carga la pagina: si aun no hay `via`, es
    // que no se ha elegido, y la eleccion ya esta en pantalla.
    if (!via) {
      // Sin motor para este piso: si el piso sabe por que, lo dice.
      var aviso = window.sinMotor && window.sinMotor();
      if (aviso) { di(texto, true); entrada.value = ''; di(aviso); }
      return;
    }
    di(texto, true);
    entrada.value = '';
    var p = di('…');
    /* `sinFuga` tacha el bloque de estado si el modelo lo recita. Vive en
       `state.js`, que es quien lo inyecta -- el antidoto donde el veneno. Va
       aqui y no en `di()` porque `di()` tambien escribe lo que teclea la
       persona, y a esa no se le censura una palabra por parecerse a una
       etiqueta. Con guardia por si la hoja no cargo: sin ella se pinta crudo,
       que es feo, y no se rompe el turno, que seria peor. */
    var fin = function (t) {
      var limpio = window.sinFuga ? window.sinFuga(t) : t;
      /* Y si el antidoto se lo comio ENTERO, se dice. Un parrafo en blanco es
         justo el «fallo invisible» que `state.js` dice no querer fabricar --y
         lo fabricaba aqui--: la persona ve el sello pensar, aparecer texto a
         trozos y desaparecer, y no hay forma de saber que paso. Se cuenta:
         el modelo recito su reglamento y de su turno no quedaba nada. */
      p.textContent = (!limpio && t) ? T.falloRecitado : limpio;
      if (window.Fase) Fase('');   // TODO final pasa por aqui, tambien el vacio
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
    if (/[?&]debug/.test(location.search)) console.log(papel() + '\n\n' + conEstado(texto));
    // El calentamiento de shaders lo guarda engine.js, que es de quien es.
    var espera = window.Engine ? window.Engine.espera() : Promise.resolve();
    espera.then(generar, generar);
    function generar() {
    if (via === 'rack') {
      // El papel como `system` (ver rack.js): pegado delante, se recitaba.
      window.Rack.stream(modeloRack, conEstado(texto), function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; acc = acc.replace(/https?:\/\/[^\s]+/g, '[URL_BLOQUEADA]');
        p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
      }, papel()).then(function (n) {
        tokens = n;
        document.dispatchEvent(new CustomEvent('preceptor:brain', {
          detail: { name: modeloRack, live: true } }));
        cerrar();
      }).catch(function (e) {
        // El tunel todavia no apunta a la Ollama del rack. Se dice, con su
        // causa, y se ofrece el JSON: quedarse en blanco seria peor.
        fin(T.rackFallo + ' ' + (e && e.message ? e.message : e));
        ofrecerJSON(T.rackCausa);
      });
    } else if (via === 'ollama') {
      window.LocalAI.stream(papel() + '\n\n' + conEstado(texto), function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; acc = acc.replace(/https?:\/\/[^\s]+/g, '[URL_BLOQUEADA]');
        p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
      }).then(function (n) { tokens = n; cerrar(); }).catch(falla);
    } else {
      // WebLLM y la Prompt API generan DENTRO de engine.js: es quien decidio
      // que cerebro corre, asi que es quien sabe como pedirle un turno.
      window.Engine.stream(papel(), conEstado(texto), function (d) {
        if (t1 === null) { t1 = performance.now(); avisa('hablando'); }
        acc += d; acc = acc.replace(/https?:\/\/[^\s]+/g, '[URL_BLOQUEADA]');
        p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
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
