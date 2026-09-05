/* preceptoros.org · los ocho servicios, por comando.
 *
 * UN SERVICIO ES UN VERBO, NO UNA ENTIDAD
 * ---------------------------------------
 * No hay ocho companeros nuevos: hay ocho VERBOS colgados de los ocho que ya
 * viven en `hub.json`. `/auditar` despierta al Analista, que ya tiene su ojo y
 * su esfera. Por eso `servicios.json` no repite ni un nombre ni una cara: pide
 * el agente por su id y lo demas lo pone el catalogo. Dos fuentes para el
 * mismo hecho es como se acaba ensenando un companero que ya no existe.
 *
 * COMO SE ENGANCHA SIN REESCRIBIR EL CHAT
 * ---------------------------------------
 * `chat.js` responde al clic de #enviar y al Enter de #pregunta. No se toca:
 * se escucha ANTES, en fase de CAPTURA sobre `document`. Un escuchador de
 * captura en un ancestro corre siempre antes que el de burbuja del propio
 * boton, sin depender del orden en que se cargaron los ficheros -- que es
 * justo la clase de suposicion que se rompe el dia que alguien mueve una
 * etiqueta <script>.
 *
 * Si el texto empieza por «/», se atiende aqui y se corta la propagacion: el
 * modelo no llega a verlo. Y se atiende SIN motor: una respuesta determinista
 * no necesita inferencia, y hacerla depender de un modelo descargado seria
 * pedir 900 MB para leer un parrafo que ya esta escrito.
 */
