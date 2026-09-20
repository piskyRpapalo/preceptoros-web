/* preceptoros.org · EL SURVIVAL KILLSWITCH, dentro de su piso de la Torre.

   MUDANZA DEL 2026-09-20, por orden del Soberano. Este panel vivia en la
   pestaña Proyectos de `community.html`, en las ocho lenguas, y lo pintaba
   `assets/killswitch.js`. Se va a la Torre de la Ascension de la portada,
   donde ya habia un peldano `killswitch` desde que existe la familia
   `caminos-<lengua>.json`.

   POR QUE NO ERA SOLO UN CAMBIO DE SITIO. Habia DOS puertas al mismo proyecto
   en dos paginas distintas: un peldano de la Torre que hablaba de cortar y
   medir, y un panel en la plaza con la ficha, el juez y el modo avion. Quien
   entraba por una no sabia que existia la otra. Juntarlas no ahorra codigo
   --- este fichero pesa casi lo mismo que el que retira ---: quita una
   bifurcacion de la cabeza de quien visita.

   LOS ROTULOS SALEN DE `caminos-<lengua>.json`, no del `#i18n` de la portada.
   No es gusto: `public/el/index.html` tiene 107 bytes libres de 16.384 y
   `public/ru/index.html` 539. Siete claves traducidas no caben en el griego.
   Y ademas es donde corresponde --- el panel lee sus rotulos del mismo sitio
   que el piso que lo contiene.

   LOS HECHOS SIGUEN SALIENDO DE `paneles.json` + `paneles-<lengua>.json`, como
   antes. Este fichero no inventa una ficha: una segunda copia de los datos del
   mismo proyecto seria una segunda verdad sobre el.

   EL TELON SE TRAE AL PULSAR, NO AL CARGAR. `escenario.js` pesa 16.124 B y en
   `community.html` venia en una etiqueta del marcado. La portada no lo carga,
   y traerlo de balde para una pantalla que la mayoria no abre es cobrarle a
   todo el mundo el peso de una minoria. Se inyecta en el primer clic. */
