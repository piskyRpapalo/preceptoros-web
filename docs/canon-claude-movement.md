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

## La ley de movimiento (V12 · canon de la lengua, FIRMO del Soberano 2026-10-19)
1. Todo movimiento nace de una entrada MEDIDA (scroll, ciclo, gesto) — jamás reloj de pared ni azar.
2. Movimiento reducido = fotograma de reposo con la información completa en el DOM.
3. Cada fotograma con su gemelo legible < 1.024 B y sus gemelos de sonido y tacto — los 4 canales dicen lo mismo.
4. El movimiento nunca tapa lo medido.
5. No se persiguen «movimientos de gusano»; el gusano legítimo proyecta lo medido, no persigue.

## Nota de paradero (corrección de la R54 de la Mesa)
La Mesa declaró estos núcleos NO_DATA el 2026-11-03: era un error de repositorio — buscó en el
monorepo del rack ramas que viven en ESTE repo. Medido hoy sobre main: los seis núcleos existen,
tienen jueces y están servidos. El término «3.5D» no aparece en repos alguno medido; si es el nombre
del Soberano para esta familia, se declara aparte y se añade aquí con su FIRMO.

Agente: preceptor-orquestador-github · Model: GLM (Vibe)