(function () {
  var entrada = document.getElementById('pregunta');
  var enviar = document.getElementById('enviar');
  var dialogo = document.getElementById('dialogo');
  if (!entrada || !enviar || !dialogo) return;

  var S = null;

  function idioma() { return (document.documentElement.lang || 'es').slice(0, 2); }

  function di(texto, mio) {
    var p = document.createElement('p');
    if (mio) p.className = 'tu';
    p.textContent = texto;
    dialogo.appendChild(p);
    dialogo.scrollTop = dialogo.scrollHeight;
    return p;
  }

  /* La disponibilidad NO se inventa: sale del campo `real` del agente en
     hub.json, que es el mismo que pinta el panel. Si un companero no tiene
     adaptador servido, el comando lo DICE con su causa en vez de fingir que
     va a pasar algo. */
  function estadoAgente(id) {
    var H = window.Hub;
    if (!H || !H.agente) return null;
    return H.agente(id) || null;
  }

  function atender(texto) {
    var cmd = texto.trim().split(/\s+/)[0].toLowerCase();
    var s = null, i;
    for (i = 0; i < S.servicios.length; i++) {
      if (S.servicios[i].comando === cmd) { s = S.servicios[i]; break; }
    }
    di(texto, true);
    if (!s) {
      var lista = S.servicios.map(function (x) { return x.comando; }).join('  ');
      di(txt('cmdDesconocido') + ' ' + lista);
      return;
    }
    var clave = s.comando.slice(1);
    var L = S.textos[idioma()] || S.textos.es || {};
    di(L[clave] || '');
    /* EL COMANDO QUE NOMBRA UNA PAGINA, LLEVA A ELLA. La respuesta decia «la
       guia entera esta en instalar.html» en texto plano: nombraba el destino y
       dejaba el viaje a cargo de la persona. Un enlace de verdad, con su
       rotulo traducido y su ruta sacada del catalogo.

       SOLO TRES de los ocho lo tienen, y los otros cinco se quedan SIN. No hay
       pagina de `/dataset` ni de `/eco`: inventarles una seria exactamente lo
       que el papel del Instalador tiene prohibido --«NUNCA escribas una URL:
       no las conoces y las inventas»-- y aqui el codigo se aplica la misma
       regla que le exige al modelo. */
    if (s.enlace) {
      var p = document.createElement('p');
      var a = document.createElement('a');
      a.href = s.enlace;
      a.textContent = L._ir || 'Ir';
      a.className = 'cmd-enlace';
      p.appendChild(a);
      dialogo.appendChild(p);
      dialogo.scrollTop = dialogo.scrollHeight;
    }
    var a = estadoAgente(s.agente);
    if (a) {
      var r = a.real || {};
      // El nombre del companero viene del catalogo, nunca escrito aqui.
      di(a.name + ' · ' + (r.disponible
        ? txt('cmdServido')
        : txt('cmdSinServir') + (r.causa ? ' (' + r.causa + ')' : '')));
    }
  }

  function txt(clave) {
    var t = (window.Hub && window.Hub.textos) || {};
    return t[clave] || '';
  }

  function esComando(v) { return /^\s*\//.test(v); }

  /* --- la intercepcion, en captura -------------------------------------- */
  function interceptar(ev) {
    if (!S) return;                       // sin catalogo no se atiende nada
    var v = entrada.value;
    if (!esComando(v)) return;
    if (ev.type === 'click' && ev.target !== enviar &&
        !(enviar.contains && enviar.contains(ev.target))) return;
    if (ev.type === 'keydown' &&
        !(ev.target === entrada && ev.key === 'Enter' && !ev.shiftKey)) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();        // chat.js no llega a verlo
    entrada.value = '';
    atender(v);
  }
  document.addEventListener('click', interceptar, true);
  document.addEventListener('keydown', interceptar, true);

  /* --- la fila de botones ------------------------------------------------
     VAN EN `#atajos`, CON LOS DEMAS. Hasta el 2026-09-05 habia dos filas bajo
     el campo: estos comandos por un lado y «Resume esto / Dame los pasos / Que
     te falta saber» por otro. Son lo MISMO --los dos escriben en el campo y
     atienden-- y verlos separados obligaba a aprenderse dos sitios para el
     mismo gesto. Una sola fila, y el duplicado se ve en cuanto aparece.

     La cadena de caidas se conserva entera: si no hay `#atajos` se busca el
     panel de herramientas, y si tampoco, el chat. Un boton que no aparece es
     peor que uno mal colocado. */
  function pintar() {
    var casa = document.getElementById('atajos') ||
               document.getElementById('herramientas') ||
               document.getElementById('chat');
    if (!casa) return;
    var fila = document.createElement('div');
    fila.className = 'fila comandos';
    S.servicios.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cab-boton comando';
      b.textContent = s.comando;
      b.dataset.categoria = s.categoria;
      /* EL COMANDO NO SE TRADUCE, LO QUE HACE SI. Un comando es un
         IDENTIFICADOR: se teclea, se documenta y se comparte. Si `/instalar`
         fuera `/install` en ingles, el mismo gesto tendria cuatro nombres y
         cualquier guia que alguien escriba solo serviria para un idioma. Asi que
         el rotulo se queda igual en los cuatro y la explicacion viaja en el
         `title`, que sale al pasar el cursor y lo lee tambien quien navega con
         teclado o con lector. Un termino, muchos idiomas.

         El nombre del agente iba antes aqui; ahora acompana a la explicacion,
         que es lo que de verdad hacia falta saber. */
      var a = estadoAgente(s.agente);
      var lang = document.documentElement.lang;
      var que = s.que && (s.que[lang] || s.que.es);
      var rot = window.Hub && Hub.rotulos.agentes;
      var voz = a && ((rot && rot[a.id]) || a);
      b.title = [que, voz && voz.name].filter(Boolean).join(' · ');
      b.addEventListener('click', function () {
        // Se escribe en el campo y se atiende. Escribirlo importa: quien mira
        // aprende que el boton es un atajo de algo que puede teclear.
        atender(s.comando);
      });
      fila.appendChild(b);
    });
    casa.appendChild(fila);
    // `#atajos` nace oculto y lo destapa quien le pone algo dentro. Si esta
    // fila llega primero, le toca a ella.
    if (casa.id === 'atajos') casa.hidden = false;
  }

  /* En tiempo OCIOSO, igual que hub.js pide su catalogo. La doctrina del
     Agora prohibe el fetch bloqueante al cargar: hasta que no pulsas nada,
     esta pagina no ha hablado con nadie, y eso incluye no bloquear el primer
     pintado por un catalogo de 4,5 KB que solo hace falta cuando ya estas
     mirando. */
  function traer() {
    fetch('/servicios.json', { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (d) {
      S = d;
      if (window.Hub) pintar();
      else document.addEventListener('hub:listo', pintar);
    })
    .catch(function (e) {
      // NO_DATA declarado: sin catalogo no hay botones, y se dice por que.
      var casa = document.getElementById('herramientas');
      if (!casa) return;
      var p = document.createElement('p');
      p.className = 'nodata';
      p.textContent = txt('cmdFallo') + ' — ' + (e && e.message ? e.message : e);
      casa.appendChild(p);
    });
  }
  if (window.requestIdleCallback) requestIdleCallback(traer, { timeout: 1500 });
  else setTimeout(traer, 0);
})();
