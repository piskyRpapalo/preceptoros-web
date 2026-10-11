# PARA_LA_MESA · Ronda «el refresco» · theGame con gráficos renovados · 2026-10-11 · Claude (Opus 5.5)
Sello: MEDIDO (salvo lo marcado PROPUESTA) · rama `claude/refresco` (`3803653`..`HEAD`), una rama por pieza · **sin push**: cada pieza espera tu FIRMO.
1. R1 J6: el mar de fondo en la portada, con un único pintor de teselas (`mar-fondo.js`) · `aeae759`
2. R2: HOME es tu cangrejo (la rejilla de edificios se retiró), con 3 pestañas HOME · MAP · TALLER · `ddc4559`
3. R2c: las flechas del mapa son la acción `mover` del piloto (una lista, una puerta) · `c02aee3`
4. R3: tubos en CSS puro (`tubo.css`) · `e4c8644` · R4: acentos bioluminiscentes; colores-señal intactos · `0c499ea`
5. R5 M18-B: todas las TC pasan a aristas; cara de combate y cara total; ping de sonar · `c2f54d6` · 3-4 aristas 62,4-64,6 %, Leviatanes 1,4-3,6 %
6. R6: voz por tropa. **Defecto medido**: 500 tropas daban 1 sola nota; ahora 14. **Toca `core.js`: pide tu FIRMO expreso** · `885429f`
7. R7: la radio también en MAP, con anclas (tubo al rack, partes, prisma, ecos), solo vocabulario · `b052006` · R8: la ceremonia del gacha · `796e190`
Gates (último commit, n=2): test_web 75 OK (1 skip) · test_atlas 115 OK · arnes_sw 22/22 · 13 `*_casos` verdes · `node --check` 71/71 · gzip_juego_b 82.697 < 153.600 · ningún fichero > 16 KiB.
NO_DATA: fps en el Doogee (no medido: Acurast en primer plano, no se toca) · voces del navegador fuera de headless · el Army con tropas firmadas en el navegador (sin clave en headless: la vitrina se vio solo vacía).
Desvíos: R2a+R2b fundidas · `contenido_v` leído como `valores.version`/`packSha` (C4, espera tu sí o tu no) · iconos y tarjeta regenerados por M18-B · `~/p0x` sin commit (está en la rama ajena `feature/legal-map-schema-v1`).
Coste: ~600 k tokens de sesión · delegadas 0 / hechas por Opus 8 piezas · tiempo de fase ~3 h 10 min (03:50Z-07:00Z, medido por los sellos de contadores).

---

## ESTÁ LIVE · 2026-10-11 15:31Z (FIRMO del Soberano: «FIRMO LA RONDA COMPLETA»)
- PR #20 → merge `365146d` en `main`. CI `test_web`: pass. preceptoros.org sirve `preceptoros-2026-17-abed` desde las 15:31:31Z (medido con curl). Huella del SW: `520754fde9626c8e`.
- En vivo (MEDIDO): `/es/` 200 · `/en/` 200 · `mar-fondo.js`, `gacha.js`, `tubo.css` y `thegame.js` con el mismo sha256 que `main` · Chrome headless contra preceptoros.org/es/: SW activo, mar de fondo, pestañas Home|Map|Workshop, 4 partes del cangrejo, valores `provisional-2026-10-11.aristas`, cero errores de consola. Captura `live_es_cangrejo.png`.
- Regeneración (contadores/huella): `coherencia-publica.py --arbol` dice «la web publica exactamente lo que los gates miden», así que no hay diff que commitear. Los iconos ya se regeneraron dentro de R5.

