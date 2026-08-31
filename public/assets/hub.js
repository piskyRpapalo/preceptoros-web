/* preceptoros.org · el Hub. Rejilla de companeros, cola de firma y rack.
 *
 * TRES COSAS QUE ESTE FICHERO HACE EN ORDEN, Y EL ORDEN IMPORTA
 * -------------------------------------------------------------
 * 1. Pinta el ESQUELETO de forma sincrona, antes de pedir nada. Un panel
 *    vacio medio segundo se lee como una pagina rota, y el hueco reservado
 *    evita que la rejilla salte cuando llegan los datos.
 * 2. Pide `hub.json` sin bloquear la carga. Si falla, NO_DATA con la causa
 *    exacta: la rejilla vacia sin explicacion seria el mismo defecto que el
 *    Tablon tenia antes de la puerta anterior.
 * 3. Rotula la PROCEDENCIA antes de la primera tarjeta. Una rejilla de
 *    companeros se ve igual sea catalogo real o inventada; sin rotulo, la
 *    pagina fabrica un enjambre que no existe.
 *
 * Los textos viven en `hub.json` y no en el bloque #i18n de la portada. No es
 * capricho: anadir estas claves a las tres portadas gasta ~500 B en cada una
 * y `fr/index.html` tiene 335 B de margen. El precio es salirse del guardian
 * de paridad de la portada, asi que este modulo trae el suyo en test_web.py.
 */
