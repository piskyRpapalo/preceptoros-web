/* preceptoros.org · el Cahier, arranque en frio.
   El modelo NO sabe que es un token. Eso no es una averia: el vocabulario vive
   en el Cahier, no en los pesos. Por eso la instalacion deja cinco engramas ya
   dentro, y por eso este fichero los inyecta en el prompt ANTES del primer
   turno: para que la primera vez que alguien pregunte «que es un token», la
   respuesta salga de su memoria y no de una alucinacion.

   Recuperacion v1, del lado de la aplicacion: lexica y determinista. Sin
   sqlite-vec (no hay build WASM publico) y sin tool calling nativo (en 3B la
   llamada se emite pero el ciclo cierra con content:null). Lo que hay funciona
   hoy; lo que no, se declara. */
(function () {
  var bloque = document.getElementById('i18n');
  if (!bloque) return;
  var T = JSON.parse(bloque.textContent);
  var ENGRAMAS = T.engramas || [];

  /* --- Lo que se le da al modelo antes de hablar ------------------------- */
  // Cinco definiciones cortas, no el Cahier entero: un contexto que crece sin
  // limite empuja fuera lo que el usuario acaba de escribir, y el borde de
  // contexto es justo lo que la Mision 1 va a medir.
  function contexto() {
    if (!ENGRAMAS.length) return '';
    return '\n\n' + T.cahierCabecera + '\n' +
      ENGRAMAS.map(function (e) { return '- ' + e.termino + ': ' + e.definicion; }).join('\n');
  }

  /* --- Recuperacion lexica, top-k, determinista -------------------------- */
  // Sin ranking estadistico: cuenta terminos que aparecen de verdad en la
  // pregunta. Determinista significa que la misma pregunta da el mismo
  // resultado, y eso es lo que permite que un test lo compruebe.
  function normaliza(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function buscar(pregunta, k) {
    var q = normaliza(pregunta);
    var con = [];
    for (var i = 0; i < ENGRAMAS.length; i++) {
      var e = ENGRAMAS[i];
      if (q.indexOf(normaliza(e.termino)) !== -1) con.push(e);
    }
    return con.slice(0, k || 3);
  }

  /* --- La tarjeta del Cahier -------------------------------------------- */
  // NO se pinta como si hablara el modelo. Cuando esto aparece no hay motor
  // arrancado todavia, y hacer que un asistente salude antes de existir seria
  // decorar. Es una tarjeta del Cahier, y dice de donde salieron los cinco.
  function tarjeta() {
    var caja = document.getElementById('chat');
    if (!caja || !ENGRAMAS.length) return;

    var d = document.createElement('div');
    d.className = 'bloque bloque--violeta';

    var cuenta = document.createElement('p');
    cuenta.className = 'cuenta';
    cuenta.textContent = T.cahierTitulo + ' · ' + ENGRAMAS.length;
    d.appendChild(cuenta);

    var p = document.createElement('p');
    p.textContent = T.cahierNacido;
    d.appendChild(p);

    var lista = document.createElement('p');
    lista.className = 'tenue';
    lista.style.fontFamily = 'var(--mono)';
    lista.textContent = ENGRAMAS.map(function (e) { return e.termino; }).join(' · ');
    d.appendChild(lista);

    var aviso = document.createElement('p');
    aviso.className = 'tenue';
    aviso.textContent = T.cahierReparto;
    d.appendChild(aviso);

    var f = document.createElement('div');
    f.className = 'fila';
    var ver = document.createElement('button');
    ver.type = 'button'; ver.className = 'leve'; ver.textContent = T.cahierVer;
    var abierto = false, cuerpo = null;
    ver.addEventListener('click', function () {
      if (abierto) { if (cuerpo) cuerpo.remove(); cuerpo = null; abierto = false; return; }
      cuerpo = document.createElement('div');
      ENGRAMAS.forEach(function (e) {
        var l = document.createElement('p');
        l.className = 'tenue';
        l.style.fontFamily = 'var(--mono)';
        l.textContent = e.termino + ' — ' + e.definicion;
        cuerpo.appendChild(l);
      });
      var origen = document.createElement('p');
      origen.className = 'tenue';
      origen.textContent = T.cahierOrigen;
      cuerpo.appendChild(origen);
      d.appendChild(cuerpo);
      abierto = true;
    });
    f.appendChild(ver);
    d.appendChild(f);

    caja.parentNode.insertBefore(d, caja);
  }

  window.Cahier = { contexto: contexto, buscar: buscar, engramas: ENGRAMAS };
  tarjeta();
})();
