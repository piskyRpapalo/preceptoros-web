# Canon · La matemática del movimiento de Claude (los núcleos puros, medidos)

Los seis núcleos viven en `atlas/puros/` de ESTE repo, en main, cada uno con sus jueces `*_casos.mjs`;
lo servido en `public/game/` es su copia. Todos comparten la misma ley: **enteros, sin reloj de pared,
sin azar sin semilla, fail-closed, NO_DATA con causa.** La misma entrada da siempre el mismo resultado
en cualquier aparato.

**Frontera.** No compiten con la matemática del dibujo (ley del suelo): los fotogramas que producen
son `preceptoros.acho/1` y los valida la propia ley de Acho (`state_frames.js`). El movimiento es capa
de estado; el dibujo sigue siendo solo canon de Acho.

## 1 · La proyección — `atlas/puros/hex_projection.js`
Axial a píxeles: `x = 48·q, y = 12·q + 24·r`. Enteros seguros con guarda fail-closed: celda no entera
o fuera de rango se NIEGA, jamás se corrige.

## 2 · La ruta — `atlas/puros/walk_route.js` (W-2, W-D3)
BFS sobre los SEIS vecinos axiales en orden fijo — la misma entrada da siempre la misma ruta.
Solo se pisa un nodo cuyo sello sea LIVE o STALE; un hexágono sin nodo visible jamás está en ruta.
El paso se cuenta en FOTOGRAMAS (FRAMES = 12), jamás en milisegundos. Con movimiento reducido la
caminata llega en un paso. La pose del caminante: `{ nodo, destino, fracción 0..1 }`.

## 3 · El caminante sembrado — `atlas/puros/bench_mover.js` (BM-1)
FNV-1a sobre el texto de la semilla → mulberry32 de enteros → **la misma semilla da el mismo camino
en cualquier aparato**. Sin semilla se niega. Solo entra en nodos vivos (D7); si eligiera uno muerto,
falla cerrado.

## 4 · El mudador de decorado — `atlas/puros/decor_mover.js` (DE-1)
`MOVER(prop, destino, semilla)`: solo celdas DENTRO de la colonia medida; el fotograma del movimiento
lleva sello SIMULADO y debe pasar la ley Acho/1; el guion entero < 16.384 B.

## 5 · El tutorial como caminata — `atlas/puros/tutorial_walk.js` (G4-1)
Cada paso es un lugar; un lugar solo se camina LIVE (D21). Lo saltado queda registrado como saltado,
jamás como hecho (D19); solo lo jugado cuenta (D20). Ruta corta del Soberano (31-oct): cabaña →
beelink → cabaña; un paso sin lugar vivo se salta con NO_DATA y no bloquea la caminata.

## 6 · El catálogo isométrico — `atlas/puros/catalogo_iso.js` (IC3)
Cada fila del estado se vuelve UN fotograma Acho nacido del estado, nunca de una imagen: hexágono de
seis vértices (cinta cerrada) + onda armónica escalada por el valor MEDIDO (0-100, entero). Sin medida,
NO_DATA con causa y sin onda. Un tipo sin clave de léxico se rechaza como `orphan_visual_node`.

## 7 · El motor 3.5D — PR #563 (FIRMO del Soberano)
«3.5D = 2.5D + tiempo + elasticidad», solo render (ley P5: el render nunca decide). Es el motor
nativo del mapa: PR #563 «Motor 3.5D: suelo horneado en bitmap, edificios que respiran, burbujas
con volumen» (rama `haiku/motor-35d-20261101`, +394/−47, 12 ficheros), fusionado con FIRMO (a1a6c88a)
y servido en main (`public/game/map_painter.js`, `openworld_page.js`). Medido sobre main:
- Un ImageBitmap por (chunk, cubo de zoom, ángulo, dpr) — dos hornadas, día y noche (LIT_LO 0,62,
  mezcla por alfa); por fotograma solo blits; caché límite 14, HSTEP 7.
- Luz NO [−0,45, −0,6, 0,66]; mar {amp 2, len 5, speed 3}, crestas solo en mar abierto; con
  movimiento reducido el mar queda quieto.
- Niebla de datos: hash puro ((q·73856093 ⊕ r·19349663) >>> 0, periodo 12, α = 0,45·sen(πu)) —
  muestra el estado, jamás lo cambia.
