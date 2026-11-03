# P3 · el chatbot del nodo, de la web al aula (plano, antes de código)

Orden: Mesa TF · 2026-11-03. Actas: ·6593305512 (norte), ·6593362920 (mapa de la cadena), ·6593390632 (túnel nacido).
Tramo de claude: **(a)** ruta `/api/v1/chat` en la aduana, que hace de proxy al túnel con una llave del aula;
**(b)** el chat del visitante efímero en la web. P1 (el endpoint del nodo) es de codex; P2 (el túnel), de MANOS.
Regla de la casa: **el visitante jamás ve el túnel; todo pasa por `api.preceptoros.org`.**

## 0 · Lo medido (2026-11-03, ~02:05Z)

### La app hoy, pestaña a pestaña (`127.0.0.1:8740/app.html`, runtime main 3b46596)
| pestaña | qué hay | API que llama | ¿lleva a la web? |
|---|---|---|---|
| Command | dial de 8 sectores (M0–M7, «Bronze»), botones The Path / Detail | — | no |
| Talk | una caja y «Say it» | `/api/charla` al enviar | no |
| Boundary | «Run it through the filter» | `/api/frontera` al enviar | no |
| Notebook | la captura (9 082 caracteres de texto) | `GET /api/captura` | no |
| Lab | canales recientes, modelos locales | `GET /api/lab` | no |
| **Harness** | lista de bucles systemd con su última ejecución (`afinador`, `alquimista`, `curador`…) | `GET /api/harness` | **no: es solo lectura de timers** |
| Public gate | llave de entrada + «documento que lee la IA» (`/api/empieza-aqui`), dos botones de copiar | `GET /api/empieza-aqui` | no: se copia a mano |
| Models | modelos locales | `GET /api/lab` | no |
| Settings | voz de creación, identidad del nodo, **«Send to the gateway»** (cédula), publicar creación firmada | al pulsar | **sí, el único**: `POST api.preceptoros.org/api/v1/cedulas` |

Motor RAG: `~/.preceptoros/memory.db` (FTS5). Harness: `~/.preceptoros/loops.db` + timers de usuario.
Única salida de la app a la web: la cédula de alta del nodo.

**El tramo que falta (harness → vitrina):** ninguna pestaña convierte lo que el harness produce en algo visible en la
web. Lo más cercano es Public gate, que se copia a mano. La vitrina de la web hoy solo enseña nodos (latido) y
edificios. **Propuesta:** el primer producto de la vitrina sea *el propio chatbot del nodo*. G1 = la app anuncia «mi
AI local + RAG atiende chat» por la aduana, con su llave de nodo estilo F1 (la misma familia que el latido); la web
lo muestra como una puerta en el mapa del nodo. Esa pieza se planea con codex (P1) y no entra en este PR.

### El borde
- `api.preceptoros.org` = worker `preceptoros-aduana` (repo privado `aduana`, rama por defecto
  `codex/node-gateway-worker-20261016`): `/health` · `/api/v1/cedulas` · `/api/v1/latidos` · `/api/v1/edificios`.
  **`/api/v1/chat` = 404.**
- Ya existen: CORS limitado al apex (`corsHeaders`), techos de bytes por ruta (latido 1 024 B, edificio 1 024 B) y
  llaves de nodo por hash con caducidad (`PRECEPTOROS_HEARTBEAT_KEY_HASHES`, máximo 24 h). **No hay limitador de
  frecuencia** en ninguna ruta.
- La web llega a la aduana por service binding (`ADUANA`, `wrangler.jsonc`). No hay CSP `connect-src` que lo impida.

### El túnel (P2) — 🔴 hallazgo
`chat.preceptoros.org` → `http://127.0.0.1:8080` = **Open WebUI 0.11.1** del Beelink, servido a internet. Medido:
- auth ON y registro OFF; `/api/models` y `/ollama/api/tags` dan 401 sin token. No es una fuga abierta.
- Pero sí es el **formulario de login del Open WebUI del Soberano, público**: superficie de fuerza bruta, y el
  visitante puede «ver el túnel».

P3 necesita que el túnel apunte al **endpoint de P1** (chat del nodo con RAG), y que solo la aduana pueda llamarlo.

### La web
- Cuenta del visitante: `visitor_account.js` → clave Ed25519 no extraíble por visita, que muere en `pagehide`
  (decreto 30-oct). **El cangrejo no se toca**: el chat la usa, no crea otra.
- `llms.txt` ya declara que el navegador llama a `api.preceptoros.org` solo cuando el visitante envía.

## 1 · Diseño

### (a) Borde: `POST /api/v1/chat` en la aduana
```
web (visitante) ──POST /api/v1/chat──▶ aduana ──POST + x-aula-key (+ Access service token)──▶ túnel ──▶ P1 nodo
     ◀── {estado, respuesta | causa} ───────────────────────────────────────────────────────────────┘
```
- **Entrada** `preceptoros.chat/1`: `{v, visita: <sha256 de la clave pública de la visita>, texto}`.
  - `texto` ≤ 1 000 caracteres.
  - Cuerpo ≤ 2 048 B; si no, 413 con causa.
  - Sin historial en el borde: el contexto lo pone el RAG del nodo.
