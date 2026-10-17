# Node evidence and account canon

This document preserves the design notes formerly embedded in the served node, account, dictionary, and inspector modules. Runtime behavior remains defined by their contracts and measured data.

## Account and node state — `public/game/cuenta.js`

A node is declared active only when its credential contains at least one dated MEDIDO measurement; the newest date defines `desde`. Rack heartbeat is separate and remains NO_DATA because the web does not read it on load. A node without measurements is also NO_DATA.

The proposed master account links the local app, laboratory, and web using only public data: node identity, credential hash, and the browser identity's public key. It begins unsigned. The human Sovereign supplies its signature in the rack register; the page never signs or introduces private keys.

## Published evidence — `public/game/hexelion_bench.js`

The node payload is generated from a measured result file whose source hash travels with the data. Measurements ship with the game, with no fetch. Any unmeasured value keeps NO_DATA and its cause. No random choice or clock is used.

## Public reference dictionary — `public/game/hexelion_dictionary.js`

The catalogue is static and English-first. Its public references point to signed annex material, while machine-readable anchors also exist in the dictionary data and `llms.txt`. The module requests only two same-origin JSON resources. This module performs no network lookup, storage, wall-clock read, random choice, or capture/reward behavior.

## Honest inspector — `public/game/piece_inspector.js`

Tapping a map object opens a readable text record with identity, state, coordinate, and declared sound. Missing values become NO_DATA with a cause, including null, undefined, empty text, and non-finite values. The inspector does not calculate new game state: each layer supplies its own record. It stores screen positions to select the nearest record to a touch and exposes the lines to both people and the lab. A failing record does not take down the screen. Reachable pieces may expose a real action; otherwise the inspection remains read-only.
