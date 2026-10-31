# SPEC · MAPA JUGABLE — camino unificado (estilo Pokémon) · Decreto del Soberano · 2026-10-31

Decreto textual: «lo que tenemos hoy en la web no es para nada un mapa jugable, es solo un conjunto de imágenes. Eso de north, west… no sé qué es y debería eliminarse. Debería ser un camino unificado, como el mapa de un juego de Pokémon. Crossing-bot era la inspiración.»

## ELIMINAR

- La rejilla de brújula `#joy` con los seis botones de dirección (east / north-east / north-west / west / south-west / south-east) — `colony_controls.js mount()` pad. FUERA.
- «enter node» como botón aparte: entrar pasa a ser caminar hasta el nodo y llegar.

## CONSTRUIR (un mapa, un camino)

- El avatar del visitante VIVE en el canvas `#surface`: se dibuja de pie sobre su hex (cabin al empezar), como marco `preceptoros.bubble/1` (nada inventado, ley de frames).
- Caminar: click/tap sobre un hex vecino que tenga nodo → el avatar CAMINA el camino hasta él (frames de paso; reduced-motion = llegada en un paso). Llegar = entrar: anchor del terminal + `tutorial_walk.advance()`. Hex sin nodo: no se camina (misma causa NO_DATA que `move()` hoy).
- El camino unificado: los nodos visibles (seal LIVE o STALE) forman un camino continuo del mundo — caminas POR el mapa, no saltas con un menú. Diseño visual del camino: tu criterio con la referencia legal de abajo.
- Teclado: las flechas siguen como accesibilidad (44 px / sr-only, leyes medidas). El walker sigue efímero por visita; la elección de terminal (localStorage) se conserva.

## NÚCLEO PURO que NO cambia (leyes vivas)

- `move() / enter() / colours() / savedChoice()` de colony_controls.js — leyes puras intactas; solo cambia la INTERFAZ que las invoca.
- `tutorial_walk.js` íntegro (G4-1: D19 salto≠hecho, D20 solo lo jugado cuenta, D21 lugar vivo para caminar; ruta corta cabin→beelink→cabin).
- EU-1: al cerrar la visita, los pasos abiertos sin sitio vivo se registran saltados.
- Esquema v2 ESTABLE (openworld_state / colony_state / world_feed): CERO cambio de esquema. world_feed y sus sellos quedan como están.

## REFERENCIA LEGAL (adaptar, JAMÁS copiar)

- Station-Sciences/bot-crossing @ 8cd9d76 (MIT, Jarren Rocks): src/world (hexisland, water, reflections, parcel-physics) y tools/visual-check. Nombre y tripulación post-16-sep-2026 RESERVADOS. Meta visual: idea-final-bot-crossing.md (estudio).

## GATES del repo web (lecciones medidas esta noche — te ahorran una ronda roja)

- La batería test_web exige paridad de puros, huella SW y counters: al tocar `public/` → bump de VERSION + regenerar la cascada (mundo.py → contadores.py → huella DESPUÉS; regla protocolo-361: counters lleva reloj) o el juez dará rojo.
- CI del PR: test_web + phase + hitl (cerco de fusión). La FIRMA la sirve la Mesa en buzon#30 sobre tu cabeza EXACTA; si el PR queda behind por otro merge: ley 405 (update branch → FIRMA nueva → refire).
- Cero llamadas externas en carga; reduced-motion; a11y.
- Sello: tu pieza toma `ax` (av = claude EU-1 p1 al deploy; aw = claude chat UI).

## ENTREGABLES

1. PR propose-only sobre main (cabeza actual f048e7cf) — CÓDIGO: colony_controls.js (mount/attach rediseñados), el avatar y el camino en el canvas, tests offline nuevos para la lógica de caminar (casos sintéticos, sin red), íntegra la batería existente.
2. Recibo en buzon#30: cabeza exacta + salida de npm test + una frase de cómo quedó el movimiento.
3. FIRMA + FIRMO: la Mesa (standing «firmo todo»). Deploy: manos del Soberano (pull ff-only → wrangler → faro).

## FUERA DE ALCANCE

- El panel #chat (carril claude, sello aw) · esquema v2 · unidades (units) · edificios (la escritora de aduana es otra comisión activa, spec en aduana rama mistral/spec-escritora-edificios-20261031).
