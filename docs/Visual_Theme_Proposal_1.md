# Visual_Theme_Proposal_1 · PROPUESTA Mistral · 2026-10-15 (noche) · rama mistral/visuales-1

Estado: **PROPUESTA — NADA aplicado sin FIRMO individual.** Sin tocar main ni lo fusionado; sin assets nuevos; cero red; piezas <16 KiB; inglés primero en UI; vocablos prohibidos ausentes. La Estrella Hexelion (dictionary.json, 43 entradas) como capa de gobernanza. Anclaje del corpus: «la interfaz no es código estático: es la sombra de la matemática» (ideas7oct:85) · apéndice F130-131 (foveado, morphing Fourier) · firma de la ley del suelo: «EL ROMBO ES LA LEY» + «PROHIBIDO fingir profundidad con parallax o sombras» (isometric_floor_projection.js:8-9).

---

## PIEZA (a) · T1 · zoom de pellizco determinista — RE-MEDIR Y CERRAR

- **Qué hay hoy (MEDIDO en el repo):** `public/game/map_zoom.js` — pellizco de dos dedos 0,6→3, rueda sin Ctrl, cada cambio anotado en `data-zoom`; Ctrl+rueda queda para el navegador. Sale de mar.js «para caber en su techo». La medida histórica del Doogee (1,00→2,75 al separar, 3,00 al máximo) vive en PARA_LA_MESA.md (recibo del 13-oct).
- **Qué propongo:** NO un cambio de código. Una RE-MEDIDA formal para cerrar T1: protocolo de medida escrito (gesto, duración, dispositivo), tablas esperadas contra lo medido, y sello de cierre en el PR. La pieza ya es determinista por diseño: «el gesto solo fija un numero» (map_zoom.js:4).
- **Doble lectura:** humano: el mapa responde igual en cada aparato, sin sorpresas. Silicio: `data-zoom` es un contrato medible; misma entrada = mismo factor (función clamp 0,6–3).
- **Coste en bytes:** 0 de código nuevo; solo el protocolo en Markdown.
- **Riesgo:** nulo (documento). **NO_DATA con causa:** la re-medida en el Doogee/beelink físico no puedo hacerla desde aquí (sin dispositivo en la sesión); la ejecuta Codex o los ojos del Soberano con el protocolo propuesto.
- **Anclaje doble:** legislación: AI Act Art. 15 (CELEX 32024R1689, exactitud y robustez — el zoom determinista es un comportamiento repetible, medible). Matemática: función continua monótona con clamp (topología del intervalo [0,6, 3]); el pellizco es zm0·(d/d0), una razón de distancias euclídeas.
- **Alineación Estrella:** D36 Sturdy Sail (Accuracy & Robustness). **PROPUESTA · PENDIENTE_FIRMO.**

## PIEZA (b) · Profundidad «3D» simulada de las ondas sobre la ley del suelo

- **Qué hay hoy (MEDIDO):** `public/game/isometric_floor_projection.js` — proyección isométrica 2:1 FIRMADA por el Soberano el 2026-10-12; orden de pintor por (col+fila), empate por col y capa. **PROHIBIDO fingir profundidad con parallax o sombras** (línea 8-9). `wave_render.js` dibuja las ondas fieles a sus armónicos Fourier, con estela y brillo aditivo.
- **Qué propongo:** profundidad de las ondas SOLO con lo que la ley permite: **orden de pintor estricto + escala viva** — la onda anclada a su rombo pinta tras el suelo, con su `huella`, y las ondas más cercanas (mayor col+fila) tapan a las lejanas. CERO parallax, CERO sombras, cero assets: es reutilizar el eje de profundidad que ya existe, no fingir uno nuevo.
- **Doble lectura:** humano: el mar gana cuerpo sin traicionar el estilo PS1/toon de la casa. Silicio: la profundidad ES el orden (col+fila) — una función de orden total verificable, no un efecto decorativo.
- **Coste en bytes estimado:** ~1,5–2,5 KiB de vanilla JS (reordenar la cola de pintado y anclar la onda al rombo).
- **Riesgo:** medio — toca el orden de pintado del mapa (pieza con recibos). Mitigación: 1 cambio por pieza, gates n=2 con sabotaje de orden (una onda pintada fuera de orden debe poner la suite roja).
- **NO_DATA con causa:** el efecto visual final en el Doogee no es medible desde esta sesión; saboteo lógico sí.
- **Anclaje doble:** legislación: AI Act Art. 50 (interacción honesta: la profundidad declarada es geométrica, no un truco perceptivo oculto). Matemática: orden parcial → orden total estable (col+fila, luego col, luego capa) — el mismo triple de orden de la ley del suelo; la onda es su serie Fourier [k, ax, ay, fase] proyectada al rombo.
- **Alineación Estrella:** A3 Careful Compass (Architectural Fitness Functions, ISO-25010). **PROPUESTA · PENDIENTE_FIRMO.**

