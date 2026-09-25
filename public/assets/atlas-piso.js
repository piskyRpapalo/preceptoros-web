/* preceptoros.org · theGame · el PANEL de ATLAS, el Bosque Sumergido.

   SOLO SE ENTRA POR theGame (Soberano, 2026-09-26). Este fichero lo carga
   `thegame.js` dentro de su capa y expone `window.AtlasJuego`: monta el panel,
   lo pausa al cerrar la capa y lo reanuda al volver.

   PINTA LO QUE DICE EL MOTOR. Las cifras salen de `atlas-motor.js`, puro y
   determinista; aqui solo se dibuja y se traducen los clics en acciones.
   Un ciclo por segundo mientras la capa esta abierta y la pestana a la vista;
   con la pestana oculta el Bosque produce «mientras dormias», hasta 24 h.

   DOS SALIDAS DE RED, las dos al propio origen y al abrir: su texto
   (`atlas-<lengua>.json`) y las leyes medidas del mundo (`atlas-mundo.json`).
   Nada se guarda: v1 vive en la pestana y el sello lo dice. */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'en').slice(0, 2);
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
  /* Horas, minutos o segundos, con la unidad en la lengua de la pagina. */
  function unidad(n, u) {
    try { return new Intl.NumberFormat(lang, { style: 'unit', unit: u, unitDisplay: 'short' }).format(n); }
    catch (e) { return n + ' ' + u; }
  }
  function duracion(ciclos) {
    if (ciclos < 60) { return unidad(ciclos, 'second'); }
    var h = Math.floor(ciclos / 3600), m = Math.floor(ciclos % 3600 / 60);
    return (h ? unidad(h, 'hour') + ' ' : '') + unidad(m, 'minute');
  }

  /* --- el panel: se construye una vez y luego solo se actualiza ----------- */
  function panel() {
    var sk = TXT.skills || [];
    var raiz = el('div', 'atlas-panel atlas-piso'); raiz.id = 'atlas-piso';
    raiz.appendChild(el('p', 'atlas-lema', U('lema')));
    R.vivo = el('p', 'atlas-vivo'); R.vivo.setAttribute('aria-live', 'polite');

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
      li.appendChild(R.rec[x[0]]); rec.appendChild(li);
    });
    raiz.appendChild(rec);

    R.alerta = el('div', 'atlas-alerta'); R.alerta.setAttribute('role', 'status');
    R.alertaT = el('strong', null, U('alerta'));
    R.alertaP = el('p', null, U('alerta_p'));
    R.reparar = boton(U('reparar'));
    R.reparar.addEventListener('click', function () { dialogo(R.reparar); });
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
    R.grieta.addEventListener('click', function () { dialogo(R.grieta); });
    lienzo.appendChild(R.grieta);
    sm.appendChild(lienzo); izq.appendChild(sm);

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
    R.recoger = boton(U('recoger'));
    R.recoger.addEventListener('click', function () { actua(M.recoger(E)); });
    dor.appendChild(R.recoger); hud.appendChild(dor);

    var yoS = el('section', 'panel');
    yoS.appendChild(el('h4', null, 'Atlante-7F3A'));
    var ol = el('ol', 'atlas-skills');
    R.sk = sk.map(function (nombre) {
      var li = el('li'), s = { nombre: nombre };
      li.appendChild(el('span', null, nombre));
      s.nivel = el('b', 'nivel'); li.appendChild(s.nivel);
      s.pr = el('progress'); li.appendChild(s.pr);
      s.cifra = el('small'); s.cifra.dir = 'ltr'; li.appendChild(s.cifra);
      ol.appendChild(li); return s;
    });
    yoS.appendChild(ol); hud.appendChild(yoS);
    rej.appendChild(hud); raiz.appendChild(rej);

    var nu = el('section', 'panel atlas-nucleo');
    R.nucleoH = el('h4'); nu.appendChild(R.nucleoH);
    R.fase = el('p', 'atlas-fase'); nu.appendChild(R.fase);
    R.nucleoPr = el('progress'); nu.appendChild(R.nucleoPr);
    R.nucleoP = el('p'); nu.appendChild(R.nucleoP);
    R.desb = el('p', 'atlas-desbloqueo'); nu.appendChild(R.desb);
    nu.appendChild(el('p', 'atlas-nota', LEY.nd ? U('mundo_nd') : rellena(U('nucleo_nota'), {
      pruebas: num(MUNDO.pruebas_web), lenguas: num(MUNDO.lenguas),
      kb: num(Math.round(MUNDO.gzip_juego_b / 1024)) })));
    raiz.appendChild(nu);
    raiz.appendChild(el('p', 'atlas-pie', U('pie')));

    zona.appendChild(raiz);
    if (window.AtlasMapa) { mapa = window.AtlasMapa.monta(lienzo); }
  }

  function nivelTexto(xp) {
    var n = M.nivelDesdeXp(xp);
    return { n: n, desde: M.xpParaNivel(n), hasta: n < 99 ? M.xpParaNivel(n + 1) : xp };
  }

  function pinta() {
    R.meter.max = E.integridad_max; R.meter.value = E.integridad;
    R.meter.optimum = E.integridad_max;
    pon(R.meterD, pct(Math.round(E.integridad * 100 / E.integridad_max)));
    pon(R.rec.luz, num(E.luz) + ' / ' + num(M.LUZ_MAX));
    pon(R.rec.bio, num(E.biomasa)); pon(R.rec.flujo, pct(E.flujo));
    pon(R.rec.cobre, num(E.cobre)); pon(R.rec.o2, num(E.o2) + ' / ' + num(M.O2_MAX));

    R.alerta.classList.toggle('sellada', !E.abierta);
    pon(R.alertaT, E.abierta ? U('alerta') : rellena(U('sellada'), { s: num(E.cierre) }));
    R.alertaP.hidden = !E.abierta; R.reparar.hidden = !E.abierta; R.grieta.hidden = !E.abierta;

    var ing = M.nivelDesdeXp(E.xp[M.OFICIOS.indexOf('ingenieria')]);
    Object.keys(R.radios).forEach(function (k) {
      var r = R.radios[k];
      r.inp.checked = E.prof === k;
      r.inp.disabled = !!M.puedeBajar(E, k) && E.prof !== k;
      pon(r.nota, rellena(U(r.clave), { ing: (TXT.skills || [])[6] || '', n: num(ing) }));
    });

    var p = E.pendiente;
    pon(R.dormH, rellena(U('dormias_h'), { t: duracion(p ? p.ciclos : 0) }));
    while (R.dormUl.firstChild) { R.dormUl.removeChild(R.dormUl.firstChild); }
    if (p && p.ciclos) {
      R.dormUl.appendChild(el('li', null, '+' + num(p.biomasa) + ' 🌿 ' + U('bio')));
      R.dormUl.appendChild(el('li', null, '+' + num(p.cobre) + ' 🟠 ' + U('cobre')));
      R.dormUl.appendChild(el('li', null, '+' + num(p.xp) + ' XP'));
    } else {
      R.dormUl.appendChild(el('li', 'atlas-nota', U('dormias_vacio')));
    }
    R.recoger.disabled = !(p && p.ciclos);

    R.sk.forEach(function (s, i) {
      var t = nivelTexto(E.xp[i]);
      pon(s.nivel, t.n);
      s.pr.max = Math.max(1, t.hasta - t.desde); s.pr.value = E.xp[i] - t.desde;
      s.pr.setAttribute('aria-label', s.nombre + ': ' + num(E.xp[i]) + ' ' + U('de') + ' ' + num(t.hasta) + ' XP');
      pon(s.cifra, num(E.xp[i]) + ' / ' + num(t.hasta) + ' XP');
    });

    var total = 0; E.xp.forEach(function (x) { total += x; });
    var nn = M.nivelNucleo(E), f = M.fase(E), sig = M.siguienteFase(E);
    pon(R.nucleoH, rellena(U('nucleo_h'), { n: nn }));
    pon(R.fase, rellena(U('fase_h'), { n: f, fase: U('f' + f) }));
    var tn = nivelTexto(Math.min(total, M.XP[98]));
    R.nucleoPr.max = Math.max(1, tn.hasta - tn.desde); R.nucleoPr.value = Math.min(total, M.XP[98]) - tn.desde;
    R.nucleoPr.setAttribute('aria-label', rellena(U('nucleo_h'), { n: nn }));
    pon(R.nucleoP, rellena(U('nucleo_p'), { a: num(total) }));
    pon(R.desb, sig ? rellena(U('desbloqueo'), { n: sig.nivel, fase: U('f' + sig.fase) }) : U('fase_fin'));
    if (mapa) { mapa.fase(f); }
  }

  /* Los avisos del motor se dicen una vez, en la zona viva. */
  function actua(nuevo) {
    E = nuevo;
    var ev = E.eventos[E.eventos.length - 1];
    if (ev && ev.resultado === 'fallo' && ev.tipo === 'reparar' && E.abierta) {
      dice(rellena(U('falta_cobre'), { n: num(Math.max(0, M.COBRE_REPARAR - E.cobre)) }));
    }
    E.subidas.forEach(function (s) {
      dice(rellena(U('sube'), { oficio: (TXT.skills || [])[M.OFICIOS.indexOf(s.oficio)] || s.oficio, n: s.nivel }));
    });
    E.avisos.forEach(function (a) { dice(U(a === 'ascenso' ? 'ascenso' : 'reabre')); });
    E.subidas = []; E.avisos = [];
    pinta();
  }

  function dialogo(origen) {
    if (!window.AtlasDialogo || !E.abierta) { return; }
    window.AtlasDialogo.abre(TXT.ui, zona, origen, {
      alerta: true,
      alSellar: function () { actua(M.reparar(E)); },
      alAplazar: function () { actua(M.aplazar(E)); }
    });
  }

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
    if (document.hidden) { oculto = Date.now(); para(); return; }
    if (oculto) { actua(M.dormir(E, Math.max(0, Date.now() - oculto))); oculto = 0; }
    arranca();
  });

  function json(ruta) {
    return fetch(BASE + ruta).then(function (r) {
      if (!r.ok) { throw new Error(ruta + ' HTTP ' + r.status); }
      return r.json();
    });
  }

  window.AtlasJuego = {
    monta: function (contenedor, capa) {
      zona = contenedor; activo = true;
      return Promise.all([json('atlas-' + lang + '.json'),
        json('atlas-mundo.json').catch(function () { return null; })])
        .then(function (d) {
          TXT = d[0]; MUNDO = d[1]; LEY = M.leyes(MUNDO); E = E || M.inicial(LEY);
          var x = capa && capa.querySelector('.thegame-cerrar');
          if (x) { x.setAttribute('aria-label', U('dlg_cerrar')); }
          panel(); pinta(); arranca();
        }).catch(function (e) {
          zona.appendChild(el('p', 'no-data', 'NO_DATA · atlas-' + lang + '.json: ' + (e && e.message)));
        });
    },
    sigue: function () { activo = true; arranca(); },
    pausa: function () { activo = false; oculto = 0; para(); }
  };
})();
