# T3 · nombres con hit-test en pantalla y zoom con límites publicados

**Slug FIRMO propuesto:** `NORTE7-T3-NOMBRE-PANTALLA`
**Cierra:** [4] lo que el ojo sigue no encoge · [5] siempre legible.

## Evidencia medida (origin/main a9a6d31)

- El nombre se dibuja **dentro del marco** en coordenadas de referencia: `public/game/global_map.js:87`
  (`{ o: 'letters', x: 160, y: 28, tx: row.nombre, sz: 16, ... }`). No hay hit-test: el nombre no es un objeto tocable.
- El zoom tiene límites `MIN = 0.6`, `MAX = 3` (`public/game/map_zoom.js:3`). Responde a **rueda** (`map_zoom.js:17`,
  con `ctrlKey` sin efecto) y a **pellizco** (`map_zoom.js:9`). Los límites no están publicados fuera del código.
- Dónde el zoom escala el dibujo: **NO_DATA**. He medido el manejador de entrada, no el uso de `dataset.zoom` en el
  render de OpenWorld. Hay que leerlo antes de firmar.
- Hoy no hay criaturas ni pueblos: solo la cabaña y los nodos (marcos). La regla «criaturas nunca encogen» no tiene
  todavía objetos que la cumplan; se declara como regla para cuando existan.

## Propuesta (propose-only)

1. **Hit-test en espacio de pantalla** (billboard): el nombre se localiza con su caja en píxeles de pantalla, no en el
   espacio del mundo. Un toque cae en la caja del nombre aunque el zoom cambie.
2. **Legibilidad a cualquier zoom:** el tamaño del texto en píxeles de pantalla tiene un suelo; el zoom cambia el
   terreno y los caminos, nunca el tamaño del nombre por debajo de ese suelo.
3. **Límites publicados:** 0.6–3 se escriben en la documentación del mapa; el zoom no sale de ellos.
4. **Lo que se mira no encoge:** un elemento seleccionado mantiene su tamaño mínimo en pantalla al cambiar el zoom.

## Criterio medible (fixture primero)

- Para cada zoom en una rejilla 0.6–3, el tamaño en píxeles del nombre está por encima del suelo.
- Un toque dentro de la caja del nombre devuelve ese nombre; uno fuera, no (sin raycast, solo caja en pantalla).
- Ningún valor de zoom sale de [0.6, 3] (prueba de propiedad).

## Leyes que mantiene

bubble/1 (el nombre sigue siendo texto dentro del marco) · cuadros ≤1.024 B · determinismo · offline · 0 peticiones ·
tres colores · EN 301 549: el nombre es texto real, con foco de teclado y área táctil ≥ 44 px · reduced-motion (el zoom
sin animación obligatoria) · NO_DATA con causa.

## Decisiones que pido al Soberano

1. ¿El suelo de legibilidad en píxeles es 16 px o más? (EN 301 549 y tamaño de texto del mapa).
2. ¿Publicar los límites 0.6–3 en `llms.txt`, o solo en la documentación del mapa?
