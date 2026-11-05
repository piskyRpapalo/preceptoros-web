(function (raiz) {
  'use strict';
  var R = { b: {} }, ctx = null;
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function partes() { return raiz.AtlasCasaMedidas.PARTES; }

    function pinta() {
    if (!ctx) { return; }
    var ed = ctx.medidas();
    partes().forEach(function (e) {
      var b = R.b[e[0]], m = ed[e[3]];
      if (!b) { return; }
      b.querySelector('.casa-lateral-st').textContent = m ? m.txt : 'NO_DATA';
      b.classList.toggle('sin-medida', !m);
      b.setAttribute('aria-label', ctx.T('parte_' + e[0]) + ' · ' + (m ? m.txt : ctx.T('nd_' + e[3])));
    });
  }
    function enfoca(i, mover) {
    var l = partes();
    i = Math.max(0, Math.min(l.length - 1, i));
    l.forEach(function (e, k) { R.b[e[0]].tabIndex = k === i ? 0 : -1; });
    if (mover) { R.b[l[i][0]].focus(); }
  }
  function monta(zona, c) {
    if (!zona || zona.querySelector('#casa-lateral')) { return; }
    ctx = c;
    var nav = el('nav', 'casa-lateral'); nav.id = 'casa-lateral'; nav.setAttribute('aria-label', c.T('lateral_aria'));
    partes().forEach(function (e, i) {
      var b = el('button', 'casa-lateral-parte'); b.type = 'button'; b.id = 'parte-' + e[0]; b.dataset.parte = e[0];
      var ico = el('span', 'casa-lateral-ico', e[1]); ico.setAttribute('aria-hidden', 'true');
      b.appendChild(ico); b.appendChild(el('span', 'casa-lateral-nom', c.T('parte_' + e[0]))); b.appendChild(el('span', 'casa-lateral-st'));
      b.addEventListener('click', function () { enfoca(i, false); c.entra(e[0]); });
      R.b[e[0]] = b; nav.appendChild(b);
    });
    nav.addEventListener('keydown', function (ev) {
      var l = partes(), i = l.map(function (e) { return e[0]; }).indexOf((ev.target.dataset || {}).parte);
      var d = { ArrowDown: 1, ArrowUp: -1 }[ev.key];
      if (i < 0) { return; }
      if (d) { ev.preventDefault(); enfoca(i + d, true); } else if (ev.key === 'Home') { ev.preventDefault(); enfoca(0, true); } else if (ev.key === 'End') { ev.preventDefault(); enfoca(l.length - 1, true); }
    });
    zona.appendChild(nav);
    enfoca(0, false); pinta(); setInterval(pinta, 1500);
  }
  raiz.AtlasCasaLateral = { monta: monta, pinta: pinta };
})(this);
