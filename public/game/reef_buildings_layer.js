/* preceptoros.org · theGame · LOS EDIFICIOS DEL ARRECIFE, pintados en el mapa (los 9 objetos, FIRMO 2026-10-12).

   Capa aparte (como `mar-anclas.js`): `mar.js` esta a ~1 KB de su techo y solo la llama. El TIEMPO de cada
   edificio sale de `reef_building_lifecycle.js` (puro: manifiesto + tic); aqui solo se pinta y se avisa. Los textos
   viven en `atlas-arena-<lengua>.json` (la familia del mapa, a demanda).

   1 · LA BOYA DEL ESTADO: flota junto a tu casa y dice si tu mundo esta MEDIDO. Su «cuidado» es la ultima noticia
   LIVE de la Radio (el chat de abajo): sin noticias se despinta a 8 por mil cada ciclo y cae a NO_DATA justo despues
   de que el chat las marque STALE (120 ciclos). Un solo reloj. Color ∇C, tamano = vida medida (Escala Viva).
   Al cambiar de fase, PITIDO ADSR corto (J-SN-14, solo con el sonido encendido) y burbuja en el chat con su sello.

   2 · EL OBSERVATORIO: junto a tu casa. «Mirar» apunta al centro de la pantalla y CUESTA TICS: durante COSTE ciclos
   el observatorio mira y no se ve nada (fase «naciendo»). Luego despeja la niebla alli (los circulos de
   `fog_of_war.js`, los mismos que despeja lo medido) y LO VISTO ENVEJECE: el radio baja por tramos de vida
   (no en continuo: cada tramo vacia la cache de niebla una vez, no cada cuadro), STALE al gastarse, y al llegar
   a NO_DATA la niebla vuelve. Lo visto vive en esta pestana: se olvida al recargar (no se persiste sin firma).

   3 · EL ARRECIFE DE LAS LAPIDAS («lo desintegrado se recuerda», BIBLIA_THEGAME:57,60): todo edificio o mirada que cae
   a NO_DATA deja un RECIBO LEGIBLE: que era, cuando nacio y murio (en ciclos), por que, y la huella FNV-1a de su ultimo
   vector (una suma de comprobacion determinista, NO una firma). Se leen en su panel del cajon (el menu lo descubre
   solo) y se ven como piedras sobre tu casa. Como lo visto, viven en la pestana: persistirlas espera firma.

   El lab lee `vectores()` y `lapidas()`, no los pixeles. Sin red, sin azar, sin reloj de pared. */
