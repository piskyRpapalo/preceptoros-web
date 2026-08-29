/* preceptoros.org · lo que TU navegador hace, medido aqui.
   Que el visitante vea su propio tok/s antes de instalar nada es lo que hace
   creible el Benchmark publico: las cifras de la tabla salen de gente que
   midio, no de una ficha tecnica. No compara con nadie ni guarda nada fuera.
   Si una cifra no se puede medir, se declara con su causa y la otra sigue
   saliendo: media medida es media medida, no un fallo. */
(function () {
  var block = document.getElementById('i18n');
  var caja = document.getElementById('chat');
  if (!block || !caja) return;
  var T = JSON.parse(block.textContent);

  var turnos = 0, avisado = false;
  var panel = document.createElement('div');
  panel.className = 'panel';
  caja.parentNode.insertBefore(panel, caja.nextSibling);

  var titulo = document.createElement('p');
  titulo.className = 'cuenta';
  titulo.textContent = T.medidaTitulo;
  panel.appendChild(titulo);

  var linea = document.createElement('p');
  linea.className = 'tenue';
  linea.textContent = T.medidaEsperando;
  panel.appendChild(linea);

  function cifra(etiqueta, valor, unidad) {
    var p = document.createElement('p');
    p.style.fontFamily = 'var(--mono)';
    var e = document.createElement('span');
    e.className = 'tenue';
    e.textContent = etiqueta + ' ';
    var c = document.createElement('span');
    c.className = 'cifra';           // el halo del canon, solo en cifras vivas
    c.textContent = valor;
    var u = document.createElement('span');
    u.className = 'tenue';
    u.textContent = ' ' + unidad;
    p.appendChild(e); p.appendChild(c); p.appendChild(u);
    return p;
  }
  function declarar(texto) {
    var p = document.createElement('p');
    p.className = 'nodata';
    p.textContent = texto;
    return p;
  }

  document.addEventListener('preceptor:turno', function (ev) {
   (window.fluido || function (f) { f(); })(function () {
    var d = ev.detail || {};
    turnos++;
    panel.innerHTML = '';
    panel.appendChild(titulo);

    // TTFT: si el motor no emitio ni un trozo, no hubo primer token que
    // cronometrar. Eso es NO_DATA, no un cero.
    if (d.ttft === null || d.ttft === undefined) {
      panel.appendChild(declarar(T.medidaSinTtft));
    } else {
      panel.appendChild(cifra('TTFT', Math.round(d.ttft), 'ms'));
    }

    // tok/s solo si el motor declara cuantos tokens genero. Contar trozos y
    // llamarlos tokens daria una cifra bonita y falsa.
    if (d.tokens && d.ms > 0) {
      panel.appendChild(cifra('tok/s', (d.tokens / (d.ms / 1000)).toFixed(1), 'tokens/s'));
    } else {
      panel.appendChild(declarar(T.medidaSinTokens));
    }

    var pie = document.createElement('p');
    pie.className = 'tenue';
    pie.textContent = T.medidaCalentado + ' · ' + T.medidaMotor + ' ' + (d.via || '?') +
                      ' · ' + T.medidaTurnos + ' ' + turnos;
    panel.appendChild(pie);

    // A partir del cuarto turno el contexto de un modelo pequeno empieza a
    // empujar fuera lo del principio. No se espera a que la persona lo note:
    // se le dice, y se le ofrece el corte.
    if (turnos >= 4 && !avisado) {
      avisado = true;
      var aviso = document.createElement('div');
      aviso.className = 'panel panel--violeta';
      var t = document.createElement('p');
      t.textContent = T.sensorAviso;
      aviso.appendChild(t);
      var f = document.createElement('div');
      f.className = 'fila';
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = T.sensorBoton;
      b.addEventListener('click', function () {
        var dialogo = document.getElementById('dialogo');
        if (dialogo) dialogo.innerHTML = '';
        turnos = 0; avisado = false;
        // El reseteo ES una medida: dice en que turno esta maquina y este
        // modelo dejaron de sostener el hilo. Se emite para que el Memory lo
        // guarde en `salidas` cuando exista aqui.
        document.dispatchEvent(new CustomEvent('preceptor:salida', {
          detail: { tipo: 'reset_contexto', turnos: 4, via: (ev.detail || {}).via } }));
        aviso.innerHTML = '';
        aviso.appendChild(declarar(T.sensorRegistrado));
      });
      f.appendChild(b);
      aviso.appendChild(f);
      panel.appendChild(aviso);
    }
   });
  });
})();
