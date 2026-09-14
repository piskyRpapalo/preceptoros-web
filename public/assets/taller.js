/* preceptoros.org · el taller: la vitrina de las lineas de investigacion.

   DOS FICHEROS, Y LA FRONTERA ES LA DE SIEMPRE. `loratelier.json` trae los
   HECHOS --estado, base, tamaño, firma, recuentos-- y no lleva una palabra de
   prosa. `taller-<idioma>.json` trae el texto, uno por lengua. Se separan por
   el mismo motivo por el que el Hub saco los suyos: juntar las ocho lenguas en
   un fichero lo deja lleno el primer dia, y en griego y ruso cada caracter
   cuesta el doble.

   TRES NIVELES. El primero es la frase humana y no nombra ningun modelo: quien
   llega sin saber nada tiene que entender el problema antes que la herramienta.
   El segundo dice que hace hoy, que falta y que se puede aportar. El tercero es
   la ficha, y ahi si van familia, base, tamaño y firma.

   LO QUE ESTE FICHERO NO PINTA NUNCA es un boton de descarga sin `artefacto` y
   sin `hash` en el registro. Hoy no hay ninguno publicado, asi que la vitrina
   nace sin descargas -- y es justo eso lo que hara creible el primer boton. */
(function () {
  var caja = document.getElementById('taller');
  if (!caja) return;

  var L = {}, UI = {}, REGISTRO = null;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  /* Un par etiqueta/valor. Se usa igual en el nivel dos y en la ficha: la
     diferencia es la clase, no la estructura. */
  function par(padre, etiqueta, valor, clase) {
    if (valor == null || valor === '') return;
    var dt = el('dt', null, etiqueta), dd = el('dd', clase || null, String(valor));
    padre.appendChild(dt); padre.appendChild(dd);
  }

  /* LA ESCALERA, y es la unica fuente del progreso. Cuatro peldanos
     DECLARADOS por quien escribe el registro --no medidos--: se estudia, se
     entrena, se prueba, se publica. `vision` y `NO_DATA` quedan FUERA a
     proposito: una intencion declarada no esta en el peldano cero de nada, y
     una barra al 0 % se lee como un avance parado, que es otra cosa.

     Por que peldano y no «pares firmados de 500», que es lo que se pidio: no
     existe recuento por linea en ninguna parte. `agora.json` cuenta 3 paquetes
     firmados en TODO el sitio y no dice a que linea pertenecen. Inventar el
     denominador seria fabricar la barra entera. */
  var ESCALERA = ['en_estudio', 'en_entrenamiento', 'beta', 'disponible'];

  function sello(estado) {
    var mapa = { en_estudio: 'estudio', en_entrenamiento: 'entrenando',
                 beta: 'beta', disponible: 'disponible', vision: 'vision' };
    var clave = mapa[estado] || 'estudio';
    return el('span', 'sello sello-' + clave, UI[clave] || estado);
  }

  /* El peldano, con su cuenta y su porcentaje al lado. El porcentaje es la
     aritmetica de la cuenta --3 de 4 son 75 %-- y no una segunda medida: por eso
     salen los dos del mismo sitio y en el mismo rotulo. La barra lleva ese
     rotulo en `aria-label` porque un relleno de color no lo lee nadie. */
  function barra(bloque) {
    var i = ESCALERA.indexOf(bloque.estado);
    if (i < 0) return el('p', 'sin-peldano', UI.sinBarra || '');
    var n = i + 1, t = ESCALERA.length, pct = Math.round(n * 100 / t);
    var rot = (UI.peldano || '').replace('{n}', n)
                .replace('{t}', t).replace('{pct}', pct);
    var caja2 = el('div', 'peldanos');
    var via = el('div', 'barra');
    via.setAttribute('role', 'img');
    via.setAttribute('aria-label', rot);
    var relleno = el('span', 'barra-lleno');
    relleno.style.width = pct + '%';
    via.appendChild(relleno);
    caja2.appendChild(via);
    caja2.appendChild(el('p', 'peldano', rot));
    return caja2;
  }

  function linea(bloque) {
    var texto = (L.bloques || {})[bloque.id];
    if (!texto) return null;                 // sin texto en esta lengua, no se pinta
    var art = el('article', 'panel linea');

    var cab = el('div', 'linea-cab');
    var h3 = el('h3', 'linea-entrar', texto.nombre || bloque.id);
    cab.appendChild(h3);
    cab.appendChild(sello(bloque.estado));
    art.appendChild(cab);
    art.appendChild(el('p', 'linea-util', texto.util || ''));
    art.appendChild(barra(bloque));
    /* EL RECUENTO QUE NO HAY, dicho donde se esperaria verlo. Se pidio «324
       pares firmados de 500» y no existe: ni por linea, ni en ningun fichero de
       este repo. Un hueco callado en el sitio de una cifra se lee como un cero,
       asi que se nombra la ausencia y su causa. */
    if (UI.aportes) art.appendChild(el('p', 'sin-aportes', UI.aportes));

    /* EL PANEL ENTERO ES EL LANZADOR · 2026-09-14, segunda vuelta.
       Aqui habia un `<button>` con el titulo dentro y el enlace estirado
       (`::after{inset:0}`) por encima. Se arreglo una vez con `z-index:2`
       (A24) y AUN ASI solo abria pulsando el nombre: el pseudoelemento
       compite con cada hermano que se pinte despues, y basta uno con posicion
       propia para taparlo otra vez. Un truco que hay que volver a defender
       cada vez que se añade un elemento no es una solucion: es una deuda.
       El Killswitch se resolvio sin el --el panel ES el boton-- y funciono a
       la primera. Se hace igual aqui, y el titulo vuelve a ser texto: un
       boton dentro de otro boton no lo sabe leer un lector de pantalla. */
    art.tabIndex = 0;
    art.setAttribute('role', 'button');
    art.setAttribute('aria-label', texto.nombre || bloque.id);
    function entrar() {
      if (!window.Escenario) return;         // sin escenario, la tarjeta no miente
      window.Escenario.abrir(bloque, texto, UI, REGISTRO, sello(bloque.estado));
    }
    art.addEventListener('click', entrar);
    art.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); entrar(); }
    });
    return art;
  }

  /* LO QUE SE PUEDE TOCAR HOY, DELANTE. Orden del Soberano, 2026-09-14.

     Siete tarjetas seguidas se leen como siete cosas equivalentes, y no lo son:
     tres estan en marcha --se puede hablar con ellas, medir y corregir-- y
     cuatro son intenciones declaradas, sin modelo servido y sin nada que
     probar. Puestas juntas, las cuatro que no se pueden tocar diluyen a las
     tres que si: quien llega no distingue donde actuar.

     Las de vision NO se esconden --siguen siendo publicas, con su causa-- se
     PLIEGAN. Es la diferencia entre no contar algo y no ponerlo delante.

     El corte es el mismo de la barra: si tiene peldano en la escalera, esta en
     marcha. No hay una segunda regla que un dia diga otra cosa. */
  function pintar(registro) {
    REGISTRO = registro;
    var activas = el('div', 'taller-rejilla');
    var dormidas = el('div', 'taller-rejilla');
    var nDormidas = 0;
    (registro.bloques || [])
      .slice()
      .sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); })
      .forEach(function (b) {
        var n = linea(b);
        if (!n) return;
        if (ESCALERA.indexOf(b.estado) >= 0) { activas.appendChild(n); }
        else { dormidas.appendChild(n); nDormidas += 1; }
      });
    caja.innerHTML = '';
    caja.appendChild(el('h2', null, UI.titulo || ''));
    caja.appendChild(activas);
    if (nDormidas) {
      var pliego = el('details', 'pliego');
      var res = el('summary', null,
        (UI.noDisponibles || '').replace('{n}', nDormidas));
      pliego.appendChild(res);
      pliego.appendChild(dormidas);
      caja.appendChild(pliego);
    }
    paquete(registro);
  }

  /* --- LA PUERTA DE SALIDA DEL APORTE (parche declarado, 2026-09-06) -------
     Mientras `/api/v1/medidas` siga en 404 y la escritura del Agora cerrada,
     el aporte no tiene por donde salir. Esto NO abre ese endpoint: arma el
     paquete en el aparato, lo ENSEÑA entero, y lo manda la persona desde su
     propio correo. Sin `fetch`, sin `sendBeacon`, sin nada automatico -- la
     misma linea que `corregir.js` defiende, y por el mismo motivo: aqui no se
     piden datos, se le devuelven los suyos a quien los escribio.

     Se ve ANTES de copiarse. Un boton que empaqueta lo que no enseña es
     telemetria con buenos modales. */
  function maquina() {
    var n = navigator, p = {};
    p.idioma = n.language || null;
    p.nucleos = n.hardwareConcurrency || null;      // null = el navegador no lo dice
    p.memoria_gb = n.deviceMemory || null;          // solo Chromium, y redondeado
    p.pantalla = screen.width + 'x' + screen.height;
    p.agente = n.userAgent;
    return p;
  }

  function correcciones() {
    // La base de `corregir.js`, en solo lectura. Si no existe --nadie ha
    // corregido nada-- son cero, no un error.
    return new Promise(function (ok) {
      var q = indexedDB.open('preceptoros-bronce', 1);
      q.onupgradeneeded = function () { try { q.transaction.abort(); } catch (e) { /* */ } };
      q.onerror = function () { ok([]); };
      q.onsuccess = function () {
        var db = q.result;
        if (!db.objectStoreNames.contains('correcciones')) { ok([]); return; }
        var r = db.transaction('correcciones', 'readonly')
                  .objectStore('correcciones').getAll();
        r.onsuccess = function () { ok(r.result || []); };
        r.onerror = function () { ok([]); };
      };
    });
  }

  function paquete(registro) {
    var ap = registro.aporte || {};
    if (!ap.correo) return;                       // sin destino no se pinta puerta
    /* PLEGADO · 2026-09-15. Esto abria con un textarea de ocho lineas lleno de
       JSON antes de que nadie hubiera corregido nada. Quien llega no viene a
       empaquetar: viene a ver que hay. El pliegue no esconde --el titulo sigue
       ahi, y dentro esta todo-- pero deja de gritar. */
    var sec = el('details', 'pliego taller-aporte');
    sec.appendChild(el('summary', null, UI.paqTitulo || ''));
    sec.appendChild(el('p', 'linea-util', UI.paqExplica || ''));
    var vista = document.createElement('textarea');
    vista.className = 'taller-paquete'; vista.readOnly = true; vista.rows = 8;
    sec.appendChild(vista);
    var fila = el('div', 'fila');
    var bc = el('button', 'boton', UI.paqCopiar || ''); bc.type = 'button';
    var bm = el('a', 'leve', UI.paqCorreo || '');
    fila.appendChild(bc); fila.appendChild(bm);
    sec.appendChild(fila);
    caja.appendChild(sec);

    correcciones().then(function (pares) {
      var d = {
        esquema: ap.esquema_paquete || 1,
        fecha: new Date().toISOString(),
        maquina: maquina(),
        correcciones: pares
      };
      var yo = window.Identity && window.Identity.quien && window.Identity.quien();
      if (yo) d.autor = yo;
      var txt = JSON.stringify(d, null, 1);
      vista.value = txt;
      // El cuerpo del correo va CORTO a proposito: los `mailto` largos los
      // truncan los clientes sin avisar, y un paquete truncado es peor que uno
      // pegado a mano. El JSON viaja por el portapapeles, que no trunca.
      bm.href = 'mailto:' + ap.correo
        + '?subject=' + encodeURIComponent('PreceptorOS · aporte de tester')
        + '&body=' + encodeURIComponent((UI.paqCorreoCuerpo || '') + '\n\n');
      bc.addEventListener('click', function () {
        var hecho = function () { bc.textContent = UI.paqCopiado || 'OK'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(hecho, function () {
            vista.select(); hecho();
          });
        } else { vista.select(); hecho(); }
      });
    });
  }

  function traer(ruta) {
    return fetch(ruta, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  // El respaldo es al castellano y por FICHERO, no por clave suelta: media
  // lengua traducida y media caida es peor que una lengua entera prestada,
  // porque nadie sabe cual de las dos frases es la buena.
  traer('/taller-' + lang + '.json')
    .catch(function () { return traer('/taller-es.json'); })
    .then(function (t) { L = t; UI = t.ui || {}; return traer('/loratelier.json'); })
    .then(pintar)
    .catch(function (e) {
      // NO_DATA con causa a la vista, que es lo que esta casa hace cuando algo
      // no llega: un hueco callado se confunde con una seccion que no existe.
      caja.innerHTML = '';
      var p = el('p', 'nodata', 'NO_DATA · ' + e.message);
      caja.appendChild(p);
    });
})();
