# Índice de la migración a docs/ · canon del código servido (PROPUESTA D0 · REQUIERE_FIRMA)

Ley nueva del Soberano (16-oct): en el código servido (public/*.js y public/game/*.js) no queda NI UN comentario en español — ni un comentario de ningún tipo. Lo que los comentarios documentan y es canon (fechas, cuentas de bytes, causa de cada regla) NO muere: migra a docs/, citado desde el PR. Lo que es memoria de trabajo, muere. La regla vieja de «jamás se recorta un comentario» queda INVERTIDA para este alcance por FIRMO explícito.

## Medición del terreno (hecha antes de proponer; nada inventado)

- Ficheros en alcance: 88 (public/*.js + public/game/*.js) · 10.083 líneas.
- Comentarios: 588 bloques /* */ + 27 de línea // — **151.626 B de comentario total** (~10% del código servido).
- Concentración: 63 ficheros llevan >1 KB de comentario; el top es valores.js (7.073 B), wave_render.js (4.818 B), sw.js (4.748 B), gacha.js (4.475 B).
- Excepción medida (se declara, no se recorta): los strings UI multilingües de la página sin-red de sw.js (SIN_RED es/es… ar) son DATO i18n que el worker sintetiza por lengua — no son comentarios. Se quedan y este doc es la causa.

## Índice propuesto: un doc por asunto (la unidad de la casa)

| Doc | Asunto | De dónde migra (origen medido) |
|---|---|---|
| docs/canon-laws-of-the-world.md | Leyes del motor y constantes con su causa | valores.js, core.js, canon.js, gacha.js |
| docs/canon-service-worker.md | Historia y reglas del SW (instalación, 307, medidas) | sw.js, sw-listas.js, arnes comentado |
| docs/canon-map-and-painter.md | Ley del suelo isométrica, orden de pintor, zoom | isometric_floor_projection.js, mar.js*, map_zoom.js, mar-*.js |
| docs/canon-identity-and-signatures.md | Ed25519, sobres, FIRMO, identidad de visitante | auth.js, sobres.js, mercado.js, hitl_firma.js |
| docs/canon-workflow.md | Taller: disolución, lija, residuo | taller.js, ui-taller.js, primer_eco.js |
| docs/canon-arena-and-duels.md | Arena, duelos, juez, escuadrón | arena.js, duelo.js, juez.js, escuadron.js |
| docs/canon-house.md | La casa: cangrejo, edificios, personalización | casa-*.js, crab_*.js, home_*.js, reef_*.js |
| docs/canon-nodes-and-npc.md | Nodos del rack, NPC, niebla | nodos*.js, npc_*.js, fog_of_war.js |
| docs/canon-terminal-and-radio.md | Terminal J7, radio, canales, cable al lab | aiact-art50-*.js, radio (assets), cable_*.js, nexo |
| docs/canon-saving-and-records.md | Guardado, records, replays | db.js, atlas-guardado.js, battle_replay.js |
| docs/canon-ui-and-i18n.md | Reglas UI, nueve lenguas, R-WIDGET, techos | thegame.js (cargador), ui*.js, terminal_* |
| docs/canon-summons.md | Invocación, nido, eclosión, gacha armónica | ui-invoca.js, summon_*.js, gacha.js |

Cada doc lleva: fecha de la ley, fichero:línea de origen, la causa textual del canon, y la cuenta de bytes si la regla nació de una. La memoria de trabajo («aquí se ató con X», notas de sesión) muere: no migra.

## Identificadores (D2) — measured sample

Top por frecuencia en 88 ficheros: monta (25), pinta (20), crea (9), abre/cierra/lee/dice/toca/fija… y específicos: sinRedireccion, navegacion, precachear, idiomaDe, paginaSinRed, rutasDelShell, fuera-clic, TOPE_*, accion/adopcion… La mudanza D2 exige cuidado con las puertas exportadas (window.Atlas* se llaman desde el cargador): los nombres PÚBLICOS de módulo (AtlasJuego, AtlasToon…) no se renombran en D2 salvo FIRMO aparte — son contrato consumido por tests y por el rack.

## Nombres de fichero (D3) — mapa propuesto

mar.js→sea.js · cria.js→brood.js · taller.js→workshop.js · nodos.js→nodes.js · cuenta.js→account.js · valores.js→values.js · sobres.js→envelopes.js · juez.js→judge.js · escena.js→scene.js · casa-*.js→house-*.js · arnés y sw-listas alineados en la misma pieza (sw-listas.js precachea estas rutas y atlas/test_atlas.py compara la lista con la puerta — la mudanza viaja con las listas alineadas o la suite cae, y esa es la vara).

## Plan de ejecución (3 piezas, 3 PR, apiladas sobre main)

- **D1 (comentarios→docs/):** por asunto, fichero a fichero, cada bloque clasificado canon/memoria. 63 ficheros con >1 KB. El código queda sin UN comentario.
- **D2 (identificadores):** renombrado mecánico con verificación de exports. Sin cambiar UN byte de comportamiento.
- **D3 (ficheros):** la mudanza con sw-listas + tests alineados.
- **Guardián nuevo (la ley hecha prueba):** escanea public/*.js y public/game/*.js; FALLE si hay comentario // o /* */ o español en identificador; rojo medido ANTES del verde (demostración en el PR). Excepciones declaradas en este doc (strings i18n de sw.js).

## NO_DATA con causa

- El esfuerzo exacto de D2 (número total de identificadores con tilde/ñ o español): se mide con el guardián al construirlo; aquí solo la muestra top-15 medida.
- ¿Los nombres de módulo window.Atlas* cambian?: FIRMO aparte; son contrato público consumido por el rack y los tests.

## Lista española medida (D2) — la ley por lista, no por tilde

La regex de tildes dejaba VERDES falsos (monta, pinta, crea… no llevan tilde). El guardián gatera por ESTA lista (dato vivo del doc) + tildes/ñ:

monta, pinta, crea, abre, cierra, lee, escribe, calcula, sirve, fija, dice, toca, precachear, rutasDelShell, sinRedireccion, navegacion, idiomaDe, paginaSinRed, fuera, accion, adopcion, peldano, grieta, cangrejo, arrecife, bandera, huella, ciclo, sobres, taller, mar, cria, nodos, cuenta, valores, juez, escena, casa, duelo, arena, niebla, tropa, nido, huevo

**Cifra medida (16-oct, pre-D2): 51 de 88 ficheros contienen identificador español por lista; 88 contienen comentario /* */ y 7 además comentario // (URLs en strings excluidas por sinStrings, la excepción cableada abajo).**

## Excepción de URLs (D1) — cableada, no implícita

Un `//` dentro de un literal de string (`'https://…'`) es DATO (URL), no comentario: el guardián borra los strings ANTES de buscar comentarios (función sinStrings del guardián) y retira `https?://` de la línea antes de decidir. La excepción de sw.js: SUS STRINGS i18n SIN_RED son DATO y se quedan; sus COMENTARIOS migran como los de todos — cableada con un test propio que falla si SIN_RED deja de existir (doc desalineado).
