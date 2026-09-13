/* preceptoros.org · el Perfil, mitad QUIEN ERES Y DONDE ESTAS.
 *
 * LA OTRA MITAD --lo que la clave te DEJA hacer, las notas de version y el
 * cambio de clave-- vive en `profile-obra.js`. Se parte por ahi y no por otro
 * sitio porque es la misma costura que ve quien mira la pagina: arriba quien
 * eres y en que aparato estas, abajo que puedes hacer y como se rompe.
 *
 * LO QUE SE FUE DE ESTA PAGINA EL 2026-09-13, Y POR QUE NO VUELVE
 * --------------------------------------------------------------
 * La ficha pintaba ocho bustos elegibles, una biografia con editor y un boton
 * de compartir. Las tres describian un sistema que ya no es, y ninguna de las
 * tres fallaba: por eso llevaban meses ahi.
 *
 *   LOS OCHO BUSTOS eran una eleccion sin consecuencia. Un avatar que no sale
 *     del aparato no lo ve nadie mas que su dueno. Ademas obligaba a pedir
 *     `bustos.json` antes de poder pintar la cara de la ficha -- una peticion
 *     de red en el camino critico para decidir un dibujo que nadie mira.
 *
 *   LA BIOGRAFIA se firmaba y se guardaba «hasta que hubiera donde mandarla».
 *     No lo hubo, y el propio pie de la pagina lo decia: «no viaja a ningun
 *     sitio porque no hay donde». Pedir media pagina de texto a alguien para
 *     guardarla en su propio navegador es pedir trabajo a cambio de nada.
 *
 *   COMPARTIR LA FICHA ofrecia ensenar una pagina que, abierta por otro, sale
 *     vacia: no existen los perfiles publicos. Era un boton con un destino
 *     imaginario, que es la clase de detalle que hace dudar de lo demas.
 *
 * AQUI NO SE HACE CRIPTOGRAFIA, y la frontera es dura. `auth.js` es el UNICO
 * dueno de la clave y de la base `preceptoros`: genera, firma y olvida. Este
 * fichero solo PREGUNTA (`window.Identity`) y pinta lo que le contesten. Dos
 * ficheros tocando la misma clave es como se pierde una identidad que, por
 * diseno, no se puede recuperar.
 *
 * Y YA NO HAY BASE PROPIA. `preceptoros-perfil` existia para guardar el busto
 * elegido y el texto de la biografia. Sin esas dos cosas, mantenerla seria un
 * almacen que hay que versionar, migrar y explicar para no guardar nada.
 */