## Decisiones firmadas (2026-10-11)
- **C4:** la versión del gacha es `valores.version` + `packSha`; `contenido_v` del motor solo cuando el motor cambie.
- **Tabla de aristas:** FIRMADA la cifra de R5 (con 3σ), anclada en las 16.000 tiradas.
- **Chat con el rack:** la web sigue SIN fetch y nada viaja sin la pipeline firmada; las anclas se quedan como están.
- **Ecos de superficie:** CONTRADICCIÓN declarada y **gana la doctrina**: será telemetría DECLARADA, jamás camuflada. La corrección vale contra «6 planes.txt»:175-207.
- **Techo 16 KiB** y **patrón UMD:** confirmados.
- **Dónde viven los gates (lo que el 9-oct se llamó `web/bin`):** `test_web.py` y `arnes_sw.mjs` en la raíz del repo web, `atlas/test_atlas.py`, `bin/sellar.py` (sustituye a `sw-huella.py`); `doctor.py`, `sw-huella.py` y `coherencia-publica.py` en `~/p0x/bin/`; `gate.sh` en `~/p0x/deploy/soberano/hooks/`.
- **P6, P9, P10 y P11:** FIRMADA su construcción, cada uno su PR, su test y su sabotaje, esperando FIRMO por pieza. Orden: P9 → P10 (Taller) → P6 (arena) → P11.

---

## Segunda tanda (tras la publicación) · rama `claude/refresco2` · sin push, esperando FIRMO por pieza
| Pieza | Qué ves | Commit | Gates | Sello |
|---|---|---|---|---|
| 🔴 **Arreglo: identidad en la portada** | **Defecto medido en vivo:** desde la mudanza b1, preceptoros.org no define `Identity` (falta la zona `#identity` en la plantilla de portadas) y **nadie puede crear su clave ni firmar** (invocar, adoptar, Taller, duelos). Arreglado en la plantilla y en las 10 portadas; la clave se crea y el pseudónimo sale en el cabezal. **Es lo primero que pido publicar** | `8cd0866` (`claude/refresco2-identidad`) | n=2 verdes · guarda nueva · sabotaje (quitar la zona de /es/) rojo→verde | MEDIDO · `abef` |
| P9 · Polvo de Taller | En el TALLER, cada onda dice cuánto residuo daría (1 g por arista; el Leviatán, ×3). **Desintegrar** la saca del Army solo con recibo firmado por quien la adoptó; **lijar** sube un stat, cada nivel más caro, y nunca toca las aristas. Cadena de recibos `atlas.taller/1` re-verificada al volver. Lo lijado cuenta en la práctica contra NPC; en duelos todavía no (se dice) | `6c509c7` (`claude/refresco2-p9-polvo`) | n=2 verdes · 9 casos (Ed25519 real) + contrato 1/6 · sabotaje (lijar añade aristas) 8/9→9/9 | MEDIDO · `abee` · gzip 83.112 |

| P10 · Prisma de Bandera | Eliges tu bandera en «Customize» (8 tonos cerrados: no es una huella). En el TALLER, cada onda se tiñe a tu bandera (2 g, firmado); el Army la pinta de ese tono. En el mapa, el prisma de tu casa va del color de TU bandera. Solo aspecto: el combate no lo lee | `8ee8b6f` (`claude/refresco2-p10-prisma`) | n=2 verdes · 12 casos · sabotaje (cualquier color) 11/12→12/12 | MEDIDO · `abeg` · gzip 83.176 |

| P6 · combate por escuadrones | Cada tropa lleva su **escuadrón**: pocas aristas, muchas unidades; el Leviatán es un coloso. Las unidades caen con la vida y se colocan según tu formación. El combate sigue resolviéndose por tropa (el contrato no cambia) | `08d2230` (`claude/refresco2-p6-escuadron`) | n=2 verdes · 5 casos · **96,6 % de escuadras completas pasan de 100 unidades (mediana 138)** · **198 unidades a 60 cps en headless** (Doogee NO_DATA) · sabotaje 3/5→5/5 | MEDIDO · `abeh` |

| P11 · «El Primer Eco» | Capítulo 1.5 arriba del TALLER: ping obligatorio, 3 ondas sucias, **el Navegante** enseña a desintegrar, pulir y pintar con las reglas de verdad (simulacro: nada se firma ni se guarda) y sales con tu **Insignia** (un distintivo) y tu bandera | `baed571` (`claude/refresco2-p11-eco`) | n=2 verdes · 4 casos · sabotaje (ondas limpias) 3/4→4/4 · recorrido completo en el navegador | MEDIDO · `abei` · gzip 83.009 |

