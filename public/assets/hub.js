/* preceptoros.org · el cabezal y el panel Modelos.
 *
 * QUE CAMBIO EN LA PUERTA 6, Y POR QUE
 * ------------------------------------
 * Antes esto pintaba una rejilla de ocho tarjetas, la cola de firma y el rack,
 * todo en la portada. Se vio en produccion y era una pared de texto: lo que la
 * gente viene a hacer --hablar-- quedaba debajo de todo lo demas.
 *
 * Ahora el chat es el protagonista y lo demas se pide. El cabezal lleva cuatro
 * botones; los companeros viven en un panel que se abre por la derecha. Y el
 * RACK sale de la web publica entero: la telemetria del rack es del Soberano,
 * no de quien visita, y su sitio es el Ojo.
 *
 * DOS ORIGENES DE TEXTO, Y NO ES UN DESCUIDO
 * ------------------------------------------
 * Los rotulos cortos del cabezal salen del bloque #i18n de la portada (`T`),
 * que es donde el gate de paridad los vigila. Los textos largos del panel
 * viven en `hub.json` (`L`): meterlos en las tres portadas cuesta ~500 B en
 * cada una y `fr/index.html` no los tiene. Cada uno donde cabe.
 */
(function () {
  var cab = document.getElementById('cab-nav');
  var panel = document.getElementById('panel-modelos');
  var bloque = document.getElementById('i18n');
  if (!cab || !panel || !bloque) return;
  var T = JSON.parse(bloque.textContent);
  var L = {}, DATOS = null;

  var ceder = (window.scheduler && window.scheduler.yield)
    ? function () { return window.scheduler.yield(); }
    : function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  function ligero() {
    var c = navigator.connection || {};
    return !!c.saveData ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      (window.matchMedia && matchMedia('(prefers-reduced-data:reduce)').matches);
  }
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  function enlace(clase, texto, href) {
    var a = el('a', clase, texto); a.href = href; return a;
  }

  /* --- el cabezal, sincrono ---------------------------------------------
     Se construye antes de pedir nada: una cabecera que aparece medio segundo
     tarde se lee como una pagina rota.

     CUATRO ENLACES Y NADA MAS (2026-09-01). Antes habia SIETE botones, y en
     el Doogee ocupaban tres filas: el cabezal se comia el 40 % del alto y el
     chat --que es a lo que se viene-- empezaba casi fuera de vista. Se midio
     en el telefono, no en un viewport emulado.

     Los tres que se van NO se borran, se mudan:
       MODELOS   -> el rail de companeros ya se abre solo; el boton sobraba.
       COLA      -> baja al panel lateral, que es donde vive la cola.
       PROBADOR  -> fuera del cabezal hasta que se decida si merece la pena.
     `playground.html` sigue existiendo y sigue enlazada desde el pie. */
  cab.appendChild(enlace('cab-boton', T.cabHome, './'));
  cab.appendChild(enlace('cab-boton empezar', T.cabEmpezar, './onboarding.html'));
  cab.appendChild(enlace('cab-boton', T.cabComunidad, './board.html'));
  cab.appendChild(enlace('cab-boton', T.cabBenchmark, './benchmark.html'));
  /* IDIOMA va COLOREADO como los demas. Suelto en `cab-leve` parecia una
     nota al pie, y no lo es: elegir idioma es el primer paso del recorrido
     --se abre la pagina, se elige idioma, se habla--. Lleva su propio tono
     para que se lea como puerta y no como seccion. */
  cab.appendChild(enlace('cab-boton idioma', T.cabIdioma, '/'));

  /* Los enlaces de identidad publica van AQUI y en ningun otro sitio de la
     pagina. Repetirlos en el pie no es redundancia inofensiva: son la unica
     forma de comprobar quien firma esto, y dos copias divergen.

     Van como ICONO y no como palabra: «GITHUB LINKEDIN» en mayusculas pesaba
     como dos botones mas en la fila y competia con la navegacion. El nombre
     sigue estando, en `aria-label` y en `title`, que es donde lo necesita
     quien no ve el dibujo. */
  var ident = document.getElementById('cab-ident');
  var MARCAS = {
    GitHub: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"'
      + ' aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47'
      + ' 7.59,.4,.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94'
      + '-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82'
      + '.72 1.21 1.87.87 2.33,.66,.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95'
      + ' 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42'
      + ' 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16'
      + ' 1.92.08 2.12,.51,.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95,.29,.25.54.73'
      + '.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15,.46,.55.38A8.01 8.01 0 0 0 16 8'
      + 'c0-4.42-3.58-8-8-8z"/></svg>',
    LinkedIn: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"'
      + ' aria-hidden="true"><path d="M0 1.15C0 .51.53 0 1.18 0h13.64C15.47 0 16 .51'
      + ' 16 1.15v13.7c0 .64-.53 1.15-1.18 1.15H1.18C.53 16 0 15.49 0 14.85V1.15zM4.94'
      + ' 13.39V6.17H2.54v7.22h2.4zM3.74 5.18c.84 0 1.36-.55 1.36-1.24-.02-.7-.52-1.24'
      + '-1.34-1.24-.82 0-1.36.54-1.36 1.24 0 .69.52 1.24 1.32 1.24h.02zm2.53 8.21h2.4'
      + 'V9.36c0-.21.02-.43.08-.58.17-.43.56-.88 1.21-.88.85 0 1.19.65 1.19 1.6v3.89h2.4'
      + 'V9.22c0-2.22-1.18-3.25-2.76-3.25-1.29 0-1.86.71-2.18 1.2v.03h-.02l.02-.03V6.17'
      + 'h-2.4c.03.68 0 7.22 0 7.22h.06z"/></svg>'
  };
  function marca(nombre, href) {
    var a = document.createElement('a');
    a.className = 'cab-marca'; a.href = href;
    a.innerHTML = MARCAS[nombre];
    a.setAttribute('aria-label', nombre);
    a.title = nombre;
    return a;
  }

  /* --- el panel Modelos --------------------------------------------------- */
  function hueso(c) { return el('div', 'hueso ' + c); }
  function esqueleto() {
    var g = el('div', 'modelos');
    for (var i = 0; i < 8; i++) {
      var t = el('div', 'modelo esqueleto');
      t.appendChild(hueso('esfera'));
      t.appendChild(hueso('corto')); t.appendChild(hueso('largo'));
      g.appendChild(t);
    }
    return g;
  }
  function tarjeta(a, sinImagen) {
    var b = el('button', 'modelo');
    b.type = 'button'; b.dataset.agente = a.id;
    if (!sinImagen && a.icono3d) {
      var img = document.createElement('img');
      img.src = '/assets/agente-3d-' + a.icono3d + '.webp';
      img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.width = 56; img.height = 56;
      b.appendChild(img);
    } else {
      b.appendChild(el('span', 'modelo-inicial', (a.name || '?').replace(/^El /, '')[0]));
    }
    b.appendChild(el('span', 'modelo-nombre', a.name));
    b.appendChild(el('span', 'modelo-spec', a.function));
    var r = a.real || {};
    b.appendChild(el('span', 'modelo-real ' + (r.disponible ? 'sirve' : 'no-sirve'),
      r.disponible ? L.hubDisponible : L.hubSinAdaptador));
    return b;
  }
  function pintaPanel() {
    panel.innerHTML = '';
    panel.appendChild(el('h2', 'panel-titulo', L.hubTitulo));
    // El rotulo de honestidad es pequeno y NO desaparece: una rejilla de
    // companeros se ve igual sea catalogo real o maqueta.
    var n = (DATOS.agentes || []).filter(function (a) {
      return a.real && a.real.disponible;
    }).length;
    var rot = el('p', 'panel-rotulo',
      DATOS.estado + ' · ' + n + '/' + (DATOS.agentes || []).length + ' ' + L.hubServido);
    // En el rail solo cabe la cifra, y la cifra dice lo mismo. Lo que no
    // puede pasar es que el rotulo desaparezca.
    rot.dataset.corto = n + '/' + (DATOS.agentes || []).length;
    panel.appendChild(rot);
    var g = el('div', 'modelos');
    var sin = ligero();
    (DATOS.agentes || []).forEach(function (a) { g.appendChild(tarjeta(a, sin)); });
    panel.appendChild(g);
    /* La PUERTA de la cola la pone `hub-cola.js`, que es de quien es: ese
       fichero ya era el dueño del panel de la cola, y tener la puerta aqui y
       la habitacion alli obligaba a este fichero a saber de identidades.
       Ademas hub.js se paso de 10 KB al añadirla. Se parte por lo que es. */
  }
  function falla(causa) {
    panel.innerHTML = '';
    panel.appendChild(el('p', 'nodata', (L.hubFallo || 'NO_DATA ·') + ' ' + causa));
  }

  panel.appendChild(esqueleto());

  function arranca() {
    fetch('/hub.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        DATOS = d;
        var lang = (document.documentElement.lang || 'es').slice(0, 2);
        L = (d.textos || {})[lang] || (d.textos || {}).es || {};
        if (!d.agentes || !d.agentes.length) throw new Error('catalogo sin agentes');
        pintaPanel();
        var i = d.identidad || {};
        if (ident && i.github_url) ident.appendChild(marca('GitHub', i.github_url));
        if (ident && i.linkedin_url) ident.appendChild(marca('LinkedIn', i.linkedin_url));
        window.Hub = {
          textos: L, rotulos: T, datos: d, boton: null, panel: panel,
          agente: function (id) {
            return (d.agentes || []).filter(function (a) { return a.id === id; })[0] || null;
          }
        };
        document.dispatchEvent(new CustomEvent('hub:listo'));
        return ceder();
      })
      .catch(function (e) { falla(e && e.message ? e.message : String(e)); });
  }
  if (window.requestIdleCallback) requestIdleCallback(arranca, { timeout: 1500 });
  else setTimeout(arranca, 200);
})();
