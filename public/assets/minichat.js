/* preceptoros.org · LA PLAZA. Chat entre personas, y no firma nada.

   QUE ES, Y QUE NO ES · corregido por el Soberano el 2026-09-14, el mismo dia
   en que se habia hecho lo contrario. Por la mañana la Plaza firmaba cada
   linea con Ed25519 y la mandaba al almacen que alimenta al laboratorio. Esta
   mal, y el motivo es de doctrina y no de codigo: **esto no es una fuente de
   datos**. Es donde la gente que esta ahora en la web habla entre si y con el
   Soberano. Firmar una conversacion de plaza la convierte en material de
   entrenamiento sin que nadie lo haya pedido, y encima le pide identidad a
   quien solo queria saludar.

   Lo que SI firma sigue firmando: las correcciones, las valoraciones y las
   reescrituras, que nacen de hablar con un modelo y tienen una respuesta que
   juzgar. Aqui no hay modelo ni respuesta: hay personas.

   Y NO SE FINGE QUE FUNCIONA. No hay servidor de chat en tiempo real --el
   Agora lee, pero no tiene canal de mensajes-- asi que lo que se escribe se
   queda en esta pantalla y se dice con esas palabras, arriba y antes de
   escribir. Un chat que traga mensajes y no los manda a ningun sitio, sin
   decirlo, es la forma mas barata de perder la confianza de un tester.

   SE MINIMIZA, NO SE CIERRA. Cerrar pierde el hilo, y el hilo es lo unico que
   tiene. Vive en la pestaña y desaparece con ella, que es lo que corresponde a
   una conversacion que no se guarda en ningun sitio: `sessionStorage` dice la
   verdad sobre su duracion mejor que `localStorage`.

   EL COLOR DEL NOMBRE SALE DE SUS LETRAS, no de un azar. El mismo apodo da el
   mismo tono siempre, en cualquier maquina: asi se reconoce a alguien de un
   vistazo sin avatar y sin cuenta. */
(function () {
  var raiz = document.getElementById('mini-chat');
  if (!raiz) return;
  // De la pestaña, no del aparato. Una conversacion que no se guarda en
  // ningun sitio no debe sobrevivir al cierre: seria prometer un archivo.
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

  /* La hora, corta y local. Va EN PANTALLA porque una linea firmada sin momento
     no se puede situar, y el `cuando` que viaja al rack es el ISO completo: el
     de aqui es para leer, el de alli para verificar. */
  function hora(iso) {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  function pinta(linea) {
    var p = el('p', 'mini-linea');
    var b = el('b', null, linea.quien + ' ');
    b.style.color = color(linea.quien);
    p.appendChild(b);
    p.appendChild(document.createTextNode(linea.texto));
    if (linea.cuando) {
      p.appendChild(el('span', 'mini-hora', ' ' + hora(linea.cuando)));
    }
    cuerpo.appendChild(p);
    cuerpo.scrollTop = cuerpo.scrollHeight;
  }

  var lineas = leer();
  if (!lineas.length) {
    cuerpo.appendChild(el('p', 'mini-linea', T('mcCerrado',
      'Terminal local. Lo que escribas se firma en tu aparato y no sale de él hasta que tú lo envíes.')));
  }
  lineas.forEach(pinta);

  function mandar() {
    var texto = campo.value.trim();
    if (!texto) return;
    /* El apodo si existe se usa, y si no se dice «anonimo». NO se pide
       identidad: crear una clave para saludar es pedirle un tramite a quien
       solo pasaba por aqui. */
    var quien = (window.Identity && window.Identity.quien()) ||
                T('mcAnon', 'anónimo');
    var linea = { quien: quien, texto: texto, cuando: new Date().toISOString() };
    lineas.push(linea); guardar(lineas); pinta(linea);
    campo.value = '';
    campo.focus();
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
