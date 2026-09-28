---
id: post-verificacion-sisil-cria
titulo: AUDITORÍA · addendum SISIL + Sovereign Brood (la cría soberana) contra la verdad del rack y lo firmado
tipo: auditoria
clase: propuesta
fecha: 2026-09-28
editor_autorizado: carbono
estado: PENDIENTE DE FIRMA para lo marcado REQUIERE_FIRMA · validadores puros de cría y genoma se construyen (orden del Soberano)
---

# Auditoría · SISIL + la cría soberana

> El addendum amplía el prompt principal y no revoca ningún invariante. Regla por defecto: **la máquina mejora propuestas, la persona adopta mejoras, la persona invoca y adopta tropas, y el silicio no firma**. «Do not automate creation; automate understanding.»

## §1 · Verdad del rack de la cría (medida)
| Afirmación del addendum | Rack | Estado |
|---|---|---|
| Tropas como datos de Fourier: `k, ax, ay, fase` enteros; stats; rareza; prefijo; sufijo; semilla | `game/gacha.js` › `tirada(semilla, tc)` → `atlas.tropa/1` | HECHO |
| Huevo → morfismo → tropa por interpolación | `gacha.mezcla` (lerp término a término) | HECHO. Solo es dibujo: el lerp usa decimales, pero no tiene autoridad sobre el estado |
| Invocar es solo humano | `atlas.accion/1` no incluye `invocar`; `ui.js` firma `atlas.invocacion/1` ANTES de pagar | HECHO |
| Adopción con firma verificada | `db.js › adopta`, único camino de escritura | HECHO |
| El Army vive en memoria | `db.js` | HECHO. Persistirlo → REQUIERE_FIRMA |
| Incuba en ciclos, no en reloj | `ui.js`: `hasta = ciclo + incuba`; avanza con `instantanea().ciclo`. El motor avanza `t` solo en `ciclo()`; `dormir()` **no** avanza `t` | HECHO: el huevo no avanza ni con el reloj ni durmiendo |
| Semilla = sha256 de la firma humana | `db.js › semillaWeb` | HECHO; declarada no-VRF |
| Rareza con pesos enteros | `valores.tcs[tc].calidad` = [único, raro, mágico] **por mil**; normal = el resto | HECHO |
| Odds visibles | La incubadora **no mostraba** las odds | **Choque con «no undisclosed odds»** → se arregla (§3) |
| Lotería sin sesgo | `gacha.mil()` = `sig() % 1000`: sesgo de módulo medido ≤ 296/2³², unos 7·10⁻⁸ por resultado | Se DICE y no se cambia: cambiar la tirada cambia todas las tropas ya adoptadas → calibración de cría → REQUIERE_FIRMA. Lo nuevo usa rechazo (odds exactas) |
| El huevo se reproduce desde ley + semilla + ciclos | La invocación firmada no viaja en la partida exportada (solo `invocar` con su coste) | NO_DATA → PROPUESTA: `atlas.brood_evidencia/1` |
| Packs declarativos | `valores.js` es solo datos; no hay packs de terceros | Validador de pack de cría: HECHO en esta ronda (`cria.js`); cargar packs → PROPUESTA |

## §2 · Conflictos y resolución
| # | Choque | Resolución |
|---|---|---|
| 1 | SISIL propone desde evidencia firmada que la web no envía sola (LLB → REQUIERE_FIRMA, ver la auditoría MGNO §2.1) | La evidencia llega al laboratorio por export manual (Export, Copy, Send). El bucle SISIL vive **fuera de `public/`** |
| 2 | «Farming points» | No se crea moneda: todo se mide en recursos del motor (luz, biomasa, cobre, flujo, oxígeno) |
| 3 | Tabla de rareza por profundidad o fase | Hoy la rareza depende solo de la TC. Añadir profundidad o fase = calibración → PROPUESTA con firma |
| 4 | Mandato permanente | Por defecto no hay mandato. La cría queda **excluida** de todo mandato salvo firma estrecha y explícita |
| 5 | Idioma | El juego va solo en inglés. La línea de odds nueva va en `atlas-en.json` |

