# One map · inventory of node content (2026-10-28)

Node content that must survive the replacement of the map. Nothing here is deleted by this piece.

| Piece | File | Bytes (measured) | Role | Wire to |
|---|---|---|---|---|
| Zombie world | `public/face/zombie.html` | 13,627 raw · live `/face/zombie` 13,627 | The Risen (zombie) world page | IC3 catalogue: the Risen |
| Atlantis world | `public/face/atlantis.html` | 13,394 raw · live 13,394 | Node Hexelion (Atlantis) world page | IC3 catalogue: Node Hexelion |
| Tutorial world | `public/face/basic.html` | 13,283 raw · live 13,283 | Basic tutorial world page | IC3 catalogue: the tutorial cabin |
| Worlds hub | `public/face/index.html` | 2,084 | Lists worlds that are live; today "No node is live" | Stays; points to the one map |
| Face scripts | `public/face/face*.js`, `face*.css` | see `git ls-files public/face` | Shared engine for the world pages | Keep until the catalogue reads them |

Reconciliation: the Sovereign measured `zombie.html` at **10,488 B on the live web**. Measured here: 13,627 B raw and 13,627 B over the wire (`curl -L`), identical to the file in the repo. The 10,488 figure is **NO_DATA** until its source is known (a different page, a different measure, or an older build).

Catalogue rule (IC3, decree 6470048349): each piece becomes a catalogue entry with its lexicon key. A piece without a key is an `orphan_visual_node` and is refused. No piece is removed while the map is replaced.
