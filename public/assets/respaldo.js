/* preceptoros.org · la cuarta via: el JSON que te llevas a la IA que ya tienes.
   Vive fuera de chat.js por el limite de 10 KB, y no es un trozo suelto: es la
   rama que sostiene a quien no tiene GPU ni quiere bajar un modelo, que es
   justo la persona a la que este proyecto no puede dejar fuera.

   chat.js le entrega su contexto una vez con instalar(); a cambio expone
   ofrecerJSON() y salida(). Nada mas cruza esa frontera. */
(function () {
  var C = null;
  function instalar(ctx) { C = ctx; }

    function ofrecerJSON(causa) {
      C.motorZona.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'nodata';
      // NO_DATA con causa: "no hay WebGPU" y "hay WebGPU pero ninguna GPU
      // utilizable" son dos averias distintas, y quien lee merece saber cual.
      p.textContent = C.T.sinMotor + ' ' + (typeof causa === 'string' ? causa : C.T.causaDesconocida)
                    + ' ' + C.T.llevate;
      C.motorZona.appendChild(p);

      var area = document.createElement('textarea');
      area.readOnly = true;
      area.setAttribute('aria-label', C.T.etiquetaJson);
      area.value = JSON.stringify(C.sobre(), null, 2);
      C.motorZona.appendChild(area);
      C.entrada.addEventListener('input', function () {
        area.value = JSON.stringify(C.sobre(), null, 2);
      });

      var f = C.fila();
      C.T.destinos.forEach(function (nombre) {
        f.appendChild(C.boton(C.T.copiarPara + ' ' + nombre, 'leve', function () {
          var b = this, antes = b.textContent;
          copiar(area.value, area, function (ok) {
            b.textContent = ok ? C.T.copiado : C.T.copiaManual;
            setTimeout(function () { b.textContent = antes; }, 2200);
          });
        }));
      });
      C.nota(C.T.mismoTexto);
    }
    function copiar(texto, area, hecho) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
          .then(function () { hecho(true); },
                function () { area.select(); hecho(false); });
      } else { area.select(); hecho(false); }
    }
    function salida() { return C.boton(C.T.prefieroJson, 'leve', function () { ofrecerJSON(C.T.causaElegida); }); }

  window.Respaldo = { instalar: instalar, ofrecerJSON: ofrecerJSON, salida: salida };
})();
