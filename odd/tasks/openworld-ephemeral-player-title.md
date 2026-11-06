# OpenWorld ephemeral visit title

## Outcome
While the existing local visit is active, the single map heading identifies its ephemeral pseudonym and current cell. Ending the visit removes the pseudonym from the heading. The account and walker remain the existing in-memory implementations.

## Scope and limits
Reuse `AtlasVisitorAccount.info().name`, `AtlasColonyControls.walker()` and the existing `#map-h`. No new account, identity persistence, profile, renderer, map, network request, or joystick. A missing walk position remains cause-bearing `NO_DATA`. The pseudonym is local display text, not a verified global account.

## Evidence
The existing browser path `atlas/ephemeral_user_pass_browser.mjs` now checks the title after visit start and after visit end. Browser/device and screen-reader behavior beyond that automated path remain `NO_DATA` until measured.

## Chain
Existing visit account → existing walker location → map heading: browser-verifiable. Character joystick, profile swap, live node link and game-wide account representation remain separate/unverified pieces.