## §3 · Lo que se construye en esta ronda (rebanada pura)
- `game/genoma.js`: genoma = datos enteros acotados. Valida dominios permitidos (§4 del addendum) y rechaza los prohibidos (§5), los campos desconocidos y los decimales. Da la codificación canónica y el `param_hash`.
- `game/cria.js`: valida el paquete de cría y sus partes:
  - tablas de rareza (pesos enteros; odds en puntos básicos exactos);
  - afijos (exclusiones, máximo por rareza);
  - presupuesto de stats (mínimo y máximo por stat, tope por rareza y TC);
  - curvas de incubación (solo ciclos, ningún campo de reloj);
  - restricciones de armónicos.
  
  Además rechaza `invocation_permission`, `auto_invoke`, `auto_adoption_troop`, `wall_clock_timer`, `real_money`, `money_balance`, `paid_reroll`, `fomo_timer`, `hidden_probability_float` y similares.
- **Odds visibles:** la incubadora muestra, bajo cada tesoro, las odds exactas en puntos básicos, sacadas de los mismos enteros que usa la tirada.
- Casos deterministas en node, con sabotaje en rojo antes del verde.

## §4 · Dominios permitidos · prohibidos (resumen operativo)
- **Permitidos** (datos enteros, acotados y siempre con firma): incubación por TC en ciclos · pesos de rareza por TC · pesos condicionales de afijos · presupuesto de stats · armónicos (número de términos, amplitud, fase, simetría) · proxies de poder y defensa · bandas de ruta y mercado · novedad con enfriamiento · legibilidad.
- **Prohibidos** (el validador los rechaza por nombre y por forma):
  - cambiar quién puede invocar o hacer de una acción humana algo delegable;
  - tocar el enum de acciones, los costes del motor o su física;
  - la firma y su verificación, la red, la persistencia, el precache o los presupuestos de peso;
  - decimales con autoridad y odds ocultas;
  - cualquier reloj de pared;
  - adoptar o invocar solo;
  - dinero real, repetir tiradas de pago, FOMO, rachas que se pierden o cuentas atrás engañosas;
  - URL, rutas, hosts o IP.

## §5 · Modelos de amenaza de la cría
- **Casino:** odds siempre visibles, sin repetición de pago, sin «suerte» que no se pueda reproducir desde la semilla y la ley. Un candidato que sube lo raro a costa de la legibilidad o de repetir eventos → rechazado.
- **FOMO y reloj:** la incubación y la caducidad se miden en ciclos o en épocas firmadas, nunca en `Date.now()`.
- **Invocar o adoptar solo:** imposible por contrato (enum) y por camino único de escritura (`db.js`). El genoma y el pack no pueden codificarlo.
- **Mutar el motor:** los packs son capa superpuesta. Un cambio de coste o de física = PROPUESTA_DE_PARCHE con firma.
- **Contenido remoto:** los packs y la novedad son datos; nunca código, URL ni HTML.
- **Hackeo de la recompensa y sobreajuste del benchmark:** validación y holdout separados por hash; las métricas guardia no pueden empeorar; desempate por hash canónico; ninguna métrica de «enganche» manda.

## §6 · Frontera de persistencia del laboratorio
El Evidence Spine, los genomas activos, las propuestas, las adopciones, el canary y los rollbacks viven en el **laboratorio local** (rack o app), en ficheros del repositorio o del directorio del laboratorio, **nunca en `public/`** ni en el navegador. La web solo importa un pack activado por gesto manual y firmado.

## §7 · Manifiesto de entrenamiento (frontera)
Solo hashes, clases de procedencia (humano, piloto_base, denso, lora, sintético, emulado), referencias de firma y la fase futura (app o rack). Sin pesos, sin datos personales, sin telemetría cruda, sin evidencia de tropas sin firma. **Nunca se entrena en la web.**

