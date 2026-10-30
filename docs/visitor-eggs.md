# Visitor eggs · JN-3

Depends on JN-2. Sovereign explicitly approved implementation and reuse of the historical beacon grant: 100 copper, zero light, once per visit. Existing class prices, odds and incubation cycles are reused; no pity, resource refill or balance is invented.

OpenWorld owns the visitor controls. Signing is explicit per invocation/adoption. The private key and invocation chain stay in memory. A paid egg incubates by user-advanced logical steps; reloading ends the visit and its unadopted eggs. The UI discloses this before starting. Adoption appends the original signed atlas.adopcion/1 record to the existing atlas-army store in an awaited read/write transaction, rejecting duplicates/capacity and reporting failure. A fresh visit cannot use old records as authority.

The former inline map controller is moved unchanged to public/game/openworld_page.js, bringing the door below 16 KiB. Its existing source assertions now inspect that controller as well; browser gates continue to measure the actual door. Army's deep-link label now describes NO_DATA honestly.

Validation: Chromium invokes, advances 20 steps, adopts and reloads without persistent Identity; OpenSSL verifies the actual browser adoption signature. Existing OpenWorld phone/desktop browser gate passes with zero external requests. test_web 75 checks (one skip), arnes_sw 24/24 and visitor tests pass locally. Production deployment is not claimed.

Route count remains shell_entries=117, shell_unique=116, shell_duplicates=1. New modules are same-origin resources, no new user-facing route. Historical patrol definitions and rules are inventoried for JN-4; fairness remains NO_DATA.

Physical Android verification (local build through USB loopback, not production): secure Chrome origin, viewport 360 CSS px; visit start, beacon, invocation, 20 steps and adoption succeeded; all measured visitor controls were 44 px high; one map surface. Private screenshot retained locally. No deployment claim. Extraction also exposed an old nonexistent manifest fetch to the source gate; it now reports the existing router's model_not_installed result without requesting a missing route.
