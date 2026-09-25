/* preceptoros.org · ATLAS · la pantalla de dialogo.

   UNA ESCENA, NO UN AVISO. La grieta no se anuncia con un mensaje de error:
   la cuenta PRECEPTOR, el guia, con su retrato, su voz letra a letra y dos
   respuestas. Es el lexico canonico de §A llevado a su forma natural: el
   fallo es un peligro del mundo, y quien lo explica es alguien.

   EL GUIA ES PRECEPTOR EN PIXEL ART (firmado por el Soberano, 2026-09-25).
   Choca con el render pulido del cabezal A PROPOSITO: fuera del juego el guia
   es marmol pulido; dentro del Bosque Sumergido es un recuerdo de Atlantida,
   y un recuerdo se ve a baja fidelidad. No se unifican los dos estilos.
   Una sola tira de cinco celdas (`preceptor-pixel.png`, 69 KB), pedida al
   abrir el primer dialogo y nunca precacheada:
     celda 0 reposo · 1-2 habla (ciclan al ritmo del texto) · 3 revelar ·
     4 alerta. El estado del Nucleo se lee en el OJO sin una palabra: en
     ALERTA ROJA se tine de cobre con una capa estatica (`mix-blend-mode`),
     sin filtros ni animacion que cuesten fotogramas.

   NEREA QUEDA COMO VOZ SECUNDARIA. Su retrato SVG sigue aqui
   (`retratoNerea`), construido nodo a nodo, para cuando haya mas de una voz.

   ACCESIBLE: `role="dialog"` con nombre, el foco entra y vuelve al boton que
   la abrio, Escape cierra, y con `prefers-reduced-motion` el texto aparece
   entero en vez de escribirse. Las elecciones solo registran `[ATLAS stub]`:
   el motor que las resuelve llega en el paso 3. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (padre) { padre.appendChild(n); }
    return n;
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function degradado(defs, id, tipo, paradas, extra) {
    var g = s(tipo, Object.assign({ id: id }, extra || {}), defs);
    paradas.forEach(function (p) { s('stop', { offset: p[0], 'stop-color': p[1] }, g); });
  }

  /* EL MAPA CELDA <-> ESTADO, en un solo sitio y congelado: lo lee la prueba
     de determinismo de `test_atlas.py`. */
  var CELDAS = Object.freeze({ reposo: 0, habla: [1, 2], revelar: 3, alerta: 4 });
  var TIRA = 'preceptor-pixel.png';
  var yo = document.currentScript;
  var BASE = (yo && yo.dataset.base) || '/';

  /* El retrato de Preceptor: una ventana de una celda sobre la tira. */
  function retratoPreceptor(ui, decorativo) {
    var marco = el('div', 'atlas-pre');
    var img = document.createElement('img');
    img.className = 'atlas-pre-tira';
    /* El alt sale del JSON de cada lengua; de adorno, calla. */
    img.alt = decorativo ? '' : (ui.atlas_retrato_alt || '');
    if (decorativo) { marco.setAttribute('aria-hidden', 'true'); }
    img.decoding = 'async'; img.src = BASE + TIRA;
    var ojo = el('span', 'atlas-pre-ojo'); ojo.setAttribute('aria-hidden', 'true');
    marco.appendChild(img); marco.appendChild(ojo);
    return {
      nodo: marco,
      celda: function (n) { marco.dataset.celda = String(n); },
      alerta: function (si) { marco.classList.toggle('en-alerta', !!si); }
    };
  }

  function retratoNerea() {
    var v = s('svg', { viewBox: '0 0 200 240', class: 'atlas-retrato', 'aria-hidden': 'true' });
    var d = s('defs', {}, v);
    degradado(d, 'at-halo', 'radialGradient', [['0', '#8ff0e0'], ['0.55', '#1d8a9a'], ['1', '#1a1233']]);
    degradado(d, 'at-piel', 'linearGradient', [['0', '#f6d3b8'], ['1', '#d9a080']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    degradado(d, 'at-pelo', 'linearGradient', [['0', '#1f6f78'], ['1', '#12303f']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    degradado(d, 'at-iris', 'radialGradient', [['0', '#b8fff0'], ['0.45', '#2fb8a8'], ['1', '#0f4d57']]);
    degradado(d, 'at-ambar', 'radialGradient', [['0', '#fff1b8'], ['0.5', '#f59e0b'], ['1', '#9a4a05']]);
    degradado(d, 'at-traje', 'linearGradient', [['0', '#2a2440'], ['1', '#15112a']], { x1: 0, y1: 0, x2: 0, y2: 1 });

    s('circle', { cx: 100, cy: 110, r: 108, fill: 'url(#at-halo)', opacity: '0.9' }, v);
    /* Pelo de atras: la melena que enmarca. */
    s('path', { d: 'M40 120 C30 60 60 22 100 22 C142 22 172 60 160 124 C164 170 150 196 138 206 L62 206 C48 190 36 168 40 120Z', fill: 'url(#at-pelo)' }, v);
    /* Hombros y traje con cuello de cobre. */
    s('path', { d: 'M30 240 C34 205 60 188 100 186 C140 188 166 205 170 240Z', fill: 'url(#at-traje)' }, v);
    s('path', { d: 'M72 192 L100 214 L128 192', fill: 'none', stroke: '#d97706', 'stroke-width': 5, 'stroke-linejoin': 'round' }, v);
    s('path', { d: 'M100 200 Q108 212 100 226 Q92 212 100 200Z', fill: '#f59e0b' }, v);
    /* Cuello y cara. */
    s('path', { d: 'M88 160 L112 160 L114 192 Q100 200 86 192Z', fill: '#d9a080' }, v);
    s('path', { d: 'M62 104 C62 70 80 52 100 52 C120 52 138 70 138 104 C138 138 122 166 100 170 C78 166 62 138 62 104Z', fill: 'url(#at-piel)' }, v);
    /* Rubor. */
    s('ellipse', { cx: 76, cy: 130, rx: 9, ry: 5, fill: '#ff8a8a', opacity: '0.35' }, v);
    s('ellipse', { cx: 124, cy: 130, rx: 9, ry: 5, fill: '#ff8a8a', opacity: '0.35' }, v);
    /* Ojos: almendra, iris, pupila y los dos brillos que dan la vida. */
    [[82, -1], [118, 1]].forEach(function (o) {
      var x = o[0];
      s('path', { d: 'M' + (x - 14) + ' 112 Q' + x + ' 98 ' + (x + 14) + ' 112 Q' + x + ' 122 ' + (x - 14) + ' 112Z', fill: '#ffffff' }, v);
      s('circle', { cx: x, cy: 112, r: 8.5, fill: 'url(#at-iris)' }, v);
      s('circle', { cx: x, cy: 113, r: 3.6, fill: '#0b1f26' }, v);
      s('circle', { cx: x - 3, cy: 108.5, r: 2.6, fill: '#ffffff' }, v);
      s('circle', { cx: x + 3, cy: 116, r: 1.2, fill: '#ffffff', opacity: '0.85' }, v);
      s('path', { d: 'M' + (x - 15) + ' 110 Q' + x + ' 95 ' + (x + 15) + ' 110', fill: 'none', stroke: '#12303f', 'stroke-width': 3, 'stroke-linecap': 'round' }, v);
      s('path', { d: 'M' + (x - 12) + ' 94 Q' + x + ' ' + (88 - o[1]) + ' ' + (x + 12) + ' 93', fill: 'none', stroke: '#12303f', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, v);
    });
    s('path', { d: 'M100 120 Q103 132 98 136', fill: 'none', stroke: '#b97a5e', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, v);
    s('path', { d: 'M90 148 Q100 155 110 147', fill: 'none', stroke: '#a3524a', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, v);
    /* Flequillo, con su mechon de cobre. */
    s('path', { d: 'M58 104 C56 62 80 40 104 42 C130 44 146 66 142 102 C134 84 124 74 112 70 C114 80 108 88 100 92 C98 82 92 74 84 72 C78 84 70 94 58 104Z', fill: 'url(#at-pelo)' }, v);
    s('path', { d: 'M104 44 C120 50 128 62 126 78 C120 70 112 66 108 66 C110 58 108 50 104 44Z', fill: '#d97706', opacity: '0.9' }, v);
    /* Las gafas de ambar, subidas a la frente. */
    s('path', { d: 'M60 66 Q100 52 140 66', fill: 'none', stroke: '#6b4a1e', 'stroke-width': 4 }, v);
    [80, 120].forEach(function (x) {
      s('circle', { cx: x, cy: 62, r: 13, fill: 'url(#at-ambar)', stroke: '#d97706', 'stroke-width': 3.5 }, v);
      s('ellipse', { cx: x - 4, cy: 57, rx: 4, ry: 2.4, fill: '#ffffff', opacity: '0.75' }, v);
    });
    return v;
  }

  var abierta = null;
  function cierra() {
    if (!abierta) { return; }
    clearInterval(abierta.reloj);
    document.removeEventListener('keydown', abierta.teclas);
    abierta.capa.remove();
    if (abierta.origen && abierta.origen.focus) { abierta.origen.focus(); }
    abierta = null;
  }

  function abre(ui, padre, origen, opciones) {
    cierra();
    var alerta = !!(opciones && opciones.alerta);
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var base = alerta ? CELDAS.alerta : CELDAS.reposo;
    var lineas = [ui.dlg_l1, ui.dlg_l2, ui.dlg_l3].filter(Boolean);
    var capa = el('div', 'atlas-dlg-capa');
    var caja = el('div', 'atlas-dlg');
    caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'atlas-dlg-nombre'); caja.tabIndex = -1;
    var marco = el('div', 'atlas-dlg-marco');
    var cara = retratoPreceptor(ui);
    cara.celda(base); cara.alerta(alerta);
    marco.appendChild(cara.nodo);
    caja.appendChild(marco);
    var cuerpo = el('div', 'atlas-dlg-cuerpo');
    var placa = el('p', 'atlas-dlg-placa');
    var nombre = el('b', null, ui.dlg_nombre); nombre.id = 'atlas-dlg-nombre';
    placa.appendChild(nombre); placa.appendChild(el('span', null, ui.dlg_rol));
    cuerpo.appendChild(placa);
    var texto = el('p', 'atlas-dlg-texto'); texto.setAttribute('aria-live', 'polite');
    cuerpo.appendChild(texto);
    var mandos = el('div', 'atlas-dlg-mandos');
    cuerpo.appendChild(mandos);
    caja.appendChild(cuerpo);
    var x = el('button', 'atlas-dlg-cerrar', '×'); x.type = 'button';
    x.setAttribute('aria-label', ui.dlg_cerrar); x.addEventListener('click', cierra);
    caja.appendChild(x);
    capa.appendChild(caja);
    capa.addEventListener('click', function (e) { if (e.target === capa) { cierra(); } });
    padre.appendChild(capa);

    var i = 0;
    abierta = { capa: capa, origen: origen, reloj: 0,
      teclas: function (e) { if (e.key === 'Escape') { cierra(); } } };
    document.addEventListener('keydown', abierta.teclas);

    /* Mientras escribe, la boca cicla entre las dos celdas de habla; al
       acabar, vuelve a la celda base del estado. Quien pide quietud ve el
       texto entero y la cara fija. */
    function escribe(frase, hecho) {
      clearInterval(abierta.reloj);
      if (quieto) { texto.textContent = frase; cara.celda(base); hecho(); return; }
      var n = 0, paso = 0; texto.textContent = '';
      abierta.reloj = setInterval(function () {
        n += 2; paso++; texto.textContent = frase.slice(0, n);
        cara.celda(CELDAS.habla[(paso >> 2) % 2]);
        if (n >= frase.length) { clearInterval(abierta.reloj); cara.celda(base); hecho(); }
      }, 22);
    }
    function paso() {
      while (mandos.firstChild) { mandos.removeChild(mandos.firstChild); }
      escribe(lineas[i], function () {
        if (i < lineas.length - 1) {
          var sig = el('button', 'boton atlas-dlg-sigue', '▸'); sig.type = 'button';
          sig.setAttribute('aria-label', '▸ ' + (i + 2) + '/' + lineas.length);
          sig.addEventListener('click', function () { i++; paso(); });
          mandos.appendChild(sig); sig.focus();
        } else {
          [['dlg_si', 'sellar-grieta'], ['dlg_no', 'aplazar-grieta']].forEach(function (o, k) {
            var b = el('button', k ? 'leve' : 'boton', ui[o[0]]); b.type = 'button';
            b.addEventListener('click', function () {
              console.log('[ATLAS stub]', o[1]);
              /* Sellar es la revelacion: el ojo se enciende y la escena cierra. */
              if (!k) {
                cara.alerta(false); cara.celda(CELDAS.revelar);
                mandos.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
                setTimeout(cierra, quieto ? 0 : 900);
              } else { cierra(); }
            });
            mandos.appendChild(b);
            if (!k) { b.focus(); }
          });
        }
      });
    }
    caja.focus();
    paso();
  }

  window.AtlasDialogo = { abre: abre, cierra: cierra, CELDAS: CELDAS,
    retrato: retratoPreceptor, retratoNerea: retratoNerea };
})();
