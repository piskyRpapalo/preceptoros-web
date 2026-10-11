/* preceptoros.org · theGame · el JUEZ: cuando corriges o ignoras al piloto, ¿quién tenía razón?

   QUÉ HACE. Desde el estado EXACTO del momento de la sugerencia juega dos ramas con el mismo
   motor puro: lo que sugirió el piloto y lo que hiciste tú (o esperar, si no hiciste nada).
   Después, HORIZONTE ciclos con el piloto al mando en las dos, y compara Núcleo, fase,
   integridad mínima y XP, en ese orden. Como el motor es puro, el veredicto no es una opinión:
   cualquiera lo vuelve a jugar y sale igual. Eso enseña determinismo con la propia partida.

   UNA FUENTE, DOS USOS. `juzga` es puro y se exporta por `module.exports`: la Aduana del rack
   lo carga desde aquí para decidir qué correcciones entrenan al piloto. La pestaña y el rack no
   pueden discrepar porque no hay dos jueces, hay uno.

   LIMPIEZA (2026-10-12, firmada: «decide tú la solución honesta y repórtalo con causa»). La mitad de la
   pestaña se RETIRA: solo despertaba al responder a Suggest (retirado: su freno `capa.open` nunca dejaba
   actuar al piloto), y envolvía CADA función del motor para avisar a una voz que ya no existe. Queda lo
   puro, en la puerta del juego, para que cualquiera audite en su pestaña el MISMO juez que usa la Aduana.
   La voz del Preceptor vuelve por el Narrador de la Radio, contando la crónica real. */
(function (raiz) {
  'use strict';

  var HORIZONTE = 300, SIN_DIA = 'sin-dia';

  function aplicar(M, e, a) {
    if (a.accion === 'esperar') { return e; }
    if (a.accion === 'bajar_a') { return M.bajarA(e, a.banda, SIN_DIA); }
    if (a.accion === 'invocar') { return M.invocar(e, a.coste, SIN_DIA); }
    if (a.accion === 'recoger' || a.accion === 'reparar' || a.accion === 'aplazar') {
      return M[a.accion](e, SIN_DIA);
    }
    throw new Error('accion desconocida: ' + a.accion);
  }

  /* Una rama: la acción, y después `h` ciclos con el piloto decidiendo tras cada uno. */
  function rama(M, Pa, Pi, e0, a, ley, h) {
    var e = aplicar(M, e0, a), min = e.integridad;
    for (var i = 0; i < h; i++) {
      e = M.ciclo(e, ley);
      var p = Pi.decide(Pa.instantanea(e, M), M);
      if (Pi.valida(p) && p.accion !== 'esperar') { e = aplicar(M, e, p); }
      if (e.integridad < min) { min = e.integridad; }
    }
    var xp = 0;
    e.xp.forEach(function (x) { xp += x; });
    return { fase: M.fase(e), nucleo: M.nivelNucleo(e), integridad_min: min,
             integridad_fin: e.integridad, xp: xp };
  }

  /* Lo que importa, en orden: el Núcleo, la fase, no romperse por el camino y la XP. */
  function gana(p, h) {
    if (!h) { return 'NO_DATA'; }
    var k = ['nucleo', 'fase', 'integridad_min', 'xp'];
    for (var i = 0; i < k.length; i++) {
      if (h[k[i]] > p[k[i]]) { return 'humano'; }
      if (h[k[i]] < p[k[i]]) { return 'piloto'; }
    }
    return 'empate';
  }

  /* Una sugerencia que no cambia nada del estado es una alucinación: no hay rama que jugar. */
  function sinEfecto(M, Pa, e, a) {
    try {
      return JSON.stringify(Pa.final(aplicar(M, e, a), M)) === JSON.stringify(Pa.final(e, M));
    } catch (x) { return true; }
  }

  function juzga(M, Pa, Pi, e, sug, hum, ley, h) {
    h = h || HORIZONTE;
    var nula = sinEfecto(M, Pa, e, sug);
    var rp = nula ? null : rama(M, Pa, Pi, e, sug, ley, h);
    var rh = hum ? rama(M, Pa, Pi, e, hum, ley, h) : null;
    return { horizonte: h, piloto: rp, humano: rh, gana: rp ? gana(rp, rh) : 'NO_DATA', alucinacion: nula };
  }

  var AtlasJuez = { HORIZONTE: HORIZONTE, aplicar: aplicar, rama: rama, gana: gana, juzga: juzga,
                    sinEfecto: sinEfecto };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasJuez; return; }
  raiz.AtlasJuez = AtlasJuez;
})(this);
