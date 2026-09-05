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
  /* LA PUERTA VA EN EL CABEZAL, A LA IZQUIERDA DE ENTRAR (2026-09-05). Estaba
     dentro del desplegable de companeros, que es donde la mando la poda del
     2026-09-01 -- «COLA baja al panel lateral, que es donde vive la cola»--.
     Aquello valia cuando el lateral era un rail siempre a la vista; con la
     Capa 3 plegada la firma quedaba a dos gestos y detras de una puerta que no
     habla de firmar. Sube al cabezal, pegada a entrar, porque las dos son lo
     mismo: quien eres y que firmas con ello. */
  function puerta() {
    var H = window.Hub;
    var cab = document.getElementById('cabezal');
    var yo = document.getElementById('identity');
    if (!H || !cab) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cab-boton cola-abrir';
    b.textContent = (H.rotulos && H.rotulos.cabCola) || '';
    b.hidden = true;
    b.addEventListener('click', function () { abre(); });
    function conPerfil() { b.hidden = false; }
    if (window.Identity && window.Identity.quien()) conPerfil();
    document.addEventListener('preceptor:identity', conPerfil);
    /* Se inserta en el PADRE REAL de entrar, no en el cabezal. `#identity` no
       cuelga de `#cabezal` sino de `.cab-fila`, y `insertBefore` exige que la
       referencia sea hija de quien lo llama: pedirselo al cabezal lanzaba
       `NotFoundError`. Y como esto corre dentro de un oyente de `hub:listo`,
       que se despacha sincrono, la excepcion salia atribuida a la linea del
       `dispatchEvent` en `hub.js` -- a doscientas lineas del fallo real. */
    if (yo && yo.parentElement) yo.parentElement.insertBefore(b, yo);
    else cab.appendChild(b);
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

/* --- los dibujos de quien firma -------------------------------------------
 * Las dos rutas SVG de GitHub y LinkedIn, y nada mas. Vinieron de `hub.js` el
 * 2026-09-05, que estaba en 10.034 B de un techo de 10.240 antes de tocarlo y
 * cuyas dos rutas pesan 1,9 KB de las suyas.
 *
 * SOLO EL DIBUJO SE MUDA, no la decision. Que enlace se pone --y si se pone--
 * lo sigue diciendo el catalogo desde `hub.js`: `i.github_url` e
 * `i.linkedin_url`. Al mover el bloque entero, una primera version escribio las
 * dos direcciones a mano aqui; eso convertia un dato del catalogo en una
 * constante de codigo, y el dia que el catalogo cambiara la pagina seguiria
 * enlazando a la de ayer sin que nada fallara.
 *
 * Van como ICONO y no como palabra: «GITHUB LINKEDIN» en mayusculas pesaba como
 * dos botones mas y competia con la navegacion. El nombre sigue en `aria-label`
 * y en `title`, que es donde lo necesita quien no ve el dibujo.
 */
(function () {
  var MARCAS = {
    GitHub: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"'
      + ' aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47'
      + ' 7.59,.4,.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94'
      + '-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82'
      + '.72 1.21 1.87.87 2.33,.66,.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95'
      + ' 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42'
      + ' 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16'
      + ' 1.92.08 2.12,.51,.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95,.29,.25.54.73'
      + '.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15,.46,.55.38A8.01 8.01 0 0 0 16 8'
      + 'c0-4.42-3.58-8-8-8z"/></svg>',
    LinkedIn: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"'
      + ' aria-hidden="true"><path d="M0 1.15C0 .51.53 0 1.18 0h13.64C15.47 0 16 .51'
      + ' 16 1.15v13.7c0 .64-.53 1.15-1.18 1.15H1.18C.53 16 0 15.49 0 14.85V1.15zM4.94'
      + ' 13.39V6.17H2.54v7.22h2.4zM3.74 5.18c.84 0 1.36-.55 1.36-1.24-.02-.7-.52-1.24'
      + '-1.34-1.24-.82 0-1.36.54-1.36 1.24 0 .69.52 1.24 1.32 1.24h.02zm2.53 8.21h2.4'
      + 'V9.36c0-.21.02-.43.08-.58.17-.43.56-.88 1.21-.88.85 0 1.19.65 1.19 1.6v3.89h2.4'
      + 'V9.22c0-2.22-1.18-3.25-2.76-3.25-1.29 0-1.86.71-2.18 1.2v.03h-.02l.02-.03V6.17'
      + 'h-2.4c.03.68 0 7.22 0 7.22h.06z"/></svg>'
  };
  function marca(nombre, href) {
    var a = document.createElement('a');
    a.className = 'cab-marca'; a.href = href;
    a.innerHTML = MARCAS[nombre];
    a.setAttribute('aria-label', nombre);
    a.title = nombre;
    return a;
  }
  window.HubMarca = marca;
})();

/* --- la piel, en la rueda junto a los idiomas -----------------------------
 * Oscuro por DEFECTO, y lo trae el marcado --`data-tema` en el `<html>`-- para
 * que no haya destello claro antes de que corra el javascript. Esto solo
 * permite cambiarlo.
 *
 * Se guarda: un tema que se elige y no se recuerda obliga a elegirlo en cada
 * visita. Si el navegador no deja --modo privado-- se cambia igual y solo se
 * pierde al recargar, que es degradar y no romper. Vive aqui porque es un
 * mando, y porque `hub.js` estaba en su techo. */
(function () {
  var caja = document.getElementById('panel-ajustes');
  var bloque = document.getElementById('i18n');
  if (!caja || !bloque) return;
  var T = JSON.parse(bloque.textContent);
  var raiz = document.documentElement;

  function guardado() {
    try { return localStorage.getItem('preceptor:tema'); } catch (e) { return null; }
  }
  var previo = guardado();
  if (previo) raiz.dataset.tema = previo;

  var rotulo = document.createElement('p');
  rotulo.className = 'panel-rotulo';
  rotulo.textContent = T.piel || '';
  var fila = document.createElement('div');
  fila.className = 'ajuste-piel';

  function pinta() {
    var hoy = raiz.dataset.tema || 'oscuro';
    Array.prototype.forEach.call(fila.children, function (b) {
      if (b.dataset.tema === hoy) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }
  [['oscuro', T.pielOscura], ['claro', T.pielClara]].forEach(function (par) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ajuste-idioma';
    b.textContent = par[1] || par[0];
    b.dataset.tema = par[0];
    b.addEventListener('click', function () {
      raiz.dataset.tema = par[0];
      try { localStorage.setItem('preceptor:tema', par[0]); } catch (e) { }
      pinta();
    });
    fila.appendChild(b);
  });

  /* `hub.js` rellena este panel con los idiomas y lo hace con `innerHTML = ""`.
     Se espera a que termine antes de colgar la piel debajo, o se borraria. */
  function cuelga() {
    if (caja.querySelector('.ajuste-piel')) return;
    caja.appendChild(rotulo);
    caja.appendChild(fila);
    pinta();
  }
  if (window.Hub) cuelga();
  else document.addEventListener('hub:listo', cuelga);
})();
