/* preceptoros.org · de donde salen los hilos del Tablon. Solo datos.
 *
 * Hay TRES fuentes y no son intercambiables. Se intentan en este orden y cada
 * una avisa por separado, en cuanto tiene algo:
 *
 *   1. tu cache (IndexedDB) · se pinta al instante, sin esperar a la red.
 *   2. el Agora (api.preceptoros.org) · la unica autoridad. Si contesta,
 *      manda, repinta y refresca el cache.
 *   3. threads.json · hilos de EJEMPLO que viajan con la web.
 *
 * POR QUE ESTA CAPA DEVUELVE `origen` Y NO UNA FRASE
 * -------------------------------------------------
 * Una lista de hilos se ve EXACTAMENTE IGUAL venga de donde venga. La
 * procedencia es la unica diferencia visible entre «esto es el Agora» y «esto
 * es un ejemplo de hace tres dias», asi que viaja como DATO --`origen`,
 * `causa`, `cuando`-- y no como texto ya montado: aqui no hay idioma, y una
 * capa de datos que escribe frases en espanol no se puede traducir.
 *
 * Hoy `/api/v1/threads` responde 404 -- medido el 2026-08-30. El tunel esta
 * vivo y sirve `/api/v1/agents`, pero el tablon no tiene endpoint todavia. No
 * se disimula: se cae al ejemplo y se entrega el codigo exacto que lo tumbo.
 *
 * La base IndexedDB es SUYA (`preceptoros-tablon`) y no la de `auth.js`. Meter
 * un almacen nuevo en `preceptoros` obligaria a subir su version, y auth.js la
 * abre en la 1: la identidad dejaria de cargar. Dos bases sueltas cuestan menos
 * que una migracion coordinada entre dos ficheros que no se conocen.
 */
(function () {
  var API = 'https://api.preceptoros.org/api/v1/threads';
  var BD = 'preceptoros-tablon', ALMACEN = 'hilos', CLAVE = 'ultimo';

  function abrir() {
    return new Promise(function (ok, mal) {
      var p = indexedDB.open(BD, 1);
      p.onupgradeneeded = function () { p.result.createObjectStore(ALMACEN); };
      p.onsuccess = function () { ok(p.result); };
      p.onerror = function () { mal(p.error); };
    });
  }
  function tx(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction(ALMACEN, modo), r = fn(t.objectStore(ALMACEN));
        t.oncomplete = function () { ok(r && r.result); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }
  function sano(d) { return !!d && Array.isArray(d.hilos); }
  function porque(e) { return (e && e.message) ? e.message : String(e); }

  var F = {
    sano: sano,

    guardar: function (d) {
      return tx('readwrite', function (s) {
        s.put({ datos: d, cuando: Date.now() }, CLAVE);
      }).catch(function () { });          // sin cache se sigue viviendo
    },

    cache: function () {
      return tx('readonly', function (s) { return s.get(CLAVE); })
        .catch(function () { return null; });
    },

    agora: function () {
      // `cache: no-store`: el Agora es la autoridad, y una respuesta suya
      // servida del cache del navegador es otra vez el problema de siempre.
      return fetch(API, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        if (!sano(d)) throw new Error('respuesta sin hilos');
        return d;
      });
    },

    ejemplo: function () {
      return fetch('/threads.json').then(function (r) { return r.json(); });
    },

    /* Llama a `pintar(datos, procedencia)` una o dos veces: primero con lo que
       haya en cache, despues con lo del Agora si contesta. `procedencia` es
       {origen, causa, cuando} y NUNCA viene vacia -- quien pinta no puede
       quedarse sin saber que esta pintando. */
    cargar: function (pintar, sinNada) {
      var yaHay = false;

      F.cache().then(function (c) {
        if (yaHay || !c || !sano(c.datos)) return;
        yaHay = true;
        pintar(c.datos, { origen: 'cache', cuando: c.cuando });
      });

      F.agora().then(function (d) {
        yaHay = true;
        F.guardar(d);
        pintar(d, { origen: 'agora' });
      }).catch(function (e) {
        var causa = porque(e);
        // Si ya hay algo pintado, el ejemplo NO entra: pisar el cache del
        // visitante con hilos de mentira es un retroceso, no un respaldo. Se
        // avisa de que el Agora no contesto y se deja lo que hay.
        if (yaHay) { pintar(null, { origen: 'fallo', causa: causa }); return; }
        F.ejemplo().then(function (d) {
          yaHay = true;
          pintar(d, { origen: 'ejemplo', causa: causa });
        }).catch(function (e2) {
          sinNada(causa + ' · ' + porque(e2));
        });
      });
    }
  };
  window.TablonFuentes = F;
})();
