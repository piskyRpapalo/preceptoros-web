/* preceptoros.org · theGame · los DUELOS entre personas, en la Arena (sugerencias firmadas por el
   Soberano, 2026-09-28: «PvP entre dos telefonos sin servidor», «regla de abandono en ciclos», «guardar
   los duelos a medias en el aparato» y «el paquete por QR, cara a cara»).

   La logica es pura y esta probada en node (`duelo.js`, `libreta.js`, `enlace.js`, `qr.js`); aqui solo la
   mano que la mueve. Cada paso produce un PAQUETE firmado que la persona manda por el canal que elija:
   «Send…», «Copy», «Download» o un QR con un ENLACE a esta web (el paquete va en el fragmento `#`, que
   ningun navegador manda al servidor). Quien lo recibe lo abre: se VERIFICA cada firma antes de tocar nada.

   GUARDAR: la libreta se guarda en ESTE aparato (IndexedDB, base propia `atlas-duelos`) en cada paso que
   la persona pulsa, y mientras espera; al volver, se VERIFICA entera antes de creerla. Cada paso va por
   turnos entre pestanas (Web Locks): antes de firmar se relee lo guardado, para no firmar dos veces el
   mismo `seq` desde dos pestanas (eso seria una prueba de trampa contra uno mismo).

   Firma con `Identity.firmarTexto`, verifica con WebCrypto (`AtlasArmy.verificaWeb`), el azar del
   commit-reveal sale de `crypto.getRandomValues`. Sin clave, NO_DATA con su salida. Ningun envio solo. */
