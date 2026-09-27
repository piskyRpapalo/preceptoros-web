/* preceptoros.org · theGame · el PILOTO en la capa: «Acepto», «Soltar» y la
   partida firmada.

   LA MAQUINA JUEGA SOLA SOLO SI LA PERSONA LO FIRMA (Soberano, 2026-09-27).
   «Acepto» no es una casilla: construye una `atlas.aceptacion/1` y la firma
   con la identidad Ed25519 de siempre (`Identity.firmar`). Sin firma, el
   piloto no arranca. La aceptacion vive en la pestana y muere con ella.

   QUE HACE Y QUE NO HACE, CON EL MISMO PESO. El dialogo pone las dos listas
   una al lado de la otra, antes de pulsar, no despues. Y dice lo que hoy es:
   una regla fija, no un modelo, con su record medido al lado.

   FRENOS, todos visibles:
   - Se para al cerrar la capa, con la pestana oculta y con un dialogo del
     juego abierto: no juega a escondidas ni encima de la persona.
   - FUSIBLE: tres acciones fallidas seguidas lo paran, y lo dice.
   - «Soltar» esta siempre en la barra mientras juega.
   - No hay accion de valor, de claves ni de red en el enum: el piloto propone
     y el motor dispone (`AtlasJuego.aplica`).

   UNA SOLA SALIDA DE RED, al propio origen y al abrir el dialogo: el record
   de la casa (`atlas-record.json`). Si no llega, se dice NO_DATA.

   EXPORTAR PARTIDA: la ley y las acciones, firmadas, como FICHERO que la
   persona se lleva. No se envia solo y no se guarda en el navegador. */
