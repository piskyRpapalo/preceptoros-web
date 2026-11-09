# La puerta y P3 · Hexelion habla con el mundo (plano, antes de código)

Fuentes que se citan aquí:
- **Decreto de la puerta** ·6593268733: la app es la puerta. El usuario arma ahí su RAG y corre su harness, y eso
  ofrece productos en la web.
- **Doctrina del chatbot** ·6593579266.
- **Decreto Hexelion** ·6591245593: extensión del Soberano, permisos prefirmados con ventana y revocación.
- **Decreto de marcha** ·6593641992.
- **Actas de la cadena:** ·6593305512, ·6593362920, ·6593390632, y la del aula (la clave vive en `auth`).

Tramo de claude en P3:
- **(a)** ruta `/api/v1/chat` en la aduana, que hace de proxy al aula;
- **(b)** el chat del visitante efímero en la web.

**La voz que responde es Hexelion.** Regla de la casa: el visitante jamás ve el túnel; todo pasa por
`api.preceptoros.org`.

## 0 · Lo medido (2026-11-03, ~02:05Z)

### La app hoy, pestaña a pestaña (`app.html`, runtime main 3b46596)
| pestaña | qué hay | API | ¿acerca a RAG · harness · web? |
|---|---|---|---|
| Command | dial de 8 sectores M0–M7, «Bronze» (rótulos ilegibles: arreglo en APP#158) | — | indirecto: el camino |
| Talk | caja + «Say it» | `/api/charla` al enviar | RAG (conversa con la memoria) |
| Boundary | «Run it through the filter» | `/api/frontera` | harness (filtro) |
| Notebook | la captura (9 082 caracteres) | `GET /api/captura` | RAG (lo que entra en `memory.db`) |
| Lab | canales recientes, modelos locales | `GET /api/lab` | harness |
| **Harness** | bucles systemd con su última ejecución | `GET /api/harness` | harness, **pero solo lectura: nada sale de ahí** |
| Public gate | llave de entrada + «documento que lee la IA», dos botones de copiar | `GET /api/empieza-aqui` | se copia a mano |
| Models | modelos locales | `GET /api/lab` | harness |
| Settings | voz de creación (404 de su script: arreglo en APP#157), identidad del nodo, **«Send to the gateway»** | al pulsar | **web: la única salida** (`POST /api/v1/cedulas`) |

Motor RAG: `~/.preceptoros/memory.db` (FTS5). Harness: `~/.preceptoros/loops.db` + timers.

### El tramo que falta: harness → vitrina
Ninguna pestaña convierte lo que el harness produce en un producto visible en la web. La web solo enseña nodos
(latido) y edificios.

**Propuesta:** el primer producto de la vitrina es **Hexelion hablando**. La pieza siguiente (G1, con codex) la
plantea así:
1. La app gana un paso «Publish your chatbot» en Public gate.
2. Ese paso anuncia por la aduana, con la llave de nodo estilo F1, que el nodo atiende chat.
3. La web pinta una puerta de chat en el hex del nodo.

Hoy la puerta es una sola (Hexelion, en el nodo del Soberano), así que P3 no espera a G1.

### La cadena
- **Borde.** `api.preceptoros.org` = `preceptoros-aduana`.
  - Rutas: `/health`, cédulas, latidos, edificios. `/api/v1/chat` = 404.
  - CORS solo al apex; techos de bytes por ruta.
  - **Sin limitador de frecuencia.**
- **Túnel (P2) vivo.** `chat.preceptoros.org` → `127.0.0.1:8080` = **el aula (Open WebUI 0.11.1)**.
  - Medido: auth ON, registro OFF; los modelos y ollama dan 401 sin token.
  - Por decisión de la Mesa, el aula conecta con la estación de Hexelion (`127.0.0.1:21434`, túnel medido vivo).
  - 🟠 El login del aula queda público: superficie de fuerza bruta. Recomiendo Cloudflare Access con service token
    delante. Es de MANOS.
- **Web.** La cuenta del visitante es `visitor_account.js`: Ed25519 no extraíble por visita, que muere en `pagehide`.
  **El cangrejo no se toca.** No hay CSP `connect-src` que lo impida.

## 1 · La doctrina ·6593579266, pieza por pieza

| doctrina | cómo la cumple P3 | dónde |
|---|---|---|
| **1 · HARNESS:** el RAG inyecta forzosamente glosario y contratos | el aula de Hexelion lleva glosario y contratos como conocimiento fijo del modelo, no opcional. La aduana **no** inyecta: solo pasa el turno | P1 / aula (Hexelion, codex) |
| 1 · el agente desambigua preguntando, no adivinando | prompt de sistema del modelo del aula. La web pinta la pregunta igual que una respuesta | aula + web |
| 1 · handoff = **CIEF** (estado + intención + contexto + hash esperado + tic); la aduana rechaza STALE con delta | cada turno viaja como CIEF (ver §2a). Si el `hash esperado` (sha256 de la última respuesta que vio el visitante) no casa con lo que la aduana devolvió a esa visita, responde 409 `NO_DATA · stale` con el delta de tics | aduana |
| 1 · molde < 1 KB | la petición entera ≤ 1 024 B | aduana (413 si no) |
| **2 · ACHO LEE:** la burbuja es la traducción, < 1 024 B; la fuente puede llegar a 25 MB | la respuesta que llega a la web es una burbuja ≤ 1 024 B: frase + sonido declarado. Si el aula devuelve más, la aduana recorta en frontera de frase y marca `recortada`. La fuente no se guarda en ningún sitio | aduana + web |
| 2 · escribir en Acho = accesibilidad: audio, entendimiento, TTS local, J1 | cada burbuja lleva su sonido (llega / NO_DATA) y se lee con la voz del dispositivo (pieza 4, LA VOZ). J1: 44 px, foco, Enter, aria-live | web |
| **3 · POLÍTICAS:** visitante efímero, IndexedDB, sin identidad persistente | la visita es el cangrejo. Solo viaja `sha256(clave pública)`, distinto en cada visita. Los turnos viven solo en el IndexedDB del dispositivo | web |
| 3 · cero peticiones al cargar, llamada solo al enviar | `classroom_chat.js` no hace `fetch` hasta pulsar Send. Prueba: 0 peticiones a `/api` al abrir, 1 por envío | web |
| 3 · no tracking | la aduana no guarda turnos ni IP. El limitador usa la IP solo en memoria del binding | aduana |
| 3 · sin dark patterns | sin contadores falsos ni urgencias; «Forget this chat» siempre visible | web |
| 3 · el modelo aconseja, jamás firma | la ruta de chat **no da herramientas ni escritura** a Hexelion: solo texto. Su escritura sigue siendo Sala + consola E1 (·6591245593), propose-only | aduana + aula |
| 3 · divulgación de IA al inicio | primera línea fija: «You are talking to Hexelion, an AI on the Soberano's node. It advises; it never signs.» | web |
| 3 · si el nodo duerme: NO_DATA con causa en lengua llana, jamás silencio | ver la tabla de causas de §2a; cada causa con su frase llana en la web | aduana + web |

**Hexelion, sus límites (·6591245593):**
- **Ventana:** la API key del aula es de un usuario del aula dedicado y con el mínimo de permisos, con caducidad.
  Rotarla no toca la web.
- **Revocación:** borrar o caducar la key → 502 `aula_rechaza` en el acto, y la web dice «Hexelion is not taking
  visitors right now».
- **Escritura:** ninguna por esta vía.

## 2 · Diseño

### (a) Borde: `POST /api/v1/chat` en la aduana
```
web ──CIEF ≤1 KiB──▶ aduana ──POST /api/chat/completions · Bearer AULA_API_KEY (+ Access service token)──▶ aula (Open WebUI) ──▶ Hexelion
    ◀── burbuja ≤1 024 B | NO_DATA + causa ◀──────────────────────────────────────────────────────────────┘
```
- **CIEF de entrada** (`preceptoros.chat/1`):
  ```
  {estado: {visita: <sha256 de la clave pública>},
   intencion: "chat",
   contexto: {texto ≤ 600 caracteres, pagina},
   hash_esperado: <sha256 de la última burbuja recibida | null>,
   tic: <entero monótono de la visita>}
  ```
- **Hacia el aula:** API compatible OpenAI de Open WebUI, `model` = el de Hexelion, `max_tokens: 256`,
  `stream: false`. El secreto `AULA_API_KEY` vive en la aduana (`wrangler secret`), jamás en el repo ni en la web.
- **Límites** (valores que propongo):
  | límite | valor | si se pasa |
  |---|---|---|
  | frecuencia por visita | 6 turnos / 60 s (binding `[[ratelimits]]`, clave = visita) | 429 · `limite_visita` + `retry_after` |
  | frecuencia por red | 30 / 60 s (clave = hash de `CF-Connecting-IP`, solo en memoria) | 429 · `limite_red` |
  | turnos por visita | 40 (contador en el propio CIEF, `tic`) | 429 · `visita_agotada` |
  | tokens de salida | `max_tokens: 256` | burbuja recortada y lo dice |
  | espera | 25 s (`AbortController`); la acta pide medir el turno real de Hexelion | 504 · `tiempo_agotado` |
- **Causas, nunca silencio:**
  | código | causa | frase llana en la web |
  |---|---|---|
  | 503 | `nodo_dormido` (túnel o aula caídos) | «Hexelion is asleep right now.» |
  | 502 | `aula_rechaza` (key revocada o caducada) | «Hexelion is not taking visitors right now.» |
  | 502 | `respuesta_fuera_de_ley` | «Hexelion answered something we cannot show.» |
  | 503 | `aula_sin_llave` | «The door to Hexelion is not set up yet.» |
  | 409 | `stale` + delta | «Your chat is out of step; we resent it.» (la web reintenta una vez) |
  | 429 | límites | «Wait N s.» |
- **Pruebas** (en rojo antes que en verde), en `test/chat.test.mjs` de la aduana:
  - techos de bytes;
  - sin llave, upstream mudo, 401 y respuesta gigante;
  - el 7.º turno en 60 s;
  - un `hash_esperado` STALE.

  Sabotaje: quitar el limitador ⇒ rojo.

### (b) Web: `/chat/` (una acción por pantalla: el encargo del infante)
- Una caja, «Send» y la conversación, con la divulgación arriba. Lo técnico, plegado. Enlace desde la puerta y
  desde el hex del nodo del Soberano.
- `classroom_chat.js` (< 7 168 B gzip) se carga con la página, pero **no llama a nada hasta Send**.
- IndexedDB `aula-chat`; «Forget this chat».
- «Start a visit» crea el cangrejo con consentimiento.
- Paridad: `face/basic.html` recibe el mismo módulo.
- Pruebas: `atlas/classroom_chat_browser.mjs` con una aduana simulada:
  - 0 peticiones al cargar;
  - un turno → burbuja en pantalla y en IndexedDB;
  - 503 → «Hexelion is asleep right now.»;
  - 429 → espera.

  Sabotaje: un `fetch` al cargar ⇒ rojo.
- Pesos (ley del ojo): `/chat/index.html` < 16 384 B; burbuja ≤ 1 024 B por turno (traducción); fuente = respuesta
  del aula, no guardada.

## 3 · Orden
1. Este plano → FIRMA (solo texto).
2. PR `aduana`: ruta + límites + CIEF → FIRMA → FIRMO → deploy.
3. PR web: `/chat/` + `classroom_chat.js` → FIRMA → merge → deploy → Beelink + Doogee.
4. Bloqueo real hoy: el secreto `AULA_API_KEY`. Lo crea el Soberano en el aula y lo pone MANOS con
   `wrangler secret put`; yo no veo la key. Mientras falte, la ruta responde `aula_sin_llave`, que está probado.

## 4 · Fuera de este PR
G1 (vitrina de chatbots por nodo) · P1 (el RAG del aula, codex) · persistir nada del visitante en servidor ·
las 10 rojas heredadas de `wllama.js` (`test_cero_rutas_absolutas_ni_ips`), que se declaran en el plano del
embellecimiento.

> Enriched 2026-11-09 by the Sovereign's chat (odd/tasks/chat-9nov-tanda.md): Y3 (a chat message carries HITL: the machine's signature and the visitor's account) and Y12 (the rack answers when someone names the Preceptor); both gated by Q-L1.
