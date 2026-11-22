# WEB · the remote chat voice says what is measured: rack assistant, provenance NO_DATA

**State: PROPOSED · HITL.** Base `ae3d17e4`. Reseal (VERSION letter from the Mesa) after the `kc` slice merges: sealing is serial.

Measured 2026-11-21 (Mesa #51 receipt 2): the public chat goes Aduana Worker → chat gateway tunnel → a local
chat front end; the model name is a Worker secret, there is no RAG, and nothing binds the answer to a node.
The page still called that voice «Node 0 · on the rack» and «Hexelion», which P2 forbids («no identificar
automáticamente Node0 WEB con Hexelion privado»).

Change (labels only; no route, key or endpoint touched):
- `map_chat.js`: the remote option is «Rack assistant · provenance unverified»; the notice carries
  `data-state=NO_DATA data-cause=model_or_rag_provenance_unverified` and says it is not a verified OWNER node.
- `classroom_chat.js`: plain causes and the receipt label say «rack assistant», receipt «provenance NO_DATA».
- `get-the-app/index.html`: same wording. `atlas/classroom_chat_browser.mjs` follows the new sentence.

States kept apart: visitor (device guide, on this device) · rack assistant (provenance NO_DATA) · OWNER node
(NO_DATA until Codex delivers a signed birth) · model training/candidate: not shown, nothing measured.
