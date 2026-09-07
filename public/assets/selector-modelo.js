/* preceptoros.org · elegir cerebro pulsando una tarjeta, no un desplegable.
 *
 * POR QUE TARJETAS Y NO UN `select`. Lo pidio el Soberano asi: «botones grandes
 * y educativos», con el mismo formato de la ficha que ya hay bajo el chat --
 * nombre, modelo, capacidad medida--. Un desplegable obliga a saber de antemano
 * que significa cada nombre; una tarjeta lo explica mientras eliges. Y quien
 * entra a probar cerebros esta aprendiendo que hace cada capa: eso es la mitad
 * del producto, no un ajuste escondido en una rueda.
 *
 * ENVUELVE, NO REESCRIBE. `chat.js` pide el turno con `Rack.stream(modelo,...)`.
 * Aqui se envuelve esa funcion y se le sustituye el primer argumento. Ni
 * `chat.js` ni el router se tocan -- la regla que fijo `chat-router.js`.
 *
 * LAS CIFRAS SON MEDIDAS Y VIENEN DE `cerebros.json`, que las trae del propio
 * Ollama. Un `null` se pinta NO_DATA y no se rellena: una tarjeta con una cifra
 * inventada seria exactamente lo que este sitio dice no hacer.
 */
(function () {
  var LLAVE = 'preceptor-modelo';
  var CONS = {
    es:['Permitir análisis para mejorar el modelo',
        'Marcado: se guarda lo que escribes y lo que responde. Sin marcar: solo el modelo, la hora y el largo.'],
    en:['Allow analysis to improve the model',
        'Ticked: what you write and what it answers are stored. Unticked: only the model, the time and the length.'] };
  var PAL = { es:['Elige cerebro','prompt','generación','despertar','recomendado','sin firmar','en uso'],
            en:['Choose a brain','prompt','generation','wake-up','recommended','unsigned','in use'],
            pt:['Escolhe cérebro','prompt','geração','despertar','recomendado','sem assinar','em uso'],
            fr:['Choisis un cerveau','prompt','génération','réveil','recommandé','non signé','en cours'],
            it:['Scegli cervello','prompt','generazione','risveglio','consigliato','non firmato','in uso'],
            de:['Gehirn wählen','Prompt','Erzeugung','Aufwachen','empfohlen','unsigniert','aktiv'],
            el:['Διάλεξε εγκέφαλο','prompt','παραγωγή','αφύπνιση','προτεινόμενο','ανυπόγραφο','σε χρήση'],
            ru:['Выбери мозг','prompt','генерация','пробуждение','рекомендуется','без подписи','в работе'] };

  function guardado() {
    try { return localStorage.getItem(LLAVE) || ''; } catch (e) { return ''; }
  }

  function envolver() {
    if (!window.Rack || window.Rack.__envuelto) return;
    var original = window.Rack.stream;
    window.Rack.stream = function (modelo, prompt, alTrozo) {
      return original.call(window.Rack, guardado() || modelo, prompt, alTrozo);
    };
    window.Rack.__envuelto = true;
  }

  /* ES si la pagina esta en castellano, INGLES para todo lo demas. No es una
     traduccion pendiente disfrazada: media lengua traducida y media caida se
     lee peor que una lengua entera prestada, y `taller.js` ya cae por FICHERO
     y no por clave suelta por el mismo motivo. Lo que el MODELO responde si
     sale en la lengua de quien pregunta -- eso es `lang: auto`, y es otra cosa
     que la prosa de la ficha. */
  function enLengua(v, lang) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v[lang] || v.en || v.es || '';
  }

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  /* Una cifra ausente NO se maquilla. `null` llega cuando el modelo no
     respondio al medirlo, y decirlo es el producto. */
  function cifra(v, unidad) {
    return v == null ? 'NO_DATA' : String(v).replace('.', ',') + unidad;
  }

  function pintar(reg, w, lang) {
    var host = document.getElementById('especificaciones');
    if (!host || document.getElementById('cerebros')) return;
    var caja = el('section', 'cerebros'); caja.id = 'cerebros';
    caja.appendChild(el('h2', 'cerebros-titulo', w[0]));
    var pie = el('p', 'cerebros-pie',
      w[1] + ' / ' + w[2] + ' · ' + reg.backend + ' · ' + reg.medido);
    var rejilla = el('div', 'cerebros-rejilla');

    (reg.cerebros || []).forEach(function (c) {
      var b = el('button', 'cerebro'); b.type = 'button';
      b.dataset.modelo = c.modelo;
      /* El logo va en <img> y no inline: son tres ficheros de 250 B que el
         worker ya cachea, y meterlos en el JS los repetiria seis veces. El
         `alt` va VACIO a proposito -- el nombre esta al lado en texto, y un
         lector de pantalla que diga «logo de Mistral, Mistral» dice dos veces
         lo mismo. Si el fichero falta, `onerror` lo retira y la tarjeta sigue
         entera: un hueco roto es peor que ningun dibujo. */
      var cab = el('div', 'cerebro-cab');
      if (c.logo) {
        var img = document.createElement('img');
        img.className = 'cerebro-logo'; img.src = c.logo; img.alt = '';
        img.width = 22; img.height = 22; img.loading = 'lazy';
        img.onerror = function () { img.remove(); };
        cab.appendChild(img);
      }
      cab.appendChild(el('h3', null, c.nombre));
      if (c.recomendado) cab.appendChild(el('span', 'cerebro-marca', w[4]));
      b.appendChild(cab);
      b.appendChild(el('p', 'cerebro-modelo', c.modelo));
      b.appendChild(el('p', 'cerebro-que', c.que_es));
      /* QUE FEEDBACK SE BUSCA, y por eso va antes que las cifras: un tester al
         que no se le dice que mirar reporta lo que le llama la atencion, que
         casi nunca es lo que hace falta. */
      var busca = enLengua(c.purpose, lang);
      if (busca) b.appendChild(el('p', 'cerebro-busca', busca));
      var d = el('p', 'cerebro-datos');
      d.appendChild(el('b', null, cifra(c.prompt, '')));
      d.appendChild(el('span', null, ' ' + w[1] + ' · '));
      d.appendChild(el('b', null, cifra(c.generacion, '')));
      d.appendChild(el('span', null, ' ' + w[2] + ' tok/s · ' + w[3] + ' '));
      d.appendChild(el('b', null, cifra(c.carga_s, ' s')));
      b.appendChild(d);
      b.appendChild(el('p', 'cerebro-firma',
        (c.firmado ? '' : w[5]) + ' · contexto ' + reg.contexto));
      /* La invitacion va UNA vez, al pie de la rejilla y no en cada tarjeta:
         repetida seis veces deja de ser una invitacion y pasa a ser un cartel. */
      b.addEventListener('click', function () { elegir(c.modelo); });
      rejilla.appendChild(b);
    });
    caja.appendChild(rejilla);
    var cta = enLengua((reg.cerebros[0] || {}).cta_hash, lang);
    if (cta) caja.appendChild(el('p', 'cerebros-cta', cta));
    caja.appendChild(pie);
    host.parentNode.insertBefore(caja, host.nextSibling);
    marcar(w);
  }

  function marcar(w) {
    var actual = guardado();
    Array.prototype.forEach.call(document.querySelectorAll('.cerebro'), function (b) {
      var mio = b.dataset.modelo === actual;
      b.classList.toggle('elegido', mio);
      b.setAttribute('aria-pressed', mio ? 'true' : 'false');
      var m = b.querySelector('.cerebro-uso');
      if (mio && !m) { m = el('span', 'cerebro-uso', w[6]); b.appendChild(m); }
      if (!mio && m) m.remove();
    });
  }

  function elegir(modelo) {
    try { localStorage.setItem(LLAVE, modelo); } catch (e) { /* privado */ }
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    marcar(PAL[lang] || PAL['es']);
    document.dispatchEvent(new CustomEvent('preceptor:brain',
      { detail: { name: modelo, live: false } }));
  }

  /* --- EL CONSENTIMIENTO, VISIBLE Y DESMARCADO ---------------------------
     DESMARCADO POR DEFECTO, y no es un detalle de implementacion: una casilla
     premarcada recoge el consentimiento de quien no la vio, que es justo lo
     que la palabra consentimiento excluye. Quien quiera ayudar la marca; quien
     no la mire, no ha dicho que si.

     VISIBLE, y no escondida en una rueda. Va donde se escribe, porque es ahi
     donde importa saber que pasa con lo que escribes. Un ajuste de privacidad
     a tres toques de distancia esta tecnicamente disponible y practicamente
     oculto.

     Y DICE LAS DOS RAMAS, no solo la buena: marcado se guarda el texto, sin
     marcar se guarda que modelo, cuando y cuanto. La segunda tambien es
     guardar algo, y callarlo seria la mitad de una verdad. */
  function consentimiento(w) {
    var campo = document.getElementById('pregunta');
    if (!campo || document.getElementById('consiento')) return;
    var caja = el('div', 'consiento-caja');
    var et = document.createElement('label');
    et.className = 'consiento-et'; et.htmlFor = 'consiento';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'consiento';
    cb.checked = false;                       // nunca se lee lo guardado para MARCARLO
    try { cb.checked = localStorage.getItem('preceptor-consiento') === '1'; } catch (e) { /* */ }
    var icono = document.createElement('span');
    icono.className = 'consiento-icono';
    icono.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none"'
      + ' stroke="currentColor" stroke-width="1.6" stroke-linecap="round"'
      + ' stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M3.5 3.5h9l4 4v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"/>'
      + '<path d="M6.5 3.5v5h7"/><rect x="6.5" y="12" width="7" height="4.5"/></svg>';
    et.appendChild(cb); et.appendChild(icono);
    et.appendChild(el('span', 'consiento-texto', w[0]));
    caja.appendChild(et);
    caja.appendChild(el('p', 'consiento-pie', w[1]));
    cb.addEventListener('change', function () {
      try { localStorage.setItem('preceptor-consiento', cb.checked ? '1' : '0'); }
      catch (e) { /* privado */ }
    });
    var sitio = campo.closest('.fila') || campo.parentNode;
    sitio.parentNode.insertBefore(caja, sitio);
  }

  function arrancar() {
    envolver();
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var w = PAL[lang] || PAL['es'];
    consentimiento(CONS[lang] || CONS['en']);
    fetch('/cerebros.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (reg) { pintar(reg, w, lang); })
      .catch(function (e) {
        var host = document.getElementById('especificaciones');
        if (!host || document.getElementById('cerebros')) return;
        var p = el('p', 'nodata', 'NO_DATA · ' + e.message);
        host.parentNode.insertBefore(p, host.nextSibling);
      });
  }

  addEventListener('load', arrancar);
  if (document.readyState === 'complete') arrancar();
})();
