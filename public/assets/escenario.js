/* preceptoros.org · EL ESCENARIO. La tarjeta secuestra la pantalla.
 *
 * POR QUE UNA TOMA DE PANTALLA Y NO UN DESPLEGABLE (orden del Soberano,
 * 2026-09-14). El desplegable dejaba la ficha dentro de la rejilla: para leerla
 * habia que empujar las otras seis tarjetas hacia abajo, y para hablar con la
 * linea habia que irse a otra pagina. Aqui pasa lo contrario -- se pulsa una
 * tarjeta y el resto del sitio desaparece: queda esa linea, su chat y lo que le
 * ha pasado. Una cosa a la vez, que es lo que hace falta para evaluar.
 *
 * DOS FICHEROS Y NO UNO. `taller.js` cerraba a 1,7 KB de su tope de 16 KB y esto
 * son siete: la casa PARTE en vez de recortar, y el corte cae donde cambia el
 * asunto. `taller.js` pinta la vitrina --lo que se ve de fuera-- y este pinta lo
 * que pasa cuando entras. Ninguno de los dos sabe como hace el otro su trabajo.
 *
 * EL CHAT NO ES UN TERCER MOTOR. Habla por `window.Rack`, el mismo cliente de
 * cuatro kilobytes que ya usa la portada, y no trae ni seleccion de motor, ni
 * WebLLM, ni medidor: esta pagina no mide, esa es la del Libro de Pruebas. Por
 * eso cuesta nueve claves de texto y no setenta -- que es exactamente lo que no
 * cabia en griego cuando se intento traer el probador entero.
 *
 * Y LO QUE DEVUELVE EL MODELO PASA POR `sinFuga`. Es la puerta unica que
 * `state.js` expone y que `chat.js` ya cruza; abrir una segunda via que pintara
 * crudo devolveria el bloque de estado a la conversacion --paso, en el telefono,
 * y costo entenderlo-- sin que nadie lo relacionara con esto.
 */
