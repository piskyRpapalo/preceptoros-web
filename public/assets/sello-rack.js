/* preceptoros.org · EL SELLO DEL RACK. Verde solo si el rack esta recibiendo DE VERDAD.
 *
 * QUE PIDIO EL SOBERANO (2026-09-24): en cada sitio desde el que la gente puede
 * mandar su valoracion al rack, un cartel verde que diga «disponible», para
 * poder empezar a guiar a los testers.
 *
 * POR QUE NO ES UN CARTEL FIJO. Un «disponible» pintado a mano sobre una puerta
 * cerrada es exactamente la averia que la casa lleva semanas cazando: la salud
 * en verde con el modelo ausente, el `servido_en_el_rack` que no existia. Asi
 * que el sello PREGUNTA al abrir la pagina, una vez:
 *   · puertas que salen por «Enviar al rack» (valorar, corregir, reescrituras,
 *     firmar un paso de la Torre, firmar un duelo del LoRAtelier, reseñar una
 *     mision de Comunidad, y el propio boton): desde el 2026-09-29 manda la
 *     MEDIDA FECHADA de la ruta de entrega (`POST /api/v1/paquetes`, en
 *     `/rutas-medidas.json`), no `GET /api/v1/salud`. Verde solo con acuse
 *     verificado y el rack vivo; si no, gris con el codigo y la fecha;
 *   · el foro de Comunidad: `GET /api/v1/comentarios`. Medido el 2026-09-24: 404,
 *     la ruta no existe en el rack. Ese cartel sale GRIS con su causa, y se
 *     pondra verde solo el dia que la ruta conteste.
 * Si la pregunta no llega (sin red, el tunel caido), el sello dice «sin
 * comprobar» y no verde: un NO_DATA no es un aprobado con suerte.
 *
 * Las capturas se guardan firmadas en el aparato. Mientras la ruta de entrega
 * no devuelva acuse, NO viajan al pulsar «Enviar al rack»: el titulo del sello
 * dice el codigo y la fecha de la medida, y lo que si llega (exportar y subir
 * por PR al repositorio publico).
 */
