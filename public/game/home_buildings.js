/* preceptoros.org · theGame · TU CASA ES TU CANGREJO: sus partes son botones, con su estado MEDIDO.

   LA CASA ES LA PRIMERA PANTALLA (Soberano, 2026-10-05). Desde R2 (plan «el refresco», 2026-10-11) la
   rejilla de edificios DESAPARECE: los edificios son el CUERPO del cangrejo, que crece con el tiempo de
   partida y las unidades (y baja si bajan). Caparazon = Nucleo y pinzas = Army (abren el TALLER, con tus
   ondas y sus stats), patas = Bosque (abre la expedicion aqui mismo) y ojos = Faro (abren el MAPA). Cada
   parte es un BOTON del DOM puesto en el ancla que devuelve su dibujo (`home_base_scene.js`): nombre, foco
   de teclado y lector de pantalla. Su cifra sale del ESTADO del juego (`AtlasJuego.instantanea`, el Army
   de la incubadora, las cedulas medidas); lo no medido dice NO_DATA y esa parte se dibuja en niebla.

   DENTRO de las patas va la expedicion del Bosque, MOVIDA con sus referencias vivas: no se rehace la
   logica, se le da sitio.

   PERSONALIZAR (paleta, estilo del caparazon, variante del emblema; y la POSTURA de la casa:
   alianzas, comercio y lema) se guarda en ESTE aparato (IndexedDB `atlas-casa`) y, si se comparte,
   viaja FIRMADO. Sin datos personales: el lema rechaza lo que parezca correo, URL, ruta, IP o
   telefono. Y NO DA VENTAJA: nada de esto entra en `arena.combate` (`atlas/casa_casos.mjs`). */
