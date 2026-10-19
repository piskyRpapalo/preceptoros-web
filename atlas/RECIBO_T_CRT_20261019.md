# RECIBO T_CRT · 2026-10-19 · chasis CRT + rueda Z sobre el mapa (§1-§4)

Encargo: Comando #15 (FIRMO del Soberano, ejecución pre-autorizada hasta PR). Rama `haiku/t-crt` sobre main `9a72d4d`.
Este lote cubre §1-§4. §8 (deploy_building, mesuras del diccionario, gramática acústica) va en un lote aparte.

## Qué se unió (no se rehízo)

- Chasis: la terminal firmada el 2026-10-12 (`terminal_menu_shell.js/.css`): barra arriba, menú a la izquierda (∿ ◷ ⌂ ⌘ ?), Radio abajo, mapa debajo.
- Fondo perpetuo: `.thegame-mapa` ya era una capa fija en z 0; ahora un ojo lo mide.
- Audio: la nota de la rueda va por `AtlasRadio.tocaNota` → `AtlasSintesis` (contexto ya existente, solo si el sonido ya está activado). Ningún `AudioContext` nuevo.
- Radio: la rueda escribe su estado con `AtlasRadioChat.dice` (fuente `z_cutoff`, sello LIVE).

## Qué se creó (declarado en el encargo como creación pura)

- `public/game/z_cutoff.js` (1.797 B): la regla de profundidad, en centésimas enteras (determinista).
- La rueda: `<input type="range">` nativo en `#crt-controls`, abajo a la derecha; paradas 1,00 / 0,50 / 0,25; rótulo vivo y `aria-valuetext`.
- `surface-slot`: el cajón y las hojas abren en todo el interior del tubo.
- `atlas/z_cutoff_casos.mjs` y `atlas/crt_surface_browser.mjs` (ojo de navegador).

## Medido

| Vara | Resultado |
|---|---|
| `python3 test_web.py` | OK (78, 1 skip) ×2 |
| `node arnes_sw.mjs` | OK ×2 (precache 174 → 175: `z_cutoff.js`) |
| `python3 atlas/test_atlas.py` | OK (183) ×2 |
| `node --test 'tests/*.test.mjs'` | 0 fallos ×2 |
| `atlas/ventana_casos.mjs` | 19/19 (5 nuevos T_CRT) |
| `atlas/hud_readings_cases.mjs` | 15/15 (1 nuevo: la rueda sobre las lecturas reales del HUD) |
| `atlas/z_cutoff_casos.mjs` | 10/10 |
| `atlas/crt_surface_browser.mjs` (Chrome, 360×716 y 1280×800) | 5 botones × 2 anchos: superficie = interior del tubo al píxel; rueda 91×45 y 113×45 px; el lienzo del mapa es el mismo nodo antes y después |
| `atlas/sin_undefined.mjs` | 26 pasos, 0 `undefined`/`NaN` |
| Puerta (`atlas/mundo.py`) | 71.277 → 72.998 B gzip (techo 153.600) |
| Piezas | `terminal_menu_shell.js` 12.946 B · `.css` 12.627 B · `z_cutoff.js` 1.797 B (techo 16.384) |
| Sello | VERSION `preceptoros-2026-17-abiy` · huella `0310f5d2bedadd06` |

## Rojo antes de verde

- Ojo de navegador, primera pasada: rojo real. A 360 px el cajón acababa en 553 px de 667 (una regla móvil `max-height:56dvh`); corregido con `max-height:none` en `surface-slot`.
- Sabotajes en copia desechable, todos en rojo: profundidad NO_DATA 0,80 → 0,50 · NO_DATA → 0,20 (caso del HUD) · MEDIDO → 0,50 · cajón sin `surface-slot` · `surface-slot` con tope de ancho · rueda de 32 px.

## Discrepancias declaradas (propuesta RC-20, entra en DISAGREEMENTS.md tras el merge de #171)

1. **Umbrales de la rueda:** §2 (paradas) y §4 (umbrales) chocan en los bordes. Regla elegida: se ve si Z ≥ profundidad (MEDIDO 0,20 · EMULADO 0,50 · NO_DATA 0,80). Cumple §2 al pie de la letra; de §4 cumple «MEDIDO jamás oculto» en todo el rango y los cortes salvo el borde exacto (NO_DATA se ve en Z = 0,80, EMULADO en Z = 0,50).
2. **Sellos sin capa en el encargo:** ERROR y las marcas de firma se tratan como MEDIDO (nunca se ocultan); STALE y DECLARADO como EMULADO; un sello desconocido, como NO_DATA.
3. **Margen visible del mapa (PR-1, 2026-10-12):** T_CRT lo supera para los paneles ABIERTOS; con todo cerrado el mapa sigue entero. `test_atlas` declara la ley nueva en su docstring y fija la regla `surface-slot`.
4. **Choque de apilado:** el precache es 175 aquí y 173 en #172/#173; quien fusione último re-sella y re-cuenta.
