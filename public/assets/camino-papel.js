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
    /* Y EL PAPEL POSITIVO VA DELANTE DE TODO, incluidos los hechos.
       Medido contra el rack el mismo dia: con solo `base` --las tres
       prohibiciones de `PR.reglas`, y ni una linea de que SI hacer-- el
       modelo de la puerta contestaba «NO_DATA» a «no se que es esto»
       TENIENDO los hechos delante. Leia «si no sabes, di NO_DATA» y se lo
       aplicaba a la pregunta del otro. Una lista de prohibiciones no es un
       papel: es un bozal.
       El mismo bloque y el mismo orden estan en `duelo.js`. Si se separan,
       LoRAtelier compara contra un arnes que la Torre no usa, y el veredicto
       que firme la persona no vale para el sitio. */
    var partes = [];
    [ui.torre_anfitrion, base, ui.torre_hechos].forEach(function (x) {
      if (x && !esND(x)) { partes.push(x); }
    });
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
    /* EL DUENO PRIMERO (2026-09-22). Con un modelo por piso, la pastilla
       guarda el del piso ANTERIOR y abrir el siguiente lo arrastraba. */
    var dueno = typeof window.CerebroPuesto === 'function' && window.CerebroPuesto();
    if (dueno) { return dueno; }
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


  /* ---------------------------------------------------------------------
     FIRMAR UN PASO. Lo que cierra el circulo de la Torre.
     ---------------------------------------------------------------------
     EL NO_DATA QUE ESTO SUSTITUYE ERA CIERTO Y DEJO DE SERLO. `camino.js`
     decia «el rack todavia no recibe pasos firmados. El boton no se pinta
     porque no llevaria a ningun sitio». Medido el 2026-09-20, de punta a
     punta: `POST /api/v1/paquetes` acepta un paquete firmado, lo deja en la
     bandeja de la-fragua y `ingesta.py` lo mete en la pool con su `user_hash`.
     El 403 que lo hacia parecer cerrado era Cloudflare filtrando por
     User-Agent, no la aplicacion. Un aviso que sigue puesto despues de dejar
     de ser cierto es una mentira con cara de rigor, y por eso se retira el
     mismo dia que la medida.

     ESTE FICHERO NO HABLA CON EL RACK, Y ES A PROPOSITO. Guarda el par firmado
     en `Bronce` --- el mismo almacen del aparato que usa `corregir.js` --- y
     ahi lo recoge la caja de `enviar.js`, que es la unica puerta de salida que
     tiene el sitio. Duplicar aqui el reto, la firma del sobre y el `fetch`
     daria dos caminos hacia `/paquetes` que envejecerian por separado.
     Consecuencia que hay que decir en pantalla y no dar por sabida: firmar
     NO envia. Se firma en tu aparato y sales cuando tu quieras.

     QUE PAR SE FIRMA, y por que encaja sin tocar el esquema:
       prompt     · la practica del piso, que es lo que se le pidio a la IA
       respuesta  · lo ultimo que contesto, leido del dialogo como hace
                    `corregir.js`. Si no hay turno todavia, NO se manda el
                    campo --- una cadena vacia diria «contesto nada», que es
                    distinto de «no contesto».
       correccion · lo que escribe la persona: como podria guiar mejor. Es la
                    respuesta a `torre_guia_no_data`, que ya estaba escrito en
                    las ocho lenguas esperando este boton.
       origen     · lleva el piso dentro. Es lo que convierte ocho pisos en
                    ocho poblaciones separables, que es lo que promete el campo
                    `corpus` de cada uno. Sin esto, todo el feedback de la
                    Torre seria un monton.
     `consent` nace en 0, como en `corregir.js`: un par sin consentimiento es un
     recuerdo de la persona, no material del rack. `ingesta.py` los rechaza con
     esa causa, y es la correcta. */
  function ultimaRespuesta() {
    var d = document.getElementById('dialogo');
    if (!d) { return null; }
    var ps = d.querySelectorAll('p');
    for (var i = ps.length - 1; i >= 0; i--) {
      if (ps[i].className !== 'tu' && ps[i].textContent.trim()) {
        return ps[i].textContent;
      }
    }
    return null;
  }

  function firmaPaso(piso, ui, texto) {
    if (!window.Identity || !window.Bronce) {
      return Promise.reject(new Error('NO_DATA · este navegador no tiene ' +
        'identidad ni almacen: no se puede firmar nada'));
    }
    var reg = {
      prompt: ui['camino_' + piso + '_frase'] || piso,
      correccion: texto,
      corregido: new Date().toISOString(),
      modelo: modeloActual() || 'NO_DATA',
      idioma: (document.documentElement.lang || 'es').slice(0, 2),
      motivo: 'torre',
      tarea: 'libre',
      consent: 0,
      origen: 'preceptoros.org' + location.pathname + '#torre/' + piso,
      tipo: 'correccion',
      autoridad: 1
    };
    var r = ultimaRespuesta();
    if (r) { reg.respuesta = r; }
    return window.Identity.firmar(reg).then(function (f) {
      return window.Identity.publica().then(function (pub) {
        return window.Bronce.guardar({ par: reg, firma: f.firma, autor: f.autor,
                                       algoritmo: f.algoritmo, publica: pub });
      });
    });
  }

  /* El formulario se monta AL PULSAR y no antes: ocho pisos con un area de
     texto cada uno son ocho cajas abiertas en la portada para un gesto que
     casi nadie hace en la primera visita. */
  function montaFirma(piso, ui, mandos, el) {
    var boton = el('button', null, ui.torre_firmar || 'Firmar este paso');
    boton.type = 'button';
    mandos.appendChild(boton);
    boton.addEventListener('click', function () {
      if (boton.dataset.abierto) { return; }
      boton.dataset.abierto = '1';
      boton.disabled = true;
      var caja = el('div', 'torre-firma');
      var guia = ui.torre_guia_no_data || '';
      if (guia) { caja.appendChild(el('p', 'torre-quien', guia)); }
      var area = document.createElement('textarea');
      area.rows = 3;
      area.setAttribute('aria-label', guia || (ui.torre_firmar || 'Firmar'));
      caja.appendChild(area);
      var ok = el('button', null, ui.torre_firmar || 'Firmar este paso');
      ok.type = 'button';
      caja.appendChild(ok);
      var dice = el('p', 'no-data', '');
      caja.appendChild(dice);
      mandos.parentNode.appendChild(caja);
      area.focus();
      ok.addEventListener('click', function () {
        var t = area.value.trim();
        if (!t) {
          /* Un paso firmado en blanco no ensena nada y ocupa una revision
             humana. Se dice por que, no se desactiva el boton en silencio. */
          dice.textContent = guia;
          area.focus();
          return;
        }
        ok.disabled = true;
        firmaPaso(piso, ui, t).then(function () {
          caja.innerHTML = '';
          caja.appendChild(el('p', 'torre-quien',
            (ui.torre_firmado || '') + ' ✓'));
          /* SE DICE QUE NO SE HA ENVIADO. El boton de la cola decia «firmado»
             sin firmar nada; la averia simetrica seria dejar creer que esto ya
             viajo, y es la misma promesa rota con el signo cambiado.

             LA PRIMERA VERSION DE ESTA LINEA NO PINTABA NADA, y se vio en el
             telefono: pedia `window.ENVT.envEnCola`, una clave que me invente
             --- las que hay son ocho y ninguna se llama asi ---. Un `||''`
             seguido de un `if` convierte una clave inexistente en silencio,
             asi que el aviso que este comentario dice poner no se ponia. Un
             respaldo vacio es la forma educada de no avisar.

             El nombre del boton NO se escribe aqui: sale de `ENVT.envBoton`,
             que ya esta traducido y es literalmente el rotulo que la persona
             va a buscar. Escribirlo a mano seria arriesgar que la pagina cite
             un boton que se llama de otra forma. */
          var aviso = ui.torre_no_enviado || '';
          var boton = (window.ENVT && window.ENVT.envBoton) || '';
          if (aviso) {
            /* Sin nombre de boton, fuera los dos puntos: ver el mismo
               bloque en `duelo-firma.js`. Una frase que acaba en dos puntos y
               no sigue se lee como un fallo, no como el aviso que es. */
            caja.appendChild(el('p', 'no-data', boton
              ? aviso + ' «' + boton + '»'
              : aviso.replace(/\s*[:：]\s*$/, '')));
          }
        }).catch(function (e) {
          ok.disabled = false;
          dice.textContent = e.message;
          /* La salida del callejon la pone `identidad-o-salida.js`, que es
             la CUARTA vez que hizo falta el mismo bloque --- `corregir.js`,
             `resena.js`, este y `duelo.js` --- y la primera en que copiarlo
             salia mas caro que extraerlo: empujo este fichero 482 B por
             encima del tope. */
          window.ConIdentidad(e, caja, function (t) { dice.textContent = t; },
                              function () { ok.click(); });
        });
      });
    });
  }

  window.TorrePapel = { esND: esND, viste: viste, papelDelPiso: papelDelPiso,
                        montaFirma: montaFirma };
})();
