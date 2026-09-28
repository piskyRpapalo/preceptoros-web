---
id: directiva-v15-estado
titulo: Directiva Maestra v1.5 de theGame · qué se construyó, qué espera firma y por qué
tipo: operativo
clase: propuesta
fecha: 2026-09-27
estado: PENDIENTE_DE_FIRMA
---

> **Unificado en [`atlas/PLAN_THEGAME.md`](PLAN_THEGAME.md) (2026-09-28).** Lo vivo está allí; este documento queda como histórico, con su fecha.

# Directiva v1.5 · estado punto por punto

La directiva la escribió el Soberano el 2026-09-27. Aquí se construye lo que **no choca con nada ya firmado**. Lo que sí choca **no se ejecuta**: se nombra el choque y se pide firma (contrato §4: ante ambigüedad real, se para y se pregunta una cosa). Los nombres de los nodos que cita la directiva no se copian a este repositorio público (higiene, contrato §3.5).

## §1 · Las 5 instrucciones de despliegue (§10 de la directiva)
| # | Instrucción | Estado | Dónde / prueba |
|---|---|---|---|
| 1 | Ningún módulo pasa de 16 KB | **HECHO** | `atlas/test_atlas.py › TheGameV15.test_v15_cada_modulo_cabe_en_16_kb` |
| 2 | `gacha.js`: catálogo armónico + loot al estilo Diablo + cola hacia p0x | **HECHO**, salvo la cola | La cola hacia el rack es **NO_DATA**: no hay canal (§3) |
| 3 | `core.js`: Web Audio con osciladores seno, sin MP3 | **HECHO** | FM con portadora y moduladora seno; apagado por defecto |
| 4 | Army solo con firma Ed25519 en `db.js` | **HECHO** | La firma se **verifica**, no basta con que exista; un único camino de escritura |
| 5 | Pruebas en `test_web.py`, en verde | **HECHO, en otro fichero** | Clase `TheGameV15` (7 pruebas) en `atlas/test_atlas.py`, que el CI corre en el mismo job. No va en `test_web.py` porque su número de pruebas (171) es una cifra publicada en tres portadas, y su dueño es `coherencia-publica.py`, en el rack. Moverla es un paso del rack: se mueve la clase y se ejecuta `coherencia-publica.py --si`. Casos en `atlas/gacha_casos.mjs` (21) |

## §2 · Qué se construyó (y lo que se midió para hacerlo)
- **Treasure Classes con coste en Cobre + Luz, no en Biomasa.** Medido con el piloto base: la Biomasa nunca pasa de 2, porque la Forja la convierte en Cobre, que crece unos 0,37 por ciclo. Un coste en Biomasa sería inalcanzable. El Silicio Cuántico, la Pila de Hidrato y las Reliquias A2A **no existen en el motor**: NO_DATA.
- **Afijos Diablo I/II:** prefijos Atlante / Cúprico / Térmico / Solar; sufijos del Abismo / del Sigilo / de la Velocidad / del Algoritmo. Rareza Normal → Mágico → Raro → Único (Atlante Legendario). Las TC más hondas dan mejor loot, y el reparto se mide sobre 10 000 tiradas.
- **Tropas de Fourier:** `[k, ax, ay, fase]` en enteros. Menos de 200 B medidos en 3 000 tiradas. La rareza fija la simetría (k ≡ 1 mod s).
- **Huevo → morfismo → tropa:** interpolación lineal término a término. Con `prefers-reduced-motion`, no hay animación.
- **Invocar firma antes de pagar:** la firma Ed25519 de `atlas.invocacion/1` da la semilla (su sha256). Solo después el motor cobra (`invocar`, función pura nueva). Si la firma falla, no se gasta nada.
- **Sonido:** la directiva modula por `nodeTemperature`. Un navegador **no puede leer la temperatura del silicio**: NO_DATA. Se usa la presión medida del Núcleo (1 − integridad/máx.) y así se dice en el código.
- `contenido_v` pasa a `2026-09-27.1`. Las partidas de la versión anterior se rechazan con esa causa, no con un «final no coincide» genérico.

