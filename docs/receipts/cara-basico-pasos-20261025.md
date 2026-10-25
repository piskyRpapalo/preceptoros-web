# Cara Neutral (`/face/basic.html`) · textos de los seis pasos y prueba offline

Fecha: 2026-10-25. Recorrido en el sitio vivo (`https://preceptoros.org`), navegador real, sin editar nada del servidor.
Alcance: solo lectura del texto que muestra la cara; el único estado que se crea es el del propio dispositivo de prueba (clave de la cara, un huevo, un combate, una elección de nodo).

## Textos de cada paso

El panel «Tutorial» muestra la línea de paso y la lista de seis tareas. El chat del Preceptor muestra la instrucción. Se copia el texto tal cual aparece.

| Paso | Línea del panel | Instrucción en el chat | Cómo se completa |
|---|---|---|---|
| 1 | `Step 1 of 6: Your key.` | `Step 1: create your key. It signs every egg and every adoption. Tap the highlighted Profile icon, then Create my key.` | Perfil → «Create my key». Tras pulsar, la lista marca «Your key: done». |
| 2 | `Step 2 of 6: The beacon.` | `Step 2: walk to the beacon. Tap the highlighted star, accept, then tap the path icon.` | «Task 1: the beacon» → «Accept» (chat: `Task accepted: a path to the beacon` / `A dashed path is drawn to the beacon. Tap it, or tap the path icon.`) → «Follow the path». |
| 3 | `Step 3 of 6: An egg.` | `Step 3: summon an egg. In your Profile, tap the highlighted Level 1 egg. It incubates for 20 cycles.` | Perfil → «Summon an egg, Level 1: 50 copper, hatches in 20 cycles». |
| 4 | `Step 4 of 6: Hatch · waiting for the egg.` | `Step 4: when the egg at the top is ready, tap it. It hatches and joins your Army.` | Esperar la incubación (≈30 s en el recorrido) y pulsar el huevo «Egg Level 1: ready. Tap to hatch and adopt.» (chat: `An egg is ready. Tap it at the top to hatch and adopt it.`). |
| 5 | `Step 5 of 6: A battle.` | `Step 5: open Battle and fight the highlighted Reef patrol. The battle plays by itself.` | Pestaña Battle → «Reef patrol · 2 waves · Level 1». El combate se resuelve solo; el paso se cierra al terminar. |
| 6 | `Now: Your node.` (ver hallazgo 1) | `Last step: choose your node. Hexelion and Doggee share the same numbers and show them with different eyes.` | «Node Hexelion · the underwater world» o «Node Doggee · the survival terminal». Elegir Hexelion carga `/face/atlantis.html`. |

Texto de bienvenida y del tutorial en la cara (sin paso): `The tutorial starts on the Neutral map. It gives copper for your first eggs.` (en `atlantis.html` y `zombie.html`).

## Prueba offline (red real, no caché)

Método: service worker ya controlando la página (`navigator.serviceWorker.controller` no nulo); después `context.setOffline(true)`. Un control negativo cuenta como prueba: un `fetch` a una ruta que no está en caché debe fallar.

| Comprobación | Resultado |
|---|---|
| Control: `fetch('/no-cacheado-…txt')` con la red cortada | `Failed to fetch` (la red está cortada) |
| `/face/basic.html` | 200, `fromServiceWorker: true`, título `Preceptor · Neutral` |
| `/face/atlantis.html` | 200, `fromServiceWorker: true`, título `Preceptor · Atlantis for children` |
| `/face/zombie.html` | 200, `fromServiceWorker: true`, título `Preceptor · Zombie terminal` |
| `/en/` | 200, `fromServiceWorker: true`, título `preceptoros` |

Las tres caras funcionan sin red después de la primera visita. La prueba anterior de solo caché (`caches.match`) no bastaba: esta es la que pidió el decreto.

## Hallazgos (sin cambiar, para decisión)

1. **El último paso pierde el contador.** En los pasos 1-5 la línea dice `Step n of 6: …`. En el paso 6 dice solo `Now: Your node.` y desaparece el «n of 6». Es inconsistente, pero el decreto fija «no count change anywhere»; se deja registrado para el Mesa.
2. **Elegir nodo navega a otra página.** La elección de Hexelion lleva a `/face/atlantis.html`. El recorrido de la cara termina ahí; no hay una pantalla de cierre dentro de `basic.html`. Es el diseño actual, no un fallo, pero conviene saberlo para la prueba de cinco minutos.
3. **Sin código fuente de la cara en el repo.** `public/face/` no está en este checkout (ni en `main`, ni en `claude/web-solo-juego`). Los textos se leyeron del sitio vivo; por eso este documento es el registro de los textos, no una referencia al código.
4. **El botón «Create my key» tiene dos coincidencias** (cabecera y tutorial). En pruebas automatizadas hay que acotar por clase (`button.tut-target`).

## Verificación de la señal de práctica (repo, local)

Mismo recorrido en `/en/` servido localmente desde `public/` con la rama de esta entrega:

- Arena 101: antes de resolver → `Cause: practice result not verified yet`; tras «Resolve practice» → `Next: press "Continue tutorial" in the practice fight to record its verified result.`, sin causa, «Continue tutorial» activo.
- Camp: mismo comportamiento (ronda 7, «Resolve practice» → `Next` de Continue, sin causa).
- Tras «Continue tutorial» en Camp, el tutorial pasa a `Next: press "Prepare local label"…`, paso 7 de 9.

Cadena de sello con VERSION intacta (`preceptoros-2026-17-abjc`): `arnes_sw` 22/22, `test_web` 78 OK (1 saltado), `en301_*` 54/54.
