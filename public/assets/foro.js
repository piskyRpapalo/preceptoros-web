/* preceptoros.org · EL FORO. Leer en nivel 2, escribir en nivel 3.

   LA REGLA LA FIRMO EL SOBERANO EL 2026-09-20, con estas palabras:

     «simplemente los usuarios pueden poner un comentario que todos los otros
      registrados puedan ver. Foro solo se abre en nivel 2 como visual. Y
      escritura en nivel 3.»

   Y ESO RESUELVE EL BLOQUEO QUE LLEVABA MESES. `agora.json` declaraba el foro
   CERRADO con esta causa: «lo que falta es la moderacion, y abrir escritura sin
   ella es abrir un buzon sin nadie que lo lea». La decision que faltaba no era
   quien vacia el buzon --- era QUIEN TIENE LLAVE. Escribir no se abre a
   cualquiera con clave: se abre a quien ya entrego trabajo firmado. Es un coste
   que el ruido no paga y el trabajo ya pago.

   LOS NIVELES SALEN DE LOS MISMOS DOS HECHOS QUE EN EL PERFIL, y eso no es una
   casualidad que haya que mantener a mano: es la condicion para que la palabra
   «nivel 3» signifique lo mismo en las dos paginas.

     nivel 1 · Visitante      no hay clave
     nivel 2 · Firmante       hay clave Ed25519          -> LEE el foro
     nivel 3 · Contribuyente  hay pares en el Bronce     -> ESCRIBE

   `profile-obra.js` lo deriva igual y lo dice igual de claro: «los niveles se
   derivan, no se declaran». Dos ideas distintas de que es un nivel es como se
   acaba con una pagina que te deja escribir y otra que dice que no puedes.

   SI EL BRONCE NO SE PUEDE LEER, EL NIVEL NO SE ADIVINA. Un navegador con
   IndexedDB bloqueado no es un visitante sin trabajo: es un NO_DATA, y se dice.
   Dar por vacio lo que no se ha podido mirar es inventar un dato --- y aqui el
   dato inventado quitaria un permiso que alguien SI tiene.

   LA PUERTA DE VERDAD ESTA EN EL RACK. Esto de aqui decide QUE SE PINTA; quien
   decide si un comentario entra es el Agora, comprobando la firma. Un nivel
   calculado en el navegador es una sugerencia, no un permiso: cualquiera puede
   abrir la consola. Por eso el boton que no aparece no es la seguridad --- la
   seguridad es que sin firma valida el POST se cae con 403. */
