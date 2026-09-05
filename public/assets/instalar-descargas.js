/* preceptoros.org · las dos puertas que faltaban en la pagina Instalar.
 *
 * QUE HACE. Pinta dos bloques: la web instalable --que ya funciona hoy-- y el
 * catalogo de modelos, DERIVADO de `/modelos.json`. Los pasos de clonar el
 * repositorio ya estaban escritos en el HTML y no se tocan.
 *
 * POR QUE DERIVADO Y NO ESCRITO A MANO. `modelos.json` lo genera la Forja
 * leyendo sus Modelfile y Ollama; los tamanos vienen en bytes de
 * `/api/tags`. Escribir «1,9 GB» en ocho HTML es garantizar que siete se
 * queden viejos el dia que el modelo cambie. Aqui se lee el numero y se
 * divide; si el catalogo cambia, la pagina cambia sola en las ocho lenguas.
 *
 * EL MINIMO PARA UN TELEFONO NO SE ELIGE, SE CALCULA: es el modelo de tipo
 * `base` mas pequeño del catalogo. Si mañana entra uno menor, se marca solo.
 * Y se dice lo que NO se sabe: nadie ha cronometrado esto en un telefono de
 * 8 GB desde este rack, asi que lo unico que se afirma es el tamaño del
 * fichero, que si esta medido.
 *
 * NO HAY ENLACE DE DESCARGA, y no es un olvido. Los dos modelos del catalogo
 * traen `servido_publicamente: false` y este sitio no aloja pesos. Poner un
 * boton que no descarga nada seria la clase de promesa que esta web existe
 * para no hacer. Lo que se da es el nombre exacto y el comando que lo trae de
 * su propio registro, que es comprobable y no depende de nosotros.
 */
