/* preceptoros.org · EL CONMUTADOR DEL LORATELIER: base contra adaptador.

   Orden del Arquitecto, 2026-09-15, corrigiendo la de ayer. Eran DOS PESTAÑAS
   sobre el chat y se leian como dos ventanas: la pagina parecia ofrecer dos
   conversaciones cuando ofrece una sola con dos motores. Ahora es UN boton que
   dice a QUIEN cambias -- el nombre del otro, no el del actual, porque un boton
   nombra lo que hace y no lo que ya pasa.

   Y DEBAJO, EL RESTO DEL BANCO en pliegues: nombre y funcion a la vista, y
   dentro la ficha entera con «probar». Cuatro fichas abiertas a la vez son
   cuatro parrafos que nadie lee; cuatro titulos son una eleccion.

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

  /* Un respaldo declarado en la propia ficha. Sin clave nueva en el bloque
     `#i18n`: se escribe en la lengua de destino --- ingles --- porque eso es
     LO QUE SE ESTA DICIENDO, y decirlo en griego sobre un texto que esta en
     ingles seria una segunda mentira encima de la primera. */
  function avisarIngles() {
    var caja = document.getElementById('cerebros-banco') ||
               document.querySelector('.cmp-caja');
    if (!caja || document.getElementById('cmp-en-ingles')) { return; }
    var p = document.createElement('p');
    p.id = 'cmp-en-ingles';
    p.className = 'no-data';
    p.lang = 'en';
    p.textContent = 'These model cards are in English: no native review in ' +
      'your language yet. The measurements above are language-neutral.';
    caja.insertBefore(p, caja.firstChild);
  }

  /* EL RESPALDO A INGLES DEJA DE SER SILENCIOSO · 2026-09-20
     Solo existen `cerebros-es.json` y `cerebros-en.json`. Las otras seis
     lenguas pedian su fichero, se comian un 404 EN CADA VISITA y leian la
     ficha en ingles sin que nada lo dijera. Medido en el navegador.
     Ahora `cerebros.json` declara cuales faltan en `prosa_pendiente`, asi que
     ni se pide el fichero --- no hay 404 --- y la ficha dice en que lengua
     esta. No se traduce a maquina: son ~8,8 KB de prosa con voz y lore por
     lengua, y una ficha mal traducida en la pagina que COMPARA modelos es
     peor que una en ingles declarada. */
  fetch('/cerebros.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (base) {
      var pend = (base.prosa_pendiente || {}).idiomas || [];
      var enIngles = pend.indexOf(lang) !== -1;
      var suyo = enIngles
        ? Promise.resolve(null)
        : fetch('/cerebros-' + lang + '.json')
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
      return suyo.then(function (t) {
        if (t) { return [base, t, false]; }
        return fetch('/cerebros-en.json')
          .then(function (r) { return r.json(); })
          .then(function (en) { return [base, en, true]; });
      });
    })
    .then(function (par) {
    if (par[2]) { avisarIngles(); }
    var cat = par[0].cerebros || [];
    var prosa = (par[1] || {}).cerebros || {};
    function busca(id) {
      return cat.filter(function (c) { return c.id === id; })[0];
    }
    var pares = [['mistral-base', 'cmpNatural'], ['charla-base', 'cmpCasa']];
    var dos = [];
    pares.forEach(function (x) {
      var c = busca(x[0]);
      if (!c) return;
      dos.push({ tag: c.modelo,
                 nombre: T(x[1], (prosa[x[0]] || {}).nombre || c.modelo) });
    });
    if (dos.length !== 2) return;            // sin los dos no hay comparacion

    var actual = 1;                          // arranca en el de la casa
    var mando = el('button', 'btn-secundario cmp-mando');
    mando.type = 'button';
    function pinta() {
      var otro = dos[1 - actual];
      /* El boton dice el OTRO. Con el nombre del actual habria que leer dos
         veces para saber si informa o si ofrece. */
      mando.textContent = T('cmpCambiar', 'Cambiar a') + ' ' + otro.nombre;
      mando.setAttribute('aria-label', mando.textContent);
    }
    mando.addEventListener('click', function () {
      actual = 1 - actual;
      pinta();
      elegir(dos[actual].tag, dos[actual].nombre);
    });
    pinta();
    raiz.appendChild(mando);
    raiz.appendChild(aviso);
    elegir(dos[actual].tag, dos[actual].nombre);

    /* EL BANCO, en pliegues. Son los del catalogo que no estan en el
       conmutador: existen, estan medidos, y no abren la pagina. */
    var otros = cat.filter(function (c) {
      return c.id !== 'mistral-base' && c.id !== 'charla-base';
    });
    if (!otros.length) return;
    var banco = el('section', 'cmp-banco');
    banco.appendChild(el('h3', null, T('cmpBanco', 'El resto del banco')));
    otros.forEach(function (c) {
      var tx = prosa[c.id] || {};
      var d = el('details', 'pliego');
      var s = el('summary', null, (tx.nombre || c.modelo));
      d.appendChild(s);
      if (tx.que_es) d.appendChild(el('p', null, tx.que_es));
      if (tx.purpose) d.appendChild(el('p', 'tenue', tx.purpose));
      var fila = el('div', 'fila');
      var probar = el('button', 'btn-secundario', T('cmpProbar', 'Probar'));
      probar.type = 'button';
      probar.addEventListener('click', function () {
        elegir(c.modelo, tx.nombre || c.modelo);
      });
      /* La X cierra el pliegue. `<details>` ya se cierra pulsando su titulo,
         pero el titulo esta arriba y la ficha puede ser larga: quien termina de
         leerla no deberia tener que subir a buscarlo. */
      var x = el('button', 'cierre-x', '×');
      x.type = 'button';
      x.setAttribute('aria-label', T('cmpCerrar', 'Cerrar'));
      x.addEventListener('click', function () { d.open = false; s.focus(); });
      fila.appendChild(probar); fila.appendChild(x);
      d.appendChild(fila);
      banco.appendChild(d);
    });
    raiz.appendChild(banco);
  }).catch(function () { /* sin catalogo no se pinta una comparacion falsa */ });
})();
