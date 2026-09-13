/* preceptoros.org · el Perfil, mitad QUE PUEDES HACER Y COMO SE ROMPE.
 *
 * La otra mitad --quien eres y en que aparato estas-- esta en `profile.js`.
 * Aqui viven las tres secciones de abajo, y las tres tienen en comun que
 * contestan a una pregunta que nadie sabia donde preguntar:
 *
 *   LOS TRES NIVELES · que me deja hacer esta clave, hoy.
 *   NOTAS DE VERSION · que ha cambiado en lo que estoy usando.
 *   CAMBIAR DE CLAVE · como se sale, y que se pierde al salir.
 *
 * LOS NIVELES SE DERIVAN, NO SE DECLARAN, Y NO SON UN JUEGO
 * --------------------------------------------------------
 * No hay puntos, ni insignias, ni barras que se llenan. Un nivel aqui es
 * exactamente una frase: LO QUE PUEDES HACER QUE ANTES NO PODIAS. Y sale de
 * dos hechos que se pueden mirar en el aparato, no de un contador que alguien
 * lleve por su cuenta:
 *
 *   ¿hay una clave Ed25519 en `preceptoros`?   -> lo dice `window.Identity`
 *   ¿hay algun par corregido en `preceptoros-bronce`? -> `Bronce.leerTodo()`
 *
 * Gamificar esto seria pedirle a alguien que suba de nivel por subir. El
 * unico motivo honesto para crear una clave es que hay algo que sin ella no
 * se puede firmar, y eso es lo que la tabla dice, en ese orden: primero lo
 * que se gana, despues como se llega.
 *
 * SI EL BRONCE NO SE PUEDE LEER, EL NIVEL NO SE ADIVINA. Un navegador puede
 * tener IndexedDB bloqueado --modo privado estricto, permisos de sitio-- y ahi
 * la respuesta correcta no es «eres firmante»: es NO_DATA con su causa. Dar
 * por vacio lo que no se ha podido mirar es inventar un dato.
 *
 * AQUI NO SE FIRMA NI SE GENERA NADA. `auth.js` es el unico dueno de la clave
 * y de su base; este fichero le pide `olvidar()` y ya esta. La destruccion de
 * una clave irreversible tiene que vivir en el mismo sitio que su creacion, o
 * un dia habra dos ideas distintas de que significa «no tengo identidad».
 */
