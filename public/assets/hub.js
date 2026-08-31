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
     Se construye antes de pedir nada: son los cuatro botones que llevan a
     todo lo demas, y una cabecera que aparece medio segundo tarde se lee
     como una pagina rota. */
  var bModelos = el('button', 'cab-boton', T.cabModelos);
  bModelos.type = 'button';
  bModelos.setAttribute('aria-expanded', 'false');
  bModelos.setAttribute('aria-controls', 'panel-modelos');
  cab.appendChild(bModelos);
  var bCola = el('button', 'cab-boton', T.cabCola);
  bCola.type = 'button';
  bCola.setAttribute('aria-controls', 'hub');
  cab.appendChild(bCola);
  // El onboarding vuelve al cabezal. Al rehacerlo en la Puerta 6 se perdio su
  // enlace, y el gate lo cazo: sin el, la puerta de entrada del producto no se
  // alcanza desde la portada.
  cab.appendChild(enlace('cab-boton', T.cabEmpezar, './onboarding.html'));
  cab.appendChild(enlace('cab-boton', T.cabBenchmark, './benchmark.html'));
  cab.appendChild(enlace('cab-boton', T.cabPlayground, './playground.html'));
  cab.appendChild(enlace('cab-leve', T.cabIdioma, '/'));

  /* Los enlaces de identidad publica van AQUI y en ningun otro sitio de la
     pagina. Repetirlos en el pie no es redundancia inofensiva: son la unica
     forma de comprobar quien firma esto, y dos copias divergen. */
  var ident = el('span', 'cab-ident');
  cab.appendChild(ident);

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
      img.width = 96; img.height = 96;
      b.appendChild(img);
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
    panel.appendChild(el('p', 'panel-rotulo',
      DATOS.estado + ' · ' + n + '/' + (DATOS.agentes || []).length + ' ' + L.hubServido));
    var g = el('div', 'modelos');
    var sin = ligero();
    (DATOS.agentes || []).forEach(function (a) { g.appendChild(tarjeta(a, sin)); });
    panel.appendChild(g);
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
        if (i.github_url) ident.appendChild(enlace('cab-leve', 'GitHub', i.github_url));
        if (i.linkedin_url) ident.appendChild(enlace('cab-leve', 'LinkedIn', i.linkedin_url));
        window.Hub = {
          textos: L, rotulos: T, datos: d, boton: bModelos, panel: panel,
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

  // La cola vive en su propio modulo y se pide al pulsar: es lo menos visitado
  // de la portada y no tiene por que viajar en la primera pintura.
  bCola.addEventListener('click', function () {
    document.dispatchEvent(new CustomEvent('hub:cola'));
  });
})();
