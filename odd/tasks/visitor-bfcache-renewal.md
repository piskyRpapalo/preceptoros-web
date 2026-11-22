# Ephemeral visitor renewal after page restoration

Status: IMPLEMENTED LOCALLY · MP3-06 · review required before integration.
Authority: bounded lifecycle repair under `play-without-node.md` and `ephemeral-visitor-charter.md`.

## Existing contract reused

`public/game/visitor_account.js` creates a consent-gated, non-exportable Ed25519 visit key in memory. `pagehide` ends its signing authority. `visitor_eggs.js` keeps current visit progress in memory and persists only independently signed adoptions. The map, visitor account, game rules, and public visitor authority are unchanged.

## Defect and repair

On a page restored from the back/forward cache, `pagehide` had ended the account key while `visitor_play.js` retained its `game` and `account` references. The next `enter(true)` tried to prove the ended visit and failed. The pagehide handler now ends and drops the game/account references and pending hatch bookkeeping; `pageshow` redraws the empty visit state. Each subsequent visit still requires explicit consent and generates a fresh key. An asynchronous initialization that crosses `pagehide` is discarded using a generation check.

No key, seed, visit profile, or previous permission is persisted or transferred. Existing signed adoption records remain viewable under their existing contract; a fresh visit cannot sign for them. There is no visitor signup endpoint or server-side account quota in this path.

## Checks

- Lifecycle harness: fresh visit after BFCache restore, consent rejection, and initialization/pagehide race; run twice.
- Existing visitor account suite: Ed25519 proof/signature validation, closed schema, key isolation, ended authority; run twice.
- Real browser BFCache, physical Android, and deployed behavior remain `NO_DATA(browser_bfcache_and_android_runtime_not_exercised)`.

## Rollback

Revert this single lifecycle patch and its test. The prior behavior is restored; no persisted data or server state is migrated.
