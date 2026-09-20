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
  var PELDANOS = ['despertar', 'primeros_pasos', 'exposicion', 'silencio',
                  'contribuir'];

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
        'grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}' +
      '#torre .torre-peldano{text-align:left;width:100%;cursor:pointer;' +
        'display:flex;flex-direction:column;gap:.35rem;font:inherit;' +
        'color:inherit;background:none}' +
      '#torre .torre-peldano:hover,#torre .torre-peldano:focus-visible{' +
        'outline:2px solid currentColor;outline-offset:2px}' +
      '#torre .torre-n{opacity:.6;font-size:.8em;text-transform:uppercase;' +
        'letter-spacing:.08em}' +
      '#torre .torre-falla{opacity:.75;font-size:.92em}' +
      '#torre .torre-quien{opacity:.6;font-size:.88em;font-style:italic}';
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
      /* `button` y no `div`: se llega con el tabulador y se pulsa con Enter
         sin que haya que escribir un solo manejador de teclado. */
      var b = el('button', 'torre-peldano');
      b.type = 'button';
      b.appendChild(el('span', 'torre-n',
        (ui.torre_nivel || 'nivel') + ' ' + (i + 1)));
      b.appendChild(el('strong', null, titulo));
      var frase = ui['camino_' + p + '_frase'];
      if (frase) { b.appendChild(el('span', null, frase)); }
      /* LA FALLA SE PINTA. Cada peldano declara lo que NO consigue, y ese es
         el campo que convierte una promesa en una medida. Esconderlo dejaria
         cinco eslogans. */
      var falla = ui['camino_' + p + '_falla'];
      if (falla) { b.appendChild(el('span', 'torre-falla', falla)); }
      var quien = ui['camino_' + p + '_para_quien'];
      if (quien) { b.appendChild(el('span', 'torre-quien', quien)); }

      if (entrada) {
        b.addEventListener('click', function () {
          entrada.value = practica(p, ui);
          entrada.focus();
          /* Algunos campos de este sitio escuchan `input` para medir o para
             habilitar el boton de enviar. Si no se dispara, el campo se ve
             lleno y el resto de la pagina cree que esta vacio. */
          entrada.dispatchEvent(new Event('input', { bubbles: true }));
          entrada.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      } else {
        b.disabled = true;
        b.title = 'NO_DATA';
      }
      escala.appendChild(b);
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