## PIEZA (c) · La tarjeta de nodo cantada — melodía de combate por edificio

- **Qué hay hoy (MEDIDO):** `public/game/audio_feedback_manager.js` — Web Audio con estados honestos («HABILITADO» / «NO_DATA · Web Audio no disponible» / «NO_DATA · AudioContext no está en estado running»). La Radio (radio_message_log.js) escribe el estado; `semiotic_glyph.js` ya define tonos medidos («measured chord rising from 432 to 528 Hz», «NO_DATA tone with cause»).
- **Qué propongo:** cada tarjeta de nodo (reef_place_cards.js) declara su **melodía de combate** como datos: una pequeña progresión (notas, duraciones) derivada de los armónicos del edificio — lo MISMO que wave_render dibuja, pero audible. Regla de la casa extendida al oído: **lo medido suena, lo no medido calla** (sin AudioContext o sin medida: silencio con causa visible, nunca un tono de adorno).
- **Doble lectura:** humano: el mundo se escucha como se ve — un edificio suena a su forma. Silicio: cada melodía es una función determinista de los armónicos Fourier del edificio; misma semilla = misma melodía; sin reloj de pared (duraciones en ciclos de juego o beats de Web Audio, jamás segundos de reloj).
- **Coste en bytes estimado:** ~2–3 KiB (síntesis con osciladores de Web Audio, sin assets; los tonos ya existen en semiotic_glyph.js).
- **Riesgo:** bajo-medio: audio ya está montado con estados honestos; lo nuevo es solo el mapeo edificio→progresión. Sabotaje: un edificio sin armónicos medidos debe producir NO_DATA audible-visible, jamás un sonido inventado.
- **NO_DATA con causa:** qué edificio tiene qué armónicos exactos se leerá del atlas en ejecución; aquí no los invento. La mezcla final (volúmenes) es decisión de oído del Soberano.
- **Anclaje doble:** legislación: AI Act Art. 50 + EAA (European Accessibility Act, CELEX 32019R0882 — el mundo audible de los cercos). Matemática: progresión armónica derivada de la serie de Fourier del edificio (F130-131; HRTF del corpus para la posición del nodo — techo de referencia, NO_DATA aquí sin fichero).
- **Alineación Estrella:** C32 Senses Compass (Multimodal Sensory Primitives, W3C-WCAG-2.1-Contrast, Peirce-Triadic-Semiotics). **PROPUESTA · PENDIENTE_FIRMO.**

## Resumen para firma (una a una)

| Pieza | Qué | Bytes | Riesgo | Recomendación |
|---|---|---|---|---|
| (a) T1 zoom | Protocolo de re-medida y cierre | 0 código | Nulo | Sí — cierra deuda vieja |
| (b) profundidad ondas | Orden de pintor + escala viva, sin parallax/sombras | ~2 KiB | Medio | Sí, tras (a) |
| (c) tarjeta cantada | Melodía determinista por edificio, lo medido suena | ~2–3 KiB | Bajo-medio | Sí, tras (b) |

Orden propuesto: (a) → (b) → (c). Cada una con gates n=2 + sabotaje y su FIRMO marcado antes de aplicarse.

## NO_DATA con causa (nada inventado)

- Re-medida física del Doogee: sin dispositivo en esta sesión — Codex u ojos del Soberano.
- HRTF por posición del nodo: anclado al corpus (F130-131) pero sin fichero en el repo; queda declarado, no usado.
- Armónicos exactos por edificio: se leen del atlas en ejecución; esta propuesta define la FUNCIÓN, no los datos.
- projectM y el estudio J-SN de 455 KB: techo de referencia del corpus (papeles del rack), citados, no presentes en el repo.
