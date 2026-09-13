/* preceptoros.org · «corregir esta respuesta». El eslabon [2] de la cadena.
 *
 * QUE ES ESTO Y QUE NO ES
 * ----------------------
 * Es el sitio donde una respuesta mala se convierte en un par (rechazado,
 * elegido) firmado. Es el combustible de la Forja, y por eso importa mas que
 * casi nada de lo que hay en esta pagina.
 *
 * NO ES TELEMETRIA, Y NO POR PROMESA SINO POR CONSTRUCCION: aqui dentro no hay
 * un `fetch`, ni un `XMLHttpRequest`, ni un `sendBeacon`. El gate lo comprueba
 * leyendo este fichero. El par se firma y se guarda EN TU APARATO.
 *
 * LA PUERTA QUE SI EXISTE: EXPORTAR
 * ---------------------------------
 * Desde el 2026-09-13 se puede sacar lo guardado a un FICHERO, que se descarga
 * a tu propio aparato. Eso no es lo mismo que enviarlo, y la diferencia no es
 * de forma: nada sale si no lo pides, nada viaja por red, y ves cuantos pares
 * entregas antes de entregarlos. Recolectar es que el dato se vaya solo;
 * exportar es que te lo lleves tu.
 *
 * Y EL CONSENTIMIENTO SE DA AL EXPORTAR, NO AL GUARDAR. `consent` nace en 0 y
 * se queda en 0 en la base: lo que se firma con `consent: 1` es el objeto que
 * SALE, en el momento en que decides que salga. Un consentimiento pedido antes
 * de que haya nada que consentir no consiente nada.
 *
 * POR QUE NO VIAJA HOY
 * -------------------
 * `mente/doctrina/LORATELIER_P0X.md` deja dos decisiones abiertas --D1: de
 * quien es el LoRA; D2: con que se paga-- y dice, con estas palabras, que
 * encender esto antes de responderlas «seria pedir datos sin saber que se hara
 * con ellos». Asi que no se piden datos: se guardan los tuyos, donde ya estan.
 *
 * EL ESQUEMA NO SE INVENTA AQUI
 * -----------------------------
 * Los nombres de los campos son los de `preceptor/captura.py` --la tabla
 * `turnos` del MVP-- uno a uno: prompt, respuesta, modelo, idioma, consent,
 * correccion, corregido, motivo. Dos esquemas para el mismo hecho obligarian a
 * un traductor en medio, y un traductor en medio es el sitio donde un dia se
 * pierde el consentimiento. `consent` nace en 0 aqui por la misma razon por la
 * que nace en 0 alli: un par sin consentimiento es un recuerdo de la persona,
 * no material de nadie.
 */
