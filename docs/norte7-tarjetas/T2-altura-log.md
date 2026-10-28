# T2 · altura del edificio como dato en escala logarítmica

**Slug FIRMO propuesto:** `NORTE7-T2-ALTURA-LOG`
**Cierra:** [2] crecer es altura, no anchura.

## Evidencia medida (origin/main a9a6d31)

- Hoy no hay altura: los marcos tienen caja fija `ANCHO = 320, ALTO = 96` (`public/game/global_map.js:12`).
- El único dato medido por nodo es el **maná**, entero de 0 a 100, validado en `global_map.js:41`; si falta, la
  función devuelve `NO_DATA` con causa (`global_map.js:42-43`).
- La cabaña no tiene maná medido: `NO_DATA` con causa «no mana measurement reported for the tutorial cabin yet».
- Patrón `sizeBytes`: **no aparece en el repo** (`git grep sizeBytes` vacío). Su forma viene del texto del Desk y del
  ejemplo de Bot Crossing (referencia no leída en esta sesión). Queda NO_DATA hasta verificarlo.

## Propuesta (propose-only)

La altura de un nodo es **una función de su maná medido**, en escala logarítmica compartida:

    h(m) = h0 + k · log2(1 + m)      con m = maná medido (0..100); m ausente → sin altura (NO_DATA)

Crece **solo hacia arriba**: la anchura del marco no cambia (sigue en 320). El valor sale de un dato medido, nunca de
un número inventado. La escala es una sola para todos los nodos (compartida).

## Criterio medible (fixture primero)

- Monotonía: m1 < m2 ⇒ h(m1) < h(m2), y la anchura del marco es la misma para todo m.
- Escala logarítmica: duplicar m suma siempre el mismo incremento de altura (prueba sobre una rejilla de m).
- Sin dato: maná ausente ⇒ altura NO_DATA (no cero, no un valor por defecto).
- Ningún vecino cambia de sitio cuando un nodo crece (la posición de la rejilla no depende de h).

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B (la altura entra como un número en el marco) · determinismo · offline · 0 peticiones ·
tres colores (la altura no añade color) · reduced-motion (el crecimiento es un cambio de un marco, no una animación) ·
NO_DATA con causa.

## Decisiones que pido al Soberano

1. Valores de h0 y k (la pieza los deja como parámetros; no los fijo).
2. ¿La altura se muestra como número visible o solo como forma? (EN 301 549: si es número, debe tener equivalente textual).
