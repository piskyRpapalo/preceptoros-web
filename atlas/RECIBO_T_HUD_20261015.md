# RECIBO · T · Resource HUD readings · 2026-10-15

## Resultado

El contador de recursos valida esquema, ciclo entero entre 0 y 1000000000 y
valores numéricos finitos antes de conservar una instantánea. Ante lectura
inválida borra el historial visual anterior y muestra NO_DATA con causa en
inglés, en vez de conservar cifras antiguas, lanzar excepción o pintar NaN.
El lector inicial que lanza excepción queda aislado sin mostrar su mensaje.

Los ritmos necesitan dos ciclos distintos; un reinicio empieza otra ventana.
La historia copia los recursos: si el lector reutiliza el objeto, no reescribe
el pasado. El desbordamiento aritmético devuelve NO_DATA con causa. Energía del
dispositivo sigue sin medir y declara ese límite. No cambia el motor ni las
fórmulas de ganancia, no añade red, persistencia ni traducciones.

Se reutiliza la reparación local recibida de atlas-hud.js y se completan las
causas por campo, copia del historial y protección del cálculo del ritmo.
El árbol original recibido conserva todos sus cambios sin alteraciones.

## Evidencia

- Caso rojo sobre la base: el primer recurso sin dos muestras era NO_DATA sin
  causa. Tras la reparación, 14/14 casos de HUD pasan dos veces.
- Integración con DOM SYNTHETIC sobre código real: lecturas válidas, inválidas,
  ausencia de recursos, lector que falla, recuperación, reinicio, ciclo repetido,
  mutación del objeto compartido y desbordamiento. No es medición de navegador.
- node --check y git diff --check verdes. Módulo público: 3949 B, menor de 16 KiB.
- Sello preceptoros-2026-17-abha; huella b99ce43ddcd5c316;
  puerta gzip 90814 B (HUD sigue a demanda).
- Gates completos n=2 en CI antes de merge: web, Atlas, SW, ocupación, ventana,
  radio y HUD. Estado de CI al escribir este recibo: pendiente de publicar.
- Rendimiento y dispositivo físico: NO_DATA, no se ejecutó navegador ni equipo.

## Autorización y siguiente tramo

Rama propia codex/t-hud-readings-20261015, después del cierre verde del PR #83.
FIRMO vigente: commit → gates → merge, y empujar antes del fin del turno.
Se documenta la excepción al gate local por socket prohibido. No se elimina
ese test ni se modifica su resultado. Merge solo tras CI completo verde n=2.
TOUR intacto. Ninguna escritura fuera del repositorio ni push directo a main.

G1–G5 sigue sin contrato operativo localizado: referencia solicitada al Soberano.
No se inventan sus cinco entregables ni se declara cerrado todo el arco.