(function (raiz) {
  'use strict';

  var ESQUEMA = 'atlas.casa/1';
  var OPCIONES = { paleta: ['abismo', 'coral', 'kelp', 'perla'], estilo: ['cupula', 'aguja', 'concha'], emblema: [0, 1, 2],
                   alianzas: ['abiertas', 'cerradas'], comercio: [true, false],
                   formacion: ['agresiva', 'defensiva', 'flanqueo'],
                   /* P10: la bandera, de la paleta cerrada de `valores.banderas` (null = sin bandera). */
                   bandera: [null, 'teal', 'ambar', 'hielo', 'violeta', 'coral', 'kelp', 'oro', 'rosa'] };
  var PROHIBIDO = /(^|[^0-9])\/[a-z]|@|https?:|www\.|\b\d{1,3}(\.\d{1,3}){3}\b|\d{6,}/i;
  function base() { return { esquema: ESQUEMA, paleta: 'abismo', estilo: 'cupula', emblema: 0, alianzas: 'abiertas', comercio: true, formacion: 'agresiva', lema: '', bandera: null }; }
  /* Una casa guardada antes de P10 no tiene bandera: entra con null (sin bandera), no se pierde. */
  function migra(c) { if (c && typeof c === 'object' && !('bandera' in c)) { c.bandera = null; } return c; }
  /* La forma de una casa: '' si vale, o la causa. Pura: la usan la web y los casos de node. */
  function forma(c) {
    if (!c || typeof c !== 'object' || c.esquema !== ESQUEMA) { return 'esquema'; }
    var k = Object.keys(c).sort().join();
    if (k !== Object.keys(base()).sort().join()) { return 'campos'; }
    for (var o in OPCIONES) { if (OPCIONES[o].indexOf(c[o]) < 0) { return o; } }
    if (typeof c.lema !== 'string' || c.lema.length > 32 || /[\u0000-\u001f<>]/.test(c.lema)) { return 'lema'; }
    if (PROHIBIDO.test(c.lema)) { return 'lema: sin datos personales (correo, URL, ruta, IP o telefono)'; }
    return '';
  }
  if (typeof module === 'object' && module.exports) { module.exports = { forma: forma, base: base, migra: migra, OPCIONES: OPCIONES, ESQUEMA: ESQUEMA }; return; }

  var K = raiz.AtlasCanon, G = raiz.AtlasGacha, S = raiz.AtlasCasaEscena, TX = null, R = {}, casa = base(), pub = null, escena = null;
  /* Las partes: [id, icono, a donde lleva, la cifra de `medidas()` que la explica]. */
  var PARTES = [['caparazon', '\u25C9', 'taller', 'nucleo'], ['pinzas', '\u2726', 'taller', 'army'], ['patas', '\u2E19', '', 'bosque'], ['ojos', '\u25C8', 'mapa', 'faro']];
  var DENTRO = { patas: '.atlas-dormias|.atlas-lema|.atlas-mapa|.atlas-izq' };

  function T(k) { return (TX && TX[k]) || k; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function boton(texto, clase) { var b = el('button', clase, texto); b.type = 'button'; return b; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }

  /* --- guardar en este aparato ------------------------------------------------------------------ */
  function db() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open('atlas-casa', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('casa'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { mal(r.error); };
    });
  }
  function lee() {
    return db().then(function (d) {
      return new Promise(function (ok) { var q = d.transaction('casa').objectStore('casa').get('mia'); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(null); }; });
    }).catch(function () { return null; });
  }
  function guarda() {
    if (forma(casa)) { return; }
    db().then(function (d) { d.transaction('casa', 'readwrite').objectStore('casa').put(casa, 'mia'); }).catch(function () {});
  }

  /* --- el estado medido de cada parte ----------------------------------------------------------- */
  function emblema() {
    if (!G || !K) { return null; }
    return G.tirada(K.sha('atlas.emblema/1:' + (pub || 'invitado') + (casa.emblema ? ':' + casa.emblema : '')), 'tc3').armonicos;
  }
  function estado() {
    var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null;
    return i ? { nucleo: i.nivel_nucleo, grieta: i.grieta && i.grieta.abierta, i: i } : { nucleo: 1, grieta: false, i: null };
  }
  /* EL CANGREJO (J1): tu semilla (tu clave publica; sin ella, la del visitante), el ciclo de juego,
     tu army y si un nodo te tiene LINKEADO en su cedula (coral) o no (cangrejo de mar). El latido del
     nodo no llega a la web: el brillo es NO_DATA (null), nunca un numero inventado. */
  function cangrejo() {
    var i = estado().i, C = raiz.AtlasNodosCedulas, m = medidas(), nodo = false, CJ = raiz.AtlasCangrejo;
    if (pub && C) {
      nodo = C.nodos.some(function (n) { return (n.dispositivos || []).some(function (d) { return d.clave_publica === pub && d.estado === 'linkeado'; }); });
    }
    function nv(k) { return m[k] ? m[k].nivel : null; }
    return { semilla: pub || 'visitante', ciclo: i ? i.ciclo : 0, army: m.army ? m.army.nivel : 0, nodo: nodo, latido: null,
             cuerpo: CJ ? CJ.cuerpo({ nucleo: nv('nucleo'), army: nv('army'), bosque: nv('bosque'), faro: nv('faro') }) : null };
  }
  function medidas() {
    var s = estado().i, ed = {}, inc = raiz.AtlasIncubadora, C = raiz.AtlasNodosCedulas, army = null;
    try { army = inc && inc.army ? (inc.army() || []).length : null; } catch (x) { army = null; }
    var nodos = C ? C.nodos.filter(function (n) { var m = n.aparato.medidas; return Object.keys(m).some(function (k) { return m[k].estado === 'MEDIDO'; }); }).length : null;
    ed.nucleo = s ? { nivel: s.nivel_nucleo, medido: true, txt: rellena(T('st_nucleo'), { n: s.nivel_nucleo }) } : null;
    ed.bosque = s ? { nivel: Math.floor(s.recursos.biomasa / 2), medido: true, txt: rellena(T('st_bosque'), { b: s.recursos.biomasa, o: s.recursos.oxigeno }) } : null;
    ed.army = army != null ? { nivel: army, medido: true, txt: rellena(T('st_army'), { n: army }) } : null;
    ed.faro = nodos != null ? { nivel: nodos, medido: true, txt: rellena(T('st_faro'), { n: nodos }) } : null;
    return ed;
  }
  function pintaPartes() {
    var ed = medidas();
    PARTES.forEach(function (e) {
      var b = R.b[e[0]], m = ed[e[3]];
      b.querySelector('.casa-st').textContent = m ? m.txt : 'NO_DATA';
      b.classList.toggle('sin-medida', !m);
      b.setAttribute('aria-label', T('parte_' + e[0]) + ' · ' + (m ? m.txt : T('nd_' + e[3])));
    });
  }
  /* Cada cuadro, la escena dice donde quedo cada parte (pixeles del lienzo). El boton va FUERA del cuerpo, en
     la direccion de su parte (el caparazon, encima): asi no tapa al cangrejo. `HACIA`: [dx, dy] en radios. */
  var HACIA = { caparazon: [0, -1.5], ojos: [1, -0.7], pinzas: [1.1, 0.35], patas: [-1.1, 0.35] };
  function anclas(an, W, H) {
    var cx = an ? an.caparazon[0] : 0, lado = an && an.pinzas[0] < cx ? -1 : 1, k = an ? Math.max(an.radio, 52) : 0;
    PARTES.forEach(function (e) {
      var b = R.b[e[0]], p = an && an[e[0]], h = HACIA[e[0]];
      b.hidden = !p;
      if (!p) { return; }
      var x = e[0] === 'caparazon' ? cx : cx + lado * h[0] * k, y = p[1] + h[1] * k * (e[0] === 'caparazon' ? 1 : 0.6);
      b.style.left = (Math.max(0.08, Math.min(0.92, x / W)) * 100).toFixed(1) + '%';
      b.style.top = (Math.max(0.1, Math.min(0.92, y / H)) * 100).toFixed(1) + '%';
    });
  }

  /* --- dentro de una parte ----------------------------------------------------------------------- */
  function entra(id) {
    var a = PARTES.filter(function (e) { return e[0] === id; })[0];
    if (a && a[2]) { if (raiz.TheGame && raiz.TheGame.ve) { raiz.TheGame.ve(a[2]); } return; }
    R.titulo.textContent = T('parte_' + id); R.cuerpo.textContent = '';
    DENTRO[id].split('|').forEach(function (s) { Array.prototype.forEach.call(R.alm.querySelectorAll(s), function (n) { R.cuerpo.appendChild(n); }); });
    R.dentro = id; R.int.hidden = false; R.esc.hidden = true; R.volver.focus();
  }
  function sale() {
    if (!R.dentro) { return; }
    Array.prototype.slice.call(R.cuerpo.children).forEach(function (n) { R.alm.appendChild(n); });
    var id = R.dentro; R.dentro = null; R.int.hidden = true; R.esc.hidden = false; R.b[id].focus();
  }

  /* --- personalizar ------------------------------------------------------------------------------ */
  function grupo(clave, valores, etiqueta) {
    var f = el('fieldset', 'casa-grupo'); f.appendChild(el('legend', null, T('p_' + clave)));
    valores.forEach(function (v) {
      var b = boton(etiqueta ? etiqueta(v) : T(clave + '_' + v), 'casa-op');
      b.setAttribute('aria-pressed', String(casa[clave] === v));
      b.addEventListener('click', function () {
        casa[clave] = v; guarda();
        Array.prototype.forEach.call(f.querySelectorAll('.casa-op'), function (o, i) { o.setAttribute('aria-pressed', String(valores[i] === v)); });
      });
      f.appendChild(b);
    });
    return f;
  }
  function personaliza() {
    var d = el('dialog', 'casa-pers'); d.setAttribute('aria-label', T('personaliza'));
    var fo = el('form'); fo.method = 'dialog';
    fo.appendChild(el('h3', null, T('personaliza')));
    fo.appendChild(grupo('paleta', OPCIONES.paleta)); fo.appendChild(grupo('estilo', OPCIONES.estilo));
    fo.appendChild(grupo('emblema', OPCIONES.emblema, function (v) { return T('emblema_n').replace('{n}', v + 1); }));
    fo.appendChild(grupo('alianzas', OPCIONES.alianzas)); fo.appendChild(grupo('comercio', OPCIONES.comercio));
    fo.appendChild(grupo('formacion', OPCIONES.formacion));
    fo.appendChild(grupo('bandera', OPCIONES.bandera, function (v) { return T('bandera_' + (v || 'ninguna')); }));
    var l = el('label', 'casa-lema', T('p_lema') + ' '), i = el('input'); i.maxLength = 32; i.value = casa.lema; l.appendChild(i); fo.appendChild(l);
    var nota = el('p', 'casa-nota', T('p_nota')); nota.setAttribute('role', 'status'); fo.appendChild(nota);
    i.addEventListener('change', function () {
      var viejo = casa.lema; casa.lema = i.value; var e = forma(casa);
      if (e) { casa.lema = viejo; nota.textContent = T('lema_no'); } else { nota.textContent = T('p_nota'); guarda(); }
    });
    var fila = el('div', 'casa-fila'), comp = boton(T('comparte'), 'boton-sec');
    comp.addEventListener('click', function () {
      var I = raiz.Identity;
      if (!I || !I.quien || !I.quien()) { nota.textContent = T('comparte_sin'); return; }
      I.firmar(casa).then(function (fz) { return I.publica().then(function (p) { return { casa: casa, firma: fz.firma, publica: p }; }); })
        .then(function (s) { return navigator.clipboard.writeText(JSON.stringify(s)); })
        .then(function () { nota.textContent = T('comparte_ok'); }, function (x) { nota.textContent = 'NO_DATA · ' + (x && x.message); });
    });
    var x = boton(T('cerrar'), 'boton'); x.type = 'submit';
    fila.appendChild(comp); fila.appendChild(x); fo.appendChild(fila); d.appendChild(fo);
    d.addEventListener('close', function () { d.remove(); });
    R.raiz.appendChild(d); d.showModal();
  }

  /* --- montar ------------------------------------------------------------------------------------ */
  function textos() {
    var l = (raiz.AtlasLengua && raiz.AtlasLengua.actual) || 'en';
    return fetch('/atlas-casa-' + l + '.json').then(function (r) { if (!r.ok) { throw new Error('atlas-casa-' + l + '.json ' + r.status); } return r.json(); })
      .then(function (d) { TX = d.ui; });
  }
  function monta(panel) {
    if (!panel || panel.querySelector('.casa')) { return Promise.resolve(); }
    return textos().then(function () { construye(panel); }, function (e) { panel.appendChild(el('p', 'no-data', 'NO_DATA · ' + e.message)); });
  }
  function construye(panel) {
    if (!document.getElementById('casa-hoja')) {
      var h = document.createElement('link'); h.id = 'casa-hoja'; h.rel = 'stylesheet'; h.href = '/game/home.css'; document.head.appendChild(h);
    }
    R.raiz = el('div', 'casa'); R.b = {};
    R.alm = el('div', 'casa-almacen'); R.alm.hidden = true;
    var tira = el('div', 'casa-tira');
    Array.prototype.slice.call(panel.children).forEach(function (n) {
      if (/atlas-cab|atlas-recursos|atlas-vivo|no-data/.test(n.className)) { tira.appendChild(n); } else { R.alm.appendChild(n); }
    });
    R.esc = el('div', 'casa-escena');
    R.lienzo = el('canvas', 'casa-lienzo'); R.lienzo.setAttribute('role', 'img'); R.lienzo.setAttribute('aria-label', T('aria'));
    R.esc.appendChild(R.lienzo);
    var al = R.alm.querySelector('.atlas-alerta'); if (al) { al.classList.add('casa-alerta'); R.esc.appendChild(al); }
    PARTES.forEach(function (e) {
      var b = boton('', 'casa-parte'); b.dataset.id = e[0];
      var ico = el('span', 'casa-ico', e[1]); ico.setAttribute('aria-hidden', 'true');
      b.appendChild(ico); b.appendChild(el('span', 'casa-nom', T('parte_' + e[0]))); b.appendChild(el('span', 'casa-st'));
      b.addEventListener('click', function () { entra(e[0]); });
      R.b[e[0]] = b; R.esc.appendChild(b);
    });
    var pers = boton('✦ ' + T('personaliza'), 'casa-pers-b'); pers.addEventListener('click', personaliza); R.esc.appendChild(pers);
    R.int = el('section', 'casa-interior'); R.int.hidden = true;
    var cab = el('div', 'casa-int-cab'); R.volver = boton('← ' + T('volver'), 'boton-sec'); R.volver.addEventListener('click', sale);
    R.titulo = el('h3'); cab.appendChild(R.volver); cab.appendChild(R.titulo); R.int.appendChild(cab);
    R.cuerpo = el('div', 'casa-int-cuerpo'); R.int.appendChild(R.cuerpo);
    R.raiz.appendChild(tira); R.raiz.appendChild(R.esc); R.raiz.appendChild(R.int); R.raiz.appendChild(R.alm);
    panel.appendChild(R.raiz);
    pintaPartes(); setInterval(pintaPartes, 1500);
    var I = raiz.Identity;
    (I && I.quien && I.quien() ? I.publica().then(function (k) { pub = k; }, function () {}) : Promise.resolve())
      .then(lee).then(function (g) { g = migra(g); if (g && !forma(g)) { casa = g; } });
    escena = S.crea(R.lienzo, { casa: function () { return { paleta: casa.paleta, estilo: casa.estilo, emblema: emblema() }; },
                                estado: estado, cangrejo: cangrejo, anclas: anclas });
  }

  /* Cambiar UNA opcion desde fuera (la formacion, desde la repeticion de la batalla). */
  function pon(k, v) { if (OPCIONES[k] && OPCIONES[k].indexOf(v) >= 0) { casa[k] = v; guarda(); } }
  /* Los textos de la familia de la casa (`atlas-casa-<l>.json`): tambien los del Taller y del Primer Eco, que
     viajan con ella para no engordar la puerta del juego (P9-P11). '' si aun no han llegado. */
  raiz.AtlasCasa = { texto: function (k) { return (TX && TX[k]) || ''; }, pon: pon, monta: monta, forma: forma, casa: function () { return casa; }, fps: function () { return escena && escena.fps(); },
                     calidad: function () { return escena && escena.calidad(); }, entra: entra, sale: sale, cangrejo: cangrejo };
})(this);
