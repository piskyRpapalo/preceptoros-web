# T4 · preceptores como personajes bubble en OpenWorld (la joya)

**Slug FIRMO propuesto:** `NORTE7-T4-PRECEPTORES-PERSONAJES`
**Cierra:** [1] proporción personaje/entorno.
**Prioridad:** decisión del Soberano sobre T1–T3. Va primero como **fixture** (cuerpo que camina), y T1 se mide sobre él.

## Evidencia medida (origin/main a9a6d31)

- No hay personajes en OpenWorld: `git grep -i -E "luna|mesa|claude"` sobre `public/game/global_map.js` y
  `public/openworld` no devuelve nada. Solo la cabaña y los nodos marcos.
- Los preceptores existen como nombres de carril en la documentación (Mesa, Luna, Claude; la repo `preceptoros-web-luna`
  existe en local). Su presencia visual no existe.
- Estados que pide la tarjeta: la tabla de siete estados ya está registrada (`public/game/tabla_semantica.js`, canon
  `docs/canon-bubble-math.md` §4). El sello de estado se toma de ahí, sin inventar color.
- «?» al necesitar HITL: el HITL existe como flujo de firma (buzón, Ley del Buzón), no como señal visual.
- **Patrón bot-thread de Bot Crossing:** referencia externa **no leída en esta sesión**. Su comportamiento exacto
  queda NO_DATA hasta leerlo. Se usa solo como técnica; sin copiar identidad, nombres, sprites ni textos.

## Propuesta (propose-only)

Cada preceptor es un **cuerpo bubble** (un marco de ≤1.024 B) que camina el mapa en una rejilla de celdas isométricas
2:1. Tiene:

- **Sello de estado** visible: uno de los siete estados de la tabla, con su gemelo estático (texto y forma), para que la
  lectura no dependa del movimiento.
- **«?»** cuando el preceptor necesita una firma humana (HITL): forma y texto, no solo color.
- **Caminar** en un tick determinista: la posición es función de (ticks, destino), sin azar.

Un preceptor **sin dato** (no hay señal de su estado) se muestra con el sello NO_DATA y su causa, nunca como si estuviera vivo.

## Criterio medible (fixture primero)

- Dada una secuencia de ticks, la posición de cada preceptor es idéntica en dos ejecuciones (determinismo).
- Cada uno de los siete estados tiene forma distinta y texto (prueba sobre la tabla).
- Un preceptor sin estado medido muestra NO_DATA con causa.
- Proporción: la altura del cuerpo es menor que la del entorno y mayor que un umbral legible en pantalla (rango medido, no supuesto).

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B por cuerpo · determinismo (sin azar, sin reloj de pared: el paso es por tick) · offline ·
0 peticiones · tres colores · EN 301 549 con cuatro canales (visual, texto, teclado, lector) · reduced-motion (caminar sin
animación: el cuerpo se mueve a saltos de celda) · SCRUB total: **ningún nombre propio de marca ni de terceros; los
personajes se llaman por su carril, no por una identidad externa**.

## Decisiones que pido al Soberano

1. ¿Cuántos preceptores entran en el mapa a la vez? (proporción y legibilidad).
2. ¿El «?» es un estado de la tabla o un marcador aparte?
3. ¿Quién decide la posición de un preceptor: el propio carril, o el orquestador (Hexelion, L7)?
