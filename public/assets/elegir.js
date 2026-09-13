/* preceptoros.org · LA TERCERA PUERTA: valorar sin escribir nada.
 *
 * LAS OTRAS DOS Y POR QUE NO BASTAN. `corregir.js` pide sentarse a escribir la
 * respuesta buena: es la senal mas rica y la que menos llega. `aprender.js`
 * recoge las reescrituras sin pedir nada, pero solo existe cuando alguien
 * insiste -- si la primera respuesta sirve, no hay par.
 *
 * Queda fuera el caso mas comun de todos: la respuesta estuvo bien, o estuvo
 * mal, y la persona siguio a lo suyo. Eso es la mayoria de los turnos, y hasta
 * hoy no dejaba rastro.
 *
 * DOS BOTONES Y UN CAMPO OPCIONAL. Cero teclado obligatorio. Es la puerta de
 * menos friccion de las tres, y por eso es la que puede traer volumen.
 *
 * LO QUE ESTA SENAL NO ES, Y SE DICE AQUI PARA QUE NADIE LO SUPONGA
 * -----------------------------------------------------------------
 * Un pulgar NO es material de entrenamiento. «No me sirve» no dice QUE estaba
 * mal, y un LoRA entrenado con eso aprende a evitar la forma de las respuestas
 * castigadas sin saber por que -- que es como se degrada un modelo creyendo
 * que se afina.
 *
 * Por eso el par sale con `tipo: 'valoracion'`, y el laboratorio lo deja FUERA
 * del dataset: `turnos.py` filtra `= 'correccion'`, en positivo, asi que una
 * clase nueva se queda fuera hasta que alguien decida que es. La cuarentena
 * estaba escrita antes que esta puerta, a proposito.
 *
 * Para lo que SI sirve: contar. Cuantos turnos sirven y cuantos no, por modelo
 * y por tarea, con la carga base al lado. Eso es una medida, y las medidas
 * mandan sobre las impresiones.
 *
 * MISMO CANAL O NINGUNO. Misma `Identity`, misma base `preceptoros-bronce`,
 * `consent: 0`, mismo boton «Enviar al rack (N)». Cero salida de red desde aqui.
 */
