(function () {
  'use strict';

  var G = null, A = null, S = null, army = null;
  var R = {}, reloj = 0, eclosionada = null, capa = null, INV = null;
  var Z = { huevos: [], cadena: null, clave: null, causa: '' };

  function T(k) { return (window.AtlasJuego && window.AtlasJuego.texto(k)) || ''; }
  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto) { var b = el('button', 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return p.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function dice(t) { R.estado.textContent = t; }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function ins() { try { return window.AtlasJuego && window.AtlasJuego.instantanea(); } catch (_) { return null; } }

  function cicloMedido(i) { var c = i && i.ciclo; return Number.isSafeInteger(c) && c >= 0 && c <= 1000000000 ? c : null; }
  function calor() { return S.calorDe(ins()); }

  var lienzo, traza, nombre, ficha, cronica;

  function eclosiona(h) {
    var t = G.tirada(h.semilla, h.tc);
    if (Z.cadena && h.seq) { Z.cadena = A.abre(Z.cadena, h.seq); A.cadenaWeb(Z.clave).pon(Z.cadena); }
    eclosionada = t;
    while (R.eclosion.firstChild) { R.eclosion.removeChild(R.eclosion.firstChild); }
    R.eclosion.hidden = false;
    var f = ficha(t, 168), cv = f.querySelector('canvas');
    R.eclosion.appendChild(el('p', 'atlas-dlg-placa', T('forjada')));
    R.eclosion.appendChild(f);
    var ul = el('ul', 'atlas-stats');
    G.STATS.forEach(function (k) { if (t.stats[k]) { ul.appendChild(el('li', null, T('st_' + k) + ' ' + t.stats[k])); } });
    R.eclosion.appendChild(ul);
    R.eclosion.appendChild(el('p', 'atlas-medido', T('huevo_rack')));
    var si = boton(T('adoptar')), no = boton(T('soltar_tropa'));
    si.addEventListener('click', function () { adopta(t, si); });
    no.addEventListener('click', function () { window.AtlasTallerUI.desintegraSuelta(t, R.eclosion); });
    var m = el('p', 'atlas-dlg-mandos'); m.appendChild(no); m.appendChild(si);
    R.eclosion.appendChild(m);
    S.suena('eclosion', calor());

    if (window.AtlasRevela) { window.AtlasRevela.muestra(t, window.AtlasTallerUI.aterriza(R.eclosion)); }
    if (quieto()) { return; }
    var k = 0;
    (function morfa() {
      k += 1;
      traza(cv, G.mezcla(G.HUEVO, t.armonicos, Math.min(1, k / 40)), t.rareza);
      if (k < 40) { requestAnimationFrame(morfa); }
    })();
  }
  function adopta(t, b) {
    b.disabled = true;
    INV.firma(A.adopcion(t, '', '')).then(function (r) {
      return army.adopta(r.obj, r.firma).then(function (u) {
        eclosionada = null; R.eclosion.hidden = true;
        S.suena('adopcion', calor());
        dice(rellena(T('adoptada'), { f: u.firma.slice(8, 20) + '…' }));
        pintaArmy();

        document.dispatchEvent(new CustomEvent('atlas:tropa'));
      });
    }).catch(function (e) {
      b.disabled = false;
      if (/sin identidad/.test(String(e && e.message))) { INV.sinIdentidad(e, function () { adopta(t, b); }); }
      else { dice(T('adopcion_no') + ' ' + (e && e.message)); }
    });
  }
  function pintaArmy() {
    while (R.army.firstChild) { R.army.removeChild(R.army.firstChild); }
    var l = army.lista();
    if (!l.length) { R.army.appendChild(el('li', 'atlas-nota', T('army_vacio'))); return; }
    window.AtlasTallerUI.casilleros(R.army, l, ficha);
  }
  function pinta() {
    var i = ins(), ciclo = cicloMedido(i), recursos = i && i.recursos;
    if (ciclo === null) { dice(T('inc_ciclo_nd')); }
    R.tcs.forEach(function (x) {
      x.b.disabled = !i || ciclo === null || !recursos || !Number.isFinite(recursos.cobre) || !Number.isFinite(recursos.luz)
        || recursos.cobre < x.c.cobre || recursos.luz < x.c.luz;
    });
    INV.pintaNido();
    if (R.cron) { cronica(R.cron, Z.cadena, Z.causa); }
  }
  function tic() {

    if (!capa || !capa.isConnected || document.hidden) { return; }
    var i = ins(), c = cicloMedido(i);
    if (c === null) { pinta(); return; }
    if (R.eclosion.hidden) {
      var listo = Z.huevos.filter(function (h) { return c >= h.hasta; })[0];
      if (listo) { Z.huevos.splice(Z.huevos.indexOf(listo), 1); eclosiona(listo); }
    }
    pinta();
  }

  function monta(c) {
    G = window.AtlasGacha; A = window.AtlasArmy; S = window.AtlasSintesis;
    var zona = document.getElementById('atlas-juego');
    if (!G || !A || !S || !window.AtlasFicha || !zona || zona.querySelector('.atlas-incubadora')) { return; }
    var F = window.AtlasFicha.crea({ G: G, A: A, S: S, T: T, el: el, boton: boton, rellena: rellena, dice: dice });
    lienzo = F.lienzo; traza = F.traza; nombre = F.nombre; ficha = F.ficha; cronica = F.cronica;
    capa = c; army = A.crea(A.verificaWeb, A.almacenWeb ? A.almacenWeb() : null);
    INV = window.AtlasInvoca.crea({ G: G, A: A, S: S, T: T, el: el, lienzo: lienzo, traza: traza, quieto: quieto,
      boton: boton, rellena: rellena, dice: dice, ins: ins, cicloMedido: cicloMedido, calor: calor, R: R, Z: Z, pinta: pinta });
    var s = el('section', 'panel atlas-incubadora');
    s.appendChild(el('h4', null, T('inc_h')));
    s.appendChild(el('p', 'atlas-nota', T('inc_nota')));
    s.appendChild(el('p', 'atlas-medido', T('vrf_nota')));
    s.appendChild(el('p', 'atlas-casa', rellena(T('provisional'), { v: G.VERSION_VALORES })));
    R.caja = el('div', 'atlas-inc-mandos');
    R.sonido = boton(T('sonido')); R.sonido.setAttribute('aria-pressed', 'false');
    var KD = window.AtlasKillswitchDot; KD && KD.monta(R.sonido);
    R.sonido.addEventListener('click', function () {
      var on = R.sonido.getAttribute('aria-pressed') !== 'true';
      on = S.activa(on); R.sonido.setAttribute('aria-pressed', String(on));
      KS && KS.pinta(on);
      if (on) { S.suena('huevo', calor()); } else { dice(T('sonido_nd')); }
    });
    R.caja.appendChild(R.sonido);
    var KS = window.AtlasKillswitchDot && window.AtlasKillswitchDot.crea({ boton: R.sonido, sintesis: S, T: T });
    KS && KS.pinta(false);

    var MODOS_CALIDAD = ['auto','maxima','media','luz'];
    R.calidadBoton = boton(T('calidad_auto'));
    R.calidadBoton.setAttribute('aria-pressed','false');
    R.calidadBoton.setAttribute('aria-label',T('calidad_desc'));
    R.calidadBoton.addEventListener('click',function(){var m=getCalidadModo(),i=(MODOS_CALIDAD.indexOf(m)+1)%4;setCalidadModo(MODOS_CALIDAD[i]);actualizaBotonCalidad();dice(rellena(T('calidad_cambiada'),{modo:T('calidad_'+MODOS_CALIDAD[i])}))});
    R.caja.appendChild(R.calidadBoton);
    function getCalidadModo(){return window.AtlasCalidad?window.AtlasCalidad.modo:'auto'}
    function getCalidadNivel(){var m=getCalidadModo();if(m==='manual')return window.AtlasCalidad?window.AtlasCalidad.nivel:2;if(m==='maxima')return 2;if(m==='media')return 1;if(m==='luz')return 0;if(window.AtlasOnda&&window.AtlasOnda.medidor){var med=window.AtlasOnda.medidor();return med.nivel(2)}return 2}
    var CAL=A&&A.calidadWeb?A.calidadWeb():null;
    function initCalidad(){var hw=navigator.hardwareConcurrency>=8&&navigator.deviceMemory>=8?'maxima':'auto';(CAL?CAL.lee():Promise.resolve(null)).then(function(m){fijaModo(MODOS_CALIDAD.indexOf(m)>=0?m:hw);actualizaBotonCalidad()})}
    function fijaModo(m){if(!window.AtlasCalidad)window.AtlasCalidad={modo:m,nivel:2};else window.AtlasCalidad.modo=m;window.AtlasCalidad.pon=function(x){setCalidadModo(x);actualizaBotonCalidad()}}
    function setCalidadModo(m){fijaModo(m);if(CAL)CAL.pon(m)}
    function actualizaBotonCalidad(){var m=getCalidadModo();R.calidadBoton.textContent=T('calidad_'+m);R.calidadBoton.setAttribute('aria-pressed',m!=='auto'?'true':'false')}
    R.tcs = Object.keys(G.TCS).map(function (tc) {
      var co = G.TCS[tc].coste;
      var b = boton(T(tc) + ' · ' + rellena(T('inc_coste'), { cobre: co.cobre, luz: co.luz }));

      var lev = G.oddsAristas(tc).reduce(function (a, x) { return a + (x[0] > 12 ? x[1] : 0); }, 0);
      b.appendChild(el('small', 'atlas-leviatan', ' · ' + rellena(T('inc_leviatan'), { p: Math.floor(lev / 10) + '.' + (lev % 10) })));
      b.id = 'invoca-' + tc;
      b.addEventListener('click', function () { INV.invoca(tc); });
      R.caja.appendChild(b);
      return { b: b, c: co };
    });
    s.appendChild(R.caja);

    var od = el('ul', 'atlas-odds');
    Object.keys(G.TCS).forEach(function (tc) {
      var o = G.odds(tc);
      od.appendChild(el('li', null, T(tc) + ' · ' + G.RAREZAS.map(function (r, i) {
        return T('rar_' + r) + ' ' + Math.floor(o[i] / 10) + '.' + (o[i] % 10) + '0%';
      }).join(' · ')));
    });
    s.appendChild(el('h5', null, T('odds_h')));
    s.appendChild(od);

    var oa = el('details', 'atlas-odds-aristas');
    oa.appendChild(el('summary', null, T('odds_aristas_h')));
    Object.keys(G.TCS).forEach(function (tc) {
      oa.appendChild(el('p', null, T(tc) + ' · ' + G.oddsAristas(tc).map(function (x) {
        return x[0] + ': ' + Math.floor(x[1] / 10) + '.' + (x[1] % 10) + '0%';
      }).join(' · ')));
    });
    s.appendChild(oa);
    R.estado = el('p', 'atlas-vivo'); R.estado.setAttribute('role', 'status'); s.appendChild(R.estado);
    s.appendChild(el('h5', null, T('nido_h')));
    R.nido = el('ul', 'atlas-nido'); s.appendChild(R.nido);
    R.cron = el('section', 'atlas-deseos'); R.cron.id = 'atlas-cronica'; R.cron.setAttribute('aria-label', T('cronica_h')); s.appendChild(R.cron);
    R.eclosion = el('div', 'atlas-eclosion'); R.eclosion.hidden = true; s.appendChild(R.eclosion);
    s.appendChild(el('h5', null, T('army_h')));
    R.army = el('ul', 'atlas-army'); s.appendChild(R.army);
    zona.appendChild(s);
    pinta(); pintaArmy();

    initCalidad();

    if (army.restaura) {
      army.restaura().then(function (r) {
        pintaArmy();
        if (r.fuera.length) { dice(rellena(T('army_fuera'), { n: r.fuera.length, m: r.fuera[0] })); }
      });
    }
    reloj = setInterval(tic, window.AtlasMotor.CICLO_MS);

    INV.cadenaLista().catch(function () {});
    document.addEventListener('preceptor:identity', function () { Z.cadena = null; INV.cadenaLista().catch(function () {}); });
  }

  window.AtlasIncubadora = { monta: monta, army: function () { return army && army.lista(); }, repinta: function () { if (R.army) { pintaArmy(); } },
    retira: function (rec, f) { return army.retira(rec, f).then(function (x) { pintaArmy(); return x; }); } };
})();
