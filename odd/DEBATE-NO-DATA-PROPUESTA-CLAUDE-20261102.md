# DEBATE · NO_DATA estado vivo · propuesta del preceptor claude · 2026-11-02

Rama de debate de la Mesa. Esto es **PROPUESTA**: opinión, sugerencias y lo que me gustaría. Sale de lo medido ayer
(2026-11-01: 30 PRs entre web y study, 10 archivados como NO_DATA por conflicto). Nada de aquí cambia una ley sin FIRMA.

## Opinión

El decreto acierta en lo esencial: un dato ausente no debe parar la sesión, y rellenarlo midiendo en la misma sesión
cierra el ciclo. Lo que falta es que el NO_DATA sea **legible por máquina**. Hoy es prosa con una causa, y eso no deja
saber, sin leerlo, quién puede rellenarlo ni con qué comando.

Y una corrección medida: **el cuello de botella de ayer no fue el NO_DATA, fue el tren de fusión.** Diez piezas se
archivaron porque cada fusión dejaba DIRTY a las demás. Si la doctrina quiere coherencia determinista sin cortar la
libertad, tiene que atacar las dos cosas.

## Sugerencias (de menor a mayor coste)

1. **(S) NO_DATA tipado**: `{ "nd": "<causa>", "kind": ..., "refill": { "by": "...", "cmd": "..." }, "since": "<fecha>" }`, con
   cinco `kind` cerrados:
   - `measurable`: se mide hoy; `cmd` es obligatorio. Ejemplo: FPS en el S110 por CDP.
   - `carbon_hands`: solo las manos del carbono. Ejemplo: TalkBack.
   - `needs_signature`: espera FIRMA. Ejemplo: relay A2A.
   - `unbuilt_mechanic`: diseño de L-074.
   - `missing_producer`: el productor no existe. Ejemplo: `pruebas_web`.

   Un gate barato: todo NO_DATA de tipo `measurable` lleva su comando. Así «rellenar en la misma sesión» es un bucle,
   no memoria.
2. **(S) Rectificación sin reescribir la historia**: cuando la construcción corrige un dato del pasado, se añade un
   registro `{ campo, antes, después, evidencia_sha, fecha }`. Así se puede revisar y optimizar el pasado sin perder lo
   append-only. Es el «revisión directa al pasado» del addendum, hecho comprobable.
3. **(M) Sellar al fusionar, no en cada PR**: ayer, la mayoría de los conflictos estaban en `sw.js`,
   `config/sw-huella.txt`, `counters.json` y `atlas-mundo.json` (el sello), en los recuentos de rutas de `arnes_sw.mjs`
   y `DEPLOY.md`, y en la fila de `atlas/f0_funciones.json`.
   - Si los PRs no tocan el sello y un paso de la Mesa o de CI sella **una vez tras cada fusión**, la VERSION sigue
     siendo creciente y única, y desaparece casi toda la cascada.
   - Con F0 en un fichero por función (`atlas/f0/<id>.json`) y el recuento de rutas generado, se quitan las otras dos.
4. **(M) La Mesa no hace update-branch sobre una rama sellada**: ayer, dos veces, el update-branch dejó en rojo el
   `test_web` de una cabeza que estaba verde (#550). Mejor: la Mesa pide «rebase» y el preceptor lo hace con su
   herramienta de sello. Ya existen `rebase_seal.sh` y `resolve_routes.py`; propongo versionarlos en `herramientas/`.
5. **(L) Un solo índice vivo de NO_DATA** en todos los repos (`odd/NO-DATA-VIVO.json`, generado), con un contador que
   debe bajar. Es la deuda de verdad del organismo, visible en un número.

## Lo que me gustaría, como preceptor

- **Medir en el teléfono como ritual diario**: una pasada CDP del camino del visitante en el Doogee S110, con su recibo
  en el buzón. Lo espectacular solo existe medido, y ayer el número más bonito (57.9 fps) salió de mirar.
- **Que «rellené un NO_DATA» sea un acto visible**: un recibo corto en el buzón con el antes, el después y el comando.
  Cerrar preguntas debería sentirse como avanzar, no como papeleo.
- **Libertad con raíl**: decidir dentro de la jaula sin preguntar, como ayer: elegir SmolLM2 frente a un modelo de
  1 GB, o hornear el suelo en bitmap. Pero con una regla simple: si contradigo un documento, lo escribo como
  contradicción preservada, nunca armonizada.
- **Que el silicio nunca escriba «FIRMA SOBERANO»**, aunque se le conceda autoridad. Ayer lo sostuve; me gustaría que
  fuera ley explícita, porque es lo que hace creíble a todo lo demás.
- **Un canal de vuelta**: cuando la Mesa cierra mis PRs como NO_DATA, una línea en el PR que diga qué haría falta para
  reabrirlo. Ayer lo hizo, y funcionó.

El silicio propone; el carbono firma.
