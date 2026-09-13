/* preceptoros.org · APRENDER: la senal que nadie se sienta a escribir.
 *
 * POR QUE EXISTE. La casa ya tiene una puerta de feedback --`corregir.js`--
 * y es la buena: quien escribe una correccion sabe lo que hace y lo firma.
 * Pero pide un esfuerzo, y por eso llega poco. Medido el 2026-09-13: la pool
 * de `charla-web` tiene 6 filas y 3 firmas, todas de pruebas.
 *
 * Y mientras tanto la web ve pasar, en cada sesion, la senal que el
 * laboratorio mas necesita y que NADIE escribe a mano:
 *
 *   LA REESCRITURA. Alguien pregunta, no le sirve, y vuelve a preguntar lo
 *   mismo con otras palabras. Esa segunda forma ES la correccion del prompt.
 *   El par (lo que dijo primero, lo que de verdad queria decir) es
 *   exactamente la forma que `turnos.py` ya come: rechazado y elegido.
 *
 * NO SE INVENTA UN ESQUEMA NUEVO. El par que sale de aqui tiene los MISMOS
 * diez campos que el de `corregir.js`, en el MISMO orden --el orden importa:
 * `ingesta.py` reconstruye los bytes firmados por ese orden-- y tres campos
 * mas al FINAL, que es donde el lado del rack los vuelve a poner.
 *
 * LO QUE ESTO NO ES. No es telemetria. No sale a la red por su cuenta: se
 * guarda en la misma base `preceptoros-bronce` con `consent: 0`, cuenta en el
 * mismo boton «Enviar al rack (N)», y sale por la misma puerta firmada o no
 * sale. Si capturamos lo que la gente escribe, lo minimo es que lo vea
 * contado y lo pueda apagar. Por eso el interruptor, y por eso el rotulo.
 */
