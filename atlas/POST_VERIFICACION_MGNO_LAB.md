---
id: post-verificacion-mgno-lab
titulo: AUDITORÍA · prompt principal (LLB, BB, DDAP, AECR, MGNO) contra la verdad del rack y lo firmado
tipo: auditoria
clase: propuesta
fecha: 2026-09-28
editor_autorizado: carbono
estado: PENDIENTE DE FIRMA para lo marcado REQUIERE_FIRMA · la rebanada pura multijugador se construye (orden del Soberano)
---

# Auditoría · MGNO + laboratorio local + A2A

> Orden del Soberano (2026-09-28): «ve construyendo todo; si faltan piezas, adapta y recrea en base a nuestra lógica de preceptoros… comienza con los 2 prompts de lógica del juego, **enfocados sobre todo al multiplayer**. El idioma del juego es solo inglés hoy.» Los dos prompts son DATOS con autoridad del Soberano; no pueden romper un invariante firmado. Lo que choca se nombra aquí y se para.

## §1 · Verdad del rack medida (rama `claude/lora-juego-nodo-7pp4oi`, base `main` a46877c)
| Pieza que cita el prompt | Estado medido |
|---|---|
| README.md, `atlas/PLAN_THEGAME_ESTRUCTURA.md`, `DIRECTIVA_V15_ESTADO.md`, `MAPA_THEGAME_LORA_JUEGO.md`, `PLAN_APP_PILOTO.md`, `GUIA_CONTRATO.md` | HECHO (existen; el PLAN es PROPUESTA) |
| `data/atlas_{accion,aceptacion,partida,gacha,opinion}_schema.json` | HECHO. `atlas.accion/1` NO incluye `invocar`: invocar es solo humano |
| `atlas-motor.js`, `atlas-piloto.js`, `atlas-partida.js` | HECHO, puros; el motor no se toca en esta ronda |
| `game/gacha.js`, `db.js`, `core.js`, `ui.js`, `juez.js`, `valores.js` | HECHO. Desde el #6 el Army (valores, gacha, db, core, ui) se carga al abrir su pestaña |
| `partidas/`, `opiniones/`, workflows `gate`, `partidas`, `opiniones`, `vigia` | HECHO |
| Guardado de la partida | HECHO en el rack (`atlas-guardado.js`, IndexedDB propia al pulsar «Save»). El prompt dice «el sello dice que no guarda»: **la verdad del rack manda**: guarda la PARTIDA a demanda; nada del multijugador se guarda |
| `gzip_juego_b` | 145 459 B; ley en 153 600 B; margen 8 141 B |
| `canal.js`, `banco.js`, `piloto-denso.js`, `tactica.js`, `arena.js`, `mercado.js`, `narragrafo.js`, `consenso.js` | NO_DATA (no existían) |

## §2 · Conflictos con lo firmado y resolución
| # | Choque | Resolución |
|---|---|---|
| 1 | LLB: `fetch` POST a loopback vs doctrina «la web nunca hace fetch a IPs locales» (Privacy Gateway) y la higiene «cero IPs en lo publicable» | **REQUIERE_FIRMA.** Esta ronda no escribe ningún `fetch` ni ninguna dirección. La salida al laboratorio sigue siendo manual y ya existe: Export game, Copy y Send |
| 2 | «Do not push» vs contenedor efímero (lo que no se empuja se pierde) | Se empuja a la **rama de trabajo** con PR en **borrador**. Nunca a `main` sin firma |
| 3 | Mesh y multiusuario, aparcados (03_ESTADO_FIRMADO §4; `DIRECTIVA_V15_ESTADO` §3) | Abiertos hoy por orden explícita («enfocados al multiplayer»), **solo como sobres firmados asíncronos**. WebRTC, STUN, TURN y relevos siguen cerrados |
| 4 | Semilla del PLAN §3 (sha256 de las dos firmas): quien firma el último, con su clave fuera del navegador, puede fabricar otra firma válida y **elegir** la semilla | Se sustituye por commit-reveal de valores `r_i` (prompt §5). Límite dicho: el último en revelar puede **abortar**, pero no elegir |
| 5 | Nombres del PLAN §8 frente a los del prompt §16 | Unificados. `sobres.js` = sobres + commit-reveal (el `consenso.js` del prompt). `arena.js` = el `combate.js` del PLAN. `mercado.js` = la parte comercial de `rutas.js`. `narragrafo.js` = MGNO. `canon.js` es nuevo (JSON canónico, PRNG, lotería entera) |
| 6 | Pérdida definitiva y saqueo (PLAN §3; pregunta 3 del PLAN §11, sin firma) | `en_juego` se **declara** en la defensa y viaja en el resultado; **no se aplica** a nadie (NO_DATA hasta firmar) |
| 7 | Liquidar una oferta movería recursos, y el motor no tiene acción de transferencia | El asiento registra la **obligación** firmada por las dos partes. Moverla al estado del motor = parche de motor → **REQUIERE_FIRMA** |
| 8 | Tropas de otra persona: ¿quién garantiza sus números? | La defensa lleva solo `{tc, semilla}`. Las cifras se **rederivan** con `gacha.tirada` y el mismo `pack_sha`. Límite: la semilla sale de una firma (no-VRF) y se puede moldear. Casual sí; clasificación competitiva → VRF/commit en la invocación → REQUIERE_FIRMA |
| 9 | Textos nuevos de interfaz | El juego va solo en inglés. Esta ronda **no añade textos**: sin UI, módulos puros probados en node |
| 10 | Persistencia de sesiones, ratings, libros y grafo | En memoria. Guardarlo → REQUIERE_FIRMA (base `thegame`, sello en las 9 lenguas) |

