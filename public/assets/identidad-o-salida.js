/* preceptoros.org · la salida del callejon «sin identidad».
 *
 * QUE PASA SI ESTO NO EXISTE, que es como estuvo cuatro veces
 * ------------------------------------------------------------
 * Se escribe la correccion entera, se pulsa Firmar, y la pagina contesta «sin
 * identidad». Es verdad --- `auth.js` falla cerrado, con su causa --- y no
 * dice DONDE se consigue una. La persona ya ha hecho el trabajo y se queda
 * mirando un mensaje tecnico sin puerta.
 *
 * Se midio como usuario el 2026-09-14 y se resolvio entonces en `corregir.js`.
 * Y otra vez en `resena.js`. Y otra en `camino-papel.js` al cablear el boton
 * de la Torre. Y una cuarta en `duelo.js`, el mismo dia.
 *
 * POR QUE SE EXTRAE HOY Y NO ANTES, con su cifra. No fue pereza: su dueno
 * natural es `auth.js`, que tiene **130 B libres** bajo el tope de 16 KiB, y
 * un fichero nuevo cuesta una entrada en el shell del worker. Con dos copias
 * la cuenta salia a favor de copiar. Con la cuarta dejo de salir: el bloque
 * empujo `camino-papel.js` 482 B por encima del tope, o sea que la duplicacion
 * paso de ser deuda a ser un bloqueo. Cuando copiar cuesta mas que extraer, se
 * extrae.
 *
 * LO QUE ESTO NO ES. No sabe de identidades: no crea ninguna ni sabe que es
 * una clave. Solo pone el boton que llama a `Identity.crear()` y REINTENTA lo
 * que estaba a medias. El dueno de la identidad sigue siendo `auth.js`, que es
 * quien debe seguir siendolo.
 *
 * SE REUSA `idEntrar`, el rotulo que ya tienen las ocho lenguas para ese mismo
 * gesto. Una clave nueva para decir lo mismo son ocho traducciones y una
 * ocasion mas de que falte una.
 */
(function () {
  /* `caja` es donde colgar el boton, `decir` la funcion que escribe el estado
     --- cada pantalla tiene el suyo en un sitio distinto y no vale suponerlo
     ---, y `reintentar` lo que se vuelve a intentar cuando ya hay identidad.
     Devuelve true si ha puesto la salida, para que quien llama sepa si el
     error queda atendido o hay que decirlo de otra forma. */
  window.ConIdentidad = function (error, caja, decir, reintentar) {
    var msg = String((error && error.message) || error || '');
    if (!/sin identidad/.test(msg)) { return false; }
    if (!window.Identity || !window.Identity.crear) { return false; }
    /* Dos botones seria peor que ninguno: el segundo intento pintaria otro
       encima del primero y la persona no sabria cual pulsar. */
    if (caja.querySelector('.crear-id')) { return true; }

    var H = (window.Hub && window.Hub.textos) || {};
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton crear-id';
    b.textContent = H.idEntrar || 'Entrar';
    b.addEventListener('click', function () {
      b.disabled = true;
      window.Identity.crear().then(function () {
        b.remove();
        decir('');
        reintentar();
      }, function (x) {
        b.disabled = false;
        decir((x && x.message) ? x.message : String(x));
      });
    });
    caja.appendChild(b);
    return true;
  };
})();
