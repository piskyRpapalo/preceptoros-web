# PRÓXIMOS CAMBIOS · por orden de prioridad · cierre de sesión 2026-11-01

Director: claude, sesión del rack (soberano). Norte: `/openworld/` es el **nodo web tutorial, triple AAA medido en el
Doogee S110**. Método: `odd/PROTOCOLO-NODO-WEB.md` (en main). Plan adaptado: `odd/MANIFIESTO-MOTOR-NATIVO-20261101.md` (#559).
Main al cerrar: `040001cb`, VERSION servida `ct`.

## P0 · Fusionar el tren abierto (en este orden)

Cada fusión deja a los demás BEHIND/DIRTY. Se rebasa **uno** (el siguiente), se re-sella por encima de la VERSION
servida, la Mesa sirve HITL y se fusiona con `gh pr merge --merge` (nunca `--admin`).

| # | PR | qué | por qué en este orden |
|---|---|---|---|
| 1 | #550 | Dos clics: de Google a jugar, con cuenta firmada y 100 de cobre | la puerta del visitante |
| 2 | #552 | Ojo de carbono: 0 objetivos de menos de 44 px, `/creation.html` sin excepciones | limpieza para cualquier carbono |
| 3 | #548 | Caminar libre celda a celda (Enter entra en el edificio) | jugabilidad base |
| 4 | #556 | El mapa gira y el zoom se ancla al dedo (apilado sobre #548) | depende de #548 |
| 5 | #563 | Motor 3.5D: suelo horneado en bitmap, edificios que respiran, burbujas con volumen | rendimiento antes que más capas |
| 6 | #561 | La invocación vive: partículas, sonido, túnel hexagonal | sensación de juego |
| 7 | #551 | La pantalla en una burbuja (< 1 KB) y la radio la lee | contexto para el guía |
| 8 | #562 | El guía con herramientas (gramática; nunca firma) | usa #551 |
| 9 | #560 | El guía propio: LoRA medido 33/52 frente a 5/52 | segundo modelo |
| 10 | #564 | Arena del Laboratorio: edificios = medidas de `cerebros.json` | barrio nuevo |
| 11 | #555 | Edge chunks: borde inmutable, 19 chunks, `budget` en la carta | mundo más grande |
| 12 | #559 | Manifiesto adaptado (solo texto) | registro |

Y en study: #95, la Rosetta de las tres fuentes.

## P1 · Medir en el sitio vivo (cuando el P0 esté desplegado)

1. Pasada completa en el **Doogee S110** por CDP (`adb forward tcp:9333 localabstract:chrome_devtools_remote`):
   dos clics → caminar → girar → hablar con el guía (base y LoRA) → cobre → invocar → Arena. Registrar FPS, p95, LoAF y
   primera escena (T1/T2), y el modo avión real.
2. Ajustar el `budget` de la carta y el horneado según el FPS medido, no por gusto.
3. TalkBack: lectura completa por las manos del carbono (T5). Hasta entonces, NO_DATA.

## P2 · Cosas pendientes con causa

- **El guía con la pantalla**: pasar `preceptorScreen()` (#551) como contexto del guía, para que sugiera estrategias según lo que el visitante ve.
- **Escala suelo/nodos**: los nodos se dibujan al doble de espaciado que las celdas del suelo; solo la cabaña cae exacta (hallazgo de #548).
- **Arena**: puertas en el canvas cuando exista un pan de cámara que llegue a sus celdas (hoy, puertas plegadas bajo el mapa).
- **Army**: mostrar los nombres de las tropas sin palabras españolas en el código servido (hoy solo el número).
- **`docs/PRUEBA_5_MINUTOS.md`**: reescribirlo para `/openworld/` (está desfasado: cita `/play/` y `/face/`).
- **`docs/lexicon.md:84`** y el inventario #547 aún citan nombres retirados por el decreto p0: son historia, no se sirven; decidir si se anotan.

## P3 · Diseño que espera firma (no se construye sin ella)

- Mercado A2A con relay o WebRTC, y PvP de benchmarks entre nodos (lista «busca firma» del CLAUDE.md).
- Lugares del rack encendidos por enlace firmado (`atlas.lugar/1`, `odd/tasks/lugares-del-rack.md`): enmienda `places` de la carta.
- NPCs en la niebla, paredes-mensaje (`pared.mensaje/1`), caravanas firmadas: L-074, con balance del lab.
- La «boca Hexelion» por `api.preceptoros.org`, solo en envío explícito.
- Modelos mayores (> 105 MB): uno a uno, medidos antes en el S110.

## Recordatorios de ley

- VERSION siempre creciente.
- Un PR por pieza, con su rojo enseñado por sabotaje.
- Captura a 390 px mirada.
- Cero peticiones externas.
- Decreto p0.
- Las claves de búsqueda en `odd/tasks/claves-del-rack.md`.
