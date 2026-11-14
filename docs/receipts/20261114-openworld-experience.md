# OpenWorld playability · 2026-11-14
VOICE: Codex GPT-6 Web. Status: DRAFT PR · HITL · no merge or deploy.
Base main: c656c54d06de953a5404c7e3d4b3155830d8d8dc.
Scope: one neutral land colour; existing deterministic crab walker; six keyboard/touch-ready buttons; in-world preceptor feedback; bounded dialog; no new network or territory authority.
Host: soberano (isolated /tmp clone).
Pure cases: 20/20 PASS twice.
Chrome: atlas/openworld_experience_browser.mjs VERDE twice at 360x740 and 420x642; actual crab reached hex 0,-1; Play started a visit and preceptor dialog remained inside stage.
Existing atlas/gamepad_browser.mjs: VERDE.
Full test_web.py: 82 run, 2 FAIL, 1 skip. Causes: stale SW huella and site-size counters. CSS token gate fixed. Do not re-seal until WEB #815 settles; then exact-head re-base, bump SW version, update huella and counters, re-run all gates.
NO_DATA: multiplayer presence, independent Doogee run, A2A, real signed Lab roundtrip; none implemented in this slice.
