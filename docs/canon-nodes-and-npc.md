# Canon: node identities, evidence and projection

Migrated from D1 subject 9 at `origin/main` 916a72b. Source line numbers below refer to that tree. Working notes and section labels were not migrated.

## Identity and evidence

- The catalog pairs each account with exactly one node, and each node with exactly one account. Entries inherit `preceptoros.cedula-nodo/1`, add the device and its measurements, and carry no personal identity data. A changed credential fails its body hash check. Sources: `public/game/nodos-cedulas.js:1-10`, `public/game/nodos.js:1-16,36-103`.
- Every measurement carries its epistemic state. `MEDIDO` requires a source and date; `EMULADO` requires a basis and cause; `NO_DATA` requires a null value and cause. Missing measurements map to fog rather than a numeric estimate. Source: `public/game/nodos.js:1-16,36-103`.
- Declared node activity comes from dated measured evidence. A live rack heartbeat is unavailable to the page at load and remains `NO_DATA`. The master account view displays a proposal; app and lab linkage stays unavailable until the registry records the human decision. Sources: `public/game/ui-rack.js:1-11,31-58`.

## Deterministic projection

- The node model is pure: it uses no DOM, network, wall clock or system randomness. It validates credentials, derives traits from the signed weight proposal, and creates a closed event log from a seed. The view replays that log; it does not decide combat outcomes. Sources: `public/game/nodos.js:1-16,130-178`.
- Each measured axis selects a discrete level by counting crossed thresholds. A missing axis has no level and remains fog; the base profile applies. Weight tables remain an unsigned proposal, and balance is checked by the fixed simulation cases rather than inferred from the table. Sources: `public/game/nodos-pesos.js:1-16,28-36`; `public/game/nodos.js:104-129`.
- Reduced motion may skip the animation and display the same final replay state. The evidence and result do not depend on animation timing. Source: `public/game/ui-nodos.js:1-18,57-118`.

## Human authority and display

- The page localizes rejection causes for the visitor and does not expose raw errors as ordinary status text. The technical details remain in the explicitly expandable diagnostic area. Sources: `public/game/ui-nodos.js:119-141,222-238`.
- Signing the deterministic match record and consenting to send it are separate acts. Sending requires a trusted user gesture, an explicit consent checkbox and a second signature over the consent record. `AtlasNodos.envio` is the validation door; `Enviar.paquete` is the only dispatch path. Sources: `public/game/nodos.js:1-16,179-220`; `public/game/ui-nodos.js:1-18,142-190,204-238`.
- The node map is a projection of the supplied node data. It does not query the rack when the page loads. Its account view shows the browser identity and public key when available, while the cross-surface link remains unavailable until recorded by the Sovereign. Source: `public/game/ui-rack.js:1-11,31-77`.

## Scope note

The files `fog_of_war.js` and `npc_*.js` had no comments in the measured source tree, so this migration adds no claims about their implementation. Their behavior remains governed by their code and existing tests.
