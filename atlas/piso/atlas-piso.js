/* preceptoros.org · ATLAS, EL BOSQUE SUMERGIDO, como piso de la Torre.

   DECISION DEL SOBERANO (2026-09-25): ATLAS entra como PISO, no como panel.
   Cero paginas nuevas. Mismo contrato que `camino-puertos.js` y el killswitch:
   espera el aviso `preceptor:torre`, se monta dentro de `#piso-atlas` y pide
   sus textos --`atlas-<lengua>.json`, al propio origen-- solo al pulsar.

   VIVE FUERA DE `public/` HASTA EL PASO 3. No lo carga nadie todavia: el dia
   que el Soberano firme el paso 3, se muda a `public/assets/`, entra en la
   lista de `chat-router.js` detras de `camino.js` y la Torre gana su piso.
   Hasta entonces se ve en `atlas/piso/vista.html`, que simula la Torre.

   TODO LO QUE PINTA ES MAQUETA. Las cifras son de ejemplo (curva OSRS
   estandar: nivel 2 = 83 · 10 = 1 154 · 99 = 13 034 431) y los botones solo
   escriben `[ATLAS stub]` en la consola. El motor llega en el paso 3.

   EL MAPA ES CANVAS PINTADO UNA VEZ. OffscreenCanvas + un `drawImage`, niebla
   en un segundo lienzo, sectores como botones DOM encima. Sin bucle por
   fotograma: solo se repinta si cambia el ancho. Colores leidos de
   `soberano.css`, nunca escritos aqui.

   UNA SOLA SALIDA DE RED: su propio texto. Ni una mas. */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var yo = document.currentScript;
  /* La vista de desarrollo sirve los JSON desde su carpeta; en la Torre
     viviran en la raiz, como `puertos-<lengua>.json`. */
  var BASE = (yo && yo.dataset.base) || '/';

  /* --- datos de ejemplo: los sustituye el servidor en el paso 3 ----------- */
  /* [xp, umbral del nivel, umbral del siguiente, nivel], orden canonico. */
  var SKILLS = [[6747, 6291, 7028, 23], [15482, 14833, 16456, 31],
    [3905, 3523, 3973, 18], [2511, 2411, 2746, 15], [10331, 9730, 10824, 27],
    [1808, 1584, 1833, 12], [42042, 41171, 45529, 41]];
  var NUCLEO = [21773, 20224, 22406, 34];
  /* Forja <- Mineria; Restauracion <- Herboristeria + Ingenieria (§B.1). */
  var DEPENDE = { 3: [2], 5: [4, 6] };

  var ANCHA = { cols: 11, filas: 7, sectores: {
    nucleo: [5, 3], forja: [2, 2], aguja: [8, 1], ojo: [8, 5], grieta: [3, 5] } };
  var ESTRECHA = { cols: 7, filas: 7, sectores: {
    nucleo: [3, 3], forja: [1, 1], aguja: [4, 1], ojo: [4, 5], grieta: [1, 5] } };

  var TXT = null;
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function U(k) { return (TXT && TXT.ui && TXT.ui[k]) || ''; }
  function num(n) {
    try { return new Intl.NumberFormat(lang).format(n); } catch (e) { return String(n); }
  }
  function pct(n) {
    try { return new Intl.NumberFormat(lang, { style: 'percent' }).format(n / 100); }
    catch (e) { return n + ' %'; }
  }
  function rellena(plantilla, v) {
    return plantilla.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; });
  }
  function boton(texto, stub, clase) {
    var b = el('button', clase || 'boton', texto);
    b.type = 'button'; b.dataset.stub = stub;
    return b;
  }

  /* --- el mapa ------------------------------------------------------------ */
  function token(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }
  function centro(c, f, r) {
    var w = Math.sqrt(3) * r;
    return { x: w * (c + 0.5 + (f % 2) * 0.5), y: r * (1 + f * 1.5) };
  }
  function hexagono(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 30);
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
  }
  function ruido(c, f) {
    var h = Math.sin(c * 12.9898 + f * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }

  function mapa(lienzo, cvMapa, cvNiebla) {
    var pintado = 0;
    function pinta() {
      var ancho = lienzo.clientWidth;
      if (!ancho || ancho === pintado) { return; }
      pintado = ancho;
      var R = ancho < 480 ? ESTRECHA : ANCHA, S = R.sectores;
      var r = ancho / (Math.sqrt(3) * (R.cols + 0.5));
      var alto = Math.ceil(r * (1.5 * R.filas + 0.5));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      [cvMapa, cvNiebla].forEach(function (cv) {
        cv.width = Math.round(ancho * dpr); cv.height = Math.round(alto * dpr);
        cv.style.height = alto + 'px';
      });
      lienzo.style.height = alto + 'px';
      function sector(c, f) {
        for (var k in S) { if (S[k][0] === c && S[k][1] === f) { return k; } }
        return null;
      }
      function dibuja(ctx) {
        var fondo = token('--bg-secondary'), vio = token('--accent-violet'),
            cobre = token('--accent-copper'), filo = token('--edge-sov');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (var f = 0; f < R.filas; f++) {
          for (var c = 0; c < R.cols; c++) {
            var p = centro(c, f, r), s = sector(c, f);
            hexagono(ctx, p.x, p.y, r * 0.94);
            ctx.globalAlpha = 1; ctx.fillStyle = fondo; ctx.fill();
            ctx.globalAlpha = s ? 0.4 : 0.07 + ruido(c, f) * 0.2;
            ctx.fillStyle = s && s !== 'nucleo' ? cobre : vio; ctx.fill();
            ctx.globalAlpha = 1; ctx.strokeStyle = s ? cobre : filo;
            ctx.lineWidth = s ? 1.5 : 1; ctx.stroke();
          }
        }
      }
      var ctx = cvMapa.getContext('2d');
      if (typeof OffscreenCanvas !== 'undefined') {
        var off = new OffscreenCanvas(cvMapa.width, cvMapa.height);
        dibuja(off.getContext('2d')); ctx.drawImage(off, 0, 0);
      } else { dibuja(ctx); }

      var n = cvNiebla.getContext('2d');
      n.setTransform(dpr, 0, 0, dpr, 0, 0);
      n.clearRect(0, 0, ancho, alto);
      n.globalCompositeOperation = 'source-over';
      n.globalAlpha = 0.86; n.fillStyle = token('--bg-primary');
      n.fillRect(0, 0, ancho, alto);
      n.globalCompositeOperation = 'destination-out'; n.globalAlpha = 1;
      for (var k in S) {
        var p = centro(S[k][0], S[k][1], r);
        var g = n.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, r * 2.6);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        n.fillStyle = g; n.fillRect(p.x - r * 2.6, p.y - r * 2.6, r * 5.2, r * 5.2);
      }
      n.globalCompositeOperation = 'source-over';

      Array.prototype.forEach.call(lienzo.querySelectorAll('[data-sector]'), function (b) {
        var s = S[b.dataset.sector];
        if (!s) { return; }
        var q = centro(s[0], s[1], r);
        b.style.left = (q.x / ancho * 100) + '%';
        b.style.top = q.y + 'px';
      });
    }
    var pendiente = false;
    window.addEventListener('resize', function () {
      if (pendiente) { return; }
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; pinta(); });
    });
    pinta();
  }

  /* --- el panel del Atlante ----------------------------------------------- */
  function panel(zona) {
    var sk = TXT.skills || [];
    var raiz = el('div', 'atlas-panel');

    var cab = el('div', 'atlas-cab');
    cab.appendChild(el('h3', null, U('cab_h')));
    var integ = el('p', 'atlas-integridad');
    var lab = el('label', null, U('presion')); lab.htmlFor = 'atlas-presion';
    var met = el('meter'); met.id = 'atlas-presion';
    met.min = 0; met.max = 100; met.low = 40; met.high = 75; met.optimum = 100; met.value = 87;
    integ.appendChild(lab); integ.appendChild(met); integ.appendChild(el('data', null, pct(87)));
    cab.appendChild(integ);
    cab.appendChild(el('p', 'atlas-sello', U('sello')));
    raiz.appendChild(cab);

    var rec = el('ul', 'atlas-recursos');
    rec.setAttribute('aria-label', U('recursos_aria'));
    [['☀️ ' + U('luz'), '412 / 600'], ['🌿 ' + U('bio'), num(1284)],
     ['⚡ ' + U('flujo'), pct(37)]].forEach(function (x, i) {
      var li = el('li'); if (i === 2) { li.title = U('flujo_t'); }
      li.appendChild(el('b', null, x[0])); li.appendChild(el('data', null, x[1]));
      rec.appendChild(li);
    });
    raiz.appendChild(rec);

    var al = el('div', 'atlas-alerta'); al.setAttribute('role', 'alert');
    al.appendChild(el('strong', null, U('alerta')));
    al.appendChild(el('p', null, U('alerta_p')));
    al.appendChild(boton(U('reparar'), 'reparar-grieta'));
    raiz.appendChild(al);

    var rej = el('div', 'atlas-rejilla');
    var izq = el('div', 'atlas-izq');
    var sm = el('section', 'panel atlas-mapa');
    sm.appendChild(el('h4', null, U('mapa_h')));
    sm.appendChild(el('p', 'atlas-nota', U('mapa_nota')));
    var lienzo = el('div', 'atlas-lienzo');
    var cvM = el('canvas'), cvN = el('canvas');
    cvM.setAttribute('aria-hidden', 'true'); cvN.setAttribute('aria-hidden', 'true');
    lienzo.appendChild(cvM); lienzo.appendChild(cvN);
    [['nucleo', U('s_nucleo')], ['forja', U('s_forja')], ['aguja', U('s_aguja')],
     ['ojo', U('s_ojo')], ['grieta', '⚠ ' + U('s_grieta')]].forEach(function (x) {
      var b = boton(x[1], 'sector', 'atlas-sector'); b.dataset.sector = x[0];
      lienzo.appendChild(b);
    });
    sm.appendChild(lienzo); izq.appendChild(sm);

    var fs = el('fieldset', 'atlas-profundidad');
    fs.appendChild(el('legend', null, U('prof_leg')));
    [['arrecife', 'b1', false, false], ['ruinas', 'b2', true, false],
     ['bosque', 'b3', false, false], ['nucleo', 'b4', false, true]].forEach(function (x) {
      var lb = el('label'), inp = el('input');
      inp.type = 'radio'; inp.name = 'atlas-profundidad'; inp.value = x[0];
      inp.checked = x[2]; inp.disabled = x[3];
      lb.appendChild(inp); lb.appendChild(el('span', null, U(x[1])));
      lb.appendChild(el('small', null, rellena(U(x[1] + 'n'), { ing: sk[6] || '' })));
      fs.appendChild(lb);
    });
    izq.appendChild(fs); rej.appendChild(izq);

    var hud = el('aside', 'atlas-hud'); hud.setAttribute('aria-label', U('hud_aria'));
    var dor = el('section', 'panel atlas-dormias');
    dor.appendChild(el('h4', null, U('dormias_h')));
    var ul = el('ul');
    ul.appendChild(el('li', null, '+' + num(1240) + ' XP · ' + (sk[1] || '')));
    ul.appendChild(el('li', null, '+86 🌿 ' + U('bio')));
    ul.appendChild(el('li', 'cesa', U('d3')));
    dor.appendChild(ul);
    dor.appendChild(el('p', 'atlas-nota', U('dormias_nota')));
    dor.appendChild(boton(U('recoger'), 'recoger-offline'));
    hud.appendChild(dor);

    var yoS = el('section', 'panel');
    yoS.appendChild(el('h4', null, 'Atlante-7F3A'));
    var ol = el('ol', 'atlas-skills');
    SKILLS.forEach(function (s, i) {
      var li = el('li'), nom = el('span', null, sk[i] || '');
      if (DEPENDE[i]) {
        nom.appendChild(el('i', 'atlas-dep', '← ' + DEPENDE[i].map(function (j) {
          return sk[j]; }).join(' + ')));
      }
      li.appendChild(nom); li.appendChild(el('b', 'nivel', s[3]));
      var pr = el('progress'); pr.max = s[2] - s[1]; pr.value = s[0] - s[1];
      pr.setAttribute('aria-label', sk[i] + ': ' + num(s[0]) + ' ' + U('de') + ' ' + num(s[2]) + ' XP');
      li.appendChild(pr);
      var cifra = el('small', null, num(s[0]) + ' / ' + num(s[2]) + ' XP');
      cifra.dir = 'ltr';
      li.appendChild(cifra);
      ol.appendChild(li);
    });
    yoS.appendChild(ol); hud.appendChild(yoS);
    rej.appendChild(hud); raiz.appendChild(rej);

    var nu = el('section', 'panel atlas-nucleo');
    var h = el('h4');
    var partes = U('nucleo_h').split('{n}');
    h.appendChild(document.createTextNode(partes[0] || ''));
    h.appendChild(el('span', 'nivel', NUCLEO[3]));
    h.appendChild(document.createTextNode(partes[1] || ''));
    nu.appendChild(h);
    var pn = el('progress'); pn.max = NUCLEO[2] - NUCLEO[1]; pn.value = NUCLEO[0] - NUCLEO[1];
    pn.setAttribute('aria-label', rellena(U('nucleo_aria'), { a: num(NUCLEO[0]), b: num(NUCLEO[2]) }));
    nu.appendChild(pn);
    nu.appendChild(el('p', null, rellena(U('nucleo_p'), {
      a: num(NUCLEO[0]), b: num(NUCLEO[2]), tu: num(412),
      pct: (1.9).toLocaleString(lang) })));
    nu.appendChild(el('p', 'atlas-desbloqueo', U('desbloqueo')));
    /* La nota nombra un fichero: va en <code>, construido, no con innerHTML. */
    var nota = el('p', 'atlas-nota');
    U('nucleo_nota').split(/<\/?code>/).forEach(function (t, i) {
      nota.appendChild(i % 2 ? el('code', null, t) : document.createTextNode(t));
    });
    nu.appendChild(nota);
    raiz.appendChild(nu);
    raiz.appendChild(el('p', 'atlas-pie', U('pie')));

    zona.appendChild(raiz);
    mapa(lienzo, cvM, cvN);
  }

  function textos() {
    if (TXT) { return Promise.resolve(TXT); }
    return fetch(BASE + 'atlas-' + lang + '.json').then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    }).then(function (d) { TXT = d; return d; });
  }

  function pinta(cuerpo) {
    var caja = el('section', 'atlas-piso'); caja.id = 'atlas-piso';
    var zona = el('div');
    var entrar = boton('▶ ATLAS', 'entrar');
    zona.appendChild(entrar);
    caja.appendChild(zona);
    cuerpo.appendChild(caja);
    entrar.addEventListener('click', function () {
      entrar.disabled = true;
      textos().then(function () {
        zona.removeChild(entrar);
        zona.appendChild(el('p', 'atlas-lema', U('lema')));
        panel(zona);
      }).catch(function (e) {
        entrar.disabled = false;
        zona.appendChild(el('p', 'no-data',
          'NO_DATA · atlas-' + lang + '.json: ' + (e && e.message ? e.message : e)));
      });
    });
  }

  /* --- stubs: la maqueta solo avisa de lo que haria ---------------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#atlas-piso [data-stub]');
    if (b) { console.log('[ATLAS stub]', b.dataset.stub, b.dataset.sector || ''); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.name === 'atlas-profundidad') {
      console.log('[ATLAS stub] profundidad', e.target.value);
    }
  });

  function monta() {
    var piso = document.getElementById('piso-atlas');
    if (!piso || piso.querySelector('#atlas-piso')) { return; }
    pinta(piso.querySelector('.torre-cuerpo') || piso);
  }
  window.addEventListener('preceptor:torre', monta);
  if (document.getElementById('piso-atlas') && window.TorreUI) { monta(); }
})();
