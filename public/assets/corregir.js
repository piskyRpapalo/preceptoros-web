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
 * leyendo este fichero. El par se firma y se guarda EN TU APARATO, y se queda
 * ahi. El envio es otra puerta, y esa puerta la abre una firma que todavia no
 * existe.
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
  if (!dialogo || !window.Identity) return;

  /* Base de datos APARTE de la de `auth.js`, y no es descuido. `auth.js` abre
     `preceptoros` en la version 1 y crea un solo almacen; anadir aqui otro
     obligaria a subir a la version 2, y entonces el `open(BD, 1)` de auth.js
     revienta con VersionError. Ademas son dos cosas con vidas distintas: la
     identidad es para siempre, las correcciones son material de trabajo. */
  var BD = 'preceptoros-bronce', ALMACEN = 'correcciones';

  function abrir() {
    return new Promise(function (ok, mal) {
      var p = indexedDB.open(BD, 1);
      p.onupgradeneeded = function () {
        p.result.createObjectStore(ALMACEN, { keyPath: 'id', autoIncrement: true });
      };
      p.onsuccess = function () { ok(p.result); };
      p.onerror = function () { mal(p.error); };
    });
  }

  function guardar(reg) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction(ALMACEN, 'readwrite');
        t.objectStore(ALMACEN).add(reg);
        t.oncomplete = function () { ok(); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }

  function L(clave) {
    var t = (window.Hub && window.Hub.textos) || {};
    return t[clave] || '';
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
        consent: 0,
        origen: 'preceptoros.org'
      };
      window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return guardar({ par: reg, firma: f.firma, autor: f.autor,
                           algoritmo: f.algoritmo, publica: pub });
        });
      }).then(function () {
        caja.innerHTML = '';
        var ok = document.createElement('p');
        ok.className = 'nodata'; ok.textContent = L('corregirGuardado');
        caja.appendChild(ok);
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
