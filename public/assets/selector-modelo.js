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
  var REG = null, PROSA = {};
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

  /* El modelo del cerebro marcado `recomendado`. Devuelve '' mientras el
     catalogo no ha llegado: sin dato no se adivina, se deja pasar el que
     venia. */
  function porDefecto() {
    var c = (REG && REG.cerebros || []).filter(function (x) { return x.recomendado; })[0];
    return c ? c.modelo : '';
  }

  function envolver() {
    if (!window.Rack || window.Rack.__envuelto) return;
    var original = window.Rack.stream;
    window.Rack.stream = function (modelo, prompt, alTrozo) {
      /* SIN ELECCION GUARDADA MANDA EL RECOMENDADO, no lo que traiga quien
         llama (2026-09-08). Antes `recomendado` era solo una insignia y el
         primero en hablar salia del catalogo de companeros: El Anfitrion, que
         sabe instalar pero es verboso y le repite los pasos a quien ya
         instalo --lo dice su propia ficha--. Quien abre la web a hablar no
         viene a instalar dos veces.

         Que la insignia y el que contesta sean la MISMA decision evita la
         clase de fallo que este repo lleva meses corrigiendo: dos sitios
         diciendo cosas distintas del mismo hecho. */
      return original.call(window.Rack,
        guardado() || porDefecto() || modelo, prompt, alTrozo);
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


  function pintar(reg, w, lang, tx) {
    var prosa = (tx && tx.cerebros) || {};
    var paises = (tx && tx.paises) || {};
    REG = reg; PROSA = prosa;
    /* DOS CASAS PARA EL MISMO GUION (2026-09-08). En la portada monta bajo
       `#especificaciones` y enseña los DOS de puerta; en Comunidad monta bajo
       `#cerebros-banco` y enseña LOS DEMAS, que es donde compararlos tiene
       sentido -- `mistral-base` al lado de `charla-base` enseña exactamente
       que aporta nuestro LoRA.

       No se parte en dos ficheros ni se duplica copia: los rotulos de las
       ocho lenguas ya viven en `PAL`, aqui dentro. Un segundo guion seria una
       segunda verdad que se separa de esta a la primera correccion. */
    var host = document.getElementById('especificaciones');
    var banco = !host && document.getElementById('cerebros-banco');
    if (banco) host = banco;
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
      .filter(function (c) { return banco ? !c.puerta : c.puerta; })
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
    if (guardado() && window.CerebroFicha) window.CerebroFicha(guardado(), REG, PROSA);
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
    if (window.CerebroFicha) window.CerebroFicha(modelo, REG, PROSA);
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
