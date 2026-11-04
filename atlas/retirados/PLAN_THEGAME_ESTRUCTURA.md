---
id: plan-thegame-estructura
titulo: PLAN · theGame, la estructura completa (juego personalizable, didáctico, con rutas y combates entre personas, sin servidor)
tipo: operativo
clase: propuesta
version: 0.1.0
editor_autorizado: carbono
fecha: 2026-09-27
unifica: DIRECTIVA v1.5 (Soberano) · MAPA_THEGAME_LORA_JUEGO · PLAN_APP_PILOTO · DIRECTIVA_V15_ESTADO · GUIA_CONTRATO
estado: PROPUESTA · sin firmar · la construye Claude Code en el rack, fase a fase, después de una ronda de preguntas
---

# PLAN · theGame, estructura primero

> Lo que pidió el Soberano (2026-09-27): «No te preocupes por recursos, habilidades ni niveles. Haz la **estructura**. Los valores y los LoRAs los adherimos después; ahora, valores [**provisionales**]. Un juego brutalmente **personalizable**, **sencillo**, **didáctico**, que la persona **quiera continuar**, y que disfrute de las **rutas y los combates entre usuarios**.»

## §0 · Las cinco leyes que no se mueven (heredadas, firmadas)
1. **IronClaw.** El silicio propone y el carbono firma: toda adopción, invocación, ruta, ataque o captura es un **objeto firmado con Ed25519**. Un piloto (regla fija o LoRA) propone; nunca firma por la persona.
2. **Sensores honestos.** Lo que no se mide es NO_DATA con su causa. Los valores provisionales se **dicen** en pantalla. Si algo se emula, lleva la etiqueta EMULADO en cada cifra.
3. **Local-first, sin servidor central.** El juego corre en la pestaña o en la app. **Entre personas viajan sobres firmados**, no peticiones a un servidor.
4. **Determinismo verificable.** Todo resultado (tirada, combate, ruta) sale de funciones puras y de semillas que **nadie puede elegir a solas**. Cualquiera puede volver a jugarlo y comprobarlo.
5. **Peso con ley.** Máximo 16 KB por módulo. El juego entero pesa hoy 119 920 B gzip, y **por encima de 150 KB gzip las leyes del mundo duplican el daño de la grieta** (`leyes(mundo)`): el juego castiga su propio sobrepeso. El margen real son **unos 30 KB gzip**. «Forzar los límites que sobran» significa gastar **cálculo** (ondas, simulación, lienzo), no bytes.

## §1 · Lo que hay hoy (rama `claude/lora-juego-nodo-7pp4oi`, PR #4 de preceptoros-web)
| Capa | Pieza | Estado |
|---|---|---|
| Reglas | `assets/atlas-motor.js` (puro: ciclo, dormir, recoger, reparar, aplazar, bajarA, **invocar**) | HECHO · 39 casos |
| Valores | `game/valores.js` (**PROVISIONALES**, solo datos) | HECHO |
| Tirada | `game/gacha.js` (TC, afijos al estilo Diablo, rareza, tropas de Fourier < 200 B, lerp) | HECHO · 21 casos |
| Army | `game/db.js` (entra solo con firma que **verifica**; en memoria) | HECHO; persistir → firma |
| Sonido | `game/core.js` (FM con seno, sin ficheros) | HECHO |
| Vista | `game/ui.js` (incubadora, huevo, eclosión, adopción) + `atlas-piso.js` (panel) | HECHO |
| Pilotos | `atlas-piloto.js` (regla fija) · modo Sugerir · «Acepto» firmado | HECHO |
| Partida | `atlas-partida.js` (ley + acciones; se vuelve a jugar) · `atlas/verifica_partida.mjs` · workflow `partidas` | HECHO |
| Contratos | `data/atlas_{accion,aceptacion,partida,gacha}_schema.json` | HECHO |
| App | `atlas/PLAN_APP_PILOTO.md` (LoRA mini en el dispositivo; no habla, solo mueve) | PLAN |
| Pruebas | test_web 171 · test_atlas 31 · node: motor 39, piloto 20, gacha 21 | VERDE |