**Desvío declarado (P11):** la Insignia es un **distintivo, no una tropa**. Una tropa gratis rompería la economía firmada. Si la quieres tropa, es una línea tuya.

NO_DATA (P9): ciclo completo en el navegador con una tropa firmada (pide incubar un huevo: 50 de cobre y ciclos de juego); lo cubren los casos de node con firmas Ed25519 reales.
Nota: `valores.taller` entra en `packSha`, así que los duelos exportados antes de P9 se rechazan con la causa `pack_sha` (valores PROVISIONALES).

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
| R3 · tubos | Terminal J7, pliegos, interior de la casa, entrada, ficha del lugar, pie de la revelación y «Customize» son **tubos**: curvatura en capas, tapas elípticas y fósforo solo en lo que escribe el motor. CSS puro (`tubo.css`, 3.146 B), quieto, sin imágenes | `e4c8644` (`claude/refresco-r3-tubos`) | n=2 verdes · test nuevo · sabotaje `url(` rojo→verde | MEDIDO · `abdy` · gzip 82.234 |
| R4 · bioluminiscencia | Cuatro acentos como tokens (teal, ámbar, hielo, violeta): mapa (tú en ámbar, los otros en violeta), tubos, partes del cangrejo y crestas del lecho. **Colores-señal intactos** (fijados en la prueba) | `0c499ea` (`claude/refresco-r4-bio`) | n=2 verdes · sabotaje (tono de la vida) rojo→verde | MEDIDO · `abdz` · gzip 82.312 |
| R5 · M18-B sonar de aristas + 2 caras + ping | **Todas las TC pasan a aristas** (tu opción B): la rareza sale de cuántas aristas tiene la onda; más de 12 = **Leviatán**. Tabla entera por mil publicada en el Taller. En combate se pinta la cara sencilla (sus aristas); en el Taller, la total. Revelación con ping de sonar y «N edges». Army viejo: «previous version» | `c2f54d6` (`claude/refresco-r5-aristas`) | n=2 verdes · **Gauss medida: 3-4 aristas 62,4-64,6 %, Leviatanes 1,4-3,6 %** · prometido = dibujado 16.000/16.000 · sabotaje (cola al 18,5 %) rojo→verde | MEDIDO · `abea` · gzip 82.423 |
| R6 · voz propia por tropa | **Defecto medido y arreglado:** las 500 tropas medidas sonaban a la misma nota (205 Hz). Ahora la nota sale de las aristas (pentatónica sobre 110 Hz), el color de su amplitud y la aspereza del detalle, y el Leviatán lleva segunda moduladora. Una sola receta para el oscilador y la voz exacta | `885429f` (`claude/refresco-r6-voz`) · **PENDIENTE de tu FIRMO expreso: toca `core.js`** | n=2 verdes · 14 portadoras / 91 recetas en 500 · misma huella node = navegador · sabotaje rojo→verde | MEDIDO · `abeb` |
| R7 · el mapa es el mundo | La radio suena también en MAP (mismo módulo). **Anclas**, solo vocabulario: tubo de cada nodo al rack (línea doble teal), y rombos en trazos (PROPUESTA) para partes del cuerpo, prisma y ecos de superficie. Nada envía | `b052006` (`claude/refresco-r7-mapa`) | n=2 verdes · 2 casos de anclas · sabotaje (`fetch` en anclas) rojo→verde | MEDIDO · `abec` |
| R8 · la ceremonia del gacha | Anticipación (la cápsula cae mientras la estática se sintoniza), ping, onda armónico a armónico, micro-temblor y primer timbre; vitrina del Army con stats reales y ondas que respiran; botones con squash & stretch. Todo quieto con movimiento reducido; la ceremonia no decide nada | `796e190` (`claude/refresco-r8-ceremonia`) | n=2 verdes · sabotaje (anticipación de 4 s) rojo→verde | MEDIDO · `abed` · gzip 82.697 |