(function () {
  var raiz = document.getElementById('hub');
  if (!raiz) return;
  var L = {}, DATOS = null;

  /* `scheduler.yield()` devuelve el hilo al navegador y vuelve con prioridad,
     que es lo que separa una pantalla que responde de una que se atasca al
     pintar. Donde no exista, un setTimeout(0) hace lo mismo peor: cede igual,
     pero vuelve al final de la cola. */
  var ceder = (window.scheduler && window.scheduler.yield)
    ? function () { return window.scheduler.yield(); }
    : function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  /* Aparato con poca memoria o con ahorro de datos pedido: se pintan las
     tarjetas SIN las ocho caras (48 KB). No es degradar por si acaso -- es
     que quien pide ahorro de datos lo ha pedido. */
  function ligero() {
    var c = navigator.connection || {};
    return !!c.saveData ||
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      (window.matchMedia && matchMedia('(prefers-reduced-data:reduce)').matches);
  }

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x !== undefined && x !== null) n.textContent = String(x);
    return n;
  }
  function seccion(titulo) {
    var s = el('section', 'panel');
    s.appendChild(el('h2', null, titulo));
    return s;
  }

  /* --- 1 · esqueleto, sincrono ------------------------------------------ */
  function hueso(clase) { return el('div', 'hueso ' + clase); }
  function esqueleto(n) {
    var g = el('div', 'agentes');
    for (var i = 0; i < n; i++) {
      var t = el('div', 'agente esqueleto');
      var c = el('div', 'agente-cara');
      c.appendChild(hueso('cara'));
      var col = el('div');
      col.appendChild(hueso('corto')); col.appendChild(hueso('largo'));
      c.appendChild(col); t.appendChild(c);
      // Un hueso por cada linea de la tarjeta real: funcion (dos lineas),
      // estado y disponibilidad. Si el esqueleto tiene menos piezas que la
      // tarjeta, la rejilla salta cuando llegan los datos.
      t.appendChild(hueso('largo')); t.appendChild(hueso('largo'));
      t.appendChild(hueso('corto')); t.appendChild(hueso('largo'));
      g.appendChild(t);
    }
    return g;
  }
  var s0 = seccion('…');
  s0.appendChild(esqueleto(8));
  raiz.appendChild(s0);

  /* --- 2 · las tarjetas -------------------------------------------------- */
  function tarjeta(a, sinCaras) {
    var b = el('button', 'agente');
    b.type = 'button';
    b.dataset.agente = a.id;
    var cara = el('div', 'agente-cara');
    if (!sinCaras && a.symbol) {
      var img = document.createElement('img');
      img.src = '/assets/agente-' + a.symbol + '.webp';
      img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.width = 56; img.height = 56;
      cara.appendChild(img);
    }
    var col = el('div');
    col.appendChild(el('span', 'agente-nombre', a.name));
    col.appendChild(el('span', 'agente-bloque',
      (DATOS.bloques || {})[String(a.block)] || ('bloque ' + a.block)));
    cara.appendChild(col);
    b.appendChild(cara);
    b.appendChild(el('p', 'agente-funcion', a.function));

    var e = el('div', 'agente-estado');
    e.appendChild(el('i', 'punto ' + (a.status || 'idle')));
    e.appendChild(el('span', null, a.status || 'idle'));
    b.appendChild(e);

    // La linea que manda: disponibilidad REAL, no el estado de maqueta.
    var r = a.real || {};
    var p = el('p', 'agente-real ' + (r.disponible ? 'sirve' : 'no-sirve'),
      r.disponible ? (L.hubDisponible + ' · ' + (r.adaptador || ''))
                   : (L.hubSinAdaptador + (r.causa ? ' · ' + r.causa : '')));
    b.appendChild(p);
    return b;
  }

  function pintaAgentes(sinCaras) {
    var s = seccion(L.hubTitulo);
    var rot = el('p', 'hub-rotulo');
    rot.appendChild(el('b', null, DATOS.estado + ' · '));
    rot.appendChild(el('span', null, L.hubMaqueta));
    s.appendChild(rot);
    var g = el('div', 'agentes');
    (DATOS.agentes || []).forEach(function (a) { g.appendChild(tarjeta(a, sinCaras)); });
    s.appendChild(g);
    raiz.replaceChild(s, raiz.firstChild);
  }

  /* --- 3 · la cola de firma · IronClaw ----------------------------------- */
  function pintaCola() {
    var c = DATOS.cola || {};
    var s = seccion(L.colaTitulo);
    s.appendChild(el('p', 'hub-rotulo', (c.estado || '') + ' · ' + (c.causa || '')));
    var props = c.propuestas || [];
    if (!props.length) { s.appendChild(el('p', 'cola-nota', L.colaVacia)); }
    props.forEach(function (p) {
      var caja = el('div', 'cola-pieza');
      caja.appendChild(el('span', 'cola-origen', p.origen + ' → ' + p.destino));
      caja.appendChild(el('p', 'cola-resumen', p.resumen));
      caja.appendChild(el('p', 'cola-cuerpo', p.cuerpo));
      // UNA firma por pieza. El protocolo IronClaw prohibe el lote: si una
      // alucinacion pasa desapercibida en un lote, contamina la reputacion
      // entera. La friccion en la ultima milla es el punto, no un descuido.
      var b = el('button', 'boton', L.colaFirmar);
      b.type = 'button';
      b.addEventListener('click', function () {
        caja.replaceChild(el('p', 'cola-nota', L.colaFirmado), b);
      });
      caja.appendChild(b);
      s.appendChild(caja);
    });
    s.appendChild(el('p', 'cola-nota', c.protocolo || L.colaProtocolo));
    raiz.appendChild(s);
  }

  /* --- 4 · el rack: maqueta y medido, a la vez --------------------------- */
  function fila(k, v) {
    var d = el('div', 'rack-dato');
    d.appendChild(el('span', 'k', k));
    d.appendChild(el('span', 'v', v === null || v === undefined ? 'NO_DATA' : v));
    return d;
  }
  function pintaRack() {
    var r = DATOS.rack || {}, m = r.mock || {}, v = r.real || {};
    var s = seccion(L.rackTitulo);
    var dos = el('div', 'rack-dos');

    var a = el('div', 'rack-col es-mock');
    a.appendChild(el('h3', null, L.rackMock));
    a.appendChild(fila(L.rackAnker, m.anker_carga_pct + ' %'));
    a.appendChild(fila(L.rackSolar, m.produccion_solar_w + ' W'));
    a.appendChild(fila(L.rackConsumo, m.consumo_rack_w + ' W'));
    dos.appendChild(a);

    // La columna de la derecha es la que se queda el dia que haya sensor.
    var b = el('div', 'rack-col es-real');
    b.appendChild(el('h3', null, L.rackReal));
    b.appendChild(fila(L.rackEra, v.era_energetica));
    b.appendChild(fila(L.rackBateria, v.bateria_presente ? L.rackSi : L.rackNo));
    b.appendChild(fila(L.rackSolar, v.produccion_solar_w));
    b.appendChild(el('p', 'rack-causa', v.causa_era || ''));
    b.appendChild(el('p', 'rack-causa', v.causa_produccion || ''));
    dos.appendChild(b);

    s.appendChild(dos);
    raiz.appendChild(s);
  }

  function falla(causa) {
    var s = seccion('—');
    s.appendChild(el('p', 'nodata', (L.hubFallo || 'NO_DATA ·') + ' ' + causa));
    raiz.replaceChild(s, raiz.firstChild);
  }

  function arranca() {
    fetch('/hub.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        DATOS = d;
        var lang = (document.documentElement.lang || 'es').slice(0, 2);
        L = (d.textos || {})[lang] || (d.textos || {}).es || {};
        if (!d.agentes || !d.agentes.length) throw new Error('catalogo sin agentes');
        var sinCaras = ligero();
        pintaAgentes(sinCaras);
        return ceder();
      })
      .then(function () { pintaCola(); return ceder(); })
      .then(function () {
        pintaRack();
        // El router necesita saber a quien se ha pulsado. Se publica el dato
        // ya leido en vez de que vuelva a pedir el mismo fichero.
        window.Hub = {
          textos: L,
          agente: function (id) {
            return (DATOS.agentes || []).filter(function (a) {
              return a.id === id;
            })[0] || null;
          }
        };
        document.dispatchEvent(new CustomEvent('hub:listo'));
      })
      .catch(function (e) { falla(e && e.message ? e.message : String(e)); });
  }

  // Nada de esto compite con la primera pintura: se pide cuando el navegador
  // dice que tiene un hueco.
  if (window.requestIdleCallback) requestIdleCallback(arranca, { timeout: 1500 });
  else setTimeout(arranca, 200);
})();
