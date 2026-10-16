# Audio feedback for measured skills · PROPUESTA implementada, escucha pendiente

## Caza de duplicados y fuente reutilizada

- `public/game/aiact-art50-state-radio.js` ya define la escala pentatónica y expone `AtlasRadio.tocaNota()`; el audio pasa por `AtlasSintesis.suena()` de `public/game/core.js`. El manager llama a esas piezas, sin crear otra síntesis.
- `public/game/crab_free_move.js` ya mantiene los eventos Swim y Reach de esta pestaña. El manager recibe solo el identificador de habilidad y su cuenta; no lee ni conserva la memoria de eventos.
- La implementación Piper heredada de la app local es TTS de texto, no feedback sonoro por eventos; no se duplica aquí.
- No se encontró un `AudioFeedbackManager` previo en el camino del juego antes de crear `public/game/audio_feedback_manager.js`.

## Contrato cerrado

Entrada: `data/audio_feedback_manager.input.schema.json`, exactamente `{habilidad, eventos}`; `habilidad` es `swim|reach`, `eventos` es entero 1–400, y `additionalProperties` es `false`.

Salida: `data/audio_feedback_manager.schema.json`, exactamente `{estado, frecuencia_hz, causa}`. Faltas de síntesis o dispositivo producen `NO_DATA` con causa. Rechazos llevan causa. No hay rescate por texto ni cifras decorativas.
Antes de emitir un tono, el manager requiere `AtlasSintesis.contexto().state === "running"`; un contexto suspendido o ausente devuelve `NO_DATA` con causa en vez de informar `SONADO`.

## Punto de conexión y conducta

El botón voluntario y su estado accesible viven en el panel Skills de `public/game/crab_free_move.js`. `anota()` llama al manager solo después de un evento real, y solo si la persona habilitó audio. `public/assets/thegame.js` carga el manager antes de ese módulo; `public/sw-listas.js` lo incluye en el precache del juego. La radio y el núcleo ya se cargan antes de ARENA.

Los contadores Swim/Reach son monotónicos durante esta pestaña. La lista de detalle conserva como máximo 400 filas y elimina las antiguas; la entrada de audio se limita al máximo contractual de 400.

La nota deriva del nivel existente `floor(sqrt(eventos))`; Reach suma dos grados y la octava es `floor(nivel/5)`. Esto es una elección de diseño **PROPUESTA** hasta la revisión auditiva. Apagar el control corta nuevos tonos; no se escriben preferencias ni eventos.

## Límites de evidencia

**MEDIDO en código:** el camino usa Web Audio local, el botón exige gesto y el manager no contiene red ni persistencia.

**NO_DATA:** la percepción audible y la accesibilidad sonora no se han verificado con navegador, altavoz ni persona. `SONADO` significa que `AtlasSintesis.suena()` programó osciladores locales y devolvió una receta; no certifica que el hardware produjera sonido audible.

## Gate determinista local · MEDIDO · 2026-10-15

`node atlas/audio_feedback_manager_casos.mjs` pasó los seis casos: contratos cerrados, silencio antes del opt-in, rechazo de entrada inválida, reuso de Radio/pentatónica, `NO_DATA` por audio ausente o suspendido, y apagado sin tonos posteriores. La prueba de integración `python3 -m unittest atlas.test_atlas.RadioDelEstado.test_audio_feedback_manager_contrato_y_ruta_local -q` pasó y comprueba también que el cargador incluye el manager antes de `crab_free_move.js`. `git diff --check` pasó. El módulo público mide 3.869 bytes, bajo el techo de 16.384.

Este gate usa dobles locales: no abre navegador ni llama hardware. El sonido audible sigue `NO_DATA`. SHA-256 en este gate: manager `65b410e5548e47b5b135c57238818341ffd5bd1dd52393222e5b475669cb7dd6`; schema entrada `05cfff9fcda3936f430609525cd73700779c6cbd81f8afafdef5ffdc28eca4f8`; schema salida `bb0b0b043fceb2ae4984c1a24336f201fb27c5478b6e561da617100666689562`; casos `bff15a63a3f3a1b45a01b98982311bd75519e2b01afc960addc3acc65044b7b6`.