(function () {
  'use strict';
  if (window.SelloRack) return;
  window.SelloRack = true;
  var API = 'https://api.preceptoros.org/api/v1';
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  var TX = {
    es: ['Disponible', 'No disponible', 'Sin comprobar',
         'El rack recibe y devuelve acuse: entrega verificada el {f}.',
         'Se guarda firmado en tu aparato. Hoy no llega al rack: la ruta de entrega respondió {c} (medido el {f}). Lo que sí llega es exportarlo y subirlo por PR al repositorio público.',
         'El foro todavía no tiene puerta en el rack: no se puede publicar.',
         'No se pudo comprobar el rack desde aquí.',
         'Valora o corrige una respuesta y aquí aparecerá «Enviar al rack».'],
    en: ['Available', 'Not available', 'Not checked',
         'The rack receives and returns a receipt: delivery verified on {f}.',
         'Saved signed on your device. Today it does not reach the rack: the delivery route answered {c} (measured on {f}). What does arrive is exporting it and sending it as a PR to the public repository.',
         'The forum has no door in the rack yet: posting is not possible.',
         'The rack could not be checked from here.',
         'Rate or correct an answer and «Send to the rack» will appear here.'],
    fr: ['Disponible', 'Indisponible', 'Non vérifié',
         'Le rack reçoit et renvoie un accusé : livraison vérifiée le {f}.',
         'Enregistré signé sur votre appareil. Aujourd’hui il n’arrive pas au rack : la route de livraison a répondu {c} (mesuré le {f}). Ce qui arrive, c’est de l’exporter et de l’envoyer en PR au dépôt public.',
         'Le forum n’a pas encore de porte dans le rack : impossible de publier.',
         'Impossible de vérifier le rack d’ici.',
         'Évaluez ou corrigez une réponse et « Envoyer au rack » apparaîtra ici.'],
    pt: ['Disponível', 'Indisponível', 'Por verificar',
         'O rack recebe e devolve recibo: entrega verificada a {f}.',
         'Guarda-se assinado no teu aparelho. Hoje não chega ao rack: a rota de entrega respondeu {c} (medido a {f}). O que chega é exportá-lo e enviá-lo por PR ao repositório público.',
         'O fórum ainda não tem porta no rack: não é possível publicar.',
         'Não foi possível verificar o rack daqui.',
         'Avalia ou corrige uma resposta e aqui aparecerá «Enviar para o rack».'],
    it: ['Disponibile', 'Non disponibile', 'Non verificato',
         'Il rack riceve e restituisce una ricevuta: consegna verificata il {f}.',
         'Si salva firmato sul tuo dispositivo. Oggi non arriva al rack: la rotta di consegna ha risposto {c} (misurato il {f}). Ciò che arriva è esportarlo e inviarlo come PR al repository pubblico.',
         'Il forum non ha ancora una porta nel rack: non si può pubblicare.',
         'Non è stato possibile verificare il rack da qui.',
         'Valuta o correggi una risposta e qui apparirà «Invia al rack».'],
    de: ['Verfügbar', 'Nicht verfügbar', 'Nicht geprüft',
         'Das Rack empfängt und gibt eine Quittung zurück: Zustellung geprüft am {f}.',
         'Wird signiert auf deinem Gerät gespeichert. Heute erreicht es das Rack nicht: die Zustellroute antwortete {c} (gemessen am {f}). Was ankommt: exportieren und als PR ins öffentliche Repository senden.',
         'Das Forum hat noch keine Tür im Rack: Posten ist nicht möglich.',
         'Das Rack konnte von hier aus nicht geprüft werden.',
         'Bewerte oder korrigiere eine Antwort, dann erscheint hier «An das Rack senden».'],
    ru: ['Доступно', 'Недоступно', 'Не проверено',
         'Стойка принимает и возвращает квитанцию: доставка проверена {f}.',
         'Сохраняется с подписью на вашем устройстве. Сегодня не доходит до стойки: маршрут доставки ответил {c} (измерено {f}). Доходит другое: экспортировать и отправить PR в публичный репозиторий.',
         'У форума пока нет входа в стойке: публиковать нельзя.',
         'Не удалось проверить стойку отсюда.',
         'Оцените или исправьте ответ, и здесь появится «Отправить в стойку».'],
    el: ['Διαθέσιμο', 'Μη διαθέσιμο', 'Χωρίς έλεγχο',
         'Το rack λαμβάνει και επιστρέφει απόδειξη: η παράδοση επαληθεύτηκε στις {f}.',
         'Αποθηκεύεται υπογεγραμμένο στη συσκευή σου. Σήμερα δεν φτάνει στο rack: η διαδρομή παράδοσης απάντησε {c} (μέτρηση {f}). Φτάνει η εξαγωγή και η αποστολή ως PR στο δημόσιο αποθετήριο.',
         'Το φόρουμ δεν έχει ακόμη πόρτα στο rack: δεν γίνεται δημοσίευση.',
         'Δεν ήταν δυνατός ο έλεγχος του rack από εδώ.',
         'Αξιολόγησε ή διόρθωσε μια απάντηση και εδώ θα εμφανιστεί «Αποστολή στο rack».'],
    ar: ['متاح', 'غير متاح', 'لم يُتحقَّق',
         'الرف يستقبل ويعيد إيصالًا: تم التحقق من التسليم في {f}.',
         'يُحفظ موقّعًا على جهازك. اليوم لا يصل إلى الرف: أجاب مسار التسليم بـ {c} (قيس في {f}). ما يصل هو تصديره وإرساله كطلب دمج (PR) إلى المستودع العام.',
         'لا يملك المنتدى بابًا في الرف بعد: لا يمكن النشر.',
         'تعذّر التحقق من الرف من هنا.',
         'قيّم إجابة أو صحّحها وسيظهر هنا «أرسل إلى الرف».']
  };
  /* pendiente-revision-nativa: ru, el, ar (2026-09-29). El Soberano no las puede revisar; las demas, si. */
  var t = TX[lang] || TX.en, ENTREGA = null;
  /* LA PROMESA SE MIDE EN LA RUTA DE ENTREGA, NO EN /salud (Soberano, 2026-09-29). Hasta ese dia el sello
     preguntaba a `GET /salud` y pintaba verde las puertas de «Enviar al rack» mientras `POST /paquetes`
     devolvia 404 (medido el 2026-09-13): una promesa falsa con buen color. Ahora lee la medida fechada
     de la ruta (`/rutas-medidas.json`, que reescribe el humo del rack): verde solo con acuse verificado
     y el rack vivo ahora; gris con el codigo y la fecha; sin medida, «sin comprobar». */
  function titulo(e) {
    var f = { c: ENTREGA && ENTREGA.codigo, f: ENTREGA && (ENTREGA.acuse_el || ENTREGA.medido_el) };
    var x = e === 'si' ? t[3] : e === 'no' ? t[4] : t[6];
    return x.replace(/\{(\w)\}/g, function (m, k) { return f[k] == null ? m : f[k]; });
  }
  function entrega() {
    return fetch('/rutas-medidas.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        ENTREGA = ((m && m.rutas) || []).filter(function (x) { return x.id === 'paquetes'; })[0] || null;
        if (!ENTREGA || ENTREGA.codigo == null) return 'nd';
        if (!ENTREGA.acuse_verificado) return 'no';
        return pide('/salud', function (d) { return d && d.estado === 'OK' && d.firmas_verificadas; });
      }, function () { return 'nd'; });
  }

  function pide(ruta, ok) {
    var c = window.AbortController ? new AbortController() : null;
    var reloj = setTimeout(function () { if (c) c.abort(); }, 6000);
    return fetch(API + ruta, { cache: 'no-store', signal: c ? c.signal : undefined })
      .then(function (r) {
        clearTimeout(reloj);
        if (r.status === 404) return 'no';
        return r.ok ? r.json().then(function (d) { return ok(d) ? 'si' : 'nd'; }) : 'nd';
      }, function () { clearTimeout(reloj); return 'nd'; });
  }

  function estilo() {
    var e = document.createElement('style');
    e.textContent =
      '.sello-rack{display:inline-flex;align-items:center;gap:.35em;font-size:.72rem;' +
        'font-weight:700;letter-spacing:.03em;padding:.18em .6em;border-radius:999px;' +
        'margin:.2rem .4rem .3rem 0;vertical-align:middle;line-height:1.4}' +
      '.sello-rack::before{content:"";width:.55em;height:.55em;border-radius:50%;' +
        'background:currentColor}' +
      '.sello-rack.si{background:#1e7b34;color:#fff}' +
      '.sello-rack.no{background:#5b5b63;color:#fff}' +
      '.sello-rack.nd{background:transparent;color:inherit;border:1px dashed currentColor}' +
      '.sello-guia{font-size:.8rem;margin:.3rem 0}';
    document.head.appendChild(e);
  }

  function sello(estado, titulo) {
    var s = document.createElement('span');
    s.className = 'sello-rack ' + estado;
    s.setAttribute('role', 'status');
    s.textContent = estado === 'si' ? t[0] : estado === 'no' ? t[1] : t[2];
    s.title = titulo;
    return s;
  }

  function pon(nodo, estado, titulo) {
    if (!nodo || nodo.querySelector(':scope > .sello-rack')) return;
    /* Nunca dentro de un campo: el 2026-09-24 se colgo de `.duelo-campo`, que es
       el <textarea> de la pregunta, y un hijo de texto de un textarea es su
       valor por defecto. Y nunca en una caja vacia: `.duelo-veredicto` existe
       desde el principio y solo se llena cuando el duelo termina. */
    if (/^(TEXTAREA|INPUT|SELECT)$/.test(nodo.tagName) || !nodo.firstElementChild) return;
    nodo.insertBefore(sello(estado, titulo), nodo.firstChild);
  }

  var RACK = null, FORO = null;  // una pregunta por puerta y por pagina, compartida
  var CAPTURAS = ['.valorar-caja', '.corregir-caja', '#piso-firma', '.torre-firma', '.duelo-veredicto', '.esc-resena'];

  function siembra() {
    if (FORO) {
      FORO.then(function (e) {
        pon(document.getElementById('foro'), e, e === 'si' ? t[3] : e === 'no' ? t[5] : t[6]);
      });
    }
    if (!RACK) return;
    RACK.then(function (e) {
      var tit = titulo(e);
      CAPTURAS.forEach(function (sel) {
        Array.prototype.forEach.call(document.querySelectorAll(sel), function (n) {
          pon(n, e, tit);
        });
      });
      var fila = document.getElementById('enviar-rack');
      if (fila) pon(fila, e, tit);
      var panel = document.getElementById('panel-ajustes');
      var guia = document.getElementById('sello-guia');
      if (panel && !fila && !guia) {
        guia = document.createElement('p');
        guia.id = 'sello-guia'; guia.className = 'sello-guia';
        guia.appendChild(sello(e, tit));
        guia.appendChild(document.createTextNode(t[7]));
        panel.appendChild(guia);
      } else if (fila && guia) {
        guia.parentNode.removeChild(guia);
      }
    });
  }

  function arranca() {
    estilo();
    if (document.getElementById('foro')) FORO = pide('/comentarios', function () { return true; });
    if (document.getElementById('panel-ajustes') || document.getElementById('chat')) {
      RACK = entrega();
    }
    if (FORO || RACK) {
      siembra();
      /* Las capturas nacen despues (una por respuesta del chat, la firma al
         abrir un piso): se vigila el documento y se siembra cada vez. */
      var pendiente = false;
      new MutationObserver(function () {
        if (pendiente) return;
        pendiente = true;
        setTimeout(function () { pendiente = false; siembra(); }, 150);
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
  else arranca();
})();
