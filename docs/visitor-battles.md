# Visitor battles · JN-4

Depends on JN-3. The Sovereign signed JN-2→JN-5, then specifically requested recreation from rack history. This slice adapts the existing patrols and historical tick engine rather than inventing damage/life or mapping W1 points onto another engine's animation. Provisional values retain their existing version; balance/fairness remain NO_DATA, explicitly visible. No rating, loot, camps, node war or economy refill.

History: public/face/face_battle.js already derives NPC wave seeds from valores.patrullas and canon SHA-256. combate_ticks.js reproduces the historical combat and its outcome; wave_duel_scene.js renders that exact event log. The visitor route binds place, visit seed, squad and rules version with SHA-256. W1's existing commit primitive seals each side of bounded round segments. This is a replay-integrity commitment over deterministic practice events, not an adversarial hidden-move protocol. Missing-reveal network timeout is unavailable; no W3 completion is claimed. Core W1 and the existing renderer have different browser namespaces to avoid their prior name collision; source parity is tested.

Explicit adaptation from the JN-1 candidate: historical tick outcomes, not the unrelated W1 three-move point total, determine this practice replay. The Sovereign's instruction to use historical rack data is its authority. The model does not invent combat values. Squad cap remains ten; inventory capacity remains thirty. Existing provisional stats are historical rules, never a claim of measured balance.

The battle is a temporary dialog above the same OpenWorld map, using the existing Fourier renderer. Closing returns to the map. Logs remain session memory, with bounded per-round segments (complete frame below 1,024 bytes), logical time, colour, coordinate, sentence and declared sound. Replay verification recomputes the entire canonical result and rejects any altered field. Unknown place, missing seed or invalid squad fail closed.

Privacy/queue boundary: npc_occupancy and fog-push modules are not restored or edited. This slice only adapts existing patrol definitions; it creates no NPC occupation event, telemetry publication or fog-push mechanic. Their prior privacy restoration remains a separate Mesa piece.

Local evidence: real Chromium invocation/adoption followed by practice replay in the existing scene; determinism twice; changed SHA commitment rejected; all complete round frames under channel ceiling; one persistent map. No production claim. Browser cases and W1 parity run under tests/visitor_battle.test.mjs.