(function (raiz) {
  'use strict';
  var ESQ = 'preceptoros.edificio/1', DESGASTE = 8, PITO = { vivo: 880, naciendo: 880, gastado: 660, NO_DATA: 440 };
  var COSTE = 8, DESGASTE_VISTA = 6, MAX_VISTAS = 3;
  var ultima = null, vistos = [], vistas = [], centro = null, boton = null, rotuloBoton = '', nVistas = 0;
  var MAX_LAPIDAS = 20, lapidas = [], panel = null, pintadas = -1, ultVec = {}, tUlt = function (k) { return k; };

  /* FNV-1a de 32 bits sobre el texto: la misma entrada, la misma huella, en cualquier aparato. */
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  /* El recibo de lo que cayo: puro (manifiesto, tic de la caida, causa, ultimo vector vivo). */
  function recibo(m, tic, causa, ultimo) {
    return { id: m.id, tipo: m.tipo, nace: m.nace_tic, muere: tic, edad: tic - m.nace_tic, causa: causa || 'NO_DATA', huella: fnv(JSON.stringify(ultimo || null)) };
  }
  function entierra(r, t) {
    lapidas.push(r); if (lapidas.length > MAX_LAPIDAS) { lapidas.shift(); }
    di(t, 'lap_nombre', 'lapidas', 'NO_DATA · ' + r.id + ' · ↻' + r.muere + ' · ' + r.huella, 'NO_DATA');
  }
  /* PIEZA DE AMOR 4 (lote 3): la tropa DISUELTA en el Taller deja su lapida con el recibo `atlas.taller/1` que ya se
     firmo. La adopcion no guarda su ciclo de nacimiento (db.js no lo firma, a proposito): «born» es NO_DATA, no se inventa. */
  function entierraTropa(rec) {
    var tic = ciclo();
    if (!rec || rec.op !== 'desintegra') { return null; }
    var r = { id: 'troop-' + String(rec.semilla).slice(0, 8), tipo: 'troop ' + rec.tc, nace: null, muere: tic, edad: null,
              causa: 'dissolved in the workshop · +' + rec.gramos + ' g', huella: fnv(JSON.stringify(rec)) };
    entierra(r, tUlt); pintadas = -1;
    return r;
  }
  /* El panel del cajon: lo crea una vez; el menu (terminal_menu_shell.js) lo descubre y le da su entrada. */
  function lee(t) {
    var D = raiz.document, caja = D && D.getElementById('thegame-terminal');
    if (!caja) { return; }
    if (!panel || !panel.isConnected) {
      panel = D.createElement('details'); panel.className = 'thegame-pliego'; panel.id = 'pliego-lapidas'; panel.open = true;
      var s = D.createElement('summary'); s.textContent = t('lap_nombre'); panel.appendChild(s);
      panel.appendChild(D.createElement('ol')); caja.appendChild(panel); pintadas = -1;
    }
    if (pintadas === lapidas.length) { return; }
    var ol = panel.querySelector('ol'); ol.textContent = ''; pintadas = lapidas.length;
    if (!lapidas.length) { var v = D.createElement('li'); v.textContent = t('lap_vacio'); ol.appendChild(v); return; }
    lapidas.slice().reverse().forEach(function (r) {
      var li = D.createElement('li'); li.className = 'lapida';
      li.textContent = (t('lap_recibo') || '').replace(/\{(\w+)\}/g, function (x, k) { return !(k in r) ? x : (r[k] === null ? 'NO_DATA' : r[k]); });
      li.dataset.id = r.id; li.dataset.tipo = r.tipo; li.dataset.nace = r.nace; li.dataset.muere = r.muere; li.dataset.huella = r.huella;
      ol.appendChild(li);
    });
  }

  /* El manifiesto de la boya: anclado a tu casa (entero, determinista). Sin casa medida, no hay boya. Boya en (+100, -100) y
     observatorio en (-100, +100): en el rombo caen a la MISMA altura que la casa, a cada lado, lejos de las anclas
     (cuerpo y prisma, a +60 en pantalla). Medido en el Doogee: a (+70, -50) los rotulos se pisaban. */
  function manifiestoBoya(casa) {
    if (!casa) { return null; }
    return { esquema: ESQ, id: 'boya-estado', tipo: 'boya', col: Math.round(casa.x + 100), fila: Math.round(casa.y - 100),
             huella: 1, nace_tic: 0, madura_tics: 3, desgaste_por_tic: DESGASTE, carga: 300, escudo: 0, emboscable: false };
  }
  /* El ultimo ciclo con una noticia LIVE (o que lo fue y ya es STALE) en la Radio. Sin ninguna: null (no se inventa). */
  function cuidadoDe(registro) {
    var c = null;
    (registro || []).forEach(function (m) { if ((m.sello === 'LIVE' || m.sello === 'STALE') && (c === null || m.ciclo > c)) { c = m.ciclo; } });
    return c;
  }
  /* Una mirada del observatorio: nace al pulsar, madura en COSTE ciclos (lo que cuesta mirar) y se despinta. */
  function manifiestoVista(x, y, tic, n) {
    return { esquema: ESQ, id: 'vista-' + n, tipo: 'observatorio', col: Math.round(x), fila: Math.round(y), huella: 1,
             nace_tic: tic, madura_tics: COSTE, desgaste_por_tic: DESGASTE_VISTA, carga: 600, escudo: 0, emboscable: false };
  }
  /* El radio de lo visto, por TRAMOS de vida: 0 mientras mira o si ya es NO_DATA; 160..280 en cuatro escalones. */
  function radioDe(e) { return e.fase === 'NO_DATA' || e.fase === 'naciendo' ? 0 : 160 + 40 * Math.min(3, Math.floor(e.vida / 250)); }
  /* Los circulos que despeja lo visto en el tic t (puro: mismas vistas y tic, mismos circulos). */
  function circulosDe(lista, tic, L) {
    var c = [];
    if (!L || tic === null) { return c; }
    lista.forEach(function (m) { var r = radioDe(L.estado(m, tic)); if (r) { c.push({ x: m.col, y: m.fila, r: r, que: m.id }); } });
    return c;
  }
  function ciclo() { var J = raiz.AtlasJuego, i = J && J.instantanea ? J.instantanea() : null; return i && typeof i.ciclo === 'number' ? i.ciclo : null; }
  function circulos() { return circulosDe(vistas, ciclo(), raiz.ReefBuildingLifecycle); }

  function pita(fase) {
    var S = raiz.AtlasSintesis, f = PITO[fase];
    if (S && S.suena && f) { S.suena({ tipo: 'onda', portadora: f, moduladora: f, indice: 0, dur: 0.06, gan: 0.05, adsr: [0.005, 0.02, 0.4, 0.02] }); }
  }
  function di(t, quien, fuente, texto, sello) {
    var R = raiz.AtlasRadioChat;
    if (R && R.dice) { R.dice({ quien: t(quien), fuente: fuente, texto: texto, sello: sello }); }
  }
  function avisa(fase, v, t) {
    pita(fase);
    var F = (t('boya_fases') || '').split('|'), i = ['naciendo', 'vivo', 'gastado'].indexOf(fase);
    di(t, 'boya_estado', 'boya', fase === 'NO_DATA' ? 'NO_DATA · ' + (v.causa || '') : (F[i] || fase) + ' · ∇C ' + (v.hsl || []).join('/'), fase === 'NO_DATA' ? 'NO_DATA' : 'LIVE');
  }
  /* Mirar: al centro de la pantalla, si no se esta mirando ya. Devuelve la vista o la causa por la que no. */
  function mira(t, objetivo) {
    var tic = ciclo(), L = raiz.ReefBuildingLifecycle;
    var sitio = objetivo || centro;
    if (!L || tic === null || !sitio || !Number.isFinite(sitio.x) || !Number.isFinite(sitio.y)) { return 'NO_DATA'; }
    if (vistas.some(function (m) { return L.estado(m, tic).fase === 'naciendo'; })) { return 'mirando'; }
    var m = manifiestoVista(sitio.x, sitio.y, tic, ++nVistas);
    m.fase0 = 'naciendo'; vistas.push(m);
    if (vistas.length > MAX_VISTAS) { vistas.shift(); }
    di(t, 'obs_nombre', 'observatorio', (t('obs_fases') || '').split('|')[0] + ' · ' + COSTE + ' ↻', 'LIVE');
    return m;
  }
  /* El boton, junto a las flechas del mapa; su rotulo dice cuantos ciclos le quedan a la mirada en curso. */
  function mandos(t, L, tic) {
    var caja = raiz.document && raiz.document.querySelector('.mapa-mandos');
    if (!caja) { return; }
    if (!boton || !boton.isConnected) {
      boton = raiz.document.createElement('button'); boton.type = 'button'; boton.className = 'boton-sec mapa-mando'; boton.id = 'mapa-mirar';
      boton.addEventListener('click', function () { mira(t); }); caja.appendChild(boton); rotuloBoton = '';
    }
    var queda = 0;
    vistas.forEach(function (m) { if (L.estado(m, tic).fase === 'naciendo') { queda = m.nace_tic + COSTE - tic; } });
    var rot = queda ? '👁 ' + queda : '👁';
    if (rot !== rotuloBoton) {
      rotuloBoton = rot; boton.textContent = rot; boton.disabled = !!queda;
      boton.setAttribute('aria-label', (t('obs_mirar') || '').replace('{n}', queda || COSTE));
    }
  }

  /* g: contexto; P(x, y) -> pixeles; o: { pub, sha, dpr, t, quieto, texto(k), cam }. */
  function pinta(g, P, o) {
    var L = raiz.ReefBuildingLifecycle, N = raiz.AtlasNiebla, R = raiz.AtlasRadioChat, tic = ciclo();
    var t = o.texto || function (k) { return k; };
    tUlt = t;
    if (o.cam) { centro = { x: o.cam.x, y: o.cam.y }; }
    if (!L || !N || tic === null) { vistos = []; return; }
    mandos(t, L, tic); lee(t);
    var casa = N.sitioCasa(o.pub, o.sha), m = manifiestoBoya(casa), dpr = o.dpr || 1;
    var pon = o.pon || function (x, y, d) { d(); };  /* paso 3: la logica corre ya; lo PINTADO va a la cola de profundidad */
    vistos = [];
    if (m) {
      var cu = cuidadoDe(R && R.registro ? R.registro() : []);
      if (cu !== null) { m.cuidado_tic = Math.max(cu, m.nace_tic); }
      var v = L.vector(m, tic), c = L.color(m, tic);
      vistos.push(v);
      if (ultima !== null && ultima !== v.fase) { avisa(v.fase, v, t); if (v.fase === 'NO_DATA') { entierra(recibo(m, tic, v.causa, ultVec[m.id]), t); } }
      if (v.fase !== 'NO_DATA') { ultVec[m.id] = v; }
      ultima = v.fase;
      pon(m.col, m.fila, function () {
      raiz.AtlasReefPaint.boya(g,P,o,m,v,c,t,dpr);
      }, function () { return raiz.AtlasPlaceCards.ficha('boya', { que: t('boya_estado'), estado: v.fase + (v.vida === null ? '' : ' · life ' + v.vida + '/1000'), sonido: 'ADSR beep 880/660/440 Hz on phase change', causas: v.causa ? [v.causa] : [] }); });
    }
    /* El observatorio (una cupula) y lo que mira: la mirada en curso es una linea de trazos hasta el punto. */
    var oc = casa ? P(casa.x - 100, casa.y + 100) : null, F = (t('obs_fases') || '').split('|');
    vistas = vistas.filter(function (w) {
      var e = L.estado(w, tic), vw = L.vector(w, tic), q = P(w.col, w.fila);
      vistos.push(vw);
      if (e.fase !== w.fase0) {
        var i = ['naciendo', 'vivo', 'gastado', 'NO_DATA'].indexOf(e.fase);
        pita(e.fase);
        di(t, 'obs_nombre', 'observatorio', e.fase === 'NO_DATA' ? 'NO_DATA · ' + (F[3] || e.causa) : (F[i] || e.fase) + ' · Δ ' + e.edad + ' ↻', e.fase === 'gastado' ? 'STALE' : (e.fase === 'NO_DATA' ? 'NO_DATA' : 'LIVE'));
        w.fase0 = e.fase;
      }
      if (e.fase === 'NO_DATA') { entierra(recibo(w, tic, e.causa, ultVec[w.id]), t); delete ultVec[w.id]; return false; }
      ultVec[w.id] = vw;
      pon(w.col, w.fila, function () {
      g.strokeStyle = e.fase === 'naciendo' ? 'rgba(255,181,71,.8)' : 'rgba(155,227,255,.55)';
      if (oc && e.fase === 'naciendo') { g.setLineDash([4 * dpr, 4 * dpr]); g.beginPath(); g.moveTo(oc[0], oc[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]); }
      if (e.fase === 'gastado') { g.setLineDash([2 * dpr, 3 * dpr]); }
      g.beginPath(); g.arc(q[0], q[1], 6 * dpr, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText('Δ ' + e.edad, q[0], q[1] - 9 * dpr);
      }, function () { return { que: t('obs_nombre') + ' · ' + w.id, estado: e.fase + ' · Δ ' + e.edad + ' cycles', sonido: 'ADSR beep on phase change' }; });
      return true;
    });
    if (raiz.AtlasCristal) { raiz.AtlasCristal.pinta(g, P, o, casa, tic); }
    if (raiz.AtlasCorales) { raiz.AtlasCorales.pinta(g, P, o); }  /* A: los corales del rack (reef_corals.js) */  /* el cuarto: `latency_crystal.js` */
    /* Las lapidas, como piedras sobre tu casa (una por recibo, hasta nueve a la vista). */
    if (casa) { pon(casa.x - 160, casa.y - 160, function () {
      raiz.AtlasReefPaint.lapidas(g,P,casa,lapidas,t,dpr);
    }, function () { return raiz.AtlasPlaceCards.ficha('lapidas', { que: t('lap_nombre'), estado: lapidas.length + ' receipts', causas: lapidas.slice(-3).map(function (r) { return r.id + ' · ' + r.causa + ' · ' + r.huella; }) }); }); }
    if (oc) { pon(casa.x - 100, casa.y + 100, function () {
      raiz.AtlasReefPaint.observatorio(g,P,o,casa,vistas,L,tic,t,dpr,oc);
    }, function () { return raiz.AtlasPlaceCards.ficha('observatorio', { que: t('obs_nombre'), estado: vistas.length ? vistas.length + ' looks alive' : null, causas: vistas.length ? [] : ['nothing being looked at'] }, { centro: centro, coste: COSTE, mirando: vistas.some(function (w) { return L.estado(w, tic).fase === 'naciendo'; }) }); }); }
  }
  function vectores() { return vistos.slice(); }
  function registroLapidas() { return lapidas.slice(); }

  raiz.AtlasArrecife = { pinta: pinta, vectores: vectores, lapidas: registroLapidas, recibo: recibo, entierraTropa: entierraTropa, fnv: fnv, circulos: circulos, mira: mira, manifiestoBoya: manifiestoBoya, cuidadoDe: cuidadoDe,
                         manifiestoVista: manifiestoVista, radioDe: radioDe, circulosDe: circulosDe, DESGASTE: DESGASTE, COSTE: COSTE };
})(this);
