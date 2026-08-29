/* preceptoros.org · elegir y arrancar el motor.
   Sale de chat.js por el limite de 10 KB, y la frontera es limpia: aqui se
   decide QUE cerebro corre y como se enciende; alli, que pasa en un turno.

   La deteccion ocurre AL CARGAR y no rompe la promesa del pie: preguntar si
   hay WebGPU o LanguageModel son preguntas al propio aparato, cero red. Lo
   que si viaja —el import() de WebLLM y la descarga— sigue detras del clic.

   chat.js entrega su contexto una vez con install(); a cambio recibe el motor
   listo por el callback `onReady`. */
(function () {
  var C = null;
  // Estado del propio motor. Vivia en chat.js y se quedo alli al partir el
  // fichero: `decidir()` se mudo sin su guarda y reventaba en la primera
  // linea. Lo que es del motor viaja con el motor.
  var decidido = false;
  var quieto = document.getElementById('quieto');
  function install(ctx) { C = ctx; start(); }

    /* --- 3. WebLLM: se descarga solo si lo pides, y se dice a quien. --- */
    function ofrecerDescarga() {
      C.zone.innerHTML = '';
      var b = C.boton(C.T.descargar, '', function () { bajarWebLLM(b); });
      var f = C.fila(); f.appendChild(b); f.appendChild(C.salida());
      C.nota(C.T.avisoRed);
      C.nota(C.T.avisoCifra);
    }
    function bajarWebLLM(b) {
      b.disabled = true;
      var linea = C.estado(C.T.arrancando);
      import(/* webpackIgnore: true */ C.CDN).then(function (webllm) {
        return webllm.CreateMLCEngine(C.MODELO, {
          initProgressCallback: function (info) { linea.textContent = info.text || C.T.arrancando; }
        });
      }).then(function (m) { C.setEngine(m); C.listo(C.T.listoLocal, 'webllm'); })
        .catch(function (e) {
          C.estado(C.T.falloDescarga + ' — ' + (e && e.message ? e.message : e), 'nodata');
          C.zone.appendChild(C.salida());
        });
    }

    /* --- 1 y 2. El modelo del propio navegador (Prompt API). --- */
    function ofrecerNavegador(yaEsta) {
      C.zone.innerHTML = '';
      var b = C.boton(yaEsta ? C.T.usarNavegador : C.T.bajarNavegador, '', function () {
        b.disabled = true;
        var linea = C.estado(C.T.arrancando);
        LanguageModel.create({
          monitor: function (m) {
            m.addEventListener('downloadprogress', function (e) {
              linea.textContent = C.T.bajando + ' ' + Math.round((e.loaded || 0) * 100) + '%';
            });
          }
        }).then(function (s) { C.setSession(s); C.listo(yaEsta ? C.T.navListo : C.T.navBajado, 'navegador'); })
          .catch(function (e) {
            C.estado(C.T.falloNavegador + ' — ' + (e && e.message ? e.message : e), 'nodata');
            rutaGpu();
          });
      });
      var f = C.fila(); f.appendChild(b); f.appendChild(C.salida());
      // Si hay que bajar Gemini Nano, el peso se dice ANTES de que pulses: son
      // 2,7-4 GB, mas que el modelo de esta pagina. Ocultarlo seria vender
      // "cero descargas" a cambio de la descarga mas grande de las dos.
      C.nota(yaEsta ? C.T.navYaEsta : C.T.navPesa);
    }

    /* --- La rama WebGPU. --- */
    function rutaGpu() {
      if (!navigator.gpu) { C.ofrecerJSON(C.T.causaSinApi); return; }
      C.estado(C.T.mirandoGpu);
      navigator.gpu.requestAdapter().then(function (adaptador) {
        if (adaptador) ofrecerDescarga(); else C.ofrecerJSON(C.T.causaSinAdaptador);
      }).catch(function (e) { C.ofrecerJSON(C.T.causaError + ' ' + (e && e.message ? e.message : e)); });
    }

    /* --- La deteccion ocurre AL CARGAR, y no rompe la promesa del pie. ------
       Mirar si hay WebGPU o LanguageModel son preguntas al propio aparato: cero
       red. Lo que si viaja —el import() de WebLLM y la descarga del modelo—
       sigue detras del clic. Antes esperaba al primer tecleo y el boton de
       descarga no existia hasta entonces: quien llegaba no sabia que podia. */
    function decidir() {
      if (decidido) return;
      decidido = true;
      if (quieto) quieto.hidden = true;
      // `LanguageModel`, no `window.ai`: la forma antigua quedo atras, y mirar
      // solo esa mandaria a bajar 945 MB al navegador mas capaz de todos.
      if (typeof LanguageModel !== 'undefined' && LanguageModel.availability) {
        C.estado(C.T.mirandoNavegador);
        LanguageModel.availability().then(function (d) {
          if (d === 'available') ofrecerNavegador(true);
          else if (d === 'downloadable' || d === 'downloading') ofrecerNavegador(false);
          else rutaGpu();
        }).catch(rutaGpu);
        return;
      }
      rutaGpu();
    }

  // Arranca cuando chat.js entrega el contexto, no antes: sin `C` esto
  // reventaria en la primera linea.
  function start() { decidir(); }
  window.Engine = { install: install };
})();
