/* preceptoros.org · EL MINI-CHAT DE LA PLAZA. Terminal local que FIRMA.

   NO ES UN MINI-FORO, y la distincion es del Soberano (2026-09-14): el foro es
   para miembros registrados y esta cerrado en escritura; esto es un terminal
   LOCAL que firma cada linea y la exporta. Dos cosas distintas, dos flujos
   distintos. Confundirlas seria prometer una conversacion que no existe.

   SIN FIRMA NO HAY DATO. Cada linea se firma con la clave Ed25519 del aparato y
   entra en el MISMO almacen que las correcciones (`bronce.js`), asi que la
   puerta al rack que ya existia la recoge sin que haya que escribir un segundo
   camino. Dos caminos hacia el rack divergen el dia que cambie el protocolo, y
   uno de los dos empieza a mentir sin que nadie lo note.

   ESTO NO HABLA CON UNA IA, y por eso no lleva correccion de respuesta: no hay
   respuesta de modelo que corregir. El dia que se meta una IA dentro, se
   enchufa `corregir.js` como en los demas -- y se dice aqui.

   SE MINIMIZA, NO SE CIERRA. Cerrar pierde el hilo. Y desde hoy se guarda en
   `localStorage` --del aparato, no de la pestaña-- porque una linea FIRMADA si
   es un documento: perderla al cerrar la pestaña seria tirar algo que la
   persona ya consintio en firmar.

   EL COLOR DEL NOMBRE SALE DE LA FIRMA, no de un azar. El mismo apodo da el
   mismo tono siempre, en cualquier maquina, porque se deriva de sus letras: asi
   se reconoce a alguien de un vistazo sin necesidad de avatar ni de cuenta. Es
   la misma idea que la identidad derivada del sha256 -- el aspecto sale del
   dato, no de un registro.

   Y NO SE PUBLICA NADA. El Agora sigue devolviendo 405 en
   `POST /api/v1/threads`, y aunque abriera, esto no es el foro. Lo que se
   escribe aqui se queda firmado en el aparato hasta que alguien pulse «Enviar
   al rack», y alli se encola para revision humana. Ni sincronizacion
   automatica, ni publicacion: nada viaja sin firma explicita. */
