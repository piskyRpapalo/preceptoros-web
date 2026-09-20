/* preceptoros.org · el PAPEL de un piso de la Torre. La mitad que piensa.
 *
 * POR QUE ESTA PARTIDO DE `camino.js`, con su cifra: al cablear el boton
 * «Probar» para que vistiera el chat, aquel fichero se fue a 17.094 B sobre un
 * tope de 16.383 --- 711 de mas. La casa parte POR ASUNTO y jamas recorta un
 * comentario, y ya se hizo siete veces en este arbol.
 *
 * Y el corte cae solo, porque la Torre hace dos trabajos distintos:
 *   `camino.js`   · PINTA los ocho pisos. Sabe de `details`, de estilo y de
 *                   donde se engancha en la portada.
 *   este fichero  · decide QUE PAPEL lleva puesto el modelo cuando pruebas un
 *                   piso, y se lo dice al chat. No pinta nada.
 *
 * ORDEN DE CARGA. `chat-router.js` inyecta los dos, este PRIMERO. Dos
 * `<script>` clasicos se ejecutan en el orden en que se insertan, asi que
 * cuando `camino.js` arranca, `window.TorrePapel` ya esta. Aun asi el otro
 * comprueba que exista antes de usarlo: si un dia el orden cambia, la Torre
 * se pinta igual y lo unico que se pierde es el boton, con su causa escrita.
 */
