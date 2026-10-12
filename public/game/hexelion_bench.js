/* preceptoros.org · theGame · EL PAYLOAD DE HEXELION (ronda 3, FIRMO 12-oct): las cifras del nodo con su fuente.
   Generado desde bench_20261011_resultados.json (sha256 en `fuente`). Cero fetch: lo medido viaja con el juego.
   Lo que el fichero no mide queda NO_DATA con su causa. Sin azar, sin reloj. */
(function (raiz) {
  'use strict';
  var BENCH = {
 "fuente": {
  "archivo": "bench_20261011_resultados.json",
  "sha256": "26e61fb7f56d9da3d6820ea71b39cf43c1b7454ee75d79f08e314004a74c707b",
  "fecha": "2026-10-11",
  "maquina": "soberano · Ryzen 7 255 + Radeon 780M",
  "backend": "Vulkan0 AMD Radeon 780M (RADV PHOENIX), 32193 MiB libres"
 },
 "modelos": [
  {
   "modelo": "embeddinggemma-2 Q8_0",
   "estado": "MEDIDO",
   "pp512_tok_s": 6459.63,
   "medido_en": "GPU Vulkan (ngl99)"
  },
  {
   "modelo": "LLaDA2.2-mini Q4_K_M",
   "estado": "NO_DATA",
   "causa": "llama.cpp f2cc728: unknown model architecture 'llada2' (PR abierta upstream #17454)"
  },
  {
   "modelo": "diffusiongemma-26B-A4B-it Q4_K_M",
   "estado": "NO_DATA",
   "causa": "llama.cpp f2cc728: unknown model architecture 'diffusion-gemma' (PRs abiertas upstream #24423, #24427)"
  },
  {
   "modelo": "ALoDLM-8B Q4_K_M",
   "estado": "NO_DATA",
   "causa": "el GGUF declara qwen3 (conversion autoregresiva): llama-diffusion-cli 'unsupported model for diffusion'; sin trabajo upstream"
  }
 ]
};
  var AtlasHexBench = { BENCH: BENCH, medidos: function () { return BENCH.modelos.filter(function (m) { return m.estado === 'MEDIDO'; }).length; } };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasHexBench; } else { raiz.AtlasHexBench = AtlasHexBench; }
})(this);
