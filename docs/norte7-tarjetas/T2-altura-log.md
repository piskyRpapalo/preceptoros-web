# T2 · altura del edificio como dato en escala logarítmica

**Slug FIRMO:** `NORTE7-T2-ALTURA-LOG`
**Estado:** fixture en marcha (autonomía concedida; T2 PROCEDE YA, parametrizada y con h0/k derivados por medición).
**Cierra:** [2] crecer es altura, no anchura.
**Fixture:** `atlas/fixtures/t2_altura.mjs` · pruebas `atlas/t2_altura_casos.mjs` (11/11) · registro `atlas/fixtures/constantes.json`.

## Ley firmada (dictado web#387)

    h(mana) = h0 · (1 + k · ln(1 + mana))

- Mana: dato entero 0–100 de `public/game/global_map.js:41`.
- Sin dato (null, fuera de rango o no entero): altura de suelo **h0**, con causa `NO_DATA`. Nunca un cero ni un valor inventado.
- Solo crece la **altura**. El ancho del marco no depende del mana [2].

## Cambio declarado frente a la versión anterior de esta tarjeta

La versión anterior proponía `h = h0 + k · log2(1+m)`, con el criterio «duplicar m suma siempre el mismo incremento». Ese criterio
es propio de log2 y **no se cumple** con la ley firmada (ln). El criterio nuevo es el que sí se cumple: incrementos
decrecientes (la curva es cóncava). El cambio queda declarado aquí, no silencioso.

## Derivación de h0 y k (medida, no pedida)

- **h0 = ⌈ETIQUETA_MIN_PX / ZOOM_MIN⌉ = ⌈16 / 0.6⌉ = 27 px ref.** Es el análogo vertical del suelo de 16 px: a 27 px de
  referencia y zoom 0.6 quedan **16.2 px en pantalla**. Procedencia: dictado web#387 (16 px) y `public/game/map_zoom.js:3` (0.6).
- **k = (2.5 − 1) / ln(1 + 100) = 0.325.** El ratio objetivo 2.5 es el punto medio de la ventana [2, 3] de la regla [1]
  (la altura de un nodo lleno no baja de 2 ni sube de 3 veces el suelo). Procedencia: regla [1] del dictado.
- Ambos quedan **MEDIDOS con derivación** en `constantes.json`. El Soberano valida el antes y el después con sus ojos.

## Tabla medida (fixture)

| mana | altura (px ref) | veces h0 |
|---:|---:|---:|
| 0 | 27.00 | 1.000 |
| 10 | 48.04 | 1.779 |
| 25 | 55.59 | 2.059 |
| 50 | 61.50 | 2.278 |
| 75 | 65.00 | 2.407 |
| 90 | 66.58 | 2.466 |
| 100 | 67.50 | 2.500 |

**Hallazgo para el ojo del Soberano:** la curva sube deprisa al principio. De mana 0 a 10 la altura pasa de 27 a 48 px
(+78 %); de 90 a 100 solo sube 0.9 px. Es lo que pide el logaritmo, pero los primeros puntos de mana dominan la lectura.
Si el ojo lo ve brusco, el ajuste es **k**, declarado y medible; no se toca en silencio.

## Pruebas (11/11)

- h0 = 27 y legible en pantalla al zoom mínimo (16.2 ≥ 16). **Pasa.**
- h(100) = 2.5 · h0; h(100)/h0 dentro de [2, 3]. **Pasa.**
- h(0) = h0; estrictamente creciente en 0..100; incrementos decrecientes (cóncava). **Pasan.**
- Solo devuelve altura y estado: el ancho no entra. **Pasa.**
- null/undefined, fuera de rango, decimal o cadena → `NO_DATA` con causa y altura h0. **Pasa.**
- h0 y k del fixture = los del registro, en estado MEDIDO con derivación. **Pasa.**
- Sin azar del sistema ni reloj. **Pasa.**

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B (la altura entra como un número en el marco) · determinismo · offline · 0 peticiones ·
tres colores (la altura no añade color) · reduced-motion (el crecimiento es un cambio de marco, no una animación) ·
EN 301 549 (si la altura se muestra como número, lleva equivalente textual) · NO_DATA con causa.

## Pendiente para el pase de cableado

- Cómo se llama el dato de altura en el marco (`sizeBytes` no existe en el repo: NO_DATA, sin cifra).
- Si la altura se muestra como número visible o solo como forma (decisión del Soberano; EN 301 549 la condiciona).
- Mapear el mana de la cabaña (hoy NO_DATA: «no mana measurement reported for the tutorial cabin yet»).
