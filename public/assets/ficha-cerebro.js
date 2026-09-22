/* preceptoros.org · la ficha del cerebro elegido, bajo el cuadro de arriba.
 *
 * SALE DE `selector-modelo.js` EL 2026-09-08 porque aquel se paso del tope por
 * fichero. Se parte por ASUNTO y no se recorta un comentario: el selector
 * elige, esto DESCRIBE lo elegido, y son dos trabajos. La regla de la casa es
 * «se parte, no se recorta», y el corte natural estaba escrito desde el
 * principio en el propio rotulo de este bloque.
 *
 * Recibe `REG` y `PROSA` por argumento en vez de leerlos de un global: quien
 * los tiene es el selector, y pasarlos evita un segundo dueño del catalogo.
 */
(function () {
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }
  function cifra(v, unidad) {
    return v == null ? 'NO_DATA' : String(v).replace('.', ',') + unidad;
  }
  /* LAS CIFRAS SE ROTULAN AQUI; LAS FRASES VIENEN DE `motor-<lengua>.json`.
     Los rotulos cortos de una cifra --prompt, generacion-- van en la tabla de
     abajo, como iban en el selector. Todo lo que es una frase vive en la
     familia del motor, que es la de esta ventana: el gate no deja castellano
     suelto dentro de un guion, y con razon --lo verian las ocho lenguas--. */
  var PAL = {
    es: ['prompt', 'generación', 'despertar', 'sin firmar'],
    en: ['prompt', 'generation', 'wake-up', 'unsigned'],
    fr: ['prompt', 'génération', 'réveil', 'non signé'],
    pt: ['prompt', 'geração', 'despertar', 'sem assinar'],
    it: ['prompt', 'generazione', 'risveglio', 'non firmato'],
    de: ['Prompt', 'Erzeugung', 'Aufwachen', 'unsigniert'],
    ru: ['prompt', 'генерация', 'пробуждение', 'без подписи'],
    el: ['prompt', 'παραγωγή', 'αφύπνιση', 'ανυπόγραφο']
  };
  /* UN SOLO CARGADOR para la familia del motor, compartido con `piso-chat.js`:
     la piden los dos y no hace falta pedirla dos veces. Si no llega, las
     claves salen a la vista --- feo y legible antes que bonito y mudo. */
  var TX = null, pidiendo = null;
  function textos() {
    if (TX) return Promise.resolve(TX);
    if (pidiendo) return pidiendo;
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var pide = function (l) {
      return fetch('/motor-' + l + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    };
    pidiendo = pide(lang).then(function (d) { return d || pide('es'); })
      .then(function (d) { TX = (d && d.ui) || {}; return TX; });
    return pidiendo;
  }
  window.MotorTextos = textos;
  function X(k) { return (TX && TX[k]) || k; }

  /* --- LA FICHA: LORE A LA VISTA, LO TECNICO PLEGADO (2026-09-22) ----------
     El Soberano: «los datos tecnicos deben estar en un desplegable; los
     usuarios no tecnicos solo deben saber sobre el lore». Asi que arriba va lo
     que se entiende sin saber que es un token --quien es, donde corre y su
     historia-- y la etiqueta del modelo, las cifras, la descarga y la memoria
     van dentro de un `<details>` que abre quien quiera.

     VA LO PRIMERO DE LA VENTANA DE DESCARGA, y no al final como antes: quien
     va a bajar un modelo tiene que saber cual es ANTES de ver el boton. Un
     boton de «descargar ~1 GB» sin decir de que es pide fe.

     QUIEN LA LLAMA. Antes, un clic en una tarjeta; desde que se retiraron,
     `piso-chat.js` al abrir cada piso de la Torre. `donde` llega de
     `cerebros.json` › `pisos`: el mismo Mini puede correr en el rack o en el
     navegador, y la ficha tiene que decir cual, porque es lo que decide si tu
     pregunta sale de tu aparato.

     La tabla vieja (`.medidas`) se sigue escondiendo con `con-cerebro`: pinta
     UNA pasada de llama-bench de OTRO modelo --el 27B del nodo, que ni sirve
     la web-- y se retiraba solo cuando habia cerebro elegido. Ahora siempre lo
     hay en la portada, asi que no vuelve a verse salvo si el catalogo falla. */
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }
  function cifra(v, unidad) {
    return v == null ? 'NO_DATA' : String(v).replace('.', ',') + unidad;
  }
  var medidoAqui = null;
  function ficha(modelo, REG, PROSA, donde) {
    var host = document.getElementById('especificaciones');
    if (!host || !REG) return;
    var c = (REG.cerebros || []).filter(function (x) { return x.modelo === modelo; })[0];
    var t = c ? ((PROSA || {})[c.id] || {}) : {};
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var w = PAL[lang] || PAL.en;
    if (!TX) { textos().then(function () { ficha(modelo, REG, PROSA, donde); }); }
    var nav = donde === 'navegador';
    var N = REG.navegador || {};
    host.classList.toggle('con-cerebro', !!c);

    var caja = document.getElementById('ficha-cerebro');
    if (!caja) { caja = el('div', 'ficha-cerebro'); caja.id = 'ficha-cerebro'; }
    if (host.firstChild !== caja) host.insertBefore(caja, host.firstChild);
    caja.innerHTML = '';
    if (!c) return;                       // sin cerebro no se inventa uno

    var cab = el('div', 'cerebro-cab');
    cab.appendChild(el('h3', 'ficha-nombre', t.nombre || c.id));
    caja.appendChild(cab);
    caja.appendChild(el('p', 'ficha-donde', nav ? X('fichaNav') : X('fichaRack')));
    if (t.lore) caja.appendChild(el('blockquote', 'ficha-lore', t.lore));

    var tec = el('details', 'ficha-tecnica');
    tec.appendChild(el('summary', null, X('fichaTec')));
    tec.appendChild(el('p', 'cerebro-modelo', nav ? (N.webllm || c.modelo) + ' · WebLLM' : c.modelo));
    if (t.que_es) tec.appendChild(el('p', 'cerebro-que', t.que_es));
    if (nav) {
      tec.appendChild(el('p', 'cerebro-datos', X('fichaBaja') + ' ' + cifra(N.descarga_mb, ' MB') +
        ' · ' + X('fichaVez')));
      tec.appendChild(el('p', 'cerebro-datos', X('fichaVram') + ' ~' + cifra(N.vram_mb, ' MB')));
      /* LA VELOCIDAD DEL NAVEGADOR NO SE PUBLICA: depende del aparato de quien
         lo baja, y cualquier cifra nuestra seria la de NUESTRA maquina puesta
         en la tuya. Se mide en tu primer turno y se escribe aqui. */
      tec.appendChild(el('p', 'cerebro-datos ficha-vel',
        medidoAqui ? X('fichaAqui') + ': ' + medidoAqui + ' tok/s' : X('fichaVel')));
    } else {
      var d = el('p', 'cerebro-datos');
      d.appendChild(el('b', null, cifra(c.prompt, '')));
      d.appendChild(el('span', null, ' ' + w[0] + ' · '));
      d.appendChild(el('b', null, cifra(c.generacion, '')));
      d.appendChild(el('span', null, ' ' + w[1] + ' tok/s · ' + w[2] + ' '));
      d.appendChild(el('b', null, cifra(c.carga_s, ' s')));
      tec.appendChild(d);
      /* La procedencia va PEGADA a la cifra: una velocidad sin backend ni fecha
         al lado es media medida. */
      tec.appendChild(el('p', 'cerebro-firma',
        (c.firmado ? '' : w[3]) + ' · contexto ' + REG.contexto +
        ' · ' + REG.backend + ' · ' + REG.medido));
    }
    if (t.purpose) tec.appendChild(el('p', 'cerebro-busca', t.purpose));
    caja.appendChild(tec);
  }

  /* El primer turno del navegador trae su medida: tokens que DECLARO el motor
     y tiempo de generacion. Sin tokens declarados no hay cifra. */
  document.addEventListener('preceptor:turno', function (e) {
    var d = e.detail || {};
    if (d.via !== 'webllm' || !d.tokens || d.ttft == null) return;
    var s = (d.ms - d.ttft) / 1000;
    if (s <= 0) return;
    medidoAqui = String(Math.round(d.tokens / s * 10) / 10).replace('.', ',');
    var v = document.querySelector('#ficha-cerebro .ficha-vel');
    if (v) v.textContent = X('fichaAqui') + ': ' + medidoAqui + ' tok/s';
  });

  window.CerebroFicha = ficha;
})();
