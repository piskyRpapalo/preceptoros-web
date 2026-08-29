/* preceptoros.org · el Tablon del Agora.
   Lista densa: sin imagenes, sin tarjetas, sin espacio decorativo. Se viene a
   leer muchas lineas seguidas, como en una lista de correo. Los filtros no
   piden nada al servidor — ensenan y esconden lo que ya esta pintado. */
(function () {
  var raiz = document.getElementById('hilos');
  var block = document.getElementById('i18n');
  if (!raiz || !block) return;
  var T = JSON.parse(block.textContent);
  var TIPOS = ['CHALLENGE', 'TASK', 'COMPUTE', 'GENERAL'];

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
      b.type = 'button'; b.className = 'leve';
      b.textContent = '[' + ((T.tbTipos || {})[t] || t) + ']';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { filtrar(t, b); });
      f.appendChild(b);
    });
    raiz.appendChild(f);

    function fila(h) {
      var li = document.createElement('li');
      li.dataset.tipo = h.tipo;
      var m = document.createElement('span');
      m.className = 'marca-hilo ' + (h.tipo || '').toLowerCase();
      m.textContent = '[' + ((T.tbTipos || {})[h.tipo] || h.tipo) + ']';
      var t = document.createElement('span');
      t.className = 'hilo-titulo'; t.textContent = h.titulo;
      var pie = document.createElement('span');
      pie.className = 'hilo-pie';
      pie.textContent = h.autor + ' · ' + cuando(h.cuando) + ' · ' +
                        (h.respuestas || 0) + ' ' + T.tbRespuestas;
      li.appendChild(m); li.appendChild(t); li.appendChild(pie);
      return li;
    }
    (d.hilos || []).forEach(function (h) { lista.appendChild(fila(h)); });
    raiz.appendChild(lista);

    // --- publicar, y publicar FIRMADO --------------------------------------
    // El hilo se firma con la clave Ed25519 de quien escribe, en su aparato,
    // ANTES de existir para nadie mas. El orden importa: primero la firma,
    // despues el mundo. Sin identidad el formulario no aparece — no se ofrece
    // un boton que no puede cumplir.
    var zonaPub = document.createElement('div');
    raiz.appendChild(zonaPub);
    function ofrecerPublicar() {
      zonaPub.innerHTML = '';
      if (!(window.Identity && window.Identity.quien())) {
        zonaPub.appendChild(nota(T.tbSinIdentidad));
        return;
      }
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = T.tbPublicar;
      b.addEventListener('click', function () { formulario(); });
      var f = document.createElement('div'); f.className = 'fila';
      f.appendChild(b); zonaPub.appendChild(f);
    }
    function campo(etiqueta, elemento) {
      var l = document.createElement('label');
      l.textContent = etiqueta;
      zonaPub.appendChild(l); zonaPub.appendChild(elemento);
      return elemento;
    }
    function formulario() {
      zonaPub.innerHTML = '';
      zonaPub.className = 'form-hilo';
      var titulo = campo(T.tbTitulo, document.createElement('input'));
      var tipo = campo(T.tbTipo, document.createElement('select'));
      TIPOS.forEach(function (t) {
        var o = document.createElement('option');
        o.value = t; o.textContent = (T.tbTipos || {})[t] || t;
        tipo.appendChild(o);
      });
      var cuerpo = campo(T.tbCuerpo, document.createElement('textarea'));
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = T.tbFirmar;
      b.addEventListener('click', function () {
        var hilo = { tipo: tipo.value, titulo: titulo.value.trim(),
                     cuerpo: cuerpo.value.trim(), cuando: new Date().toISOString() };
        if (!hilo.titulo) { titulo.focus(); return; }
        window.Identity.firmar(hilo).then(function (f) {
          // Se pinta arriba, en memoria. No viaja: el envio al servidor es una
          // decision que aun no esta firmada, y prometerlo seria mentir.
          (window.fluido || function (fn) { fn(); })(function () {
            lista.insertBefore(fila(Object.assign({}, hilo,
              { autor: f.autor, respuestas: 0 })), lista.firstChild);
            zonaPub.className = '';
            zonaPub.innerHTML = '';
            zonaPub.appendChild(nota(T.tbFirmado + ' ' + f.firma, 'nodata'));
          });
        });
      });
      var f2 = document.createElement('div'); f2.className = 'fila';
      f2.appendChild(b); zonaPub.appendChild(f2);
    }
    ofrecerPublicar();
    document.addEventListener('preceptor:identity', ofrecerPublicar);
  }
  function nota(texto, clase) {
    var p = document.createElement('p');
    p.className = clase || 'tenue'; p.textContent = texto;
    return p;
  }
  fetch('/threads.json').then(function (r) { return r.json(); })
    .then(function (d) { (window.fluido || function (fn) { fn(); })(function () { pinta(d); }); })
    .catch(function (e) {
      var p = document.createElement('p');
      p.className = 'nodata';
      p.textContent = T.tbSinDatos + ' ' + (e && e.message ? e.message : e);
      raiz.appendChild(p);
    });
})();
