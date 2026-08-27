/* Pinta counters.json. Una regla: lo MEDIDO se muestra como cifra; lo que no,
   como NO_DATA con su causa. Y si el propio JSON no llega, eso tambien es un
   NO_DATA con causa — un contador que falla en silencio y deja la pagina en
   blanco miente por omision. */
(function () {
  var zona = document.getElementById('metricas');
  var pie = document.getElementById('lectura');
  if (!zona) return;
  var T = JSON.parse(document.getElementById('i18n').textContent);

  function fila(m) {
    var d = document.createElement('div');
    d.className = 'bloque';
    var h = document.createElement('h3');
    h.textContent = T.nombres[m.clave] || m.clave;
    d.appendChild(h);
    if (m.estado === 'MEDIDO') {
      var p = document.createElement('p');
      var c = document.createElement('span');
      c.className = 'cifra';
      c.textContent = Number(m.valor).toLocaleString(document.documentElement.lang);
      p.appendChild(c);
      p.appendChild(document.createTextNode(' ' + (T.unidades[m.unidad] || m.unidad)));
      d.appendChild(p);
      var como = document.createElement('p');
      como.className = 'tenue';
      como.textContent = T.como + ' ' + m.como;
      d.appendChild(como);
    } else {
      var n = document.createElement('p');
      n.className = 'nodata';
      n.textContent = 'NO_DATA · ' + T.causa + ' ' + m.causa;
      d.appendChild(n);
    }
    return d;
  }

  function falla(causa) {
    zona.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'nodata';
    p.textContent = 'NO_DATA · ' + T.sinJson + ' ' + causa;
    zona.appendChild(p);
  }

  fetch('./counters.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (d) {
    zona.innerHTML = '';
    (d.metricas || []).forEach(function (m) { zona.appendChild(fila(m)); });
    if (pie) pie.textContent = T.ultimaLectura + ' ' + (d.ultima_lectura || T.nunca);
  }).catch(function (e) { falla(e && e.message ? e.message : String(e)); });
})();
