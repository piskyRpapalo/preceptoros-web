# preceptor-coder entra nativo en la app (plano, sin código)

Encargo: comisión ·6594454985 (Mesa TF, 2026-11-03, «the coder goes native»), punto 6 de la
BOLA DE LA NOCHE. Esta noche solo hay plano: aquí no hay código. Reglas del orquestador local:
propose-only con HITL (jamás auto-aplica), recibo por corrida, casos = eval con baselines,
NO_DATA con causa si no hay motor medido, inglés público + SCRUB y un nombre por concepto.

## 1. Lo que hay (medido por el Soberano, citado)

- **Copia viva:** `acho-plano-20261102`, `tools/preceptor-coder/`. Es la única con el renombre
  bubble→Acho; su deriva respecto al origen es solo ese renombre.
- **Origen:** la rama `haiku/preceptor-coder-20261028` del web, commit `789c34ef`, sin fusionar.
- **Motor de estación:** recibo `deepseek-coder:33b` del 31-oct en estado **RED** (determinista,
  no exacto, ~11 tok/s). **Se cita, no se toca.**
- **Candidatos a mini-coder:** M1–M4 de qwen2.5-coder 3b/1.5b en el rack (15-oct).

## 2. Lo que medí yo (2026-11-03, `soberano`, Ollama con backend **100 % GPU**, `num_ctx 4096`, temperatura 0, semilla 0)

**a. La deriva, comprobada.** `diff -r` entre `789c34ef` y la copia viva da 3 líneas, las tres
del renombre (`bubble_language.js` → `acho_language.js`, `AtlasBubble` → `AtlasAcho` y el `v`
del fotograma). Los casos de la copia viva pasan **6/6** con el compilador de main.

**b. El pintor determinista, sin modelo.** Le pasé los 10 fotogramas de la sensación del mundo
(web#609) por `measure`:

| fotograma | SVG | operaciones | desconocidas |
|---|---|---|---|
| `cabin` (fixture) | **19.462 B** | 219 | — |
| `sky-*` (6) | 7.293–7.497 B | 5 | — |
| `badges-z1/z2` | **31.709 / 31.092 B** | 12 | — |
| `label-0/60` | 326 / 329 B | 4 | **`text`: 1** |

Dos hallazgos:
- El pintor **no conoce `text`**: los billboards (L4) pierden su rótulo. Lo cuenta y no lo
  esconde, que es su ley.
- Tres de cada diez dibujos superan **16 KiB** de SVG por pura precisión de los trazos.

**c. Los mini-coder en el rack.** La tarea: escribir un fotograma Acho para 3 encargos (un sol,
un horizonte y una luna), con el fixture como ejemplo. Hay dos varas, y la segunda es la que
importa:

| modelo | pasa la LEY y compila | geometría pedida (a mano) | `sound` exacto | tok/s | segundos por fotograma | tokens de prompt |
|---|---|---|---|---|---|---|
| `qwen2.5-coder:1.5b` | 3/3 | **0/3** | **0/3** | 64,4–64,9 | 1,8–4,4 | ~380 |
| `qwen2.5-coder:3b` | 3/3 | **1/3** (el horizonte) | **0/3** | 34,2–35,0 | 3,3–9,2 | ~380 |

Fallos vistos:
- dibuja el sol y la luna con `ribbon` en vez de `blob` (el 1.5b, además, pinta el sol `paper` en vez de amarillo);
- cierra (`closed: true`) un horizonte pedido «abierto»;
- copia el `sound` del ejemplo como «NO_DATA…» cuando se pidió `"none"`, en **6 de 6**: un
  sello mentido;
- omite `bands` y `change`, y la ley actual de la herramienta no los exige.

**La ley de forma no basta:** un fotograma puede ser legal y no ser lo pedido. Hacen falta casos
con baseline de significado.

**d. La app todavía habla el nombre viejo.** `preceptor-runtime/interface/face/bubble/` sirve
`bubble_language.js` (16.240 B), distinto del `acho_language.js` de main (16.342 B). Son dos
nombres para un concepto, y la regla dice uno.

**e. La app no hace tool-calling, y es una decisión.** Lo explica `herramientas.py`: el motor es
`texto → texto`. El coder nativo cabe ahí sin protocolo nuevo: el modelo propone un fotograma
como texto y la app lo valida y lo pinta.

## 3. Arquitectura propuesta: tres pisos, del más barato al más caro

1. **Piso 0, determinista (sin modelo):** `ley()` + `compile()` + pintor SVG. Es lo nativo de
   verdad: corre en la app, en el Doogee y sin red. Todo fotograma, venga de quien venga, pasa
   por aquí.
2. **Piso 1, mini-coder local** (`qwen2.5-coder:1.5b`, el más rápido medido). Solo **propone**;
   su salida entra al piso 0 y a los casos de significado. Su estado sale de la medida: hoy es
   **RED** (geometría 0/3, `sound` 0/3).
3. **Piso 2, estación** (`deepseek-coder:33b`): RED por recibo del 31-oct, citado. Sin motor
   medido en la corrida, el estado es **NO_DATA** con su causa.

Cada corrida deja un **recibo**:
- motor y tag;
- backend (`ollama ps`);
- tokens de prompt y de salida;
- tiempo;
- casos pasados de forma y de significado;
- y la propuesta. **Nunca se aplica sola.** La persona firma el fotograma (HITL) antes de que
  entre en un mundo.

## 4. Piezas (una PR cada una; el código, otra noche)

| # | Pieza | Repo | Coste |
|---|---|---|---|
| C1 | **Casos de significado con baseline:** 12 encargos con su respuesta comprobable (primitiva, centro ±4 px, bandas, `closed`, `sound` exacto). Rojo hoy con los dos mini-coder; los baselines son sus cifras de esta noche | web, `tools/preceptor-coder/` | M |
| C2 | **Un nombre:** la app sirve `acho_language.js` y lee `bubble` solo durante la ventana D5 | APP | S |
| C3 | **El pintor aprende `text`** (y redondea a enteros para bajar del techo de 16 KiB). Rojo: `label-*` cuenta `text: 1` | web | S |
| C4 | **El coder en la app, piso 0:** dibujar y validar un fotograma pegado, sin modelo | APP | M |
| C5 | **Piso 1 con recibo:** la propuesta del mini-coder, con su estado medido (RED/LIVE) y la firma antes de aplicar | APP | M |

## 5. Lo que sigue abierto

- **Pass rate en el motor del rack:** medido arriba con 3 encargos (forma 3/3; geometría
  0/3 y 1/3; `sound` 0/3 en los dos). Con 12 casos (C1) será una cifra estable.
- **Coste por corrida:** ~380 tokens de prompt, 110–315 de salida, 2–9 s en GPU con el
  backend registrado. La estación no se midió esta noche: NO_DATA.
- **¿Mini-coder local o solo estación?** El dato de esta noche dice que el local es rápido pero
  no entiende aún. La decisión es de la Mesa cuando C1 dé su cifra. Hasta entonces, el piso 1
  se declara RED.

Agent: claude-code · Model: claude-opus-5-5
