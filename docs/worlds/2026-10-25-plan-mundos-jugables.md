# REQUIERE_FIRMA · Plan de los dos mundos jugables (ronda 1 · issue #312)

Estado: **PROPUESTA**. Nada de código en este PR. Nada se construye hasta el FIRMO de la Mesa.
Norte fijado por el encargo: **los dos mundos de nodo jugables en preceptoros.org, hasta el despliegue final.**

Procedencia de las cifras: medidas el 2026-10-25 sobre `origin/main` (bb8d56a) con `stat`/`wc -c`, y
leídas de `arnes_sw.mjs`, `public/sw-listas.js`, `EXCEPCIONES.md`, `AGENTS.md`. Las cifras del
encargo que no se volvieron a medir aquí se marcan **[encargo]**.

---

## 0 · Lo que ya existe (medido)

| Fichero | Bytes | Techo 16.384 B (regla de la ronda) |
|---|---|---|
| `public/face/face_world.js` | 15.918 | **466 B libres** |
| `public/face/face.js` | 15.799 | 585 B libres |
| `public/face/face.css` | 13.850 | 2.534 B |
| `public/face/atlantis.html` | 13.088 | 3.296 B |
| `public/face/zombie.html` | 13.337 | 3.047 B |
| `public/face/basic.html` | 12.993 | 3.391 B |
| `face_hud.js` 8.400 · `face_battle.js` 7.638 · `face_tutorial.js` 7.185 · `face_eggs.js` 7.043 · `face_paint.js` 7.212 · `face_army.js` 6.156 · `face_fight.js` 5.848 · `face_workshop.js` 5.062 · `face_panel.js` 4.437 · `face_hero.js` 1.474 | | todos bajo techo |

- Los tres sabores (`basic`, `atlantis`, `zombie`) ya se sirven desde `public/face/`. La cara ya tiene
  un recorrido guiado: tarea → línea discontinua → contador de distancia → el cangrejo camina en pantalla →
  llegada enciende el lugar (`docs/receipts/cara-basico-pasos-20261025.md`).
- `face_world.js` define `worldSize = 1000`, `tile = 12`, cinco lugares (`beacon`, `reef`, `rift`, …),
  rutas dibujadas a mano, niebla y contador. Ya **sí** tiene un mapa de 1000 unidades.
- El joystick ya mueve el cangrejo libremente (`docs/fusion-or-oneshot/2026-10-26-claude.md`, línea 102).
  **Por tanto el “mundo jugable” de hoy no es un vacío: es un recorrido de seis pasos sobre un solo mapa
  neutro.** La brecha real es que los dos mundos de nodo no tienen terreno ni recorrido propios.
- Precache: los doce ficheros de `public/face/` están listados en `public/sw-listas.js` (líneas 25–42).
- Conteo de rutas: `arnes_sw.mjs:203` comenta **218** tras añadir `/face/` (2026-10-25). El encargo dice
  **219 entradas / 218 únicas** [encargo]. Hay que reconciliar esa diferencia antes de sumar nada (ver §3).
- Presupuesto gzip: `bin/mcp_preceptoros.py:118` compara `gzip_initial_b < 153600`. La cifra **110.678 B**
  es del encargo [encargo]; no se re-midió en esta ronda.

## 1 · Definición de «mundo jugable» (primera versión honesta)

Un nodo (`atlantis.html` o `zombie.html`) es **jugable** cuando, abriéndolo sin red después de una
primera carga:

1. **Terreno propio del nodo.** El mapa de ese nodo tiene su propio terreno (no el mapa neutro compartido).
2. **Movimiento libre con animación de paseo.** El cangrejo (o su equivalente en zombie) camina
   con cuadros de paso (un paso por cuatro fotogramas, sin reloj de pared, como ya hace la cara).
3. **Al menos un lugar del nodo se alcanza y se enciende**, con su línea de radio honesta.
4. **Reducir movimiento** deja al cangrejo llegar de golpe (ya existe el patrón).
5. **Ningún dato inventado:** si el nodo no está emparejado, se muestra `NO_DATA, cause: …`.

Fuera de esta definición en la primera versión: multijugador, combate entre jugadores (decreto
registrado, no construido, `docs/fusion-or-oneshot/2026-10-26-claude.md` línea 353), y el mapa
futuro completo.

**Nombres de los mundos:** el encargo pide «los dos nombres de mundo exactamente como los escribe el
decreto». En el repo aparecen como **Hexelion** (`atlantis.html`) y **Doggee** (`zombie.html`)
(`docs/fusion-or-oneshot/2026-10-26-claude.md`, línea 333). La memoria del nodo escribe
«Doogee» para otro dispositivo. **Pregunta a la Mesa: ¿la grafía del decreto es «Doggee» o «Doogee»?**
Hasta respuesta, este plan no fija ninguno de los dos nombres en UI.

## 2 · Recorte mínimo que aún despliega de verdad

Primera entrega (R2–R4, ver §7):

- **Terreno de nodo** sustituye al mapa neutro solo para `atlantis.html` y `zombie.html`. El
  `basic.html` queda intacto.
- **Paseo animado** en los dos nodos, reutilizando `walk()` y `stateFrame()` de `face_world.js`.
- **Sin** mapa futuro (50 % menor, más espacio) y **sin** nuevos lugares: el mapa futuro queda
  registrado como «grabado, no gastado» (mismo doc, línea 378).

Lo que **no** entra: nuevas mecánicas de combate, cría, grabación de partidas, cambio de nodo en caliente.

## 3 · Techos, presupuesto y conteo de piezas

