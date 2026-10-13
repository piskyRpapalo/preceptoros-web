/* WEB · 6B-1: fichas de lugares y acciones existentes. Leer nunca ejecuta; el segundo gesto actua.
   Sin almacen, red, firma ni reloj. Los datos vienen de la capa que ya los mide. */
(function (raiz) {
  'use strict';
  function nd(c) { return 'NO_DATA (' + c + ')'; }
  function punto(p) { return p && Number.isFinite(p.x) && Number.isFinite(p.y); }
  function ficha(tipo, base, d) {
    d = d || {}; var f = Object.assign({}, base || {}), a = [];
    if (!f.sonido) { f.sonido = nd('no tap sound for this place has been measured'); }
    if (tipo === 'boya') { a.push({ id: 'radio', label: 'Open state radio', panel: 'radio-estado' }); }
    else if (tipo === 'observatorio') {
      if (punto(d.centro) && Number.isFinite(d.coste)) {
        a.push({ id: 'look', label: 'Look', target: { x: d.centro.x, y: d.centro.y },
          preview: 'Dry run: look at world (' + Math.round(d.centro.x) + ', ' + Math.round(d.centro.y) + '); costs ' + d.coste + ' cycles. The view then ages back into fog.',
          disabled: !!d.mirando, reason: d.mirando ? 'A look is already in progress; wait for its measured cycles.' : null });
      } else { f.actionCause = nd('no measured target coordinate or cycle cost'); }
    } else if (tipo === 'lapidas') { a.push({ id: 'receipts', label: 'Read tombstone receipts', panel: 'pliego-lapidas' }); }
    else if (tipo === 'cristal') { a.push({ id: 'measurements', label: 'Read frame measurements', preview: d.medidas ? d.medidas + ' measured receipts' : nd('no frame measurement receipt yet') }); }
    else if (tipo === 'coral') {
      if (typeof d.enlace === 'string' && /^https:\/\/github\.com\/piskyRpapalo\/lab\//.test(d.enlace)) { a.push({ id: 'lab', label: 'Open lab evidence', href: d.enlace }); }
      else { f.actionCause = nd('this coral has no published lab action'); }
    } else { f.actionCause = nd('no action has been declared for this place'); }
    f.kind = tipo; f.actions = a;
    return f;
  }
  function abrePanel(id) {
    var D = raiz.document, b = D && D.getElementById('menu-' + id), p = D && D.getElementById(id);
    if (!b || !p) { return { cause: nd('the destination panel is not loaded') }; }
    if (p.hidden) { b.click(); }
    return { ok: true };
  }
  function ejecuta(a) {
    if (!a || a.disabled) { return { cause: nd(a && a.reason || 'the action is unavailable') }; }
    if (a.id === 'radio' || a.id === 'receipts') { return abrePanel(a.panel); }
    if (a.id === 'look') {
      var A = raiz.AtlasArrecife;
      if (!A || !A.mira || !punto(a.target)) { return { cause: nd('observatory or target coordinate not loaded') }; }
      var r = A.mira(function (k) { return raiz.AtlasArenaUI && raiz.AtlasArenaUI.texto ? raiz.AtlasArenaUI.texto(k) : k; }, a.target);
      return r && typeof r === 'object' ? { ok: true, receipt: r } : { cause: nd(r === 'mirando' ? 'a look is already in progress' : 'no game cycle or observatory is loaded') };
    }
    if (a.id === 'measurements') {
      var C = raiz.AtlasCristal, ev = C && C.eventos ? C.eventos() : null;
      if (!ev || !ev.length) { return { cause: nd('no frame measurement receipt yet') }; }
      return { lines: ev.map(function (e) { return ['Cycle ' + e.ciclo, e.p50 + ' fps · p10 ' + e.p10 + ' · ' + e.cuadros + ' frames · quality ' + e.calidad + ' · canvas ' + e.lienzo]; }) };
    }
    if (a.id === 'fight' && typeof a.run === 'function') { return a.run(); }
    return { cause: nd('no executable action has been declared') };
  }
  /* Mismo modelo para Inspector y futuro tour; aqui solo se presentan los controles. */
  function monta(caja, f, informa) {
    var D = raiz.document, z = caja.querySelector('.place-actions');
    if (!z) { z = D.createElement('div'); z.className = 'place-actions'; caja.appendChild(z); }
    z.textContent = '';
    if (!(f.actions || []).length) { var n = D.createElement('p'); n.className = 'no-data'; n.textContent = f.actionCause || nd('this piece has no action'); z.appendChild(n); }
    (f.actions || []).forEach(function (a) {
      if (a.preview) { var p = D.createElement('p'); p.textContent = a.preview; z.appendChild(p); }
      if (a.reason) { var r = D.createElement('p'); r.textContent = a.reason; z.appendChild(r); }
      var b = D.createElement(a.href ? 'a' : 'button'); b.className = 'boton-sec'; b.textContent = a.label; b.dataset.action = a.id;
      if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener noreferrer'; }
      else { b.type = 'button'; b.disabled = !!a.disabled; b.addEventListener('click', function () { var resultado = ejecuta(a); if (informa) { informa(resultado); } }); }
      z.appendChild(b);
    });
  }
  var C = { ficha: ficha, ejecuta: ejecuta, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = C; } else { raiz.AtlasPlaceCards = C; }
})(this);
