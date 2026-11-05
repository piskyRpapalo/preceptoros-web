# LA VOZ DEL RACK · the building chat asks the rack for its ideas

ODD decree 2026-10-28. Order: the Sovereign's priority 0 of 2026-11-03 («la ventana del chatbot… recuperación en vivo del rack»).
Status: PROPOSED · the merge waits for the Sovereign's single HITL signature.

## The order, law by law, and where each one lives

| Law | Where | Proof |
|---|---|---|
| 1st visible element = the map; 2nd = the chat window | unchanged layout (`openworld/index.html`) | `rack_ideas_browser.mjs` §1: map top 0, chat top 401 of 716 px |
| The chat title names the building or node | `building_chat.js` `titleOf()` | §2 «Tutorial cabin · b-cabin · chat»; §5 back to «Chat» |
| Inside the building, the chat fetches the rack's ideas live and shows them one by one | `rack_ideas.js` `fetchIdeas()` + `stream()` (one line every 400 ms) | §3: 1 line at 450 ms, 3 at 2.45 s |
| Zero requests on load; retrieval only after an explicit act | the bridge loads on demand; the only `fetch` is in the click/ask path | §1 and §2: 0 external requests; §3: exactly 1 |
| Strict NO_DATA | `parse()`/`fetchIdeas()` never reject: offline · no_fetch · timeout · http_<n> · network_error · not_json · schema_unknown · no_entries · no_ideas | `rack_ideas_cases.mjs` (7 cases); §4 `NO_DATA · http_404` |
| Boundaries: web owns the window, study owns the ideas | the source is study's own index `ai-index.json` (`preceptoros.ai-index/1`), read as is; nothing is copied into this repo | — |

## Choices made, and why

- **Source:** `https://raw.githubusercontent.com/piskyRpapalo/study/main/ai-index.json`. It is the rack's published index of its canonical documents, with a one-line summary and a sha256 for each. Measured 2026-11-03: 4,236 B, 16 entries, `Access-Control-Allow-Origin: *`. The site has no CSP that forbids it.
- **Only `entries`.** The index also carries `decoys` (paths that do not exist, a signal of a model that invents) and `canaries`. They are never shown. A sabotage that lets the decoys in turns 4 cases red.
- **The request carries nothing of the visitor:** `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `cache: 'no-store'`.
- **The bridge is not precached.** Like `building_chat.js` and `chunk_router.js`, it loads on demand. Offline, the ideas cannot come anyway: the line says `NO_DATA · offline`, or `not_loaded` if the bridge itself did not load.
- **If the visitor leaves mid-stream,** the stream stops: the ideas belong to the building where they were asked.

## The signature this piece looked for (CLAUDE.md, «Qué busca firma»)

The CLAUDE.md list names «Puente al laboratorio con `fetch`» because it clashes with «the web never fetches local IPs». This piece does not touch the lab or any local address. It reads a public file from the public study repository, after the visitor asks. The order itself, the Sovereign's priority 0, is the signature for the bridge. The fresh FIRMO covers the exact head at merge.

## Measured

- Pure: `node --test atlas/rack_ideas_cases.mjs` 7/7. Sabotage (decoys as ideas) → 4 red.
- Browser: `node atlas/rack_ideas_browser.mjs` VERDE. Sabotages `en-carga` → ROJO (external request on load), `sin-titulo` → ROJO.
- Weight: `rack_ideas.js` 4,290 B; `building_chat.js` 8,892 → 11,351 B. `openworld_page.js` and `openworld/index.html` unchanged (the HTML has 5 B free).

## Next (NO_DATA until built)

- One idea opened in full: fetch `study/<path>`, check it against its sha256, and show its first paragraph. The sha check is the honest sensor.
- Relevance per building kind (cabin → AI fluency, dome → contracts…). This is a pedagogy choice, so it is the Sovereign's call: NO_DATA.
