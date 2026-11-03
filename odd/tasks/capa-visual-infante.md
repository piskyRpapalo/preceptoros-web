# (e) Capa visual · la pieza del infante: una acción visible por pantalla

Decreto de marcha ·6593641992, cola (e). Este documento es el plano: aquí no hay código.
Cada pieza de abajo va en su propia PR, con su FIRMA y su letra de sello.

## 1. Medida (2026-11-03, producción, 390×844 móvil, Chromium headless)

| Página | Controles visibles | En la 1.ª pantalla | Texto visible | Alto en pantallas |
|---|---|---|---|---|
| `/` (INTRO) | 3 | 3 | 619 caracteres | 1,1 |
| `/openworld/` | 30 | **16** | 1.993 caracteres | 2,4 |
| `/chat/` (web#604) | 4 | 3 | — | ~1 |

La INTRO ya cumple: dos puertas y el salto de teclado. **El problema está en OpenWorld.**

Esto es lo que ve un infante en OpenWorld (captura `infante-ow.png`):

- **«Play now» aparece tres veces** con tres formas distintas:
  - «Play now · sign on this device» (tarjeta Welcome);
  - «Play now» (tarjeta Guide);
  - la pestaña «Play •».
- **La frase «The guide is still asleep» sale dos veces.**
- **Hay tres cajas de conversación:**
  - «Chat», con sus tarjetas;
  - la caja del guía, con su Send;
  - el panel «Map · Echoes / Conversation / Radio».
- **Siete controles de mapa** (+ − ⟲ ↺ ↻ ⌂ y la flecha) compiten con la única acción que importa, que es entrar.
- **La pestaña «Conversation» se corta** a 390 px: «Conversatio|n».
- **La línea de estado se trunca:** «Map · not measured yet · Nodes online…».
- **Datos crudos de los caminantes a la vista:** «walker of cabin: building · stops cabin → …». Lo técnico tiene que ir plegado (ley de la casa).

## 2. Regla de la pieza (medible)

- **R1. Una acción primaria por pantalla.** En la 1.ª pantalla solo hay un control con apariencia primaria (borde doble o relleno). El resto es secundario o queda plegado. *Prueba:* `count(.primaria visibles en el pliegue) === 1`.
- **R2. Ninguna frase se repite** en el texto visible de la 1.ª pantalla. *Prueba:* no hay ninguna línea duplicada en `innerText` dentro del pliegue.
- **R3. Lo técnico, plegado.**
  - Los estados crudos (walker, «not measured», «state · turn») viven dentro de «Technical details».
  - Para el infante, el NO_DATA se dice en una frase llana: «The map is still waking up.»
- **R4. Nada se corta a 390 px.** `scrollWidth <= clientWidth` en cada botón y pestaña.
- **R5. J1 se mantiene:** 44 px, coordenada de foco, sonido, y el teclado alcanza todo. La batería `acho_a11y_medida.mjs` sigue en verde.
- **El cangrejo no se toca.** `visitor_account.js` y la firma «sign on this device» se quedan como están.

## 3. Piezas (una PR cada una, en este orden)

| # | Pieza | Coste | Toca |
|---|---|---|---|
| e1 | **Un solo «Play now».** Welcome lleva la primaria; la tarjeta Guide y la pestaña Play pasan a secundarias hasta que se firme. | M | `openworld/index.html`, guion del tutorial |
| e2 | **Frase única del guía dormido.** Una sola línea de estado, en el sitio del guía. | S | página y módulo del guía |
| e3 | **Controles de mapa en un solo «⋯ Map tools»** (plegable, 44 px). En el pliegue quedan la flecha y «⌂». | M | `world_camera.js` (UI), CSS |
| e4 | **Panel Radio: caminantes y estado crudo a «Technical details».** Las pestañas se ajustan sin cortarse (R4). | S | panel del mapa |
| e5 | **Prueba `atlas/infante_browser.mjs`** con R1–R4 sobre `/`, `/openworld/` y `/chat/`. Primero en rojo sobre main (OpenWorld falla R1, R2 y R4), luego en verde pieza a pieza. Entra en `gate.yml`. | M | `atlas/`, `gate.yml` |

Orden real: **e5 primero, en rojo y declarado.** Después e1 a e4, y cada pieza pone en verde su regla.

## 4. Los 10 rojos «wllama.js» (declarados)

`test_web.py` (`test_cero_rutas_absolutas_ni_ips`) recorre `RAIZ.rglob("*")`. En el árbol principal entra en **`.claude/worktrees/*/public/vendor/wllama/wllama.js`**: son 10 copias, una por worktree anidado de otras sesiones. Por eso salen 10 rojos.

En un worktree limpio desde main: **`test_web` 82/82 OK, 0 rojos.** No son un defecto de lo publicado. Son el gate mirando carpetas que no son del repo.

Propuesta (S): `textos()` salta también `".claude" in p.parts`, igual que ya salta `.git` y `historial`. Hay que enseñarlo primero en rojo: hoy el árbol principal da 10 rojos y con el salto da 0. Antes hay que comprobar que ningún fichero versionado vive bajo `.claude/`, porque el salto no puede tapar nada servido: `git ls-files .claude | grep public` debe salir vacío.

## 5. Fuera de este plano

- **Traducir:** el juego habla solo inglés y no se traduce sin orden.
- **Tocar `atlas-motor.js`.**
- **Puertas nuevas en la INTRO:** el corte D sigue vivo. El enlace a `/chat/` lo decide la Mesa.

Agent: claude-code · Model: claude-opus-5-5
