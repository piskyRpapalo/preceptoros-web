/* preceptoros.org · theGame · OPINAR FIRMADO sobre lo que ves: sugerencia, veredicto, grieta.

   SE CARGA AL PULSAR «Sign feedback» (2026-09-28): su peso no va en la puerta del juego, que es una
   ley del mundo. Desde ese momento pone su propio boton junto a cada sugerencia, cada veredicto del
   juez y la alerta de la grieta, para que opinar este donde esta la cosa.

   QUE SE FIRMA. `atlas.opinion/1` (contrato en `data/atlas_opinion_schema.json`): sobre que, el
   ciclo, la HUELLA del estado exacto de la partida en ese momento (sha256 del final, con
   `atlas-coord.js`), la linea tal como la viste, tu respuesta de un enum cerrado y una nota corta
   opcional que no admite rutas, correos, enlaces ni IPs. Se firma con tu identidad Ed25519, la de
   siempre (`Identity.firmar`).

   NO SE ENVIA. Se guarda como fichero: la web no llama al rack y el canal de envio del Agora aun no
   existe (lo dice `enviar.js`). El laboratorio lo lee cuando se lo llevas. Los textos viven en
   `atlas-opina-<lengua>.json`, en la lengua en que abre el juego. */
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
  /* Solo ASCII para el hash (lo exige el SHA-256 puro): lo que no lo es va escapado como en JSON. */
  function ascii(s) { return s.replace(/[^\x20-\x7e]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }); }

  /* El texto que la persona LEYO: sin los rotulos de los botones (Hacer, Ignorar, este mismo). */
  function leido(n) {
    var c = n.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  /* Lo que hay ahora en pantalla sobre lo que se puede opinar. */
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
    /* La cosa pudo irse entre abrir el panel y firmar (una sugerencia dura poco): se dice, no se rompe. */
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
      var a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sobreF, null, 1) + '\n'], { type: 'application/json' }));
      a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      dice(T('ok').replace('{f}', nombre));
    }).catch(function (x) { dice(T('nd').replace('{m}', x && x.message)); });
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
      /* Estilo en linea: esta pieza se carga al pulsar y su hoja no debe pesar en la puerta del juego. */
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
    var sm = capa.querySelector('#atlas-piso .atlas-mapa');
    (sm || capa).appendChild(panel);
    panel.scrollIntoView({ block: 'nearest' });
  }

  /* Desde que se carga, un boton junto a cada cosa sobre la que se puede opinar. */
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
      var sm = capa.querySelector('#atlas-piso .atlas-mapa'); (sm || capa).appendChild(p);
    });
  }

  window.AtlasOpina = { abre: abre, objetos: objetos };
})();
