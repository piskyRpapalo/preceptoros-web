/* preceptoros.org · LA SEÑAL: la cara como sensor, y lo que dice esperando.
 *
 * POR QUE VIVE APARTE. `chat-panel.js` llego a 16.932 B de los 16.384 del
 * tope. Se parte por el asunto, no se recorta el comentario -- los
 * comentarios de esta casa son su documentacion, y quitarlos para que quepa
 * es pagar el tope con lo unico que no se puede volver a deducir del codigo.
 *
 * LA COSTURA. `chat-panel.js` responde a «donde se colocan los mandos y que
 * pasa cuando sale el teclado»: disposicion. Esto responde a otra cosa --«que
 * hace la cara para decir en que estado esta el aparato»--, que es la misma
 * pregunta que contesta `senal.css`, su hoja hermana. Los dos ficheros se
 * tocan a la vez o no se tocan; ese es el criterio para que compartan nombre.
 *
 * ORDEN: se carga DESPUES de `chat-panel.js`. No hay dependencia entre los
 * dos --ninguno llama al otro-- pero los dos escuchan los mismos eventos, y
 * un orden fijo es una discusion menos el dia que alguien anada un tercero.
 */

/* --- Capa 4 · los estados de la cara --------------------------------------
 * Las mismas funciones que el MVP, sobre eventos que esta web YA emitia y que
 * solo movian el sello del pie. La cara es un sensor, no un adorno.
 *
 * PENSAR Y HABLAR SON DOS COSAS --lo firmo la app el 2026-09-04--. Antes la
 * boca se movia mientras el modelo generaba: la cara hablaba sin haber dicho
 * nada, y con un modelo lento eso son minutos en falso. */
(function () {
  /* LA CARA SE BUSCA CUANDO PASA ALGO, NO AL CARGAR. Antes este bloque hacia
     `querySelector` una vez y guardaba el nodo; si en ese instante la esfera no
     estaba --o si alguien la reemplazaba despues-- los eventos seguian
     llegando y la clase iba a parar a un elemento que ya no estaba en la
     pagina. El sintoma era exactamente el de esta manana: `preceptor:pensando`
     se emitia, nadie se quejaba, y la cara no se movia.

     Se midio en el navegador: la clase puesta A MANO funciona --la tira de
     pensar entra, `612.5%`, animacion `pensar, latir`-- y el mismo evento no
     hacia nada. Con la busqueda dentro de `estado()` la cara del momento es la
     que se mueve, exista desde el principio o la ponga otro guion despues. */
  function estado(clase) {
    var cara = document.querySelector('.esfera');
    if (!cara) return;
    cara.classList.remove('piensa', 'habla');
    if (clase) cara.classList.add(clase);
  }
  document.addEventListener('preceptor:pensando', function () { estado('piensa'); });
  document.addEventListener('preceptor:hablando', function () { estado('habla'); });
  // Al cerrar el turno vuelve a reposo. No se relanza ninguna entrada: la
  // apertura es la entrada del producto, no el gesto al que se vuelve.
  document.addEventListener('preceptor:turno', function () { estado(null); });

  /* UN GESTO CADA 25-40 SEGUNDOS, y nunca mientras piensa: alli ya se mueve la
     boca, y dos cosas moviendose a la vez es ruido. El intervalo se sortea en
     cada vuelta -- uno fijo se vuelve un tic, y un tic se nota mas que el gesto.

     Por que existe: entre turno y turno la pantalla se queda quieta, y quieta se
     lee como rota. Esto no acelera nada; solo dice que sigue ahi. Mismos numeros
     que la app, que es donde se midieron.

     Quien pidio quietud no lo recibe: el css le apaga la animacion, pero un
     cambio de fotograma cada medio minuto no es una animacion que el css pueda
     apagar -- hay que no hacerlo. */
  var quieto = window.matchMedia
    ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function gesto() {
    var proxima = 25000 + Math.floor(Math.random() * 15000);
    var cara = document.querySelector('.esfera');
    if (cara && !quieto.matches && !cara.classList.contains('piensa')
        && !cara.classList.contains('habla')) {
      cara.classList.add('gesto');
      setTimeout(function () { cara.classList.remove('gesto'); }, 420);
    }
    setTimeout(gesto, proxima);
  }
  setTimeout(gesto, 12000);
})();

/* --- «Activando modelo» · la nube delante de la cara ----------------------
 * POR QUE EXISTE. El modelo local de este rack genera a 4,63 tok/s: entre que
 * se pulsa enviar y llega la primera palabra pasan segundos, y a veces mas.
 * En ese hueco la pagina esta quieta, y quieta se lee como rota -- quien mira
 * vuelve a pulsar enviar, que es lo peor que puede hacer. La cara ya se
 * enciende (`senal.css`); esto le pone el rotulo, que es lo que convierte «se
 * mueve algo» en «esta trabajando».
 *
 * SOLO MIENTRAS PIENSA. En cuanto llega texto la nube sobra: lo que se lee lo
 * dice mejor que cualquier rotulo. Se cuelga de los mismos tres eventos que
 * mueven la cara, para que no haya dos maquinas de estado que puedan
 * discrepar -- una diciendo que piensa y la otra que ya no.
 *
 * Y EL TEXTO SALE DEL `#i18n` DE LA PORTADA. Este fichero no tiene idioma;
 * escribir «Activando modelo» aqui seria escribirlo en castellano para las
 * ocho lenguas. Sin la clave no hay nube: no se inventa un rotulo. */