(function () {
  var dialogo = document.getElementById('dialogo');
  /* `Bronce` es el dueno del almacen de pares y de la puerta de salida. Vive en
     `bronce.js` desde que este fichero toco el tope de 16 KiB con noventa bytes
     de margen: un fichero al limite no admite ni un arreglo, y el proximo
     arreglo siempre llega. Si no esta cargado, no se pinta nada -- un boton de
     corregir que no puede guardar es peor que ningun boton. */
  if (!dialogo || !window.Identity || !window.Bronce) return;

  /* EL HUB MANDA; EL `#i18n` DE LA PAGINA ES EL RESPALDO. `hub.js` solo vive
     en la portada y arrastra un fetch y el panel entero: cargarlo en el
     Benchmark por seis rotulos es caro. Sin respaldo, el boton alli saldria SIN
     TEXTO, que es peor que no estar. */
  var MIO = null;
  function L(clave) {
    var t = (window.Hub && window.Hub.textos) || {};
    if (t[clave]) { return t[clave]; }
    if (MIO === null) {
      var b = document.getElementById('i18n');
      try { MIO = b ? JSON.parse(b.textContent) : {}; } catch (e) { MIO = {}; }
    }
    return MIO[clave] || '';
  }

  /* LAS PALABRAS DE LA EXPORTACION VIVEN AQUI, Y ES UNA EXCEPCION MEDIDA.
     Lo normal en esta casa es `hub-textos.json`, y ahi deberian estar. Medido
     el 2026-09-13: ese fichero pesa 15.908 B y el tope por fichero es 16.384
     --`test_web.py::TOPE_FICHERO`--, o sea 476 B de aire para CUATRO claves en
     OCHO idiomas. No caben, y partir el catalogo de textos por la mitad para
     meter una frase seria romper algo grande por algo pequeno.
     Si un dia hay sitio, se mudan: el sitio natural sigue siendo aquel. */
  var PALABRAS = {
    es: { b: 'Exportar correcciones', n: 'correcciones guardadas',
          q: 'Se descargará un fichero a tu aparato. No se envía a nadie.',
          v: 'Exportadas', e: 'No se pudo exportar' },
    en: { b: 'Export corrections', n: 'saved corrections',
          q: 'A file will download to your device. Nothing is sent to anyone.',
          v: 'Exported', e: 'Could not export' },
    fr: { b: 'Exporter les corrections', n: 'corrections enregistrées',
          q: 'Un fichier sera téléchargé sur votre appareil. Rien n\'est envoyé.',
          v: 'Exportées', e: 'Échec de l\'export' },
    pt: { b: 'Exportar correções', n: 'correções guardadas',
          q: 'Um ficheiro será descarregado para o teu aparelho. Nada é enviado.',
          v: 'Exportadas', e: 'Não foi possível exportar' },
    it: { b: 'Esportare le correzioni', n: 'correzioni salvate',
          q: 'Un file verrà scaricato sul tuo apparecchio. Nulla viene inviato.',
          v: 'Esportate', e: 'Impossibile esportare' },
    de: { b: 'Korrekturen exportieren', n: 'gespeicherte Korrekturen',
          q: 'Eine Datei wird auf dein Gerät geladen. Es wird nichts gesendet.',
          v: 'Exportiert', e: 'Export fehlgeschlagen' },
    ru: { b: 'Экспорт исправлений', n: 'сохранённых исправлений',
          q: 'Файл загрузится на твоё устройство. Никуда не отправляется.',
          v: 'Экспортировано', e: 'Не удалось экспортировать' },
    el: { b: 'Εξαγωγή διορθώσεων', n: 'αποθηκευμένες διορθώσεις',
          q: 'Ένα αρχείο θα κατέβει στη συσκευή σου. Δεν στέλνεται πουθενά.',
          v: 'Εξήχθησαν', e: 'Αδύνατη η εξαγωγή' }
  };

  function P(clave) {
    return (PALABRAS[idioma()] || PALABRAS.es)[clave];
  }

  /* El par se lee del DIALOGO, no de una variable que chat.js nos pase. Asi
     este fichero no obliga a chat.js a saber que existimos -- que es la misma
     regla con la que chat-router.js movio los botones sin reescribir nada. */
  function ultimoPar(respuesta) {
    var p = null, ps = dialogo.querySelectorAll('p');
    for (var i = ps.length - 1; i >= 0; i--) {
      if (ps[i] === respuesta) continue;
      if (ps[i].className === 'tu') { p = ps[i]; break; }
    }
    return { prompt: p ? p.textContent : '', respuesta: respuesta.textContent };
  }

  /* --- CON QUE ATAJO SE HIZO EL TURNO ------------------------------------
     Los ocho comandos de `servicios.json` son los MISMOS ocho de
     `captura.TAREAS` en la app, y ese paralelo se construyo a proposito para
     que un turno de aqui y otro de alla fueran comparables: un LoRA entrenado
     con los de la app se puede medir contra los de la web solo si los dos
     dicen la tarea con la misma palabra.

     Hasta hoy esa comparacion existia en el esquema y no en los datos. El
     paquete no llevaba la tarea, asi que el importador de la app la guardaba
     en NO_DATA -- correcto por su parte, y un dato perdido igualmente.

     SE DEDUCE DEL PROMPT Y NO DE UN ESTADO QUE HAYA QUE MANTENER. Lo que la
     persona escribio ES lo que hizo: si empieza por uno de los ocho comandos,
     esa es la tarea. Un estado aparte se desincroniza el dia que alguien edite
     el campo antes de enviar, y ademas obligaria a chat.js a saber que este
     fichero existe -- justo lo que `ultimoPar` evita leyendo del dialogo.

     Y aqui `libre` SI se puede afirmar: la web sabe que no vino por un atajo
     porque ve el texto entero. En la app, que solo recibe el paquete, eso no
     se sabe -- por eso alli el importador escribe NO_DATA y no `libre`. La
     misma palabra vale o no vale segun quien pueda demostrarla. */
  var ATAJOS = ['instalar', 'perfil', 'dataset', 'script', 'eco', 'formatos',
                'auditar', 'frontera'];

  function tarea(prompt) {
    var t = (prompt || '').trim().toLowerCase();
    for (var i = 0; i < ATAJOS.length; i++) {
      var c = '/' + ATAJOS[i];
      if (t === c || t.indexOf(c + ' ') === 0) return ATAJOS[i];
    }
    return t ? 'libre' : 'NO_DATA';
  }

  function cerebro() {
    // El nombre del modelo lo publica `meter.js` por el mismo evento que usa
    // el sello. Si nadie lo dijo, NO_DATA -- nunca un nombre supuesto.
    return window.__preceptorCerebro || 'NO_DATA';
  }
  document.addEventListener('preceptor:brain', function (e) {
    window.__preceptorCerebro = (e.detail && e.detail.name) || 'NO_DATA';
  });

  function idioma() {
    return (document.documentElement.lang || 'NO_DATA').slice(0, 2);
  }

  function formulario(respuesta, boton) {
    var caja = document.createElement('form');
    caja.className = 'corregir-caja';
    var area = document.createElement('textarea');
    area.className = 'chat-input'; area.rows = 3;
    area.placeholder = L('corregirQue');
    area.required = true;
    var motivo = document.createElement('input');
    motivo.type = 'text'; motivo.className = 'chat-input';
    motivo.placeholder = L('corregirMotivo');
    var enviar = document.createElement('button');
    enviar.type = 'submit'; enviar.className = 'boton';
    enviar.textContent = L('corregirFirmar');
    var aviso = document.createElement('p');
    aviso.className = 'tenue'; aviso.textContent = L('corregirNoViaja');
    caja.appendChild(area); caja.appendChild(motivo);
    caja.appendChild(enviar); caja.appendChild(aviso);

    caja.addEventListener('submit', function (ev) {
      ev.preventDefault();
      enviar.disabled = true;
      var par = ultimoPar(respuesta);
      // El objeto que se FIRMA es exactamente el que se guarda, sin la firma
      // dentro. Firmar una cosa y guardar otra es tener una firma que no
      // verifica nada.
      var reg = {
        prompt: par.prompt,
        respuesta: par.respuesta,      // el RECHAZADO
        correccion: area.value.trim(), // el ELEGIDO
        corregido: new Date().toISOString(),
        modelo: cerebro(),
        idioma: idioma(),
        motivo: motivo.value.trim() || 'NO_DATA',
        tarea: tarea(par.prompt),
        consent: 0,
        /* CON LA PAGINA DENTRO. Decia solo 'preceptoros.org', y desde que el
           boton vive tambien en el Benchmark eso ya no identifica nada: el
           laboratorio recibe los dos pares por la misma puerta y no puede
           distinguir una correccion del chat de la portada de una del Libro de
           Pruebas. Son dos poblaciones distintas --distinto publico, distinta
           intencion-- y mezclarlas contamina las dos, que es el mismo motivo
           por el que existe la columna `arnes`. */
        origen: 'preceptoros.org' + location.pathname
      };
      window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return window.Bronce.guardar({ par: reg, firma: f.firma, autor: f.autor,
                           algoritmo: f.algoritmo, publica: pub });
        });
      }).then(function () {
        caja.innerHTML = '';
        var ok = document.createElement('p');
        ok.className = 'nodata'; ok.textContent = L('corregirGuardado');
        caja.appendChild(ok);
        caja.appendChild(puertaSalida());
        boton.remove();
      }).catch(function (e) {
        enviar.disabled = false;
        aviso.className = 'nodata';
        // El fallo se DICE con su causa. Un boton que no hace nada y no
        // explica por que es peor que un boton que no esta.
        aviso.textContent = L('corregirFallo') + ' — ' + (e && e.message ? e.message : e);
      });
    });
    return caja;
  }

  /* LA PUERTA, y solo aparece cuando hay algo que sacar.
     No es mobiliario de la pagina: quien nunca corrigio nada no tiene por que
     ver un boton de exportar correcciones que no existen. Y dice CUANTAS son
     antes de que pulses, porque entregar a ciegas no es consentir. */
  function puertaSalida() {
    var caja = document.createElement('div');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'leve';
    var nota = document.createElement('p');
    nota.className = 'tenue'; nota.textContent = P('q');
    window.Bronce.leerTodo().then(function (regs) {
      b.textContent = P('b') + ' (' + regs.length + ')';
    });
    b.addEventListener('click', function () {
      b.disabled = true;
      window.Bronce.exportar().then(function (cuantos) {
        nota.className = 'nodata';
        nota.textContent = P('v') + ': ' + cuantos;
      }).catch(function (e) {
        b.disabled = false;
        nota.className = 'nodata';
        // El fallo se DICE con su causa, igual que arriba.
        nota.textContent = P('e') + ' — ' + (e && e.message ? e.message : e);
      });
    });
    caja.appendChild(b); caja.appendChild(nota);
    return caja;
  }

  /* `chat.js` avisa al cerrar cada turno. No hace falta que sepa de nosotros:
     el evento ya existia para el sello y para el medidor. */
  document.addEventListener('preceptor:turno', function () {
    var ps = dialogo.querySelectorAll('p');
    var ultima = ps[ps.length - 1];
    if (!ultima || ultima.className === 'tu') return;
    if (ultima.dataset.corregible) return;
    ultima.dataset.corregible = '1';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'leve corregir';
    b.textContent = L('corregirBoton');
    b.addEventListener('click', function () {
      b.disabled = true;
      ultima.parentNode.insertBefore(formulario(ultima, b), b.nextSibling);
    });
    ultima.parentNode.insertBefore(b, ultima.nextSibling);
  });
})();