(function () {
  'use strict';

  var FUSIBLE = 3;
  var capa = null, R = {}, reloj = 0, fallos = 0, firma = null, record = null;

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
  function corta(f) { return String(f).replace('ed25519:', '').slice(0, 12) + '…'; }

  /* Sin identidad no hay firma. Se ofrece crearla aqui mismo (`Identity.crear`)
     y se reintenta lo que estaba a medias; si la pagina no trae `auth.js`, se
     dice y no se inventa otra salida. */
  function conIdentidad(err, caja, reintenta) {
    var msg = String((err && err.message) || err || '');
    if (!/sin identidad/.test(msg) || !window.Identity || !window.Identity.crear) {
      dice(T('piloto_sin_id') + ' ' + msg); return;
    }
    dice(T('piloto_sin_id'));
    if (caja.querySelector('.crear-id')) { return; }
    var b = boton(T('piloto_crear_id')); b.classList.add('crear-id');
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

  /* --- el piloto ---------------------------------------------------------- */
  function puede() {
    return capa && capa.open && !document.hidden && !document.querySelector('.atlas-dlg-capa');
  }
  function paso() {
    if (!puede()) { return; }
    var J = window.AtlasJuego, a = window.AtlasPiloto.decide(J.instantanea(), window.AtlasMotor);
    if (!window.AtlasPiloto.valida(a)) { return falla(); }
    if (a.accion === 'esperar') { return; }
    var ev = window.AtlasPartida.como('piloto_base', function () { return J.aplica(a); });
    if (!ev || ev.resultado === 'fallo') { falla(); } else { fallos = 0; }
  }
  function falla() {
    fallos += 1;
    if (fallos >= FUSIBLE) { suelta(rellena(T('piloto_fusible'), { n: fallos })); }
  }
  function arranca() {
    fallos = 0;
    clearInterval(reloj); reloj = setInterval(paso, window.AtlasMotor.CICLO_MS);
    R.piloto.hidden = true; R.soltar.hidden = false;
    dice(rellena(T('piloto_activo'), { f: corta(firma) }));
  }
  function suelta(motivo) {
    clearInterval(reloj); reloj = 0; firma = null;
    R.piloto.hidden = false; R.soltar.hidden = true;
    dice(motivo || T('piloto_suelto'));
  }

  /* --- «Acepto» ----------------------------------------------------------- */
  function lista(titulo, claves, clase) {
    var s = el('section', clase);
    s.appendChild(el('h4', null, T(titulo)));
    var ul = el('ul');
    claves.forEach(function (k) { ul.appendChild(el('li', null, T(k))); });
    s.appendChild(ul);
    return s;
  }
  function pintaRecord(nodo) {
    var p = record && record.piloto_base, s = record && record.sin_piloto;
    if (!p || !s) { nodo.textContent = T('piloto_record_nd'); return; }
    var f = String(p.fase_final);
    nodo.textContent = rellena(T('piloto_record'), {
      f: f, c: p.ciclos_hasta_fase[f], i: p.integridad_min,
      h: record.horizonte_ciclos, si: s.integridad_min
    });
  }
  function acepta(caja, cierra) {
    var ok = caja.querySelector('.piloto-acepto');
    ok.disabled = true;
    quien().then(function (yo) {
      var obj = {
        esquema: 'atlas.aceptacion/1', modo: 'piloto', politica: 'piloto_base',
        contenido_v: window.AtlasMotor.CATALOGO.contenido_v,
        que_hace: ['lee_instantanea', 'propone_accion', 'mismas_acciones_que_tu'],
        que_no_hace: ['valor', 'credenciales', 'red', 'guardado'],
        pseudonimo: yo.pseudonimo, clave_publica: yo.clave_publica
      };
      return window.Identity.firmar(obj);
    }).then(function (f) {
      firma = f.firma; cierra(); arranca();
    }).catch(function (e) {
      ok.disabled = false;
      conIdentidad(e, caja.querySelector('.atlas-dlg-mandos'), function () { acepta(caja, cierra); });
    });
  }
  function dialogo() {
    var fondo = el('div', 'atlas-dlg-capa'), caja = el('div', 'atlas-dlg atlas-piloto-dlg');
    caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'atlas-piloto-t'); caja.tabIndex = -1;
    var cuerpo = el('div', 'atlas-dlg-cuerpo');
    cuerpo.appendChild(el('h3', 'atlas-dlg-placa', T('piloto_t'))).id = 'atlas-piloto-t';
    var dos = el('div', 'atlas-piloto-listas');
    dos.appendChild(lista('piloto_hace', ['piloto_h1', 'piloto_h2', 'piloto_h3'], 'atlas-piloto-si'));
    dos.appendChild(lista('piloto_no', ['piloto_n1', 'piloto_n2', 'piloto_n3', 'piloto_n4'], 'atlas-piloto-no'));
    cuerpo.appendChild(dos);
    cuerpo.appendChild(el('p', 'atlas-nota', T('piloto_modelo')));
    var rec = el('p', 'atlas-medido', T('piloto_record_nd'));
    cuerpo.appendChild(rec);
    cuerpo.appendChild(el('p', 'atlas-dlg-texto', T('piloto_firma')));
    var mandos = el('div', 'atlas-dlg-mandos');
    var no = boton(T('piloto_cancelar')), si = boton(T('piloto_acepto'));
    si.classList.add('piloto-acepto');
    mandos.appendChild(no); mandos.appendChild(si);
    cuerpo.appendChild(mandos); caja.appendChild(cuerpo); fondo.appendChild(caja);

    function cierra() { fondo.remove(); R.piloto.focus(); }
    no.addEventListener('click', cierra);
    si.addEventListener('click', function () { acepta(caja, cierra); });
    caja.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cierra(); }
    });
    capa.appendChild(fondo); caja.focus();

    if (record) { pintaRecord(rec); return; }
    fetch('/atlas-record.json').then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    }).then(function (d) { record = d; pintaRecord(rec); }, function () { pintaRecord(rec); });
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
    R.piloto = boton(T('piloto')); R.soltar = boton(T('piloto_soltar'));
    R.exporta = boton(T('partida_exportar')); R.exporta.title = T('partida_nota');
    R.soltar.hidden = true;
    R.estado = el('p'); R.estado.setAttribute('role', 'status');
    R.piloto.addEventListener('click', dialogo);
    R.soltar.addEventListener('click', function () { suelta(); });
    R.exporta.addEventListener('click', exporta);
    [R.piloto, R.soltar, R.exporta, R.estado].forEach(function (n) { R.caja.appendChild(n); });
    barra.insertBefore(R.caja, barra.querySelector('.thegame-cerrar'));
  }

  window.AtlasPilotoCapa = { monta: monta, suelta: suelta };
})();