(function () {
  'use strict';

  var Du = window.AtlasDuelo, E = window.AtlasEnlace, V = window.AtlasValores;
  var R = {}, cli = null, miPub = '', version = 0, reloj = 0, tic = 0, BASE = 'atlas-duelos', ALM = 'libreta', CLAVE = 'duelos';

  function T(k) { return window.AtlasArenaUI ? window.AtlasArenaUI.texto(k) : ''; }
  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto, clase) { var b = el('button', clase || 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function dice(t) { if (R.estado) { R.estado.textContent = t; } }
  function hex(n) {
    var b = new Uint8Array(n);
    window.crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function ciclo() { var i = window.AtlasJuego && window.AtlasJuego.instantanea(); return i ? i.ciclo : 0; }

  /* deflate-raw del navegador; sin el, el QR va sin comprimir (mas grande) y un enlace comprimido es NO_DATA. */
  function flujo(Clase) {
    try { new Clase('deflate-raw'); } catch (x) { return null; }
    return function (u8) {
      return new Response(new Blob([u8]).stream().pipeThrough(new Clase('deflate-raw'))).arrayBuffer()
        .then(function (b) { return new Uint8Array(b); });
    };
  }
  var comprime = window.CompressionStream ? flujo(window.CompressionStream) : null;
  var descomprime = window.DecompressionStream ? flujo(window.DecompressionStream) : null;

  /* LA BASE DEL APARATO: un unico registro { version, g }. */
  function base(modo, hacer) {
    if (!window.indexedDB) { return Promise.reject(new Error('sin IndexedDB')); }
    return new Promise(function (ok, mal) {
      var r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ALM); };
      r.onerror = function () { mal(r.error); };
      r.onsuccess = function () {
        var d = r.result, tx = d.transaction(ALM, modo), q = hacer(tx.objectStore(ALM));
        tx.oncomplete = function () { d.close(); ok(q && q.result); };
        tx.onerror = function () { d.close(); mal(tx.error); };
      };
    });
  }
  function lee() { return base('readonly', function (s) { return s.get(CLAVE); }); }
  function guarda() {
    if (!cli) { return Promise.resolve(); }
    return lee().then(function (x) {
      if (x && x.version !== version) { return; }   // otra pestana fue por delante: no se pisa
      version += 1;
      return base('readwrite', function (s) { return s.put({ version: version, g: cli.vuelca() }, CLAVE); });
    }).catch(function () { dice(T('duelo_nd_idb')); });
  }

  function nuevo(pub) {
    var I = window.Identity;
    return Du.crea({ pub: pub, pseudonimo: I.quien(), contenido_v: window.AtlasMotor.CATALOGO.contenido_v,
                     firma: function (t) { return I.firmarTexto(t); }, verifica: window.AtlasArmy.verificaWeb,
                     azar: function () { return hex(32); }, azar32: function () { return hex(16); }, ciclo: ciclo });
  }
  /* Si lo guardado va por delante de lo que tiene esta pestana, se vuelve a cargar (y a verificar). */
  function recarga() {
    return lee().catch(function () { return null; }).then(function (x) {
      if (!x || x.version === version) { return cli; }
      var c = nuevo(miPub);
      return c.carga(x.g).then(function (r) {
        cli = c; version = x.version;
        if (r.fuera.length) { dice(rellena(T('duelo_nd_guardado'), { m: r.fuera.join(' · ') })); }
        if (window.AtlasArenaUI) { window.AtlasArenaUI.ponJugadores(cli.defensas()); }
        return cli;
      }, function (e) { dice(rellena(T('duelo_nd_guardado'), { m: e.message })); return cli; });
    });
  }

  /* El cliente nace con la identidad y con lo guardado: sin clave no hay firma, y se dice. */
  function cliente() {
    if (cli) { return recarga(); }
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) { return Promise.reject(new Error(T('duelo_nd_id'))); }
    return I.publica().then(function (pub) {
      if (!cli) { miPub = pub; cli = nuevo(pub); version = 0; }
      return recarga();
    });
  }
  /* Un paso, por turnos entre pestanas: releer, hacer, guardar. */
  function turno(hacer) {
    var L = navigator.locks, paso = function () {
      return cliente().then(hacer).then(function (x) { return guarda().then(function () { return x; }); });
    };
    return L && L.request ? L.request(BASE, paso) : paso();
  }

  function qr(texto) {
    var q = window.AtlasQR.matriz(texto, 'L'), b = 4, n = q.n + 2 * b, dpr = window.devicePixelRatio || 1;
    var esc = Math.max(1, Math.floor(Math.min(360, window.innerWidth - 48) * dpr / n)), c = el('canvas', 'atlas-qr');
    c.width = c.height = n * esc; c.style.width = c.style.height = (n * esc / dpr) + 'px';
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (var i = 0; i < q.m.length; i++) { if (q.m[i]) { g.fillRect((i % q.n + b) * esc, (Math.floor(i / q.n) + b) * esc, esc, esc); } }
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', T('duelo_qr_aria'));
    return c;
  }

  /* COMPARTIR un paquete: por el canal que elija la persona, nunca solo. */
  function comparte(p, nombre, aviso) {
    var texto = JSON.stringify(p, null, 1) + '\n';
    R.salida.textContent = '';
    R.salida.appendChild(el('p', 'atlas-nota', rellena(aviso, { f: nombre })));
    var fila = el('div', 'atlas-arena-mandos'), f = typeof File === 'function' ? new File([texto], nombre, { type: 'application/json' }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      var s = boton(T('duelo_enviar'));
      s.addEventListener('click', function () {
        navigator.share({ files: [f], title: nombre }).then(function () { dice(T('duelo_enviado')); }, function () {});
      });
      fila.appendChild(s);
    }
    var copia = function (t, ok) {
      navigator.clipboard.writeText(t).then(function () { dice(T(ok)); }, function () { dice(T('duelo_nd_copiar')); });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var c = boton(T('duelo_copiar'), 'boton-sec');
      c.addEventListener('click', function () { copia(texto, 'duelo_copiado'); });
      fila.appendChild(c);
    }
    var a = el('a', 'boton-sec', T('duelo_bajar'));
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' })); a.download = nombre;
    fila.appendChild(a);
    var bq = boton(T('duelo_qr'), 'boton-sec');
    bq.addEventListener('click', function () {
      E.aEnlace(p, comprime).then(function (h) {
        var url = location.origin + location.pathname + h, caja = el('div', 'atlas-qr-caja');
        caja.appendChild(qr(url));
        caja.appendChild(el('p', 'atlas-nota', T('duelo_qr_nota')));
        if (navigator.clipboard && navigator.clipboard.writeText) {
          var ce = boton(T('duelo_enlace'), 'boton-sec');
          ce.addEventListener('click', function () { copia(url, 'duelo_enlace_ok'); });
          caja.appendChild(ce);
        }
        bq.replaceWith(caja);
      }).catch(function (e) { dice(rellena(T('duelo_mal'), { m: e.message })); });
    });
    fila.appendChild(bq);
    R.salida.appendChild(fila);
  }

  function juega(x, yo) {
    if (window.AtlasArenaUI) {
      window.AtlasArenaUI.juega(x.defensa.cuerpo.tropas, x.asalto.tropas, x.combate,
                                { titulo: T('duelo_h'), yo: yo, semilla: x.resultado.semilla });
    }
  }
  function falla(e) { dice(rellena(T('duelo_mal'), { m: (e && e.message) || '' })); }

  function publica() {
    var sq = window.AtlasArenaUI ? window.AtlasArenaUI.escuadra() : [];
    if (!sq.length) { dice(T('arena_vacia')); return; }
    turno(function (c) { return c.publica(sq); }).then(function (p) {
      comparte(p, 'atlas-defense.json', T('duelo_publicada')); pinta();
    }).catch(falla);
  }
  function reta(huella, sq) {
    turno(function (c) { return c.reta(huella, sq); }).then(function (x) {
      comparte(x.paquete, 'atlas-challenge.json', T('duelo_reto_hecho')); pinta();
    }).catch(falla);
  }
  function importa(p) {
    return turno(function (c) { return c.importa(p); }).then(function (x) {
      if (x.tipo === 'defensa') {
        if (window.AtlasArenaUI) { window.AtlasArenaUI.ponJugadores(cli.defensas()); }
        dice(rellena(T('duelo_ok_defensa'), { p: x.sobre.pseudonimo }));
      } else if (x.tipo === 'desafio') { dice(rellena(T('duelo_recibido'), { p: x.de })); }
      else if (x.tipo === 'respuesta') { dice(rellena(T('duelo_respondido'), { p: x.de })); }
      else if (x.tipo === 'revelacion') { juega(x, 0); dice(T('duelo_visto')); }
      else { dice(T('duelo_abandono_ok')); }
      if (R.pega) { R.pega.value = ''; }
      pinta();
    }).catch(falla);
  }
  /* ABRIR UN ENLACE (`#thegame/duelo=…`): se descomprime aqui, se verifica en `duelo.js`, y el fragmento
     se borra de la barra en cuanto entra. */
  function desdeEnlace() {
    var h = location.hash;
    if (!E.esEnlace(h)) { return; }
    cliente().then(function (c) {
      if (h.charAt(E.PREFIJO.length) === 'z' && !descomprime) { throw new Error(T('duelo_nd_enlace')); }
      return E.deEnlace(h, descomprime, c.mia());
    }).then(function (p) {
      if (history.replaceState) { history.replaceState(null, '', location.pathname + location.search + '#thegame'); }
      return importa(p);
    }).catch(falla);
  }
  function accion(d) {
    turno(function (c) {
      if (d.fase === 'recibido') { return c.acepta(d.sesion).then(function (p) { return { p: p }; }); }
      if (d.fase === 'revelar') { return c.revela(d.sesion); }
      if (d.fase === 'espera') { return c.abandona(d.sesion); }
    }).then(function (x) {
      if (!x) { return; }
      if (d.fase === 'recibido') { comparte(x.p, 'atlas-answer.json', T('duelo_aceptado')); }
      else if (d.fase === 'revelar') { juega(x, 1); comparte(x.paquete, 'atlas-reveal.json', T('duelo_revelado')); }
      else { comparte(x.paquete, 'atlas-claim.json', T('duelo_reclamado')); }
      pinta();
    }).catch(falla);
  }
  function olvida() {
    base('readwrite', function (s) { return s.delete(CLAVE); }).then(function () {
      cli = null; version = 0; dice(T('duelo_olvidados')); pinta();
    }).catch(function () { dice(T('duelo_nd_idb')); });
  }

  /* La lista de duelos y el rating local; el plazo de abandono corre en ciclos de juego. */
  function pinta() {
    if (!R.lista) { return; }
    R.lista.textContent = ''; R.rating.textContent = '';
    if (!cli) { return; }
    cli.duelos().forEach(function (d) {
      var li = el('li'), txt = rellena(T('duelo_fase_' + d.fase), { p: d.de || '' });
      if (d.fase === 'espera') { txt += ' · ' + rellena(T('duelo_plazo'), { c: cli.plazo(d.sesion) }); }
      li.appendChild(el('span', null, txt));
      var k = { recibido: 'duelo_acepta', revelar: 'duelo_revela', espera: 'duelo_abandono' }[d.fase];
      if (k) {
        var b = boton(T(k), 'boton-sec');
        if (d.fase === 'espera' && cli.plazo(d.sesion) > 0) { b.disabled = true; }
        b.addEventListener('click', function () { accion(d); });
        li.appendChild(b);
      }
      R.lista.appendChild(li);
    });
    var r = cli.rating();
    R.rating.textContent = rellena(T('duelo_rating'), { r: r.rating, n: r.partidas,
      prov: r.partidas < V.combate.provisional_hasta ? T('duelo_prov') : '' });
  }

  function monta(zona) {
    if (!zona || zona.querySelector('.atlas-duelos')) { return; }
    var s = el('div', 'atlas-duelos');
    s.appendChild(el('h5', null, T('duelo_h')));
    s.appendChild(el('p', 'atlas-nota', T('duelo_nota')));
    var m = el('div', 'atlas-arena-mandos');
    var pb = boton(T('duelo_publica')); pb.addEventListener('click', publica); m.appendChild(pb);
    s.appendChild(m);
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) {
      var nd = el('p', 'no-data', T('duelo_nd_id')), cr = boton(T('arena_crear_id'), 'boton-sec');
      cr.addEventListener('click', function () {
        Promise.resolve(I && I.crear && I.crear()).then(function () {
          nd.remove(); cr.remove(); dice(T('duelo_con_id')); cliente().then(pinta, function () {}); desdeEnlace();
        });
      });
      s.appendChild(nd); s.appendChild(cr);
    }
    var imp = el('details', 'atlas-duelo-importa');
    imp.appendChild(el('summary', null, T('duelo_importa')));
    R.pega = el('textarea'); R.pega.rows = 3; R.pega.setAttribute('aria-label', T('duelo_pega')); R.pega.placeholder = T('duelo_pega');
    imp.appendChild(R.pega);
    var fila = el('div', 'atlas-arena-mandos');
    var ab = boton(T('duelo_abre'), 'boton-sec');
    ab.addEventListener('click', function () { if (R.pega.value.trim()) { importa(R.pega.value); } });
    var fi = el('input'); fi.type = 'file'; fi.accept = 'application/json,.json'; fi.setAttribute('aria-label', T('duelo_fichero'));
    fi.addEventListener('change', function () { if (fi.files[0]) { fi.files[0].text().then(importa); fi.value = ''; } });
    fila.appendChild(ab); fila.appendChild(fi); imp.appendChild(fila);
    s.appendChild(imp);
    R.estado = el('p', 'atlas-vivo'); R.estado.setAttribute('role', 'status'); s.appendChild(R.estado);
    R.salida = el('div', 'atlas-duelo-salida'); s.appendChild(R.salida);
    R.lista = el('ul', 'atlas-duelo-lista'); s.appendChild(R.lista);
    R.rating = el('p', 'atlas-medido'); s.appendChild(R.rating);
    var gu = el('div', 'atlas-arena-mandos');
    gu.appendChild(el('p', 'atlas-nota', window.indexedDB ? T('duelo_guardados') : T('duelo_nd_idb')));
    var ol = boton(T('duelo_olvida'), 'boton-sec'); ol.addEventListener('click', olvida); gu.appendChild(ol);
    s.appendChild(gu);
    zona.appendChild(s);
    /* Lo guardado entra solo si hay clave, y verificado; el reloj de espera se guarda al irse. */
    if (I && I.quien && I.quien()) { cliente().then(pinta, function () {}); }
    desdeEnlace();
    window.addEventListener('hashchange', desdeEnlace);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { guarda(); } });
    clearInterval(reloj);
    reloj = setInterval(function () {
      if (zona.offsetParent !== null && cli) { pinta(); }
      if (cli && ++tic % 15 === 0 && cli.duelos().some(function (d) { return d.fase === 'espera'; })) { guarda(); }
    }, 2000);
  }

  window.AtlasDueloUI = { monta: monta, reta: reta, importa: importa };
})();