## §3 · Lo que NO se ejecutó y qué choca (pide firma)
| Punto de la directiva | Choque | Qué hace falta |
|---|---|---|
| A2A / P2P, rutas comerciales entre personas, Enclaves, guerra, saqueo, destrucción definitiva, Highway P2P, Sniping PoW, Thermal Spillover entre vecinos | **Mesh y multiusuario están aparcados** (03_ESTADO_FIRMADO §4) y prohibidos como propuesta sin firma explícita. Además, un P2P de navegador necesita un servidor de señalización (WebRTC), y eso choca con «cero servidor central» | Firma explícita para abrir el frente, y decidir qué servidor de señalización se acepta |
| `db.js` con IndexedDB (Army, Streak Vector, libro de jugadas) | «v1 no guarda nada» está en el sello del juego, en las 9 lenguas. `auth.js` es el único dueño de la base `preceptoros` | Firma: persistir el Army en una base **propia** (`thegame`), con el sello actualizado en las 9 lenguas |
| PWA 100 % offline tras la primera carga | Firmado el 2026-09-26: theGame va **fuera del precache**, a demanda, y un test lo vigila | Firma para meterlo en el precache (sube el peso de la primera visita) |
| Incubación en el rack con la tubería gráfica (carta 2D SD/LoRA) | La web **no tiene canal al rack** (el endpoint de paquetes no existe; la web nunca llama a IPs locales). Además, `cinek_automatico` está **archivado** (D1: el oficial es CineK_Studio) | Hoy el huevo eclosiona en la pestaña con su figura de Fourier y la carta 2D se declara NO_DATA. Canal = decisión del Soberano (p. ej., la app Preceptor, como el piloto) |
| Semilla «VRF» y Streak Vector (último byte de la firma → ×0,85–1,15) | **Ed25519 no es un VRF**: quien maneja su clave fuera del navegador puede fabricar firmas válidas distintas y elegir la tirada o el multiplicador | Para uso local sirve y se dice. Para competir hace falta ECVRF: firma |
| `city_node.js` (Trinidad HW/SW/Carbono, Orquestador, Recarga Térmica) | La telemetría de hardware no llega a la web: NO_DATA. Una emulación sería una métrica ficticia si no se etiqueta | Firma para emular, con la etiqueta «EMULADO» visible en cada cifra |
| Tipografía sinusoidal y menús que «vibran» con calor | Accesibilidad: el texto en canvas no lo lee un lector de pantalla, y el movimiento choca con `prefers-reduced-motion` | Propuesta: texto real en el DOM y la onda como adorno, desactivable |
| Ancla >24 h, Timefall, Decay Market, Dice Clock, Loop Cards | Son locales y viables, pero cada uno es una regla nueva del motor | Una a una, con sus casos. Las Loop Cards deben ser JSON declarativo, nunca código de terceros (doctrina) |

## §4 · La decisión que desbloquea más
¿Se firma **guardar el Army** en una base IndexedDB propia de theGame, cambiando el sello «no guarda nada» en las 9 lenguas? Es la condición para que la adopción firmada tenga continuidad. El resto de §3 depende de frentes aparcados o del canal con el rack.

## §5 · Módulo añadido después (2026-09-27, noche)
| Módulo | Qué es | Firma |
|---|---|---|
| `game/juez.js` | El juez: al corregir o ignorar al piloto, juega las dos ramas con el motor puro y dice quién tenía razón. Es el mismo juez que usa la Aduana del rack para decidir qué correcciones entrenan. Sin red; simula con `AtlasPartida.puro` para no tocar la partida grabada | Soberano, tanda 7 (§3 «integración del juez») y «firmo todo» |