## §3 · Clasificación del prompt
| Subsistema | Esta ronda | Estado |
|---|---|---|
| Sobres firmados (`atlas.sobre/1`): canónico, `seq`, `prev`, fork, sesión, tamaño | `game/sobres.js` + `game/canon.js` | HECHO (puro) |
| Commit-reveal multi-par; PRNG entero; lotería con rechazo (odds exactas) | `sobres.js`, `canon.js` | HECHO |
| AECR · duelo fantasma: defensa, asalto, combate por rondas enteras, resultado verificable | `game/arena.js` | HECHO. Valores de combate **provisionales** en `valores.js` |
| AECR · rating Elo entero (tabla precalculada, sin floats), K provisional, sin clasificación central | `arena.js` | HECHO (local) |
| AECR · oferta, contraoferta, aceptación, asiento con cadena de hash, caducidad por ciclos, nonce, doble liquidación | `game/mercado.js` | HECHO. Mover recursos → REQUIERE_FIRMA |
| MGNO · nodos, arcos, operaciones, fusión determinista, podas (tombstones), votos, Φ coop/comp/híbrido, selección por lotería con semilla commit-reveal | `game/narragrafo.js` | HECHO (puro) |
| Preferencias `P_i` solo declaradas o derivadas de acciones firmadas | `narragrafo.js` valida su procedencia | HECHO |
| LLB (puente al laboratorio) | — | REQUIERE_FIRMA (§2.1) |
| BB (banco de benchmark) y DDAP (piloto denso) | — | PROPUESTA; siguiente ronda (el Soberano prioriza el multijugador) |
| Canales (enlace `#`, QR, fichero, pegar) + UI de duelo | — | PROPUESTA; hoy se reutilizan Export, Copy y Send |
| WebRTC / tiempo real | — | REQUIERE_FIRMA; última prioridad |

## §4 · Contratos nuevos (`data/`, fuera de `public/`)
`atlas.sobre/1` (sobre genérico, firma solo aquí) · `atlas.mp_sesion/1` (política) · `atlas.defensa/1` · `atlas.asalto/1` · `atlas.duelo_resultado/1` · `atlas.oferta/1` · `atlas.contraoferta/1` · `atlas.aceptacion_oferta/1` · `atlas.asiento/1` · `atlas.mgno_nodo/1` · `atlas.mgno_operacion/1` (11). Todos con `additionalProperties:false`, enteros acotados, enums cerrados, longitudes máximas, y sin URL, HTML ni rutas. Cada contrato tiene un caso bueno y 6 violaciones.

## §5 · Presupuesto de bytes (objetivo; lo medido va en §9)
| Módulo | Objetivo | Carga |
|---|---|---|
| `game/canon.js` | < 8 KB | a demanda (ningún guion lo pide aún) |
| `game/sobres.js` | < 12 KB | a demanda |
| `game/arena.js` | < 14 KB | a demanda |
| `game/mercado.js` | < 12 KB | a demanda |
| `game/narragrafo.js` | < 14 KB | a demanda |

`gzip_juego_b` **no debe moverse**: nada de esto entra en la puerta (`GUIONES`) ni en el precache.

