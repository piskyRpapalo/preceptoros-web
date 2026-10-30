# Node evidence and account canon

This document preserves the design notes formerly embedded in the served node, account, dictionary, and inspector modules. Runtime behavior remains defined by their contracts and measured data.

## Account and node state — `public/game/cuenta.js`

A node is declared active only when its credential contains at least one dated MEDIDO measurement; the newest date defines `desde`. Rack heartbeat is separate and remains NO_DATA because the web does not read it on load. A node without measurements is also NO_DATA.

The proposed master account links the local app, laboratory, and web using only public data: node identity, credential hash, and the browser identity's public key. It begins unsigned. The human Sovereign supplies its signature in the rack register; the page never signs or introduces private keys.

## Published evidence — `/openworld/hexelion-benchmark.json`

The static JSON record lists three dated local model measurements from HEXELION (2026-10-30): eval rate, `ollama ps` processor/context, and `ollama list` disk size. Its source receipt hash points to the node's local lab record. It is historical evidence, not a live heartbeat and not authority to publish a colony node. A node remains absent or NO_DATA until the signed publication path supplies its current measurement. No model is run by this record and no rack connection is made.

## Public reference dictionary — `public/game/hexelion_dictionary.js`

The catalogue is static and English-first. Its public references point to signed annex material, while machine-readable anchors also exist in the dictionary data and `llms.txt`. The module requests only two same-origin JSON resources. This module performs no network lookup, storage, wall-clock read, random choice, or capture/reward behavior.

## Ephemeral visitor and browser identity

On `/openworld/`, `public/game/colony_controls.js` owns a page-memory walker. `public/game/colonia_pagina.js` renders it with `NO_DATA` and explicitly says it is not node state. This is not an account. The no-account entry is the tutorial walk on the one map itself (`/openworld/`, the tutorial cabin); the pre-decree world page `public/face/basic.html` stays preserved as deep links (app#115) and is not the tutorial entry of the one map. The GDPR art. 25 ephemeral crab is `public/game/gdpr-art25-ephemeral-crab.js`. The optional browser identity is separate: `public/assets/auth.js` creates a key only after the visitor chooses it and stores that key in IndexedDB. The benchmark record is published at its URL; its limitations name the walker, tutorial entry, optional identity, and live node state separately.

## Honest inspector — `public/game/piece_inspector.js`

Tapping a map object opens a readable text record with identity, state, coordinate, and declared sound. Missing values become NO_DATA with a cause, including null, undefined, empty text, and non-finite values. The inspector does not calculate new game state: each layer supplies its own record. It stores screen positions to select the nearest record to a touch and exposes the lines to both people and the lab. A failing record does not take down the screen. Reachable pieces may expose a real action; otherwise the inspection remains read-only.
