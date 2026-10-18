(function () {
  'use strict';

  var AL = window.AtlasLengua, lang = AL ? AL.actual : (document.documentElement.lang || 'en').slice(0, 2);
  var yo = document.currentScript;
  var BASE = (yo && yo.dataset.base) || '/';
  var M = window.AtlasMotor;

  var TXT = null, MUNDO = null, LEY = null, E = null;
  var R = {}, zona = null, mapa = null, reloj = 0, activo = false, oculto = 0;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = String(texto); }
    return n;
  }
  function U(k) { return (TXT && TXT.ui && TXT.ui[k]) || ''; }
  function num(n) {
    try { return new Intl.NumberFormat(lang).format(n); } catch (e) { return String(n); }
  }
  function pct(n) {
    try { return new Intl.NumberFormat(lang, { style: 'percent' }).format(n / 100); }
    catch (e) { return n + ' %'; }
  }
  function rellena(plantilla, v) {
    return plantilla.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; });
  }
  function boton(texto, clase) {
    var b = el('button', clase || 'boton', texto); b.type = 'button'; return b;
  }
  function pon(nodo, texto) { if (nodo.textContent !== String(texto)) { nodo.textContent = texto; } }
  function dice(texto) { if (texto) { pon(R.vivo, texto); } }

  function panel() {
    var raiz = el('div', 'atlas-panel atlas-piso'); raiz.id = 'atlas-piso';
    raiz.appendChild(el('p', 'atlas-lema', U('lema')));
    R.vivo = el('p', 'atlas-vivo');

    var cab = el('div', 'atlas-cab');
    cab.appendChild(el('h3', null, U('cab_h')));
    var integ = el('p', 'atlas-integridad');
    var lab = el('label', null, U('presion')); lab.htmlFor = 'atlas-presion';
    R.meter = el('meter'); R.meter.id = 'atlas-presion';
    R.meter.min = 0; R.meter.low = 40; R.meter.high = 75;
    R.meterD = el('data');
    integ.appendChild(lab); integ.appendChild(R.meter); integ.appendChild(R.meterD);
    cab.appendChild(integ);
    cab.appendChild(el('p', 'atlas-sello', U('sello')));
    raiz.appendChild(cab);

    var rec = el('ul', 'atlas-recursos');
    rec.setAttribute('aria-label', U('recursos_aria'));
    R.rec = {};
    [['luz', '☀️ ' + U('luz')], ['bio', '🌿 ' + U('bio')], ['flujo', '⚡ ' + U('flujo')],
     ['cobre', '🟠 ' + U('cobre')], ['o2', '🫧 ' + U('oxigeno')]].forEach(function (x) {
      var li = el('li'); if (x[0] === 'flujo') { li.title = U('flujo_t'); }
      li.appendChild(el('b', null, x[1])); R.rec[x[0]] = el('data');

      if (x[0] === 'luz' || x[0] === 'o2') { R.rec[x[0]].dir = 'ltr'; }
      li.appendChild(R.rec[x[0]]); rec.appendChild(li);
    });
    raiz.appendChild(rec);

    R.alerta = el('div', 'atlas-alerta'); R.alerta.setAttribute('role', 'status');
    R.alertaT = el('strong', null, U('alerta'));
    R.alertaP = el('p', null, U('alerta_p'));
    R.reparar = boton(U('reparar'));
    R.reparar.id = 'atlas-reparar';

    R.reparar.addEventListener('click', repara);
    R.alerta.appendChild(R.alertaT); R.alerta.appendChild(R.alertaP); R.alerta.appendChild(R.reparar);
    raiz.appendChild(R.alerta);
    raiz.appendChild(R.vivo);

    var rej = el('div', 'atlas-rejilla'), izq = el('div', 'atlas-izq');
    var sm = el('section', 'panel atlas-mapa');
    sm.appendChild(el('h4', null, U('mapa_h')));
    sm.appendChild(el('p', 'atlas-nota', U('mapa_nota')));
    var lienzo = el('div', 'atlas-lienzo');
    [['nucleo', 's_nucleo'], ['forja', 's_forja'], ['aguja', 's_aguja'], ['ojo', 's_ojo']]
      .forEach(function (x) {
        var s = el('span', 'atlas-sector', U(x[1])); s.dataset.sector = x[0];
        lienzo.appendChild(s);
      });
    R.grieta = boton('⚠ ' + U('s_grieta'), 'atlas-sector'); R.grieta.dataset.sector = 'grieta';
    R.grieta.addEventListener('click', repara);
    lienzo.appendChild(R.grieta);

    sm.appendChild(lienzo); raiz.insertBefore(sm, raiz.children[1] || null);

    var fs = el('fieldset', 'atlas-profundidad');
    fs.appendChild(el('legend', null, U('prof_leg')));
    R.radios = {};
    [['arrecife', 'b1'], ['ruinas', 'b2'], ['bosque', 'b3'], ['nucleo', 'b4']].forEach(function (x) {
      var lb = el('label'), inp = el('input'), nota = el('small');
      inp.type = 'radio'; inp.name = 'atlas-profundidad'; inp.value = x[0];
      inp.addEventListener('change', function () { baja(x[0]); });
      lb.appendChild(inp); lb.appendChild(el('span', null, U(x[1])));
      lb.appendChild(nota); fs.appendChild(lb);
      R.radios[x[0]] = { inp: inp, nota: nota, clave: x[1] + 'n' };
    });
    izq.appendChild(fs); rej.appendChild(izq);

    var hud = el('aside', 'atlas-hud'); hud.setAttribute('aria-label', U('hud_aria'));
    var dor = el('section', 'panel atlas-dormias');
    var dh = el('h4', 'atlas-dormias-h');
    if (window.AtlasDialogo) {
      var ico = window.AtlasDialogo.retrato(TXT.ui, true);
      ico.celda(window.AtlasDialogo.CELDAS.reposo);
      ico.nodo.classList.add('atlas-pre-48'); dh.appendChild(ico.nodo);
    }
    R.dormH = el('span'); dh.appendChild(R.dormH); dor.appendChild(dh);
    R.dormUl = el('ul'); dor.appendChild(R.dormUl);
    dor.appendChild(el('p', 'atlas-nota', U('dormias_nota')));
    hud.appendChild(dor);

    rej.appendChild(hud); raiz.appendChild(rej);

    var nu = el('section', 'panel atlas-nucleo');
    R.fase = el('p', 'atlas-fase'); nu.appendChild(R.fase);
    nu.appendChild(el('p', 'atlas-nota', LEY.nd ? U('mundo_nd') : rellena(U('nucleo_nota'), {
      pruebas: num(MUNDO.pruebas_web), lenguas: num(MUNDO.lenguas),
      kb: num(Math.round(MUNDO.gzip_juego_b / 1024)) })));

    if (!LEY.nd && LEY.dano > 1) { nu.appendChild(el('p', 'atlas-casa', U('casa_mal'))); }
    if (!LEY.nd) {
      nu.appendChild(el('p', 'atlas-medido', rellena(U('medido'), {
        f: MUNDO.medido_el || 'NO_DATA', m: MUNDO.maquina || 'NO_DATA' })));
    }
    raiz.appendChild(nu);
    raiz.appendChild(el('p', 'atlas-pie', U('pie')));

    zona.appendChild(raiz);
    if (window.AtlasMapa) { mapa = window.AtlasMapa.monta(lienzo); }
  }

  function pinta() {
    R.meter.max = E.integridad_max; R.meter.value = E.integridad;
    R.meter.optimum = E.integridad_max;
    pon(R.meterD, pct(Math.round(E.integridad * 100 / E.integridad_max)));
    pon(R.rec.luz, num(E.luz) + ' / ' + num(M.LUZ_MAX));
    pon(R.rec.bio, num(E.biomasa)); pon(R.rec.flujo, pct(E.flujo));
    pon(R.rec.cobre, num(E.cobre)); pon(R.rec.o2, num(E.o2) + ' / ' + num(M.O2_MAX));

    R.alerta.classList.toggle('sellada', !E.abierta);
    pon(R.alertaT, E.abierta ? U('alerta') : rellena(U('sellada'), { c: num(E.cierre) }));
    R.alertaP.hidden = !E.abierta; R.reparar.hidden = !E.abierta; R.grieta.hidden = !E.abierta;

    var ing = M.nivelDesdeXp(E.xp[M.OFICIOS.indexOf('ingenieria')]);
    Object.keys(R.radios).forEach(function (k) {
      var r = R.radios[k];
      r.inp.checked = E.prof === k;
      r.inp.disabled = !!M.puedeBajar(E, k) && E.prof !== k;
      pon(r.nota, rellena(U(r.clave), { n: num(ing) }));
    });

    pon(R.dormH, U('dormias_h'));
    if (!R.dormUl.firstChild) { R.dormUl.appendChild(el('li', 'atlas-nota', rellena(U('dormias_vacio'), { c: num(E.t) }))); }

    var f = M.fase(E);
    pon(R.fase, rellena(U('fase_h'), { n: f, fase: U('f' + f) }));
    if (mapa) { mapa.fase(f); }
  }

  function actua(nuevo) {
    E = nuevo;
    var ev = E.eventos[E.eventos.length - 1];
    if (ev && ev.resultado === 'fallo' && ev.tipo === 'reparar' && E.abierta) {
      dice(rellena(U('falta_cobre'), { n: num(Math.max(0, M.COBRE_REPARAR - E.cobre)) }));
    }
    E.avisos.forEach(function (a) { dice(U(a === 'ascenso' ? 'ascenso' : 'reabre')); });
    E.subidas = []; E.avisos = [];
    pinta();
  }

  function repara() { if (E && E.abierta) { actua(M.reparar(E)); } }
  function baja(prof) {
    actua(M.bajarA(E, prof));
    if (E.prof !== prof) { dice(U(prof === 'nucleo' ? 'b4n_no' : 'ascenso')); }
  }

  function tick() { actua(M.ciclo(E, LEY)); }
  function arranca() {
    if (!reloj && activo && !document.hidden && E) { reloj = setInterval(tick, M.CICLO_MS); }
  }
  function para() { clearInterval(reloj); reloj = 0; }

  document.addEventListener('visibilitychange', function () {
    if (!activo || !E) { return; }
    if (document.hidden) { oculto = 1; para(); return; }
    if (oculto) { oculto = 0; R.dormUl.textContent = ''; pinta(); }
    arranca();
  });

  function json(ruta) {
    return fetch(BASE + ruta).then(function (r) {
      if (!r.ok) { throw new Error(ruta + ' HTTP ' + r.status); }
      return r.json();
    });
  }

  function instantanea() { return window.AtlasPartida ? window.AtlasPartida.instantanea(E, M) : null; }

  function aplica(a) {

    if (a && a.accion === 'mover') { return window.AtlasMar && window.AtlasMar.mueve ? window.AtlasMar.mueve(a.dir) : null; }
    if (!E || !activo) { return null; }
    var f = { recoger: M.recoger, reparar: M.reparar, aplazar: M.aplazar }[a.accion];
    if (f) { actua(f(E)); } else if (a.accion === 'bajar_a') { baja(a.banda); } else { return a.accion === 'esperar' ? {} : null; }
    return E.eventos[E.eventos.length - 1];
  }

  window.AtlasJuego = {
    instantanea: instantanea, aplica: aplica,
    invoca: function (c) { if (!E || !activo) { return null; } actua(M.invocar(E, c)); return E.eventos[E.eventos.length - 1]; },
    partida: function () { return window.AtlasPartida && window.AtlasPartida.partida(E, M); },

    retoma: function (p, cada) {
      var P = window.AtlasPartida;
      E = P.retoma(p, P.puro || M, cada); LEY = P.partida(E, M).ley;
      if (R.meter) { pinta(); }
      return E;
    },
    texto: function (k) { return U(k); },
    monta: function (contenedor, capa) {
      zona = contenedor; activo = true;
      return Promise.all([json('atlas-' + lang + '.json'),
        json('atlas-mundo.json').catch(function () { return null; })])
        .then(function (d) {
          TXT = d[0]; MUNDO = d[1]; LEY = M.leyes(MUNDO); E = E || M.inicial(LEY);
          panel(); pinta(); arranca();

          if (AL && AL.pagina !== lang && U('lengua_nd')) { zona.insertBefore(el('p', 'no-data', U('lengua_nd').replace('{l}', AL.pagina)), zona.firstChild); }
        }).catch(function (e) {
          zona.appendChild(el('p', 'no-data', 'NO_DATA · atlas-' + lang + '.json: ' + (e && e.message)));
        });
    },
    sigue: function () { activo = true; arranca(); },
    pausa: function () { activo = false; oculto = 0; para(); }
  };
})();