(function () {
  var block = document.getElementById('i18n');
  if (!block) return;
  var T = JSON.parse(block.textContent);
  var zonaId = document.getElementById('perfil-identidad');
  var zonaIn = document.getElementById('perfil-instalacion');

  function p(texto, clase) {
    var n = document.createElement('p');
    if (clase) n.className = clase;
    n.textContent = texto;
    return n;
  }

  /* Un NO_DATA con su causa DENTRO del `title`, que es lo que pide el canon:
     un hueco sin motivo se lee como una averia del sitio, y quien lo ve no
     puede saber si el dato falta, tarda o no existe. La clase es `nodata` --la
     que `base.css` estiliza-- y el motivo va en `title`. */
  function sinDato(motivo) {
    var n = document.createElement('span');
    n.className = 'nodata'; n.title = motivo; n.textContent = 'NO_DATA';
    return n;
  }

  function razon(e) { return (e && e.message) ? e.message : String(e); }

  /* --- 1 · identidad ---------------------------------------------------
   *
   * Sin identidad NO se pinta una ficha de ejemplo con un nombre inventado.
   * Se dice que no hay ninguna y se senala el boton que la crea, que es el
   * mismo en todas las paginas: el de la esquina del cabezal. No se duplica
   * aqui porque dos botones que generan la MISMA clave irreversible son dos
   * sitios donde el aviso de «esto no se recupera» puede quedarse viejo.
   */
  function pintaIdentidad() {
    if (!zonaId) return;
    zonaId.innerHTML = '';
    var quien = window.Identity && window.Identity.quien();
    if (!quien) {
      zonaId.appendChild(p(T.pfSinIdentidad, 'nodata'));
      zonaId.appendChild(p(T.pfComoCrear, 'tenue'));
      return;
    }
    /* `<address>` y no un `<h3>`: el titulo de la seccion ya esta en el HTML, y
       esto son las senas de quien firma la ficha -- literalmente para lo que
       existe el elemento. */
    var nombre = document.createElement('address');
    nombre.className = 'perfil-apodo';
    nombre.textContent = quien;
    zonaId.appendChild(nombre);
    zonaId.appendChild(p(T.pfDerivado, 'tenue'));

    /* LA HUELLA CORTA ES PARA RECONOCER; LA CLAVE ENTERA, PARA VERIFICAR.
       Son dos usos distintos y por eso se pintan los dos. Cuatro grupos de
       cuatro digitos se comparan de un vistazo contra otra pantalla --que es
       lo que hace alguien cuando quiere saber si esta en el aparato correcto--
       y con eso NO se verifica ninguna firma: para eso hace falta la clave
       completa, que esta a un toque en el `<details>` de debajo. Un prefijo
       con puntos suspensivos ofrecido como «tu clave» no verifica nada. */
    var fila = document.createElement('p');
    fila.appendChild(document.createTextNode(T.pfHuella + ' '));
    var corta = document.createElement('code');
    corta.textContent = T.pfCargando;
    fila.appendChild(corta);
    zonaId.appendChild(fila);

    var det = document.createElement('details');
    var sum = document.createElement('summary');
    sum.textContent = T.pfVerClave;
    var entera = document.createElement('code');
    entera.style.wordBreak = 'break-all';
    entera.textContent = T.pfCargando;
    det.appendChild(sum); det.appendChild(entera);
    zonaId.appendChild(det);

    window.Identity.publica().then(function (hex) {
      corta.textContent = hex.slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
      entera.textContent = hex;
    }).catch(function (e) {
      // Las dos a la vez: si la exportacion falla, fallan las dos, y dejar una
      // con «Leyendo la clave…» para siempre es una espera que no termina.
      var causa = T.pfSinClave + ' ' + razon(e);
      corta.textContent = '';
      corta.appendChild(sinDato(causa));
      entera.textContent = '';
      entera.appendChild(sinDato(causa));
    });
  }

  /* --- 2 · la app en este aparato --------------------------------------
   *
   * AQUI NO HAY BOTON DE INSTALAR, y la ausencia es la decision.
   *
   * Instalar no se puede prometer igual en todas partes: Chrome dispara
   * `beforeinstallprompt` y Safari de iOS no lo dispara ni lo va a disparar
   * --alli solo existe «Compartir -> Anadir a pantalla de inicio», a mano--.
   * `pwa.js` ya sabe todo eso y ya lo resuelve en el boton del cabezal. Un
   * SEGUNDO boton aqui seria una segunda copia de esa logica, y el dia que una
   * de las dos se quede vieja la que miente es la que promete instalar en un
   * iPhone y no hace nada.
   *
   * Asi que esta seccion hace lo unico que esta pagina puede hacer con
   * honestidad: DECIR EN QUE ESTADO ESTAS y enlazar a la pagina que ensena el
   * camino. El enlace vive en el HTML y no se construye aqui, para que siga
   * funcionando con el javascript apagado.
   */
  function instalada() {
    // Dos formas porque ningun navegador tiene las dos: la consulta de medios
    // es la del estandar, `navigator.standalone` es la de Safari de iOS.
    return (window.matchMedia &&
            matchMedia('(display-mode: standalone)').matches) ||
           navigator.standalone === true;
  }

  function pintaInstalacion() {
    if (!zonaIn) return;
    var antes = zonaIn.querySelector('.estado-app');
    if (antes) antes.remove();
    var n = p(instalada() ? T.pfInstalada : T.pfNoInstalada,
              instalada() ? 'estado-app' : 'estado-app tenue');
    zonaIn.insertBefore(n, zonaIn.firstChild);
  }

  pintaIdentidad();
  pintaInstalacion();

  /* `auth.js` avisa cuando la clave aparece O desaparece. Las dos direcciones
     importan: al olvidar la clave este mismo evento devuelve la seccion a
     «todavia no hay identidad» sin recargar la pagina. */
  document.addEventListener('preceptor:identity', pintaIdentidad);

  /* El modo de pantalla cambia EN CALIENTE: alguien instala la app desde el
     cabezal y la abre, o sale del modo aplicacion. Escucharlo cuesta una linea
     y evita que la ficha afirme «no esta instalada» en la ventana de la app
     recien instalada. El `if` es porque hay navegadores con `matchMedia` sin
     `addEventListener`. */
  if (window.matchMedia) {
    var mq = matchMedia('(display-mode: standalone)');
    if (mq.addEventListener) mq.addEventListener('change', pintaInstalacion);
  }
})();
