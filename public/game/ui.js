/* preceptoros.org · theGame v1.5 · la INCUBADORA y el ARMY en la capa.

   INVOCAR ES UN ACTO FIRMADO. Se firma la invocacion con la identidad
   Ed25519 de siempre, su sha256 es la semilla de la tirada, y SOLO DESPUES se
   pagan el Cobre y la Luz por el motor (`AtlasJuego.invoca`). Si la firma
   falla, no se gasta nada.

   EL HUEVO NO BLOQUEA EL JUEGO. Incuba en ciclos de juego mientras el Bosque
   sigue; late en su lienzo y dice cuanto le queda. La carta 2D que forjaria
   el rack (SD/LoRA) es NO_DATA: esta web no tiene canal al rack, y se dice.

   ECLOSION: el huevo se abre en la tropa mezclando sus ondas (morfismo), sin
   una sola imagen. «El silicio ha forjado esta criatura»: la persona mira sus
   afijos y FIRMA para adoptarla; `AtlasArmy.adopta` verifica esa firma antes
   de escribir. Sin firma, la tropa se queda fuera.

   UNA SOLA SALIDA DE RED: ninguna. Todo sale de la semilla y de las ondas. */
(function () {
  'use strict';

  var G = null, A = null, S = null, army = null;
  var R = {}, reloj = 0, huevos = [], eclosionada = null, n = 0, capa = null;

  function T(k) { return (window.AtlasJuego && window.AtlasJuego.texto(k)) || ''; }
  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto) { var b = el('button', 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return p.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function dice(t) { R.estado.textContent = t; }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function ins() { return window.AtlasJuego && window.AtlasJuego.instantanea(); }
  function calor() { return S.calorDe(ins()); }

  /* --- el lienzo: una figura de Fourier ---------------------------------- */
  function lienzo(lado, etiqueta) {
    var c = el('canvas', 'atlas-onda'), r = window.devicePixelRatio || 1;
    c.width = lado * r; c.height = lado * r;
    c.style.width = lado + 'px'; c.style.height = lado + 'px';
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', etiqueta || '');
    return c;
  }
  function traza(c, arm, clase, latido) {
    var g = c.getContext('2d'), w = c.width, lim = 0;
    arm.forEach(function (h) { lim += Math.max(Math.abs(h[1]), Math.abs(h[2])); });
    var k = (w / 2 - 6) / Math.max(1, lim) * (latido || 1);
    g.clearRect(0, 0, w, w);
    g.lineWidth = Math.max(1.5, w / 90);
    g.strokeStyle = getComputedStyle(c).getPropertyValue('--onda').trim() || '#c98a4b';
    g.beginPath();
    for (var i = 0; i <= 256; i++) {
      var p = G.punto(arm, i / 256 * 2 * Math.PI);
      g[i ? 'lineTo' : 'moveTo'](w / 2 + p[0] * k, w / 2 - p[1] * k);
    }
    g.stroke();
    c.dataset.rareza = clase || '';
  }

  /* --- nombres, desde el texto de la lengua ------------------------------ */
  function nombre(t) {
    if (t.rareza === 'unico') { return T('unico_nombre'); }
    return rellena(T('nombre_tropa'), {
      base: T('base_' + t.base), pre: t.prefijo ? T('af_' + t.prefijo) : '',
      suf: t.sufijo ? T('af_' + t.sufijo) : ''
    }).replace(/\s+/g, ' ').trim();
  }
  function ficha(t, lado) {
    var f = el('figure', 'atlas-tropa rar-' + t.rareza);
    var c = lienzo(lado, nombre(t) + ' · ' + T('rar_' + t.rareza));
    f.appendChild(c);
    var cap = el('figcaption');
    cap.appendChild(el('b', null, nombre(t)));
    cap.appendChild(el('small', null, T('rar_' + t.rareza)));
    /* SU CARACTER Y SU VOZ, sin texto nuevo: el griego no tiene sitio para doce claves mas
       (tope de 16 KiB), asi que el epiteto escrito es NO_DATA en las nueve y se dice aqui. Queda
       la identidad que no necesita palabras: el color de la traza sale de su caracter, y el
       boton usa la palabra `sonido`, que ya existe en las nueve. Respeta el interruptor. */
    var k = G.caracter(t);
    c.style.setProperty('--onda', ['hsl(35 75% 58%)', 'hsl(140 45% 55%)', 'hsl(275 55% 68%)', 'hsl(210 12% 68%)'][k.color]);
    c.dataset.caracter = k.color + '-' + k.pulso + '-' + k.tendencia;
    var oir = boton(T('sonido'));
    oir.addEventListener('click', function () { oye(t); });
    cap.appendChild(oir);
    f.appendChild(cap);
    requestAnimationFrame(function () { traza(c, t.armonicos, t.rareza); });
    return f;
  }

  /* LA VOZ EXACTA (2026-09-28): `atlas-voz.js` calcula con enteros los mismos bytes en cada
     aparato. Se carga al pulsar (no pesa en la puerta del juego) y el SW la guarda para el modo
     sin red. Si no llega (sin red la primera vez), suena el oscilador y se dice que es aproximada. */
  function oye(t) {
    var V = window.AtlasVoz;
    if (V) {
      var v = V.oye(t, S.contexto());
      dice(v ? rellena(T('voz_exacta'), { h: v.huella.corta, n: v.partes.length }) : T('sonido_nd'));
      return;
    }
    var s = document.createElement('script');
    s.src = '/assets/atlas-voz.js';
    s.onload = function () { if (window.AtlasVoz) { oye(t); } else { s.onerror(); } };
    s.onerror = function () { dice(S.suena(S.vozDe(t)) ? T('voz_exacta_nd') : T('sonido_nd')); };
    document.head.appendChild(s);
  }

  /* --- invocar ------------------------------------------------------------ */
  function firma(obj) {
    if (!window.Identity) { return Promise.reject(new Error('sin identidad')); }
    return window.Identity.publica().then(function (pub) {
      obj.pseudonimo = window.Identity.quien(); obj.clave_publica = pub;
      return window.Identity.firmar(obj).then(function (f) { return { obj: obj, firma: f.firma }; });
    });
  }
  function sinIdentidad(e, reintenta) {
    var msg = String((e && e.message) || e || '');
    dice(/sin identidad/.test(msg) ? T('piloto_sin_id') : msg);
    if (!/sin identidad/.test(msg) || !window.Identity || !window.Identity.crear || R.caja.querySelector('.crear-id')) { return; }
    var b = boton(T('piloto_crear_id')); b.classList.add('crear-id');
    b.addEventListener('click', function () {
      b.disabled = true;
      window.Identity.crear().then(function () { b.remove(); reintenta(); }, function (x) { b.disabled = false; dice(String(x && x.message || x)); });
    });
    R.caja.appendChild(b);
  }
  function invoca(tc) {
    var i = ins(), TC = G.TCS[tc];
    if (!i || i.recursos.cobre < TC.coste.cobre || i.recursos.luz < TC.coste.luz) { dice(T('inc_falta')); return; }
    n += 1;
    firma({ esquema: 'atlas.invocacion/1', tc: tc, ciclo: i.ciclo, n: n }).then(function (r) {
      return A.semillaWeb(r.firma).then(function (semilla) {
        var ev = window.AtlasJuego.invoca(TC.coste);
        if (!ev || ev.resultado !== 'ok') { dice(T('inc_falta')); return; }
        huevos.push({ tc: tc, semilla: semilla, desde: i.ciclo, hasta: i.ciclo + TC.incuba });
        S.suena('pop', calor());
        dice(rellena(T('inc_hecha'), { tc: T(tc) }));
        pinta();
      });
    }).catch(function (e) { sinIdentidad(e, function () { invoca(tc); }); });
  }

  /* --- el nido, la eclosion y el army ------------------------------------ */
  function pintaNido() {
    var i = ins(), c = i ? i.ciclo : 0;
    while (R.nido.firstChild) { R.nido.removeChild(R.nido.firstChild); }
    if (!huevos.length) { R.nido.appendChild(el('li', 'atlas-nota', T('nido_vacio'))); return; }
    huevos.forEach(function (h) {
      var li = el('li'), p = Math.min(100, Math.floor((c - h.desde) * 100 / (h.hasta - h.desde)));
      var cv = lienzo(72, T('huevo_aria'));
      li.appendChild(cv);
      li.appendChild(el('span', null, rellena(T('huevo'), { tc: T(h.tc), p: Math.max(0, p) })));
      R.nido.appendChild(li);
      traza(cv, G.HUEVO, 'huevo', quieto() ? 1 : 1 + 0.06 * Math.sin(c));
    });
  }
  function eclosiona(h) {
    var t = G.tirada(h.semilla, h.tc);
    eclosionada = t;
    while (R.eclosion.firstChild) { R.eclosion.removeChild(R.eclosion.firstChild); }
    R.eclosion.hidden = false;
    var f = ficha(t, 168), cv = f.querySelector('canvas');
    R.eclosion.appendChild(el('p', 'atlas-dlg-placa', T('forjada')));
    R.eclosion.appendChild(f);
    var ul = el('ul', 'atlas-stats');
    G.STATS.forEach(function (k) { if (t.stats[k]) { ul.appendChild(el('li', null, T('st_' + k) + ' ' + t.stats[k])); } });
    R.eclosion.appendChild(ul);
    R.eclosion.appendChild(el('p', 'atlas-medido', T('huevo_rack')));
    var si = boton(T('adoptar')), no = boton(T('soltar_tropa'));
    si.addEventListener('click', function () { adopta(t, si); });
    no.addEventListener('click', function () { eclosionada = null; R.eclosion.hidden = true; dice(T('tropa_suelta')); });
    var m = el('p', 'atlas-dlg-mandos'); m.appendChild(no); m.appendChild(si);
    R.eclosion.appendChild(m);
    S.suena('eclosion', calor());
    /* La revelacion a pantalla central (summon_reveal.js), si la casa la cargo. */
    if (window.AtlasRevela) { window.AtlasRevela.muestra(t); }
    if (quieto()) { return; }
    var k = 0;
    (function morfa() {
      k += 1;
      traza(cv, G.mezcla(G.HUEVO, t.armonicos, Math.min(1, k / 40)), t.rareza);
      if (k < 40) { requestAnimationFrame(morfa); }
    })();
  }
  function adopta(t, b) {
    b.disabled = true;
    firma(A.adopcion(t, '', '')).then(function (r) {
      return army.adopta(r.obj, r.firma).then(function (u) {
        eclosionada = null; R.eclosion.hidden = true;
        S.suena('adopcion', calor());
        dice(rellena(T('adoptada'), { f: u.firma.slice(8, 20) + '…' }));
        pintaArmy();
        /* Su voz entra en tu base del mapa ya, no a los 5 ciclos (`atlas-mapa.js` escucha). */
        document.dispatchEvent(new CustomEvent('atlas:tropa'));
      });
    }).catch(function (e) {
      b.disabled = false;
      if (/sin identidad/.test(String(e && e.message))) { sinIdentidad(e, function () { adopta(t, b); }); }
      else { dice(T('adopcion_no') + ' ' + (e && e.message)); }
    });
  }
  function pintaArmy() {
    while (R.army.firstChild) { R.army.removeChild(R.army.firstChild); }
    var l = army.lista();
    if (!l.length) { R.army.appendChild(el('li', 'atlas-nota', T('army_vacio'))); return; }
    l.forEach(function (u) { var li = el('li'); li.appendChild(ficha(u.adopcion.tropa, 64)); R.army.appendChild(li); });
  }
  function pinta() {
    var i = ins();
    R.tcs.forEach(function (x) {
      x.b.disabled = !i || i.recursos.cobre < x.c.cobre || i.recursos.luz < x.c.luz;
    });
    pintaNido();
  }
  function tic() {
    if (!capa || !capa.open || document.hidden) { return; }
    var i = ins(), c = i ? i.ciclo : 0;
    if (!eclosionada) {
      var listo = huevos.filter(function (h) { return c >= h.hasta; })[0];
      if (listo) { huevos.splice(huevos.indexOf(listo), 1); eclosiona(listo); }
    }
    pinta();
  }

  function monta(c) {
    G = window.AtlasGacha; A = window.AtlasArmy; S = window.AtlasSintesis;
    var zona = document.getElementById('atlas-juego');
    if (!G || !A || !S || !zona || zona.querySelector('.atlas-incubadora')) { return; }
    capa = c; army = A.crea(A.verificaWeb, A.almacenWeb ? A.almacenWeb() : null);
    var s = el('section', 'panel atlas-incubadora');
    s.appendChild(el('h4', null, T('inc_h')));
    s.appendChild(el('p', 'atlas-nota', T('inc_nota')));
    s.appendChild(el('p', 'atlas-medido', T('vrf_nota')));
    s.appendChild(el('p', 'atlas-casa', rellena(T('provisional'), { v: G.VERSION_VALORES })));
    R.caja = el('div', 'atlas-inc-mandos');
    R.sonido = boton(T('sonido')); R.sonido.setAttribute('aria-pressed', 'false');
    R.sonido.addEventListener('click', function () {
      var on = R.sonido.getAttribute('aria-pressed') !== 'true';
      on = S.activa(on); R.sonido.setAttribute('aria-pressed', String(on));
      if (on) { S.suena('huevo', calor()); } else { dice(T('sonido_nd')); }
    });
    R.caja.appendChild(R.sonido);

    /* MOVIMIENTO 0 - M17: Interruptor calidad Auto/Max/Med/Luz */
    var MODOS_CALIDAD = ['auto','maxima','media','luz'];
    R.calidadBoton = boton(T('calidad_auto'));
    R.calidadBoton.setAttribute('aria-pressed','false');
    R.calidadBoton.setAttribute('aria-label',T('calidad_desc'));
    R.calidadBoton.addEventListener('click',function(){var m=getCalidadModo(),i=(MODOS_CALIDAD.indexOf(m)+1)%4;setCalidadModo(MODOS_CALIDAD[i]);actualizaBotonCalidad();dice(rellena(T('calidad_cambiada'),{modo:T('calidad_'+MODOS_CALIDAD[i])}))});
    R.caja.appendChild(R.calidadBoton);
    function getCalidadModo(){return window.AtlasCalidad?window.AtlasCalidad.modo:'auto'}
    function getCalidadNivel(){var m=getCalidadModo();if(m==='manual')return window.AtlasCalidad?window.AtlasCalidad.nivel:2;if(m==='maxima')return 2;if(m==='media')return 1;if(m==='luz')return 0;if(window.AtlasOnda&&window.AtlasOnda.medidor){var med=window.AtlasOnda.medidor();return med.nivel(2)}return 2}
    function initCalidad(){var db=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;if(!db){setCalidadModo('auto');actualizaBotonCalidad();return}var r=db.open('atlas',1);r.onerror=function(){setCalidadModo(navigator.hardwareConcurrency>=8&&navigator.deviceMemory>=8?'maxima':'auto');actualizaBotonCalidad()};r.onsuccess=function(e){var db=e.target.result,tx=db.transaction(['calidad'],'readonly'),s=tx.objectStore('calidad'),g=s.get('config');g.onerror=function(){setCalidadModo('auto');actualizaBotonCalidad()};g.onsuccess=function(e){var d=e.target.result;setCalidadModo(d?d.modo:'auto');actualizaBotonCalidad()}};r.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains('calidad'))db.createObjectStore('calidad')}}
    function setCalidadModo(m){if(!window.AtlasCalidad)window.AtlasCalidad={modo:m,nivel:2};else window.AtlasCalidad.modo=m;try{var db=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;if(db){var r=db.open('atlas',1);r.onerror=function(){};r.onsuccess=function(e){var db=e.target.result,tx=db.transaction(['calidad'],'readwrite'),s=tx.objectStore('calidad');s.put({id:'config',modo:m,nivel:2})}}}catch(e){}}
    function actualizaBotonCalidad(){var m=getCalidadModo();R.calidadBoton.textContent=T('calidad_'+m);R.calidadBoton.setAttribute('aria-pressed',m!=='auto'?'true':'false')}
    R.tcs = Object.keys(G.TCS).map(function (tc) {
      var co = G.TCS[tc].coste;
      var b = boton(T(tc) + ' · ' + rellena(T('inc_coste'), { cobre: co.cobre, luz: co.luz }));
      b.addEventListener('click', function () { invoca(tc); });
      R.caja.appendChild(b);
      return { b: b, c: co };
    });
    s.appendChild(R.caja);
    /* LAS ODDS, A LA VISTA (addendum de la cria: sin odds ocultas): las mismas cifras enteras que usa la
       tirada (`gacha.odds`), por mil y escritas como porcentaje exacto con dos decimales. */
    var od = el('ul', 'atlas-odds');
    Object.keys(G.TCS).forEach(function (tc) {
      var o = G.odds(tc);
      od.appendChild(el('li', null, T(tc) + ' · ' + G.RAREZAS.map(function (r, i) {
        return T('rar_' + r) + ' ' + Math.floor(o[i] / 10) + '.' + (o[i] % 10) + '0%';
      }).join(' · ')));
    });
    s.appendChild(el('h5', null, T('odds_h')));
    s.appendChild(od);
    R.estado = el('p', 'atlas-vivo'); R.estado.setAttribute('role', 'status'); s.appendChild(R.estado);
    s.appendChild(el('h5', null, T('nido_h')));
    R.nido = el('ul', 'atlas-nido'); s.appendChild(R.nido);
    R.eclosion = el('div', 'atlas-eclosion'); R.eclosion.hidden = true; s.appendChild(R.eclosion);
    s.appendChild(el('h5', null, T('army_h')));
    R.army = el('ul', 'atlas-army'); s.appendChild(R.army);
    zona.appendChild(s);
    pinta(); pintaArmy();
    /* MOVIMIENTO 0 - M17: Inicializar calidad */
    initCalidad();
    /* El army guardado en este aparato vuelve re-verificado (C1); lo que no verifica se dice. */
    if (army.restaura) {
      army.restaura().then(function (r) {
        pintaArmy();
        if (r.fuera.length) { dice(rellena(T('army_fuera'), { n: r.fuera.length, m: r.fuera[0] })); }
      });
    }
    reloj = setInterval(tic, window.AtlasMotor.CICLO_MS);
  }

  window.AtlasIncubadora = { monta: monta, army: function () { return army && army.lista(); } };
})();
