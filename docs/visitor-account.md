# Visitor account · JN-2

Authorization: Sovereign explicitly approved JN-1 and JN-2 through JN-5 before implementation in the active commission. Each merge still requires the exact-head signature. This slice only adds the authority module; the map connects it in JN-3.

A user starts a visit with explicit consent. Its non-exportable Ed25519 private CryptoKey remains in a closure. Only scoped invocation/adoption records can be signed, each with explicit consent. Unknown signed fields, another public key, missing consent or an ended visit are rejected. Pagehide invalidates signing capability; reload creates no account automatically. Persistent browser Identity is not called. Phase transitions remain NO_DATA pending a verified signed transition protocol; no route or receipt is invented.

Measured locally: Chromium-generated signature independently verifies with OpenSSL; page lifecycle ends authority; a new visit has a different key; no identity database was created. Node tests cover altered scope and denied consent. Browser evidence is in atlas/visitor_account_browser.mjs and runs from tests/visitor_account.test.mjs in CI. No production/deploy claim. The browser test exports only public material.