(function () {
  var block = document.getElementById('i18n');
  if (!block) return;
  var T = JSON.parse(block.textContent);
  var zonaNiv = document.getElementById('perfil-niveles');
  var zonaVer = document.getElementById('perfil-version');
  var zonaCla = document.getElementById('perfil-clave');

  function p(texto, clase) {
    var n = document.createElement('p');
    if (clase) n.className = clase;
    n.textContent = texto;
    return n;
  }

  function sinDato(motivo) {
    var n = document.createElement('span');
    n.className = 'nodata'; n.title = motivo; n.textContent = 'NO_DATA';
    return n;
  }

  function razon(e) { return (e && e.message) ? e.message : String(e); }

  /* --- 3 · los tres niveles ------------------------------------------- */

  // El orden de la tabla ES el orden de los niveles, y el indice del nivel
  // actual indexa esta misma lista. Una segunda lista con los nombres seria
  // la segunda lista que un dia se desordena.
  var NIVELES = [
    ['pfNiv1', 'pfNiv1Que', 'pfNiv1Sube'],
    ['pfNiv2', 'pfNiv2Que', 'pfNiv2Sube'],
    ['pfNiv3', 'pfNiv3Que', null]
  ];

  function pintaNiveles(actual, aviso) {
    if (!zonaNiv) return;
    zonaNiv.innerHTML = '';
    if (aviso) zonaNiv.appendChild(aviso);
    var ol = document.createElement('ol');
    ol.className = 'niveles';
    NIVELES.forEach(function (n, i) {
      var li = document.createElement('li');
      // `aria-current` y no solo un color: quien lee con los oidos tambien
      // tiene que saber en cual esta, y un borde no se escucha.
      if (i === actual) {
        li.className = 'nivel-actual';
        li.setAttribute('aria-current', 'true');
      }
      var t = document.createElement('strong');
      t.textContent = T[n[0]];
      li.appendChild(t);
      li.appendChild(p(T[n[1]]));
      // El camino al siguiente se ensena SOLO en el que estas: escrito en los
      // tres, la tabla se lee como una escalera que hay que subir entera.
      if (i === actual && n[2]) li.appendChild(p(T[n[2]], 'tenue'));
      ol.appendChild(li);
    });
    zonaNiv.appendChild(ol);
  }

  function calculaNivel() {
    if (!zonaNiv) return;
    var quien = window.Identity && window.Identity.quien();
    if (!quien) { pintaNiveles(0, null); return; }
    if (!window.Bronce) {
      // El fichero no esta cargado en esta pagina: no es que no haya pares, es
      // que no hay con que mirarlos. Se dice cual de las dos cosas es.
      pintaNiveles(1, sinDato(T.pfNivSinBronce));
      return;
    }
    window.Bronce.leerTodo().then(function (regs) {
      pintaNiveles(regs && regs.length ? 2 : 1, null);
    }).catch(function (e) {
      pintaNiveles(1, sinDato(T.pfNivSinBronce + ' ' + razon(e)));
    });
  }

  /* --- 4 · notas de version --------------------------------------------
   *
   * HOY ESTO PINTA NO_DATA, Y ES LO CORRECTO. `public/release.json` NO EXISTE
   * (comprobado el 2026-09-13): no hay proceso que lo genere al publicar. Lo
   * que no se puede hacer es rellenar el hueco con la fecha del despliegue, o
   * con la `VERSION` del service worker, o con un «al dia» -- las tres son
   * cifras que parecen medidas y no lo son, que es la averia que este sitio
   * lleva un ano quitandose de encima.
   *
   * EL CONTRATO, para el dia que alguien lo genere:
   *
   *     { "version": "1.4", "fecha": "2026-09-13",
   *       "cambios": ["...", "..."] }
   *
   * Los tres campos se miran por separado y cada uno cae a NO_DATA por su
   * cuenta: un fichero a medias tiene que ensenar lo que si trae. Se pide con
   * `no-cache` por la misma razon por la que `sw.js` no cachea los json del
   * sitio -- una nota de version vieja servida como fresca es exactamente el
   * fallo que las notas de version existen para evitar.
   */
  function pintaVersion(d) {
    if (!zonaVer) return;
    zonaVer.innerHTML = '';
    var linea = document.createElement('p');
    linea.appendChild(document.createTextNode(T.pfVerQue + ' '));
    if (d.version) {
      var v = document.createElement('strong');
      v.textContent = String(d.version);
      linea.appendChild(v);
    } else {
      linea.appendChild(sinDato(T.pfVerSinCampo + ' version'));
    }
    linea.appendChild(document.createTextNode(' · ' + T.pfVerFecha + ' '));
    if (d.fecha) {
      var f = document.createElement('time');
      f.dateTime = String(d.fecha);
      f.textContent = String(d.fecha);
      linea.appendChild(f);
    } else {
      linea.appendChild(sinDato(T.pfVerSinCampo + ' fecha'));
    }
    zonaVer.appendChild(linea);

    if (!Array.isArray(d.cambios) || !d.cambios.length) {
      var sin = p('', 'nodata');
      sin.appendChild(sinDato(T.pfVerSinCampo + ' cambios'));
      zonaVer.appendChild(sin);
      return;
    }
    var ul = document.createElement('ul');
    d.cambios.forEach(function (c) {
      var li = document.createElement('li');
      li.textContent = String(c);
      ul.appendChild(li);
    });
    zonaVer.appendChild(ul);
  }

  function cargarVersion() {
    if (!zonaVer) return;
    fetch('/release.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(pintaVersion).catch(function (e) {
      zonaVer.innerHTML = '';
      var linea = document.createElement('p');
      linea.appendChild(sinDato(T.pfVerSinFichero + ' ' + razon(e)));
      zonaVer.appendChild(linea);
      zonaVer.appendChild(p(T.pfVerCausa, 'tenue'));
    });
  }

  /* --- 5 · cambiar de clave --------------------------------------------
   *
   * ES UNA PUERTA DE SALIDA, NO UN AJUSTE, y la pagina tiene que tratarla
   * como lo que es. La clave privada se genero NO EXTRAIBLE: no hay copia en
   * ningun sitio, ni aqui ni en un servidor, y borrarla no es «cerrar sesion»
   * -- es perder para siempre la autoria de todo lo que ya se firmo con ella.
   * Lo firmado no desaparece; lo que desaparece es la unica prueba de que lo
   * firmaste tu.
   *
   * POR ESO SE PIDE ESCRIBIR UNA PALABRA, y no un segundo «¿seguro?». Un
   * cuadro de confirmacion se acepta con el pulgar antes de leerlo --y en un
   * telefono, literalmente sin querer--; escribir una palabra exige haber
   * mirado la pantalla. Se compara sin distinguir mayusculas ni espacios de
   * los lados: lo que se pide es atencion, no puntuacion.
   *
   * `<dialog>` NATIVO y `showModal()`: el navegador pone la capa superior, el
   * foco atrapado dentro, el cierre con Escape y el fondo inerte. Reimplementar
   * eso a mano es como se acaba teniendo un cuadro «modal» que se puede dejar
   * detras y pulsar a ciegas.
   */
  function pintaClave() {
    if (!zonaCla) return;
    zonaCla.innerHTML = '';
    zonaCla.appendChild(p(T.pfClaveAviso, 'nodata'));
    var quien = window.Identity && window.Identity.quien();
    if (!quien) { zonaCla.appendChild(p(T.pfClaveSinIdentidad, 'tenue')); return; }

    var dlg = document.createElement('dialog');
    dlg.className = 'panel';
    var h = document.createElement('h3');
    h.textContent = T.pfClaveTitulo;
    dlg.appendChild(h);
    dlg.appendChild(p(T.pfClaveLetra1));
    dlg.appendChild(p(T.pfClaveLetra2, 'nodata'));

    var et = document.createElement('label');
    et.textContent = T.pfClaveEscribe.replace('{palabra}', T.pfClavePalabra);
    var caja = document.createElement('input');
    caja.type = 'text'; caja.autocomplete = 'off'; caja.spellcheck = false;
    caja.id = 'clave-confirma';
    et.htmlFor = caja.id;
    dlg.appendChild(et); dlg.appendChild(caja);

    var resultado = p('', 'tenue');
    var hazlo = document.createElement('button');
    hazlo.type = 'button'; hazlo.className = 'boton';
    hazlo.textContent = T.pfClaveConfirma;
    hazlo.disabled = true;
    var deja = document.createElement('button');
    deja.type = 'button'; deja.className = 'leve';
    deja.textContent = T.pfClaveCancela;

    // El boton nace apagado y se enciende con la palabra escrita. Un boton
    // vivo que contesta «eso no es la palabra» invita a probar; uno apagado
    // dice lo que falta sin castigar a nadie por intentarlo.
    caja.addEventListener('input', function () {
      hazlo.disabled = caja.value.trim().toLowerCase() !==
                       String(T.pfClavePalabra).toLowerCase();
    });
    hazlo.addEventListener('click', function () {
      hazlo.disabled = true;
      window.Identity.olvidar().then(function () {
        dlg.close();
        zonaCla.appendChild(p(T.pfClaveHecho, 'nodata'));
      }).catch(function (e) {
        resultado.className = 'nodata';
        resultado.textContent = T.pfClaveFallo + ' ' + razon(e);
        hazlo.disabled = false;
      });
    });
    deja.addEventListener('click', function () { dlg.close(); });

    var fila = document.createElement('div');
    fila.className = 'fila';
    fila.appendChild(hazlo); fila.appendChild(deja);
    dlg.appendChild(fila); dlg.appendChild(resultado);

    var abre = document.createElement('button');
    abre.type = 'button'; abre.className = 'leve';
    abre.textContent = T.pfClaveBoton;
    abre.addEventListener('click', function () {
      caja.value = '';
      hazlo.disabled = true;
      resultado.textContent = ''; resultado.className = 'tenue';
      // `showModal` puede no existir en un navegador viejo. Sin el, la puerta
      // no se abre a medias: se dice que este navegador no puede, que es mejor
      // que un cuadro sin foco donde se borra una clave irrecuperable.
      if (!dlg.showModal) { resultado.textContent = T.pfClaveFallo; return; }
      dlg.showModal();
    });
    var pie = document.createElement('div');
    pie.className = 'fila';
    pie.appendChild(abre);
    zonaCla.appendChild(pie);
    zonaCla.appendChild(dlg);
  }

  function todo() { calculaNivel(); pintaClave(); }
  document.addEventListener('preceptor:identity', todo);
  todo();
  cargarVersion();
})();
