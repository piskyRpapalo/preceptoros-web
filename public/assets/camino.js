/* preceptoros.org · La Torre de la Ascension.
 *
 * DONDE VA Y POR QUE NO TOCA EL HTML
 * ----------------------------------
 * La Torre se pinta en la PORTADA. Y no lleva ni un byte de marcado: se monta
 * sola y se trae su propio estilo. El motivo es una medida --- `el/index.html`
 * tiene **107 bytes libres** bajo el tope de 16 KiB, y `ru/index.html` 539 ---,
 * asi que una `<section>` de ancla y un `<link>` de hoja no caben en las ocho
 * portadas. Lo que cabe es esto: cero.
 *
 * QUIEN LO CARGA. `chat-router.js`, que ya esta en las ocho portadas y tiene
 * sitio de sobra. Inyecta la etiqueta; no se usa `import()` porque en este
 * sitio no hay un solo modulo ES y el unico seria este.
 *
 * LOS CINCO PELDANOS SE LEEN, NO SE APRUEBAN
 * -------------------------------------------
 * `torre_lema` lo dice: «se practica, se firma, se asciende. Ningun peldano
 * obliga al siguiente». Hoy se puede hacer lo primero y lo tercero; **firmar
 * no**, porque no hay donde: el Agora responde `escritura: cerrada`. Asi que
 * el boton de firmar NO SE PINTA y en su sitio va la causa.
 *
 * Un boton que no lleva a ningun lado es peor que su ausencia: promete un
 * camino y lo corta sin decirlo. Es el callejon sin vuelta que esta casa ya
 * tiene anotado en los flujos del benchmark.
 *
 * NO SE DESBLOQUEA NADA. NUNCA
 * ------------------------------
 * Firmado por el carbono el 2026-09-20: *«la Torre debe ser algo accesible
 * para todos los usuarios en todos los niveles. No debe ser algo
 * desbloqueable, es algo que debe incentivar el aprendizaje en todos los
 * niveles»*.
 *
 * Los cinco peldanos estan abiertos desde la primera visita. El numero que
 * lleva cada uno es un ORDEN, no una llave: dice por donde suele empezar la
 * gente, no que haga falta permiso. `torre_lema` lo dice en pantalla, justo
 * bajo el titulo, y va SIEMPRE --- no es decoracion, es el contrato.
 *
 * Lo unico que puede quedar sin accion es el peldano cuando no hay campo de
 * chat donde escribir la practica, y eso es una pieza que falta en la pagina,
 * no un nivel que le falte a la persona. Se dice con `title`.
 *
 * QUE HACE UN PELDANO AL PULSARLO. Deja su practica escrita en el campo del
 * chat --- `#pregunta` --- y **no la manda**. Quien decide hablar es la
 * persona; el peldano solo le ahorra escribirlo. Toda la tarjeta es la zona de
 * clic, no solo el titulo: una tarjeta que solo responde en el rotulo se lee
 * como rota.
 */
