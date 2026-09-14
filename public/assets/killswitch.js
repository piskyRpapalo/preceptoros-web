/* preceptoros.org · SURVIVAL KILLSWITCH, el panel que rompe el violeta.

   Va el PRIMERO de la pestaña Proyectos, y en rojo/negro/cian. Orden del
   Soberano, 2026-09-14. No es una licencia estetica: es el unico proyecto que
   se juega sin red y con la bateria bajando, y romper la paleta dice eso sin
   gastar una linea de texto. UNA excepcion, nombrada, con su hoja aparte
   (`.panel-peligro` en `sistema.css`) para que no se convierta en una segunda
   paleta suelta por la casa.

   LOS DATOS SON LOS QUE YA HAY. Este fichero no inventa una ficha: lee el panel
   `killswitch-apocalypse` de `paneles.json` --hechos-- y su texto de
   `paneles-<idioma>.json`, que es de donde sale tambien el resto de la pagina.
   Inventarle una copia propia seria una segunda verdad sobre el mismo proyecto.

   EL FONDO SE DECLARA Y NO SE FINGE. El contenedor esta listo con
   `background-size:cover`, y mientras no haya lamina no se pinta nada: un fondo
   roto es peor que ninguno. */
(function () {
  var raiz = document.getElementById('killswitch');
  if (!raiz) return;
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }
  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return (JSON.parse(b.textContent)[clave]) || respaldo; }
    catch (e) { return respaldo; }
  }

  Promise.all([
    fetch('/paneles.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
    fetch('/taller-' + lang + '.json').then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (x) {
        return x || fetch('/taller-es.json').then(function (r) { return r.json(); });
      }),
    fetch('/paneles-' + lang + '.json').then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; })
      .then(function (t) {
        return t || fetch('/paneles-es.json').then(function (r) { return r.json(); });
      })
  ]).then(function (par) {
    var UI = (par[1] && par[1].ui) || {};
    par = [par[0], par[2]];
    var hecho = (par[0].paneles || []).filter(function (p) {
      return p.id === 'killswitch-apocalypse';
    })[0];
    var t = ((par[1] || {}).paneles || {})['killswitch-apocalypse'];
    if (!hecho || !t) return;                  // sin ficha no se pinta un cartel

    var caja = el('section', 'panel-peligro');
    var cab = el('div', 'ks-cab');
    cab.appendChild(el('h3', null, t.nombre || 'Killswitch'));
    cab.appendChild(el('span', 'ks-sello', T('ksSello', 'modo avion')));
    caja.appendChild(cab);
    if (t.que_hace) caja.appendChild(el('p', null, t.que_hace));
    /* QUE FALLA SE PINTA SIEMPRE Y CON EL MISMO PESO. Es la parte de la ficha
       que hace que las demas valgan algo; en letra pequeña estaria contada y no
       dicha. */
    if (t.que_falla) {
      var f = el('p', 'ks-tenue');
      f.appendChild(el('b', null, T('agFalla', 'Falla:') + ' '));
      f.appendChild(document.createTextNode(t.que_falla));
      caja.appendChild(f);
    }
    if (t.para_quien) caja.appendChild(el('p', 'ks-tenue', t.para_quien));

    /* EL PANEL ENTERO ABRE, no un titulo ni un boton en una esquina. Orden del
       Soberano, y ademas ya tiene su cicatriz: el enlace estirado se pinta
       DEBAJO de los hermanos que vienen despues y se traga el clic si no lleva
       `z-index` (A24). Aqui se resuelve sin pseudoelemento --el panel es el
       boton-- que es menos codigo y no puede volver a pasar.
       Se usa `abrirPanel` y NO `abrir`: esta ficha no es una linea del taller
       --tiene bucle y juez, y no tiene corpus ni peldaño-- y pasarla por el
       otro camino la pintaria medio vacia. */
    caja.tabIndex = 0;
    caja.setAttribute('role', 'button');
    caja.setAttribute('aria-label', t.nombre || hecho.id);
    function entrar() {
      if (!window.Escenario || !window.Escenario.abrirPanel) return;
      var sello = el('span', 'ks-sello', T('ksSello', 'modo avion'));
      /* El rotulo de cerrar sale de `taller-<idioma>.json`, que es donde vive
         el del otro telon. Una clave nueva para decir lo mismo son ocho
         traducciones mas que pueden faltar en una, y ademas dos palabras
         distintas para el mismo gesto en la misma pagina. */
      /* El UI entero del taller, no tres claves sueltas: el telon monta ahora
         el chat y el juez, y esos rotulos ya viven ahi traducidos. Elegirlos a
         mano seria acordarse de añadir uno cada vez que crezca el telon. */
      var ui = {};
      Object.keys(UI).forEach(function (k) { ui[k] = UI[k]; });
      ui.falla = T('agFalla', 'Falla:');
      ui.loreFecha = T('agMedido', 'Medido');
      ui.juezTitulo = T('ksJuezTitulo', 'Juez coordinador');
      ui.juezPedir = T('ksJuezPedir', 'Pedir veredicto');
      ui.juezSinTurnos = T('ksJuezSinTurnos', 'NO_DATA — todavía no hay turnos que juzgar.');
      ui.juezUnaCapa = T('ksJuezUnaCapa', 'NO_DATA');
      window.Escenario.abrirPanel(hecho, t, ui, sello);
    }
    caja.addEventListener('click', entrar);
    caja.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); entrar(); }
    });
    raiz.appendChild(caja);
  }).catch(function () { /* sin datos, la pestaña sigue en pie */ });
})();
