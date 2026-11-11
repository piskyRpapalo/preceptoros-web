# WEB · Preserve the Chat Draft · 2026-11-11

**Agent:** Codex · GPT-6 · **Mode:** propose-only; no user-facing deployment, signature or merge. **Source:** WEB main `a404127b42b8`, existing `public/game/map_chat.js` and `atlas/classroom_chat_browser.mjs`. **Mission:** extend the existing live-chat family (Y10, D3 / D12); no new chatbot, endpoint or mission board.

## Problem and source

The WEB public OpenWorld form cleared `#question` immediately after the visitor selected Hexelion or a loaded local model and pressed Send. In an actual isolated Chrome visit, a **synthetic gateway HTTP 503** left the input empty, even though the page displayed a correct NO_DATA failure. The user had to retype the question. Reproduction in `atlas/map_chat_draft_browser.mjs` was **RED before code change** (`failed gateway erased draft`).

This is not a measured failure of the private APP Talk flow. It is a separate user-facing WEB issue, in the existing chat component. Neither local model download nor real remote gateway contact was necessary to prove it.

## Adaptation to the existing UI

Change only the current `map_chat.js` event handlers. Keep the input text until an accepted response is rendered. On a failure, display the existing explicit cause and say that the question remains in the text box. If a newer draft was typed while a response was pending, do not erase it on success or failure; only clear when the current value equals the text that was actually answered. The existing visit-generation, busy, source-check and remote disclosure fences remain in place.

No extra page, chat provider, account flow, storage, runtime dependency or background network request. The web remains the static window and may still report NO_DATA for unavailable remote services.

## Measurements and negative controls

| Gate | Before | After proposed change |
|---|---|---|
| Browser remote 503 keeps question | **RED**: draft erased | **GREEN** ×2 |
| Browser answered remote clears sent question | NO_DATA: not isolated before | **GREEN** ×2 |
| Browser late remote result does not erase newer draft | NO_DATA | **GREEN** ×2 |
| Browser local model failure keeps question | NO_DATA | **GREEN** ×2 |
| Browser local answer clears sent question | NO_DATA | **GREEN** ×2 |
| Browser late local result preserves newer draft | NO_DATA | **GREEN** ×2 |
| Deliberately reintroduce input erasure | N/A | **RED** ×2 (caught) |
| Existing `classroom_chat_browser.mjs` | Existing test | **GREEN** ×2 |
| Actual production remote chat, screen reader, touch | NO_DATA | **NO_DATA**: no live consented E2E test |

`atlas/map_chat_draft_browser.mjs` uses a local test server and a synthetic browser fetch interceptor. It counts requests and checks none occur on cold load or during locally mocked model work. All claims are only for the tested browser/harness conditions; zero network requests to *all* external destinations on every WEB route is not asserted from this focused test.

## Publication fence

This modifies cached `public/game/map_chat.js`. A new service-worker `VERSION` and matching `config/sw-huella.txt` must be assigned **in the Mesa** and then produced by the repository's `bin/seal.py`; the WEB PR cannot merge until `atlas/version_sw_gate.mjs`, `test_web.py`, all exact-head CI and independent BEACON are green. Existing [WEB #794](https://github.com/piskyRpapalo/preceptoros-web/pull/794) announced the next seal `he`; that value must **not** be reused. No seal has been assigned to this proposal at the time of this receipt.

**Next piece:** obtain a fresh Mesa-assigned seal, rebase on current main, run full gates ×2 including sabotage, announce exact head, and request Sovereign FIRMO. Do not merge or deploy ahead of the signed package.
