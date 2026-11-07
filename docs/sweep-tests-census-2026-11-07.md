# STE sweep census: Spanish names in tests and code (same-slice plan)

**Status:** PROPOSAL · REQUIRES_SIGN · BABEL (continues the P1-P4 STE chain: #683 template, #684 docstrings, #685 CI comments)
**Measured:** 2026-11-07 on web main `0b5bf35b` · all 61 `tests/*.test.mjs` read in full this round
**Author:** Mesa · preceptor-orquestador-github

## Law cited

- Sovereign decree Q2 (2026-10-28): "absolutamente todo en ingles, legislativo y AI comprensible" — identifiers enter the sweep by phases, **tests + consumers in the same slice**, exceptions only by collision verdict.
- Standing renames law: docs/INDEX_RENAMING.md (D2 identifiers, D3 filenames; D1 comment migration rides the same rails).
- Names-in-English decree (2026-11-04): new pieces use English names.

## Census A — retirement guardians, 24 files, one shared Spanish block

Each carries the same two Spanish comment lines and the const `RETIRADOS`:

a11y_dom_guardian, a11y_media_guardian, a11y_print_guardian, a11y_tap_guardian, a11y_target_guardian, acho_audio_contract, cable, deep_links, deep_wave, en301_practice_arena, en301_practice_model, en301_story, en301_tutorial, en301_tutorial_building, front_door, hitl_firma, invocation_persistence, map_acho_figures, mcp_manifest, offline_world_provenance, old_map_dismantled, p4_killswitch_guardian, sung_card, web_mcp_capability_map.

All 24 read `public/sw-listas.js` as a literal path: the sw-listas rename (Census E) travels with all 24 in one slice.

## Census B — judge tests with test-local Spanish

- `aduana_page.test.mjs`: leer, juez, fallos, PAGINA, DECLARADAS, juego, registro, vivo
- `get_the_app.test.mjs`: leer, juez, juezGate, fallos, huellas, filas, bajas, nombre, firmada, cerebros, puerta, maquina, medido, fecha, portada, PAGINA, carta (plus release.json card fields: pruebas, sha256_manifiesto, assets[].nombre)
- `citations.test.mjs`: Spanish comments + sellos, letraCorrecta, citaCELEX, lineaEstrella, lineas, letra, texto, roto, desnuda
- `llms_txt.test.mjs`: Spanish comments + raiz, servido, TECHO_LLMS, cabe, prohibidos, relleno
- `map_zoom.test.mjs`: Spanish test names and comments throughout
- `node_catalogue.test.mjs`: fila, cat, cedulas, esquema, solo_lectura, nota, estado, causa, pendiente, verificado, ancla_ausente, recibido, cuenta_de_prueba, descartadas
- `node_file_receiver.test.mjs`, `node_bindings.test.mjs`, `node_reception_contract.test.mjs`, `node_signature_verify.test.mjs`: Spanish schema fields + K.huella, K.ordena, seal, cedula, firma_ssh, autenticidad, dispositivos, plan_sha256, clave_publica, esquema, nodo, estado, causa, fecha, recibo, reciboValido, pares
- `semantic_table.test.mjs`: MEDIDA, esperadas, claves + Spanish test names (served API in Census C)
- `face_openworld_terminal.test.mjs`, `army_wave_cartoon.test.mjs`, `summon_reveal_face.test.mjs`, `creation_flow.test.mjs`, `world_publisher.test.mjs`, `visitor_account.test.mjs`: served-API references listed in Census C/D
- Harness-key consumers (Spanish keys emitted by atlas/*_browser.mjs and asserted in tests): battle_replay_controls (fallos, medidas.tasas), ephemeral_user_pass (fallos, medidas.fin_visita, medidas.ultima), walk_avatar (fallos, medidas.llegada, medidas.dibujos), walk_keys (fallos, medidas.botones, medidas.retiro, medidas.llegada), visitor_battle, visitor_conquest, visitor_eggs (fallos; visitor_eggs also medidas.openssl), visitor_account (medidas.openssl)

Measured CLEAN (English-only): canonical_apex, context_hygiene_guardian, creation_contract, creation_feedback, creation_image_package, creation_parity, terminal_distribution, web_node_brain_grounding, worm_transition_bitmap, acho_editor, acho_language_lexicon, acho_paint, no_spanish_code (guardian; its PALABRAS_ES list is law data).

## Census C — served-code Spanish identifiers consumed by tests (D2 targets, one module per slice)

- `canon.js`: `huella`, `ordena` — consumed by node_bindings, node_file_receiver, node_reception_contract, node_signature_verify (+ their .py twins if any)
- `semantic_table.js`: export `AtlasSemantica`, `TABLA`, `de()`, `hueDe()`, fields hue/escala/flujo/pulso_hz/sello; `crab_render_hd.js`: `SELLOS` (single-source law F305)
- `wave_render.js`: export `AtlasOnda`, `dibuja` — consumed by army_wave_cartoon, summon_reveal_face, summon_reveal.js (COORDINATION: the open RENDER block W2 touches this family; slice after its verdict to avoid double base moves)
- `node_catalogue.js`: `lee`, `pinta`
- `openworld_state.js`: `leer`; state.json field `colonia` (wire data, Census D)
- `auth.js`: `Identity.firmarTexto` (via creation_flow.js; creation_flow + creation tests in the same slice)
- `node_reception_contract.js`: API `reciboValido`, schema fields (Census D)
- `sw-listas.js`: filename itself ("listas"); 24 literal-path readers (Census A) in the same slice

## Census D — wire/data collisions (verdict per piece before slicing; consumers ride the same slice)

- Cedula schema `preceptoros.cedula-nodo/1` and receipt `preceptoros.recibo-cedula/1` fields (esquema, nodo, estado, causa, firma_ssh, autenticidad, dispositivos, clave_publica, plan_sha256, recibido, recibo_sha256; states solicitado/linkeado/pendiente/verificado/ancla_ausente)
- Worker bindings and HTTP routes: `ADUANA` binding, `/api/v1/latidos`, `/api/v1/cedulas`, send.js `API + '/reto'`, `API + '/paquetes'`
- Data cards: release.json (pruebas, firmada, sha256_manifiesto), brains.json (cerebros, puerta, maquina, medido), openworld state.json (colonia, cobertura.estado, causa), catalogue schema `preceptoros.catalogo-cedulas/1` (solo_lectura, cedulas, nota)
- Public route `/aduana/` (measured URL contract: canonical_apex + docs/aduana-route-design.md)

## Census E — remaining file and directory names (D3)

- tests/: hitl_firma.test.mjs (guards the retired hitl_firma.js), aduana_page.test.mjs (guards the /aduana/ route)
- atlas/: dirs ojo/, legibilidad/, retirados/, propuestas/, puros/ (puros/ is the byte-parity source of served wave_rules.js — visitor_battle asserts equality minus one line; the rename travels with that test), mp_firma.mjs, global_map_recibos.json, lexicon_base_procedencia*.md, DIRECTIVA_V15_ESTADO.md, GUIA_CONTRATO.md, PLAN_APP_PILOTO.md; deferred binaries colonia_edificios/colonia_pagina/paleta_ciclo contact sheets
- config/: pruebas-retiradas.json, sw-huella.txt; docs/: PRUEBA_5_MINUTOS.md, ESTADO.md, NORTE5_LISTA_CONSERVACION.md, acho-estilo-mundo.md, terminal-ejemplo1.html, auditoria/, pruebas-retiradas/
- data/: atlas_mp_sesion_schema.json, atlas_oferta_schema.json; revision/cerebros/

## Slice plan (one PR per slice, propose-only, FIRMA per slice)

1. **S1** Census A: 24 guardians to English (comment + RETIRED). Zero contract.
2. **S2** Census B test-local Spanish to English, file by file group (aduana_page, get_the_app, citations, llms_txt, map_zoom first).
3. **S3** Census C: one module per PR with its tests (canon.js first; semantic_table+crab_render_hd; wave_render after W2 verdict; node_catalogue; openworld_state+state.json; auth+creation_flow; sw-listas with its 24 readers).
4. **S4** Census D: per-schema verdicts; each schema slice carries worker + lab + app consumers.
5. **S5** Census E file renames, one directory per PR, with sw-listas and parity tests aligned in the same slice.
6. **S6** Harness output keys (fallos->failures, medidas->measurements) with all atlas/*_browser.mjs emitters and their tests in one slice.

## Open verdicts for the Sovereign

- **firma**: FIRMA/FIRMO are protocol tokens (stay in actas and PRs). Proposal: wire fields firma_ssh/firma/firmada enter S4 with their schemas; the test filename hitl_firma.test.mjs stays (it cites the retired artifact it guards; append-only history). Alternative: rename to hitl_signing_retired.test.mjs in S5. Awaiting verdict.
- **aduana**: route /aduana/ and worker binding ADUANA stay (public URL contract); test filename stays as the route guard. Awaiting verdict.
- **Wire schemas (S4)**: each needs its measured consumer list (worker, lab, app) attached before the slice opens.

## NO_DATA with cause

- tests/*.py (9 files) not re-read this round: docstrings already swept by #684; their identifiers ride the same slices as their targets.
- tests/fake_dom.mjs not re-read this round; rides S2.
- D1 (served-code comment migration to docs/) is a separate standing law: when a served file is touched by a slice, its comments migrate per docs/INDEX_RENAMING in the same slice.
- p0x tanda 3 (Alejandria dissolution) is a separate piece on the p0x side (cu5); this census covers the web repo only.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