(function () {
  var raiz = document.getElementById('mini-chat');
  if (!raiz) return;
  // `localStorage`, no `sessionStorage`: ver la cabecera. La llave cambia de
  // nombre a proposito -- lo guardado con el esquema viejo no llevaba firma, y
  // leerlo aqui lo pintaria como si la llevara.
  var LLAVE = 'preceptoros:plaza:firmado';

  function T(clave, respaldo) {
    var b = document.getElementById('i18n');
    try { return (JSON.parse(b.textContent)[clave]) || respaldo; }
    catch (e) { return respaldo; }
  }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }
  /* Tono estable a partir del nombre: suma de letras sobre la rueda de color.
     Saturacion y luminosidad fijas para que ningun nombre salga ilegible sobre
     el fondo oscuro del terminal -- el azar decide el tono, no el contraste. */
  function color(nombre) {
    var s = 0;
    for (var i = 0; i < nombre.length; i++) { s = (s * 31 + nombre.charCodeAt(i)) % 360; }
    return 'hsl(' + s + ' 70% 72%)';
  }

  function leer() {
    try { return JSON.parse(localStorage.getItem(LLAVE) || '[]'); }
    catch (e) { return []; }
  }
  function guardar(lineas) {
    try { localStorage.setItem(LLAVE, JSON.stringify(lineas.slice(-40))); }
    catch (e) { /* privado o lleno: el hilo vive en pantalla y ya */ }
  }

  var caja = el('div', 'mini-chat');
  caja.dataset.min = '0';
  var cab = el('div', 'mini-chat-cab');
  var h = el('h3', null, T('mcTitulo', 'Plaza'));
  var min = el('button', 'cierre-x', '–');
  min.type = 'button';
  min.setAttribute('aria-label', T('mcMinimizar', 'Minimizar'));
  cab.appendChild(h); cab.appendChild(min);
  var cuerpo = el('div', 'mini-chat-cuerpo');
  cuerpo.setAttribute('aria-live', 'polite');
  var pie = el('div', 'mini-chat-pie');
  var campo = document.createElement('input');
  campo.type = 'text';
  campo.placeholder = T('mcEscribe', 'Escribe…');
  campo.setAttribute('aria-label', T('mcEscribe', 'Escribe…'));
  var manda = el('button', 'btn-secundario', T('mcEnviar', 'Enviar'));
  manda.type = 'button';
  pie.appendChild(campo); pie.appendChild(manda);
  caja.appendChild(cab); caja.appendChild(cuerpo); caja.appendChild(pie);
  raiz.appendChild(caja);

  /* La hora, corta y local. Va EN PANTALLA porque una linea firmada sin momento
     no se puede situar, y el `cuando` que viaja al rack es el ISO completo: el
     de aqui es para leer, el de alli para verificar. */
  function hora(iso) {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  function pinta(linea) {
    var p = el('p', 'mini-linea');
    var b = el('b', null, linea.quien + ' ');
    b.style.color = color(linea.quien);
    p.appendChild(b);
    p.appendChild(document.createTextNode(linea.texto));
    if (linea.cuando) {
      p.appendChild(el('span', 'mini-hora', ' ' + hora(linea.cuando)));
    }
    /* EL SELLO DE FIRMA, y no es decoracion: es la unica forma de que se vea la
       diferencia entre una linea que puede viajar al rack y una que no. Se
       enseñan los primeros caracteres de la firma, no la firma entera -- 128
       hexadecimales dentro de un terminal de plaza no los lee nadie, y el ancho
       lo paga la pagina (misma leccion que A14). */
    if (linea.firma) {
      /* SIN EL PREFIJO DEL ALGORITMO. La firma llega como
         `ed25519:019a…` y cortar a ocho caracteres dejaba «ed25519:» --el
         sello decia el algoritmo, que es igual en todas, y no decia nada de
         ESTA firma--. Medido abriendo la pagina: se veia `✓ ed25519:`. */
      var corta = String(linea.firma).replace(/^[a-z0-9]+:/i, '');
      var s = el('span', 'mini-sello', ' ✓ ' + corta.slice(0, 8));
      s.title = T('mcFirmada', 'Firmada en tu aparato') + ' · ' + linea.firma;
      p.appendChild(s);
    }
    cuerpo.appendChild(p);
    cuerpo.scrollTop = cuerpo.scrollHeight;
  }

  var lineas = leer();
  if (!lineas.length) {
    cuerpo.appendChild(el('p', 'mini-linea', T('mcCerrado',
      'Terminal local. Lo que escribas se firma en tu aparato y no sale de él hasta que tú lo envíes.')));
  }
  lineas.forEach(pinta);

  /* La puerta al rack. `enviar.js` es su dueño y aqui solo se PIDE: un segundo
     camino hacia el rack divergiria del primero el dia que cambie el protocolo.
     Solo aparece cuando hay algo que mandar, como la de exportar. */
  var puerta = el('div', 'mini-chat-puerta');
  var salida = el('button', 'btn-secundario');
  salida.type = 'button';
  var nota = el('div');
  puerta.appendChild(salida); puerta.appendChild(nota);
  caja.appendChild(puerta);
  function refrescarPuerta() {
    if (!window.Enviar) { puerta.hidden = true; return; }
    window.Enviar.cuantas().then(function (n) {
      puerta.hidden = !n;
      salida.textContent = window.Enviar.rotulo('envBoton', 'Enviar al rack') +
                           ' (' + n + ')';
    });
  }
  salida.addEventListener('click', function () {
    salida.disabled = true;
    window.Enviar.mandar(nota).catch(function (e) {
      nota.className = 'no-data';
      nota.textContent = String(e && e.message ? e.message : e);
    }).then(function () { salida.disabled = false; refrescarPuerta(); });
  });
  refrescarPuerta();

  /* SIN FIRMA NO HAY DATO, y sin identidad no hay firma. En vez de dejar el
     callejon sin salida que ya costo una cicatriz --se escribe, se pulsa, y la
     pagina contesta «sin identidad» sin decir donde se consigue una-- la puerta
     se abre aqui mismo y la linea se manda sola despues. */
  function conIdentidad() {
    if (window.Identity && window.Identity.quien()) { return Promise.resolve(true); }
    if (!window.Identity || !window.Identity.crear) { return Promise.resolve(false); }
    cuerpo.appendChild(el('p', 'mini-linea nodata',
      T('mcSinIdentidad', 'Creando una identidad para poder firmar…')));
    return window.Identity.crear().then(function () { return true; })
      .catch(function () { return false; });
  }

  function mandar() {
    var texto = campo.value.trim();
    if (!texto) return;
    if (!window.Identity || !window.Bronce) {
      cuerpo.appendChild(el('p', 'mini-linea nodata', T('mcSinFirma',
        'NO_DATA — este navegador no puede firmar, y aquí sin firma no hay dato.')));
      return;
    }
    campo.disabled = true;
    conIdentidad().then(function (hay) {
      if (!hay) {
        cuerpo.appendChild(el('p', 'mini-linea nodata', T('mcSinFirma',
          'NO_DATA — este navegador no puede firmar, y aquí sin firma no hay dato.')));
        return;
      }
      var cuando = new Date().toISOString();
      /* EL MISMO ESQUEMA DE DIEZ CAMPOS que firma `corregir.js`, y en el mismo
         orden, porque `ingesta.py` reconstruye los bytes firmados poniendo sus
         campos primero y los extras despues. Un esquema propio para la Plaza
         obligaria a un segundo verificador en el rack.
         `respuesta` y `correccion` van vacias a proposito: aqui no contesto un
         modelo. Lo que hay es lo que escribio una persona, y va en `prompt`. */
      var reg = {
        prompt: texto,
        respuesta: '',
        correccion: '',
        corregido: cuando,
        modelo: 'NO_DATA',
        idioma: (document.documentElement.lang || 'NO_DATA').slice(0, 2),
        motivo: 'NO_DATA',
        tarea: 'plaza',
        consent: 0,
        origen: 'preceptoros.org' + location.pathname,
        tipo: 'plaza',
        autoridad: 1
      };
      return window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return window.Bronce.guardar({ par: reg, firma: f.firma,
            autor: f.autor, algoritmo: f.algoritmo, publica: pub })
            .then(function () { return f; });
        });
      }).then(function (f) {
        var linea = { quien: window.Identity.quien(), texto: texto,
                      cuando: cuando, firma: f.firma };
        lineas.push(linea); guardar(lineas); pinta(linea);
        campo.value = '';
        refrescarPuerta();
      });
    }).catch(function (e) {
      cuerpo.appendChild(el('p', 'mini-linea nodata',
        'NO_DATA — ' + (e && e.message ? e.message : e)));
    }).then(function () { campo.disabled = false; campo.focus(); });
  }
  manda.addEventListener('click', mandar);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); mandar(); }
  });
  min.addEventListener('click', function () {
    var m = caja.dataset.min === '1';
    caja.dataset.min = m ? '0' : '1';
    min.textContent = m ? '–' : '+';
    min.setAttribute('aria-label', m ? T('mcMinimizar', 'Minimizar')
                                     : T('mcAbrir', 'Abrir'));
  });
})();
