/* preceptoros.org · la velocidad del cerebro, debajo de su nombre.
 *
 * QUE ES. Un esquema PROVISIONAL: cuanto corre el modelo que sirve esta web,
 * en media por hora, con sus huecos declarados. Va pegado al badge del modelo
 * porque es la misma pregunta -- «quien contesta» y «a que velocidad» se leen
 * juntas o no se leen.
 *
 * NO CALCULA NADA. Lee `/medidas.json` y pinta. El fichero lo escribe el
 * enjambre local: cambia de modelo, mide, vuelca la ventana cerrada. Esa
 * separacion es a proposito -- una pagina que promedia en el navegador
 * promedia solo lo que ese navegador vio, y eso no es la velocidad del
 * cerebro, es la de una visita.
 *
 * MEDIA POR HORA Y NO EN VIVO, que se pidio asi y ademas es lo honesto: un
 * numero que baila con cada turno se lee como un velocimetro y no lo es. Una
 * ventana cerrada se puede comprobar; un instante, no.
 *
 * `null` ES NO_DATA CON SU CAUSA AL LADO. El contrato del JSON lo dice y aqui
 * se respeta: nunca se rellena un hueco con una estimacion para que la tabla
 * quede bonita. Hoy hay cuatro huecos y los cuatro se pintan.
 */
(function () {
  var badge = document.getElementById('brain');
  if (!badge || !badge.parentNode) return;

  var caja = document.createElement('div');
  caja.className = 'medidas';
  caja.hidden = true;
  badge.parentNode.insertBefore(caja, badge.nextSibling);

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  // Coma decimal: es la que usan las siete lenguas latinas de esta casa, y la
  // cifra se lee, no se copia a una hoja de calculo.
  function num(v) { return v === null || v === undefined ? null : String(v).replace('.', ','); }

  fetch('/medidas.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) {
      var lang = document.documentElement.lang;
      /* SE LLAMA `M` Y NO `T`, y no es capricho de estilo. En esta casa `T.x`
         significa «clave del bloque i18n de la portada», y hay un guardian que
         lo comprueba: recorre los scripts que la portada carga, busca `T.algo`
         y exige que ese `algo` este en el bloque de las OCHO portadas. Estos
         rotulos no viven ahi --vienen de `medidas.json`, con su fichero-- asi
         que llamarlos `T` ponia el gate en rojo pidiendo ocho claves que no le
         tocan. `hub.js` ya usaba `L` para lo mismo. Un prefijo, un origen. */
      var M = (d.textos || {})[lang] || (d.textos || {}).es || {};

      var cab = el('p', 'medidas-cab');
      cab.appendChild(el('b', null, M.titulo));
      /* La ventana manda en el rotulo: si hay media horaria se dice, y si lo
         que hay es una pasada suelta se dice tambien, con su numero. */
      var v = d.ventana || {};
      cab.appendChild(el('span', 'medidas-ventana',
        /* «1 muestras» no se escribe en ningun idioma. Con la cifra DETRAS
           --«muestras: 1»-- no hay concordancia que resolver, y de paso se lee
           como lo que es: un dato, no una frase. */
        ' · ' + (v.desde ? M.ventana : (M.muestras + ': ' + v.muestras))));
      cab.appendChild(el('span', 'medidas-fecha', ' · ' + M.medidoEl + ' ' + d.medido));
      caja.appendChild(cab);

      (d.lineas || []).forEach(function (l) {
        var f = el('p', 'medidas-fila');
        f.appendChild(el('b', 'medidas-backend', l.backend));
        f.appendChild(el('span', 'medidas-dato',
          num(l.prompt) + ' ' + M.prompt + ' · ' + num(l.generacion) + ' ' + M.generacion));
        f.appendChild(el('span', 'medidas-hueco', M.sinFirma));
        caja.appendChild(f);
      });

      var ctx = d.contexto || {};
      if (ctx.medido) caja.appendChild(el('p', 'medidas-pie',
        M.contexto + ' ' + ctx.medido));
      // Los huecos, uno por linea y con su causa. Son la mitad del valor de
      // esto: una tabla sin ellos parece completa y no lo esta.
      (d.huecos || []).forEach(function (h) {
        caja.appendChild(el('p', 'medidas-nodata', 'NO_DATA · ' + h.que + ' — ' + h.causa));
      });
      caja.hidden = false;
    })
    .catch(function () { /* sin fichero no se pinta nada: mejor vacio que a medias */ });
})();
