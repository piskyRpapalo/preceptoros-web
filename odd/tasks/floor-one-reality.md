# Floor/1 as one reality

Commission: buzon #57 and replies 6639414332 and 6639415781. Base: web main
1567a5b1. Preserve `map_zoom.js`; the seven baked chunks and five existing visual
gates retain their routes. Every floor frame is deterministic and under 1,024
UTF-8 bytes. Served changes require the world, counters and fingerprint cascade.

- [x] F1: Establish the emitted chunk/frame contract and verify all seven hashes.
- [ ] F2: Make the five visual fixtures consume the same floor bands and painter.
- [x] F3: Check byte identity, band counts, determinism, reduced motion and zoom.
- [ ] F4: Register any new suite in CI; run the existing visual and repository gates.
- [ ] F5: Record device and deployment evidence separately; unmeasured is NO_DATA.

Initial reading: `map_painter.js` already emits `preceptoros.floor/1` through
`frameOf`; `atlas/hornea_chunks.mjs` emits `atlas.chunk/1` with a different
descriptive frame. Determine how to reconcile these without inventing a second
source of truth or changing the map gesture contract.

2026-11-04: The baked `floor` field comes from `frameOf`; exact bytes, hashes,
band totals and zoom have directed tests. Five fixture gates passed with Chrome
on the Beelink, including their sabotages. A global-map fixture used retired node
IDs on main; it now exercises the current IDs. Full CI remains NO_DATA: the
cloud runner cannot start Chrome; an unrelated browser-dependent Ojo case also
stopped the partial local CI run. Diff-size interpretation was asked in buzon#57.
