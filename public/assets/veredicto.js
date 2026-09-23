/* preceptoros.org · EL VEREDICTO DE DOS CAPAS: reglas en tu navegador, juez en el rack.
 *
 * QUE PIDIO EL SOBERANO (2026-09-23): «asegurate de poner los modelos + el
 * juez, en todos los casos». Hasta hoy solo el piso 6 tenia juez (`juez.js`),
 * y su propio veredicto salia marcado como media medida: la doctrina del
 * panel dice «determinista primero, modelo despues; una sola capa es
 * NO_DATA», y desde el navegador solo se podia pedir la del modelo.
 *
 * LA CAPA 1 YA NO NECESITA EL RACK. Son los detectores de
 * `hexelion/laboratorio/mide_pisos.py`, validados esa misma noche contra 96
 * respuestas reales --y corregidos cuando dieron falsos positivos--, portados
 * aqui. Corren en el aparato, sin red y gratis:
 *   · degenera  n-gramas de 4 distintos / total >= 0,7 (el bucle «jabon de jabon»)
 *   · recita    menos del 30 % de la respuesta copiado literal del papel
 *   · producto  no afirma que PreceptorOS sea otra cosa (sin contar negaciones)
 *   · cifras    ninguna cifra que no salga de la pregunta ni del papel
 *   · contesta  toca algun termino de la pregunta (si la pregunta da para juzgar)
 *
 * LA CAPA 2 ES UN MODELO DE OTRA FAMILIA. `cerebros.json` › `juez`: hoy
 * `qwen2.5:7b`, que no es de la casa de los que contestan. Su rubrica es el
 * OBJETIVO del piso (`objetivos-<lengua>.json`): lo que buscamos aprender es
 * exactamente contra lo que se le juzga. Va por `Rack.streamExacto`, porque el
 * envoltorio del selector cambiaria el juez por el modelo que contesta.
 *
 * SE PIDE CON UN BOTON, NUNCA SOLO. Cada veredicto carga el modelo juez y
 * desaloja al que contesta (`MAX_LOADED_MODELS=1`): pagarlo en cada turno
 * seria doblar la espera de la cola del rack para todo el mundo.
 *
 * LOS TEXTOS vienen de `objetivos-<lengua>.json` (claves `juez_*`), la
 * familia donde vive lo que se mide en cada piso. Lo trae `chat-router.js`
 * con la Torre.
 */