- **Llave del aula.** Secreto `AULA_CHAT_KEY` en la aduana (`wrangler secret`, jamás en el repo ni en la web). Viaja
  como `x-aula-key`; P1 la compara por hash. **Recomendado además** Cloudflare Access con service token delante de
  `chat.preceptoros.org`, para que nadie más que la aduana llegue al túnel. Configurarlo es de MANOS.
- **Límites** (valores por defecto que propongo; los firma la Mesa):
  | límite | valor | dónde | si se pasa |
  |---|---|---|---|
  | frecuencia por visita | 6 turnos / 60 s | binding `[[ratelimits]]` de Workers, clave = `visita` | 429 · `NO_DATA · limite_visita` + `retry_after` |
  | frecuencia por red | 30 / 60 s | mismo binding, clave = hash de `CF-Connecting-IP` (solo en memoria; no se guarda) | 429 · `limite_red` |
  | tokens de salida | `max_tokens: 256` (lo manda la aduana; P1 lo respeta) | aduana → nodo | la respuesta se corta y lo dice |
  | respuesta | ≤ 2 000 caracteres | aduana | recorta y marca `recortada: true` |
  | espera | 25 s (`AbortController`) | aduana | 504 · `NO_DATA · tiempo_agotado` |
- **Cuando el nodo duerme** nunca hay silencio: cada fallo es un `NO_DATA` con su causa.
  | qué pasa | respuesta |
  |---|---|
  | túnel caído o sin conexión | 503 · `nodo_dormido` |
  | el nodo rechaza la llave | 502 · `aula_rechaza` (la llave rotó) |
  | el nodo responde algo que no cumple el esquema | 502 · `respuesta_fuera_de_ley` |
  | falta el secreto en la aduana | 503 · `aula_sin_llave` |
- **Privacidad:** la aduana **no guarda** turnos. Ni en D1 ni en logs propios; solo cuenta por causa.
- **Despliegue:** la aduana tiene su propia guarda y su propio tubo FIRMA+FIRMO, y la rama la elige su Mesa. Va
  como PR al repo `aduana` con su prueba en rojo y luego en verde.

### (b) Web: el chat del visitante efímero
- **Una acción visible por pantalla** (encargo del infante): página `/chat/` con una caja, «Send» y la conversación.
  Lo técnico, plegado. Un enlace desde la puerta.
- **Cero peticiones al cargar.** `aula_chat.js` no hace `fetch` hasta pulsar Send. Prueba de navegador: 0 peticiones
  a `/api/` al abrir, 1 al enviar.
- **IndexedDB** `aula-chat` guarda los turnos solo en el dispositivo. «Forget this chat» los borra.
- **La visita** sale de `AtlasVisitorAccount.create(true)` con consentimiento explícito: un botón «Start a visit».
  Solo viaja `sha256(clave pública)`; la clave no se exporta.
- **Estados honestos en pantalla:** enviando… · respuesta · `NO_DATA · the node is asleep` (y demás causas
  traducidas) · `Wait 40 s` en 429. Jamás un spinner eterno.
- **J1:** objetivos de 44 px, foco visible, Enter envía, aria-live en la conversación. Sonido corto al llegar una
  respuesta y otro distinto para NO_DATA; la voz llega con la pieza 4.
- **Paridad:** la terminal básica recibe el mismo módulo en `face/basic.html`.
- **Pesos:** `aula_chat.js` < 7 168 B gzip; la página < 16 384 B.

## 2 · Pruebas (cada una enseñada en rojo antes que en verde)
- aduana `test/chat.test.mjs`:
  - techos de cuerpo y de texto;
  - sin llave → `aula_sin_llave`;
  - un upstream que no responde → `tiempo_agotado`;
  - un upstream 401 → `aula_rechaza`;
  - el 7.º turno en 60 s → 429.
  Sabotaje: quitar el límite ⇒ rojo.
- web `atlas/aula_chat_browser.mjs` con la aduana simulada:
  - 0 peticiones al cargar;
  - un turno → respuesta en la conversación y en IndexedDB;
  - 503 → «NO_DATA · the node is asleep» visible;
  - 429 → espera visible.
  Sabotaje: un `fetch` al cargar ⇒ rojo.

## 3 · Orden y firmas
1. Este plano → FIRMA.
2. MANOS repunta el túnel a P1 y lo cierra con Access. Hasta entonces, el upstream es `NO_DATA`.
3. PR `aduana` (ruta + límites) → FIRMA → FIRMO → deploy de la aduana.
4. PR `preceptoros-web` (`/chat/` + `aula_chat.js`) → FIRMA → merge → deploy → verificar en el Beelink y el Doogee.

## 4 · Fuera de este PR
- G1 (la app anuncia su chatbot a la vitrina) y P1 (endpoint del nodo).
- Persistencia en servidor de nada del visitante.
- Las 10 rojas heredadas de `wllama.js` siguen como están (`test_cero_rutas_absolutas_ni_ips`); se declaran en el
  plano del embellecimiento.
