# RECIBO · Paneles, botones y transiciones · 2026-10-15

FIRMO vigente del Soberano: publicar lo visual ya construido, con gates y merge.
Rama propia codex/web-panels-transitions-20261015, base publicada a8b5774.
No se inicia la reparación adicional de radio ni se inventa el contrato G1–G5.

## Estructura ya publicada

La comparación con origin/main confirma que terminal_menu_shell.js y su CSS
ya contienen el menú lateral, cajón único, cierre, exclusión de hoja/panel,
Army/Taller y botones táctiles. No existe un cambio nuevo de esos dos módulos
en el árbol recibido. La otra copia del juego está limpia y corresponde a
una revisión anterior: no se usa para reemplazar el estado publicado.
Las correcciones de cabecera y lectura de radio de PR #83 permanecen vigentes.

## Pendiente visual incorporado

Se adopta el cambio recibido de worm_transition.js: sin ciclo válido, trayectoria
neutra, sin fingir el lado del ciclo cero; lector que falla devuelve ausencia.
No cambia panel, botón, destino ni navegación: el gusano sigue siendo proyección.
Se incorporan a thegame.js las causas cerradas de carga ya construidas para
Army, terminal, arena y entrada; no se muestran mensajes internos de excepciones.
Se conserva el cargador vigente, sin incorporar módulos de audio o vector.

## MEDIDO

- Gates locales completos n=2: web 76, una omitida; Atlas 175; SW 22/22,
  135 rutas. Las dos pasadas terminaron con salida cero.
- Transiciones 6/6: prueba nueva roja contra la fuente publicada, verde tras
  adoptar el cambio; conserva determinismo, destino, color y separación de acción.
- thegame.js 12610 B; worm_transition.js 6630 B, ambos menores de 16 KiB.
- Sello preceptoros-2026-17-abhb, huella 3234d7af5a553e45;
  puerta gzip 90948 B. Inglés, JavaScript vanilla, sin build.
- Navegador: primera ejecución sin pasos por fallo al abrir puerto de Chrome;
  repetición en curso al escribir este recibo. No se declara verificación visual.
- Difusión pública: este recibo describe código y gates locales; el despliegue
  final se comprueba después de publicar. TOUR se conserva intacto.

## Publicación

Commit y push de esta rama propia; PR y merge con FIRMO tras CI verde.
No se empuja directamente a main ni se altera el árbol original con trabajo ajeno.
Solo se escribe dentro del repositorio. Las tres piezas anteriores ya fusionadas
se conservan; no se copian sobre ellas versiones locales antiguas.
