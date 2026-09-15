/* preceptoros.org · el Showman. Quien te va a contestar, y desde donde.
 *
 * EL OFICIO
 * ---------
 * En la plaza del pueblo hay un pregonero. No muele, no reparte y no decide: su
 * oficio entero es que la plaza sepa que esta pasando. En un sitio que presume
 * de no esconder nada, eso no es adorno -- es la mitad del contrato.
 *
 * QUE ARREGLA, Y ES CONCRETO
 * ---------------------------
 * La pagina ya dice «el rack no contesto; el tunel publico aun no esta
 * levantado». Dice la verdad. Pero la dice DESPUES, cuando ya escribiste tu
 * pregunta y la perdiste. El pregonero lo dice ANTES.
 *
 * DE DONDE SACA LO QUE CANTA
 * ---------------------------
 * De nada nuevo: `paneles.json` --la ficha de cada cerebro, con su medida y su
 * `que_falla`-- y del evento `preceptor:brain` que ya publica `meter.js`. Si
 * inventara un dato aqui, seria el unico sitio de la casa que lo hace.
 *
 * Y CANTA EL DEFECTO CON EL MISMO PESO QUE LA VIRTUD. Un pregonero que solo
 * cuenta lo bueno no es un pregonero: es un vendedor.
 */
(function () {
  var casa = document.getElementById('brain');
  if (!casa) return;

  var caja = document.createElement('div');
  caja.className = 'showman';
  caja.setAttribute('aria-live', 'polite');
  casa.parentNode.insertBefore(caja, casa);

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return JSON.parse(b.textContent)[clave] || respaldo; }
    catch (e) { return respaldo; }
  }
  function idioma() { return (document.documentElement.lang || 'es').slice(0, 2); }

  var fichas = {};
  var cerebro = null;

  /* Las tres procedencias, y son tres promesas distintas -- por eso se nombran
     y no se resumen en «disponible». Desde donde contesta algo cambia quien
     puede leerlo y quien lo paga. */
  /* SE PIDEN TRADUCIDAS · 2026-09-15. Esta tabla era literal, en castellano, y
     son las tres frases que se leen JUSTO DEBAJO del chat en la portada: las
     ocho lenguas veian «En el cerro · Tu pregunta sube al rack...».
     No lo cazo el gate y no podia: su guardian sigue el patron `T('clave')`, y
     una tabla literal no lo usa. Se ve abriendo la pagina, y asi se vio --en
     el Doogee, en la web publicada--. */
  function DONDE() {
    return {
      rack:      [T('smRackT', 'En el cerro'),
                  T('smRackP', 'Tu pregunta sube al rack y vuelve. Sale de tu aparato.')],
      navegador: [T('smNavT', 'En tu aparato'),
                  T('smNavP', 'Corre dentro del navegador. No sale nada.')],
      ninguno:   [T('smNadaT', 'Sin molino'),
                  T('smNadaP', 'No hay motor elegido. La página te dará un texto para llevar a la IA que ya uses.')],
    };
  }

  function pintar() {
    caja.innerHTML = '';
    var t = el('p', 'showman-linea');

    if (!cerebro || cerebro === 'NO_DATA') {
      var d = DONDE().ninguno;
      t.appendChild(el('strong', null, d[0]));
      caja.appendChild(t);
      caja.appendChild(el('p', 'showman-nota', d[1]));
      return;
    }

    var donde = DONDE()[/edge|browser|navegador/i.test(cerebro) ? 'navegador' : 'rack'];
    t.appendChild(el('strong', null, donde[0]));
    t.appendChild(document.createTextNode(' · '));
    t.appendChild(el('code', 'showman-tag', cerebro));
    caja.appendChild(t);
    caja.appendChild(el('p', 'showman-nota', donde[1]));

    /* La ficha, si este cerebro tiene una. Sin ficha no se inventa: se calla,
       que es distinto de rellenar. */
    var f = fichas[cerebro];
    if (!f) return;
    var tx = (f.textos || {})[idioma()] || (f.textos || {}).es || {};
    var med = (f.modelo || {}).medida || {};
    if (med.tok_s) {
      caja.appendChild(el('p', 'showman-med',
        med.tok_s + T('smMedido', ' tok/s · medido con la máquina a ') +
        (med.carga_base === undefined ? 'NO_DATA' : med.carga_base)));
    }
    if (tx.que_falla) {
      var fa = el('p', 'showman-falla');
      fa.appendChild(el('strong', null, T('smFalla', 'Y esto se le da mal: ')));
      fa.appendChild(document.createTextNode(tx.que_falla));
      caja.appendChild(fa);
    }
  }

  /* `meter.js` ya publica quien contesta. No se pregunta al rack ni se adivina
     del nombre del modelo: se escucha al que lo sabe. */
  document.addEventListener('preceptor:brain', function (e) {
    cerebro = (e.detail && e.detail.name) || null;
    pintar();
  });

  fetch('/paneles.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      (d.paneles || []).forEach(function (p) {
        if (p.modelo && p.modelo.tag) { fichas[p.modelo.tag] = p; }
      });
      pintar();
    })
    .catch(function () { pintar(); });

  pintar();
})();
