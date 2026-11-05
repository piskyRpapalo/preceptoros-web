
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

      ram_mib: { escalones: [4096, 8192, 16384, 32768],
                 rasgos: { vida: [240, 270, 300, 330, 360], velocidad: [125, 111, 100, 91, 83] } },

      gen_cps: { escalones: [500, 1000, 2000, 4000],
                 rasgos: { ataque: [24, 27, 30, 33, 36], esquiva_pm: [462, 381, 300, 219, 138] } }
    },
    base: { vida: 300, ataque: 30, armadura: 6, velocidad: 100, esquiva_pm: 300 },

    combate: { ticks: 900, umbral: 1000, varia_div: 1, dano_min: 1 }
  };

  if (typeof module === 'object' && module.exports) { module.exports = PESOS; }
  else { raiz.AtlasNodosPesos = PESOS; }
})(this);
