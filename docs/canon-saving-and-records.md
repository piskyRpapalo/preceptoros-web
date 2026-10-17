# Canon: local saves, signed records and replay

Migrated from D1 subject 11 at `codex/d1-asunto-10` (`dfba6979`). Source line numbers refer to that parent tree. Working notes and section labels were not migrated.

## Signed records and local storage

- Adoption is accepted only after the injected Ed25519 verifier validates the canonical adoption record with its declared public key. The verification lives inside the write path. Invalid form, signature, duplicate seed or capacity returns a rejection without a partial record. Sources: `public/game/db.js:1-17,30-63`.
- Stored adoptions are pairs of record and signature. Restore sends every pair through the same adoption verifier, excludes failures with their causes and rewrites storage to accepted entries. Sources: `public/game/db.js:13-17,80-93`.
- Browser storage uses IndexedDB behind the module's storage interface; tests can inject memory storage. Per-feature boxes use their own database and single record. Source: `public/game/db.js:10-17,98-153`.
- A returned conquest record is sanitized against the known location set and nonnegative integer counts before it affects the current view. Sources: `public/game/db.js:157-178`.

## Invocation history

- Each invocation links to the previous signature-derived seed, increments a per-key sequence and carries the public key. The chain rejects gaps, broken links and key changes. Verification checks each signature and recomputes its seed. Sources: `public/game/db.js:193-240`.
- The pity measure counts opened entries only; invalid or missing chains return a cause instead of a number. The wish chronicle derives its rows from opened entries and records sequence, game cycle, seal prefix, edges and rarity. Sources: `public/game/db.js:243-259`.

## Save, resume and import

- A save contains the deterministic game record, not a live engine snapshot. It excludes paths, hosts, addresses, keys, personal data and wall-clock dates. Resume replays the record and rejects a changed final state or content version. Sources: `public/assets/atlas-guardado.js:1-19,24-49,62-73`.
- Saving is local to the device. The page reads the previous record before enabling autosave; autosave writes only when enabled and after new steps. Forget removes the record and disables autosave. Sources: `public/assets/atlas-guardado.js:1-19,76-93,116-126`.
- Import is an explicit file selection. A signed wrapper is checked when present; either way, the game record is replayed before use. The machine controls live in the inspector while human receipts remain in the readable panel. Sources: `public/assets/atlas-guardado.js:17-19,95-105,129-147`.

## Scope note

`public/game/battle_replay.js` had no comments in the measured parent tree; this migration adds no claims about that module. Its behavior remains covered by the existing replay tests.
