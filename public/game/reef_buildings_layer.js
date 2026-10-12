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

   El lab lee `vectores()`, no los pixeles. Sin red, sin azar, sin reloj de pared. */
(function (raiz) {
  'use strict';
  var ESQ = 'preceptoros.edificio/1', DESGASTE = 8, PITO = { vivo: 880, naciendo: 880, gastado: 660, NO_DATA: 440 };
  var COSTE = 8, DESGASTE_VISTA = 6, MAX_VISTAS = 3;
  var ultima = null, vistos = [], vistas = [], centro = null, boton = null, rotuloBoton = '', nVistas = 0;

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
  function mira(t) {
    var tic = ciclo(), L = raiz.ReefBuildingLifecycle;
    if (!L || tic === null || !centro) { return 'NO_DATA'; }
    if (vistas.some(function (m) { return L.estado(m, tic).fase === 'naciendo'; })) { return 'mirando'; }
    var m = manifiestoVista(centro.x, centro.y, tic, ++nVistas);
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
    if (o.cam) { centro = { x: o.cam.x, y: o.cam.y }; }
    if (!L || !N || tic === null) { vistos = []; return; }
    mandos(t, L, tic);
    var casa = N.sitioCasa(o.pub, o.sha), m = manifiestoBoya(casa), dpr = o.dpr || 1;
    vistos = [];
    if (m) {
      var cu = cuidadoDe(R && R.registro ? R.registro() : []);
      if (cu !== null) { m.cuidado_tic = Math.max(cu, m.nace_tic); }
      var v = L.vector(m, tic), c = L.color(m, tic);
      vistos.push(v);
      if (ultima !== null && ultima !== v.fase) { avisa(v.fase, v, t); }
      ultima = v.fase;
      var p = P(m.col, m.fila), y = p[1] + (o.quieto ? 0 : Math.sin((o.t || 0) * 0.002) * 2 * dpr);
      var r = (5 + (v.vida === null ? 3 : v.vida * 4 / 1000)) * dpr;
      g.strokeStyle = 'rgba(155,227,255,.6)'; g.lineWidth = 1.5 * dpr;
      g.beginPath(); g.moveTo(p[0], y + r); g.lineTo(p[0], y + r + 7 * dpr); g.stroke();
      g.beginPath(); g.arc(p[0], y, r, 0, 2 * Math.PI);
      if (c.nd) { g.setLineDash([2 * dpr, 2 * dpr]); g.strokeStyle = 'rgba(150,160,180,' + c.a + ')'; g.stroke(); g.setLineDash([]); }
      else { g.globalAlpha = c.a; g.fillStyle = 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '%)'; g.fill(); g.globalAlpha = 1; g.stroke(); }
      g.lineWidth = dpr; g.fillStyle = 'rgba(155,227,255,.75)';
      g.fillText(t('boya_estado'), p[0], y - r - 4 * dpr);
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
      if (e.fase === 'NO_DATA') { return false; }
      g.strokeStyle = e.fase === 'naciendo' ? 'rgba(255,181,71,.8)' : 'rgba(155,227,255,.55)';
      if (oc && e.fase === 'naciendo') { g.setLineDash([4 * dpr, 4 * dpr]); g.beginPath(); g.moveTo(oc[0], oc[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]); }
      if (e.fase === 'gastado') { g.setLineDash([2 * dpr, 3 * dpr]); }
      g.beginPath(); g.arc(q[0], q[1], 6 * dpr, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText('Δ ' + e.edad, q[0], q[1] - 9 * dpr);
      return true;
    });
    if (oc) {
      var ult = vistas.length ? L.color(vistas[vistas.length - 1], tic) : null, rr = 9 * dpr;
      g.beginPath(); g.arc(oc[0], oc[1], rr, Math.PI, 2 * Math.PI); g.closePath();
      if (ult && !ult.nd) { g.globalAlpha = ult.a; g.fillStyle = 'hsl(' + ult.h + ' ' + ult.s + '% ' + ult.l + '%)'; g.fill(); g.globalAlpha = 1; }
      g.strokeStyle = 'rgba(155,227,255,.7)'; g.lineWidth = 1.5 * dpr; g.stroke(); g.lineWidth = dpr;
      g.fillStyle = 'rgba(155,227,255,.75)'; g.fillText(t('obs_nombre'), oc[0], oc[1] + 14 * dpr);
    }
  }
  function vectores() { return vistos.slice(); }

  raiz.AtlasArrecife = { pinta: pinta, vectores: vectores, circulos: circulos, mira: mira, manifiestoBoya: manifiestoBoya, cuidadoDe: cuidadoDe,
                         manifiestoVista: manifiestoVista, radioDe: radioDe, circulosDe: circulosDe, DESGASTE: DESGASTE, COSTE: COSTE };
})(this);
