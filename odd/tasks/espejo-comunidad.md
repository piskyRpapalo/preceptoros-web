# La web, espejo de la comunidad · el mapa de lo que falta

Fecha: 2026-11-02. Orden del Soberano: «la web debe ser el espejo de la comunidad, fácil y accesible; trae el mapa con
las modificaciones que falten: MCPs, enlaces, motores de lectura, vías de comunicación». Solo funciones de web, app y
accesibilidad. Base medida: web `e378fe10`, app `0900d85`. Cada fila se comprobó con `git grep` sobre `origin/main`
antes de escribirla; lo que ya existe se cita y **no** se vuelve a construir.

## 0 · Lo que ya está (no se propone otra vez)

Rotación de la vista y zoom anclado al cursor (`map_zoom.js`, con `getCoalescedEvents`) · cerebro local de 5 bloques
del mismo origen verificados por SHA-256 (`map_chat.js`, `web_node_brain.js`) · sonido nativo de los cuadros con
armónicos (`bubble_sonify.js`, desde 28-oct) · panel de voces por categorías (TF-2, #587) · texto familiar con lo
técnico plegado (TF-1, #580) · servidor MCP local de la web por stdio (`bin/mcp_preceptoros.py`, herramientas
`web.*`) · `llms.txt`, `sitemap.xml` (8 rutas, todas existen) · saltos «skip to» en 4 páginas.

## 1 · Roto o desfasado hoy (se cura primero: es lo que un visitante ya ve)

| # | Hallazgo medido | Por qué importa | Cura (una pieza, un PR) |
|---|---|---|---|
| R1 | `public/mcp-manifest.json` ofrece 6 acciones (`/?action=summon.tc1`…); **ninguna** la atiende el código servido, y su título dice «theGame», retirado en el corte D. `llms.txt` manda ahí a las IAs | una IA que visita sigue 6 enlaces muertos | reescribir el inventario con las acciones que **existen** hoy (abrir mapa, despertar el guía, escuchar, descargar y verificar la app); test: cada enlace resuelve a un elemento real |
| R2 | «Get the app» ofrece la release **v1.3 (2026-08-31)**; la app lleva **413 commits** después; `cerebros[].sha256 = null`, `descargas = {}` | la puerta de entrada de un nodo nuevo enseña un paquete de hace dos meses | release nueva con manifiesto de hashes (ver C3); la página lee el manifiesto, no una cifra escrita a mano |
| R3 | la web enlaza 3 repos (web, app, lab); **no** enlaza `study` ni el registro público de colaboradores | la comunidad no encuentra la puerta para declararse | un bloque «Join» con las puertas públicas y qué se hace en cada una (C1) |
| R4 | el instalador habla solo castellano (lo dice la propia página) | una persona que no lo lee no instala | mensajes del instalador en inglés, castellano como segunda lengua |

## 2 · Motores de lectura (accesibilidad: oír y entender sin ver)

| # | Pieza | Medido hoy | Diseño |
|---|---|---|---|
| L1 | **Read aloud** en la web | web: 0 usos de `speechSynthesis`. App: ya existe en `interface/face/face_hud.js` (solo voces **locales** `localService`, solo tras gesto de confianza `isTrusted`) | portar ese patrón, no inventarlo: botón «Read aloud» que lee la frase `r` de cada cuadro visible y la voz activa del panel. Solo voces locales: el texto no sale del aparato. Sin voz local → `NO_DATA: no local voice on this device` |
| L2 | **Describe what I see** | 0 | orden de lectura de la escena: cerca → lejos, izquierda → derecha, desde `map_scene.js`; una frase por cuadro, sin cifras salvo que se pidan |
| L3 | **Sonido para todo cuadro** | los cuadros sin armónicos dicen `sound=NO_DATA` (`comic_atoms.js`) | cada banda nombrada con su timbre; un cambio de estado con su gesto (sube = mejora, baja = empeora). El sonido nace del mismo cuadro que el dibujo: no pueden contradecirse |
| L4 | **Mano de audio al caminar** | 0 | con flechas, cada casilla suena según su banda (agua, arena, musgo, roca) y un nodo vivo suena distinto de uno dormido |
| L5 | **Contraste y quietud** | `prefers-contrast` en 1 fichero; `forced-colors` en 4 | paleta de alto contraste derivada de las mismas bandas (la marca no cambia), y una versión quieta de cada animación con la misma composición |
| L6 | **Lengua** | 0 `hreflang`; el juego habla solo inglés | no se traduce sin orden; se prepara la costura (`lang` por texto y `hreflang` cuando haya segunda lengua) |

## 3 · Comunidad: que la web refleje a quien construye

| # | Pieza | Medido hoy | Diseño |
|---|---|---|---|
| C1 | **Join** | sin enlace a las puertas de colaboración | una sección corta: *qué es una contribución aquí* (docs, medición, código), *dónde se declara* (registro público de colaboradores), *qué se firma y qué no*. Las tres reglas, enlazadas al contrato |
| C2 | **Quién sostiene el sistema** | el mapa pinta nodos de `estado.json`; los colaboradores no aparecen | cada colaborador declarado aparece como **terreno** en el mapa, con su emblema desde su clave pública y su estado medido o `NO_DATA` con causa. La web lee un fichero estático publicado por el registro: cero peticiones al cargar |
| C3 | **Descarga verificable por la persona** | `.sha256` sueltos para modelos; ningún manifiesto común | un manifiesto único (paquete, tamaño, SHA-256, fecha, máquina) que la página lee y la app re-verifica al arrancar con una pantalla «arrived intact» que enseña el mismo hash |
| C4 | **La prueba del nodo online** | 0 | recorrido completo y recibido: descargar → verificar → firmar la llegada (HITL) → el terreno aparece en el mapa. Mientras no ocurre: «asleep», nunca inventado. Es también la prueba de la app como harness |
| C5 | **Opinar** | `opiniones/` tiene contrato y verificador, pero **ninguna** superficie en la web desde que se retiró el juego | volver a abrir la vía: escribir una opinión, firmarla en el aparato y elegir el canal (Copy, Download). Sin servidor |

## 4 · Vías de comunicación (todas sin servidor, todas a elección de la persona)

| # | Vía | Medido hoy | Diseño |
|---|---|---|---|
| V1 | **Compartir** | 0 `navigator.share` | «Share» nativo del sistema para un sobre firmado o un enlace al mapa; sin él, Copy y Download como hoy |
| V2 | **Novedades** | 0 feeds | un `feed.xml` estático generado en el sello: qué cambió en cada letra, en frases humanas. Se sigue sin cuenta |
| V3 | **Contacto** | 0 | una dirección pública o el registro de colaboradores, no un formulario (un formulario es un servidor) |
| V4 | **Entre pestañas** | 0 `BroadcastChannel` | el mapa y la terminal del aparato se avisan entre sí sin red (p. ej. «el guía despertó») |
| V5 | **MCP público** | el servidor stdio existe pero la web no dice cómo usarlo | una página «For AI agents»: el comando para arrancar el MCP local, sus herramientas y qué **no** hace (no firma, no escribe fuera). Va con R1 |

## 5 · Medir la belleza (no suponerla)

| # | Pieza | Medido hoy | Diseño |
|---|---|---|---|
| B1 | **Recibo de fluidez** | 0 `PerformanceObserver` / LoAF | en «Technical details»: fps y fotogramas largos de esta visita, guardados solo en el aparato, comparables con la vara del teléfono de referencia |

## Orden propuesto

1. **R1 + V5** (la IA que visita deja de chocar con enlaces muertos). 2. **L1 → L2 → L3 → L4** (el hueco que más pesa
para una persona invidente). 3. **C3 → R2 → C4** (la descarga verificable es la base de la prueba del nodo). 4. **C1 →
C2 → C5** (la comunidad se ve y puede hablar). 5. **L5, V1–V4, B1, R3, R4** en piezas pequeñas.

Cada pieza: un nivel lógico declarado, un cambio medible, una prueba que primero se ve en rojo. Todo cambio en
`public/` re-sella con la letra que asigne la Mesa.

## Log

- 2026-11-02 · mapa medido y escrito; nada construido. Corrección registrada: la sección de audio de #590 afirmaba que
  no había sonificador de cuadros; sí lo hay (`bubble_sonify.js`), corregido en la cabeza `80b450df`.