(function () {
  var pwa = document.getElementById('pwa-puerta');
  var caja = document.getElementById('modelos-descarga');
  if (!pwa && !caja) return;
  var lang = document.documentElement.lang;

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  /* Los bytes vienen del rack; el GiB se calcula aqui. Dos decimales porque
     la diferencia entre 1,88 y 1,9 es la que decide si cabe o no cabe. */
  function gib(bytes) {
    return (bytes / 1073741824).toFixed(2).replace('.', ',') + ' GiB';
  }
  /* Un emergente pequeno y con su cierre. Mismo gesto que el del microfono:
     lo que se pide se cuenta al pedirlo, no se predica en la pagina. */
  function emergente(texto) {
    var previo = document.querySelector('.pwa-aviso');
    if (previo) previo.remove();
    var caja = el('div', 'pwa-aviso');
    caja.setAttribute('role', 'status');
    caja.appendChild(el('p', null, texto));
    var x = el('button', 'pwa-aviso-cerrar', '\u00d7');
    x.type = 'button';
    x.addEventListener('click', function () { caja.remove(); });
    caja.appendChild(x);
    pwa.appendChild(caja);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { caja.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  function metrica(m, clave) {
    var f = (m.metricas || []).filter(function (x) { return x.clave === clave; })[0];
    return f ? f.valor : null;
  }

  fetch('/instalar.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var T = (d.textos || {})[lang] || (d.textos || {}).es;
      if (pwa) {
        pwa.appendChild(el('h2', null, T.pwaTitulo));
        pwa.appendChild(el('p', null, T.pwaCuerpo));
        pwa.appendChild(el('p', 'tenue', T.pwaComo));

        /* EL BOTON DE INSTALAR LA WEB, con el prompt del navegador si lo hay y
           un emergente si no. `beforeinstallprompt` solo existe en Chromium y
           solo si la pagina cumple los requisitos: guardarlo es la unica forma
           de ofrecer la instalacion en el momento en que la persona la pide y
           no cuando al navegador le apetece avisar.

           SIN PROMPT NO SE MIENTE: el boton sigue ahi y lo que hace es contar
           como se instala a mano en cada sistema. Un boton que desaparece en
           iPhone --donde la instalacion existe pero es manual-- deja a esa
           mitad creyendo que no se puede. */
        var guardado = null;
        window.addEventListener('beforeinstallprompt', function (e) {
          e.preventDefault(); guardado = e;
        });
        var bp = el('button', 'boton', T.pwaBoton);
        bp.type = 'button';
        bp.addEventListener('click', function () {
          if (guardado) { guardado.prompt(); guardado = null; return; }
          emergente(T.pwaManual);
        });

        /* LA ULTIMA VERSION DE LA APP. El enlace es la pagina de versiones del
           repositorio --comprobada, responde 200-- y va acompanado de lo que
           hay detras HOY: ninguna version publicada. Decirlo antes de pulsar
           es la diferencia entre una puerta y una promesa. */
        var ba = el('a', 'boton', T.appBoton);
        ba.href = d.releases; ba.rel = 'noopener';
        var fila = el('div', 'fila');
        fila.appendChild(bp); fila.appendChild(ba);
        pwa.appendChild(fila);
        pwa.appendChild(el('p', 'nodata', 'NO_DATA · ' + T.appVacio));
      }
      if (!caja) return;
      caja.appendChild(el('h2', null, T.mdTitulo));
      return fetch('/modelos.json', { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (c) { pinta(c, T); })
        .catch(function (e) {
          caja.appendChild(el('p', 'nodata', T.mdFallo + ' ' + (e.message || e)));
        });
    })
    .catch(function () { /* sin rotulos no se pinta nada: mejor vacio que a medias */ });

  function pinta(c, T) {
    var lista = c.modelos || [];
    // El minimo se calcula; no hay una bandera «este es el del telefono».
    var bases = lista.filter(function (m) { return m.tipo === 'base'; });
    var minimo = bases.sort(function (a, b) {
      return metrica(a, 'modelo_tamano_bytes') - metrica(b, 'modelo_tamano_bytes');
    })[0];

    lista.forEach(function (m) {
      var p = el('div', 'panel modelo-ficha');
      if (minimo && m.id === minimo.id) p.appendChild(el('p', 'cuenta', T.mdMinimo));
      p.appendChild(el('h3', null, m.id));
      var datos = [m.tipo,
                   gib(metrica(m, 'modelo_tamano_bytes')),
                   metrica(m, 'parametros'),
                   metrica(m, 'cuantizacion')];
      var ctx = metrica(m, 'ventana_contexto');
      if (ctx) datos.push(T.mdVentana + ' ' + ctx);
      p.appendChild(el('p', 'cifra', datos.filter(Boolean).join(' · ')));
      if (!m.servido_publicamente) {
        var n = el('p', 'nodata', T.mdNoServido + ' ');
        // La causa viene tal cual del rack: es el valor de un campo, no prosa.
        n.appendChild(el('code', null, m.causa_no_servido || '—'));
        p.appendChild(n);
      }
      /* EL COMANDO SOLO PARA LAS BASES. El primer intento ponia `ollama pull`
         debajo de TODO, y a un adaptador le colgaba el `pull` de su base --que
         no lo trae--: quien lo copiara se llevaria el modelo desnudo creyendo
         que se lleva el afinado. Un comando que hace otra cosa de la que
         promete es peor que ningun comando. El adaptador se queda con su
         causa: hoy no se publica, y eso ya esta dicho arriba. */
      if (m.tipo === 'base') {
        p.appendChild(el('p', 'tenue', T.mdComoTraer));
        p.appendChild(el('p', null)).appendChild(el('code', null, 'ollama pull ' + m.id));
      }
      if (minimo && m.id === minimo.id) p.appendChild(el('p', 'tenue', T.mdSinTelefono));
      caja.appendChild(p);
    });

    var otros = c.no_publicados && c.no_publicados.valor;
    if (otros) caja.appendChild(el('p', 'tenue', otros + ' ' + T.mdNoPublicados));
  }
})();
