/* preceptoros.org · la puerta de salida hacia el rack. Firmada contra un reto.
 *
 * LA REGLA QUE LA ORDENA, firmada por el Soberano el 2026-09-13: «si un usuario
 * actua en la web durante una hora de paquetes, debe tener una posibilidad de
 * enviarlas. El rack se ocupa del reto. Es human in the loop, pero accesibilidad
 * a review».
 *
 * Hasta hoy lo firmado se quedaba en el aparato y la unica salida era exportar
 * un fichero y traerlo a mano. Eso funciona si tienes el rack al lado; para
 * cualquier otro, la cadena se cortaba ahi.
 *
 * EL PROTOCOLO ES EL QUE YA EXISTE, no uno nuevo
 * ----------------------------------------------
 * `GET /api/v1/reto` devuelve un nonce de UN SOLO USO que vive 300 s, y el
 * servidor declara `firmas_verificadas: true`. Se firma `pseudonimo|clave|reto`
 * con la misma clave Ed25519 de siempre y se manda. Sin el nonce, una firma
 * capturada una vez valdria para siempre: el reto no es burocracia, es lo que
 * impide la repeticion.
 *
 * Y DEGRADA DICIENDO LA VERDAD
 * -----------------------------
 * Medido el 2026-09-13: el endpoint de paquetes NO existe todavia --el OpenAPI
 * del Agora tiene ocho rutas y ninguna acepta esto--. Asi que si contesta 404 o
 * 405, se dice EXACTAMENTE eso y se ofrece la exportacion. Lo que no se hace es
 * pintar «enviado» sobre una peticion que no llego: ese fue el fallo del boton
 * de la cola, que se sustituia por la palabra «firmado» sin firmar nada.
 *
 * HUMAN IN THE LOOP: el rack no publica nada de lo que llegue. Lo encola para
 * revision. Lo dice el boton antes de pulsarlo, no despues.
 */
