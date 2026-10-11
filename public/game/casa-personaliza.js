/* preceptoros.org · theGame · «CUSTOMIZE»: personalizar tu casa (sale de `home_buildings.js` en U0, «el mapa
   unico», para que la casa quepa bajo su techo de 16 KiB sin perder nada).

   Estilo del caparazon, variante del emblema, POSTURA (alianzas, comercio, formacion), BANDERA (P10) y lema. Se guarda
   en ESTE aparato por la casa y, si se comparte, viaja FIRMADO. Sin datos personales: el lema que parezca
   correo, URL, ruta, IP o telefono no entra (`forma`). Y NO DA VENTAJA. La puerta es
   `AtlasCasaPersonaliza.abre(ctx)`: ctx = { casa, opciones, T, forma, guarda, raiz }. */
(function () {
  'use strict';
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function boton(texto, clase) { var b = el('button', clase, texto); b.type = 'button'; return b; }

  function abre(ctx) {
    var casa = ctx.casa, OPCIONES = ctx.opciones, T = ctx.T, forma = ctx.forma, guarda = ctx.guarda, R = { raiz: ctx.raiz };
    function grupo(clave, valores, etiqueta) {
      var f = el('fieldset', 'casa-grupo'); f.appendChild(el('legend', null, T('p_' + clave)));
      valores.forEach(function (v) {
        var b = boton(etiqueta ? etiqueta(v) : T(clave + '_' + v), 'casa-op');
        b.setAttribute('aria-pressed', String(casa[clave] === v));
        b.addEventListener('click', function () {
          casa[clave] = v; guarda();
          Array.prototype.forEach.call(f.querySelectorAll('.casa-op'), function (o, i) { o.setAttribute('aria-pressed', String(valores[i] === v)); });
        });
        f.appendChild(b);
      });
      return f;
    }
    var d = el('dialog', 'casa-pers'); d.setAttribute('aria-label', T('personaliza'));
    var fo = el('form'); fo.method = 'dialog';
    fo.appendChild(el('h3', null, T('personaliza')));
    fo.appendChild(grupo('estilo', OPCIONES.estilo));
    fo.appendChild(grupo('emblema', OPCIONES.emblema, function (v) { return T('emblema_n').replace('{n}', v + 1); }));
    fo.appendChild(grupo('alianzas', OPCIONES.alianzas)); fo.appendChild(grupo('comercio', OPCIONES.comercio));
    fo.appendChild(grupo('formacion', OPCIONES.formacion));
    fo.appendChild(grupo('bandera', OPCIONES.bandera, function (v) { return T('bandera_' + (v || 'ninguna')); }));
    var l = el('label', 'casa-lema', T('p_lema') + ' '), i = el('input'); i.maxLength = 32; i.value = casa.lema; l.appendChild(i); fo.appendChild(l);
    var nota = el('p', 'casa-nota', T('p_nota')); nota.setAttribute('role', 'status'); fo.appendChild(nota);
    i.addEventListener('change', function () {
      var viejo = casa.lema; casa.lema = i.value; var e = forma(casa);
      if (e) { casa.lema = viejo; nota.textContent = T('lema_no'); } else { nota.textContent = T('p_nota'); guarda(); }
    });
    var fila = el('div', 'casa-fila'), comp = boton(T('comparte'), 'boton-sec');
    comp.addEventListener('click', function () {
      var I = window.Identity;
      if (!I || !I.quien || !I.quien()) { nota.textContent = T('comparte_sin'); return; }
      I.firmar(casa).then(function (fz) { return I.publica().then(function (p) { return { casa: casa, firma: fz.firma, publica: p }; }); })
        .then(function (s) { return window.navigator.clipboard.writeText(JSON.stringify(s)); })
        .then(function () { nota.textContent = T('comparte_ok'); }, function (x) { nota.textContent = 'NO_DATA · ' + (x && x.message); });
    });
    var x = boton(T('cerrar'), 'boton'); x.type = 'submit';
    fila.appendChild(comp); fila.appendChild(x); fo.appendChild(fila); d.appendChild(fo);
    d.addEventListener('close', function () { d.remove(); });
    R.raiz.appendChild(d); d.showModal();
  }

  window.AtlasCasaPersonaliza = { abre: abre };
})();
