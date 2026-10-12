/* preceptoros.org · theGame · LOS CANGREJOS EN EL MAPA (U2, «el mapa unico», contrato FIRMADO 2026-10-11).

   Tu cangrejo deja la escena lateral (retirada en U1) y vive EN el mapa, junto a tu casa: el emblema suelto que
   flotaba encima se retira, porque el cuerpo ya dice quien eres. MISMA FUNCION, MISMOS DATOS:
   - el paseo es `AtlasCangrejo.paseo()` (J1, intocable) proyectado a una linea bajo la casa:
     x = casa.x + (paseo.x - 0.5) * 2 * R, con R = 140 unidades del mundo;
   - el cuerpo, la talla, la clase y el estilo salen de `AtlasCasa.cangrejo()` (la fuente UNA);
   - movimiento reducido: quieto en su punto del ciclo.

   EL ESTADO ES LA SENAL (projectM, adherido por el Soberano el 2026-10-11: «aqui el PCM es el estado»). El
   cangrejo VIBRA al compas de su radio: la nota que suena en `AtlasRadio.guion(instantanea)` marca la frecuencia
   del temblor. Sin guion (NO_DATA), no hay musica y no hay baile: quieto. Es proyeccion de pantalla; no decide.

   LOS OTROS, CON LO QUE SE SABE DE ELLOS. Los jugadores que han llegado por sobre firmado se pintan con la misma
   funcion y SU semilla, en su casa, solo dentro de la niebla despejada. Su ciclo y su cuerpo no se miden aqui: van
   QUIETOS (ciclo 0) y con todas las partes en niebla (sin cifra), nunca con un cuerpo inventado.

   SIN CLAVE TAMBIEN SE ES CANGREJO (el contrato: «siempre visible»). El visitante no tiene casa: anda por el MAR
   ABIERTO, bajo el Faro (Hexelion), donde ya se centra la camara; no se rotula como casa, porque no lo es.

   Sombra plana bajo cada uno (una elipse, sin desenfoque). Sin red, sin azar, sin reloj con autoridad. */
(function (raiz) {
  'use strict';
  var R = 140, BAJO = 34, MAR_ABIERTO = 60, PASO_MS = 300, BASE_HZ = 220;

  /* Donde va un cangrejo en el mundo, de su casa y de su paseo (fraccion 0..1). Pura. */
  function sitio(casa, px) { return { x: casa.x + (px - 0.5) * 2 * R, y: casa.y + BAJO }; }
  /* El temblor (-1..1) en el instante ms: la nota que suena (una cada PASO_MS, como la radio) fija la frecuencia.
     Sin guion, 0: lo que no suena no mueve. Pura. */
  function vibra(guion, ms) {
    if (!guion || !guion.length) { return 0; }
    var f = guion[Math.floor(ms / PASO_MS) % guion.length] / BASE_HZ;
    return Math.round(Math.sin(ms / 1000 * 2 * Math.PI * 2 * f) * 1000) / 1000;
  }

  var AtlasMarCangrejos = { R: R, BAJO: BAJO, MAR_ABIERTO: MAR_ABIERTO, sitio: sitio, vibra: vibra };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasMarCangrejos; return; }

  /* --- en la pestana ------------------------------------------------------------------------------------- */
  var ciclo = null, t0 = 0;
  function sombra(g, x, y, r, dpr) {
    g.save(); g.globalAlpha = 0.35; g.fillStyle = '#000'; g.beginPath();
    g.ellipse(x, y + 2 * dpr, r * 1.1, r * 0.28, 0, 0, 2 * Math.PI); g.fill(); g.restore();
  }
  function uno(g, P, casa, cj, o, estilo, vivo) {
    var CJ = raiz.AtlasCangrejo, pc = CJ.paseo(cj.semilla, cj.ciclo, vivo && !o.quieto ? (o.t - t0) / 1000 : 0);
    var s = sitio(casa, pc.x), L = vivo && raiz.AtlasCangrejoLibre;
    if (L) { var d = L.paso(s, o.circ); s = { x: s.x + d.x, y: s.y + d.y }; }  /* B: el manejo libre, ENCIMA del paseo J1 */
    var p = P(s.x, s.y), r = 22 * o.dpr, fo = CJ.forma(cj.army, cj.nodo, cj.latido);
    var dy = vivo && !o.quieto ? vibra(o.guion, o.t) * r * 0.08 : 0;
    sombra(g, p[0], p[1], r * fo.escala, o.dpr);
    /* R1 (FIRMO 2026-10-12): el cangrejo en CEL SHADING (crab_render_hd.js), con la misma firma; sin el, el trazo de siempre. */
    var Tn = raiz.AtlasToon;
    (Tn ? Tn.cangrejo : CJ.pinta)(g, p[0], p[1] + dy, r, { forma: fo, cuerpo: cj.cuerpo, estilo: estilo, t: vivo ? o.t : 0, dir: pc.dir, dpr: o.dpr, quieto: o.quieto || !vivo,
      ciclo: cj.ciclo, id: vivo ? 'yo' : 'otro-' + cj.semilla });
    return p;
  }
  /* o: { pub, sha, t, dpr, quieto, circ, otros: [{ de, n }] }. Devuelve el punto de pantalla de TU cangrejo. */
  function pinta(g, P, o) {
    var CJ = raiz.AtlasCangrejo, N = raiz.AtlasNiebla, C = raiz.AtlasCasa;
    if (!CJ || !N || !C || !C.cangrejo) { return null; }
    var pon = o.pon || function (x, y, d) { d(); };  /* paso 3: con cola, cada cangrejo se pinta a su profundidad */
    (o.otros || []).forEach(function (j) {
      var c = N.sitioCasa(j.de, o.sha);
      if (!c || N.niebla(c.x, c.y, o.circ || []) > 0.5) { return; }
      pon(c.x, c.y + BAJO, function () { uno(g, P, c, { semilla: j.de, ciclo: 0, army: j.n, nodo: false, latido: null, cuerpo: CJ.cuerpo(null) }, o, null, false); });
    });
    var casa = N.sitioCasa(o.pub, o.sha) || { x: N.HEX.x, y: N.HEX.y + MAR_ABIERTO }, cj = C.cangrejo(), J = raiz.AtlasJuego, Ra = raiz.AtlasRadio, ca = C.casa ? C.casa() : {};
    if (cj.ciclo !== ciclo) { ciclo = cj.ciclo; t0 = o.t; }
    o.guion = Ra && J && J.instantanea ? Ra.guion(J.instantanea()) : null;
    var fo0 = raiz.AtlasCangrejo.forma(cj.army, cj.nodo, cj.latido);
    var dl = raiz.AtlasCangrejoLibre ? raiz.AtlasCangrejoLibre.desplazamiento() : { x: 0, y: 0 };
    pon(casa.x + dl.x, casa.y + BAJO + dl.y, function () { uno(g, P, casa, cj, o, ca.estilo, true); }, function () { return { que: 'Your crab', estado: 'army ' + cj.army + ' · cycle ' + cj.ciclo, causas: raiz.AtlasToon ? [raiz.AtlasToon.ficha(fo0.clase)] : [] }; });
    return null;
  }
  AtlasMarCangrejos.pinta = pinta;
  raiz.AtlasMarCangrejos = AtlasMarCangrejos;
})(this);
