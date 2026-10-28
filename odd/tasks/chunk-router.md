# CHUNK-ROUTER · el protocolo del modelo por trozos, sin pesos (autorizado 2026-10-28)

## Objetivo
El chat de /openworld/ habla con un router de modelo. El protocolo está completo; los pesos no están en el sitio.

## Alcance
- `public/game/chunk_router.js`: `planifica` (origen, tamaño y límites antes de descargar), `sha256`, `descarga`
  (solo con consentimiento; SHA-256 por trozo; `NO_DATA · cache_chunk_missing`; `chunk_hash_mismatch`), `responde`
  (`NO_DATA · model_not_installed` sin modelo).
- `/openworld/`: el formulario del chat se activa; un envío muestra la pregunta como viva y la respuesta honesta
  (`NO_DATA` con su causa). El router se carga al primer envío.
- Sin pesos en `public/`. Los pesos sintéticos de lab#104 quedan fuera hasta que exista un modelo real.

## Checklist
- [x] CR1 · planifica: sin manifiesto o sin trozos → NO_DATA; entrada mal formada → rechazada.
- [x] CR2 · sin consentimiento, cero peticiones (medido en el caso).
- [x] CR3 · trozo ausente → `cache_chunk_missing`; trozo corrupto → `chunk_hash_mismatch` (sabotaje de un byte).
- [x] CR4 · sin modelo, la respuesta es `NO_DATA`, nunca una suposición.
- [x] CR5 · navegador: enviar una pregunta muestra `NO_DATA · …` en el registro.
- [x] CR6 · sello: VERSION `preceptoros-2026-17-abkd` (abkc queda para #375).

## Registro
- 2026-10-28 · Base `origin/main` 92d4515. Rama `haiku/chunk-router-20261028`.
- 2026-10-28 · VERSION `abkd` y no `abkc`: #375 reclama `abkc`. Si #375 se fusiona primero, esta rama ya difiere de main.
- 2026-10-28 · Sin dependencia de `radio_message_log.js`: el registro del chat de la página es propio. Montar el
  `AtlasRadioChat.dice` real queda como siguiente pieza, si el Sovereign lo pide.
