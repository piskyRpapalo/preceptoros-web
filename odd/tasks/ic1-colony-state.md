# IC1 · colony state core

Commission: buzon#30 ·6510526184; design and reference: `isometric-colony.md` (Bot Crossing cited, no code copied). This is an offline pure core, not a live map or renderer. No source of node liveness is wired here: callers supply only rows they have authority to show. Empty arrays are valid; no node, building or unit is invented.

The input has exactly `nodes`, `buildings`, `units` arrays. A node is `{id,q,r}` with unique axial integer coordinates; a building or unit is `{id,node}`, referring to an existing node ID. IDs are nonempty and globally unique; at most one building belongs to a node. Units are attached to nodes, not given synthetic positions. Order is preserved and output is detached from input. Invalid, dangling, duplicate or oversized states throw. The UTF-8 JSON output and the source are each strictly under 1,024 bytes. No clock, randomness, imports or I/O enter the core. Projection, movement, liveness and rendering are outside this slice.

Evidence: `node --test atlas/puros/colony_state_casos.mjs` (twice); cases cover six axial neighbours, deterministic output, detached input, dangling references, collisions, malformed fields, and both size limits. Actual live node data, projection/bitmap parity and weakest-device motion remain NO_DATA: no live source, projection or device measurement in IC1. Sabotage: removing the building ownership check makes its rejection case fail.

Huella: a missing building row now fails the same deterministic gate instead of becoming an orphan drawing; before IC1 no colony row contract existed. J-* mapping: NO_DATA, no mapping for this slice established in the commission.