(function () {
  'use strict';
  if (window.Veredicto) return;
  var UI = null, pidiendo = null, JUEZ = null;

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = String(x);
    return n;
  }
  function textos() {
    if (UI) return Promise.resolve(UI);
    if (pidiendo) return pidiendo;
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var pide = function (l) {
      return fetch('/objetivos-' + l + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    };
    pidiendo = pide(lang).then(function (d) { return d || pide('es'); })
      .then(function (d) { UI = (d && d.ui) || {}; return UI; });
    return pidiendo;
  }
  function T(k) { return (UI && UI[k]) || k; }
  function juez() {
    var r = window.CerebrosReg && window.CerebrosReg.reg;
    return (r && r.juez && r.juez.modelo) || JUEZ;
  }

  /* --- CAPA 1 · las reglas ------------------------------------------------ */
  var PALABRA = /[a-záéíóúñüàâçèêëîïôûœäöß]{5,}/gi;
  function palabras(t) { return (t || '').toLowerCase().split(/\s+/).filter(Boolean); }
  function gramas(ps, n) {
    var g = [], i;
    for (i = 0; i + n <= ps.length; i++) g.push(ps.slice(i, i + n).join(' '));
    return g;
  }
  function degenera(t) {
    var ps = palabras(t);
    if (ps.length < 6) return false;
    var g = gramas(ps, 4), u = {};
    g.forEach(function (x) { u[x] = 1; });
    return Object.keys(u).length / g.length < 0.7;
  }
  function recita(t, papel) {
    var ps = palabras(t), ref = {};
    if (ps.length < 6 || !papel) return false;
    gramas(palabras(papel), 6).forEach(function (x) { ref[x] = 1; });
    var g = gramas(ps, 6);
    return g.filter(function (x) { return ref[x]; }).length / g.length >= 0.3;
  }
  var FALSO = /distribuci[oó]n de linux|linux distribution|es un sistema operativo|is an operating system|m[aá]s de \d+ usuarios|miles de usuarios|thousands of users/gi;
  var NIEGA = /\b(no|ni|not|nor|never|nunca)\b[^.;:]{0,25}$/i;
  function producto(t) {
    var m, s = t || '';
    FALSO.lastIndex = 0;
    while ((m = FALSO.exec(s))) {
      if (!NIEGA.test(s.slice(Math.max(0, m.index - 40), m.index))) return true;
    }
    return false;
  }
  // Cifras de dos o mas digitos, o de uno con unidad. «1.» de una lista no cuenta.
  // Las unidades largas ANTES que las cortas: con «g» delante, «300 gramos»
  // se leia «300 g».
  var CIFRA = /\b\d+(?:[.,]\d+)?\s*(?:gramos?|litros?|minutos?|horas?|grados?|kg|mg|ml|%|°|g|l)?/gi;
  /* Not quantities: IPv4 addresses, host:port and port numbers named as such.
     Measured in the Tower study (2026-09-24): «127.0.0.1» and «80, 443» were
     flagged as unsupported numbers in correct answers about ports. */
  var NO_CIFRA = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b|:\d{2,5}\b|\b(?:puertos?|ports?|porte|porta|porto|Port)\s*:?\s*\d+(?:\s*(?:,|y|and|e|et|und)\s*\d+)*/gi;
  function cifras(t, fuentes) {
    var sueltas = [], m;
    t = (t || '').replace(NO_CIFRA, ' ');
    CIFRA.lastIndex = 0;
    while ((m = CIFRA.exec(t || ''))) {
      var n = m[0].replace(/[^\d.,]/g, '').replace(/[.,]$/, '');
      var conUnidad = /[^\d.,\s]/.test(m[0]);
      if (n.length < 2 && !conUnidad) continue;
      if ((fuentes || '').indexOf(n) === -1) sueltas.push(m[0].trim());
    }
    return sueltas;
  }
  function contesta(t, pregunta) {
    var raiz = function (w) { return w.slice(0, 4).toLowerCase(); };
    var q = {}, n = 0;
    ((pregunta || '').match(PALABRA) || []).forEach(function (w) {
      if (!q[raiz(w)]) { q[raiz(w)] = 1; n++; }
    });
    if (n < 2) return true;               // la pregunta no da para decidir
    return ((t || '').match(PALABRA) || []).some(function (w) { return q[raiz(w)]; });
  }
  /* Template leaks and echoes (Tower study, 2026-09-24): a small model returned
     the user's own question with « /no_think» glued on, and another one spilled
     «## Your task: **Document:**». Neither broke any of the five rules. */
  var FUGA = /\/no_think|\/think\b|#{2,3}\s*(?:your task|instruction|document)|<\|[a-z_]+\|>|\[\/?INST\]/i;
  function fuga(t, pregunta) {
    if (FUGA.test(t || '')) return true;
    var q = (pregunta || '').trim().toLowerCase().slice(0, 60);
    return q.length >= 15 && (t || '').trim().toLowerCase().indexOf(q) === 0;
  }
  function reglas(respuesta, pregunta, papel) {
    var s = cifras(respuesta, (pregunta || '') + ' ' + (papel || ''));
    return [
      ['juez_degenera', !degenera(respuesta)],
      ['juez_recita', !recita(respuesta, papel)],
      ['juez_producto', !producto(respuesta)],
      ['juez_cifras', !s.length, s.join(', ')],
      ['juez_fuga', !fuga(respuesta, pregunta)],
      ['juez_contesta', contesta(respuesta, pregunta)]
    ];
  }

  /* --- el recuadro ---------------------------------------------------------
     `o` trae funciones y no valores porque el recuadro se monta ANTES de que
     haya conversacion: `pregunta()`, `respuesta()`, `papel()`, `objetivo()`
     se leen en el momento del clic. */
  function monta(host, o) {
    var sec = el('section', 'veredicto');
    var b = el('button', 'veredicto-pedir', '…');
    b.type = 'button';
    var sal = el('div', 'veredicto-salida');
    sal.setAttribute('aria-live', 'polite');
    sec.appendChild(b); sec.appendChild(sal);
    host.appendChild(sec);
    textos().then(function () { b.textContent = T('juez_pedir'); });

    b.addEventListener('click', function () {
      textos().then(function () {
        sal.innerHTML = '';
        var q = o.pregunta(), r = o.respuesta();
        if (!r || !r.trim()) { sal.appendChild(el('p', 'no-data', T('juez_sin_turno'))); return; }
        var papel = o.papel ? o.papel() : '';
        // Capa 1: en el aparato, sin red.
        sal.appendChild(el('p', 'veredicto-capa', T('juez_capa1')));
        var ul = el('ul', 'veredicto-reglas');
        reglas(r, q, papel).forEach(function (x) {
          var li = el('li', x[1] ? 'ok' : 'ko',
            (x[1] ? '✓ ' : '✗ ') + T(x[0]) + (x[2] ? ' · ' + x[2] : ''));
          ul.appendChild(li);
        });
        sal.appendChild(ul);
        // Capa 2: el modelo juez del rack, contra el objetivo del piso.
        var m = juez();
        sal.appendChild(el('p', 'veredicto-capa', T('juez_capa2') + (m ? ' · ' + m : '')));
        var p = el('p', 'veredicto-juez', '…'); sal.appendChild(p);
        var R = window.Rack;
        var llama = R && (R.streamExacto || R.stream);
        if (!llama || !m) { p.className = 'no-data'; p.textContent = 'NO_DATA · ' + (m || 'cerebros.json › juez'); return; }
        b.disabled = true;
        /* LA PREGUNTA PRIMERO, EL OBJETIVO DETRAS Y COMO CONTEXTO. Medido con
           un par bueno/malo sobre purificar agua: con el objetivo delante,
           `qwen2.5:7b` suspendia las DOS --lo leia como una lista que cada
           respuesta debia cubrir--; con este orden separa bien, igual que el
           de 14B, que pesa el doble. */
        var prompt = '[PREGUNTA]\n' + (q || '') + '\n[/PREGUNTA]\n[RESPUESTA]\n' + r +
          '\n[/RESPUESTA]\n[CONTEXTO]\n' + (o.objetivo ? o.objetivo() : 'NO_DATA') +
          '\n[/CONTEXTO]';
        var acc = '';
        llama.call(R, m, prompt, function (d) {
          acc += d;
          p.textContent = window.sinFuga ? window.sinFuga(acc) : acc;
        }, T('juez_papel')).then(function () {
          b.disabled = false;
          if (!acc) { p.className = 'no-data'; p.textContent = 'NO_DATA · ' + m; }
        }).catch(function (e) {
          b.disabled = false;
          p.className = 'no-data';
          p.textContent = 'NO_DATA · ' + m + ' · ' + (e && e.message ? e.message : e);
        });
      });
    });
    return sec;
  }

  if (!window.CerebrosReg) {
    fetch('/cerebros.json').then(function (r) { return r.json(); })
      .then(function (d) { JUEZ = d.juez && d.juez.modelo; }).catch(function () {});
  }
  window.Veredicto = { monta: monta, reglas: reglas, textos: textos, texto: T };
})();
