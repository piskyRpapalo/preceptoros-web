# Commission · OpenWorld visitor profile · RENDER

## Problem
House/summons and Army currently occupy separate terminal categories, although
both describe the same local ephemeral visit. The profile is not tied visibly
to whether that visit exists.

## Outcome
One Profile leaf contains the existing visit resources, summons and army. Its
button is available only while a visit is active; ending the visit closes it.
A visitor can still start a visit from the existing Welcome flow.

## Affects
The existing OpenWorld terminal categories and visitor events; no new account,
network service, signing authority or renderer. Claim buzon#53 ·6661588968.

## Constraints
Keep visit creation and end semantics, current resources and army, single map,
keyboard access, text labels and accessible 44px controls. Do not infer visitor
counts, node ownership or persistence. Coordinate with #661 historical places,
#670 controls retirement and #671 communication player. Exact-head review and
seal are required; no deployment implied.

## Open questions
- The future visitor joystick requires a separately measured binding between
  the ephemeral account and a movable unit; this piece does not create it.
- The tutorial's full six-step sequence is not yet established as a single
  working flow; preserve existing behavior and do not claim completion.
