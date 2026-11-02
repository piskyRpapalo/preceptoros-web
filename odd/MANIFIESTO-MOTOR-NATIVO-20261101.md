# MANIFIESTO DEL MOTOR NATIVO · adaptado a la ley medida (E1-E4 + super addenda) · 2026-11-01

Fuente: el manifiesto del Soberano de hoy («motor nativo, arena de benchmarks y mercado A2A», con los dos super addenda).
Aquí se escribe **qué se construye, dónde vive y qué se corrige**. Todo es nativo de PreceptorOS: ninguna línea ajena;
procedencia en la Rosetta (study#95). Se ejecuta con `odd/PROTOCOLO-NODO-WEB.md`.

## 0 · Correcciones medidas (contradicciones preservadas)

- **«≤ 16 KiB por módulo»**: abolido por `DECRETO-TECHO-NUEVO-20261101`. Queda como métrica de eficiencia; el techo es
  el Doogee más 25 MiB por bloque.
- **`world_camera.js`**: `/openworld/` no lo carga. La colocación única es `colonia_pagina.js → geometry()`, y ahí viven
  el pan (#548) y el giro (#556).
- **E1 con un cerebro de ~1 GB**: hoy no. Los 105 MB de SmolLM2 en 5 bloques ya hablan, sin red incluida (#543 en main,
  #557). Los modelos mayores entran uno a uno, medidos antes en el S110.
- **Colores del snippet** (`rgba(...)`, `'#ffffff'`): prohibidos por el barrido. Se calculan desde `comic_tokens` y
  `palette_cycle`.
- **120 Hz**: la vara medida hoy es de 57.9 fps a 60 Hz en el S110. 120 Hz es NO_DATA hasta medir la tasa de refresco del panel.
- **Mercado A2A con relay/P2P y PvP entre nodos**: necesitan relevos o WebRTC, que están en la lista de «busca firma
  antes de construirse». Hasta que haya firma en el LIBRO, son **diseño**. Lo que se construye ya es la parte local:
  el benchmark del propio dispositivo.
- **«Moneda»**: palabra vetada. El cobre es un recurso de juego auditable, no dinero.

## 1 · Lo que se construye (un PR por pieza)

| pieza | PR | estado |
|---|---|---|
| Cerebro del nodo web en 5 chunks | #543 | en main |
| Modo avión y panel con «Next:» | #557 | abierto |
| Edge chunks: borde inmutable, 19 chunks y `budget` | #555 | abierto |
| Órbita y zoom anclado (getCoalescedEvents) | #556 | abierto |
| Guía con herramientas (gramática desde el registro; nunca firma) | en construcción | — |
| Motor 3.5D: suelo horneado en ImageBitmap, edificios que respiran, burbujas con volumen, neblina de datos | en construcción | — |
| Arena del Laboratorio: cada modelo de `cerebros.json` es un edificio cuya altura es su medida, más un benchmark del propio dispositivo | en construcción | — |
| La invocación vive: partículas con física, sonido de la casa, túnel hexagonal | en construcción | — |
| Guía propio: LoRA de la casa sobre SmolLM2-135M, medido contra la base | en construcción | — |

## 2 · Lo que queda como diseño (con su puerta)

- **Seats A2A** (openrig, como idea): cada `atlas.lugar/1` es un asiento con dirección fija (`odd/tasks/lugares-del-rack.md`).
- **Carriles de trabajo en el mapa** (agent-orchestrator, como idea): ⚒ trabajando, `?` necesita al carbono, ✓ listo,
  leídos de `estado.json`.
- **Paquetes de burbuja firmados entre nodos**: Ed25519, con recibo `preimage → verify → apply`. Entran con la firma del
  relay o del WebRTC.
