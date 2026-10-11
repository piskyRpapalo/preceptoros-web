/* preceptoros.org · theGame · la PARTIDA FIRMADA en la barra: exportarla (L-076, «el cuerpo es tuyo»).

   LIMPIEZA (orden del Soberano, 2026-10-11: «puertas muertas fuera»). Aqui vivian «Pilot» (la maquina juega si lo
   firmas), «Soltar» y «Suggest» (la regla propone, tu decides). Medido: desde que la capa dejo de ser un <dialog>,
   su freno `capa.open` era siempre falso y el piloto NUNCA actuaba; su ventana de «Acepto», ademas, heredaba
   `pointer-events:none` y solo se cerraba con Escape. Una puerta que no abre es peor que ninguna: se RETIRAN,
   con su dialogo, su fusible y su unica salida de red (`atlas-record.json`). El piloto sigue en el laboratorio y en
   el terminal J7 (`AtlasPiloto`, la misma lista de acciones); aqui ya no tiene puerta.

   QUEDA lo que si abre: EXPORTAR PARTIDA. La ley y las acciones, firmadas (Ed25519, por la persona), como FICHERO
   que la persona se lleva. No se envia solo y no se guarda en el navegador. Sin identidad, se ofrece crearla. */
(function () {
  'use strict';

  var capa = null, R = {};

  function T(k) { return (window.AtlasJuego && window.AtlasJuego.texto(k)) || ''; }
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function boton(texto) { var b = el('button', 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return p.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function dice(t) { R.estado.textContent = t; }

  /* Sin identidad no hay firma. Se ofrece crearla aqui mismo (`Identity.crear`) y se reintenta lo que estaba a
     medias; si la pagina no trae `auth.js`, se dice y no se inventa otra salida. */
  function conIdentidad(err, caja, reintenta) {
    var msg = String((err && err.message) || err || '');
    if (!/sin identidad/.test(msg) || !window.Identity || !window.Identity.crear) {
      dice(T('piloto_sin_id') + ' ' + msg); return;
    }
    dice(T('piloto_sin_id'));
    if (caja.querySelector('.crear-id')) { return; }
    var b = boton(T('piloto_crear_id')); b.classList.add('crear-id'); b.id = 'thegame-crear-id';
    b.addEventListener('click', function () {
      b.disabled = true;
      window.Identity.crear().then(function () { b.remove(); reintenta(); },
        function (x) { b.disabled = false; dice(String((x && x.message) || x)); });
    });
    caja.appendChild(b);
  }
  function quien() {
    if (!window.Identity) { return Promise.reject(new Error('sin identidad')); }
    return window.Identity.publica().then(function (pub) {
      return { pseudonimo: window.Identity.quien(), clave_publica: pub };
    });
  }

  /* --- exportar la partida ------------------------------------------------ */
  function exporta() {
    var p = window.AtlasJuego.partida();
    if (!p) { dice(T('partida_nd')); return; }
    quien().then(function (yo) {
      return window.Identity.firmar(p).then(function (f) {
        return {
          esquema: 'atlas.partida.firmada/1', partida: p, firma: f.firma,
          algoritmo: 'Ed25519', pseudonimo: yo.pseudonimo, clave_publica: yo.clave_publica
        };
      });
    }).then(function (sobre) {
      var blob = new Blob([JSON.stringify(sobre, null, 1) + '\n'], { type: 'application/json' });
      var a = el('a'); a.href = URL.createObjectURL(blob);
      a.download = 'atlas-partida-' + p.final.ciclo + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      dice(rellena(T('partida_hecha'), { n: p.pasos.length }));
    }).catch(function (e) { conIdentidad(e, R.caja, exporta); });
  }

  function monta(c) {
    capa = c;
    var barra = capa.querySelector('.thegame-barra');
    if (!barra || barra.querySelector('.thegame-piloto')) { return; }
    R.caja = el('div', 'thegame-piloto');
    R.exporta = boton(T('partida_exportar')); R.exporta.title = T('partida_nota'); R.exporta.id = 'thegame-exporta';
    R.exporta.classList.add('thegame-exporta'); /* thegame.js la lleva a la terminal, plegada en «Terminal J7» */
    R.estado = el('p'); R.estado.setAttribute('role', 'status');
    R.exporta.addEventListener('click', exporta);
    [R.exporta, R.estado].forEach(function (n) { R.caja.appendChild(n); });
    barra.appendChild(R.caja);
  }

  window.AtlasPilotoCapa = { monta: monta };
})();
