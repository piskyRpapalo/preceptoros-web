/* preceptoros.org · el pie honesto y los enlaces, desde el bloque i18n.
   Existe porque estaban escritos a mano en cada portada y las tres decian lo
   mismo EN ESPANOL: /en/ y /fr/ mostraban el pie castellano a quien no lo
   habla. Un texto visible fuera del i18n no se traduce -- se olvida. */
(function () {
  'use strict';
  var b = document.getElementById('i18n');
  var ul = document.getElementById('pie-honesto');
  var nav = document.getElementById('pie-enlaces');
  if (!b) return;
  var T = JSON.parse(b.textContent);

  function li(fuerte, resto) {
    var e = document.createElement('li');
    var s = document.createElement('strong');
    s.textContent = fuerte;
    e.appendChild(s);
    e.appendChild(document.createTextNode(' ' + resto));
    return e;
  }

  if (ul) {
    ul.innerHTML = '';
    [['pie1f', 'pie1r'], ['pie2f', 'pie2r'], ['pie3f', 'pie3r']]
      .forEach(function (par) {
        if (T[par[0]]) ul.appendChild(li(T[par[0]], T[par[1]] || ''));
      });
  }

  if (nav) {
    nav.innerHTML = '';
    [['./instalar.html', 'pieInstalar'], ['./board.html', 'pieTablon'],
     ['./benchmark.html', 'pieBenchmark'], ['../hitos.html', 'pieHitos']]
      .forEach(function (par, i) {
        if (!T[par[1]]) return;
        if (i) nav.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = par[0]; a.textContent = T[par[1]];
        nav.appendChild(a);
      });
  }
})();