Capturas: `~/p0x/no-publicar/capturas-refresco-20261011/` (`j6_pc.png`, `j6_movil2.png`, `r2c-1.png` cangrejo en el teléfono, `r2d-1.png` en PC, `r2e-1.png` MAP, `r3_terminal_tubo.png`, `r4-*.png`, `r5_leviatan_13_aristas.png`, `r5_odds_aristas.png`, `r7_anclas_tubo_rack.png`, `r8_anticipacion_capsula.png`, `live_es_cangrejo.png`, `p10_bandera_en_el_mapa.png`, `p6_escuadrones.png`, `p11_insignia.png`), Chrome headless contra el servidor local.
Fps en el Doogee: **NO_DATA** (no lo he medido esta ronda; Acurast sigue en primer plano y no se toca).

**Desviación declarada (R2):** R2a y R2b se fundieron en una sola pieza. Retirar la rejilla sin poner el cuerpo dejaba el Bosque sin puerta. El estilo (cúpula/aguja/concha), que vestía los tejados, ahora es el festón del caparazón: es lo único que le queda, y así no sobra código muerto ni hay que migrar la casa guardada (`atlas.casa/1` no cambia).

**Pendiente de tu vista (R2c):** `atlas.accion/1` cambia (contrato público, gana `mover`). La app nodo (`~/preceptor-nodo`) lleva su propia copia de `atlas-piloto.js` fijada por sha: no la toco; cuando sincronice, la lleva su propia PR.

**Rompe a propósito (R5, lo firmaste):** el espectro fijado de M18-bis (casos reescritos con semilla medida nueva, 7 aristas), **el emblema del sitio y con él el favicon, los iconos PWA y la tarjeta social** (regenerados con su herramienta F2-8; ninguna imagen nueva), los duelos exportados antes (causa `pack_sha`). La tabla exacta de aristas es PROPUESTA mía: la cifra la fijas tú.

**PROPUESTA del sitio de las pipelines (R7, a construir con su propio FIRMO):**
- *Partes del cuerpo → mapa*: el ancla `parte-cuerpo` va 60 u encima de tu casa. Cada parte del cangrejo (R2) se vería alrededor de tu casa en el mapa con su cifra. Coste M.
- *Chat con el rack*: el tubo de cada nodo al rack (`enlace-rack`) es el canal visual. El chat no abre red desde la web (doctrina: la web nunca hace fetch a IPs locales); es la app la que habla con el rack. En la web, el tubo solo enseña si hay algo esperando. Coste M, y choca con «la web nunca hace fetch»: **CONTRADICCIÓN_ABIERTA** hasta que decidas por dónde viaja.
- *EV_SURFACE_ECHO*: ancla `eco-superficie` en la boya de Hexelion. El cifrado con la clave pública del rack y el camuflaje como telemetría son exactamente lo que esta ronda **no** construye. Coste L, y necesita revisión: «camuflado como telemetría» roza la doctrina de sensores honestos (lo que se envía se dice).

## Contradicciones abiertas (detalle en el plan, §1)
C1 techo 16 KiB contra la revocación D2 · C2 «ES modules» contra el patrón UMD del juego · C3 `web/bin` no existe · **C4 `contenido_v` contra `valores.version`/`packSha` (necesito tu sí o tu no antes de R5)** · C5 la mitad del lore está en `6 planes.txt`, no en ideas6oct/7oct.

**Techo:** `mar.js` queda en 16.381 B. La siguiente pieza que lo toque tiene que partirlo antes (p. ej., el dibujo de anclas, a su propio módulo).

## Lo que queda (en orden)
R4 bioluminiscencia → Todas las piezas construibles están hechas. Las propuestas P9/P10/P11/P6/P-ESM/P-CHUNKS no se construyen sin tu firma.
