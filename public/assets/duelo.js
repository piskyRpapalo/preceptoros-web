/* preceptoros.org · LoRAtelier · el duelo de dos pantallas y un veredicto.
 *
 * QUE SE ENFRENTA HOY, Y POR QUE NO ES LO QUE PROMETIA EL ROTULO
 * ---------------------------------------------------------------
 * Los rotulos de este duelo llevan escritos en las ocho lenguas desde antes
 * que el codigo, y decian «Sin LoRA · la base desnuda» contra «Con LoRA · el
 * adaptador de esta linea». **Hoy no hay adaptador.** Medido el 2026-09-20:
 * `ollama list` no tiene un solo `preceptor-*` que sea un afinado --- son
 * Modelfiles con system prompt sobre Mistral --- y los dos que salieron de la
 * forja el 2026-09-19 acabaron RECHAZADOS, uno por mudo y otro por
 * degenerado.
 *
 * Pintar dos columnas llamando «con LoRA» a la segunda seria inventar el
 * producto en la pantalla del producto. Asi que el duelo enfrenta lo que SI
 * existe y lo que ademas resulta ser la leccion del dia:
 *
 *     el MISMO modelo, desnudo y vestido.
 *
 * Izquierda: la pregunta a pelo, sin una linea de system. Derecha: la misma
 * pregunta con el arnes que sirve esta casa --- las reglas, los hechos del
 * producto ---. Y la razon de que esto valga una pantalla entera es una medida
 * de esta manana: `qwen3:1.7b` paso de mediana 4 a mediana 10 en el juez de la
 * casa SIN TOCAR EL MODELO. Lo unico que cambio fue contarle que es
 * PreceptorOS. Antes de eso se invento que tenia «mas de 100 usuarios
 * activos».
 *
 * El dia que haya un adaptador, lo que cambia es el par --- y los rotulos
 * vuelven a decir LoRA con razon. La forma de la pantalla no cambia.
 *
 * ES SECUENCIAL, Y SE DICE
 * -------------------------
 * El navegador podria lanzar los dos turnos a la vez, y quedaria mas vistoso.
 * El rack NO los atiende a la vez: `OLLAMA_NUM_PARALLEL=1` y
 * `OLLAMA_MAX_LOADED_MODELS=1`, asi que la concurrencia no añade capacidad,
 * solo reparte la misma y alarga la espera. Un `Promise.all` aqui pintaria dos
 * ruedas girando y mentiria sobre lo que pasa al otro lado.
 *
 * Van uno detras de otro y cada columna enseña SUS segundos. Medido el
 * 2026-09-20 con el par de hoy: 2,15 s + 1,48 s = **3,63 s de pared**, y sin
 * intercambio de modelo --- que es la ventaja escondida de enfrentar un modelo
 * consigo mismo: el rack no tiene que descargar y recargar nada entre las dos
 * columnas, que es lo que costaba entre 2,2 y 8,2 s cuando el duelo era entre
 * dos modelos distintos.
 *
 * EL VEREDICTO LO PONE LA PERSONA
 * --------------------------------
 * No hay juez automatico aqui, y `duelo_juez_no_data` ya lo decia antes de que
 * existiera este fichero: «no se inventa un veredicto con la red». El juez de
 * dos capas de la casa vive en el laboratorio y no se expone: cuesta un 30B
 * por turno. Lo que sale de esta pantalla es el juicio de un humano, firmado,
 * que es justamente el dato que al rack le falta.
 */