## §2 · La idea que lo une todo: **SOBRES FIRMADOS + RESOLUCIÓN DETERMINISTA**
Sin servidor, dos personas no comparten estado: **comparten pruebas**. Cada interacción es un **sobre** (`atlas.sobre/1`) con esta forma: `{tipo, de, para?, cuerpo, pack_sha, contenido_v, seq, firma}`.
- **Tipos:** `defensa`, `desafio`, `aceptacion`, `revelacion`, `resultado`, `oferta`, `envio`, `recibo`, `captura`, `pack`.
- **`seq`:** contador monótono por nodo. Dos sobres del mismo nodo con el mismo `seq` y distinto cuerpo son una **prueba de fraude** que cualquiera puede verificar. Así se detecta el doble gasto sin servidor.
- **`pack_sha`:** ambos jugadores deben jugar con el mismo paquete de valores, o el combate no se resuelve. Evita la trampa de «mis tropas con mis números».
- **Canales**, todos opcionales e intercambiables, porque el sobre es el mismo en todos:
  1. enlace con `#fragmento`: el fragmento **nunca llega a ningún servidor**;
  2. QR en pantalla o impreso;
  3. fichero;
  4. copiar y pegar;
  5. WebRTC con señalización **manual** (el SDP va dentro de un sobre por QR). En la misma red funciona sin servidor; por Internet necesita STUN. Es NO_DATA hasta firmarlo;
  6. relevo opcional (el workflow de `partidas/` en GitHub, o el Ágora) solo con firma del Soberano.
- **Verificación:** la misma pieza que ya existe para las partidas: forma → firma → **re-simulación**.

## §3 · Combate entre personas (asíncrono, justo y sin servidor)
**Modelo «fantasma»:** atacas una **defensa firmada** (instantánea del Army y del enclave del otro), no a la persona conectada. Así se juega entre husos horarios y con la batería baja.

**Semilla que nadie elige a solas (commit-reveal).** Esto resuelve que Ed25519 no sea un VRF:
1. A publica su `desafio` con `compromiso = sha256(asalto + sal)`, sin revelar el asalto.
2. B responde con una `aceptacion` que lleva un `nonce` fresco y firmado.
3. A publica la `revelacion` (`asalto + sal`).
4. Semilla = `sha256(firma_aceptacion ‖ firma_revelacion)`.

A no puede probar asaltos sin que B vuelva a aceptar, y B no conoce el asalto al fijar su nonce.

**Resolución:** rondas deterministas `combate(defensa, asalto, semilla, valores) → registro`. El registro se reproduce en el lienzo: las tropas son ondas, así que el golpe es un cambio de fase y la derrota es amplitud a cero. Cualquiera lo vuelve a jugar y lo verifica.

**Pérdida definitiva y saqueo, dicho con honestidad.** Sin servidor, nadie puede borrar nada del aparato de otro. Por eso:
- la `defensa` **pre-firma lo que se arriesga** (tropas y botín en juego);
- la victoria + esa pre-firma = una **reclamación verificable** por cualquiera;
- el juego del perdedor la aplica al recibirla. Si alguien la ignora, queda un **registro público de deudas** (sobres sin `recibo`), que es reputación. Es un contrato social con pruebas, no una imposición.

**PvE primero.** Las **patrullas NPC** son defensas generadas por el propio motor a partir de la semilla del sector: el mismo motor de combate, **sin red**, jugable offline desde el primer día. El PvP llega después con el mismo código.

## §4 · Rutas comerciales y mapa
- **Mapa sin servidor:** los sectores salen de la semilla (`sha256` de la clave del nodo) sumando armónicos (topografía de Fourier). Todos generan el mismo mapa.
- **Vecinos** = distancia XOR entre huellas de clave, como en Kademlia. Tu «región» se calcula igual en todos los aparatos. Sin censo central.
- **Ruta** = `oferta` firmada por A + `aceptacion` firmada por B. Una firma activa la ruta; después, la logística es del **autopiloto local** (Loop Cards). Cada entrega es un `envio` con `seq` y cada llegada un `recibo`. Las caravanas orbitan en el lienzo según el desfase.
- **Niebla de guerra:** radio = tiempo × (software/hardware). Hardware y software son NO_DATA en la web, así que con valores provisionales la fórmula se aplica con valores declarados como EMULADO.
- **Enclaves:** nodos del mapa con guarnición (una defensa, de NPC o de persona). Capturarlo = ganar un combate. Mantenerlo exige un **sobre de mantenimiento** firmado cada N ciclos; si falta, vuelve a NPC.
- **Mercado honesto:** el precio depende del inventario **local** y lo calcula una función pura. No hay oráculo.