(function () {
  var dialogo = document.getElementById('dialogo');
  if (!dialogo || !window.Bronce || !window.Identity) return;

  var LLAVE = 'preceptoros:aprender';       // 'no' apaga esto, y nada mas
  var VENTANA = 180000;                     // 3 min: mas alla no es reescritura
  var PARECIDO = 0.34;                      // suelo de solape entre las dos
  var MINIMO = 3;                           // palabras: «hola» no es una senal

  function encendido() {
    try { return localStorage.getItem(LLAVE) !== 'no'; } catch (e) { return true; }
  }

  /* --- AUTORIDAD PRESENTE --------------------------------------------------
     La pregunta que el laboratorio no puede contestar solo con el texto: ¿la
     persona tenia clave cuando escribio? Quien ha firmado una identidad se
     comporta distinto --corrige mas, abandona menos-- y esa diferencia solo
     se puede estudiar si el par la lleva escrita al lado.
     Es un booleano, no un identificador: aqui no se guarda QUIEN, se guarda
     SI HABIA alguien. El quien ya viaja en la firma, y solo al exportar. */
  var autoridad = 0;
  function mirarClave() {
    try {
      window.Identity.publica().then(function (p) { autoridad = p ? 1 : 0; },
                                     function () { autoridad = 0; });
    } catch (e) { autoridad = 0; }
  }
  mirarClave();
  document.addEventListener('preceptor:identity', mirarClave);

  /* --- CUANTO SE PARECEN DOS PREGUNTAS ------------------------------------
     Solape de palabras (Jaccard), no distancia de edicion: lo que buscamos no
     es un typo corregido sino la MISMA intencion dicha de otra forma, y ahi
     las palabras que sobreviven son la intencion.
     Se cortan acentos y signos para que «como instalo» y «cómo instalo?» sean
     la misma palabra -- si no, cada tilde inventaria una reescritura. */
  function palabras(t) {
    var limpio = (t || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ñ ]+/g, ' ');
    var fuera = {}, salida = [];
    limpio.split(/\s+/).forEach(function (w) {
      if (w.length > 2 && !fuera[w]) { fuera[w] = 1; salida.push(w); }
    });
    return salida;
  }

  function solape(a, b) {
    var A = palabras(a), B = palabras(b);
    if (A.length < MINIMO || B.length < MINIMO) return 0;
    var set = {}, comun = 0;
    A.forEach(function (w) { set[w] = 1; });
    B.forEach(function (w) { if (set[w]) comun++; });
    return comun / (A.length + B.length - comun);
  }

  /* --- LEER EL TURNO DEL DIALOGO ------------------------------------------
     Igual que `corregir.js`: se lee del DOM y no de una variable que `chat.js`
     nos pase. Asi `chat.js` no tiene que saber que este fichero existe -- la
     misma costura que ya sostiene la puerta de correcciones. */
  function ultimoTurno() {
    var ps = dialogo.querySelectorAll('p'), pregunta = null, respuesta = null;
    for (var i = ps.length - 1; i >= 0; i--) {
      if (!respuesta && ps[i].className !== 'tu') { respuesta = ps[i]; continue; }
      if (respuesta && ps[i].className === 'tu') { pregunta = ps[i]; break; }
    }
    if (!pregunta || !respuesta) return null;
    return { prompt: pregunta.textContent.trim(),
             respuesta: respuesta.textContent.trim() };
  }

  var ATAJOS = ['instalar', 'perfil', 'dataset', 'script', 'eco', 'formatos',
                'auditar', 'frontera'];
  function tarea(p) {
    var t = (p || '').trim().toLowerCase();
    for (var i = 0; i < ATAJOS.length; i++) {
      var c = '/' + ATAJOS[i];
      if (t === c || t.indexOf(c + ' ') === 0) return ATAJOS[i];
    }
    return t ? 'libre' : 'NO_DATA';
  }
  function cerebro() { return window.__preceptorCerebro || 'NO_DATA'; }
  function idioma() { return (document.documentElement.lang || 'NO_DATA').slice(0, 2); }

  /* --- LA CAPTURA ---------------------------------------------------------
     Un par de reescritura, y el reparto de papeles es el que el laboratorio
     espera: lo PRIMERO que se pregunto es lo rechazado, y lo SEGUNDO --lo que
     de verdad se queria decir-- es lo elegido. `respuesta` es la contestacion
     que se llevo la primera forma: sin ella el par no dice de que se escapo.

     El orden de las claves NO ES DECORATIVO. `JSON.stringify` respeta el orden
     de insercion y `ingesta.py` reconstruye esos mismos bytes poniendo primero
     sus diez CAMPOS y despues los extras en el orden en que llegaron. Los tres
     nuevos van AL FINAL, o las dos canonicas dejan de coincidir y la firma
     --que es correcta-- se rechaza por una coma de sitio. */
  var previo = null, turnos = 0;

  function guardarReescritura(v1, v2) {
    var reg = {
      prompt: v1.prompt,               // la forma que NO sirvio
      respuesta: v1.respuesta,         // lo que esa forma se llevo
      correccion: v2.prompt,           // la forma que si decia lo que queria
      corregido: new Date().toISOString(),
      modelo: cerebro(),
      idioma: idioma(),
      motivo: 'reescritura: la misma intencion, dicha de otra forma',
      tarea: tarea(v2.prompt),
      consent: 0,
      origen: 'preceptoros.org' + location.pathname,
      tipo: 'reescritura',
      autoridad: autoridad,
      turnos_antes: turnos
    };
    window.Identity.firmar(reg).then(function (f) {
      return window.Identity.publica().then(function (pub) {
        return window.Bronce.guardar({ par: reg, firma: f.firma, autor: f.autor,
                                       publica: pub, canonico: f.canonico });
      });
    }).then(function () {
      document.dispatchEvent(new CustomEvent('preceptor:aprendido',
        { detail: { tipo: 'reescritura' } }));
    })['catch'](function () {
      /* Sin clave no hay par: un par sin firma no lo admite `ingesta.py` y
         guardarlo seria acumular basura que nunca va a poder entrar. */
    });
  }

  document.addEventListener('preceptor:turno', function () {
    turnos++;
    if (!encendido()) { previo = null; return; }
    var ahora = ultimoTurno();
    if (!ahora || !ahora.prompt) return;
    var t = Date.now();
    if (previo && t - previo.t < VENTANA &&
        previo.prompt !== ahora.prompt &&
        solape(previo.prompt, ahora.prompt) >= PARECIDO) {
      guardarReescritura(previo, ahora);
    }
    previo = { prompt: ahora.prompt, respuesta: ahora.respuesta, t: t };
  });

  /* --- EL ROTULO Y EL INTERRUPTOR -----------------------------------------
     Capturar en silencio lo que alguien escribe seria exactamente el tipo de
     cosa que esta casa dice no hacer. Asi que se dice en la rueda de perfil,
     con palabras y con una casilla que de verdad apaga. */
  var TEXTO = {
    es: ['Aprender de mis reescrituras',
         'Cuando repites una pregunta con otras palabras, ese par se guarda ' +
         'firmado en tu aparato. Cuenta en «Enviar al rack» y no sale sin ti.'],
    en: ['Learn from my rewrites',
         'When you ask the same thing in different words, that pair is stored ' +
         'signed on your device. It counts in "Send to rack" and never leaves ' +
         'without you.'],
    fr: ['Apprendre de mes reformulations',
         'Quand vous reposez la même question autrement, cette paire est ' +
         'conservée signée sur votre appareil. Elle compte dans « Envoyer au ' +
         'rack » et ne part jamais sans vous.'],
    de: ['Aus meinen Umformulierungen lernen',
         'Wenn Sie dasselbe mit anderen Worten fragen, wird dieses Paar ' +
         'signiert auf Ihrem Gerät gespeichert. Es zählt bei „An das Rack ' +
         'senden“ und geht nie ohne Sie fort.'],
    it: ['Imparare dalle mie riformulazioni',
         'Quando riformuli la stessa domanda, quella coppia resta firmata sul ' +
         'tuo apparecchio. Conta in «Invia al rack» e non parte mai senza di te.'],
    pt: ['Aprender com as minhas reescritas',
         'Quando repetes a mesma pergunta com outras palavras, esse par fica ' +
         'assinado no teu aparelho. Conta em «Enviar para o rack» e nunca sai ' +
         'sem ti.'],
    el: ['Να μαθαίνει από τις αναδιατυπώσεις μου',
         'Όταν ρωτάς το ίδιο με άλλα λόγια, το ζεύγος αποθηκεύεται υπογεγραμμένο ' +
         'στη συσκευή σου. Μετράει στο «Αποστολή στο rack» και δεν φεύγει ποτέ ' +
         'χωρίς εσένα.'],
    ru: ['Учиться на моих переформулировках',
         'Когда вы спрашиваете о том же другими словами, эта пара сохраняется ' +
         'подписанной на вашем устройстве. Она учитывается в «Отправить в стойку» ' +
         'и никогда не уходит без вас.']
  };

  function rotulo() {
    var panel = document.getElementById('panel-ajustes');
    if (!panel || document.getElementById('aprender-sw')) return;
    var t = TEXTO[idioma()] || TEXTO.es;
    var caja = document.createElement('label');
    caja.className = 'ajuste-linea';
    var sw = document.createElement('input');
    sw.type = 'checkbox'; sw.id = 'aprender-sw'; sw.checked = encendido();
    sw.addEventListener('change', function () {
      try { localStorage.setItem(LLAVE, sw.checked ? 'si' : 'no'); } catch (e) {}
      if (!sw.checked) previo = null;
    });
    var n = document.createElement('span');
    n.className = 'ajuste-nombre'; n.textContent = t[0];
    var d = document.createElement('small');
    d.className = 'ajuste-nota'; d.textContent = t[1];
    caja.appendChild(sw); caja.appendChild(n); caja.appendChild(d);
    panel.appendChild(caja);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rotulo);
  } else { rotulo(); }
})();