- Órbita: hornea solo en ángulos de reposo (múltiplos de 60°); BAKE_MAX_SIDE 2048 px.
- Cada chunk es también fotograma `preceptoros.floor/1` < 1.024 B (fail-closed, throw).
- Juez `atlas/motor_35d_casos.mjs`: corrido en node el 2026-11-03, 6/6 verde (hornado, invalidación
  por zoom/ángulo/dpr, respiración, burbujas elásticas, bruma, sin azar ni reloj).
- Medible en consola del aparato: `AtlasMapPainter.cacheStats()`.

## 8 · La cadena completa (guía de O2/VIGÍA · P65 ·6616996802, corrección P66 ·6617047835)
Los hexágonos del mapa único solo cuadran vistos como cadena completa —
**celda axial → hash espacial → estado → TABLA_SEMANTICA → fotograma Acho → proyección → pantalla**:
1. Celda axial (q, r): enteras, fail-closed; seis vecinos en orden fijo; el paso se cuenta en
   fotogramas (12), jamás milisegundos (W-D3).
2. Hash espacial: `a ^ (b·73856093) ^ (c·19349663)` + finalizador xorshift (`bb_canon.js`,
   verificado contra 415 vectores) — la dirección determinista de cada hexágono.
3. Estado (Rosetta) + TABLA_SEMANTICA (canonizada 10-oct): cada sello con sus hue/sat/light/rot/
   escala/onda/pulso propios — LIVE 120/.8/.6 · PROPUESTA_PENDIENTE_FIRMA 45 · FIRMADO 270/.9/.8 ·
   ERROR 0 · NO_DATA 240/.3/.4 · SIMULATED 30 · STALE 60. Cero estética fuera de la tabla.
4. La forma es Fourier: `r(θ) = Σ aₖ·sin(kθ+φₖ)` — evaluar ecuaciones, jamás redibujar desde cero.
5. Fotograma Acho (decreto R48): 5 campos, ≤8 átomos, < 1.024 B, fail-closed.
6. Proyección: `x = 48·q, y = 12·q + 24·r` (sección 1 — el eslabón 6 de la misma cadena).
7. Cosecha: `hash(v, espectro, válvula+sel) % 100 < 40 + 3·v + 10·válvula` → PENETRATES
   (`render_combat.js:64-65`; motor puro `combate_ticks.js`, esquema atlas.combate/1).
Vallas: azar legal solo tres familias — xorshift32 del canon (`x^=x<<13; x^=x>>>17; x^=x<<5`),
FNV-1a (`acho_language.js`), mulberry32 (`bench_mover`); Math.random y Date.now PROHIBIDOS.
Presupuestos: líneas = vértices·(válvula?3:1) · 25 MiB/bloque (D2) · niebla hash%7==0 → píxel 2×2 ·
anti-slop: dos escenas con el mismo hash de lista → rojo. Frontera (P59): economía y combate son
ESTADO, jamás fotograma; si ha de verse, NO_DATA en SIMULACIÓN con cita.
Leyes de oficio: la búsqueda de código GitHub es pista, jamás prueba — la lectura directa o por API
es la prueba (lección R55/R57). «3.5D» ya estaba acuñado y firmado: nada que acuñar (P66).

## La ley de movimiento (V12 · canon de la lengua, FIRMO del Soberano 2026-10-19)
1. Todo movimiento nace de una entrada MEDIDA (scroll, ciclo, gesto) — jamás reloj de pared ni azar.
2. Movimiento reducido = fotograma de reposo con la información completa en el DOM.
3. Cada fotograma con su gemelo legible < 1.024 B y sus gemelos de sonido y tacto — los 4 canales dicen lo mismo.
4. El movimiento nunca tapa lo medido.
5. No se persiguen «movimientos de gusano»; el gusano legítimo proyecta lo medido, no persigue.

## Nota de paradero (correcciones de la Mesa: R54 → R55 → R57)
La Mesa declaró estos núcleos NO_DATA el 2026-11-03 (R54): error de repositorio — buscó en el
monorepo del rack ramas que viven en ESTE repo. R55 corrigió: los seis núcleos existen en main,
con jueces y servidos. R57 cerró el arco: la caza local del Soberano halló el «3.5D» que la
búsqueda degradada juraba inexistente — el motor PR #563, FIRMO a1a6c88a, servido hoy en main.
El rescate de los 3 SHA (4dec08c/6d413dd/1df6e03) quedó cancelado con causa: los núcleos ya viven
en `atlas/puros/` de main. Lección: cuando el instrumento miente, la caza es local.

Agente: preceptor-orquestador-github · Model: GLM (Vibe)