(function () {
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var UI = {};

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function T(clave, respaldo) { return UI[clave] || respaldo; }

  /* EL TELON NO ES SOLO SU GUION: ES SU HOJA. `escenario.css` (5.167 B) esta
     enlazada en `community.html` y NO en la portada, asi que al mudar el panel
     el dialogo se pintaba con `position: static` --- dentro del flujo, 3.000
     pixeles mas abajo, invisible en un movil. El gate pasaba entero: la
     estructura era correcta y el texto estaba en el DOM.
     Lo vi mirando la pantalla, no el verde. Y la hoja viaja con el guion, en
     el clic: cobrarle 5 KB a todo el mundo por una pantalla que abre una
     minoria es lo mismo que la Torre evita siendo perezosa. */
  function hoja() {
    if (document.querySelector('link[data-escenario]')) { return; }
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/assets/escenario.css';
    l.setAttribute('data-escenario', '1');
    document.head.appendChild(l);
  }

  function conEscenario(hazlo) {
    hoja();
    if (window.Escenario && window.Escenario.abrirPanel) { hazlo(); return; }
    var ya = document.querySelector('script[data-escenario]');
    if (!ya) {
      ya = document.createElement('script');
      ya.src = '/assets/escenario.js';
      ya.async = false;
      ya.setAttribute('data-escenario', '1');
      document.head.appendChild(ya);
    }
    /* Si el telon no llega, NO se falla en silencio: la persona pulso algo y
       tiene que enterarse de que no paso nada y por que. */
    ya.addEventListener('load', function () {
      if (window.Escenario && window.Escenario.abrirPanel) { hazlo(); }
    });
    ya.addEventListener('error', function () {
      var p = document.getElementById('ks-panel');
      if (p) { p.title = 'NO_DATA · no se pudo cargar el telon'; }
    });
  }

  function pinta(cuerpo) {
    Promise.all([
      fetch('/paneles.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      fetch('/taller-' + lang + '.json').then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (x) {
          return x || fetch('/taller-es.json').then(function (r) { return r.json(); });
        }),
      fetch('/paneles-' + lang + '.json').then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (t) {
          return t || fetch('/paneles-es.json').then(function (r) { return r.json(); });
        })
    ]).then(function (par) {
      var taller = (par[1] && par[1].ui) || {};
      var hecho = (par[0].paneles || []).filter(function (p) {
        return p.id === 'killswitch-apocalypse';
      })[0];
      var t = ((par[2] || {}).paneles || {})['killswitch-apocalypse'];
      if (!hecho || !t) { return; }        // sin ficha no se pinta un cartel

      var caja = el('section', 'panel-peligro');
      caja.id = 'ks-panel';
      var cab = el('div', 'ks-cab');
      cab.appendChild(el('h3', null, t.nombre || 'Killswitch'));
      cab.appendChild(el('span', 'ks-sello', T('ks_sello', 'modo avion')));
      caja.appendChild(cab);
      if (t.que_hace) { caja.appendChild(el('p', null, t.que_hace)); }
      /* QUE FALLA SE PINTA SIEMPRE Y CON EL MISMO PESO. Es la parte de la
         ficha que hace que las demas valgan algo. */
      if (t.que_falla) {
        var f = el('p', 'ks-tenue');
        f.appendChild(el('b', null, T('ks_falla', 'Falla:') + ' '));
        f.appendChild(document.createTextNode(t.que_falla));
        caja.appendChild(f);
      }
      if (t.para_quien) { caja.appendChild(el('p', 'ks-tenue', t.para_quien)); }

      /* EL PANEL ENTERO ABRE, no un boton en una esquina. Ya tiene su cicatriz
         (A24): el enlace estirado se pinta DEBAJO de los hermanos y se traga
         el clic si no lleva `z-index`. Aqui el panel ES el boton, que es menos
         codigo y no puede volver a pasar. */
      caja.tabIndex = 0;
      caja.setAttribute('role', 'button');
      caja.setAttribute('aria-label', t.nombre || hecho.id);
      function entrar() {
        conEscenario(function () {
          /* El UI ENTERO del taller, no tres claves sueltas: el telon monta el
             chat y el juez, y esos rotulos ya viven ahi traducidos. Elegirlos
             a mano seria acordarse de anadir uno cada vez que crezca. */
          var ui = {};
          Object.keys(taller).forEach(function (k) { ui[k] = taller[k]; });
          ui.falla = T('ks_falla', 'Falla:');
          ui.loreFecha = T('ks_medido', 'Medido');
          ui.juezTitulo = T('ks_juez_titulo', 'Juez coordinador');
          ui.juezPedir = T('ks_juez_pedir', 'Pedir veredicto');
          ui.juezSinTurnos = T('ks_juez_sin_turnos', 'NO_DATA');
          ui.juezUnaCapa = T('ks_juez_una_capa', 'NO_DATA');
          window.Escenario.abrirPanel(hecho, t, ui,
            el('span', 'ks-sello', T('ks_sello', 'modo avion')));
        });
      }
      caja.addEventListener('click', entrar);
      caja.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); entrar(); }
      });
      cuerpo.appendChild(caja);
    }).catch(function () { /* sin datos, el piso sigue en pie */ });
  }

  /* SE ESPERA AL AVISO DE LA TORRE, no a `load`. `camino.js` pinta despues de
     traerse `caminos-<lengua>.json`, asi que en el momento en que este fichero
     se ejecuta el piso todavia no existe. Sondear cada tantos milisegundos
     funcionaria y seria adivinar; el aviso es un dato. */
  function monta(ui) {
    UI = ui || {};
    var piso = document.getElementById('piso-killswitch');
    if (!piso || piso.querySelector('#ks-panel')) { return; }
    var cuerpo = piso.querySelector('.torre-cuerpo') || piso;
    pinta(cuerpo);
  }
  window.addEventListener('preceptor:torre', function (e) {
    monta(e.detail && e.detail.ui);
  });
  /* Y si la Torre ya estaba pintada cuando este fichero llego --- cache
     caliente, orden de descarga --- no se espera un aviso que ya paso. */
  if (document.getElementById('piso-killswitch') && window.TorreUI) {
    monta(window.TorreUI);
  }
})();
