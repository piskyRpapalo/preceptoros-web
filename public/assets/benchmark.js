/* preceptoros.org · el Libro de Pruebas Publicas, pintado.
   Cada fila es una linea FIRMADA por quien midio, con el sha256 del fichero
   del modelo dentro. El hash no es adorno: dos ficheros llamados
   «llama-3.2-3b» no son el mismo modelo, y una cifra que no dice cual midio
   no se puede reproducir. Sin hash y sin firma, esto seria una tabla de
   opiniones con tipografia de terminal. */
(function () {
  var raiz = document.getElementById('tabla');
  var block = document.getElementById('i18n');
  if (!raiz || !block) return;
  var T = JSON.parse(block.textContent);

  function td(texto, clase) {
    var c = document.createElement('td');
    if (clase) c.className = clase;
    c.textContent = texto;
    return c;
  }
  function pinta(d) {
    // Si las filas son de ejemplo, se dice ARRIBA y en grande. Una tabla de
    // benchmark con datos inventados presentados como reales es justo lo que
    // este proyecto existe para no hacer.
    if (d.estado === 'EJEMPLO') {
      var av = document.createElement('p');
      av.className = 'nodata';
      av.textContent = T.bmEjemplo + ' ' + T.bmFirmadas + ' ' + (d.lineas_firmadas || 0) + '.';
      raiz.appendChild(av);
    }
    var t = document.createElement('table');
    var thead = document.createElement('thead'), tr = document.createElement('tr');
    T.bmColumnas.forEach(function (h) {
      var th = document.createElement('th'); th.textContent = h; tr.appendChild(th);
    });
    thead.appendChild(tr); t.appendChild(thead);
    var tb = document.createElement('tbody');
    (d.filas || []).forEach(function (f) {
      var r = document.createElement('tr');
      r.appendChild(td(f.modelo));
      r.appendChild(td(f.sha256 ? f.sha256.slice(0, 12) : T.bmSinHash, f.sha256 ? 'hash' : 'nodato'));
      r.appendChild(td(f.hardware));
      // tok/s puede faltar y se declara: un motor que no dice cuantos tokens
      // genero no da una cifra, da un hueco.
      r.appendChild(td(f.toks === null || f.toks === undefined ? 'NO_DATA' : f.toks.toFixed(1),
                       f.toks === null || f.toks === undefined ? 'nodato' : 'cifra'));
      r.appendChild(td(f.ttft_ms === null || f.ttft_ms === undefined ? 'NO_DATA' : f.ttft_ms + ' ms',
                       f.ttft_ms === null || f.ttft_ms === undefined ? 'nodato' : 'cifra'));
      r.appendChild(td(f.veredicto));
      r.appendChild(td(f.evaluador));
      r.appendChild(td(f.firma || T.bmSinFirma, f.firma ? 'hash' : 'nodato'));
      tb.appendChild(r);
      // Para QUE lo uso, en su propia linea. Es prosa: una columna de prosa
      // rompe la densidad de la tabla y es justo lo que hace util el dato —
      // «11 tok/s» no dice nada; «11 tok/s y me clasifica el correo» si.
      if (f.uso) {
        var ru = document.createElement('tr');
        var cu = document.createElement('td');
        cu.colSpan = T.bmColumnas.length;
        cu.className = 'uso';
        cu.textContent = '↳ ' + f.uso;
        ru.appendChild(cu); tb.appendChild(ru);
      }
    });
    t.appendChild(tb);
    raiz.appendChild(t);
    // Que significan las columnas, en llano. Quien llega no sabe que es un
    // TTFT: el producto se lo ensena, pero esta pagina no puede darlo por
    // sabido y dejar fuera justo a quien viene a empezar.
    if (T.bmLeyenda) {
      var l = document.createElement('ul');
      l.className = 'leyenda';
      T.bmLeyenda.forEach(function (x) {
        var li = document.createElement('li'); li.textContent = x; l.appendChild(li);
      });
      raiz.appendChild(l);
    }
    // El fichero entero, para quien quiera llevarselo. La tabla es una vista;
    // el dato es el fichero, y esta hecho para vivir sin esta web.
    var pie = document.createElement('p');
    pie.className = 'tenue';
    var a = document.createElement('a');
    a.href = '/assets/ledger.jsonl'; a.textContent = 'ledger.jsonl';
    pie.appendChild(document.createTextNode(T.bmFuente + ' '));
    pie.appendChild(a);
    pie.appendChild(document.createTextNode(' · ' + T.bmLlevatelo));
    raiz.appendChild(pie);
  }
  // JSONL y no un JSON de una pieza: cada linea se firma, se anade y se
  // fusiona por separado. El fichero esta hecho para SEPARARSE de esta web y
  // seguir sirviendo — esta tabla es una vista suya, no su casa.
  fetch('/assets/ledger.jsonl').then(function (r) { return r.text(); })
    .then(function (txt) {
      var d = { filas: [] };
      txt.split('\n').forEach(function (l) {
        l = l.trim(); if (!l) return;
        var o; try { o = JSON.parse(l); } catch (e) { return; }   // una linea rota no tumba la tabla
        if (o.tipo === 'cabecera') { d.estado = o.estado; d.lineas_firmadas = o.lineas_firmadas; }
        else if (o.tipo === 'medida') d.filas.push(o);
      });
      d.fuente = 'ledger.jsonl';
      (window.fluido || function (f) { f(); })(function () { pinta(d); });
    })
    .catch(function (e) {
      var p = document.createElement('p');
      p.className = 'nodata';
      p.textContent = T.bmSinDatos + ' ' + (e && e.message ? e.message : e);
      raiz.appendChild(p);
    });
})();
