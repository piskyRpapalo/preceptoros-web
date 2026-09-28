---
id: plan-app-piloto
titulo: PLAN · la app Preceptor juega theGame con un LoRA mini que no habla, solo mueve
tipo: operativo
clase: propuesta
version: 0.1.0
editor_autorizado: carbono
fecha: 2026-09-27
base_medida: PreceptorOS@7287d39 · preceptoros-web (rama claude/lora-juego-nodo-7pp4oi)
estado: PROPUESTA · sin firmar · para ejecutar con Claude Code en el rack, fase a fase
---

# PLAN · la app Preceptor y el LoRA mini del juego

## §0 · Lo que firmó el Soberano (2026-09-27)
- **B6 queda decidido.** El LoRA del juego corre **en la app Preceptor, en el dispositivo de la persona**, nunca en la web pública.
- Es un **LoRA mini que no habla, solo mueve**: su única salida es una `atlas.accion/1`.
- **Sin app, la web juega igual:** la persona firma el «Acepto» y juega el **piloto base** (regla fija, sin LoRA). Eso ya está hecho en la web.
- La cuenta se crea en la web: es la identidad Ed25519 de `auth.js`. La app la reconoce por el **código de vínculo** (`soberano.py`, determinista a partir de la clave pública).
- La app **todavía no** está preparada para esto; este plan es lo que falta.

## §1 · Lo que hay hoy (medido en `PreceptorOS@7287d39`)
| Hecho | Dónde |
|---|---|
| App de escritorio y teléfono. MVP con **solo la biblioteca estándar**, Python 3.10+ | README, TECHNICAL.md |
| Teléfono: Termux; tras reiniciar hay que abrir Termux a mano (o Termux:Boot) | TECHNICAL.md §phone |
| Descarga verificada: `.partial` → sha256 → renombrar; peso anunciado antes del «sí»; sin red = ausencia declarada | `descarga.py` (catálogo `Pieza`) |
| Mide el modelo en la máquina: tok/s, memoria, temperatura (`k10temp`), procesos | `metricas.py`, `medidas.py` |
| Salida acotada por esquema con `format` de Ollama y guardián determinista a la entrada y a la salida (D38/D39) | `api-guia/main.py`, `capa1.py` (rack, FastAPI) |
| Código de vínculo web↔app a partir de la clave pública | `soberano.py` |
| La interfaz local: `interface/app.html`, `app.js` | `interface/` |
| Runtime de modelo en el teléfono (Ollama o llama.cpp en Termux) | **NO_DATA**: sin medida en esta sesión |

## §2 · La forma (lo que no se negocia)
```
 theGame (copia local, servida por la app en 127.0.0.1, MISMO origen)
   │  instantánea atlas.instantanea/1          ▲ atlas.accion/1 (o NO_DATA)
   ▼                                            │
 POST /piloto/accion ── guarda de entrada (determinista) ── modelo mini ── guarda de salida
                                                   (format = esquema atlas.accion/1, temperatura 0)
```
1. **Mismo origen.** La app sirve su propia copia de los ficheros del juego, fijada por sha256, y el endpoint del piloto. La web pública **nunca** llama a una IP local ni a un modelo.
2. **Solo mueve.** La salida se restringe con el `format` de Ollama al esquema `atlas.accion/1`, igual que D39. La guarda de salida vuelve a validar: si no es del enum, no se aplica, es un `fallo_modelo` y cuenta para el fusible. El modelo no produce texto para la persona.
3. **El motor dispone.** La acción entra por `AtlasJuego.aplica`, con las mismas llamadas que los botones. El LoRA no ve nada fuera de la instantánea.
4. **Firma del modelo concreto.** El «Acepto» de la app firma `atlas.aceptacion/1` con `politica: lora` **y `modelo_sha256`** (el contrato ya lo exige). Si el modelo cambia, hay que volver a firmar.
5. **Origen `lora`** en la partida. Así, la Aduana y el arnés separan lo que jugó el LoRA de lo que jugó la persona.
6. **Si falla, degrada a la regla fija visible.** Sin modelo, sin memoria o con la temperatura por encima del techo, el piloto pasa a la regla fija **y lo dice** («piloto base: el LoRA no respondió»). Nunca falla en silencio.