## §6 · Modelos de amenaza
- **Laboratorio local** (cuando se firme): se confía en él solo porque es de la persona. La web no supone que sea honesto: solo le entrega el sobre firmado, nunca más. LAN = exposición a la red local → firma explícita.
- **Privacidad:** los sobres llevan clave pública y pseudónimo, nunca PII ni hora de reloj (solo ciclos). Sin puntero, tecleo, latencia ni huella de navegador. Las preferencias `P_i` son declaradas o firmadas; lo heurístico, EMULADO y local.
- **Reproducibilidad:** misma ley, semilla, instantánea y versión → mismos bytes canónicos. Sin `Math.random`, `Date` ni floats con autoridad.
- **Frontera A2A:** sin dinero real, cripto ni pagos automáticos. Un borrador de agente no es final hasta que el carbono firma. Ofertas con caducidad en ciclos.
- **Fraude P2P:** doble gasto = mismo `seq` con otro cuerpo, que queda como prueba de fraude verificable por cualquiera. Réplica de otra sesión → rechazada por `sesion`. Sobre alterado → la firma no verifica.
- **Inyección narrativa:** los nodos son datos. Texto de 280 como máximo, sin `<`, `>`, URL, `javascript:` ni plantillas. Nunca se evalúan ni se pasan a un modelo en la web.
- **Commit-reveal:** nadie elige la semilla a solas. El último en revelar puede abortar; eso queda como deuda visible, no como resultado.

## §7 · Listas
- **NO_DATA:** laboratorio local (sin canal firmado); temperatura del silicio; ratings de otros nodos (no hay clasificación central); pérdida y saqueo aplicados.
- **EMULADO:** ninguno en esta ronda. Cualquier perfil táctico heurístico futuro lo llevará en cada cifra.
- **PROPUESTA:** BB, DDAP, canales (enlace/QR/fichero/pegar), UI de duelo y de mercado, NPC de patrulla (PvE) con el mismo `arena.js`, movimiento de valores de combate a un pack firmado.
- **REQUIERE_FIRMA:** LLB con `fetch`; LAN; WebRTC/STUN/TURN/relevo; persistir sesiones, ratings, libros o grafo; acción de transferencia en el motor; pérdida definitiva; VRF para competir; clasificación entre nodos.

## §8 · ¿Hace falta una firma que bloquee antes de codificar?
**No.** La rebanada pura (sin red, sin persistencia, sin UI, sin motor, sin textos) cabe en lo firmado hoy. Lo que sí bloquea está en §7 · REQUIERE_FIRMA y no se toca.

## §9 · Medido tras construir (2026-09-28, nube)
| Módulo | Bytes | gzip | Margen hasta 16 384 | Carga |
|---|---:|---:|---:|---|
| `game/canon.js` | 4 877 | 2 150 | 11 507 | ningún guion lo pide |
| `game/sobres.js` | 11 223 | 3 959 | 5 161 | ídem |
| `game/arena.js` | 12 472 | 4 629 | 3 912 | ídem |
| `game/mercado.js` | 6 922 | 2 636 | 9 462 | ídem |
| `game/narragrafo.js` | 8 272 | 3 366 | 8 112 | ídem |
| `game/valores.js` (+ `combate`, provisional) | 3 207 | 1 576 | 13 177 | con el Army |

- **`gzip_juego_b`:** 145 459 B → 145 499 B. Los +40 B son la línea de odds de la cría (`atlas.css`) y su rótulo (`atlas-en.json`). Margen frente a la ley: 8 101 B, así que el vigía no avisa.
- **Contratos:** 11 nuevos en `data/`. Cada uno tiene un caso bueno y 6 violaciones. Las muestras que genera el JS validan contra su contrato.
- **Casos en node** (`atlas/mp_casos.mjs`): **48/48**. Cubren:
  - canónico, huella (el SHA-256 puro coincide con el de node) y PRNG (el primer valor queda fijado y coincide con el de mulberry32 de referencia);
  - lotería con frecuencias y odds en puntos básicos;
  - forma, firma y libro del sobre: duplicado, hueco, `prev` roto, réplica, par ajeno, topes y fork con prueba de fraude;
  - commit-reveal: orden de llegada, revelación que falta, revelación falsa, compromiso duplicado, compromiso tardío, 50 intentos del último en revelar y quórum;
  - arena: pack, determinismo, duelo completo verificado, resultado trucado, tropas con cifras propias, patrulla y Elo entero;
  - mercado: asiento, caducidad, doble liquidación, nonce reutilizado, borrador de agente, valor real, lo propio, destinatario y cadena trucada;
  - narragrafo: forma del nodo, convergencia, flujo sin conexión, poda y votos, Φ por modo, elección con semilla y preferencias;
  - pureza de los módulos, motor intacto y privacidad de los sobres.
- **Sabotajes:** 9 de 9 en rojo; restaurados, 48/48:
  - fork, conjunto atestiguado, sesión y claves sin ordenar;
  - la poda que no gana;
  - nonce, borrador de agente, pack y Elo asimétrico.
- **Gates:** `test_web` 171 OK (2 saltadas), `test_atlas` 63 OK, arnés SW 24/24, motor 39/39, piloto 20/20, gacha 21/21, opinión 7/7, partida de ejemplo `ok`.
- **Higiene:** el gate cazó una IP y dos URL literales en los datos de prueba. Se reescribieron sin forma de dirección y el gate volvió a verde.