(function () {
  var RAIZ = document.getElementById('foro');
  if (!RAIZ) { return; }
  var API = 'https://api.preceptoros.org/api/v1';
  var TOPE = 600;                 // caracteres por comentario
  var UI = {};
  try { UI = JSON.parse(document.getElementById('i18n').textContent); }
  catch (e) { UI = {}; }

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    /* SIEMPRE `textContent`, NUNCA `innerHTML`. Lo que se pinta aqui lo
       escribio otra persona: es el unico sitio de la casa donde el texto de un
       desconocido llega a la pantalla, y `innerHTML` lo convertiria en codigo
       suyo corriendo en la sesion de quien lee. */
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function T(clave, respaldo) { return UI[clave] || respaldo; }
  function limpia() { while (RAIZ.firstChild) { RAIZ.removeChild(RAIZ.firstChild); } }

  /* --- el nivel, de los dos hechos ------------------------------------- */
  function nivel() {
    var quien = window.Identity && window.Identity.quien();
    if (!quien) { return Promise.resolve({ n: 1, quien: null }); }
    if (!window.Bronce) {
      return Promise.resolve({ n: 2, quien: quien, duda: T('foSinBronce',
        'NO_DATA — no se pudo mirar el Bronce en esta página, así que no se '
        + 'puede confirmar si eres contribuyente.') });
    }
    return window.Bronce.leerTodo().then(function (regs) {
      return { n: (regs && regs.length) ? 3 : 2, quien: quien };
    }).catch(function (e) {
      return { n: 2, quien: quien, duda: T('foSinBronce',
        'NO_DATA — no se pudo leer el Bronce de este aparato:') + ' ' + e.message };
    });
  }

  /* --- pintar ----------------------------------------------------------- */
  function cabecera(est) {
    var h = el('h3', null, T('foTitulo', 'El foro'));
    RAIZ.appendChild(h);
    if (est.n === 1) {
      RAIZ.appendChild(el('p', null, T('foNivel1',
        'El foro se ve con una clave. No hay cuenta ni contraseña: se genera '
        + 'en tu navegador y no sale de tu aparato.')));
      var a = el('a', 'boton', T('foCrearClave', 'Crear identidad en Perfil'));
      a.href = './community.html#perfil';   // el perfil es pestaña de Comunidad (2026-09-23)
      var f = el('div', 'fila'); f.appendChild(a); RAIZ.appendChild(f);
      return false;
    }
    RAIZ.appendChild(el('p', 'tenue',
      T('foComoQuien', 'Lees como') + ' ' + est.quien + ' · '
      + (est.n === 3 ? T('foNivel3', 'nivel 3, puedes escribir')
                     : T('foNivel2', 'nivel 2, puedes leer'))));
    if (est.duda) { RAIZ.appendChild(el('p', 'no-data', est.duda)); }
    return true;
  }

  function lista(cs) {
    if (!cs.length) {
      /* VACIO ES VACIO, y se dice. Rellenar un foro sin comunidad con hilos de
         ejemplo es la mentira mas vieja de internet, y esta casa ya la tiene
         nombrada en la cabecera de `threads.json`. */
      RAIZ.appendChild(el('p', 'tenue', T('foVacio',
        'Todavía no ha escrito nadie. Vacío es lo que hay.')));
      return;
    }
    var ol = el('ol', 'foro-lista');
    cs.forEach(function (c) {
      var li = el('li', 'foro-comentario');
      var cab = el('p', 'tenue');
      cab.appendChild(el('b', null, c.autor || '?'));
      if (c.cuando) {
        cab.appendChild(document.createTextNode(' · '
          + new Date(c.cuando * 1000).toISOString().slice(0, 16).replace('T', ' ')));
      }
      li.appendChild(cab);
      li.appendChild(el('p', null, c.texto || ''));
      ol.appendChild(li);
    });
    RAIZ.appendChild(ol);
  }

  function escribir(est) {
    if (est.n < 3) {
      RAIZ.appendChild(el('p', 'tenue', T('foSoloLectura',
        'Para escribir hace falta nivel 3: corrige una respuesta y guarda el par '
        + 'firmado. Escribir no se abre por tener clave, se abre por haber '
        + 'entregado trabajo.')));
      return;
    }
    var ta = document.createElement('textarea');
    ta.id = 'foro-texto';
    ta.maxLength = TOPE;
    ta.rows = 3;
    ta.placeholder = T('foEscribe', 'Escribe un comentario…');
    RAIZ.appendChild(ta);
    var fila = el('div', 'fila');
    var b = el('button', 'boton', T('foEnviar', 'Firmar y publicar'));
    b.type = 'button';
    b.addEventListener('click', function () { manda(b, ta, est); });
    fila.appendChild(b);
    RAIZ.appendChild(fila);
    RAIZ.appendChild(el('p', 'tenue', T('foAviso',
      'Lo que escribas sale de este aparato firmado con tu clave, y lo verán '
      + 'los demás registrados. No se puede borrar desde aquí.')));
  }

  function manda(boton, ta, est) {
    var texto = (ta.value || '').trim();
    if (!texto) { return; }
    boton.disabled = true;
    var antes = boton.textContent;
    boton.textContent = T('foMandando', 'Firmando y enviando…');
    var publica;
    window.Identity.publica().then(function (pk) {
      publica = pk;
      return fetch(API + '/reto', { cache: 'no-store' }).then(function (r) { return r.json(); });
    }).then(function (d) {
      if (!d || !d.reto) { throw new Error(T('foSinReto', 'el Ágora no dio reto')); }
      /* EL TEXTO VA DENTRO DE LO FIRMADO. Firmar solo el reto probaria quien
         eres y no QUE ESCRIBES: quien interceptase la peticion podria cambiar
         el comentario por el camino y la firma seguiria cuadrando. Es la misma
         razon por la que la ficha del perfil se firma, escrita en
         `agora_api.verificar()`. */
      return window.Identity.firmarTexto(
        est.quien + '|' + publica + '|' + d.reto + '|' + texto
      ).then(function (firma) {
        return fetch(API + '/comentarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pseudonimo: est.quien, clave_publica: publica,
                                 reto: d.reto, firma: firma, texto: texto })
        });
      });
    }).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      ta.value = '';
      return carga();
    }).catch(function (e) {
      boton.disabled = false;
      boton.textContent = antes;
      RAIZ.appendChild(el('p', 'no-data',
        T('foFallo', 'NO_DATA — no se pudo publicar:') + ' ' + e.message));
    });
  }

  function carga() {
    return nivel().then(function (est) {
      limpia();
      if (!cabecera(est)) { return; }
      return fetch(API + '/comentarios', { cache: 'no-store' })
        .then(function (r) {
          if (r.status === 404) { throw new Error('404'); }
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.json();
        })
        .then(function (d) { lista(d.comentarios || []); escribir(est); })
        .catch(function (e) {
          /* EL HUECO SE DECLARA CON SU CAUSA Y SU REMEDIO. Un 404 aqui no es
             una averia: es que el extremo todavia no esta aplicado en
             la-fragua. Decir «no se pudo cargar» a secas mandaria a alguien a
             buscar un fallo que no existe. */
          RAIZ.appendChild(el('p', 'no-data', e.message === '404'
            ? T('foSinExtremo', 'NO_DATA — el Ágora todavía no tiene extremo de '
                + 'comentarios. El cliente está hecho y el parche del rack está '
                + 'propuesto; falta aplicarlo.')
            : T('foSinRed', 'NO_DATA — no se pudo leer el foro:') + ' ' + e.message));
          escribir(est);
        });
    });
  }

  document.addEventListener('preceptor:identity', function () { carga(); });
  carga();
})();
