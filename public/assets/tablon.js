/* preceptoros.org · el Tablon del Agora.
   Lista densa: sin imagenes, sin tarjetas, sin espacio decorativo. Se viene a
   leer muchas lineas seguidas, como en una lista de correo. Los filtros no
   piden nada al servidor — ensenan y esconden lo que ya esta pintado. */
(function () {
  var raiz = document.getElementById('hilos');
  var bloque = document.getElementById('i18n');
  if (!raiz || !bloque) return;
  var T = JSON.parse(bloque.textContent);
  var TIPOS = ['RETO', 'TAREA', 'MERCADO', 'GENERAL'];

  function cuando(iso) {
    // Fecha corta y estable. Nada de «hace 3 horas»: eso obliga a recalcular y
    // enganna al que llega tarde, que ve «hace 3 horas» sobre algo de ayer.
    return (iso || '').slice(0, 16).replace('T', ' ') + ' UTC';
  }
  function pinta(d) {
    if (d.estado === 'EJEMPLO') {
      var av = document.createElement('p');
      av.className = 'nodata';
      av.textContent = T.tbEjemplo + ' ' + T.tbReales + ' ' + (d.hilos_reales || 0) + '.';
      raiz.appendChild(av);
    }
    var f = document.createElement('div');
    f.className = 'fila filtros';
    var lista = document.createElement('ol');
    lista.className = 'hilos';

    function filtrar(tipo, boton) {
      [].forEach.call(f.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b === boton));
      });
      [].forEach.call(lista.children, function (li) {
        li.hidden = !!tipo && li.dataset.tipo !== tipo;
      });
    }
    var todos = document.createElement('button');
    todos.type = 'button'; todos.textContent = T.tbTodos;
    todos.setAttribute('aria-pressed', 'true');
    todos.addEventListener('click', function () { filtrar(null, todos); });
    f.appendChild(todos);
    TIPOS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'leve'; b.textContent = '[' + t + ']';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { filtrar(t, b); });
      f.appendChild(b);
    });
    raiz.appendChild(f);

    (d.hilos || []).forEach(function (h) {
      var li = document.createElement('li');
      li.dataset.tipo = h.tipo;
      var m = document.createElement('span');
      m.className = 'marca-hilo ' + (h.tipo || '').toLowerCase();
      m.textContent = '[' + h.tipo + ']';
      var t = document.createElement('span');
      t.className = 'hilo-titulo'; t.textContent = h.titulo;
      var pie = document.createElement('span');
      pie.className = 'hilo-pie';
      pie.textContent = h.autor + ' · ' + cuando(h.cuando) + ' · ' +
                        (h.respuestas || 0) + ' ' + T.tbRespuestas;
      li.appendChild(m); li.appendChild(t); li.appendChild(pie);
      lista.appendChild(li);
    });
    raiz.appendChild(lista);
  }
  fetch('/hilos.json').then(function (r) { return r.json(); })
    .then(function (d) { (window.fluido || function (fn) { fn(); })(function () { pinta(d); }); })
    .catch(function (e) {
      var p = document.createElement('p');
      p.className = 'nodata';
      p.textContent = T.tbSinDatos + ' ' + (e && e.message ? e.message : e);
      raiz.appendChild(p);
    });
})();