**Pregunta abierta a la Mesa (bloqueante para R2):** el techo de 16 KiB ¿es regla vigente o
legado?
- `AGENTS.md` (Cercos): «revocado el tope de 16 KiB el 2026-10-11, firma D2» → el techo duro es 25 MiB por fichero.
- `CLAUDE.md` del repo: los 16 KiB son «una regla de eficiencia, modificable por la Mesa (D-B, FIRMO 2026-10-22); no son un límite de seguridad».
- `EXCEPCIONES.md` (cabecera): el de 16 KiB «es la regla de legibilidad de la ronda» y cada cruce
  caduca con su huella.
- El encargo de la ronda lo trata como techo de pieza.

**Este plan asume 16 KiB como vinculante** (la lectura más estricta), hasta que la Mesa diga lo contrario.

Impacto:
- `face_world.js` tiene **466 B** libres. Cualquier terreno nuevo dentro de él lo cruza.
- **Partición propuesta (R2):** `face_world.js` (núcleo: lugares, rutas, niebla, contador) +
  `face_world_terrain.js` (datos de terreno por nodo). Precedente: `en301_tutorial_copy.js` (web#310),
  que se sacó del modelo porque «el modelo no cabe en 16 KiB» (`arnes_sw.mjs:204`).
- Cada pieza nueva suma **una** entrada en `public/sw-listas.js`, **una** en la lista de scripts del
  HTML del nodo, y **una** en el conteo de `arnes_sw.mjs` (218 → 219 con la partición; la
  reconciliación 219/218 del encargo va primero).
- Ninguna pieza nueva puede pasar de 16 KiB. El gate es `wc -c` por fichero en `public/face/`.

## 4 · Sellos afectados y secuencia de re-sello

Todo cambio bajo `public/` exige la cadena de `sello-del-juego`. Orden:

1. Listas y conteos primero: `public/sw-listas.js`, `arnes_sw.mjs`, `contadores.py`. Arnés en verde.
2. `python3 bin/sellar.py --sellar --version "$V"` con `V` = la VERSION de `origin/main`. **Nunca sin `--version`.**
3. `python3 atlas/mundo.py` (`version_sw`, `gzip_juego_b` < 153.600).
4. `node atlas/arnes_piloto.mjs`, de nuevo `contadores.py` y `sellar.py`.
5. `python3 test_web.py && node arnes_sw.mjs`.

Ramas que sellan en paralelo suben a la misma VERSION: **quien fusiona último re-sella**.
Este PR de plan no toca `public/` y **no necesita sello**.

## 5 · Impacto en el service worker offline

- Las piezas nuevas de terreno y los cuadros de paseo entran en `sw-listas.js` **antes** del sello,
  para que la precarga sea honesta: si no están precargadas, el nodo no abre sin red.
- `arnes_sw.mjs` debe comprobar que cada fichero nuevo está en la lista de precarga y que el nodo
  carga sin red tras una primera visita.
- El dato de terreno no se pide por red en ningún caso (cero red nueva).

## 6 · Criterios de aceptación (los mide el faro y los ojos)

Cada uno con **medida o `NO_DATA, cause`**:

1. `wc -c` de cada fichero de `public/face/` < 16.384 B. (medido por `arnes`/gate)
2. Cero peticiones de red al cargar cada nodo, tras la primera visita. (navegador, lista de peticiones)
3. Sin red tras la primera carga, el nodo abre y el cangrejo camina hasta un lugar. (prueba offline)
4. Recorrido de paseo: el cangrejo llega a cada lugar del nodo; cuadros de paso cada cuatro fotogramas. (prueba unitaria sin reloj)
5. Con movimiento reducido, llegada de golpe. (prueba con `prefers-reduced-motion`)
6. Ancho 360 px sin desbordamiento horizontal (`innerWidth 360 = scrollWidth 360`), objetivos ≥ 44 px.
7. `basic.html` sin cambios de comportamiento (su recorrido de seis pasos sigue igual).
8. Conteo de rutas reconciliado (219 / 218 o el valor que la Mesa fije).
9. Cadena de sello completa, VERSION intacta.

## 7 · Plan ronda a ronda (cada pieza cabe en una ronda)

| Ronda | Entrega | Gate de salida |
|---|---|---|
| R1 (esta) | Este plan, docs PR | Mesa FIRMA |
| R2 | Partición de `face_world.js` en núcleo + `face_world_terrain.js`, sin cambio de comportamiento | arnes verde, `wc -c` < 16 KiB cada uno, sello |
| R3 | Terreno propio de `atlantis.html` (sin mapa futuro) | criterios 1–3, 6, 8, 9 |
| R4 | Terreno propio de `zombie.html` + cuadros de paseo en ambos | criterios 2–5, 9 |
| R5 | Mapa futuro (50 % menor) **solo si** la Mesa lo firma | criterios completos |
| R6 | Despliegue: verificación en preceptoros.org | ojos y faro |

## 8 · Preguntas para la Mesa (no se contestan con suposiciones)

1. ¿El techo de 16 KiB es regla vigente o legado tras D2? (§3)
2. ¿Cómo se escribe el nombre de cada mundo: «Doggee» o «Doogee»? (§1)
3. ¿Cuál es la cifra correcta de entradas de ruta: 218 (`arnes_sw.mjs`) o 219 (encargo)? (§0)
4. ¿R5 (mapa futuro) entra en el norte o queda para después del despliegue? (§7)

## Optimización propuesta

Medida antes/después: `face_world.js` pesa 15.918 B. Partirlo en R2 deja el núcleo en
~15.000 B con margen y el terreno nuevo en su propia pieza; el siguiente terreno no cruza el techo.
Se valida con `wc -c` antes y después de R2.

## Siguiente paso recomendado

Con FIRMO de esta propuesta, R2: la partición de `face_world.js` sin cambio de comportamiento.
Antes, responder a las preguntas 1 y 2 de la §8.
