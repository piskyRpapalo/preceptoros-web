# World publisher bridge · proposal

Status: proposal; no production change or sign-off. The local prototype is not this deliverable.

## Proposed canon amendment for human decision

Allow OpenWorld to read the customs heartbeat publisher through a fixed, read-only same-origin service binding. The browser makes no direct request to a device or to the publisher's origin. The response is current evidence, never identity, conversation, or a combat decision. A publisher failure removes previously displayed live nodes and leaves the tutorial available with a visible cause. Offline remains tutorial-only. This amendment authorizes neither device access nor chat transport; it does not change the consent rule for model downloads. The Sovereign decides this amendment together with the implementation.

## Exclusive file ownership and integration

JN-3 owns the visitor-account, invocation, adoption and its page controller. The bridge owns new `worker/world_state.js`, `public/game/world_feed.js` and their new tests. The worker entry, deployment binding, page/controller hook, service-worker bypass, and generated seal are shared integration points: the bridge must be rebased after the current JN chain and must not be merged in parallel with another owner of those files. The old prototype touches the inline page and requires porting to the extracted controller. Letter ao is already used by JN-3; allocate a fresh version only against the actual base at landing.

## Acceptance

One fixed upstream; GET only; bounded body and timeout; reject invalid schema; no credential or user-selected URL forwarding; no cached live answer; explicit NO_DATA on error and stale/empty data; no invented nodes. Keep tutorial-only fallback; verify collision handling and preserve the visitor controls. Update the state-reader gate in the same piece if its baseline changes. Test valid, empty, malformed, oversized, timeout and unavailable responses; test browser recovery, offline, old-state removal, keyboard and one-map behavior. Report separately source, deployment, public heartbeat and model answer. CI and browser are NO_DATA until run.

Authorship: Codex (GPT-6.1-Terra).