(function () {
  var caja = document.querySelector('.presentacion');
  var bloque = document.getElementById('i18n');
  if (!caja || !bloque) return;
  var texto = (JSON.parse(bloque.textContent) || {}).caraPensando;
  if (!texto) return;

  var nube = document.createElement('span');
  nube.className = 'esfera-nube';
  nube.hidden = true;
  nube.textContent = texto;
  caja.appendChild(nube);

  document.addEventListener('preceptor:pensando', function () { nube.hidden = false; });
  document.addEventListener('preceptor:hablando', function () { nube.hidden = true; });
  document.addEventListener('preceptor:turno', function () { nube.hidden = true; });
})();

/* --- La pista del campo dice CON QUIEN se habla ----------------------------
 * Era «Escribe tu primera pregunta...» y se quedaba asi para siempre: la
 * segunda pregunta ya no es la primera, y sobre todo no decia con quien. Con
 * ocho companeros detras del catalogo, el campo es el ultimo sitio donde se
 * lee a quien le vas a hablar -- y es donde se esta mirando al escribir.
 *
 * PLANTILLA CON `{}` Y NO CONCATENACION. «Escribe aqui para hablar con» + el
 * nombre funciona en castellano y se rompe en aleman, donde el verbo se parte
 * y va al final: «Schreib hier, um mit X zu sprechen». Cada lengua coloca el
 * hueco donde su gramatica lo pide. Concatenar habria sido escribir ocho
 * lenguas con la sintaxis de una.
 *
 * Se pinta al elegir companero, que es el unico momento en que el dato existe.
 * Si la clave no esta traducida, el marcado conserva su pista y no pasa nada:
 * degradar, no romper. */
(function () {
  var campo = document.getElementById('pregunta');
  var bloque = document.getElementById('i18n');
  if (!campo || !bloque) return;
  var plantilla = (JSON.parse(bloque.textContent) || {}).campoPista;
  if (!plantilla || plantilla.indexOf('{}') < 0) return;

  document.addEventListener('preceptor:companero', function (e) {
    var quien = e.detail && e.detail.nombre;
    if (quien) campo.placeholder = plantilla.replace('{}', quien);
  });
})();

/* --- UN SOLO DESPERTAR POR SESION (2026-09-05) -----------------------------
 * La otra mitad de lo que arregla la raiz. Se veian dos intros seguidas al
 * abrir la app instalada --el busto de la puerta de idiomas y el telon de
 * aqui-- y son el mismo gesto contado dos veces.
 *
 * Con una marca de sesion, el primero que despierta la pone y el segundo se la
 * encuentra puesta y se retira. Da igual por donde se entre: exactamente un
 * despertar. Y de paso deja de repetirse al volver a Inicio desde una pagina
 * interior, que era la misma molestia sin que nadie la hubiera nombrado.
 *
 * SE QUITA CON `remove()` Y NO APAGANDO LA ANIMACION. Una cortina transparente
 * que sigue en el arbol se come los clics de todo lo que hay debajo -- la
 * propia hoja lo tiene escrito, y por eso su ultimo fotograma lleva
 * `visibility:hidden`. Aqui no hay fotograma que esperar: se va entera.
 *
 * `sessionStorage` y no `localStorage` a proposito: el despertar es la entrada
 * del producto y tiene que verse una vez CADA VEZ que se abre la app, no una
 * vez en la vida. Al cerrar y volver a abrir, vuelve.
 */
(function () {
  var DESPIERTO = 'preceptoros-despierto', LENGUA = 'preceptoros-lengua';
  var telon = document.getElementById('telon');
  try {
    if (telon && sessionStorage.getItem(DESPIERTO)) telon.remove();
    sessionStorage.setItem(DESPIERTO, '1');
  } catch (e) { /* ventana privada: se despierta y ya, que no es un fallo */ }

  /* Y LA PORTADA RECUERDA SU PROPIA LENGUA. Guardarla solo al pulsar en la
     puerta habria dejado la memoria vieja para siempre en cuanto alguien
     cambiara de idioma por la rueda de ajustes, que es donde de verdad se
     cambia. Escribiendola aqui, la memoria es siempre la ultima lengua que se
     estuvo mirando, sin que la rueda tenga que saber que esto existe. */
  var lang = document.documentElement.lang;
  if (/^[a-z]{2}$/.test(lang || '')) {
    try { localStorage.setItem(LENGUA, lang); } catch (e) {}
  }
})();