(function () {
  /* El NO_DATA de una lengua sin escribir VIENE DEL FICHERO, en su idioma, y
     no cableado aqui en castellano. Hasta hoy la ausencia se pintaba con una
     frase espanola en las ocho portadas: un hueco declarado en un idioma que
     el lector no tiene por que leer sigue siendo un hueco tapado. */
  function esND(t) { return !t || t.indexOf('NO_DATA') === 0; }

  /* EL PAPEL QUE SE LE DA AL MODELO CUANDO SE PRUEBA UN PISO.
   *
   * `chat.js` hace `nido || PR.papel`: lo que va aqui SUSTITUYE al papel base,
   * no se suma. Asi que se compone el base MAS el piso, y en ese orden.
   *
   * NO LLEVA UNA SOLA PALABRA DE CONEXION, y es a proposito. Un «lo que este
   * paso promete:» escrito aqui saldria en castellano en las ocho lenguas ---
   * es exactamente el fallo que costo una portada inglesa diciendo «Write here
   * to talk with El Instalador». Los cuatro textos ya vienen traducidos del
   * fichero de la lengua; lo unico que pone este codigo son los corchetes, que
   * no son de ningun idioma.
   *
   * Y el `papel` solo entra SI ESTA ESCRITO: en las seis lenguas pendientes su
   * valor es el propio aviso de NO_DATA, y meterselo al modelo le diria que
   * habla con un aviso. */
  function papelDelPiso(p, ui) {
    /* EL CIMIENTO ES `PR.reglas`, NO `PR.papel`, y esto no es un detalle.
     *
     * `PR.papel` es, literalmente, «Eres Preceptor, el INSTALADOR de
     * PreceptorOS. Tu unica funcion es que la persona consiga instalar el
     * producto en SU maquina». Medido en el navegador el 2026-09-20: el piso
     * `whoami` --- que va de buscarte a ti mismo en internet --- heredaba esa
     * frase y arrancaba su papel diciendole al modelo que su unica funcion
     * era instalar algo. El Soberano habia retirado al Instalador tres
     * semanas antes; seguia vivo en la capa que de verdad cambia lo que el
     * modelo contesta, que no es la pastilla de la pantalla.
     *
     * `reglas` son las tres de la casa --- nada de nube, nada de datos
     * personales, si no sabes di NO_DATA --- y vienen TRADUCIDAS en las ocho
     * lenguas, asi que usarlas no cuesta ni una traduccion nueva.
     *
     * LO QUE SE PIERDE Y DONDE TIENE QUE VOLVER: «contesta en el idioma de la
     * persona» vivia solo dentro de `papel`. No se copia aqui, porque
     * escribirla en castellano la romperia en siete lenguas. Su sitio es el
     * Modelfile del modelo que sirve el rack --- alli aplica a TODOS los
     * caminos y no solo a la Torre. Medido el 2026-09-20: los tres minis del
     * duelo contestaron en castellano a una pregunta en ingles, o sea que la
     * instruccion hace falta y el sitio donde falta es el servidor. */
    var r = (window.PR && window.PR.reglas) || [];
    var base = Array.isArray(r) ? r.join('. ') : String(r || '');
    var t = ui['camino_' + p + '_titulo'] || p;
    /* LOS HECHOS DEL PRODUCTO VAN DELANTE DE TODO, y se ponen porque su
       ausencia se MIDIO. En `duelo_mini.py`, el 2026-09-20, los tres modelos
       pequenos contestaron a «no se que es esto» inventandose el producto:
       «una distribucion de Linux», «una plataforma para gestionar
       informacion». Ninguno mentia a proposito ni fallaba por ser pequeno ---
       el papel no se lo habia dicho nunca, y un modelo al que le falta un dato
       rellena el hueco, y lo rellena con seguridad.
       Van primero porque lo que abre un system prompt pesa mas que lo que lo
       cierra, y van en la lengua de la pagina como todo lo demas de aqui. */
    var partes = [base];
    var hechos = ui.torre_hechos;
    if (hechos && !esND(hechos)) { partes.push(hechos); }
    partes.push('[' + t + ']');
    ['frase', 'falla', 'papel'].forEach(function (c) {
      var v = ui['camino_' + p + '_' + c];
      if (v && !esND(v)) { partes.push(v); }
    });
    return partes.join('\n');
  }

  /* QUE MODELO ESTA PUESTO. No lo decide este fichero --- lo decide
     `selector-modelo.js`, que envuelve `Rack.stream` y manda sobre cualquier
     nombre que le pasen. Aqui solo se REPITE el que ya esta, porque el evento
     `preceptor:companero` lleva `modelo` dentro y mandar uno distinto pintaria
     un badge que miente sobre quien contesta. */
  var modeloPuesto = null;
  document.addEventListener('preceptor:brain', function (e) {
    var n = e.detail && e.detail.name;
    if (n) { modeloPuesto = n; }
  });
  function modeloActual() {
    if (modeloPuesto) { return modeloPuesto; }
    /* `selector-modelo.js` es quien MANDA sobre el modelo --- envuelve
       `Rack.stream` ---, asi que se le pregunta a el en vez de repetir aqui su
       regla. Medido el 2026-09-20: leer solo `localStorage` devolvia vacio en
       la primera visita, el piso 1 no vestia el chat y el cabezal se quedaba
       en «Modelo: ninguno» con el aviso «Activando modelo» para siempre. El
       recomendado del banco no estaba en `localStorage` porque nadie lo habia
       elegido todavia: no habia nada guardado, y si habia un modelo. */
    if (typeof window.CerebroPuesto === 'function') {
      return window.CerebroPuesto() || null;
    }
    try { return localStorage.getItem('preceptor-modelo') || null; }
    catch (e) { return null; }      // navegacion privada: no es un fallo
  }

  /* VESTIR EL CHAT DE ARRIBA CON ESTE PISO.
   *
   * Es el gesto que pidio el Soberano: «otro boton test hace que la ventana
   * superior de home se actualice a ese piso». El chat no se muda ni se
   * duplica --- se le cambia el papel, que es lo unico que distingue un piso
   * de otro. El modelo no se toca.
   *
   * Si no hay modelo puesto NO se dispara: el evento con `modelo` vacio hace
   * que `chat.js` apague el badge y escriba «sin adaptador», o sea que probar
   * un piso ROMPERIA el chat en vez de cambiarlo. Se declara en el boton. */
  function viste(p, ui) {
    var m = modeloActual();
    if (!m) { return false; }
    document.dispatchEvent(new CustomEvent('preceptor:companero', {
      detail: { id: 'torre-' + p, nombre: ui['camino_' + p + '_titulo'] || p,
                modelo: m, nido: papelDelPiso(p, ui), disponible: true } }));
    return true;
  }

  window.TorrePapel = { esND: esND, viste: viste, papelDelPiso: papelDelPiso };
})();
