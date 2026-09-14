/* preceptoros.org · LA RESEÑA DE UNA LINEA, firmada.

   Orden del Soberano, 2026-09-14: que desde el panel de una mision de comunidad
   se pueda dejar la review para que llegue al rack.

   VIVE FUERA DEL ESCENARIO por dos razones y las dos mandan. La primera es de
   asunto: esto toca `Identity` y `Bronce` --firma y almacen-- que es lo que
   hacen `corregir.js` y `elegir.js`, no lo que hace una pantalla. La segunda es
   aritmetica: con esto dentro, `escenario.js` cerraba en 16.411 B contra un tope
   de 16.384. La casa PARTE en vez de recortar, y el corte cae donde cambia el
   asunto.

   NO SE INVENTA UN ESQUEMA: es el mismo par que ya arma `elegir.js` para valorar
   una respuesta --`tipo: 'valoracion'`, misma base `preceptoros-bronce`,
   `consent: 0`-- solo que lo que se juzga no es un turno, es la linea. Dos
   esquemas para el mismo hecho obligarian a un traductor en medio, y ese
   traductor es donde un dia se pierde el consentimiento.

   QUE LINEA SE RESEÑA VIAJA EN `prompt`, a proposito. Un campo extra --`linea:
   <id>`-- lo tiraria `ingesta.py`, que arma su fila con las claves que conoce;
   `prompt` se guarda entero en `user_prompt`. El id va dentro del texto, legible
   por una persona y recuperable con un LIKE.

   Y NO ENTRENA NADA. `turnos.py` filtra en POSITIVO --`= 'correccion'`-- asi que
   una valoracion se queda en la pool, contable y fuera del dataset. Un pulgar no
   dice QUE estaba mal; un modelo entrenado con eso aprende a evitar la forma de
   lo castigado sin saber por que, que es como se degrada un modelo creyendo que
   se afina. */
(function () {
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = String(texto);
    return n;
  }

  function caja(bloque, texto, UI) {
    if (!window.Identity || !window.Bronce) return null;
    var sec = el('section', 'esc-resena');
    sec.appendChild(el('h3', null, UI.resenaTitulo || ''));

    var fila = el('div', 'esc-fila');
    var area = document.createElement('textarea');
    area.className = 'esc-entrada';
    area.rows = 2;
    area.placeholder = UI.resenaQue || '';
    area.setAttribute('aria-label', UI.resenaTitulo || 'resena');
    fila.appendChild(area);
    sec.appendChild(fila);

    var mandos = el('div', 'esc-fila');
    var aviso = el('p', 'esc-aviso', '');
    var si = el('button', 'boton', UI.resenaSirve || '');
    var no = el('button', 'leve', UI.resenaNo || '');
    si.type = 'button'; no.type = 'button';
    mandos.appendChild(si); mandos.appendChild(no);
    sec.appendChild(mandos);
    sec.appendChild(aviso);

    function guardar(sirve) {
      var porque = area.value.trim();
      /* El orden de las claves es el de `ingesta.CAMPOS`, y lo nuevo AL FINAL:
         el otro lado reconstruye los bytes firmados poniendo sus diez campos
         primero y los extras despues, en el orden en que vinieron. */
      var reg = {
        prompt: (UI.resenaDe || 'Reseña de la línea') + ' «' +
                (texto.nombre || bloque.id) + '» (' + bloque.id + ')',
        respuesta: texto.util || '',
        correccion: '',
        corregido: new Date().toISOString(),
        modelo: (bloque.ficha && bloque.ficha.servido_en_el_rack) ||
                bloque.modelo_base || 'NO_DATA',
        idioma: (document.documentElement.lang || 'es').slice(0, 2),
        motivo: (sirve ? 'sirve' : 'no sirve') + (porque ? ': ' + porque : ''),
        tarea: 'NO_DATA',
        consent: 0,
        origen: 'preceptoros.org' + location.pathname,
        tipo: 'valoracion',
        autoridad: 0,
        sirve: sirve ? 1 : 0
      };
      si.disabled = true; no.disabled = true;
      aviso.className = 'esc-aviso';
      window.Identity.firmar(reg).then(function (f) {
        return window.Identity.publica().then(function (pub) {
          return window.Bronce.guardar({ par: reg, firma: f.firma, autor: f.autor,
                                         publica: pub, canonico: f.canonico });
        });
      }).then(function () {
        sec.innerHTML = '';
        sec.appendChild(el('h3', null, UI.resenaTitulo || ''));
        sec.appendChild(el('p', 'esc-aviso', UI.resenaGracias || ''));
      }).catch(function (e) {
        si.disabled = false; no.disabled = false;
        aviso.className = 'esc-fallo';
        aviso.textContent = (UI.resenaFallo || '') + ' ' +
          (e && e.message ? e.message : e);
        /* El mismo callejon que tenia la caja de correcciones, y la misma
           salida: la puerta se pone donde esta la persona, no en una nota que
           la mande a buscar un boton del cabezal. */
        if (/sin identidad/.test(String(e && e.message)) &&
            window.Identity.crear && !sec.querySelector('.crear-id')) {
          var nace = el('button', 'boton crear-id', UI.resenaIdentidad || '');
          nace.type = 'button';
          nace.addEventListener('click', function () {
            nace.disabled = true;
            window.Identity.crear().then(function () {
              nace.remove(); aviso.textContent = ''; guardar(sirve);
            }, function () { nace.disabled = false; });
          });
          sec.appendChild(nace);
        }
      });
    }
    si.addEventListener('click', function () { guardar(true); });
    no.addEventListener('click', function () { guardar(false); });
    return sec;
  }

  window.Resena = { caja: caja };
})();
