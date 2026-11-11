# rack-ideas-path-budget

Date: 2026-11-10
Law: THE MARCH · [Mesa audit](https://github.com/piskyRpapalo/buzon/issues/61).

## Objective
Bound the user-visible Study idea-index path and line, with a synthetic red-to-green adversarial fixture.

## Problem and why
The existing bridge validates index hashes but accepts any nonempty string path. An untrusted source can supply an oversized or traversal-like path, which appears in the readable chat output and exceeds its 1 KiB contract.

## Scope
No change to study index, fetch URL, onload network policy, or runtime flags. Restrict `path` to short relative `.md` paths without dot segments, doubled separator or non-index punctuation. Bound the summary to 220 UTF-16 units.

## Constraints
No external model, no credentials, no public service change except failing closed on malformed index rows. UTF-8 output under 1 KiB on new adversarial fixture; physical reader audibility NO_DATA.

## Checklist
- [x] P1: New sabotage fails on main.
- [x] P2: Pure Node fixture passes twice in isolated Beelink temp directory.
- [ ] P3: Full Web gates and live browser verification; NO_DATA until run.
- [ ] P4: Exact-head human FIRMO.

## Verification evidence
Node synthetic adversarial fixture RED on unmodified module, GREEN twice after patch (valid fixture and Unicode run). Existing native Web harness not yet run, NO_DATA.

## Standing signature
No sign-off asserted. A human must sign exact PR head.

## Log
Codex GPT-6 · proposal only.

## Next step
Check full Web CI and test the canonical index paths before merge.
