# RECIBO · T · Terminal and radio ages · 2026-10-15

## Resultado construido

Las cabeceras de terminal y las burbujas de radio usan ciclos enteros de
0 a 1000000000. La ausencia, formato inválido, fallo del lector o reinicio
del ciclo devuelve NO_DATA con causa en inglés; no se fabrica cero ni frescura.
El ciclo cero válido sigue siendo medido. LIVE/STALE conserva el umbral de 120.

Se reutilizan los cambios locales existentes de terminal_window_frame.js y
radio_message_log.js, revisados aquí y ampliados para rechazar edades cuyo
último evento está en un ciclo futuro respecto al actual. Se conserva el
árbol original recibido. No se incorpora audio ni vector ni traducciones.

## Evidencia local

- Rojo previo: 8/14 casos de ventana fallaron; radio falló al aceptar un ciclo
  ausente. La reparación pasó 14/14 de ventana y 13/13 de integración radio.
- Radio usa DOM SYNTHETIC contra el código real: no es navegador ni dispositivo.
  Cubre ciclos inválidos, lector ausente o que lanza excepción, límites de edad,
  reinicio, recuperación y conservación de sellos SIMULATED/NO_DATA.
- Radio 13/13 dos veces; node --check y git diff --check verdes.
- CI amplía el mismo gate n=2 con ventana y radio. Los gates completos pendientes
  de ejecución en GitHub precederán al merge; no se omite el test del servidor.
- Sello SW preceptoros-2026-17-abgz; huella c1c8e9bb7c4f278b;
  puerta gzip 90.814 B. Todos los módulos públicos cambiados <16.384 B.
- Percepción visual y dispositivo físico: NO_DATA, no se ejecutó navegador.

## Publicación autorizada

Rama propia codex/t-cycle-age-20261015, después del cierre de PR #82.
FIRMO vigente: commit → gates → merge; push antes de acabar el turno.
El commit precede a CI por la excepción explícita de permisos del servidor
local. Merge autorizado únicamente después de dos pasadas completas verdes.
TOUR intacto, sin escrituras fuera del repositorio y sin push directo a main.

Siguiente tramo G1–G5: su definición operativa no se ha localizado en los planes
consultados. Se ha solicitado la referencia o sus cinco entregables; no se
inventan esos contratos ni se cambia al tramo W para saltarlos.

## Ajuste del gate heredado

El caso Atlas de radio exigía literalmente el algoritmo que fabricaba edades.
La corrida local aislada lo detectó rojo en dos aserciones. Se conserva la guarda
de atributos data-* y se añade al mismo caso la ejecución de los 13 casos de
radio contra el módulo real, incluidos los límites LIVE/STALE y los ciclos
no medidos. No se elimina ni omite el caso; se verifica el comportamiento nuevo.

## Cierre publicado y fusionado

PR #83: https://github.com/piskyRpapalo/preceptoros-web/pull/83
Head publicado cf5e4a70135ca1ae2f539795f75fa0058fd56bbb.
CI gate 38720797954, job 116374554579: dos pasadas completas verdes.
Por pasada: web 76 casos, 3 omisiones en Python 3.11 de CI; Atlas 175;
SW 22/22; privacidad de ocupación 17; ventana 14; radio 13. Verifica verde.
Merge ejecutado con FIRMO: bcaf2fd7ee23a7e81025ad99e93480e1c480818a.
Cierre anterior al inicio de la reparación del contador de recursos.
