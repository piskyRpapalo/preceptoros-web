(function () {
  'use strict';

  var PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|\b\d{1,3}(\.\d{1,3}){3}\b/i;
  var TX = null, lang = (window.AtlasLengua && window.AtlasLengua.actual) || 'en', panel = null;

  function T(k) { return (TX && TX[k]) || ''; }
  function el(t, c, x) { var n = document.createElement(t); if (c) { n.className = c; } if (x) { n.textContent = x; } return n; }
  function textos() {
    if (TX) { return Promise.resolve(TX); }
    return fetch('/atlas-opina-' + lang + '.json').then(function (r) {
      if (!r.ok) { throw new Error('atlas-opina-' + lang + '.json ' + r.status); }
      return r.json();
    }).then(function (d) { TX = d; return d; });
  }

  function ascii(s) { return s.replace(/[^\x20-\x7e]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }); }

  function leido(n) {
    var c = n.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function objetos(capa) {
    var out = {}, J = window.AtlasJuego, ins = J && J.instantanea();
    var s = capa.querySelector('.thegame-sugerencia:not(.thegame-juez)'), v = capa.querySelector('.thegame-juez');
    if (s && !s.hidden && leido(s)) { out.sugerencia = { nodo: s, texto: leido(s) }; }
    if (v && !v.hidden && leido(v)) { out.veredicto = { nodo: v, texto: leido(v) }; }
    var a = capa.querySelector('#atlas-piso .atlas-alerta');
    if (ins && ins.grieta && ins.grieta.abierta && a) { out.grieta = { nodo: a, texto: leido(a) }; }
    return out;
  }

  function cierra() { if (panel) { panel.remove(); panel = null; } }
  function dice(t) { var p = panel && panel.querySelector('.atlas-opina-estado'); if (p) { p.textContent = t; } }

  function firma(sobre, obj, eleccion, nota) {
    var J = window.AtlasJuego, H = window.AtlasCoord, I = window.Identity;

    if (!obj) { dice(T('ninguno')); return; }
    if (!I || !I.quien || !I.quien()) { dice(T('nd_id')); return; }
    if (PROHIBIDO.test(nota)) { dice(T('nota_mal')); return; }
    var p = J.partida(), fin = p ? p.final : J.instantanea();
    var op = { esquema: 'atlas.opinion/1', contenido_v: (p && p.contenido_v) || 'NO_DATA', sobre: sobre,
               ciclo: fin.ciclo, estado_sha256: H.sha256(ascii(JSON.stringify(fin))),
               mostrado: obj.texto.slice(0, 400), eleccion: eleccion, nota: nota.slice(0, 280) };
    Promise.all([I.firmar(op), I.publica()]).then(function (r) {
      var sobreF = { esquema: 'atlas.opinion.firmada/1', opinion: op, firma: r[0].firma, algoritmo: 'Ed25519',
                     pseudonimo: r[0].autor, clave_publica: r[1] };
      var nombre = 'atlas-opinion-' + op.ciclo + '-' + sobre + '.json';
      var texto = JSON.stringify(sobreF, null, 1) + '\n';
      var a = el('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
      a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      dice(T('ok').replace('{f}', nombre));
      ofreceEnvio(texto, nombre);
    }).catch(function (x) { dice(T('nd').replace('{m}', x && x.message)); });
  }

  function ofreceEnvio(texto, nombre) {
    if (!panel) { return; }
    Array.prototype.forEach.call(panel.querySelectorAll('.atlas-opina-envia'), function (v) { v.remove(); });
    var st = panel.querySelector('.atlas-opina-estado');
    var copia = navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    if (copia) {
      var c = el('button', 'boton atlas-opina-envia', T('copiar')); c.type = 'button';
      c.addEventListener('click', function () {
        navigator.clipboard.writeText(texto).then(function () { dice(T('copiado')); },
          function (x) { dice(T('copiar_no').replace('{m}', (x && x.name) || '')); });
      });
      panel.insertBefore(c, st);
    }
    var f = typeof File === 'function' ? new File([texto], nombre, { type: 'application/json' }) : null;
    var puede = f && navigator.canShare && navigator.canShare({ files: [f] });
    if (!puede) { dice(T(copia ? 'enviar_copia' : 'enviar_nd').replace('{f}', nombre)); return; }
    var b = el('button', 'boton atlas-opina-envia', T('enviar')); b.type = 'button';
    b.addEventListener('click', function () {
      navigator.share({ files: [f], title: T('t') }).then(function () { dice(T('enviado')); b.remove(); },
        function (x) { dice(T('enviar_no').replace('{m}', (x && x.name) || '')); });
    });
    panel.insertBefore(b, c || st);
  }

  function formulario(capa, pre) {
    cierra();
    var obs = objetos(capa), claves = Object.keys(obs);
    panel = el('section', 'atlas-ficha atlas-opina-panel');
    panel.setAttribute('aria-label', T('t'));
    panel.appendChild(el('h5', null, T('t')));
    if (!claves.length) {
      panel.appendChild(el('p', 'no-data', T('ninguno')));
    } else {
      var sel = el('select'), lab = el('label', null, T('que'));
      lab.style.cssText = 'display:grid;gap:.25rem';
      claves.forEach(function (k) { var o = el('option', null, T('sobre_' + k)); o.value = k; sel.appendChild(o); });
      if (pre && obs[pre]) { sel.value = pre; }
      lab.appendChild(sel); panel.appendChild(lab);

      var fs = el('fieldset'), eleccion = 'no_se';
      fs.style.cssText = 'display:flex;flex-wrap:wrap;gap:.35rem 1.1rem;border:1px solid var(--edge-sov);border-radius:var(--radius);padding:.5rem .8rem;margin:0';
      fs.appendChild(el('legend', null, T('eleccion')));
      ['de_acuerdo', 'en_desacuerdo', 'no_se'].forEach(function (k) {
        var l = el('label'), r = el('input'); r.type = 'radio'; r.name = 'atlas-opina'; r.value = k;
        l.style.cssText = 'display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;white-space:nowrap';
        r.checked = k === eleccion; r.addEventListener('change', function () { eleccion = k; });
        l.appendChild(r); l.appendChild(el('span', null, T(k))); fs.appendChild(l);
      });
      panel.appendChild(fs);
      var nl = el('label', null, T('nota')), nota = el('textarea'); nota.maxLength = 280; nota.rows = 2;
      nl.style.cssText = 'display:grid;gap:.25rem';
      nl.appendChild(nota); panel.appendChild(nl);
      var b = el('button', 'boton', T('firmar')); b.type = 'button';
      b.addEventListener('click', function () { firma(sel.value, objetos(capa)[sel.value] || obs[sel.value], eleccion, nota.value.trim()); });
      panel.appendChild(b);
    }
    var st = el('p', 'atlas-nota atlas-opina-estado'); st.setAttribute('role', 'status'); panel.appendChild(st);
    var c = el('button', 'boton-sec', T('cerrar')); c.type = 'button'; c.addEventListener('click', cierra);
    c.style.justifySelf = 'start';
    panel.appendChild(c);

    var sm = capa.querySelector('.thegame-panel:not([hidden])') || capa.querySelector('#atlas-piso');
    (sm || capa).appendChild(panel);
    panel.scrollIntoView({ block: 'nearest' });
  }

  function siembra(capa) {
    var obs = objetos(capa);
    Object.keys(obs).forEach(function (k) {
      var n = obs[k].nodo;
      if (n.querySelector(':scope > .atlas-opina')) { return; }
      var b = el('button', 'boton-sec atlas-opina', T('t')); b.type = 'button';
      b.addEventListener('click', function () { formulario(capa, k); });
      n.appendChild(b);
    });
  }

  function abre(capa) {
    textos().then(function () {
      formulario(capa);
      siembra(capa);
      if (!abre.vigila) {
        abre.vigila = new MutationObserver(function () { siembra(capa); });
        abre.vigila.observe(capa, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
      }
    }).catch(function (x) {
      var p = el('p', 'no-data', 'NO_DATA · ' + (x && x.message));
      var sm = capa.querySelector('.thegame-panel:not([hidden])') || capa.querySelector('#atlas-piso');
      (sm || capa).appendChild(p);
    });
  }

  window.AtlasOpina = { abre: abre, objetos: objetos };
})();