(function () {
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var UI = {};

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto) { n.textContent = texto; }
    return n;
  }

  function estilo() {
    if (document.getElementById('duelo-estilo')) { return; }
    var s = el('style');
    s.id = 'duelo-estilo';
    s.textContent =
      '#duelo{margin:2rem 0}' +
      '#duelo .duelo-campo{width:100%;box-sizing:border-box;font:inherit;' +
        'color:inherit;background:transparent;border:1px solid currentColor;' +
        'border-radius:.3rem;padding:.5rem;margin:.4rem 0}' +
      '#duelo .duelo-dos{display:grid;gap:.75rem;grid-template-columns:1fr;' +
        'margin-top:.75rem}' +
      /* DOS COLUMNAS SOLO CUANDO CABEN. En un telefono, dos columnas de texto
         a 180 px son dos columnas ilegibles: se apilan, y la de arriba sigue
         siendo la desnuda. El orden importa mas que la disposicion. */
      '@media(min-width:44rem){#duelo .duelo-dos{grid-template-columns:1fr 1fr}}' +
      '#duelo .duelo-col{border:1px solid currentColor;border-radius:.4rem;' +
        'padding:.6rem}' +
      '#duelo .duelo-cab{font-weight:600;font-size:.9em;opacity:.85;' +
        'margin-bottom:.4rem}' +
      '#duelo .duelo-texto{white-space:pre-wrap;min-height:3rem}' +
      '#duelo .duelo-ms{opacity:.6;font-size:.85em;margin-top:.4rem}' +
      '#duelo .duelo-mandos{display:flex;gap:.5rem;flex-wrap:wrap;' +
        'margin-top:.6rem}' +
      '#duelo .duelo-mandos button{font:inherit;cursor:pointer}';
    document.head.appendChild(s);
  }

  /* QUIEN CONTESTA. Se pregunta a `CerebroPuesto`, que es quien MANDA ---
     envuelve `Rack.stream` y sustituye cualquier nombre ---, y solo si no esta
     se lee la puerta del registro. Las dos leen la misma declaracion; lo que
     no se hace es repetir aqui la REGLA de cual es la puerta. */
  function cerebro() {
    if (typeof window.CerebroPuesto === 'function') {
      var m = window.CerebroPuesto();
      if (m) { return Promise.resolve(m); }
    }
    return fetch('/cerebros.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var c = (d.cerebros || []).filter(function (x) { return x.puerta; })[0];
        return c ? c.modelo : null;
      })
      .catch(function () { return null; });
  }

  /* EL ARNES ES EL QUE SIRVE LA CASA, no uno escrito aqui para la ocasion.
     Sale de `PR.reglas` --- traducidas en las ocho lenguas --- y de
     `torre_hechos`, que es el mismo bloque que `camino-papel.js` le pone
     delante a cada piso de la Torre. Si fueran dos textos distintos, esta
     pantalla estaria comparando contra un arnes que el sitio no usa, y el
     veredicto que firme la persona no valdria para nada. */
  function arnes() {
    var r = (window.PR && window.PR.reglas) || [];
    var base = Array.isArray(r) ? r.join('. ') : String(r || '');
    var h = UI.torre_hechos;
    return base + (h && h.indexOf('NO_DATA') !== 0 ? '\n' + h : '');
  }

  function turno(modelo, prompt, col, ms) {
    var t0 = Date.now(), texto = '';
    col.textContent = '';
    return window.Rack.stream(modelo, prompt, function (trozo) {
      texto += trozo;
      col.textContent = texto;
    }).then(function (tokens) {
      var s = (Date.now() - t0) / 1000;
      ms.textContent = s.toFixed(1) + ' s' + (tokens ? ' · ' + tokens + ' tok' : '');
      return texto;
    }).catch(function (e) {
      /* UN FALLO NO DEJA LA COLUMNA EN BLANCO. Una caja vacia al lado de una
         llena se lee como «este modelo no supo que decir», que es una
         acusacion falsa contra el modelo cuando lo que fallo fue la red. */
      col.appendChild(el('p', 'no-data', 'NO_DATA · ' + e.message));
      ms.textContent = '';
      return null;
    });
  }

  function pinta(host) {
    if (document.getElementById('duelo')) { return; }
    estilo();
    var sec = el('section', 'panel');
    sec.id = 'duelo';
    sec.appendChild(el('h2', null, UI.duelo_titulo || 'Duelo'));

    var campo = document.createElement('textarea');
    campo.className = 'duelo-campo';
    campo.rows = 2;
    campo.placeholder = UI.duelo_input || '';
    campo.setAttribute('aria-label', UI.duelo_input || 'Duelo');
    sec.appendChild(campo);

    var mandos = el('div', 'duelo-mandos');
    var lanzar = el('button', null, UI.duelo_enviar || 'Enviar');
    lanzar.type = 'button';
    mandos.appendChild(lanzar);
    sec.appendChild(mandos);

    var dos = el('div', 'duelo-dos');
    var cols = {};
    [['base', UI.duelo_col_base], ['lora', UI.duelo_col_lora]].forEach(
      function (par) {
        var c = el('div', 'duelo-col');
        c.appendChild(el('div', 'duelo-cab', par[1] || par[0]));
        var t = el('div', 'duelo-texto');
        var m = el('div', 'duelo-ms');
        c.appendChild(t); c.appendChild(m);
        dos.appendChild(c);
        cols[par[0]] = { texto: t, ms: m };
      });
    sec.appendChild(dos);

    /* EL AVISO DE QUE VAN EN FILA. Va SIEMPRE, no solo mientras corren: quien
       llega a la pagina y ve dos columnas da por hecho que se contestan a la
       vez, y esa suposicion es la que hay que desmontar antes de que pulse. */
    sec.appendChild(el('p', 'no-data', UI.duelo_juez_no_data || ''));

    var veredicto = el('div', 'duelo-veredicto');
    sec.appendChild(veredicto);

    lanzar.addEventListener('click', function () {
      var q = campo.value.trim();
      if (!q) { campo.focus(); return; }
      if (!window.Rack) {
        cols.base.texto.textContent = '';
        cols.base.texto.appendChild(el('p', 'no-data',
          'NO_DATA · esta pagina no tiene cliente del rack'));
        return;
      }
      lanzar.disabled = true;
      lanzar.textContent = UI.duelo_reescribir || UI.duelo_enviar || '…';
      veredicto.innerHTML = '';
      cerebro().then(function (m) {
        if (!m) { throw new Error('NO_DATA · no hay cerebro elegido'); }
        /* PRIMERO EL DESNUDO. El orden no es casual: si se pintara antes el
           vestido, la columna buena se leeria como «la normal» y la desnuda
           como un fallo. Se enseña primero lo que contesta un modelo al que
           nadie le ha dicho nada, que es el punto de la pantalla. */
        return turno(m, q, cols.base.texto, cols.base.ms).then(function (a) {
          return turno(m, arnes() + '\n\n' + q, cols.lora.texto, cols.lora.ms)
            .then(function (b) { return { modelo: m, a: a, b: b }; });
        });
      }).then(function (r) {
        lanzar.disabled = false;
        lanzar.textContent = UI.duelo_reescribir || 'Reenviar';
        if (r && r.a !== null && r.b !== null) {
          montaVeredicto(veredicto, q, r);
        }
      }).catch(function (e) {
        lanzar.disabled = false;
        lanzar.textContent = UI.duelo_enviar || 'Enviar';
        veredicto.innerHTML = '';
        veredicto.appendChild(el('p', 'no-data', e.message));
      });
    });

    host.parentNode.insertBefore(sec, host.nextSibling);
  }

  /* EL VEREDICTO SE FIRMA CON LA MISMA MAQUINARIA QUE UN PASO DE LA TORRE, y
     esta pantalla no habla con el rack para enviarlo: guarda en `Bronce` y
     sale por la unica puerta que tiene el sitio. Firmar NO envia, y se dice.

     `origen` lleva `#duelo` dentro por lo mismo que la Torre lleva su piso:
     un veredicto de aqui y una correccion de la portada son dos poblaciones
     distintas --- distinta intencion, distinto publico --- y mezclarlas
     contamina las dos. */
  function montaVeredicto(caja, pregunta, r) {
    caja.innerHTML = '';
    caja.appendChild(el('p', 'duelo-cab', UI.duelo_veredicto || 'Veredicto'));
    var area = document.createElement('textarea');
    area.className = 'duelo-campo';
    area.rows = 3;
    area.placeholder = UI.duelo_guia || '';
    area.setAttribute('aria-label', UI.duelo_veredicto || 'Veredicto');
    caja.appendChild(area);
    var firmar = el('button', null, UI.duelo_firmar || 'Firmar');
    firmar.type = 'button';
    caja.appendChild(firmar);
    var dice = el('p', 'no-data', '');
    caja.appendChild(dice);

    firmar.addEventListener('click', function () {
      var t = area.value.trim();
      if (!t) { dice.textContent = UI.duelo_sin_prueba || ''; area.focus(); return; }
      if (!window.Identity || !window.Bronce) {
        dice.textContent = 'NO_DATA · este navegador no tiene identidad ni almacen';
        return;
      }
      firmar.disabled = true;
      var reg = {
        prompt: pregunta,
        /* LA RECHAZADA ES LA DESNUDA Y LA ELEGIDA ES LA VESTIDA, y esto es una
           afirmacion fuerte que conviene mirar de frente: se da por hecho que
           el arnes mejora. Lo dice una medida --- de 4 a 10 en el juez de la
           casa --- y no una preferencia. Si la persona opina lo contrario, eso
           es exactamente lo que escribe en el veredicto, y el veredicto viaja
           entero en `correccion`. */
        respuesta: r.a,
        correccion: t,
        corregido: new Date().toISOString(),
        modelo: r.modelo,
        idioma: lang,
        motivo: 'duelo',
        tarea: 'libre',
        consent: 0,
        origen: 'preceptoros.org' + location.pathname + '#duelo',
        tipo: 'correccion',
        autoridad: 1
      };
      window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return window.Bronce.guardar({ par: reg, firma: f.firma,
            autor: f.autor, algoritmo: f.algoritmo, publica: pub });
        });
      }).then(function () {
        caja.innerHTML = '';
        caja.appendChild(el('p', 'duelo-cab',
          (UI.duelo_firmar || '') + ' ✓'));
        var aviso = UI.torre_no_enviado || '';
        var boton = (window.ENVT && window.ENVT.envBoton) || '';
        if (aviso) {
          caja.appendChild(el('p', 'no-data',
            aviso + (boton ? ' «' + boton + '»' : '')));
        }
      }).catch(function (e) {
        firmar.disabled = false;
        dice.textContent = e.message;
        /* La misma salida del callejon que la Torre. Es la CUARTA copia de
           este bloque en el arbol --- `corregir.js`, `resena.js`,
           `camino-papel.js` y esta ---, y ya no es una anecdota: esta anotada
           en OPTIMIZACIONES como extraccion pendiente, con su cifra. */
        var H = (window.Hub && window.Hub.textos) || {};
        if (/sin identidad/.test(String(e && e.message)) && window.Identity
            && window.Identity.crear && !caja.querySelector('.crear-id')) {
          var nace = el('button', 'boton crear-id', H.idEntrar || 'Entrar');
          nace.type = 'button';
          nace.addEventListener('click', function () {
            nace.disabled = true;
            window.Identity.crear().then(function () {
              nace.remove(); dice.textContent = ''; firmar.click();
            }, function (x) {
              nace.disabled = false;
              dice.textContent = x && x.message ? x.message : String(x);
            });
          });
          caja.appendChild(nace);
        }
      });
    });
  }

  function arranca() {
    var host = document.getElementById('probador') ||
               document.getElementById('comparar');
    if (!host) { return; }
    /* DOS FICHEROS DE ROTULOS, y los dos hacen falta: los del duelo y
       `torre_hechos`, que es el arnes que se compara. Se piden a la vez y se
       espera a los dos --- si el arnes no llegara, la columna derecha seria
       el modelo desnudo con otro nombre, que es la peor forma de fallar:
       pareceria que el arnes no sirve para nada. */
    Promise.all([
      fetch('/duelos-' + lang + '.json').then(function (r) { return r.json(); }),
      fetch('/caminos-' + lang + '.json').then(function (r) { return r.json(); })
    ]).then(function (ds) {
      UI = Object.assign({}, (ds[0].ui || {}), {
        torre_hechos: (ds[1].ui || {}).torre_hechos,
        torre_no_enviado: (ds[1].ui || {}).torre_no_enviado
      });
      if (!UI.torre_hechos) {
        throw new Error('el arnes no llego: no hay nada que comparar');
      }
      pinta(host);
    }).catch(function (e) {
      if (document.getElementById('duelo')) { return; }
      var p = el('p', 'no-data', 'NO_DATA · el duelo no cargo: ' + e.message);
      p.id = 'duelo';
      host.parentNode.insertBefore(p, host.nextSibling);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arranca);
  } else { arranca(); }
})();
