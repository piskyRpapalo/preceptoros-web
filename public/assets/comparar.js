/* preceptoros.org · LAS DOS PESTAÑAS DEL LORATELIER: base contra adaptador.

   Orden del Soberano, 2026-09-14: arriba del todo una ventana de chat abierta
   que enseñe la diferencia mas clara entre el modelo natural y el de la casa, y
   dos pestañas en el borde para cambiar de uno a otro sin cambiar de pantalla.

   POR QUE ESTO ES EL PRODUCTO DE ESTA PAGINA. Un LoRA no se explica: se compara.
   La tabla de abajo dice cuantos tok/s da cada uno, y eso no contesta la unica
   pregunta que importa --¿que cambia en lo que me responde?--. Dos pestañas
   sobre el mismo chat la contestan en dos turnos.

   LOS NOMBRES SALEN DEL CATALOGO, no de aqui. `cerebros.json` ya dice que tag
   tiene cada cerebro y como se llama en cada lengua; escribirlos otra vez en
   este fichero seria una segunda verdad que se separa de la primera en cuanto
   alguien renombre un modelo.

   Y SI EL MODELO NO ESTA, SE DICE. Cambiar de pestaña sin tener ese modelo
   instalado no cambia nada en silencio: sale su NO_DATA con la causa y el
   nombre del que falta. Una pestaña que parece funcionar y no hace nada es peor
   que una pestaña apagada. */
(function () {
  var raiz = document.getElementById('comparar');
  if (!raiz) return;
  var lang = (document.documentElement.lang || 'es').slice(0, 2);

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }
  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return (JSON.parse(b.textContent)[clave]) || respaldo; }
    catch (e) { return respaldo; }
  }

  var aviso = el('p', 'tenue', '');
  var locales = null;                       // lo que hay en la Ollama de quien mira

  function tags() {
    if (locales) return Promise.resolve(locales);
    return fetch('http://127.0.0.1:11434/api/tags')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        locales = (d.models || []).map(function (m) { return m.name; });
        return locales;
      })
      .catch(function () { locales = []; return locales; });
  }

  function elegir(tag, nombre) {
    return tags().then(function (hay) {
      if (hay.indexOf(tag) < 0) {
        aviso.className = 'nodata';
        aviso.textContent = 'NO_DATA · ' + T('cmpFalta', 'este modelo no está en tu máquina') +
          ': ' + tag;
        return;
      }
      aviso.className = 'tenue';
      aviso.textContent = T('cmpHablas', 'Hablas con') + ' ' + nombre + ' · ' + tag;
      /* El MISMO evento que usa `localai.js` al elegir de su lista. No se
         inventa un canal nuevo: `chat.js` ya escucha este y sabe que hacer. */
      document.dispatchEvent(new CustomEvent('preceptor:localai',
        { detail: { modelo: tag, ms: null } }));
    });
  }

  Promise.all([
    fetch('/cerebros.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
    fetch('/cerebros-' + lang + '.json').then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; })
      .then(function (t) {
        return t || fetch('/cerebros-en.json').then(function (r) { return r.json(); });
      })
  ]).then(function (par) {
    var cat = par[0].cerebros || [];
    var prosa = (par[1] || {}).cerebros || {};
    function busca(id) {
      return cat.filter(function (c) { return c.id === id; })[0];
    }
    var pares = [['mistral-base', 'cmpNatural'], ['charla-base', 'cmpCasa']];
    var barra = el('div', 'pestanas');
    barra.setAttribute('data-pestanas-manual', '1');
    barra.setAttribute('role', 'tablist');
    var botones = [];
    pares.forEach(function (x) {
      var c = busca(x[0]);
      if (!c) return;
      var nombre = (prosa[x[0]] || {}).nombre || c.modelo;
      var b = el('button', 'pestana', T(x[1], nombre));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.addEventListener('click', function () {
        botones.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        b.setAttribute('aria-selected', 'true');
        elegir(c.modelo, nombre);
      });
      botones.push(b);
      barra.appendChild(b);
    });
    if (!botones.length) return;
    raiz.appendChild(barra);
    raiz.appendChild(aviso);
  }).catch(function () { /* sin catalogo no se pinta una comparacion falsa */ });
})();
