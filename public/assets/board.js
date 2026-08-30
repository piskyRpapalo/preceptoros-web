/* preceptoros.org · el Tablon del Agora. Solo pintura.
   Lista densa: sin imagenes, sin tarjetas, sin espacio decorativo. Se viene a
   leer muchas lineas seguidas, como en una lista de correo. Los filtros no
   piden nada al servidor — ensenan y esconden lo que ya esta pintado.

   Las fuentes viven en `board-fuentes.js` y entregan {origen, causa, cuando}.
   Aqui se traduce eso a una frase, porque aqui es donde hay idioma. El rotulo
   de procedencia se pinta SIEMPRE, tambien cuando todo va bien: una lista de
   hilos se ve igual venga del Agora o de un ejemplo de hace tres dias, y sin
   ese rotulo la pagina fabrica una comunidad que no existe. */
(function () {
  var raiz = document.getElementById('hilos');
  var block = document.getElementById('i18n');
  if (!raiz || !block) return;
  var T = JSON.parse(block.textContent);
  var TIPOS = ['CHALLENGE', 'TASK', 'COMPUTE', 'GENERAL'];
  var lista = null, zonaPub = null;

  function nota(texto, clase) {
    var p = document.createElement('p');
    p.className = clase || 'tenue'; p.textContent = texto;
    return p;
  }
  function cuando(iso) {
    // Fecha corta y estable. Nada de «hace 3 horas»: eso obliga a recalcular y
    // enganna al que llega tarde, que ve «hace 3 horas» sobre algo de ayer.
    return (iso || '').slice(0, 16).replace('T', ' ') + ' UTC';
  }
  function edad(ms) {
    var m = Math.floor((Date.now() - ms) / 60000);
    return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h';
  }
  /* El rotulo. `fiable` decide la clase: lo que no viene del Agora se pinta
     con la misma marca que un NO_DATA, porque es lo que es.
     Los cuatro origenes van EXPLICITOS y el ultimo caso no es un `else`: un
     origen nuevo tiene que salir como desconocido y verse, no heredar en
     silencio el rotulo del que estaba antes en esa rama. */
  function rotulo(p) {
    if (p.origen === 'agora') return { fiable: true, texto: T.tbFuenteAgora };
    if (p.origen === 'cache') {
      return { fiable: false, texto: T.tbFuenteCache + ' ' + edad(p.cuando) + '.' };
    }
    if (p.origen === 'ejemplo') {
      return { fiable: false, texto: T.tbFuenteLocal + ' ' + p.causa };
    }
    if (p.origen === 'fallo') {
      return { fiable: false, texto: T.tbFuenteFallo + ' ' + p.causa };
    }
    return { fiable: false, texto: 'NO_DATA · origen sin rotular: ' + p.origen };
  }

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

  function pinta(d, procedencia) {
    var r = rotulo(procedencia);
    // Sin datos nuevos solo cambia el aviso: el Agora fallo pero lo que ya
    // estaba pintado sigue siendo lo mejor que hay.
    if (!d) {
      if (raiz.firstChild) raiz.replaceChild(nota(r.texto, 'nodata'), raiz.firstChild);
      return;
    }
    raiz.innerHTML = '';
    // El rotulo va PRIMERO, antes que un solo hilo. Si va debajo, se lee
    // despues de haber creido lo de arriba.
    raiz.appendChild(nota(r.texto, r.fiable ? 'tenue' : 'nodata'));
    if (d.estado === 'EJEMPLO') {
      raiz.appendChild(nota(T.tbEjemplo + ' ' + T.tbReales + ' ' +
                            (d.hilos_reales || 0) + '.', 'nodata'));
    }
    var f = document.createElement('div');
    f.className = 'fila filtros';
    lista = document.createElement('ol');
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
    (d.hilos || []).forEach(function (h) { lista.appendChild(fila(h)); });
    raiz.appendChild(lista);

    zonaPub = document.createElement('div');
    raiz.appendChild(zonaPub);
    ofrecerPublicar();
  }

  // --- publicar, y publicar FIRMADO --------------------------------------
  // El hilo se firma con la clave Ed25519 de quien escribe, en su aparato,
  // ANTES de existir para nadie mas. Sin identidad el formulario no aparece:
  // no se ofrece un boton que no puede cumplir.
  function ofrecerPublicar() {
    if (!zonaPub) return;
    zonaPub.innerHTML = ''; zonaPub.className = '';
    if (!(window.Identity && window.Identity.quien())) {
      zonaPub.appendChild(nota(T.tbSinIdentidad));
      return;
    }
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = T.tbPublicar;
    b.addEventListener('click', formulario);
    var f = document.createElement('div'); f.className = 'fila';
    f.appendChild(b); zonaPub.appendChild(f);
  }
  function campo(etiqueta, elemento) {
    var l = document.createElement('label');
    l.textContent = etiqueta;
    zonaPub.appendChild(l); zonaPub.appendChild(elemento);
    return elemento;
  }
  /* La firma se acorta AQUI, al pintar, y nunca en `auth.js`: alli tirar
     caracteres destruia la firma; aqui solo la dobla para que quepa, y los
     128 caracteres siguen a un clic, enteros y copiables. */
  function verFirma(firma) {
    var d = document.createElement('details');
    var s = document.createElement('summary');
    s.textContent = T.tbFirmaVer + ' ' + firma.slice(0, 24) + '…';
    var c = document.createElement('code');
    c.style.wordBreak = 'break-all'; c.textContent = firma;
    d.appendChild(s); d.appendChild(c);
    return d;
  }
  function formulario() {
    zonaPub.innerHTML = ''; zonaPub.className = 'form-hilo';
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
        (window.fluido || function (fn) { fn(); })(function () {
          if (lista) {
            lista.insertBefore(fila(Object.assign({}, hilo,
              { autor: f.autor, respuestas: 0 })), lista.firstChild);
          }
          zonaPub.className = ''; zonaPub.innerHTML = '';
          zonaPub.appendChild(nota(T.tbFirmado, 'nodata'));
          zonaPub.appendChild(verFirma(f.firma));
        });
      }).catch(function (e) {
        zonaPub.appendChild(nota(T.idFallo + ' ' + (e && e.message ? e.message : e),
                                 'nodata'));
      });
    });
    var f2 = document.createElement('div'); f2.className = 'fila';
    f2.appendChild(b); zonaPub.appendChild(f2);
  }

  var F = window.TablonFuentes;
  if (!F) {
    raiz.appendChild(nota(T.tbSinDatos + ' board-fuentes.js', 'nodata'));
    return;
  }
  F.cargar(function (d, p) {
    (window.fluido || function (fn) { fn(); })(function () { pinta(d, p); });
  }, function (causa) {
    raiz.appendChild(nota(T.tbSinDatos + ' ' + causa, 'nodata'));
  });
  document.addEventListener('preceptor:identity', ofrecerPublicar);
})();
