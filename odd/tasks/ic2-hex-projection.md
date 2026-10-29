# IC2 · fixed hex projection

Commission: buzon#30 ·6510526184; design and reference: `isometric-colony.md` (Bot Crossing cited, not copied). The pure core maps integer axial coordinates to `{x:48q,y:12q+24r}`; the six neighbours share edges of a 64 × 24 screen-space hexagon. It rejects non-integers and coordinates outside ±1,000,000. There is no clock, randomness, dependency, engine or network in the projection. This is offline and does not replace the served map.

The check page uses a valid synthetic `preceptoros.vector/1` plus explicit synthetic axial cells: vector/1 does not itself define colony rows, so a vector-to-colony mapping remains NO_DATA. Chrome renders twice in separate runs; the gate compares every RGBA byte and deliberately changes one byte to prove the comparison can fail. This establishes repeatability in the tested browser, not cross-device bitmap parity, live data, or animation performance. Those remain NO_DATA until measured. IC1 remains a separate proposal; integration awaits its reviewed contract.

Huella: the bitmap comparison now detects a one-byte change with identical fixture input; before this slice there was no gate for this projection. J-* mapping: NO_DATA, no mapping supplied for this slice.
