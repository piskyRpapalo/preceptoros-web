# THE LEXICON · Implementation records

Sections I–L continue the official lexicon in [docs/lexicon.md](lexicon.md). The entries below are preserved from the prior lexicon revision.

## I · Benchmarks and receipts

| Official name | Replaces | Meaning | Status |
|---|---|---|---|
| the Crucible | crucible | The rack's live benchmark lane: scores a model against the declared suite and writes a receipt (json + md) under `~/.preceptoros/crucible/`. | in use (measured live 2026-10-20: `crucible_bench.py` running, receipts qwen3-coder:30b 21.621 B + qwen2.5-1.5b 15.708 B) |
| rack-feedback LoRA | lora_test | The lane that tunes a LoRA from rack feedback and writes its receipt under `~/.preceptoros/lora_test/`. | in use (measured live 2026-10-20: `lora_test.py` running, 4 receipts: qwen3.5:4b ×2, qwen3-coder:30b, qwen2.5-1.5b) |
| red-team lane | redteam | The adversarial eval lane; its receipt records what the model refused. | in use (measured 2026-10-20: 1 receipt, qwen3.5:4b, 28.273 B) |
| eval harness | eval_harness.py | The lab yardstick scoring coverage, determinism, weight, and speed of any piece. | in use (lab#22 merged: `bin/eval_harness.py` 6.125 B + tests 4.173 B, 10/10 ×2) |
| the receipt format | format_receipt.py | The publication layer: a measured receipt rendered as a post (telemetry-as-marketing). | in use (lab#21 merged: `bin/format_receipt.py` 3.867 B + tests 3.143 B, 7/7 ×2) |
| declared depth | declared-depth | The guardrail: every README/AGENTS/llms.txt declares its byte budget and how it is measured. | in use (merged 2026-10-20 across web, app, lab, study, aduana, buzon, profile) |

## J · The lexical screen and the voice install

| Official name | Replaces | Meaning | Status |
|---|---|---|---|
| the lexical projector | lexical_projector.js | Projects game state into a sub-1kb lexical packet so a text-only model reads the screen. | in use (web#199 merged: 3.529 B + `atlas/lexical_projector_casos.mjs` 5.179 B, 9/9 ×2) |
| sub-1kb invariance | state_vector + vector_contract | The contract that keeps the lexical packet under 1.024 B. | in use (measured: `state_vector.js` 140 B + `vector_contract.js` 259 B) |
| the coordinate inspector | piece_inspector.js | Reports What · State · Coordinate · Sound per piece, NO_DATA with a cause. | in use (measured: 5.587 B) |
| pointer-by-coordinate | map_pointer_input.js | Turns a tap into a world coordinate and resolves the piece or action under it. | in use (measured: 2.540 B) |
| voice-guided install | instalar-pc-voz | The A11Y plug&play path: a blind user installs and configures with a voice agent on the rack. | in use (app#55 merged: `bin/instalar-pc-voz` 4.078 B + tests 2.497 B, 10/10 ×2) |

## K · Bubble language contract map

This map is descriptive; this lexicon remains PROPOSAL and is not signed off.

| Encountered form | Canonical term | Meaning | Status |
|---|---|---|---|
| bubble language | bubble language | Canonical language name for the shared visual and lexical form. | measured: `docs/bubble-language.md` §1 |
| `preceptoros.bubble/1` | bubble language | Versioned frame schema, not a competing language name. | measured: `docs/bubble-language.md` §2 |
| frame | frame | Serialized unit carried by the language. | measured: `docs/bubble-language.md` §2 |
| syllable | frame | Explanatory metaphor for one frame, not a schema alias. | descriptive only |
| `AtlasBubble` | bubble language renderer | Runtime API name; retained as the existing public module contract. | measured: `public/game/bubble_language.js` |

## L · Lexical vision (pre-signed issue #3)

These entries record implementation state; adding them does not sign this document as a whole.

| Official name | ES gloss | Meaning | Status |
|---|---|---|---|
| lexical-vision | visión léxica | Read a declared visual frame as typed text; absent fields keep their cause. | proposal: signed study#3; Web frame projector exists, coverage remains partial. |
| isomorphic-lexical-vision | visión léxica isomórfica | One declared state shared by visual, mathematical, and audible views. | NO_DATA: no paired 1:1 visual/math/audio corpus or gate. |
| lexicon-state | estado léxico | Bounded envelope for a lexical projection, status, byte count, and cause. | proposal: web#254, APP#86, and LAB#62 drafts. |
| lexical-projection | proyección léxica | `preceptoros.lexical-projection/1`, a bounded description of a game frame. | in use on Web: `public/game/lexical_projector.js`; schema proposal web#254. |