(function () {
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  /* El orden es el de la Torre, y se declara: un `Object.keys` sobre el JSON
     lo dejaria al albur de como se escribio el fichero, y el orden de los
     peldanos ES la Torre. */
  var PELDANOS = ['despertar', 'primeros_pasos', 'exposicion', 'puertos',
                  'whoami', 'killswitch', 'silencio', 'contribuir'];

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto) { n.textContent = texto; }
    return n;
  }

  /* El estilo viaja con el guion por lo mismo que el marcado: un `<link>` en
     las ocho portadas no cabe en griego. Se reusa `.panel` y `.no-data`, que
     ya existen, y solo se declara lo propio. */
  function estilo() {
    if (document.getElementById('torre-estilo')) { return; }
    var s = el('style');
    s.id = 'torre-estilo';
    s.textContent =
      '#torre{margin:2rem 0}' +
      '#torre .torre-lema{opacity:.8;margin:.2rem 0 1rem}' +
      '#torre .torre-escala{display:grid;gap:.75rem;' +
        'grid-template-columns:1fr}' +
      '#torre .torre-peldano{text-align:left;width:100%;cursor:pointer;' +
        'display:flex;flex-direction:column;gap:.35rem;font:inherit;' +
        'color:inherit;background:none}' +
      '#torre .torre-peldano:hover,#torre .torre-peldano:focus-visible{' +
        'outline:2px solid currentColor;outline-offset:2px}' +
      '#torre .torre-n{opacity:.6;font-size:.8em;text-transform:uppercase;' +
        'letter-spacing:.08em}' +
      '#torre .torre-falla{opacity:.75;font-size:.92em}' +
      '#torre .torre-quien{opacity:.6;font-size:.88em;font-style:italic}' +
      '#torre details{border:1px solid currentColor;border-radius:.4rem;' +
        'padding:.5rem .75rem;opacity:.95}' +
      '#torre details[open]{opacity:1}' +
      '#torre summary{cursor:pointer;font-weight:600;list-style:revert}' +
      '#torre summary:focus-visible{outline:2px solid currentColor;' +
        'outline-offset:2px}' +
      '#torre .torre-cuerpo{display:flex;flex-direction:column;gap:.4rem;' +
        'margin-top:.5rem}' +
      '#torre .torre-mandos{display:flex;gap:.5rem;flex-wrap:wrap;' +
        'margin-top:.3rem}' +
      '#torre .torre-mandos button{font:inherit;cursor:pointer}';
    document.head.appendChild(s);
  }

  function donde() {
    return document.getElementById('especificaciones') ||
           document.getElementById('hub-layout') ||
           document.getElementById('hub');
  }

  function practica(peldano, ui) {
    /* Lo que se escribe en el chat es la FRASE del peldano, que es la
       practica. No se adorna con un «ayúdame a...»: la frase ya esta escrita
       en las ocho lenguas y adornarla en castellano la rompe en siete. */
    return ui['camino_' + peldano + '_frase'] || '';
  }

  function pinta(ui) {
    var host = donde();
    if (!host || document.getElementById('torre')) { return; }
    estilo();

    var sec = el('section', 'panel');
    sec.id = 'torre';
    sec.appendChild(el('h2', null, ui.torre_titulo || 'La Torre'));
    if (ui.torre_lema) { sec.appendChild(el('p', 'torre-lema', ui.torre_lema)); }

    var escala = el('div', 'torre-escala');
    var entrada = document.getElementById('pregunta');

    PELDANOS.forEach(function (p, i) {
      var titulo = ui['camino_' + p + '_titulo'];
      if (!titulo) { return; }

      /* UN DESPLEGABLE POR PISO. `details`/`summary` nativos: se abren con el
         teclado, se anuncian solos a un lector de pantalla y no llevan ni una
         linea de JS para abrirse. Escribir esto a mano con `aria-expanded` y
         manejadores de teclado seria mas codigo haciendo menos. */
      var d = el('details', 'torre-peldano');
      var res = el('summary');
      res.appendChild(el('span', 'torre-n',
        (ui.torre_nivel || 'nivel') + ' ' + (i + 1) + ' · '));
      res.appendChild(document.createTextNode(titulo));
      d.appendChild(res);

      var cuerpo = el('div', 'torre-cuerpo');
      var frase = ui['camino_' + p + '_frase'];
      if (frase) { cuerpo.appendChild(el('p', null, frase)); }
      /* LA FALLA SE PINTA. Cada peldano declara lo que NO consigue, y ese es
         el campo que convierte una promesa en una medida. */
      var falla = ui['camino_' + p + '_falla'];
      if (falla) { cuerpo.appendChild(el('p', 'torre-falla', falla)); }
      var quien = ui['camino_' + p + '_para_quien'];
      if (quien) { cuerpo.appendChild(el('p', 'torre-quien', quien)); }

      /* EL PAPEL DEL TESTER Y EL ADAPTADOR DEL PISO.
         Los dos se declaran aunque no existan todavia, y se declaran DENTRO
         del desplegable en vez de omitirse. Un hueco que no se ve no se
         rellena nunca: quien abra el piso tiene que saber que el modelo aun
         no sabe con quien cree que habla. */
      var papel = ui['camino_' + p + '_papel'];
      cuerpo.appendChild(el('p', papel ? 'torre-papel' : 'no-data',
        papel || ('NO_DATA · con quien cree el modelo que habla en este piso: '
                  + 'sin escribir todavia')));
      var lora = ui['camino_' + p + '_lora'];
      cuerpo.appendChild(el('p', lora ? 'torre-lora' : 'no-data',
        lora || 'NO_DATA · este piso no tiene adaptador asignado'));

      /* EL BOTON DE PROBAR sube la practica al chat de arriba y lleva la
         vista ahi. No la manda: quien decide hablar es la persona. */
      var mandos = el('div', 'torre-mandos');
      var entrada = document.getElementById('pregunta');
      var probar = el('button', null, ui.torre_paso || 'Probar');
      probar.type = 'button';
      if (entrada) {
        probar.addEventListener('click', function () {
          entrada.value = practica(p, ui);
          entrada.focus();
          /* Algunos campos escuchan `input` para medir o para habilitar el
             boton de enviar. Sin disparar el evento, el campo se ve lleno y el
             resto de la pagina cree que esta vacio. */
          entrada.dispatchEvent(new Event('input', { bubbles: true }));
          entrada.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      } else {
        /* Falta la pieza de la pagina, no el nivel de la persona. */
        probar.disabled = true;
        probar.title = 'NO_DATA · no hay campo de chat en esta pagina';
      }
      mandos.appendChild(probar);
      cuerpo.appendChild(mandos);

      d.appendChild(cuerpo);
      escala.appendChild(d);
    });

    sec.appendChild(escala);

    /* FIRMAR: declarado, no pintado. Ver la cabecera. */
    var nd = el('p', 'no-data',
      'NO_DATA · «' + (ui.torre_firmar || 'Firmar este paso') + '»: el rack ' +
      'todavia no recibe pasos firmados. El boton no se pinta porque no ' +
      'llevaria a ningun sitio.');
    sec.appendChild(nd);

    host.parentNode.insertBefore(sec, host.nextSibling);
  }

  function arranca() {
    if (!donde()) { return; }
    fetch('/caminos-' + lang + '.json')
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (d) { pinta(d.ui || {}); })
      .catch(function (e) {
        /* Si no llega, la Torre NO desaparece en silencio: eso seria un hueco
           invisible, y aqui los huecos se declaran. */
        var host = donde();
        if (!host || document.getElementById('torre')) { return; }
        var p = el('p', 'no-data',
          'NO_DATA · la Torre no cargo: ' + e.message +
          ' (/caminos-' + lang + '.json)');
        p.id = 'torre';
        host.parentNode.insertBefore(p, host.nextSibling);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arranca);
  } else { arranca(); }
})();
