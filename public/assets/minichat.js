/* preceptoros.org · EL MINI-CHAT DE LA PLAZA. Terminal flotante, humano.

   ESTO NO HABLA CON UNA IA, Y POR ESO NO LLEVA FEEDBACK AL RACK. La regla de la
   casa es que todo chat de IA recoge correccion firmada; este es de personas,
   asi que no hay respuesta de modelo que corregir. El dia que se meta una IA
   dentro, se enchufa `corregir.js` como en los demas -- y se dice aqui.

   SE MINIMIZA, NO SE CIERRA. Cerrar pierde el hilo, y el hilo es lo unico que
   tiene: no hay servidor detras todavia. Se guarda en `sessionStorage` --de la
   pestaña, no del aparato-- porque una conversacion de plaza no es un documento
   que alguien quiera encontrarse tres dias despues.

   EL COLOR DEL NOMBRE SALE DE LA FIRMA, no de un azar. El mismo apodo da el
   mismo tono siempre, en cualquier maquina, porque se deriva de sus letras: asi
   se reconoce a alguien de un vistazo sin necesidad de avatar ni de cuenta. Es
   la misma idea que la identidad derivada del sha256 -- el aspecto sale del
   dato, no de un registro.

   Y LA ESCRITURA ESTA CERRADA, que es lo que hay hoy: el Agora devuelve 405 en
   `POST /api/v1/threads`. Lo que se escriba aqui se queda en esta pestaña y se
   dice con esas palabras. Fingir que se publica seria la mentira que este
   proyecto existe para no contar. */
(function () {
  var raiz = document.getElementById('mini-chat');
  if (!raiz) return;
  var LLAVE = 'preceptoros:plaza';

  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return (JSON.parse(b.textContent)[clave]) || respaldo; }
    catch (e) { return respaldo; }
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }
  /* Tono estable a partir del nombre: suma de letras sobre la rueda de color.
     Saturacion y luminosidad fijas para que ningun nombre salga ilegible sobre
     el fondo oscuro del terminal -- el azar decide el tono, no el contraste. */
  function color(nombre) {
    var s = 0;
    for (var i = 0; i < nombre.length; i++) { s = (s * 31 + nombre.charCodeAt(i)) % 360; }
    return 'hsl(' + s + ' 70% 72%)';
  }

  function leer() {
    try { return JSON.parse(sessionStorage.getItem(LLAVE) || '[]'); }
    catch (e) { return []; }
  }
  function guardar(lineas) {
    try { sessionStorage.setItem(LLAVE, JSON.stringify(lineas.slice(-40))); }
    catch (e) { /* privado o lleno: el hilo vive en pantalla y ya */ }
  }

  var caja = el('div', 'mini-chat');
  caja.dataset.min = '0';
  var cab = el('div', 'mini-chat-cab');
  var h = el('h3', null, T('mcTitulo', 'Plaza'));
  var min = el('button', 'cierre-x', '–');
  min.type = 'button';
  min.setAttribute('aria-label', T('mcMinimizar', 'Minimizar'));
  cab.appendChild(h); cab.appendChild(min);
  var cuerpo = el('div', 'mini-chat-cuerpo');
  cuerpo.setAttribute('aria-live', 'polite');
  var pie = el('div', 'mini-chat-pie');
  var campo = document.createElement('input');
  campo.type = 'text';
  campo.placeholder = T('mcEscribe', 'Escribe…');
  campo.setAttribute('aria-label', T('mcEscribe', 'Escribe…'));
  var manda = el('button', 'btn-secundario', T('mcEnviar', 'Enviar'));
  manda.type = 'button';
  pie.appendChild(campo); pie.appendChild(manda);
  caja.appendChild(cab); caja.appendChild(cuerpo); caja.appendChild(pie);
  raiz.appendChild(caja);

  function pinta(linea) {
    var p = el('p', 'mini-linea');
    var b = el('b', null, linea.quien + ' ');
    b.style.color = color(linea.quien);
    p.appendChild(b);
    p.appendChild(document.createTextNode(linea.texto));
    cuerpo.appendChild(p);
    cuerpo.scrollTop = cuerpo.scrollHeight;
  }

  var lineas = leer();
  if (!lineas.length) {
    cuerpo.appendChild(el('p', 'mini-linea', T('mcCerrado',
      'Escritura cerrada: el Ágora todavía no modera. Lo que escribas se queda en esta pestaña.')));
  }
  lineas.forEach(pinta);

  function mandar() {
    var t = campo.value.trim();
    if (!t) return;
    var quien = (window.Identity && window.Identity.quien()) || T('mcAnon', 'anónimo');
    var linea = { quien: quien, texto: t };
    lineas.push(linea); guardar(lineas); pinta(linea);
    campo.value = '';
  }
  manda.addEventListener('click', mandar);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); mandar(); }
  });
  min.addEventListener('click', function () {
    var m = caja.dataset.min === '1';
    caja.dataset.min = m ? '0' : '1';
    min.textContent = m ? '–' : '+';
    min.setAttribute('aria-label', m ? T('mcMinimizar', 'Minimizar')
                                     : T('mcAbrir', 'Abrir'));
  });
})();
