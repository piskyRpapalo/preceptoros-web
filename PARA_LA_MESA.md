# PARA_LA_MESA · Ronda «el refresco» · theGame con gráficos renovados · 2026-10-11

Preceptor: Claude (Opus 5.5) · rama `claude/refresco` (ramas por pieza: `claude/refresco-rN-*`) · **nada empujado**: cada pieza espera tu FIRMO.
Plan: `PLAN_RONDA_REFRESCO.md` (commit `3803653`). La mesa anterior (cosecha M17) está en el historial de git.
Sellos: MEDIDO (ancla) > DECLARADO > PROPUESTA. Se actualiza tras CADA pieza.

## Delegación root (9 h)
**NO ACTIVADA.** Ninguna pieza ha necesitado sudo. El reloj de 9 h empieza con el primer comando sudo y no ha habido ninguno: no hay hora de inicio ni de caducidad que sellar. Si se activa, la hora irá aquí.

## Hecho antes de las piezas
| Paso | Resultado | Sello |
|---|---|---|
| Doctrina `juez_fuga` del stash | copiada a la nota del juez antes de tirar el stash | MEDIDO |
| Git | stash tirado · regeneraciones del 10-03 descartadas · `main` en fast-forward a `5b82c31` | MEDIDO |
| Regeneración de contadores en el árbol nuevo | n=2 idéntica a lo commiteado (sha16 `e6fc4890a1d77feb`); solo cambia la hora → **no se sella** (subir el SW por una hora fuerza recarga a todos sin cambio) | MEDIDO |
| `modelos.json` · papel `redactor` | +6 líneas, JSON válido, todas las fichas con `modelo` (lo exige `auditor.py`); **sin commit**, esperando tu vista | MEDIDO |

## Piezas
| Pieza | Qué ves | Commit | Gates | Sello |
|---|---|---|---|---|
| R1 · J6 mar de fondo | La portada es el mar: el lecho y la niebla del mapa detrás de todo, centrado en tu casa o en Hexelion; la caja del juego al 80 % deja verlo | `aeae759` (`claude/refresco-r1-j6`) | n=2: test_web 75 OK · test_atlas 111 OK · arnes_sw 22/22 · 13 `*_casos` · sabotaje rojo→verde | MEDIDO · `abdv` · gzip_juego_b 80.553 |
| R2 · HOME es tu cangrejo + 3 pestañas | Ya no hay rejilla de edificios (retirada en el mismo commit): **el cangrejo es tu casa**. Caparazón = Núcleo, pinzas = Army, patas = Bosque, ojos = Faro; crecen con lo medido, bajan si baja, y en niebla si no hay cifra. Pestañas **HOME · MAP · TALLER**: la batalla, bajo el mapa; lo de la partida, plegado en el terminal J7 | `ddc4559` (`claude/refresco-r2-cangrejo`) | n=2 verdes · 3 casos nuevos del cuerpo · sabotaje (`casa-edificio` vuelve) rojo→verde | MEDIDO · `abdw` · gzip 80.462 |
| R2c · flechas = acción `mover` del piloto | Las flechas del mapa, el teclado y la IA del laboratorio usan **una sola lista** (`AtlasPiloto.DIRS`) y la misma puerta (`AtlasJuego.aplica`). La cámara decide (choca con la niebla) y no entra en la partida. El terminal J7 ofrece `mover` | `c02aee3` (`claude/refresco-r2c-mover`) | n=2 verdes · 2 casos nuevos del piloto · sabotaje 21/22→22/22 | MEDIDO · `abdx` · gzip 80.806 |

Capturas: `~/p0x/no-publicar/capturas-refresco-20261011/` (`j6_pc.png`, `j6_movil2.png`, `r2c-1.png` cangrejo en el teléfono, `r2d-1.png` en PC, `r2e-1.png` MAP), Chrome headless contra el servidor local.
Fps en el Doogee: **NO_DATA** (no lo he medido esta ronda; Acurast sigue en primer plano y no se toca).

**Desviación declarada (R2):** R2a y R2b se fundieron en una sola pieza. Retirar la rejilla sin poner el cuerpo dejaba el Bosque sin puerta. El estilo (cúpula/aguja/concha), que vestía los tejados, ahora es el festón del caparazón: es lo único que le queda, y así no sobra código muerto ni hay que migrar la casa guardada (`atlas.casa/1` no cambia).

**Pendiente de tu vista (R2c):** `atlas.accion/1` cambia (contrato público, gana `mover`). La app nodo (`~/preceptor-nodo`) lleva su propia copia de `atlas-piloto.js` fijada por sha: no la toco; cuando sincronice, la lleva su propia PR.

## Contradicciones abiertas (detalle en el plan, §1)
C1 techo 16 KiB contra la revocación D2 · C2 «ES modules» contra el patrón UMD del juego · C3 `web/bin` no existe · **C4 `contenido_v` contra `valores.version`/`packSha` (necesito tu sí o tu no antes de R5)** · C5 la mitad del lore está en `6 planes.txt`, no en ideas6oct/7oct.

## Lo que queda (en orden)
R3 tubos → R4 bioluminiscencia → R5 M18-B aristas + LOD → R6 voz por tropa (pide FIRMO expreso: toca `core.js`) → R7 radio en el mapa + anclas → R8 ceremonia. Las propuestas P9/P10/P11/P6/P-ESM/P-CHUNKS no se construyen sin tu firma.