## §3 · Fases (una por sesión de Claude Code, con firma entre fases)
**A0 · Verdad del dispositivo (solo lectura).** En escritorio y en Termux: versión de Python, runtime de modelo disponible (Ollama / llama.cpp), RAM libre, temperatura, y tok/s de 2-3 bases pequeñas con salida de ~20 tokens. Entrega: una tabla medida. Sin ella, A3 no elige base.

**A1 · Copia local del juego (sin modelo).** `juego_local.py` (stdlib) sirve los ficheros del juego fijados por sha256 desde un manifiesto (`descarga.py` los trae y los verifica) en `127.0.0.1:<puerto medido>`. Pruebas: el sha256 no cuadra → no sirve y lo dice; no escucha fuera de loopback; el juego abre y el piloto base juega igual que en la web.

**A2 · Endpoint `/piloto/accion` con el piloto base DENTRO de la app.** Primero se cablea sin LLM: la app responde con la regla fija, que en Python o en node es la misma que `atlas-piloto.js`, y casos cruzados garantizan que dan la misma acción. Pruebas: una instantánea mal formada da NO_DATA; una acción fuera del enum no sale; hay tope de latencia.

**A3 · Enchufar el modelo mini.** Ollama/llama.cpp local con `format` = `atlas.accion/1` y `temperature: 0`. Guarda de salida determinista. Freno térmico con el techo de `medidas.py`. Si la respuesta tarda más que un ciclo, el piloto actúa cada N ciclos (N medido). Pruebas: con un modelo que devuelve basura, el fusible salta y se degrada a la regla fija.

**A4 · Descarga del LoRA mini.** Se añade `Pieza` al catálogo de `descarga.py`: nombre, URL del **release de PreceptorOS**, sha256, bytes y licencia, que se muestran antes del «sí». El «Acepto» de la app firma `modelo_sha256`. Pruebas: huella mala → no se instala; sin firma → el modelo queda descargado pero **dormido**.

**A5 · Entrenar el LoRA mini (rack, B7-B8 del mapa).**
- Corpus: partidas de `partidas/` aceptadas por la Aduana, con acciones `humano` y sugerencias respondidas (donde la persona discrepa de la regla está la señal). Nunca las del piloto base solas.
- Formato: instantánea → acción. Rank y lr bajos, freno térmico `--techo-c 75`.
- **Solo se publica si le gana al récord de la casa** en `atlas/arnes_piloto.mjs` (misma ley y mismo horizonte), con ≥ 90 % de acciones válidas y sin regresión.

**A6 · Publicar.** GGUF al release (lo sube el Soberano), `.sha256` en la web, entrada en `loratelier.json` con qué hace / qué falla / base / dataset_hash / medida, y la página de instalación de la app actualizada.

## §4 · Lo que la app NO hará
Firmar valor · tocar claves que no sean la identidad del juego · abrir puertos fuera de loopback · enviar partidas sola (exportar es un fichero; subirlo a `partidas/` es un PR de la persona) · hablar (el LoRA mini no genera texto para nadie) · entrenar en el teléfono.

## §5 · NO_DATA declarado
Runtime de modelo en Termux · tok/s y RAM del modelo mini en un teléfono real · base elegida · umbral mínimo de partidas para entrenar (lo fija el Soberano) · puerto local libre en cada plataforma.

## §6 · Primer prompt para Claude Code (en el rack, sobre PreceptorOS)
> «Lee `preceptoros-web/atlas/PLAN_APP_PILOTO.md` y `MAPA_THEGAME_LORA_JUEGO.md`. Ejecuta SOLO A0 en este nodo (solo lectura) y deja `POST_VERIFICACION_RLJ3_A0.md` con la tabla medida. PARA.»
