/* preceptoros.org · theGame · los DUELOS entre personas, en la Arena (sugerencias firmadas por el
   Soberano, 2026-09-28: «PvP entre dos telefonos sin servidor» y «regla de abandono en ciclos»).

   La logica es de `duelo.js` (pura, probada en node); aqui solo la mano que la mueve. Cada paso produce
   un PAQUETE firmado que la persona manda por el canal que elija: «Send…» (el menu de compartir del
   sistema), «Copy» (el portapapeles) o «Download». Quien lo recibe lo pega o lo abre en «Import»: se
   VERIFICA cada firma antes de tocar nada. Ninguna direccion escrita aqui, ningun envio solo.

   Firma con la identidad de siempre (`Identity.firmarTexto`); verifica con WebCrypto (`AtlasArmy.
   verificaWeb`); el azar del commit-reveal sale de `crypto.getRandomValues`. Sin identidad, NO_DATA con
   la salida (crear tu clave). Los duelos viven en la pestana: cerrarla antes de revelar es abandonar. */
(function () {
  'use strict';

  var Du = window.AtlasDuelo, V = window.AtlasValores;
  var R = {}, cli = null, reloj = 0;

  function T(k) { return window.AtlasArenaUI ? window.AtlasArenaUI.texto(k) : ''; }
  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto, clase) { var b = el('button', clase || 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function dice(t) { R.estado.textContent = t; }
  function hex(n) {
    var b = new Uint8Array(n);
    window.crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function ciclo() { var i = window.AtlasJuego && window.AtlasJuego.instantanea(); return i ? i.ciclo : 0; }

  /* El cliente nace con la identidad: sin clave no hay firma, y se dice. */
  function cliente() {
    if (cli) { return Promise.resolve(cli); }
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) { return Promise.reject(new Error(T('duelo_nd_id'))); }
    return I.publica().then(function (pub) {
      cli = Du.crea({ pub: pub, pseudonimo: I.quien(), contenido_v: window.AtlasMotor.CATALOGO.contenido_v,
                      firma: function (t) { return I.firmarTexto(t); }, verifica: window.AtlasArmy.verificaWeb,
                      azar: function () { return hex(32); }, azar32: function () { return hex(16); }, ciclo: ciclo });
      return cli;
    });
  }

  /* COMPARTIR un paquete: por el canal que elija la persona, nunca solo. */
  function comparte(p, nombre, aviso) {
    var texto = JSON.stringify(p, null, 1) + '\n';
    R.salida.textContent = '';
    R.salida.appendChild(el('p', 'atlas-nota', rellena(aviso, { f: nombre })));
    var fila = el('div', 'atlas-arena-mandos'), f = typeof File === 'function' ? new File([texto], nombre, { type: 'application/json' }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      var s = boton(T('duelo_enviar'));
      s.addEventListener('click', function () {
        navigator.share({ files: [f], title: nombre }).then(function () { dice(T('duelo_enviado')); }, function () {});
      });
      fila.appendChild(s);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var c = boton(T('duelo_copiar'), 'boton-sec');
      c.addEventListener('click', function () {
        navigator.clipboard.writeText(texto).then(function () { dice(T('duelo_copiado')); }, function () { dice(T('duelo_nd_copiar')); });
      });
      fila.appendChild(c);
    }
    var a = el('a', 'boton-sec', T('duelo_bajar'));
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' })); a.download = nombre;
    fila.appendChild(a);
    R.salida.appendChild(fila);
  }

  function juega(x, yo) {
    if (window.AtlasArenaUI) {
      window.AtlasArenaUI.juega(x.defensa.cuerpo.tropas, x.asalto.tropas, x.combate,
                                { titulo: T('duelo_h'), yo: yo, semilla: x.resultado.semilla });
    }
  }
  function falla(e) { dice(rellena(T('duelo_mal'), { m: (e && e.message) || '' })); }

  function publica() {
    cliente().then(function (c) {
      var sq = window.AtlasArenaUI ? window.AtlasArenaUI.escuadra() : [];
      if (!sq.length) { throw new Error(T('arena_vacia')); }
      return c.publica(sq).then(function (p) { comparte(p, 'atlas-defense.json', T('duelo_publicada')); pinta(); });
    }).catch(falla);
  }
  function reta(huella, sq) {
    cliente().then(function (c) {
      return c.reta(huella, sq).then(function (x) {
        comparte(x.paquete, 'atlas-challenge.json', T('duelo_reto_hecho')); pinta();
      });
    }).catch(falla);
  }
  function importa(texto) {
    cliente().then(function (c) {
      return c.importa(texto).then(function (x) {
        if (x.tipo === 'defensa') {
          if (window.AtlasArenaUI) { window.AtlasArenaUI.ponJugadores(c.defensas()); }
          dice(rellena(T('duelo_ok_defensa'), { p: x.sobre.pseudonimo }));
        } else if (x.tipo === 'desafio') { dice(rellena(T('duelo_recibido'), { p: x.de })); }
        else if (x.tipo === 'respuesta') { dice(rellena(T('duelo_respondido'), { p: x.de })); }
        else if (x.tipo === 'revelacion') { juega(x, 0); dice(T('duelo_visto')); }
        else { dice(T('duelo_abandono_ok')); }
        R.pega.value = ''; pinta();
      });
    }).catch(falla);
  }
  function accion(d) {
    cliente().then(function (c) {
      if (d.fase === 'recibido') {
        return c.acepta(d.sesion).then(function (p) { comparte(p, 'atlas-answer.json', T('duelo_aceptado')); pinta(); });
      }
      if (d.fase === 'revelar') {
        return c.revela(d.sesion).then(function (x) {
          juega(x, 1); comparte(x.paquete, 'atlas-reveal.json', T('duelo_revelado')); pinta();
        });
      }
      if (d.fase === 'espera') {
        return c.abandona(d.sesion).then(function (x) { comparte(x.paquete, 'atlas-claim.json', T('duelo_reclamado')); pinta(); });
      }
    }).catch(falla);
  }

  /* La lista de duelos y el rating local; el plazo de abandono corre en ciclos de juego. */
  function pinta() {
    if (!R.lista) { return; }
    R.lista.textContent = '';
    if (!cli) { return; }
    cli.duelos().forEach(function (d) {
      var li = el('li'), txt = rellena(T('duelo_fase_' + d.fase), { p: d.de || '' });
      if (d.fase === 'espera') { txt += ' · ' + rellena(T('duelo_plazo'), { c: cli.plazo(d.sesion) }); }
      li.appendChild(el('span', null, txt));
      var k = { recibido: 'duelo_acepta', revelar: 'duelo_revela', espera: 'duelo_abandono' }[d.fase];
      if (k) {
        var b = boton(T(k), 'boton-sec');
        if (d.fase === 'espera' && cli.plazo(d.sesion) > 0) { b.disabled = true; }
        b.addEventListener('click', function () { accion(d); });
        li.appendChild(b);
      }
      R.lista.appendChild(li);
    });
    var r = cli.rating();
    R.rating.textContent = rellena(T('duelo_rating'), { r: r.rating, n: r.partidas,
      prov: r.partidas < V.combate.provisional_hasta ? T('duelo_prov') : '' });
  }

  function monta(zona) {
    if (!zona || zona.querySelector('.atlas-duelos')) { return; }
    var s = el('div', 'atlas-duelos');
    s.appendChild(el('h5', null, T('duelo_h')));
    s.appendChild(el('p', 'atlas-nota', T('duelo_nota')));
    var m = el('div', 'atlas-arena-mandos');
    var pb = boton(T('duelo_publica')); pb.addEventListener('click', publica); m.appendChild(pb);
    s.appendChild(m);
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) {
      var nd = el('p', 'no-data', T('duelo_nd_id')), cr = boton(T('arena_crear_id'), 'boton-sec');
      cr.addEventListener('click', function () {
        Promise.resolve(I && I.crear && I.crear()).then(function () { nd.remove(); cr.remove(); dice(T('duelo_con_id')); });
      });
      s.appendChild(nd); s.appendChild(cr);
    }
    var imp = el('details', 'atlas-duelo-importa');
    imp.appendChild(el('summary', null, T('duelo_importa')));
    R.pega = el('textarea'); R.pega.rows = 3; R.pega.setAttribute('aria-label', T('duelo_pega')); R.pega.placeholder = T('duelo_pega');
    imp.appendChild(R.pega);
    var fila = el('div', 'atlas-arena-mandos');
    var ab = boton(T('duelo_abre'), 'boton-sec');
    ab.addEventListener('click', function () { if (R.pega.value.trim()) { importa(R.pega.value); } });
    var fi = el('input'); fi.type = 'file'; fi.accept = 'application/json,.json'; fi.setAttribute('aria-label', T('duelo_fichero'));
    fi.addEventListener('change', function () { if (fi.files[0]) { fi.files[0].text().then(importa); fi.value = ''; } });
    fila.appendChild(ab); fila.appendChild(fi); imp.appendChild(fila);
    s.appendChild(imp);
    R.estado = el('p', 'atlas-vivo'); R.estado.setAttribute('role', 'status'); s.appendChild(R.estado);
    R.salida = el('div', 'atlas-duelo-salida'); s.appendChild(R.salida);
    R.lista = el('ul', 'atlas-duelo-lista'); s.appendChild(R.lista);
    R.rating = el('p', 'atlas-medido'); s.appendChild(R.rating);
    zona.appendChild(s);
    clearInterval(reloj);
    reloj = setInterval(function () { if (zona.offsetParent !== null && cli) { pinta(); } }, 2000);
  }

  window.AtlasDueloUI = { monta: monta, reta: reta, importa: importa };
})();