## §5 · Personalización brutal (sin abrir la puerta al código ajeno)
- **Packs** (`atlas.pack/1`): JSON **declarativo** y firmado por su autor. Incluye valores, bestiario (armónicos base), afijos, paletas, recetas FM, textos y Loop Cards. Se validan con un esquema y **nunca ejecutan código** (doctrina). El pack activo se ve y se firma con su `pack_sha`.
- **Editor de tropas de Fourier:** arrastras los círculos (amplitud y fase) y ves cómo cambia la figura. La tropa editada es cosmética; los números salen del pack, así que nadie se fabrica una tropa rota.
- **Emblema del nodo:** una figura de Fourier derivada de tu clave pública. Es único, reconocible y no se falsifica.
- **Loop Cards:** reglas `si <condición sobre la instantánea> → <acción del enum>`, en JSON. Son el autopiloto que la persona programa sin programar, y el piloto base es una más.
- **Sonido:** cada tropa suena según sus armónicos (FM). Lo que ves es lo que oyes.

## §6 · Didáctico (cada mecánica enseña algo real)
| Mecánica | Lo que enseña | Cómo se ve |
|---|---|---|
| Tropas y editor | Series de Fourier | Modo **Laboratorio**: se ven los círculos girando |
| Sonido | Síntesis FM | Portadora, moduladora e índice a la vista |
| Army y sobres | Firmas digitales | Los bytes de la firma, y qué pasa si cambias uno |
| Repeticiones | Determinismo | «Vuelve a jugarlo tú»: sale igual |
| Combate justo | Commit-reveal | Paso a paso, en el propio desafío |
| Grieta y calor | Inercia térmica | La curva del Núcleo |
| Mercado | Oferta y demanda | El precio según tu inventario |

**Medir el aprendizaje:** `LIMITES_DEL_CRITERIO` de PreceptorOS reconoce que ningún criterio mide si alguien aprende. Propuesta: una pregunta opcional al cerrar cada Laboratorio, guardada solo en local. Es NO_DATA hasta firmarlo.

## §7 · Que quiera volver (retención honesta)
1. **Guardar** en una base IndexedDB **propia** (`thegame`, nunca la de `auth.js`), con una **copia exportable firmada** (la memoria son ficheros). Exige cambiar el sello «no guarda nada» en las 9 lenguas: **firma**.
2. **Relojes que invitan sin castigar:** huevos que incuban, «mientras dormías» (hasta 24 h), un reloj de dados (Dice Clock) con 3 ranuras de atención al día derivadas de la firma diaria, y timefall solo para lo que está en tránsito.
3. **Rivales y repeticiones:** lista de desafíos recibidos, repeticiones compartibles por enlace, y temporadas = `contenido_v`.
4. **Nada de patrones oscuros:** sin rachas que se pierden, sin FOMO de pago y sin avisos que no pediste.

## §8 · Módulos (máximo 16 KB cada uno; lógica pura probada en node)
| Módulo | Responsabilidad | Directiva v1.5 → aquí |
|---|---|---|
| `assets/atlas-motor.js` | reglas del Bosque (ya existe) | «core.js: pure functions, tics, 7 oficios» |
| `game/valores.js` | valores provisionales y el pack por defecto | (nuevo: estructura) |
| `game/gacha.js` | TC, afijos, rareza, armónicos, lerp | igual |
| `game/combate.js` | defensas, asaltos, rondas, NPC | a2a_routes (guerra) |
| `game/mapa.js` | sectores de Fourier, vecinos XOR, enclaves, niebla | a2a_routes (topografía) |
| `game/rutas.js` | ofertas, envíos, recibos, mercado honesto | a2a_routes (comercio) |
| `game/sobres.js` | construir y verificar sobres, commit-reveal, pruebas de fraude | (nuevo: la columna vertebral) |
| `game/nodo.js` | Trinidad HW/SW/Carbono (EMULADO), orquestador, calor | city_node.js |
| `game/cartas.js` | Loop Cards (JSON → decisión), autopiloto | a2a_routes (autopilot) |
| `game/db.js` | Army, persistencia (tras firma), ledger | igual |
| `game/core.js` | sonido FM | igual |
| `game/canal.js` | enlace `#`, QR, fichero, pegar; WebRTC manual (tras firma) | (nuevo) |
| `game/ui-*.js` | vistas partidas en ficheros de < 16 KB (incubadora, mapa, combate, editor, laboratorio) | ui.js |

