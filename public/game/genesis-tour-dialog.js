/* WEB · una parada por popup; retrato Fourier heredado, guion compartido, skip permanente. */
(function (raiz) {
  'use strict';
  var dialogo = null, cuerpo, titulo, objetivo, controles, estado, anterior, clave = null, pausado = false;
  function el(tag, cls, t) { var n = raiz.document.createElement(tag); if (cls) { n.className = cls; } if (t) { n.textContent = t; } return n; }
  function cierra() {
    if (!dialogo || !dialogo.open) { return; }
    dialogo.close(); clave = null;
    if (anterior && anterior.isConnected && anterior.focus) { anterior.focus(); }
  }
  function monta() {
    if (dialogo) { return; }
    var D = raiz.document;
    dialogo = el('dialog', 'genesis-tour'); dialogo.id = 'genesis-tour'; dialogo.setAttribute('aria-labelledby', 'genesis-tour-title');
    titulo = el('h3'); titulo.id = 'genesis-tour-title'; dialogo.appendChild(titulo);
    objetivo = el('p', 'genesis-tour-goal'); dialogo.appendChild(objetivo);
    var G = raiz.AtlasDialogo;
    if (G && G.retrato) { var guia = G.retrato({}, true); dialogo.appendChild(guia.nodo); }
    cuerpo = el('dl'); dialogo.appendChild(cuerpo);
    estado = el('p'); estado.setAttribute('role', 'status'); dialogo.appendChild(estado);
    controles = el('div', 'genesis-tour-action'); dialogo.appendChild(controles);
    var paso = el('button', 'boton-sec', 'Skip this stop'); paso.type = 'button'; paso.id = 'tour-skip-stop';
    paso.addEventListener('click', function () { cierra(); raiz.AtlasTutorial.saltaPaso(); });
    var salir = el('button', 'boton-sec', 'Skip tour'); salir.type = 'button'; salir.id = 'tour-skip';
    salir.addEventListener('click', function () { raiz.AtlasTutorial.salta(); });
    dialogo.addEventListener('cancel', function (e) { e.preventDefault(); raiz.AtlasTutorial.salta(); });
    dialogo.appendChild(paso); dialogo.appendChild(salir); D.body.appendChild(dialogo);
  }
  function pinta(p, ficha) {
    if (!p || !p.tour) { cierra(); return; }
    if (pausado) { return; }
    var otro = raiz.document.querySelector('dialog[open],.atlas-dlg-capa');
    if (otro && otro !== dialogo) { return; }
    monta(); var m = p.lee(), a = m.actions && m.actions[0], k = JSON.stringify({ id: p.id, l: ficha.lineas, a: a && [a.id, a.label, a.disabled, a.preview] });
    if (k !== clave) {
      var nuevo = !dialogo.open || dialogo.dataset.step !== p.id;
      var foco = controles.contains(raiz.document.activeElement) && raiz.document.activeElement.dataset.action;
      clave = k; dialogo.dataset.step = p.id; titulo.textContent = m.titulo;
      objetivo.textContent = raiz.AtlasTutorial.objetivo(); cuerpo.textContent = ''; if (nuevo) { estado.textContent = ''; }
      ficha.lineas.forEach(function (l) { cuerpo.appendChild(el('dt', null, l[0])); cuerpo.appendChild(el('dd', null, l[1])); });
      controles.textContent = '';
      if (a && a.preview) { controles.appendChild(el('p', null, a.preview)); }
      if (!a || a.disabled) { controles.appendChild(el('p', null, (a && a.reason || 'NO_DATA (no available action)') + ' ' + m.next)); }
      else {
        var b = el(a.href ? 'a' : 'button', 'boton', a.label); b.dataset.action = a.id;
        if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener noreferrer';
          b.addEventListener('click', function () { raiz.AtlasTutorial.demuestra(p.id, { ok: true, request: 'external link' }); cierra(); }); }
        else { b.type = 'button'; b.addEventListener('click', function () {
          var r; try { r = raiz.AtlasTour.actua(m); } catch (e) { r = { cause: 'NO_DATA (the place action could not complete)' }; }
          if (r && !r.cause && (r.ok || r.receipt || r.lines)) {
            if (r.receipt || r.lines) { raiz.AtlasInspector.muestraResultado(p.id.replace('tour-place-', ''), r); pausado = true; }
            raiz.AtlasTutorial.demuestra(p.id, r); cierra();
          }
          else { estado.textContent = (r && r.cause || 'NO_DATA (the action gave no measured result)') + ' ' + (r && r.next || m.next); }
        }); }
        controles.appendChild(b);
      }
      if (nuevo) { var activo = raiz.document.activeElement; anterior = activo && (activo.id === 'menu-pliego-tutorial' || activo.id === 'menu-start') ? activo : (raiz.document.getElementById('menu-pliego-tutorial') || raiz.document.getElementById('menu-start') || activo); if (dialogo.open) { dialogo.close(); } dialogo.showModal(); (controles.querySelector('button,a') || dialogo.querySelector('#tour-skip-stop')).focus(); }
      else if (foco) { (controles.querySelector('[data-action]') || dialogo.querySelector('#tour-skip-stop')).focus(); }
    }
  }
  raiz.AtlasTourDialog = { pinta: pinta, cierra: cierra, reanuda: function () { pausado = false; } };
})(this);
