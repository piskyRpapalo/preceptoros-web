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
  var PAL = { es:['Elige cerebro','prompt','generación','despertar','recomendado','sin firmar','en uso'],
            en:['Choose a brain','prompt','generation','wake-up','recommended','unsigned','in use'],
            pt:['Escolhe cérebro','prompt','geração','despertar','recomendado','sem assinar','em uso'],
            fr:['Choisis un cerveau','prompt','génération','réveil','recommandé','non signé','en cours'],
            it:['Scegli cervello','prompt','generazione','risveglio','consigliato','non firmato','in uso'],
            de:['Gehirn wählen','Prompt','Erzeugung','Aufwachen','empfohlen','unsigniert','aktiv'],
            el:['Διάλεξε εγκέφαλο','prompt','παραγωγή','αφύπνιση','προτεινόμενο','ανυπόγραφο','σε χρήση'],
            ru:['Выбери мозг','prompt','генерация','пробуждение','рекомендуется','без подписи','в работе'] };
  /* --- LA FICHA DE ARRIBA CAMBIA CON EL CEREBRO -----------------------------
     El cuadro de «El Instalador» dejaba de ser cierto en cuanto elegias otro:
     seguia enseñando la velocidad del 2026-08-25 de un modelo que ya no era el
     que contestaba. Aqui se repinta con lo del elegido, y se le añade el LORE
     -- que es lo que este cuadro pedia a gritos: sitio hay, y lo unico que
     habia era ficha tecnica.

     ENVUELVE, NO REESCRIBE: `chat-router.js` sigue pintando el nombre y la
     funcion del compañero, y esto solo AÑADE un bloque propio al final. Si un
     dia el router cambia, esto se queda sin sitio pero no rompe nada. */
  function ficha(modelo, REG, PROSA) {
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

  window.CerebroFicha = ficha;
})();