(function () {
  var dialogo = document.getElementById('dialogo');
  if (!dialogo || !window.Bronce || !window.Identity) return;

  var LLAVE = 'preceptoros:valorar';

  /* SE LLAMA `VOZ` Y NO `T`. En esta casa `T.` esta RESERVADO: el gate busca
     `\bT\.([A-Za-z]+)` en los scripts de la portada y exige que cada una de
     esas claves exista en el bloque `id="i18n"` de las ocho paginas. Mi
     constante se llamaba `T`, asi que `T.es` se leyo como una clave de
     interfaz que faltaba en las ocho lenguas -- ocho rojos por un nombre de
     variable. El gate tenia razon: una clave de i18n ausente deja la interfaz
     en blanco, y por eso vigila ese patron y no otro. */

  var VOZ = {
    es: ['¿Te ha servido?', 'Sí', 'No', 'por qué (opcional)', 'Gracias.',
         'Valorar respuestas'],
    en: ['Did this help?', 'Yes', 'No', 'why (optional)', 'Thank you.',
         'Rate answers'],
    fr: ['Cela vous a servi ?', 'Oui', 'Non', 'pourquoi (facultatif)', 'Merci.',
         'Évaluer les réponses'],
    pt: ['Serviu-te?', 'Sim', 'Não', 'porquê (opcional)', 'Obrigado.',
         'Avaliar respostas'],
    it: ['Ti è servito?', 'Sì', 'No', 'perché (facoltativo)', 'Grazie.',
         'Valutare le risposte'],
    de: ['Hat das geholfen?', 'Ja', 'Nein', 'warum (optional)', 'Danke.',
         'Antworten bewerten'],
    ru: ['Это помогло?', 'Да', 'Нет', 'почему (необязательно)', 'Спасибо.',
         'Оценивать ответы'],
    el: ['Βοήθησε;', 'Ναι', 'Όχι', 'γιατί (προαιρετικό)', 'Ευχαριστώ.',
         'Αξιολόγηση απαντήσεων']
  };
  function idioma() {
    return (document.documentElement.lang || 'es').slice(0, 2);
  }
  function P() { return VOZ[idioma()] || VOZ.es; }

  function encendido() {
    try { return localStorage.getItem(LLAVE) !== 'no'; } catch (e) { return true; }
  }

  var ATAJOS = ['instalar', 'perfil', 'dataset', 'script', 'eco', 'formatos',
                'auditar', 'frontera'];
  function tarea(p) {
    var t = (p || '').trim().toLowerCase();
    for (var i = 0; i < ATAJOS.length; i++) {
      var c = '/' + ATAJOS[i];
      if (t === c || t.indexOf(c + ' ') === 0) return ATAJOS[i];
    }
    return t ? 'libre' : 'NO_DATA';
  }
  function cerebro() { return window.__preceptorCerebro || 'NO_DATA'; }

  /* Se lee del DIALOGO, igual que las otras dos puertas. Asi `chat.js` no tiene
     que saber que este fichero existe -- la misma costura de siempre. */
  function preguntaDe(respuesta) {
    var ps = dialogo.querySelectorAll('p');
    for (var i = ps.length - 1; i >= 0; i--) {
      if (ps[i] === respuesta) continue;
      if (ps[i].className === 'tu') return ps[i].textContent;
    }
    return '';
  }

  var autoridad = 0;
  function mirarClave() {
    try {
      window.Identity.publica().then(function (p) { autoridad = p ? 1 : 0; },
                                     function () { autoridad = 0; });
    } catch (e) { autoridad = 0; }
  }
  mirarClave();
  document.addEventListener('preceptor:identity', mirarClave);

  function guardar(respuesta, sirve, porque) {
    /* EL REPARTO DE CAMPOS, QUE AQUI TIENE TRAMPA. En una correccion,
       `correccion` es la respuesta buena. En una valoracion NO HAY respuesta
       buena: hay un juicio. Asi que `correccion` queda vacia a proposito --
       nunca con el texto de la respuesta, que la haria parecer un par de
       entrenamiento valido-- y el juicio viaja en `motivo`.
       El orden de las claves es el de `ingesta.CAMPOS`, y lo nuevo AL FINAL. */
    var reg = {
      prompt: preguntaDe(respuesta),
      respuesta: respuesta.textContent,
      correccion: '',
      corregido: new Date().toISOString(),
      modelo: cerebro(),
      idioma: idioma(),
      motivo: (sirve ? 'sirve' : 'no sirve') + (porque ? ': ' + porque : ''),
      tarea: tarea(preguntaDe(respuesta)),
      consent: 0,
      origen: 'preceptoros.org' + location.pathname,
      tipo: 'valoracion',
      autoridad: autoridad,
      sirve: sirve ? 1 : 0
    };
    return window.Identity.firmar(reg).then(function (f) {
      return window.Identity.publica().then(function (pub) {
        return window.Bronce.guardar({ par: reg, firma: f.firma, autor: f.autor,
                                       publica: pub, canonico: f.canonico });
      });
    });
  }

  function caja(respuesta) {
    var t = P();
    var f = document.createElement('form');
    f.className = 'valorar-caja';
    var q = document.createElement('span');
    q.className = 'valorar-pregunta'; q.textContent = t[0];
    var porque = document.createElement('input');
    porque.type = 'text'; porque.className = 'chat-input valorar-porque';
    porque.placeholder = t[3]; porque.maxLength = 140;
    f.appendChild(q);
    [[true, t[1]], [false, t[2]]].forEach(function (par) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'leve'; b.textContent = par[1];
      b.addEventListener('click', function () {
        /* NO SE PINTA «GRACIAS» HASTA QUE ESTA GUARDADO. Ese fue el fallo del
           boton de la cola: se sustituia por la palabra «firmado» sin firmar
           nada, y quien lo pulsaba se iba creyendo que habia firmado. */
        guardar(respuesta, par[0], porque.value.trim()).then(function () {
          var ok = document.createElement('p');
          ok.className = 'cola-nota'; ok.textContent = t[4];
          f.parentNode.replaceChild(ok, f);
          document.dispatchEvent(new CustomEvent('preceptor:valorado',
            { detail: { sirve: par[0] } }));
        })['catch'](function () {
          /* Sin clave no hay par: `ingesta.py` no admite uno sin firma, y
             guardarlo seria acumular lo que nunca va a poder entrar. */
          q.textContent = 'NO_DATA';
        });
      });
      f.appendChild(b);
    });
    f.appendChild(porque);
    return f;
  }

  document.addEventListener('preceptor:turno', function () {
    if (!encendido()) return;
    var ps = dialogo.querySelectorAll('p');
    for (var i = ps.length - 1; i >= 0; i--) {
      if (ps[i].className === 'tu' || ps[i].className === 'tenue') continue;
      if (ps[i].dataset.valorado) return;
      ps[i].dataset.valorado = '1';
      var c = caja(ps[i]);
      if (ps[i].parentNode) ps[i].parentNode.insertBefore(c, ps[i].nextSibling);
      return;
    }
  });

  /* El rotulo y el interruptor, en la rueda, como las otras dos puertas. */
  function rotulo() {
    var panel = document.getElementById('panel-ajustes');
    if (!panel || document.getElementById('valorar-sw')) return;
    var l = document.createElement('label');
    l.className = 'ajuste-linea';
    var sw = document.createElement('input');
    sw.type = 'checkbox'; sw.id = 'valorar-sw'; sw.checked = encendido();
    sw.addEventListener('change', function () {
      try { localStorage.setItem(LLAVE, sw.checked ? 'si' : 'no'); } catch (e) {}
    });
    var n = document.createElement('span');
    n.className = 'ajuste-nombre'; n.textContent = P()[5];
    l.appendChild(sw); l.appendChild(n);
    panel.appendChild(l);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rotulo);
  } else { rotulo(); }
})();
