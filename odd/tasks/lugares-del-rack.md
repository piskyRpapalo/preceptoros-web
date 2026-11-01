# LUGARES DEL RACK EN EL MAPA ÚNICO · concepto (Comisión B de la Mesa) · 2026-11-01

Encargo: la comisión B de la Mesa (buzón #30, 2026-11-01). Lore: el REFRESH DEL LORE del mismo hilo (~10:57Z) y la regla L-074.
Esto es **diseño**, no código servido. Nada de aquí se declara medido; cada lugar nace en `NO_DATA` con su causa.

## 0 · Lo medido antes de diseñar

- **`nodos_ajenos` existía, pero en la carta retirada.** `public/assets/atlas-carta.js:227` (vista en `752338f^`) decía
  `nodos_ajenos: { valor: null, causa: 'la web no llama a ningun servidor' }`. Ese módulo salió con Norte 7 corte D.
  El `atlas.carta/1` vivo (`data/atlas_carta_schema.json`, #536) **no tiene ese campo** (`additionalProperties:false`).
  ✗ **Contradicción preservada**: la puerta del diseño existía en la carta vieja; en la nueva hay que **abrirla por
  enmienda** (§3), sin heredarla en silencio.
- **Celdas disponibles**: medidas sobre el chunk horneado `0_0` (`public/map/chunks/0_0.*.json`, semilla 20261101).
  Las seis posiciones propuestas en §2 son **suelo**, no agua.
- **Cómo se revela hoy** (código medido, `visitor_conquest.js:36`): la niebla se abre por conquista de sesión
  (r=200); el lore cita además casa propia (r=360) y nodos MEDIDO (r = 380 + 160·k).

## 1 · El contrato propuesto: `atlas.lugar/1`

Un lugar es un edificio con identidad en el mapa único. El **dibujo es de la web** (la ley de la división: el nodo
solo elige el tipo y las condiciones). Campos:

| campo | qué es |
|---|---|
| `v` | `"atlas.lugar/1"` |
| `id` | `[a-z0-9-]+`, estable, **sin nombre de host ni de máquina** (SCRUB) |
| `kind` | `rack` · `npc` · `conquest` (§4) |
| `c` | celda axial `[q, r]`. Debe ser suelo en su chunk; si no, se rechaza |
| `form` | forma de `colonia_edificios.js` (`dome` · `tower` · `block`) |
| `frame` | marco bubble < 1,024 B: `t` (nombre), `d` (frase), `role` |
| `seal` | `NO_DATA` · `LIVE` · `STALE`, **medido**, nunca declarado |
| `cause` | obligatoria cuando `seal` ≠ `LIVE` |
| `since` | tick del primer enlace verificado, o `null` |

Lo que nunca va en un lugar: IPs, hostnames, rutas, claves privadas o telemetría sin firma.

## 2 · Los tres lugares del rack (nombres de la casa, no de la máquina)

| id | qué PC del rack representa (solo en este doc privado) | celda | forma | frase bubble (`frame.d`) |
|---|---|---|---|---|
| `pocket-lighthouse` | el teléfono de referencia (Doogee S110) | `5,-1` (moss, h2) | `tower` | «The pocket lighthouse: the phone every frame is measured on. Dark until it links.» |
| `sovereign-hall` | el cerebro central del rack | `-5,4` (rock, h3) | `block` | «The sovereign hall: where the rack thinks and signs nothing. Dark until it links.» |
| `the-oven` | la estación de cómputo pesado | `1,-6` (sand, h1) | `dome` | «The oven: heavy computing, sealed doors. Dark until it links.» |

Celdas de reserva para más nodos, todas medidas como suelo: `6,-5` · `-4,-2` · `-1,6` · `4,2` · `-6,2`.

Mientras un PC no enlace, su lugar se pinta como **contorno apagado**: la forma en `NO_DATA`, con patrón de trama y
sin color de sello. La frase lo dice: «Dark until it links.»

## 3 · Cómo un nodo «enciende» su lugar (sin cuentas, sin servidor)

1. **Enmienda de `atlas.carta/1`** (pieza propia): campo opcional `places: [atlas.lugar/1]`. Es la puerta que
   `nodos_ajenos` dejaba abierta. La carta lista los lugares y su celda; el horno (`hornea_chunks.mjs`) los valida.
2. **El enlace es un marco firmado, no una sesión.** El nodo publica en `openworld/estado.json` (el mismo canal que ya
   lee la colonia) su entrada `{ id, clave, seal }`. `estado_v2.py` exige ya clave y sello: **sin clave no hay luz**.
3. **Fog-push medido**: cuando el estado trae el lugar con sello `LIVE` y su clave verifica, la niebla se abre en
   r = 380 + 160·k alrededor de su celda (la fórmula que el lore cita como ya medida), y el registro lo dice:
   «The pocket lighthouse is lit · LIVE since tick N». Si el sello envejece: `STALE` con su Δ. Si falta: `NO_DATA` con causa.
4. **Ninguna cuenta interviene.** El visitante ve el lugar encendido; no lo controla. El HITL sigue igual: lo que
   requiere firma muestra el `?` (#537) sobre el lugar.

## 4 · La misma puerta para el resto de edificios (diseño, L-074)

- **`npc`, edificios que viven en la niebla**: fijos en celdas de los bordes del conocimiento. Solo se revelan por la
  actividad de visitantes **sin cuenta** (el lore). Hoy es `unbuilt_mechanic` (RC-15: fog-push NO_DATA). No se activa
  sin firma y balance del lab.
- **`conquest`, edificios con paredes-mensaje**: derrotar su reto NPC (el duelo JN-4 ya vive) da derecho a **un
  mensaje en sus paredes** (`pared.mensaje/1`, <1,024 B, firmado por la cuenta efímera de la visita). La memoria del
  nodo lo sostiene; si el pilar cae, el mensaje vuelve a niebla, pero no se borra.
- **Campamentos L-068, captura en ruta, caravanas firmadas**: entran por `kind` nuevos solo con enmienda y firma.
  Aquí quedan nombrados, no activados.

## 5 · Piezas que abre (en orden)

1. Enmienda `places` de `atlas.carta/1` + `data/atlas_lugar_schema.json` (1 caso bueno + 6 violaciones), y el horno
   que los valida contra el suelo.
2. El pintor dibuja los lugares apagados, con la forma de `colonia_edificios`, patrón y frase.
3. La lectura del estado: un lugar `LIVE` con clave verificada abre su niebla, con recibo en el registro.
4. `pared.mensaje/1` sobre los edificios de conquista.
