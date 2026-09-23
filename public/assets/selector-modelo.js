/* preceptoros.org · elegir cerebro pulsando una tarjeta, no un desplegable.
 *
 * POR QUE TARJETAS Y NO UN `select`. Lo pidio el Soberano asi: «botones grandes
 * y educativos», con el mismo formato de la ficha que ya hay bajo el chat --
 * nombre, modelo, capacidad medida--. Un desplegable obliga a saber de antemano
 * que significa cada nombre; una tarjeta lo explica mientras eliges. Y quien
 * entra a probar cerebros esta aprendiendo que hace cada capa: eso es la mitad
 * del producto, no un ajuste escondido en una rueda.
 *
 * ENVUELVE, NO REESCRIBE. `chat.js` pide el turno con `Rack.stream(modelo,...)`.
 * Aqui se envuelve esa funcion y se le sustituye el primer argumento. Ni
 * `chat.js` ni el router se tocan -- la regla que fijo `chat-router.js`.
 *
 * LAS CIFRAS SON MEDIDAS Y VIENEN DE `cerebros.json`, que las trae del propio
 * Ollama. Un `null` se pinta NO_DATA y no se rellena: una tarjeta con una cifra
 * inventada seria exactamente lo que este sitio dice no hacer.
 */
(function () {
  var LLAVE = 'preceptor-modelo';
  var REG = null, PROSA = {};

  function guardado() {
    try { return localStorage.getItem(LLAVE) || ''; } catch (e) { return ''; }
  }

  /* El modelo del cerebro marcado `recomendado`. Devuelve '' mientras el
     catalogo no ha llegado: sin dato no se adivina, se deja pasar el que
     venia. */
  function porDefecto() {
    var c = (REG && REG.cerebros || []).filter(function (x) { return x.recomendado; })[0];
    return c ? c.modelo : '';
  }

  /* QUIEN CONTESTA, PARA QUIEN LO NECESITE. Lo publica este fichero porque es
     el que MANDA: envuelve `Rack.stream` y sustituye cualquier nombre que le
     pasen por `guardado() || porDefecto()`. Cualquier otro que quisiera saber
     el modelo tendria que repetir esa regla, y dos copias de una regla acaban
     discrepando --- que es la averia que hoy costo tres semanas de pastilla
     verde anunciando un companero retirado.
     Lo pide `camino-papel.js`: cuando un piso de la Torre viste el chat, el
     evento lleva `modelo` dentro, y mandar ahi un nombre distinto del que de
     verdad contesta pintaria un badge que miente. */
  /* EL PISO MANDA (2026-09-22). Las tarjetas «Elige cerebro» se retiraron por
     orden del Soberano: en la portada el cerebro lo pone el PISO de la Torre
     que esta abierto --reparto firmado en `cerebros.json` › `pisos`-- y lo
     escribe `piso-chat.js` en `window.CerebroDelPiso`. Queda por debajo lo
     guardado de antes (quien eligio una tarjeta cuando las habia) y el
     recomendado, para las paginas sin Torre. */
  window.CerebroPuesto = function () {
    return window.CerebroDelPiso || guardado() || porDefecto() || '';
  };

  function envolver() {
    if (!window.Rack || window.Rack.__envuelto) return;
    var original = window.Rack.stream;
    window.Rack.stream = function (modelo, prompt, alTrozo, sistema) {
      /* SIN ELECCION GUARDADA MANDA EL RECOMENDADO, no lo que traiga quien
         llama (2026-09-08). Antes `recomendado` era solo una insignia y el
         primero en hablar salia del catalogo de companeros: El Anfitrion, que
         sabe instalar pero es verboso y le repite los pasos a quien ya
         instalo --lo dice su propia ficha--. Quien abre la web a hablar no
         viene a instalar dos veces.

         Que la insignia y el que contesta sean la MISMA decision evita la
         clase de fallo que este repo lleva meses corrigiendo: dos sitios
         diciendo cosas distintas del mismo hecho. */
      return original.call(window.Rack,
        window.CerebroPuesto() || modelo, prompt, alTrozo, sistema);
    };
    window.Rack.__envuelto = true;
  }

  /* SIN TARJETAS (2026-09-22). Aqui se pintaba el banco «Elige cerebro»: dos
     de puerta en la portada y los demas en Comunidad. El Soberano lo retiro de
     las dos: «el modelo debe estar explicado en la ventana de descarga», y
     quien lo elige es el piso, no una rejilla de fichas tecnicas que un
     visitante no tecnico no sabe leer.

     LO QUE QUEDA ES EL DUENO DEL CATALOGO. Este fichero sigue cargando
     `cerebros.json` y su prosa, y lo PUBLICA --evento y global-- para los dos
     que lo usan: `piso-chat.js` decide con el quien habla, y
     `ficha-cerebro.js` lo describe. Un solo dueno del catalogo; si cada uno lo
     pidiera por su cuenta serian dos verdades con dos momentos de carga.

     El evento se dispara donde SE CARGA el registro, no en un clic: quien llega
     y no toca nada tiene que tener companero igual (ver la prueba
     «el visitante NUEVO tambien tiene companero»). */
  function pintar(reg, tx) {
    REG = reg; PROSA = (tx && tx.cerebros) || {};
    window.CerebrosReg = { reg: REG, prosa: PROSA, paises: (tx && tx.paises) || {},
                           lenguas_no_data: tx && tx.lenguas_no_data };
    document.dispatchEvent(new CustomEvent('preceptor:cerebros',
      { detail: { puerta: porDefecto(), reg: REG, prosa: PROSA } }));
  }

  function arrancar() {
    envolver();
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    /* DOS FICHEROS Y UN RESPALDO POR FICHERO ENTERO. Los hechos no tienen
       idioma; la prosa si, y cae al ingles COMPLETA en vez de por clave
       suelta: media lengua traducida y media caida se lee peor que una lengua
       entera prestada. Es la regla que `taller.js` ya aplica. */
    var traer = function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
    /* NO SE PIDE LO QUE SE SABE QUE NO ESTA · 2026-09-20
       Solo hay `cerebros-es` y `cerebros-en`. Las otras seis lenguas pedian su
       fichero y se comian un 404 EN CADA VISITA antes de caer al ingles.
       `cerebros.json` declara cuales faltan en `prosa_pendiente`, asi que
       ahora se lee esa lista y no se pide el que no existe.
       ESTE ERA EL SEGUNDO CONSUMIDOR. `comparar.js` hacia lo mismo y arreglar
       solo aquel dejaba el 404 aqui: la portada y community cargan este. */
    fetch('/cerebros.json', { cache: 'no-store' }).then(traer)
      .then(function (base) {
        var pend = (base.prosa_pendiente || {}).idiomas || [];
        var suyo = pend.indexOf(lang) !== -1
          ? Promise.reject(new Error('prosa pendiente'))
          : fetch('/cerebros-' + lang + '.json', { cache: 'no-store' }).then(traer);
        return suyo.catch(function () {
          return fetch('/cerebros-en.json', { cache: 'no-store' }).then(traer);
        }).then(function (prosa) { return [base, prosa]; });
      })
      .then(function (par) { pintar(par[0], par[1]); })
      .catch(function (e) {
        // Sin catalogo no hay quien diga que cerebro habla: se dice, con causa.
        var host = document.getElementById('especificaciones');
        if (!host || document.getElementById('cerebros-nodata')) return;
        var p = document.createElement('p');
        p.className = 'nodata'; p.id = 'cerebros-nodata';
        p.textContent = 'NO_DATA · cerebros.json: ' + e.message;
        host.parentNode.insertBefore(p, host.nextSibling);
      });
  }

  addEventListener('load', arrancar);
  if (document.readyState === 'complete') arrancar();
})();