## §8 · Presupuesto de bytes
| Módulo | Objetivo | Carga |
|---|---|---|
| `game/genoma.js` | < 10 KB | a demanda (ningún guion lo pide aún) |
| `game/cria.js` | < 12 KB | a demanda |
| `game/ui.js` (+ línea de odds) | +0,5 KB como máximo, bajo 16 KB | con la pestaña Army (fuera de la puerta) |

## §9 · Listas
- **NO_DATA:** evidencia de cría exportable (la invocación firmada no viaja aún); métricas de cría medidas (no hay corpus); ratings de defensa con tropas reales.
- **EMULADO:** ninguno en esta ronda.
- **PROPUESTA:**
  - el bucle SISIL completo: torneo, evaluador, ranker, fábrica de propuestas, puerta de adopción, canary, rollback y manifiesto;
  - `atlas.brood_evidencia/1`;
  - rareza por profundidad o fase;
  - novedad de cría;
  - escalera de delegación (la invocación nunca entra en ella);
  - `nidal.js` y `ui-mejora.js`.
- **REQUIERE_FIRMA:** cambiar la tirada (el sesgo del módulo); cualquier auto-adopción o mandato; persistir el Army; packs de terceros activos; cambios de coste o física del motor.

## §10 · ¿Hace falta una firma que bloquee?
**No**, para los validadores puros y las odds visibles (legibilidad: el addendum la exige y no cambia ningún resultado). Todo lo que calibra o adopta queda en PROPUESTA o REQUIERE_FIRMA.

## §11 · Medido tras construir (2026-09-28, nube)
| Pieza | Bytes | gzip | Margen hasta 16 384 |
|---|---:|---:|---:|
| `game/cria.js` | 9 132 | 3 468 | 7 252 |
| `game/genoma.js` | 5 078 | 2 274 | 11 306 |
| `game/gacha.js` (+ `odds`) | 7 378 | 3 279 | 9 006 |
| `game/ui.js` (+ lista de odds) | 13 242 | 4 878 | 3 142 |

- **Odds a la vista** en la pestaña Army, calculadas con los mismos enteros que la tirada. Comprobadas en Chromium con el teléfono emulado:
  - Reef: Normal 70.50% · Magic 25.00% · Rare 4.00% · Unique 0.50%;
  - Ruins: 60.00 · 32.00 · 7.00 · 1.00;
  - Forest: 49.00 · 38.00 · 11.00 · 2.00;
  - Abyss: 37.50 · 42.00 · 16.00 · 4.50.
- **Casos en node** (`atlas/cria_casos.mjs`): **12/12**. Cubren:
  - genoma: el bueno, bandas, desconocidos, decimales, min > max, y 15 prohibidos rechazados como dominio y como parámetro;
  - paquete de hoy: pasa la forma y las puertas;
  - odds enseñadas iguales a las tiradas, también en 20 000 tiradas reales de tc4;
  - 2 000 tropas de hoy sin una inválida;
  - presupuesto, simetría y exclusión de afijos;
  - 13 puertas duras nombradas (casino, reloj, piloto que invoca, código, remoto, coste del motor);
  - incubación solo en ciclos;
  - `invocar` fuera del enum del piloto;
  - adoptar e invocar solo desde `ui.js`, tras la firma humana.
- **Sabotajes:** 8 de 8 en rojo, contando las segundas pasadas. La primera pasada destapó que la prueba de puertas no las miraba directamente: la forma cerrada las tapaba. Se endureció para exigir que la puerta dura **nombre** cada fallo.
- **Contratos:** `atlas.cria_calibracion/1` y `atlas.genoma/1`. El del genoma es espejo exacto de `genoma.js › LIMITES`, y una prueba vigila que no diverjan.
