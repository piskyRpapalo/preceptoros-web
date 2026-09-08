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

  var REG = null, PROSA = {};

  function pintar(reg, w, lang, tx) {
    var prosa = (tx && tx.cerebros) || {};
    var paises = (tx && tx.paises) || {};
    REG = reg; PROSA = prosa;
    var host = document.getElementById('especificaciones');
    if (!host || document.getElementById('cerebros')) return;
    var caja = el('section', 'cerebros'); caja.id = 'cerebros';
    caja.appendChild(el('h2', 'cerebros-titulo', w[0]));
    /* SIN EL PIE DE CIFRAS (2026-09-08). Decia «prompt / generacion · Vulkan ·
       Radeon 780M · <fecha>» debajo del titulo, y a un visitante no le dice
       nada: es la leyenda de unas columnas que ya se rotulan solas en cada
       tarjeta, mas el backend y la fecha de una medicion que no ha pedido.
       Las cifras siguen en las tarjetas, que es donde significan algo. */
    var rejilla = el('div', 'cerebros-rejilla');

    /* SOLO LOS DE PUERTA (2026-09-08, decision del Soberano). La portada
       ofrecia SEIS cerebros y cuatro de ellos son el MISMO Mistral 7B
       --`charla-web`, `charla-base`, `charla-multi` y `mistral-base`--. Quien
       llega nuevo no elige entre seis: se va. Y la eleccion que se le pedia era
       ademas falsa, porque cuatro puertas daban al mismo sitio.

       Quedan dos, y son los dos trabajos de la portada: `charla-web` instala
       --es el unico que sabe que es este producto y da los comandos reales-- y
       `charla-base` habla con quien ya instalo. Los otros cuatro NO se borran
       del catalogo: siguen en `cerebros-*.json` porque siguen existiendo, y se
       enseñan en Comunidad, que es donde compararlos tiene sentido. El de mas
       valor ahi es `mistral-base`, la base desnuda de los tres primeros: puesto
       al lado de `charla-base` enseña exactamente que aporta nuestro LoRA.

       Es el mismo reparto que `hub.js` ya hacia con `real.disponible`: el
       catalogo dice la verdad entera y el render decide cuanta se enseña de
       entrada. Borrar aqui seria mentir sobre lo que hay. */
    (reg.cerebros || [])
      .filter(function (c) { return c.puerta; })
      .forEach(function (c) {
      var b = el('button', 'cerebro'); b.type = 'button';
      b.dataset.modelo = c.modelo;
      /* La prosa de ESTE cerebro en la lengua que toque. Si falta, la tarjeta
         se pinta igual con su tag y sus cifras: los hechos no dependen de que
         alguien haya traducido nada. */
      var t = prosa[c.id] || {};
      /* SIN LOGO (2026-09-08, decision del Soberano). Lo que habia no eran
         logos de empresa: eran tres dibujos de linea de la casa --el de
         Mistral era una silueta de montañas-- puestos como marcador. Un logo
         parecido al oficial es peor que ninguno: dice al que lo reconoce que
         aqui se copia de memoria. Y traerlos de un CDN esta descartado por la
         promesa de cero peticiones externas.

         Queda la bandera, que hace mejor el trabajo que el logo hacia mal:
         identifica de donde sale el modelo sin fingir una marca. */
      var cab = el('div', 'cerebro-cab');
      /* LA BANDERA DEL ORIGEN, al lado del logo (2026-09-08). Dice de donde
         sale el MODELO BASE, no el adaptador: los tres `charla-*` llevan LoRA
         entrenado aqui y aun asi ondean la francesa, porque el modelo del que
         partimos es de Mistral. Poner la nuestra seria apropiarnos de lo que
         no hicimos, y este sitio se vende justo por no hacer eso.

         Va en color y los logos son linea monocroma: es desviacion consciente
         del estilo de al lado, porque una bandera sin color no es una bandera.

         EL NOMBRE DEL PAIS SALE DE LA LENGUA, nunca del codigo: `paises` vive
         en `cerebros-<lang>.json`. Escribir «Francia» aqui lo dejaria en
         castellano en las ocho portadas. Si la lengua no trae el nombre, se
         pinta la bandera sin rotulo antes que un codigo de dos letras que no
         significa nada para quien mira. */
      if (c.pais) {
        var f = document.createElement('img');
        f.className = 'cerebro-bandera';
        f.src = '/assets/banderas/' + c.pais + '.svg';
        f.width = 21; f.height = 14; f.loading = 'lazy';
        var pn = (paises && paises[c.pais]) || '';
        f.alt = pn; if (pn) f.title = pn;
        f.onerror = function () { f.remove(); };
        cab.appendChild(f);
      }
      cab.appendChild(el('h3', null, t.nombre || c.id));
      if (c.recomendado) cab.appendChild(el('span', 'cerebro-marca', w[4]));
      b.appendChild(cab);
      b.appendChild(el('p', 'cerebro-modelo', c.modelo));
      if (t.que_es) b.appendChild(el('p', 'cerebro-que', t.que_es));
      /* QUE FEEDBACK SE BUSCA, y por eso va antes que las cifras: un tester al
         que no se le dice que mirar reporta lo que le llama la atencion, que
         casi nunca es lo que hace falta. */
      var busca = t.purpose;
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
    var cta = tx && tx.cta_hash;
    if (cta) caja.appendChild(el('p', 'cerebros-cta', cta));
    host.parentNode.insertBefore(caja, host.nextSibling);
    marcar(w);
    if (guardado()) ficha(guardado());
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

  /* --- LA FICHA DE ARRIBA CAMBIA CON EL CEREBRO -----------------------------
     El cuadro de «El Instalador» dejaba de ser cierto en cuanto elegias otro:
     seguia enseñando la velocidad del 2026-08-25 de un modelo que ya no era el
     que contestaba. Aqui se repinta con lo del elegido, y se le añade el LORE
     -- que es lo que este cuadro pedia a gritos: sitio hay, y lo unico que
     habia era ficha tecnica.

     ENVUELVE, NO REESCRIBE: `chat-router.js` sigue pintando el nombre y la
     funcion del compañero, y esto solo AÑADE un bloque propio al final. Si un
     dia el router cambia, esto se queda sin sitio pero no rompe nada. */
  function ficha(modelo) {
    var host = document.getElementById('especificaciones');
    if (!host || !REG) return;
    var c = (REG.cerebros || []).filter(function (x) { return x.modelo === modelo; })[0];
    var t = c ? (PROSA[c.id] || {}) : {};
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var w = PAL[lang] || PAL['es'];

    /* LA TABLA VIEJA SE RETIRA CUANDO HAY CEREBRO ELEGIDO, y esto es el arreglo
       de fondo. `.medidas` pinta UNA pasada de llama-bench del 2026-08-25 --CPU
       y Vulkan de un modelo concreto-- y la enseñaba eligieras el que
       eligieras. Dos verdades en el mismo cuadro, y la de arriba era la falsa
       en cuanto tocabas una tarjeta.

       Se ESCONDE, no se borra: si un dia no hay `cerebros.json` o el fichero
       falla, la tabla vuelve sola y la pagina sigue diciendo algo cierto en vez
       de quedarse muda. */
    /* SE MARCA EL PADRE Y LO ESCONDE EL CSS, en vez de tocar el nodo. `.medidas`
       la pinta `medidas.js` DESPUES de un `fetch`, asi que en la primera pasada
       aqui todavia no existe y un `querySelector` se va de vacio -- se vio: la
       tabla vieja seguia en pantalla con la ficha nueva debajo. Una clase en el
       contenedor no depende de quien pinta primero. */
    host.classList.toggle('con-cerebro', !!c);

    var caja = document.getElementById('ficha-cerebro');
    if (!caja) {
      caja = el('div', 'ficha-cerebro'); caja.id = 'ficha-cerebro';
      host.appendChild(caja);
    }
    caja.innerHTML = '';
    if (!c) return;                       // sin cerebro elegido no se inventa uno

    var izq = el('div', 'ficha-datos');
    var cab = el('div', 'cerebro-cab');
    cab.appendChild(el('h3', 'ficha-nombre', t.nombre || c.id));
    if (c.recomendado) cab.appendChild(el('span', 'cerebro-marca', w[4]));
    izq.appendChild(cab);
    izq.appendChild(el('p', 'cerebro-modelo', c.modelo));

    var d = el('p', 'cerebro-datos');
    d.appendChild(el('b', null, cifra(c.prompt, '')));
    d.appendChild(el('span', null, ' ' + w[1] + ' · '));
    d.appendChild(el('b', null, cifra(c.generacion, '')));
    d.appendChild(el('span', null, ' ' + w[2] + ' tok/s · ' + w[3] + ' '));
    d.appendChild(el('b', null, cifra(c.carga_s, ' s')));
    izq.appendChild(d);
    /* La procedencia va PEGADA a la cifra y no en un pie lejano: una velocidad
       sin backend ni fecha al lado es media medida, y la tabla que se retira
       fallaba justo por eso -- decia «medido el 2026-08-25» de otro modelo. */
    izq.appendChild(el('p', 'cerebro-firma',
      (c.firmado ? '' : w[5]) + ' · contexto ' + REG.contexto +
      ' · ' + REG.backend + ' · ' + REG.medido));
    caja.appendChild(izq);
    if (t.lore) caja.appendChild(el('blockquote', 'ficha-lore', t.lore));
  }

  function elegir(modelo) {
    try { localStorage.setItem(LLAVE, modelo); } catch (e) { /* privado */ }
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    marcar(PAL[lang] || PAL['es']);
    ficha(modelo);
    document.dispatchEvent(new CustomEvent('preceptor:brain',
      { detail: { name: modelo, live: false } }));
  }

  function arrancar() {
    envolver();
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var w = PAL[lang] || PAL['es'];
    /* DOS FICHEROS Y UN RESPALDO POR FICHERO ENTERO. Los hechos no tienen
       idioma; la prosa si, y cae al ingles COMPLETA en vez de por clave
       suelta: media lengua traducida y media caida se lee peor que una lengua
       entera prestada. Es la regla que `taller.js` ya aplica. */
    var traer = function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
    Promise.all([
      fetch('/cerebros.json', { cache: 'no-store' }).then(traer),
      fetch('/cerebros-' + lang + '.json', { cache: 'no-store' }).then(traer)
        .catch(function () {
          return fetch('/cerebros-en.json', { cache: 'no-store' }).then(traer);
        })
    ])
      .then(function (par) { pintar(par[0], w, lang, par[1]); })
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
