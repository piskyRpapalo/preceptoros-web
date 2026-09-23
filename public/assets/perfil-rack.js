/* preceptoros.org · REGISTRAR LA CLAVE EN EL AGORA, desde el perfil.

   LO QUE ESTO ARREGLA, MEDIDO EL 2026-09-20. El rack acepta perfiles desde
   hace tiempo --- `POST /api/v1/profiles` responde 201, y `/api/v1/salud` dice
   `perfiles: 1` --- y la web NO LO LLAMABA NUNCA. Ni un solo `fetch` a esa
   ruta en `public/assets/`. `auth.js` ya sabia firmar exactamente el mensaje
   que el Agora pide (`firmarTexto`, con el formato escrito en su comentario) y
   esa funcion no la usaba nadie.

   Las dos mitades del puente llevaban semanas construidas y sin tocarse. No
   es un fallo de ninguna de las dos: es que nadie escribio el tramo de en
   medio, y como cada mitad funciona sola, nada se ponia rojo.

   EL PSEUDONIMO NO SE ELIGE. Sale del hash de la clave publica --- lo dice la
   propia pagina ---, asi que aqui no hay campo de nombre que rellenar y no
   puede haber suplantacion: pedir el nombre de otro exigiria su clave.

   LA MAQUINA SE PREGUNTA, NO SE SUPONE. El Soberano pidio guardar la maquina
   de cada quien. El modelo `NuevoPerfil` del Agora tiene hoy cuatro campos
   mas ficha, y `maquina` no esta entre ellos --- y pydantic IGNORA EN SILENCIO
   lo que no conoce, que es el peor resultado posible: la peticion saldria con
   200 y el dato se perderia por el camino sin que nadie se entere.

   Asi que este fichero no manda la maquina a ciegas: registra, vuelve a pedir
   la ficha y MIRA SI EL CAMPO VOLVIO. Si no volvio, lo dice con su causa en
   vez de pintar un exito. El dia que el parche de `p0x/propuestas/` este
   aplicado en la-fragua, esto empieza a funcionar sin tocar una linea aqui:
   la capacidad se descubre, no se cablea. */
