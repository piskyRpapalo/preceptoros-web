(function () {
  'use strict';
  var E = window.AtlasEscena, TX = null, dpr = window.devicePixelRatio || 1;

  function T(k) { return (TX && TX[k]) || (window.AtlasJuego && window.AtlasJuego.texto(k)) || ''; }
  function textos() {
    var l = (window.AtlasLengua && window.AtlasLengua.actual) || 'en';
    return fetch('/atlas-arena-' + l + '.json').then(function (r) {
      if (!r.ok) { throw new Error('atlas-arena-' + l + '.json ' + r.status); }
      return r.json();
    }).then(function (d) { TX = d.ui; });
  }
  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto, clase) { var b = el('button', clase || 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function css(v, x) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || x; }
  function colores() {
    return { dano: css('--accent-copper-claro', '#e0a060'), fallo: css('--text-muted', '#9aa'), tuya: css('--bio-ambar', '#ffb547'),
             suya: css('--bio-violeta', '#b07cff'), texto: css('--text-main', '#ddd'), mar: 'rgba(120,170,220,.09)' };
  }
  function nombre(t) {
    if (t.rareza === 'unico') { return T('unico_nombre'); }
    return rellena(T('nombre_tropa'), { base: T('base_' + t.base), pre: t.prefijo ? T('af_' + t.prefijo) : '',
                                        suf: t.sufijo ? T('af_' + t.sufijo) : '' }).replace(/\s+/g, ' ').trim();
  }
  function miniLienzo(t, lado) {
    var c = el('canvas', 'atlas-arena-mini');
    c.width = c.height = Math.round(lado * dpr); c.style.width = c.style.height = lado + 'px';
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', nombre(t) + ' · ' + T('rar_' + t.rareza));
    requestAnimationFrame(function () { E.mini(c, t); });
    return c;
  }
  // A player without a pseudonym is named by their key fingerprint, never by a missing value (P2).
  function nombreLugar(l) { return l.npc ? T('npc_' + l.id) : (typeof l.pseudo === 'string' && l.pseudo.trim()) || 'Player ' + String(l.huella || '').slice(0, 8); }

  window.AtlasArenaComun = { T: T, textos: textos, el: el, boton: boton, rellena: rellena, quieto: quieto, css: css, colores: colores,
                             nombre: nombre, miniLienzo: miniLienzo, nombreLugar: nombreLugar };
})();
