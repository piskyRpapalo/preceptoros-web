/* WEB · guiones leidos de la pantalla que existe. Sin textos de lugar duplicados, red ni almacen. */
(function (raiz) {
  'use strict';
  function nd(c) { return 'NO_DATA (' + c + ')'; }
  function tecnico(n) { return n && n.getAttribute && /(^|\s)thegame-tecnico(\s|$)/.test(n.getAttribute('class') || ''); }
  function texto(n) {
    if (!n || n.hidden || tecnico(n) || /^(PRE|TEXTAREA|SCRIPT|STYLE|CANVAS|SVG|INPUT)$/.test(n.tagName || '') || (n.tagName === 'DETAILS' && !n.open)) { return ''; }
    var hijos = n.childNodes || [], t = hijos.length ? Array.prototype.map.call(hijos, texto).join(' ') : String(n.textContent || '');
    return t.replace(/\s+/g, ' ').trim();
  }
  /* Orden del DOM = orden del guion. Lo tecnico plegado y el JSON crudo no entran en la lectura humana. */
  function guion(nodo) {
    var l = [];
    function visita(n, principal) {
      if (!n || tecnico(n) || (n.hidden && !principal)) { return; }
      var t = String(n.tagName || '').toUpperCase();
      if (/^(PRE|TEXTAREA|SCRIPT|STYLE|CANVAS|SVG|INPUT)$/.test(t)) { return; }
      if (t === 'DETAILS' && !principal && !n.open) { return; }
      if (t === 'DL') {
        var clave = null;
        Array.prototype.forEach.call(n.childNodes || [], function (q) {
          if (q.tagName === 'DT') { clave = texto(q); }
          else if (q.tagName === 'DD' && clave) { l.push([clave, texto(q) || nd('empty screen field')]); clave = null; }
        }); return;
      }
      if (/^(H[1-6]|P|LI|SUMMARY|LABEL|OUTPUT|BUTTON|A)$/.test(t)) {
        var s = texto(n); if (s) { l.push([/^(BUTTON|A)$/.test(t) ? 'Action' : t, s]); } return;
      }
      Array.prototype.forEach.call(n.childNodes || [], function (q) { visita(q, false); });
    }
    visita(nodo, true); return l;
  }
  function ausente(titulo, causa) {
    return { titulo: titulo, lineas: [['State', nd(causa)]], actions: [], next: 'Next: return to the map to load this place, or skip this stop.' };
  }
  function lugar(tipo) {
    var I = raiz.AtlasInspector, r = I && I.registro ? I.registro(tipo) : null;
    if (!r) { return ausente(tipo, 'this place has not been drawn; no measured coordinate or sheet is available'); }
    return { titulo: r.ficha.que, lineas: I.lineas(r.ficha, r.x, r.y), actions: r.ficha.actions || [],
      next: r.ficha.actionCause || 'Next: use the available action, or skip this stop.' };
  }
  function menuIDs() {
    var D = raiz.document;
    return D ? Array.prototype.map.call(D.querySelectorAll('#thegame-menu .thegame-menu-item'), function (b) { return b.dataset.panel; }).filter(Boolean) : [];
  }
  function menu(id) {
    var D = raiz.document, b = D && D.getElementById('menu-' + id);
    if (!b) { return ausente(id, 'this menu option is not mounted'); }
    var titulo = b.getAttribute('aria-label') || texto(b), control = b.getAttribute('aria-controls');
    var panel = D.getElementById(control || id);
    if (!panel && id === 'opinar') { panel = D.querySelector('.pc-dlg'); }
    var l = panel ? guion(panel) : [['State', nd('this destination is not mounted yet; use its real menu action to load it')]];
    l.push(['Where', 'left menu · ' + titulo], ['Sound', b.dataset.sonido || nd('this menu option declares no sound recipe')]);
    return { titulo: titulo, lineas: l, next: 'Next: open this menu option, or skip this stop.', actions: [{ id: 'menu', label: titulo, panel: id, run: function () {
      var actual = D.getElementById('menu-' + id);
      if (!actual || actual.disabled) { return { cause: nd('this menu option is unavailable'), next: 'Next: return to the map and retry, or skip.' }; }
      if (actual.getAttribute('aria-expanded') !== 'true') { actual.click(); }
      else { actual.focus(); }
      return { ok: true, request: id }; /* mide la peticion humana, no asegura una carga remota */
    } }] };
  }
  var S = { guion: guion, menu: menu, lugar: lugar, menuIDs: menuIDs };
  if (typeof module === 'object' && module.exports) { module.exports = S; } else { raiz.AtlasScreenScript = S; }
})(this);