La tipografía en canvas **no sustituye** al texto del DOM, por accesibilidad: la onda es adorno y respeta `prefers-reduced-motion`.

## §9 · Fases (una por sesión; al final de cada una, sabotaje en ROJO y firma)
| Fase | Qué | Hecho cuando |
|---|---|---|
| **E0** | Verdad del rack y de la web + unificar documentos (este plan manda; lo demás se enlaza) | Una tabla medida y una lista de duplicados resueltos |
| **E1** | Contratos: `atlas.sobre/1`, `atlas.defensa/1`, `atlas.asalto/1`, `atlas.oferta/1`, `atlas.pack/1` | Un caso bueno y 6 violaciones por esquema |
| **E2** | `sobres.js`: firma, verificación, `seq`, prueba de fraude, commit-reveal | Casos en node: fraude detectado, semilla no elegible a solas |
| **E3** | `combate.js` + NPC (PvE offline) + repetición en el lienzo | Mismo combate, mismo registro; un NPC jugable sin red |
| **E4** | `canal.js` (enlace, QR, fichero, pegar) + PvP asíncrono de principio a fin | Dos pestañas con dos identidades: desafío → combate → verificado |
| **E5** | `mapa.js` + `rutas.js` + enclaves + mercado | Rutas firmadas; enclave capturado y mantenido |
| **E6** | Packs + editor de Fourier + Loop Cards | Un pack de terceros cargado sin ejecutar código |
| **E7** | Persistencia (tras firma) + copia exportable + retención honesta (§7) | Cerrar y volver sin perder nada; exportar e importar verificado |
| **E8** | Laboratorio didáctico + medida opcional del aprendizaje | Cada mecánica con su lámina |
| **E9** | Valores reales y LoRAs (app, `PLAN_APP_PILOTO`) | La LoRA supera el récord de la casa |

## §10 · Riesgos dichos antes de construir
- **Peso:** el margen es de unos 30 KB gzip antes de que la ley del mundo duplique el daño. Toda fase mide `gzip_juego_b`.
- **Trampas:** clientes modificados. Mitigación: nada se cree, todo se re-simula; commit-reveal; `seq`; el registro de deudas.
- **Privacidad:** los sobres llevan pseudónimo y clave pública, nunca PII ni hora de reloj (solo ciclos).
- **Aparcados:** mesh y multiusuario figuraban como aparcados en `03_ESTADO_FIRMADO` §4. La orden del 2026-09-27 («rutas y combates entre usuarios») los abre en forma de **sobres asíncronos**. WebRTC y los relevos siguen pendientes de firma.
- **Accesibilidad:** lienzo y animación siempre con alternativa en el DOM y respeto a `prefers-reduced-motion`.

## §11 · Ronda de preguntas (Claude Code las hace en el rack, después de E0, y PARA)
1. ¿Guardamos la partida (IndexedDB propia + copia firmada), cambiando el sello «no guarda nada» en las 9 lenguas?
2. ¿Qué canales entre personas se abren ya: enlace `#`, QR, fichero, pegar? ¿WebRTC manual? ¿Algún relevo (GitHub o Ágora)?
3. ¿La pérdida de tropas es definitiva (con pre-firma del riesgo y registro de deudas) o recuperable mientras los valores sean provisionales?
4. ¿Los packs de la comunidad están abiertos desde el principio, o solo el pack de la casa mientras los valores sean provisionales?
5. ¿Combate casual (semilla commit-reveal) o competitivo con clasificación, que pide un VRF del rack firmado?
6. ¿Juego offline en el precache (sube el peso de la primera visita de todo el sitio) o sigue a demanda?
7. ¿Qué nodo del rack incuba cartas 2D (canal y tubería) y cuándo? Mientras tanto, la figura de Fourier es la carta.