(function () {
  var RAIZ = document.getElementById('perfil-rack');
  if (!RAIZ) { return; }
  var API = 'https://api.preceptoros.org/api/v1';
  var UI = {};

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function T(clave, respaldo) { return UI[clave] || respaldo; }
  function limpia() { while (RAIZ.firstChild) { RAIZ.removeChild(RAIZ.firstChild); } }
  function nd(texto) {
    limpia();
    RAIZ.appendChild(el('p', 'no-data', texto));
  }

  /* LO QUE SE SABE DE ESTE APARATO, y nada mas.

     TRES VALORES GRUESOS a proposito: nucleos, escalon de memoria y
     plataforma. NO va el `userAgent` entero, que es la huella con la que se
     rastrea a la gente por toda la red --- y esta casa promete que lo que
     pasa aqui se queda aqui. Un perfil de maquina sirve para saber que puede
     correr alguien; para eso bastan tres numeros, y todo lo que sobre de ahi
     es identificacion disfrazada de telemetria.

     `deviceMemory` viene redondeado por el propio navegador (2, 4, 8...) y en
     Firefox no existe: eso es NO_DATA, no un cero. */
  function maquina() {
    var m = {};
    if (navigator.hardwareConcurrency) { m.nucleos = navigator.hardwareConcurrency; }
    if (navigator.deviceMemory) { m.memoria_gb = navigator.deviceMemory; }
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || '';
    if (p) { m.plataforma = p; }
    /* Y EL MOTOR QUE HA ELEGIDO, que es el dato util de verdad: saber que
       alguien tiene ocho nucleos no dice si puede correr un modelo; saber cual
       corre, si. Sale del selector que ya existe, no de una medida nueva. */
    var c = (window.CerebroPuesto && window.CerebroPuesto()) || null;
    if (c && c.tag) { m.motor = c.tag; }
    return m;
  }

  function pinta(quien, publica, ficha, avisoMaquina) {
    limpia();
    var reg = !!ficha;

    var p1 = el('p', null, reg ? T('prRegistrado', 'Tu clave está registrada en el Ágora.')
                               : T('prSinRegistrar', 'Tu clave existe en este aparato y el Ágora no la conoce.'));
    RAIZ.appendChild(p1);

    var dl = el('dl', 'ficha');
    dl.appendChild(el('dt', null, T('prPseudonimo', 'Pseudónimo')));
    dl.appendChild(el('dd', null, quien));
    if (reg && ficha.creado_en) {
      dl.appendChild(el('dt', null, T('prDesde', 'Registrado')));
      dl.appendChild(el('dd', null,
        new Date(ficha.creado_en * 1000).toISOString().slice(0, 10)));
    }
    RAIZ.appendChild(dl);

    /* LA MAQUINA SE ENSENA ANTES DE MANDARLA, entera y en claro. Pedir
       permiso para mandar «datos de tu equipo» sin decir cuales es pedir un
       cheque en blanco; con la lista delante, la casilla significa algo. */
    var m = maquina();
    var caja = el('div', 'fila');
    var et = el('label', null, null);
    var chk = el('input');
    chk.type = 'checkbox';
    chk.id = 'pr-maquina';
    et.appendChild(chk);
    et.appendChild(document.createTextNode(' ' + T('prMaquinaOfrece',
      'Enviar también qué máquina es esta:') + ' '));
    et.appendChild(el('code', null, Object.keys(m).length
      ? Object.keys(m).map(function (k) { return k + '=' + m[k]; }).join(' · ')
      : T('prMaquinaNada', 'tu navegador no dice nada de este aparato')));
    caja.appendChild(et);
    RAIZ.appendChild(caja);

    if (avisoMaquina) { RAIZ.appendChild(el('p', 'no-data', avisoMaquina)); }

    var fila = el('div', 'fila');
    var b = el('button', 'boton', reg ? T('prActualizar', 'Actualizar en el Ágora')
                                      : T('prRegistrar', 'Registrar en el Ágora'));
    b.type = 'button';
    b.addEventListener('click', function () { manda(b, quien, publica, chk.checked); });
    fila.appendChild(b);
    RAIZ.appendChild(fila);

    var aviso = el('p', 'tenue', T('prAviso',
      'Al pulsar, tu pseudónimo y tu clave pública salen de este aparato hacia '
      + 'el rack. La clave privada no: firma aquí y no se puede exportar.'));
    RAIZ.appendChild(aviso);
  }

  function manda(boton, quien, publica, conMaquina) {
    boton.disabled = true;
    var antes = boton.textContent;
    boton.textContent = T('prMandando', 'Firmando y enviando…');
    /* EL RETO ES DE UN SOLO USO y vive 300 s: se pide justo antes de firmar.
       Pedirlo al cargar la pagina y guardarlo seria firmar un reto que puede
       haber caducado mientras alguien leia. */
    fetch(API + '/reto', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.reto) { throw new Error('NO_DATA: reto'); }
        return window.Identity.firmarTexto(quien + '|' + publica + '|' + d.reto)
          .then(function (firma) {
            var cuerpo = { pseudonimo: quien, clave_publica: publica,
                           reto: d.reto, firma: firma };
            if (conMaquina) { cuerpo.maquina = maquina(); }
            return fetch(API + '/profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cuerpo)
            });
          });
      })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, code: r.status, d: d }; });
      })
      .then(function (res) {
        if (!res.ok) {
          var c = res.d && res.d.detail;
          throw new Error((c && (c.causa || c)) || ('HTTP ' + res.code));
        }
        return carga(conMaquina);
      })
      .catch(function (e) {
        boton.disabled = false;
        boton.textContent = antes;
        var p = el('p', 'no-data', T('prFallo', 'NO_DATA — no se pudo registrar:')
                   + ' ' + e.message);
        RAIZ.appendChild(p);
      });
  }

  function carga(seMandoMaquina) {
    var quien = window.Identity && window.Identity.quien();
    if (!quien) {
      nd(T('prSinIdentidad', 'NO_DATA — todavía no hay clave en este aparato. '
           + 'Se crea arriba, en «Tu identidad».'));
      return;
    }
    return window.Identity.publica().then(function (publica) {
      return fetch(API + '/profiles/' + encodeURIComponent(quien),
                   { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (ficha) {
          /* LA CAPACIDAD SE COMPRUEBA CONTRA LO QUE VOLVIO. Si se mando la
             maquina y la ficha no la trae, el Agora la tiro en silencio ---
             y decirlo es la diferencia entre un hueco declarado y un exito
             falso. */
          var aviso = null;
          if (seMandoMaquina && ficha && ficha.maquina === undefined) {
            aviso = T('prMaquinaNoLlega',
              'NO_DATA — el Ágora aceptó el registro pero NO guardó la máquina: '
              + 'su modelo todavía no tiene ese campo, y descarta en silencio lo '
              + 'que no conoce. El parche está propuesto en p0x/propuestas/.');
          }
          pinta(quien, publica, ficha, aviso);
        });
    });
  }

  function rotulos() {
    // Primero la familia del perfil (ver profile.js); el `#i18n`, de respaldo.
    if (window.PerfilUI) { UI = window.PerfilUI; return; }
    var b = document.getElementById('i18n');
    try { UI = b ? JSON.parse(b.textContent) : {}; } catch (e) { UI = {}; }
  }

  rotulos();
  /* SE ESPERA A LA IDENTIDAD. `auth.js` abre IndexedDB, asi que al ejecutarse
     este fichero `quien()` puede devolver vacio todavia --- y pintar
     «no hay clave» a quien si la tiene es el mismo fallo de visitante que ya
     costo una tarde en la Torre. El evento lo lanza `auth.js` tanto al
     encontrar una clave como al crearla. */
  document.addEventListener('preceptor:identity', function () { carga(false); });
  carga(false);
})();
