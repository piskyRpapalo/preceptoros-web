/* preceptoros.org · la cola de firma IronClaw. Se pinta cuando se pide.
 *
 * Vive aparte de `hub.js` por dos motivos, y el segundo pesa mas:
 *  - `hub.js` se paso de los 10.240 B al entrar el cabezal y el panel.
 *  - La cola es lo menos visitado de la portada. No tiene por que viajar en
 *    la primera pintura de quien solo viene a hablar con el Instalador.
 */
(function () {
  var ancla = document.getElementById('hub');
  if (!ancla) return;
  /* La cola tambien DESLIZA. Antes se pintaba dentro de la pagina y empujaba
     el chat hacia abajo: el chat es lo que se vino a usar y no puede irse de
     la pantalla porque alguien mire la cola. Se crea aqui, con las mismas
     clases que el panel de Modelos, para no gastar marcado en tres portadas
     que van justas de bytes. */
  var raiz = document.createElement('aside');
  raiz.id = 'panel-cola';
  raiz.className = 'panel-desliza cerrado';
  document.body.appendChild(raiz);
  var abierta = false;

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }

  /* --- la puerta, y quien puede verla ------------------------------------
     La cola es lo que espera una firma, y firmar exige una identidad: a quien
     llega por primera vez no le dice nada y le ocupa sitio en el lateral. Asi
     que el boton nace OCULTO y aparece cuando `auth.js` avisa de que hay
     perfil -- ese evento se emite tanto al crear la identidad como al
     encontrarla ya guardada, asi que cubre los dos casos.

     Se mira ADEMAS el estado actual: el catalogo llega por
     `requestIdleCallback` y `auth.js` puede haber avisado antes de que este
     boton existiera. Con solo el evento, la mitad de las cargas dejaba la
     cola escondida a quien si tenia perfil. */
  function puerta() {
    var H = window.Hub;
    if (!H || !H.panel) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cab-boton cola-abrir';
    b.textContent = (H.rotulos && H.rotulos.cabCola) || '';
    b.hidden = true;
    b.addEventListener('click', function () { abre(); });
    function conPerfil() { b.hidden = false; }
    if (window.Identity && window.Identity.quien()) conPerfil();
    document.addEventListener('preceptor:identity', conPerfil);
    H.panel.appendChild(b);
  }
  if (window.Hub) puerta();
  else document.addEventListener('hub:listo', puerta);

  function pinta() {
    var H = window.Hub;
    raiz.innerHTML = '';
    if (!H) {
      raiz.appendChild(el('p', 'nodata', 'NO_DATA · el catálogo no llegó'));
      return;
    }
    var L = H.textos, c = (H.datos || {}).cola || {};
    var s = el('section');
    s.appendChild(el('h2', 'panel-titulo', L.colaTitulo));
    var x = el('button', 'panel-cerrar', '\u00d7');
    x.type = 'button';
    x.setAttribute('aria-label', L.chatCerrarPanel || 'Cerrar');
    x.addEventListener('click', function () {
      abierta = false; raiz.classList.add('cerrado');
    });
    s.appendChild(x);
    s.appendChild(el('p', 'panel-rotulo', (c.estado || '') + ' · ' + (c.causa || '')));
    var props = c.propuestas || [];
    if (!props.length) s.appendChild(el('p', 'cola-nota', L.colaVacia));
    props.forEach(function (p) {
      var caja = el('div', 'cola-pieza');
      caja.appendChild(el('span', 'cola-origen', p.origen + ' → ' + p.destino));
      caja.appendChild(el('p', 'cola-resumen', p.resumen));
      caja.appendChild(el('p', 'cola-cuerpo', p.cuerpo));
      // UNA firma por pieza. El protocolo IronClaw prohibe el lote: si una
      // alucinacion pasa desapercibida dentro de un lote, contamina la
      // reputacion externa, y eso no tiene rollback.
      var b = el('button', 'boton', L.colaFirmar);
      b.type = 'button';
      b.addEventListener('click', function () {
        caja.replaceChild(el('p', 'cola-nota', L.colaFirmado), b);
      });
      caja.appendChild(b);
      s.appendChild(caja);
    });
    s.appendChild(el('p', 'cola-nota', c.protocolo || L.colaProtocolo));
    raiz.appendChild(s);
  }

  document.addEventListener('hub:cola', function () {
    abierta = !abierta;
    raiz.classList.toggle('cerrado', !abierta);
    if (!abierta) return;
    pinta();
  });
})();
