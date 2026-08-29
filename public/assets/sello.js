/* preceptoros.org · el sello, y sus tres estados.
   La cara es lo unico que se mueve en el sitio, y se mueve cuando pasa algo de
   verdad: piensa cuando el motor esta generando y no ha soltado un token, y
   habla mientras los suelta. Cuando el turno acaba, vuelve a estar quieta.
   Un sello que se agita solo seria decoracion; este es un sensor. */
(function () {
  var cara = document.querySelector('.cabeza');
  if (!cara) return;
  function estado(clase) {
    cara.classList.remove('pensando', 'hablando', 'reposo');
    if (clase) cara.classList.add(clase);
  }
  document.addEventListener('preceptor:pensando', function () { estado('pensando'); });
  document.addEventListener('preceptor:hablando', function () { estado('hablando'); });
  // Al cerrar el turno se queda en reposo y NO se relanza el despertar: la
  // piedra ya se rompio, y volver a romperla cada respuesta seria mentir sobre
  // lo que acaba de pasar.
  document.addEventListener('preceptor:turno', function () { estado('reposo'); });
})();
