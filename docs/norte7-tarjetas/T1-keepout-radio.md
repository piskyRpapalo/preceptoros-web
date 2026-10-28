# T1 · radio de respeto por interactivo (keep-out)

**Slug FIRMO:** `NORTE7-T1-KEEPOUT`
**Estado:** fixture en marcha (autonomía concedida, web#387). Orden firmado: T4 → **T1** → T2 → T3.
**Cierra:** [3] nada se solapa sin intención.
**Usa:** el caminante de T4 como cuerpo móvil.
**Fixture:** `atlas/fixtures/t1_keepout.mjs` · pruebas `atlas/t1_keepout_casos.mjs` (13/13) · registro `atlas/fixtures/constantes.json`.

## Dictado aplicado (web#387)

- Radio **por tipo**, con **override por instancia**.
- La cabina es **origen y tiene radio**. Cero exenciones.
- Un tipo sin radio medido se **rechaza** (`NO_DATA`), nunca un radio invisible por defecto.
- Los nodos (atlantis, risen) solo existen como interactivos con nodo vivo.

## Evidencia medida

- Posiciones de referencia: `public/game/global_map.js:22-26`. La cabina queda en el origen (3,2) de la rejilla 7×5; los nodos
  llegan por su `reco` ([-2,1] y [2,-1]).
- Estado en `origin/main` (a9a6d31): no hay colisión ni radio en `public/game` ni `public/openworld`.
- Números sin fuente en el corpus: el grep de «lean», «keep-out» y «radio de respeto» no encuentra valores. El radio y el
  LEAN son **propuestas medidas**, registradas con su procedencia (`constantes.json`), no fuentes.

## Hallazgos medidos (500 ticks, tres carriles)

1. **Radio 1.5 bloquea demasiado.** Con tres interactivos, 1.5 bloquea **23 de 35 celdas (66 %)**. Radio 1.2 bloquea 15 (43 %),
   1.0 bloquea 3 (9 %). Se declara el cambio **1.5 → 1.0** en el registro, con su motivo. La procedencia inicial de 1.5 que
   decía «deja libre la celda central y sus 4 vecinas diagonales» era **falsa** y queda corregida.
2. **El caminante de T4 se atascaba frente al keep-out** (no daba la vuelta). Con 1.0, los carriles quedaban bloqueados
   270 ticks y visitaban solo 11 celdas. Corrección: paso por **búsqueda en anchura (BFS)** sobre celdas libres, con vecinos en
   orden fijo (+x, −x, +y, −y), así el camino es determinista.
3. **Después del rodeo:** ningún carril queda bloqueado por el keep-out (0 ticks), cobertura de 21, 27 y 21 celdas, y
   ningún carril cruza el borde en 500 ticks.
4. **Espera detrás de otro carril:** tiempos quietos de 61–62 ticks. Es la regla [3] funcionando (aceptada en T4).
5. **Separación lateral:** en 1162 de 1500 ticks-carril, el carril está a **un LEAN (1 celda) o menos** del borde. Es un
   dato informativo; no es una prueba pasa/no pasa.

## Criterio medible

- Ningún carril dentro de un radio, en ningún tick (prueba de 500 ticks, nodos vivos). **Pasa.**
- La cabina tiene origen y radio; los nodos aparecen solo con nodo vivo. **Pasa.**
- Override por instancia gana sobre el radio del tipo; radio ≤ 0, no finito o tipo sin radio: se rechaza. **Pasa.**
- Determinismo; un carril a lo sumo una celda por tick; sin solape; arranques fuera de todo radio. **Pasan.**
- Cada constante con procedencia, estado y motivo; `NO_DATA` sin valor. **Pasa.**

## Constantes (todas en `constantes.json`, ajustables como declaración)

| Constante | Valor | Estado | Procedencia |
|---|---|---|---|
| `RADIO_CUERPO` (cabina y nodo) | 1.0 celda | PROPUESTA | medida en el fixture (cambio declarado desde 1.5) |
| `LEAN` | 1 celda | PROPUESTA | la rejilla no admite menos de una celda |
| `RADIO_BALIZA`, `RADIO_GRIETA` | — | NO_DATA | no hay baliza ni grieta en el mapa |

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B (la prueba no genera cuadros) · determinismo (BFS de orden fijo, sin azar ni reloj) · offline ·
0 peticiones · reduced-motion (el empuje no exige animación) · NO_DATA con causa (tipo sin radio = NO_DATA) · SCRUB.

## Decisiones que pido al Soberano

1. ¿Confirmas el cambio de radio **1.5 → 1.0** (declarado, con medida)? Con 1.0 el keep-out es mínimo; con 1.2 bloquea el 43 %.
2. ¿Baliza y grieta: qué radio tienen cuando existan? Hoy son `NO_DATA`.
3. ¿La espera de 61–62 ticks detrás de otro carril se acepta (lo que hace la regla [3])?