(function () {
  var abierto = null;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }

  /* Un hecho del registro. Si el dato no esta, la fila NO se pinta: una etiqueta
     con un guion al lado se lee como «medido: nada», que es distinto de «no se
     ha medido». */
  function hecho(padre, etiqueta, valor) {
    if (valor == null || valor === '') return false;
    var li = el('li', 'esc-hecho');
    li.appendChild(el('b', null, etiqueta));
    li.appendChild(el('span', null, String(valor)));
    padre.appendChild(li);
    return true;
  }

  /* Una tanda de entrenamiento, contada con sus cifras. Son las del registro y
     no se redondean: 5,55 s por paso y 84,4 grados es lo que costo, y esa es la
     parte que no cuenta ningun folleto. */
  function tanda(padre, titulo, m, UNI) {
    if (!m) return false;
    var li = el('li', 'esc-hecho esc-tanda');
    li.appendChild(el('b', null, titulo));
    var d = el('span', null, '');
    var partes = [];
    if (m.pasos != null) partes.push(m.pasos + ' ' + (UNI.uPasos || ''));
    if (m.s_paso != null) partes.push(String(m.s_paso).replace('.', ',') +
                                      ' ' + (UNI.uPorPaso || ''));
    if (m.perdida) partes.push(m.perdida);
    if (m.ram_pico_mb != null) partes.push(m.ram_pico_mb + ' MB');
    if (m.temp_max_c != null) partes.push(String(m.temp_max_c).replace('.', ',') + ' °C');
    if (m.minutos != null) partes.push(m.minutos + ' ' + (UNI.uMin || ''));
    d.textContent = partes.join(' · ');
    li.appendChild(d);
    padre.appendChild(li);
    return true;
  }

  /* --- EL LORE DE ACTIVIDAD ------------------------------------------------
     No es una narracion ni un historial: es lo MEDIDO de esta linea, que hasta
     hoy vivia dentro de `loratelier.json` sin que lo viera nadie. No lleva
     fechas por hecho porque el registro no las tiene --solo la suya, global--
     y poner una inventada aqui seria el unico dato falso de la pantalla. */
  function lore(bloque, texto, UI, registro) {
    var sec = el('section', 'esc-lore');
    sec.appendChild(el('h3', null, UI.loreTitulo || ''));
    var ul = el('ul', 'esc-hechos');
    var vivo = false;
    var f = bloque.ficha || {};

    [['hoy', texto.hoy], ['falta', texto.falta], ['aportas', texto.aportas]]
      .forEach(function (x) {
        if (hecho(ul, UI[x[0]] || x[0], x[1])) vivo = true;
      });

    if (tanda(ul, UI.tandaEn || 'EN', f.medida_en, UI)) vivo = true;
    if (tanda(ul, UI.tandaMulti || 'MULTI', f.medida_multi, UI)) vivo = true;
    if (hecho(ul, UI.corpus || 'corpus', f.corpus)) vivo = true;
    /* LO QUE FALLA VA CON LO DEMAS, no en letra pequeña. `prueba_de_fuego` dice
       que los dos modelos fallan como producto, y es el hecho mas util de este
       registro: sin el, un beta parece un producto a medio hacer en vez de una
       tuberia que ya funciona. */
    if (hecho(ul, UI.falla || 'falla', f.prueba_de_fuego)) vivo = true;
    if (hecho(ul, UI.adaptador || 'adaptador', f.adaptador_estado)) vivo = true;

    ['medidas', 'tests', 'valoraciones'].forEach(function (k) {
      var r = bloque[k];
      if (r && typeof r.n === 'number' && r.n > 0) {
        vivo = true;
        hecho(ul, k, r.n + (k === 'medidas' && r.maquina ? ' · ' + r.maquina : ''));
      }
    });

    if (!vivo) ul.appendChild(el('li', 'esc-hecho', UI.loreVacio || ''));
    sec.appendChild(ul);

    /* La ficha, al final y en su caja: son los datos con los que se comprueba,
       no los que cuentan la historia. */
    var dl = el('dl', 'ficha');
    [['familia', f.familia], ['licencia', f.licencia], ['origen', f.origen],
     ['base', f.base_entrenamiento], ['razonamiento', f.razonamiento],
     ['hardware', bloque.requisitos_hw]].forEach(function (x) {
      if (x[1] == null || x[1] === '') return;
      dl.appendChild(el('dt', null, x[0]));
      dl.appendChild(el('dd', 'taller-cifra', x[1]));
    });
    if (bloque.artefacto && bloque.artefacto.sha256_hash) {
      dl.appendChild(el('dt', null, 'firma'));
      dl.appendChild(el('dd', 'taller-cifra', bloque.artefacto.sha256_hash));
    }
    if (dl.children.length) sec.appendChild(dl);
    if (registro && registro.medido) {
      sec.appendChild(el('p', 'esc-fecha', (UI.loreFecha || '') + ' ' + registro.medido));
    }
    return sec;
  }

  /* --- EL CHAT -------------------------------------------------------------
     Un turno, y quien contesta dicho con su nombre. El modelo es el que el rack
     SIRVE para esta linea; si no sirve ninguno, se dice el de entrenamiento y
     se avisa -- nunca se calla cual es. */
  function chat(bloque, texto, UI) {
    var f = bloque.ficha || {};
    var modelo = f.servido_en_el_rack || bloque.modelo_base || null;
    var sec = el('section', 'esc-chat');
    sec.appendChild(el('h3', null, UI.chatTitulo || ''));

    var dialogo = el('div', 'esc-dialogo');
    dialogo.setAttribute('aria-live', 'polite');
    sec.appendChild(dialogo);

    /* Las preguntas de apertura, como botones. Quien llega sin saber que
       preguntar tiene por donde empezar, y de paso ve para que sirve la linea.

       SALEN DEL TEXTO Y NO DEL REGISTRO, y es una correccion que hizo visible
       esta misma pantalla: vivian en `loratelier.json`, que es el fichero de
       HECHOS y cuyo contrato dice, con esas palabras, que ahi no va una palabra
       de prosa. Estaban en castellano, y en cuanto se sacaron a la vista se
       veian en castellano en las ocho lenguas. Un fichero de hechos no tiene
       idioma; estas frases si. */
    var ps = texto.plantilla || [];
    if (ps.length) {
      var caja = el('div', 'esc-sugiere');
      caja.appendChild(el('b', null, UI.sugerencias || ''));
      ps.forEach(function (p) {
        var b = el('button', 'esc-sug', p);
        b.type = 'button';
        b.addEventListener('click', function () { entrada.value = p; entrada.focus(); });
        caja.appendChild(b);
      });
      sec.appendChild(caja);
    }

    var fila = el('div', 'esc-fila');
    var entrada = document.createElement('textarea');
    entrada.className = 'esc-entrada';
    entrada.rows = 2;
    entrada.placeholder = UI.chatPide || '';
    entrada.setAttribute('aria-label', UI.chatTitulo || 'chat');
    var enviar = el('button', 'boton', UI.chatEnviar || '');
    enviar.type = 'button';
    fila.appendChild(entrada); fila.appendChild(enviar);
    sec.appendChild(fila);

    sec.appendChild(el('p', 'esc-quien',
      (UI.chatQuien || '') + ' ' + (modelo || 'NO_DATA')));

    function di(clase, t) {
      var p = el('p', clase, t);
      dialogo.appendChild(p);
      dialogo.scrollTop = dialogo.scrollHeight;
      return p;
    }

    function turno() {
      var t = entrada.value.trim();
      if (!t) return;
      di('esc-yo', t);
      entrada.value = '';
      if (!window.Rack || !modelo) { di('esc-fallo', UI.chatSinRack || ''); return; }
      enviar.disabled = true;
      var p = di('esc-el', ''), acc = '';
      window.Rack.stream(modelo, t, function (d) {
        acc += d;
        acc = acc.replace(/https?:\/\/[^\s]+/g, '[URL_BLOQUEADA]');
        p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
      }).then(function () {
        enviar.disabled = false;
        if (!acc) p.textContent = UI.chatFallo || '';
      }).catch(function (e) {
        // La causa ENTERA, con su codigo. El tunel existe y `agora_api` todavia
        // no publica esta ruta: un chat en blanco haria pensar en un fallo de
        // red, que es otra averia y se busca en otro sitio.
        enviar.disabled = false;
        p.className = 'esc-fallo';
        p.textContent = (UI.chatFallo || '') + ' ' + (e && e.message ? e.message : e);
      });
    }

    enviar.addEventListener('click', turno);
    entrada.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); turno(); }
    });
    return sec;
  }

  function cerrar() {
    if (!abierto) return;
    document.documentElement.classList.remove('sin-scroll');
    abierto.caja.remove();
    if (abierto.volver && abierto.volver.focus) abierto.volver.focus();
    abierto = null;
  }

  window.Escenario = {
    abrir: function (bloque, texto, UI, registro, sello) {
      cerrar();
      var fondo = el('div', 'escenario');
      fondo.setAttribute('role', 'dialog');
      fondo.setAttribute('aria-modal', 'true');
      fondo.setAttribute('aria-label', texto.nombre || bloque.id);

      var caja = el('div', 'esc-caja');
      var cab = el('header', 'esc-cab');
      var h2 = el('h2', null, texto.nombre || bloque.id);
      cab.appendChild(h2);
      if (sello) cab.appendChild(sello);
      var x = el('button', 'esc-cerrar', '×');
      x.type = 'button';
      x.setAttribute('aria-label', UI.cerrar || 'X');
      cab.appendChild(x);
      caja.appendChild(cab);

      var cuerpo = el('div', 'esc-cuerpo');
      cuerpo.appendChild(chat(bloque, texto, UI));
      cuerpo.appendChild(lore(bloque, texto, UI, registro));
      caja.appendChild(cuerpo);
      fondo.appendChild(caja);
      document.body.appendChild(fondo);
      // El fondo deja de moverse detras: si no, al cerrar apareces en otro
      // sitio de la pagina y parece que se ha navegado.
      document.documentElement.classList.add('sin-scroll');
      abierto = { caja: fondo, volver: document.activeElement };

      x.addEventListener('click', cerrar);
      fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc); }
      });
      h2.setAttribute('tabindex', '-1');
      h2.focus();
    },
    cerrar: cerrar
  };
})();