(function () {
  var API = 'https://api.preceptoros.org/api/v1';

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  /* TRES fuentes, y el orden importa.
   *
   * 1) `window.ENVT`, que trae `enviar-<idioma>.js`. Es la casa de estos
   *    rotulos desde el 2026-09-14: estaban repetidos en tres paginas por ocho
   *    lenguas --veinticuatro copias-- y seis de esas lenguas los tenian en
   *    INGLES sin que nada lo dijera.
   * 2) el bloque `#i18n` de la pagina, por si alguna los declara aun.
   * 3) el respaldo en castellano, que es DEGRADAR, no traducir. Si se ve, es
   *    que el guion de la lengua no llego: es un sintoma, no una solucion. */
  /* QUIEN LLENA `window.ENVT`, que hasta hoy no lo llenaba nadie.
     El comentario de arriba describia el respaldo de tres niveles y el primero
     estaba vacio: `ENVT` no se definia en ningun sitio, asi que toda lengua
     caia al tercero --- el castellano del propio guion --- y las ocho leian
     «Enviar al rack». Medido el 2026-09-20 por la guarda nueva del gate.
     Se pide `enviar-<lang>.json`, hermano de `taller-`, `caminos-`, `duelos-`
     y `herramientas-`. Va sin `await` y sin bloquear: si no llega, el respaldo
     sigue siendo el que era y no se rompe nada. */
  (function cargarTextos() {
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    fetch('/enviar-' + lang + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { if (d && d.ui) { window.ENVT = d.ui; } });
  })();

  function T(clave, respaldo) {
    if (window.ENVT && window.ENVT[clave]) { return window.ENVT[clave]; }
    var b = document.getElementById('i18n');
    try { return JSON.parse(b.textContent)[clave] || respaldo; }
    catch (e) { return respaldo; }
  }

  /* Se firma el reto con la clave que ya vive en el aparato. El mensaje lleva
     los tres campos porque firmar solo el reto dejaria reusar esa firma para
     otro pseudonimo, y firmar solo el pseudonimo la haria eterna. */
  function conReto(pub, quien) {
    return fetch(API + '/reto', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var mensaje = quien + '|' + pub + '|' + d.reto;
        return window.Identity.firmarTexto
          ? window.Identity.firmarTexto(mensaje).then(function (f) {
              return { reto: d.reto, firma: f }; })
          : { reto: d.reto, firma: null };
      });
  }

  function enviar(caja, pares) {
    caja.innerHTML = '';
    caja.appendChild(el('p', 'cola-nota', T('envEnviando', 'Pidiendo el reto…')));

    window.Identity.publica().then(function (pub) {
      return conReto(pub, window.Identity.quien()).then(function (r) {
        if (!r.firma) {
          /* `auth.js` firma OBJETOS, no cadenas sueltas. Mientras no exponga
             una firma de texto plano, el reto no se puede cumplir desde aqui.
             Se dice; no se manda algo que el rack va a rechazar. */
          throw new Error(T('envSinFirmaTexto',
            'la identidad de este navegador todavía no sabe firmar el reto'));
        }
        return fetch(API + '/paquetes', {
          method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pseudonimo: window.Identity.quien(), clave_publica: pub,
            reto: r.reto, firma: r.firma,
            esquema: 'preceptoros/correcciones/1', pares: pares })
        });
      });
    }).then(function (resp) {
      if (resp.status === 404 || resp.status === 405) {
        throw new Error(T('envSinCanal',
          'el rack todavía no tiene dónde recibirlos (' + resp.status + ')'));
      }
      if (!resp.ok) { throw new Error('HTTP ' + resp.status); }
      return resp.json();
    }).then(function (d) {
      caja.innerHTML = '';
      caja.appendChild(el('p', 'cola-nota', T('envEncolado',
        'Enviados y en cola de revisión. El rack no publica nada sin que una ' +
        'persona lo mire: ') + (d && d.recibidos !== undefined ? d.recibidos : pares.length)));
    }).catch(function (e) {
      caja.innerHTML = '';
      /* EL FALLO SE DICE CON SU CAUSA Y CON LA SALIDA QUE SI EXISTE. Un error
         sin alternativa deja a quien ya hizo el trabajo sin sitio donde
         ponerlo. */
      caja.appendChild(el('p', 'no-data', T('envFallo', 'No se pudo enviar') +
        ' — ' + (e && e.message ? e.message : e)));
      caja.appendChild(el('p', 'cola-nota', T('envRemedio',
        'Tu trabajo sigue firmado en tu aparato. Exporta el fichero desde ' +
        '«Corregir esta respuesta» y hazlo llegar como puedas.')));
    });
  }

  /* EL BOTON VIVE DONDE YA MIRA LA GENTE: la rueda de Ajustes, junto a la cola
     de firma. No se inventa un sitio nuevo -- se anade al que ya tiene el punto
     rojo cuando hay algo pendiente. */
  function montar() {
    var caja = document.getElementById('panel-ajustes');
    if (!caja || !window.Bronce || !window.Identity) return;
    if (document.getElementById('enviar-rack')) return;
    if (!window.Identity.quien()) return;

    window.Bronce.leerTodo().then(function (regs) {
      if (!regs.length) return;
      var fila = el('div', 'fila');
      fila.id = 'enviar-rack';
      var b = el('button', 'boton',
        T('envBoton', 'Enviar al rack') + ' (' + regs.length + ')');
      b.type = 'button';
      var nota = el('div');
      b.addEventListener('click', function () {
        b.disabled = true;
        window.Bronce.paraEnviar
          ? window.Bronce.paraEnviar().then(function (p) { enviar(nota, p); })
          : enviar(nota, []);
      });
      fila.appendChild(b);
      caja.appendChild(fila);
      caja.appendChild(nota);
      caja.appendChild(el('p', 'cola-nota', T('envAviso',
        'Van firmados y con tu clave pública. El rack los encola para revisión ' +
        'humana: no se publica nada automáticamente.')));
    }).catch(function () { /* sin cola, sin boton */ });
  }

  /* LA MISMA PUERTA, ABIERTA DESDE FUERA. La Plaza firma sus lineas y tiene que
     poder mandarlas sin que el envio se escriba dos veces: dos caminos hacia el
     rack divergen el dia que cambie el protocolo, y uno de los dos empieza a
     mentir sin que nadie lo note. Es la misma leccion que `musica_comun.py`.

     `mandar(nota)` construye el paquete con `Bronce.paraEnviar` --la MISMA
     construccion que baja `exportar`-- y escribe el resultado en el elemento
     que se le pase. Devuelve una promesa para que quien llama sepa cuando
     termino. */
  window.Enviar = {
    mandar: function (nota) {
      if (!window.Bronce || !window.Identity || !window.Identity.quien()) {
        return Promise.reject(new Error(T('envSinFirmaTexto',
          'la identidad de este navegador todavía no sabe firmar el reto')));
      }
      return (window.Bronce.paraEnviar
        ? window.Bronce.paraEnviar()
        : Promise.resolve([])).then(function (pares) {
          enviar(nota, pares);
          return pares.length;
        });
    },
    /* Cuantas hay pendientes. La Plaza lo pinta en su boton por lo mismo que
       lo pinta la puerta de exportacion: entregar a ciegas no es consentir. */
    cuantas: function () {
      if (!window.Bronce) { return Promise.resolve(0); }
      return window.Bronce.leerTodo().then(function (r) { return r.length; })
        .catch(function () { return 0; });
    },
    rotulo: function (clave, respaldo) { return T(clave, respaldo); }
  };

  document.addEventListener('preceptor:identity', montar);
  if (document.readyState !== 'loading') { montar(); }
  else { document.addEventListener('DOMContentLoaded', montar); }
})();
