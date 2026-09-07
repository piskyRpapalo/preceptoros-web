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

  function pintar(reg, w) {
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
      b.appendChild(el('h3', null, c.nombre));
      if (c.recomendado) b.appendChild(el('span', 'cerebro-marca', w[4]));
      b.appendChild(el('p', 'cerebro-modelo', c.modelo));
      b.appendChild(el('p', 'cerebro-que', c.que_es));
      var d = el('p', 'cerebro-datos');
      d.appendChild(el('b', null, cifra(c.prompt, '')));
      d.appendChild(el('span', null, ' ' + w[1] + ' · '));
      d.appendChild(el('b', null, cifra(c.generacion, '')));
      d.appendChild(el('span', null, ' ' + w[2] + ' tok/s · ' + w[3] + ' '));
      d.appendChild(el('b', null, cifra(c.carga_s, ' s')));
      b.appendChild(d);
      b.appendChild(el('p', 'cerebro-firma',
        (c.firmado ? '' : w[5]) + ' · contexto ' + reg.contexto));
      b.addEventListener('click', function () { elegir(c.modelo); });
      rejilla.appendChild(b);
    });
    caja.appendChild(rejilla);
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

  function arrancar() {
    envolver();
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var w = PAL[lang] || PAL['es'];
    fetch('/cerebros.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (reg) { pintar(reg, w); })
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
