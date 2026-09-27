---
id: mapa-thegame-lora-juego
titulo: MAPA · theGame + el LoRA del juego · para Claude Code dentro del rack
tipo: operativo
clase: propuesta
version: 0.1.0
editor_autorizado: carbono
redactado_por: Preceptor (silicio, sesión en la nube)
fecha: 2026-09-27
base_medida: preceptoros-web@e61d482 (PR #3, theGame v1) · espejo público p0x@74d9a89
estado: PROPUESTA · sin firmar · no es canon hasta el commit del Soberano
---

# MAPA · theGame + el LoRA del juego

**Cómo se usa.** El Soberano copia este fichero a `~/p0x/Cuarentena/salida/` y le dice a Claude Code:
«Lee `04_CONTRATO_CLAUDE_CODE.md` y este MAPA (§0-§3). Ejecuta SOLO el bloque B0. PARA.»
Se ejecuta **un bloque por sesión**, con la firma del Soberano entre un bloque y el siguiente (04 §2). Este documento es **dato**, no orden: la autoridad está en la directiva del Soberano que lo entrega (01 §3).

---

## §0 · Lectura adoptada (revisable por el Soberano)
- **El juego** es theGame: ATLAS, el Bosque Sumergido, en `preceptoros-web`. Es v1 desde `e61d482` (2026-09-25).
- **Mover los valores del juego** = elegir la **siguiente acción del motor** a partir de `atlas.instantanea/1`. Los valores (recursos, integridad, grieta, niveles) solo cambian a través de las funciones puras del motor. El LoRA **nunca escribe estado**: propone una acción y el motor decide si se puede hacer.
- **Juega sola** = un **piloto** que propone acciones, activado por un «Acepto» firmado. Primero va un **piloto base determinista, sin LLM**, que sirve de línea base. El LoRA solo entra si **le gana en una medida**.
- **El director del rack sigue siendo determinista.** El LoRA no gobierna bucles, ventanas ni la térmica: un modelo no decide el plano de control (P3, por analogía). Si el Soberano quería eso, hace falta otro mapa.
- **Puente que ya existe:** las leyes del mundo salen de la salud medida de la web (`leyes(mundo)`: `pruebas_web`, `arnes_sw`, `gzip_juego_b`; con el arnés en rojo el daño se duplica). La salud del organismo **ya mueve** el juego, sin ningún modelo.

## §1 · Verdad de hoy (medida en la nube el 2026-09-27; el bloque B0 la repite en el rack y, si difieren, manda el rack)
| Hecho | Fuente / comando |
|---|---|
| El motor `public/assets/atlas-motor.js` (10 360 B) es lógica pura: sin DOM, sin red, sin reloj propio. Exporta por `module.exports` y **corre en node** | cabecera del fichero, líneas 1-13 y 236-251 |
| Acciones: `ciclo(e,ley)`, `dormir(e,ms)`, `recoger(e,dia)`, `reparar(e,dia)`, `aplazar(e,dia)`, `bajarA(e,prof,dia)`. Guarda: `puedeBajar(e,prof)` → `''` o el motivo (`banda`/`ingenieria`/`oxigeno`) | `grep -n "function" atlas-motor.js` |
| 7 OFICIOS: descenso, pesca, mineria, forja, herboristeria, restauracion, ingenieria · 4 BANDAS: arrecife, ruinas, bosque, nucleo · FASES `[1,10,25,45,70]` | `node -e` sobre `AtlasMotor` |
| `AtlasJuego.instantanea()` (atlas-piso.js:292) → `atlas.instantanea/1` con `{ciclo, fase, nivel_nucleo, profundidad, recursos{luz,biomasa,cobre,flujo,oxigeno}, integridad, integridad_max, grieta{abierta,cierre}, niveles, pendiente_ciclos, eventos[-20]}`. **Nadie la consume todavía** | atlas-piso.js:288-306 |
| Cada acción emite un evento `atlas.evento/1` con `resultado: ok\|fallo` y `dia` (fecha AAAA-MM-DD del reloj). El motor ya rechaza lo que no se puede hacer | atlas-motor.js:129-135 |
| **v1 no guarda nada**: la partida muere con la pestaña. **Hoy hay 0 partidas para formar un corpus** | thegame.js:13-15 |
| Sin navegador: 10 000 ciclos con una política trivial («reparar si cobre ≥ COBRE_REPARAR») tardan **383 ms** en node 22. Resultado: fase 3, núcleo 39, integridad 117/117, 36 reparaciones. Ley usada `{nd:false, integridad_max:117, dano:1}` | sonda `node -e` de esta sesión |
| Gate: `test_web.py` **171 OK** (2 saltadas: «el repo del producto no esta a mano» y «sin Pillow») · `atlas/test_atlas.py` **13 OK**. El CI (`.github/workflows/gate.yml`) corre los dos | corrida en un venv con jsonschema 4.26.0 |
| Techo por fichero: **16 384 B** (`techo_fichero_b`, `test_presupuesto_de_peso`). Margen libre: atlas-arte.js **59 B**, auth.js **121 B**, atlas-piso.js 1 258 B, atlas.css 2 615 B, cabezal-rotulos.js 3 839 B, atlas-dialogo.js 4 386 B, sw.js 4 823 B, atlas-motor.js 6 024 B, enviar.js 7 848 B, atlas-mapa.js 9 320 B, thegame.js 11 477 B | `wc -c` |
| Sello: `sw.js` VERSION `preceptoros-2026-17-abbi`; huella en `config/sw-huella.txt`. `bin/sellar.py` sin flags solo dice lo que haría; `--sellar` sella | sw.js:33; cabecera de sellar.py |
| Identidad: `window.Identity` (auth.js) usa Ed25519 con `crypto.subtle`: `quien()`, `firmar(obj)`, `firmarTexto(t)`. Si no hay identidad: `window.ConIdentidad` | auth.js:202-272 |
| Salida hacia el rack: `window.Enviar`: `GET /api/v1/reto` da un nonce de un solo uso (300 s) y se firma `pseudonimo\|clave\|reto`. **El endpoint de paquetes no existe** (la web lo midió el 2026-09-13; el OpenAPI tiene 8 rutas). Sin endpoint, degrada a exportar un fichero | cabecera de enviar.js |
| Descargas: los pesos están en `.gitignore`, así que `/downloads/*.gguf` da **404**. El canal real es el **release de GitHub de PreceptorOS**; la web solo lleva el `.sha256`. Hoy hay 5 GGUF publicados así | public/downloads/README.md |
| `atlas/GUIA_CONTRATO.md` es una PROPUESTA sin firmar: guía en una capa aparte que lee la instantánea; LoRA pequeña «solo con partidas firmadas», «sin salir del nodo». Tiene 3 puntos pendientes de firma | el fichero |
| `ESPEC_ATLAS_AUTOMEJORA`: la cita la GUIA, pero **no existe** ni en la web ni en el espejo de p0x → NO_DATA | `grep -r`, `find /` |
| `public/atlas-mundo.json` se midió en un **contenedor en la nube**, no en el rack. `atlas/mundo.py` **reescribe** ese fichero al ejecutarse | atlas-mundo.json `maquina`; mundo.py:97 |
| Servidor local de desarrollo: `python3 -m http.server 8802 --bind 127.0.0.1 --directory public` | `.claude/launch.json` |

## §2 · Contradicciones que este mapa resuelve (y cómo)
- **C-a.** La GUIA dice «pistas, no soluciones; no juega por la persona». La directiva del 2026-09-27 dice que la máquina juega sola tras «Acepto». → Hay **dos modos**: guía (por defecto) y piloto (solo tras «Acepto»; se puede soltar y siempre está a la vista). En B1 se propone enmendar la GUIA.
- **C-b.** La misión pedía los pesos en `public/downloads/juego-*.gguf`. → Se sigue lo medido: los pesos van al release y la web lleva el `.sha256`.
- **C-c.** La doctrina de Alejandría pone el techo en 10 KB; el gate de la web lo mide en 16 384 B. → Manda el gate medido hasta que el Soberano firme otra cifra. La lógica nueva va en **ficheros nuevos**, y atlas-arte.js y auth.js **no crecen**.
- **C-d.** La misión tomaba como corpus `loops.db`, `espejo.csv` y la bandeja. → Para jugar ATLAS, el corpus son **partidas firmadas**; `loops.db` no enseña a jugar.
- **C-e.** La misión mandaba la aceptación al rack por el canal existente, pero ese endpoint no existe. → El «Acepto» se firma y vive en la pestaña. Enviarlo reutiliza `Enviar` y degrada a exportar; abrir el endpoint requiere la firma del Soberano.

## §3 · Invariantes del mapa (se suman a los de 04 §3 y a la misión §4)
1. **El motor no se toca.** `atlas-motor.js` no gana imports, red, reloj ni conocimiento del piloto. Todo cambio de estado pasa por sus funciones.
2. **Las acciones forman un enum cerrado**, `atlas.accion/1`: `esperar | recoger | reparar | aplazar | bajar_a:<banda>`. Lo que quede fuera del enum no se ejecuta: cuenta como `fallo_modelo` y el motivo queda escrito.
3. **El piloto solo ve la instantánea**, la misma puerta que la guía (GUIA §Qué ve). No ve la página, la identidad ni la hora.
4. **Cero red en el juego público.** El test `test_arte_mapa_y_dialogo_no_salen_a_la_red` se extiende al piloto.
5. **Cero almacenamiento.** localStorage e IndexedDB están vetados. Exportar = un fichero que descarga la persona.
6. **«Acepto» = firma Ed25519** (`Identity.firmar`) sobre `atlas.aceptacion/1`. Sin firma, el piloto no arranca. Sin identidad, entra el flujo `ConIdentidad`.
7. **IronClaw.** Ninguna acción del enum toca valor, claves ni red. El piloto propone y el motor dispone.
8. **Frenos del piloto:** se para al cerrar la capa (ya pasa hoy); no actúa si hay un diálogo abierto; un **fusible** de K fallos seguidos lo detiene y lo dice; el botón «Soltar» está siempre visible. En el rack, además, el freno térmico y la carga para entrenar (B7).
9. **A demanda:** los ficheros nuevos entran en la lista `GUIONES` de thegame.js y **no** en el precache (`test_thegame_se_carga_a_demanda_y_solo_pide_lo_suyo`).
10. **En cada bloque:** el test nuevo se ve primero en ROJO (sabotaje) y después en VERDE. Si el bloque toca `public/`, `bin/sellar.py --sellar`. Un commit por bloque. **Sin push**: empuja el Soberano, después de `coherencia-publica.py`.

## §4 · Bloques
Cada bloque indica: objetivo · repo · ficheros · pruebas · cuándo está hecho · cómo se revierte. Al terminar: reporte 04 §8 + `POST_VERIFICACION_RLJ<n>_B<k>.md` en `Cuarentena/salida/` (plantilla 05). **PARA.**

**B0 · La verdad en el rack (solo lectura).** Repos: p0x y preceptoros-web.
- `python3 ~/p0x/Alejandria/ojo/ojo.py --arranque` · `git -C` status de los dos repos · `git -C ~/p0x config --get remote.origin.pushurl`.
- `python3 test_web.py` · `python3 atlas/test_atlas.py` (con cifras y lista de saltadas).
- Repite la sonda de §1 (10 000 ciclos) en el rack con `node -e`, y anota la versión de node.
- `ls ~/p0x/esquemas/`, más las primeras 60 líneas de `intencion-1.json` y `arbitro-1.json`: son la forma que imitará B1.
- `ollama list` y tok/s medidos de los candidatos a base (no se elige por el número del nombre).
- `atlas/mundo.py` reescribe `atlas-mundo.json`: ejecútalo, mira `git diff --stat` y, si cambia, **restaura con `git checkout -- public/atlas-mundo.json`** y reporta la diferencia. En B0 no se commitea nada.
- Hecho cuando: el reporte trae una tabla §1-rack frente a §1-nube, con cada diferencia nombrada. Reversión: no aplica.

**B1 · Contratos (spec, sin código de producto).**
- preceptoros-web `data/`: `atlas_accion_schema.json`, `atlas_aceptacion_schema.json`, `atlas_partida_schema.json` (JSON Schema 2020-12, `additionalProperties:false`).
  - `atlas.accion/1`: `{accion (enum §3.2), banda?, origen: humano|piloto_base|lora, ciclo:int≥0, instantanea_sha:hex64}`.
  - `atlas.aceptacion/1`: `{modo: piloto, que_hace[], que_no_hace[] (obligatorio, mínimo 4: valor, credenciales, red, guardado), pseudonimo, clave_publica, firma}`.
  - `atlas.partida/1`: `{ley, contenido_v, pasos:[{ciclos_transcurridos, ms_dormidos?, accion}], firma}`. **Guarda las acciones, no los estados**: como el motor es puro, los estados se derivan. Declara si el `dia` del evento viaja o no.
- p0x `esquemas/lora-juego-1.json`, con la forma de `intencion-1.json`: `nodo`, `base_model{nombre, sha256}`, `dataset_hash`, `valores_del_juego` (=campos de la instantánea + enum; lista explícita de lo que NO mueve: valor, credenciales, firma externa, director), `calibracion{ece,brier,n}\|NO_DATA`, `activacion{modo: firma_carbono, aceptacion_sha}`, `frenos_obligatorios`, **`linea_base{politica: piloto_base, metrica, valor}`** (obligatoria: sin ella no hay forma de saber si el LoRA sirve).
- Enmienda de `atlas/GUIA_CONTRATO.md`, marcada como PROPUESTA: modo piloto, puntos C-a/C-e.
- Pruebas (en `atlas/test_atlas.py`): por esquema, 1 caso bueno en VERDE y **6 violaciones en ROJO**. Ejemplos: acción fuera del enum; `bajar_a` sin banda; banda inexistente; campo extra `firma_valor`; ciclo negativo; `que_no_hace` sin `valor`; `activacion.modo=auto`; `linea_base` ausente. Sabotaje: relaja el esquema y la suite tiene que ponerse en ROJO.
- Reversión: `git revert` del commit.

**B2 · Piloto base determinista + arnés sin navegador. Primera versión de «juega sola», sin LLM.**
- `public/assets/atlas-piloto.js` (nuevo, puro, con el patrón IIFE + `module.exports` del motor): `decide(instantanea) → atlas.accion/1`. Reglas legibles, por ejemplo: reparar si la grieta está abierta y hay cobre; recoger si hay ciclos pendientes; bajar si `puedeBajar` lo permitiría con lo que muestra la instantánea; si no, esperar.
- `atlas/arnes_piloto.mjs`: juega H ciclos para cada ley (`dano` 1 y 2, `nd` true/false) y escribe `atlas/medida_piloto.json`: ciclos hasta cada fase, integridad mínima, fallos y fase final. **Esa es la línea base.**
- Pruebas: misma instantánea → misma acción; solo acciones del enum; sin red ni almacenamiento; dentro del presupuesto de peso. Sabotaje: una política que emite `firmar` tiene que dar ROJO.
- Reversión: borrar los dos ficheros nuevos y hacer revert.

**B3 · «Acepto» y modo piloto en la capa.**
- atlas-piso.js (margen de 1 258 B): solo un gancho `AtlasJuego.aplica(accion)` que traduce el enum a las llamadas `M.*` que ya existen más `actua()`. Hay que medir el peso antes y después.
- `public/assets/atlas-piloto-capa.js` (nuevo): un `<dialog>` nativo «Acepto» que dice qué hace y **qué no hace, con el mismo peso visual**; firma con `Identity.firmar`; incluye «Soltar», el fusible y el ritmo (una acción cada N ciclos). Los textos en las 9 lenguas `atlas-*.json` (`test_las_nueve_lenguas_tienen_las_mismas_claves`).
- Pruebas: el botón existe y declara lo que no hace en las 9 lenguas; sin firma no arranca; con un diálogo abierto no actúa; al cerrar la capa se para; K fallos → se para y lo dice. `sellar.py --sellar`; test_web y test_atlas en VERDE.

**B4 · Exportar la partida firmada (aquí nace el corpus).**
- En memoria, los pasos de `atlas.partida/1` con `origen`. El botón «Exportar partida» genera un JSON firmado con `Identity.firmar` y lo descarga como Blob. Si hay reto, se intenta `Enviar`, que degrada con honestidad (404/405 → exportar).
- Pruebas: el fichero valida contra el esquema; la firma se verifica en node (Ed25519); sin identidad → `ConIdentidad`; cero almacenamiento.

**B5 · La Aduana de partidas (rack, p0x). Determinista, cero LLM.**
- Valida el esquema; verifica la firma Ed25519 (con lo que ya usa `ingesta.py`); deduplica por sha256. Además **vuelve a simular la partida con el mismo motor en node** y exige que cada evento coincida. Una partida inventada no se puede reproducir: esa es la defensa contra el envenenamiento. Si vale → bronze append-only; si no → `rechazados/` con motivo y hora.
- Pruebas: 1 caso bueno + 6 malos (firma rota, duplicada, acción fuera del enum, estado que no se reproduce, esquema roto, sin firma). Sabotaje: quitar la re-simulación tiene que dar ROJO.

**B6 · Firma del Soberano: dónde corre el LoRA (§8).** No es un bloque de código. Sin esa firma, B7-B9 quedan en NO_DATA y el juego sigue con el piloto base.

**B7 · Corpus y entrenamiento del LoRA del juego (rack).**
- Solo partidas de bronze aceptadas por la Aduana, con **`origen=humano`**. Entrenar con las del piloto base sería destilar la regla. Si no, también `lora` ya medido. Sin charla-web, sin sintético y sin profesor externo. Se calcula `dataset_hash`.
- El umbral mínimo de partidas es NO_DATA: lo fija el Soberano (referencia medida: con 32 pares, degeneración 10/10).
- Formato: instantánea en JSON → `atlas.accion/1`, con la salida **restringida por el esquema** (`format` de Ollama).
- Rank y lr bajos; `--techo-c 75`; `preguntar_al_director()`; en `training.log`: respiros, temp_max y parado_por. Salida: `adapters/juego_<nodo>_v1/` (adapter_config, training.log, medida.json, README con base_model y dataset_hash).

**B8 · Medir el LoRA contra el piloto base** con el arnés de B2 (mismas leyes y horizonte).
- Se publica solo si hay ≥90 % de acciones válidas (tasa de fallo ≤ 10 %), **supera la `linea_base`** en la métrica firmada en B1 y no hay regresión (si la hay, se aborta).
- ECE/Brier: NO_DATA declarado hasta que haya probabilidades medidas.
- Si no hay material: se publica como NORMA, no como MEDIDO.

**B9 · Publicar y activar.**
- GGUF Q4_K_M al release de PreceptorOS (lo sube el Soberano); `.sha256` en `public/downloads/` y README actualizado.
- Entrada en `loratelier.json`, validada contra `data/loratelier_schema.json`, con que_hace / que_falla (mismo peso) / base / dataset_hash / medida / frenos, y el texto: «Al aceptar, firmas la activación de este LoRA como motor del juego en este nodo. No firma valor. No toca credenciales.»
- La activación, según lo firmado en B6. `sellar.py --sellar` y gate en VERDE.

## §5 · Orden
`B0 → B1 → B2 → B3 → B4 → B5 → [firma B6] → B7 → B8 → B9`.
Al terminar B3, la máquina **ya juega sola** (piloto base) tras el «Acepto». Todo lo que va después busca un LoRA que le gane.

## §6 · Prohibido en este mapa
Tocar el motor para «ayudar» al piloto · que el piloto lea algo fuera de la instantánea · guardar partidas en el navegador · abrir un endpoint nuevo en el Ágora sin firma · entrenar con partidas sin firma, con las del piloto base, sintéticas o de profesor externo · pesos en `public/` o en git · push · silenciar la salida del arnés o de la Aduana · abrir cualquier frente aparcado en 03 §4.

## §7 · Riesgos medidos
- atlas-arte.js y auth.js están a 59 B y 121 B del techo: cualquier byte de más rompe `test_presupuesto_de_peso`.
- La instantánea incluye `eventos[-20]` con `dia`: si la partida exportada lo lleva, sale una fecha de reloj. Se decide en B1.
- `mundo.py` reescribe un fichero público: ejecutarlo sin revisar el diff cambia las leyes y obliga a sellar.

## §8 · La decisión que desbloquea la segunda mitad
¿Dónde corre el LoRA del juego?
**(A) Recomendada:** en el nodo de la persona, con el juego servido desde ese mismo nodo (misma origen), que habla con su modelo local. La web pública nunca llama a un modelo ni a una IP local.
**(B)** Dentro del navegador (wasm/WebGPU). Hay que declarar el coste de RAM y peso, y el runtime rompe el techo por fichero.
Hasta que el Soberano firme: piloto base.

## §9 · Avance en la web (2026-09-27, rama `claude/lora-juego-nodo-7pp4oi`, sin empujar a `main`)
Ejecutado por orden del Soberano («empieza a ejecutarlo en la web, quiero verlo como ejemplo»). Las sugerencias firmadas (partida = ley + acciones; récord de la casa) quedan dentro.
| Bloque | Estado en la web | Pieza |
|---|---|---|
| B1 (web) | HECHO · 3 contratos, cada uno con 1 caso bueno, 6 violaciones y sabotaje | `data/atlas_{accion,aceptacion,partida}_schema.json` |
| B1 (p0x) | PENDIENTE RACK · `lora-juego-1.json`, que tiene que imitar `intencion-1.json` | — |
| B2 | HECHO · regla fija pura + arnés determinista + récord publicado | `atlas-piloto.js`, `atlas/arnes_piloto.mjs`, `public/atlas-record.json` |
| B3 | HECHO · «Acepto» firmado con Ed25519, «Soltar», fusible 3, pausa con diálogo/capa/pestaña | `atlas-piloto-capa.js`, gancho `AtlasJuego.aplica` |
| B4 | HECHO · la grabadora de la partida (ley + acciones + origen), exportada como fichero firmado | `atlas-partida.js` |
| B5 | MITAD · verificador determinista (forma → firma → reproducción) en node. Falta la Aduana del rack (bronze/rechazados) | `atlas/verifica_partida.mjs` |
| B6-B9 | PENDIENTE · firma B6 + rack | — |
Medido: récord de la casa (ley `{nd:false, integridad_max:117, dano:1}`, 20 000 ciclos). Piloto base: fase 4 en el ciclo 13 997, integridad mínima 93, 0 inválidas, 0 fallos. Sin piloto: fase 4 en el ciclo 19 176, integridad mínima 0.
Siguiente en el rack: B0 → B1(p0x) → B5 (la Aduana llama a `node atlas/verifica_partida.mjs <fichero>`; si el código de salida es 0 va a bronze, si es 1 va a `rechazados/` con el motivo del JSON).
