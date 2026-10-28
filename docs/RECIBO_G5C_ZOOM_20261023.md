# G5c · zoom, tamaño conservado y foco

PROPUESTA · 2026-10-23. Base medida: `1532f83` (G5b sobre R-D3a, `sea*`).
No cambia el motor, la cámara, las ondas ni la superficie servida.

## Consumidores MEDIDOS

| Ruta | Línea | Consumo |
|---|---:|---|
| public/game/map_zoom.js | 15 | `factor()` entrega el factor del gesto; límites 0,6–3 |
| public/game/sea.js | 106 | Multiplica la proyección de posiciones del mapa |
| public/game/sea.js | 184 | Entrega la misma escala a la inversión de coordenadas táctiles |
| public/game/sea.js | 134 | Radio de la onda: `18 * dpr`, independiente del factor |
| public/game/map_pointer_input.js | — | Consume la escala por el callback `z`; no llama a `factor()` |

`atlas/map_zoom_casos.mjs` inventaría los consumidores con ruta/línea y
bloquea un consumidor adicional del patrón medido sin revisar el inventario.
Prueba la rueda, el límite, Ctrl+rueda y el pellizco repetido con un aparato
SYNTHETIC. No equivale a medir gestos en un teléfono físico.

## Navegador MEDIDO

`node atlas/map_zoom_browser.mjs` carga la página real y entra al juego.
Observa las llamadas reales a `AtlasEscena.figura` para el lienzo del mapa,
sin reemplazar su dibujo. Preferencia de movimiento reducido; DPR 1.
Compara cada serie de armónicos y radio entre los extremos del zoom.

| Vista Chromium | Panel central CSS px | Factor | Ondas observadas | Radio CSS px | Resultado |
|---|---|---|---:|---:|---|
| Escritorio 1440 × 900 | 1425 × 900 | 0,6 → 3 | 6 | 18 → 18 | MEDIDO: serie y radio conservados |
| Móvil emulado 390 × 844 | 390 × 844 | 0,6 → 3 | 6 | 18 → 18 | MEDIDO: serie y radio conservados |

Ctrl+rueda conserva el factor del mapa. Cero peticiones externas.
El aparato emula los eventos; no representa una medición física del Doogee.
La medida cubre seis ondas visibles por el pintor vectorial con esta calidad;
no certifica edificios, glifos, sprites de baja calidad ni todas las especies.

Rojo antes de verde: `--sabotage-size` sirve únicamente al navegador una
copia de `sea.js` con radio multiplicado por el zoom. La prueba falla con
10,8 frente a 54 px. No modifica el fichero servido de producción.
`node atlas/map_zoom_casos.mjs --sabotages` exige ese rojo por su causa.
Ambas órdenes están dentro del gate remoto de dos vueltas.

## Foco 25–50%: NO_DATA con causa

`npc_territory_map.js` entrega `tropa` en la ficha; `piece_inspector.js`
abre datos semánticos en el terminal lateral. No declara un rectángulo del
objeto enfocado en el panel central ni una medida de ocupación de ese objeto.
El pequeño dibujo del mapa no acredita un foco al 25–50%.

`node atlas/map_zoom_browser.mjs --require-focus` termina rojo con
`G5C_FOCUS_NO_DATA`. El modo de auditoría informa esta carencia explícita;
su salida verde solo acredita las invariantes medidas del zoom.
Este PR NO cierra el requisito de foco ni solicita firmarlo como cumplido.

Propuesta pendiente: exponer desde el pintor la caja del objeto elegido y
del panel, declarar si el porcentaje se refiere a extensión o área y medir
25–50% antes de construir la ampliación en Bubble. Así se conserva la lógica
viva (L-051), los armónicos y la escala del mundo; el gesto sigue en manos
de la persona. No se incorpora una escala automática con autoridad sobre el
objeto ni un nombre nuevo del léxico.

## Base y pruebas

R-D3a modificó dos rutas lectoras en `valores.js` y dejó su huella T3 previa.
El rojo se reprodujo en la base sin cambios. G5b ya registró la
nueva huella medida en main; este PR no toca T3. Números, casos
`reverted`, huella del motor y demás leyes quedan iguales a la base.

Gates completos n=2 y CI del head final se adjuntan en el PR y buzon#19.
Silicio propone; carbono firma. Sin merge por el agente.
