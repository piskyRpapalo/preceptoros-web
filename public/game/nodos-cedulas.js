/* preceptoros.org · theGame · las CUENTAS DE LA CASA y la cedula de su nodo. SOLO DATOS.

   UNA CUENTA = UN NODO. Cada cuenta nombra exactamente un nodo y cada nodo tiene exactamente una
   cuenta. La cedula HEREDA `preceptoros.cedula-nodo/1` (lo que exporta `nodos.py cedula` en el
   rack): sin firma, autenticidad NO_DATA y `sha256` del cuerpo; una cedula tocada sin re-sellar es
   FALLO_INTEGRIDAD. Lo que se anade es `aparato`: el dispositivo y sus medidas.

   CADA CIFRA DICE DE DONDE SALE. MEDIDO lleva `fuente` y `fecha`; EMULADO lleva la `base` de la
   que se emula y su `causa`; NO_DATA lleva `valor: null` y su causa, y en combate es NIEBLA.
   Ninguna cuenta lleva datos personales: ni serie, ni direccion, ni nombre de persona. */
(function (raiz) {
  'use strict';

  var CEDULAS = {
    esquema: 'atlas.cedulas_nodo/1',
    cuentas: [
      { cuenta: 'casa-hexelion', nodo: 'nodo.0.hexelion' },
      { cuenta: 'casa-doogee', nodo: 'nodo.1.doogee' }
    ],
    nodos: [
      { esquema: 'preceptoros.cedula-nodo/1', nodo: 'nodo.0.hexelion', admin: null, dispositivos: [],
        firma: null, autenticidad: 'NO_DATA - declaration of the rack, unsigned',
        aparato: {
          dispositivo: 'Beelink mini PC - Ryzen 7 255, Radeon 780M iGPU (Vulkan)',
          medidas: {
            ram_mib: { estado: 'MEDIDO', valor: 58980, fuente: '/proc/meminfo MemTotal on the node', fecha: '2026-10-04' },
            gen_cps: { estado: 'MEDIDO', valor: 5515, fuente: 'cerebros.json - mini (qwen3:1.7b), Vulkan 780M', fecha: '2026-09-07' }
          }
        },
        sha256: '52771571a659f3fd25c3dac21c01f0c16a51e4991538d22adfdc8ac66f25d583' },
      { esquema: 'preceptoros.cedula-nodo/1', nodo: 'nodo.1.doogee', admin: null, dispositivos: [],
        firma: null, autenticidad: 'NO_DATA - declaration of the rack, unsigned',
        aparato: {
          dispositivo: 'Doogee S110 phone - Android 13',
          medidas: {
            ram_mib: { estado: 'EMULADO', valor: 12288, base: 'declared spec: 12 GB',
                       causa: 'not measured yet: the orchestrator measures the S110 over USB' },
            gen_cps: { estado: 'NO_DATA', valor: null,
                       causa: 'qwen3:1.7b has not been timed on the S110: it fights in fog' }
          }
        },
        sha256: 'aa160bd23f177732b4eaf539cc9e7cb0bc4059bd318f22cbe8e13f3611943c7d' }
    ]
  };

  if (typeof module === 'object' && module.exports) { module.exports = CEDULAS; }
  else { raiz.AtlasNodosCedulas = CEDULAS; }
})(this);
