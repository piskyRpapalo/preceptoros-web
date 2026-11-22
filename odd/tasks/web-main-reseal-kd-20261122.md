# WEB · main@70747ec3 red after #947 + #948 · reseal kd

**State: PROPOSED · HITL.** Base `70747ec3`. Seal `kd` from `bin/seal_registry.py next`; the Mesa records the letter.

Cause (CI runs 44994838293 / 44994838402 on 70747ec3): #948 was opened unsealed (sealing is serial) and merged
after #947 sealed kc, so three cached paths changed under VERSION kc (`version_sw_gate` RED), the huella and
`counters.json peso_sitio` went stale (`test_web.py` 2 FAIL). The «M0 incubation name» AssertionError in the
phase log is `phase_M0_cases.mjs --sabotage`, which must fail; the plain case is equal (sha cd6d33ee…).

Change: only the native chain — `atlas/world.py` → `counters.py` → `bin/seal.py --sellar --version kd`.
No limit, gate or source change.

Second cause, found by the local gate (both passes): #948 renamed the remote voice, but two browser tests still
pinned the old names — `talk_head_browser` looked for speaker «Node 0» (and the receipt now shares the speaker, so
it is skipped by class), `rack_ideas_browser` expected «Hexelion · Decision proposed…». Tests follow the label; no
source change. talk_head VERDE ×2, sabotages ojo/voz/duo ROJO; rack_ideas VERDE, sabotage ROJO.
