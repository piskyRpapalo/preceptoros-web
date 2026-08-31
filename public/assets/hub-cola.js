/* preceptoros.org · la cola de firma IronClaw. Se pinta cuando se pide.
 *
 * Vive aparte de `hub.js` por dos motivos, y el segundo pesa mas:
 *  - `hub.js` se paso de los 10.240 B al entrar el cabezal y el panel.
 *  - La cola es lo menos visitado de la portada. No tiene por que viajar en
 *    la primera pintura de quien solo viene a hablar con el Instalador.
 */
(function () {
  var raiz = document.getElementById('hub');
  if (!raiz) return;
  var abierta = false;

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }

  function pinta() {
    var H = window.Hub;
    raiz.innerHTML = '';
    if (!H) {
      raiz.appendChild(el('p', 'nodata', 'NO_DATA · el catálogo no llegó'));
      return;
    }
    var L = H.textos, c = (H.datos || {}).cola || {};
    var s = el('section', 'panel');
    s.appendChild(el('h2', null, L.colaTitulo));
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
    if (!abierta) { raiz.innerHTML = ''; return; }
    pinta();
    raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
