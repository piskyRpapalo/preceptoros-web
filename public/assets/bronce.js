/* preceptoros.org · el Bronce: donde viven los pares corregidos, y su salida.
 *
 * POR QUE ESTE FICHERO EXISTE APARTE
 * ----------------------------------
 * Salio de `corregir.js` el 2026-09-13, cuando ese llego a 16.294 B de los
 * 16.384 del tope y quedaban NOVENTA bytes. Partir por el tope es lo que ya
 * hizo `puertas.css` y es la respuesta correcta: un fichero al limite no admite
 * ni un arreglo, y el proximo arreglo siempre llega.
 *
 * Y ademas es la forma buena. El almacen de pares lo van a querer mas sitios
 * --hoy el chat de la portada y el del Benchmark-- y el duenio de una base de
 * datos tiene que ser uno solo. Dos ficheros abriendo la misma base con su
 * propia idea de la version es como se rompen las bases de datos.
 *
 * NO HAY SALIDA DE RED AQUI DENTRO, igual que en `corregir.js`: ni `fetch`, ni
 * `XMLHttpRequest`, ni `sendBeacon`, ni `WebSocket`, ni `EventSource`. Lo unico
 * que sale es un fichero que se descarga a TU aparato, y solo si lo pides.
 */
(function () {
  var BD = 'preceptoros-bronce', ALMACEN = 'correcciones';

  /* ABRE, Y SI HACE FALTA REPARA.
   *
   * `indexedDB.open(BD, 1)` a secas tiene un modo de fallo silencioso y
   * permanente: si la base YA existe en la version 1 pero sin el almacen
   * --porque una actualizacion se quedo a medias, o porque otro guion la abrio
   * antes con su propia idea-- entonces `onupgradeneeded` NO se dispara, el
   * almacen no se crea nunca, y cada intento de guardar muere con un
   * «object stores was not found» que no dice nada a quien lo sufre. La persona
   * pierde para siempre la posibilidad de corregir, y sin saber por que.
   *
   * Medido el 2026-09-13: paso de verdad, probando el Benchmark. Asi que se
   * comprueba y, si falta, se vuelve a abrir una version mas arriba, que es lo
   * unico que dispara el `upgradeneeded` donde se crea. Reparar en silencio una
   * base rota es correcto; lo que no se puede hacer en silencio es perder datos,
   * y aqui no se pierde ninguno: se anade lo que faltaba.
   */
  function crudo(version) {
    return new Promise(function (ok, mal) {
      var p = version ? indexedDB.open(BD, version) : indexedDB.open(BD);
      p.onupgradeneeded = function () {
        var db = p.result;
        if (!db.objectStoreNames.contains(ALMACEN)) {
          db.createObjectStore(ALMACEN, { keyPath: 'id', autoIncrement: true });
        }
      };
      p.onsuccess = function () { ok(p.result); };
      p.onerror = function () { mal(p.error); };
    });
  }

  function abrir() {
    return crudo(null).then(function (db) {
      if (db.objectStoreNames.contains(ALMACEN)) { return db; }
      var v = db.version + 1;
      db.close();
      return crudo(v);
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

  function leerTodo() {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var p = db.transaction(ALMACEN, 'readonly').objectStore(ALMACEN).getAll();
        p.onsuccess = function () { ok(p.result || []); };
        p.onerror = function () { mal(p.error); };
      });
    });
  }

  /* SE VUELVE A FIRMAR AL SALIR, y no es papeleo.
     Lo guardado lleva `consent: 0`: es tuyo y no material de nadie. Lo que se
     entrega es otro objeto --el mismo par con `consent: 1`-- y por tanto otros
     bytes, que exigen otra firma. Reutilizar la firma del guardado seria
     entregar algo que nunca firmaste: cubriria un `consent: 0` que ya no es
     cierto, y una firma que no cubre lo que se manda no protege nada.

     `Object.assign` conserva el ORDEN de las claves, y el orden importa:
     `JSON.stringify` lo respeta, asi que es lo que se firma y lo que el otro
     lado tiene que reconstruir. Por eso viaja tambien `canonico`, el texto
     exacto: sin el, verificar depende de que dos serializadores distintos
     coincidan caracter a caracter, y ahi un dia se cuela un acento. */
  function entregar(reg) {
    var par = Object.assign({}, reg.par, { consent: 1 });
    var texto = JSON.stringify(par);
    return window.Identity.firmar(par).then(function (f) {
      return window.Identity.publica().then(function (pub) {
        return { par: par, canonico: texto, firma: f.firma, autor: f.autor,
                 algoritmo: f.algoritmo, publica: pub };
      });
    });
  }

  /* Un `Blob` y un `<a download>`. NO es una salida de red y el gate lo sabe:
     su lista es `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` y
     `EventSource` -- las cinco formas de que un dato se vaya SOLO. Bajarse uno
     sus propias cosas es lo contrario de eso. */
  function bajar(datos) {
    var url = URL.createObjectURL(new Blob(
      [JSON.stringify(datos, null, 1)], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'preceptoros-correcciones-' +
      new Date().toISOString().slice(0, 19).replace(/[:T]/g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Se suelta el objeto: un blob vivo retiene el par entero en memoria.
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportar() {
    return leerTodo().then(function (regs) {
      return Promise.all(regs.map(entregar));
    }).then(function (pares) {
      bajar({ esquema: 'preceptoros/correcciones/1',
              exportado: new Date().toISOString(), pares: pares });
      return pares.length;
    });
  }

  /* LO MISMO QUE EXPORTA, PERO SIN BAJARLO. `exportar` construye el paquete y
     lo descarga; `paraEnviar` construye el mismo paquete y lo devuelve, para
     que la puerta del rack lo mande. UNA sola construccion para los dos
     caminos: dos formas de armar el mismo objeto acaban divergiendo, y aqui la
     divergencia seria una firma que no verifica. */
  function paraEnviar() {
    return leerTodo().then(function (regs) {
      return Promise.all(regs.map(entregar));
    });
  }

  window.Bronce = { guardar: guardar, leerTodo: leerTodo, exportar: exportar,
                    paraEnviar: paraEnviar };
})();
