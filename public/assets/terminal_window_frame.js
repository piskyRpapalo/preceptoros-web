/* preceptoros.org · theGame · LA VENTANA DE LA TERMINAL, COMO UNA CONVERSACION CON UNA AI (PR-1, FIRMO 2026-10-12).

   El cajon de paneles se lee como UNA entidad con marco cerrado, no como bloques sueltos apilados: un CABECERO con
   el titulo del panel abierto, su SELLO, la FUENTE del dato y su EDAD EN CICLOS (sin reloj de pared), y un boton de
   cierre de 44 px. Cerrar es trivial: este boton, la segunda pulsacion en el menu o Escape (eso ya lo hace el shell).

   Plug&play: no toca el shell. OBSERVA el cajon (#thegame-terminal) que ya existe: que panel esta a la vista y cuando
   cambio su contenido. Lo que no sabe, lo dice: un panel sin fuente declarada es «NO_DATA (source not declared)».
   - Edad: ciclos desde el ultimo cambio VISTO del contenido (MutationObserver) o, si no cambio, desde que el marco lo vio
     por primera vez (declarado en el rotulo: «since last change seen»). Contados en el ciclo del juego.
   - Sello: LIVE si cambio hace <= VIEJO ciclos; STALE si mas; NO_DATA si aun no hay ciclo medido.
   El color del sello sale de la TABLA_SEMANTICA de crab_render_hd.js (unica fuente). Sin red, sin azar. */
(function (raiz) {
  'use strict';
  var VIEJO = 120;
  /* La fuente de cada panel: de donde sale lo que muestra. Lo que no esta aqui se declara NO_DATA. */
  var FUENTES = {
    'pliego-estado': 'game state (engine snapshot)', 'pliego-lugares': 'arena record on this device', 'pliego-entrada': 'your entry choice',
    'terminal-cangrejo': 'crab terminal (rules it can touch)', 'radio-estado': 'radio of the state', 'pliego-lapidas': 'reef receipts (this tab)',
    'pliego-skills': 'crab events (this tab)', 'pliego-ficha': 'inspector (the touched piece)', 'pliego-tutorial': 'tutorial schema (measured events)'
  };
  var cambio = {}, cab = null, tit = null, sel = null, fue = null, eda = null, visto = null;

  function ciclo() { var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null; return i && typeof i.ciclo === 'number' ? i.ciclo : null; }
  /* Puro: el sello de un panel por su edad. */
  function sello(edad) { return edad === null ? 'NO_DATA' : (edad > VIEJO ? 'STALE' : 'LIVE'); }
  /* Puro: la cabecera de un panel (lo que se pinta y lo que lee el lab). */
  function cabecera(id, titulo, ultimo, ahora) {
    var edad = ultimo === null || ultimo === undefined || ahora === null ? null : Math.max(0, ahora - ultimo);
    return { id: id, titulo: titulo || 'NO_DATA (untitled panel)', sello: sello(edad),
             fuente: FUENTES[id] || 'NO_DATA (source not declared)', edad: edad === null ? 'NO_DATA (no cycle measured yet)' : 'Δ ' + edad + ' cycles since last change seen' };
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
    /* el contenido de cada panel cambia -> su edad vuelve a 0 (en ciclos) */
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var d = m.target.nodeType === 1 ? m.target.closest('#thegame-terminal > details') : (m.target.parentElement && m.target.parentElement.closest('#thegame-terminal > details'));
        if (d && d.id && m.attributeName !== 'hidden') { cambio[d.id] = ciclo(); }
      });
      pinta();
    }).observe(caja, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
    /* (los cambios del propio cabecero no cuentan como edad: no estan dentro de ningun panel) */
    pinta();
    return true;
  }
  function pinta() {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja || !cab) { return; }
    var a = abierto(caja);
    if (!a) { visto = null; return; }
    if (!a.open) { a.open = true; }   // el marco manda: el panel abierto se ve entero
    if (cambio[a.id] === undefined && ciclo() !== null) { cambio[a.id] = ciclo(); }   // primera vez visto: la edad cuenta desde aqui
    var s = a.querySelector('summary'), c = cabecera(a.id, s ? s.textContent.trim() : null, cambio[a.id] === undefined ? null : cambio[a.id], ciclo());
    visto = c;
    /* Solo se escribe lo que CAMBIA: el cabecero vive dentro del cajon que observa (sin esto, un bucle de mutaciones). */
    var clave = JSON.stringify(c);
    if (cab.dataset.c === clave) { return; }
    cab.dataset.c = clave; tit.textContent = c.titulo;
    sel.textContent = c.sello; sel.dataset.sello = c.sello; fue.textContent = c.fuente; eda.textContent = c.edad;
    cab.dataset.panel = a.id;
    var T = raiz.AtlasToon, h = T && T.SELLOS ? T.SELLOS[c.sello] : null;
    sel.style.borderColor = h === null || h === undefined ? '' : 'hsl(' + h + ' 70% 55%)';
  }
  function ficha() { return visto ? JSON.parse(JSON.stringify(visto)) : null; }

  /* El cajon nace con la capa: se intenta montar hasta que exista, y luego se refresca la edad una vez por segundo. */
  if (raiz.setInterval && raiz.document) { raiz.setInterval(function () { if (monta()) { pinta(); } }, 1000); }
  var AtlasVentana = { cabecera: cabecera, sello: sello, FUENTES: FUENTES, VIEJO: VIEJO, ficha: ficha, pinta: pinta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasVentana; } else { raiz.AtlasVentana = AtlasVentana; }
})(this);
