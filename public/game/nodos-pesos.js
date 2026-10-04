/* preceptoros.org · theGame · los PESOS del equilibrio entre nodos. SOLO DATOS.

   ESTADO: PROPUESTA del orquestador (2026-10-04), redactada por el agente web. Ningun numero de
   aqui esta firmado: `firma` es null y la pantalla lo dice. El dia que el Soberano lo firme se
   cambia `estado`, se pone la firma y se sube `version`; la logica (`nodos.js`) no cambia.

   COMO SE LEE. Cada nodo tiene ejes de su cedula (`nodos-cedulas.js`). Un eje se pasa a un NIVEL
   (0..4) contando cuantos `escalones` supera su valor: una escalera, no una curva, para que se
   compruebe a mano. Cada eje manda en sus rasgos con una TABLA de cinco filas, una por nivel; la
   fila 2 es la `base`. Un eje NO_DATA no tiene nivel: es NIEBLA y el nodo lucha con la base.

   EL HARDWARE MODESTO ES PERSONAJE, NO CASTIGO. Las tablas cambian una cosa por otra a producto
   casi constante: la memoria da vida y quita velocidad (vida x velocidad ~ 30 000), y la
   generacion da ataque y quita esquiva (dano util / (1 - esquiva) ~ constante). El EQUILIBRIO no
   se declara aqui: lo MIDE `atlas/nodos_casos.mjs` simulando cada pareja de perfiles, con la banda
   fija en la prueba y no en estos datos. */
(function (raiz) {
  'use strict';

  var PESOS = {
    esquema: 'atlas.pesos_nodos/1',
    estado: 'PROPUESTA',
    propone: 'orquestador',
    redacta: 'agente-web',
    version: 'propuesta-2026-10-04.1',
    firma: null,
    ejes: {
      /* RAM total en MiB: 4, 8, 16 y 32 GiB. */
      ram_mib: { escalones: [4096, 8192, 16384, 32768],
                 rasgos: { vida: [240, 270, 300, 330, 360], velocidad: [125, 111, 100, 91, 83] } },
      /* Generacion en centesimas de token por segundo con el MISMO modelo: 5, 10, 20 y 40 tok/s. */
      gen_cps: { escalones: [500, 1000, 2000, 4000],
                 rasgos: { ataque: [24, 27, 30, 33, 36], esquiva_pm: [462, 381, 300, 219, 138] } }
    },
    base: { vida: 300, ataque: 30, armadura: 6, velocidad: 100, esquiva_pm: 300 },
    /* Ticks enteros: cada tick suma `velocidad` a la carga y se actua al pasar `umbral`. */
    combate: { ticks: 900, umbral: 1000, varia_div: 1, dano_min: 1 }
  };

  if (typeof module === 'object' && module.exports) { module.exports = PESOS; }
  else { raiz.AtlasNodosPesos = PESOS; }
})(this);
