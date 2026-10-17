(function (raiz) {
  'use strict';
  var VIEJO = 120;

  var FUENTES = {
    'pliego-estado': 'thegame-estado (game state bus)', 'pliego-lugares': 'arena record on this device', 'pliego-entrada': 'your entry choice',
    'terminal-cangrejo': 'crab terminal (rules it can touch)', 'radio-estado': 'radio of the state', 'pliego-lapidas': 'reef receipts (this tab)',
    'pliego-skills': 'crab events (this tab)', 'pliego-ficha': 'inspector (the touched piece)', 'pliego-tutorial': 'tutorial schema (measured events)'
  };
  var cambio = {}, cab = null, tit = null, sel = null, fue = null, eda = null, visto = null;

  function cicloValido(c) { return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000; }
  function ciclo() {
    try {
      var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null, c = i && i.ciclo;
      return cicloValido(c) ? c : null;
    } catch (_) { return null; }
  }

  function sello(edad) { return !Number.isSafeInteger(edad) || edad < 0 ? 'NO_DATA' : (edad > VIEJO ? 'STALE' : 'LIVE'); }

  function cabecera(id, titulo, ultimo, ahora) {
    var edad = !cicloValido(ultimo) || !cicloValido(ahora) || ahora < ultimo ? null : ahora - ultimo;
    return { id: id, titulo: titulo || 'NO_DATA (untitled panel)', sello: sello(edad),
             fuente: FUENTES[id] || 'NO_DATA (source not declared)', edad: edad === null ? 'NO_DATA (game cycle unavailable or reset)' : 'Δ ' + edad + ' cycles since last change seen' };
  }
  function abierto(caja) {
    var a = null;
    Array.prototype.forEach.call(caja.children, function (d) { if (d.tagName === 'DETAILS' && !d.hidden) { a = d; } });
    return a;
  }
  function monta() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja || cab) { return !!cab; }
    caja.classList.add('terminal-enmarcado');
    cab = D.createElement('header'); cab.className = 'terminal-cab'; cab.id = 'terminal-cab';
    tit = D.createElement('h3'); tit.className = 'terminal-cab-titulo';
    var meta = D.createElement('p'); meta.className = 'terminal-cab-meta';
    sel = D.createElement('span'); sel.className = 'terminal-cab-sello';
    fue = D.createElement('span'); fue.className = 'terminal-cab-fuente';
    eda = D.createElement('span'); eda.className = 'terminal-cab-edad';
    meta.appendChild(sel); meta.appendChild(fue); meta.appendChild(eda);
    var x = D.createElement('button'); x.type = 'button'; x.className = 'boton-sec terminal-cab-cierra'; x.id = 'terminal-cierra';
    x.textContent = '✕'; x.setAttribute('aria-label', 'Close this panel'); x.dataset.sonido = 'NO_DATA (silent by design)';
    x.addEventListener('click', function () { var a = abierto(caja), b = a && D.getElementById('menu-' + a.id); if (b) { b.click(); } });
    cab.appendChild(tit); cab.appendChild(meta); cab.appendChild(x);
    caja.insertBefore(cab, caja.firstChild);

    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var d = m.target.nodeType === 1 ? m.target.closest('#thegame-terminal > details') : (m.target.parentElement && m.target.parentElement.closest('#thegame-terminal > details'));
        if (d && d.id && m.attributeName !== 'hidden') {
          var c = ciclo();
          if (c !== null) { cambio[d.id] = c; } else { delete cambio[d.id]; }
        }
      });
      pinta();
    }).observe(caja, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });

    pinta();
    return true;
  }
  function pinta() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja || !cab) { return; }
    var a = abierto(caja);
    if (!a) { visto = null; return; }
    if (!a.open) { a.open = true; }
    var ahora = ciclo();
    if (cambio[a.id] === undefined && ahora !== null) { cambio[a.id] = ahora; }
    var s = a.querySelector('summary'), c = cabecera(a.id, s ? s.textContent.trim() : null, cambio[a.id] === undefined ? null : cambio[a.id], ahora);
    visto = c;

    var clave = JSON.stringify(c);
    if (cab.dataset.c === clave) { return; }
    cab.dataset.c = clave; tit.textContent = c.titulo;
    sel.textContent = c.sello; sel.dataset.sello = c.sello; fue.textContent = c.fuente; eda.textContent = c.edad;
    cab.dataset.panel = a.id;
    var T = raiz.AtlasSemantica || raiz.AtlasToon, h = T && T.SELLOS ? T.SELLOS[c.sello] : null;
    sel.style.borderColor = h === null || h === undefined ? '' : 'hsl(' + h + ' 70% 55%)';
  }
  function ficha() { return visto ? JSON.parse(JSON.stringify(visto)) : null; }

  if (raiz.setInterval && raiz.document) { raiz.setInterval(function () { if (monta()) { pinta(); } }, 1000); }
  var AtlasVentana = { cabecera: cabecera, sello: sello, FUENTES: FUENTES, VIEJO: VIEJO, ficha: ficha, pinta: pinta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasVentana; } else { raiz.AtlasVentana = AtlasVentana; }
})(this);
