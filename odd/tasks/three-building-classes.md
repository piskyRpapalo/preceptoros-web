# Three building classes on the OpenWorld map

The Sovereign decided this on 2026-11-24, in chat: «solo debemos dejar el edificio de nodo creado por la app, el "whitepaper" de las conquistas, y los edificios del tutorial extremo a extremo».

The map shows exactly these three classes. Nothing else is a building. In particular, there is **no lottery**: it is retired, see `DEPRECATED.json` → `game.building.lottery`.

| class | who makes it | where it comes from | how it looks | depends on LIVE nodes? |
|---|---|---|---|---|
| **1 · Node** | the APP («Crear mi nodo»), signed and admitted | gateway `/api/world-state` → `colonia.buildings` (D1), drawn on the cell of a node whose seal is LIVE | `node_houses.js`: a big cyan tower with a spire (1.3×). The node that talks (primer-ancla) keeps the town hall (`node_beacon.js`), and S stays the main building | yes. No LIVE node means no house; a placeholder is never drawn |
| **2 · Whitepaper** | an ephemeral visitor's crab, by a real win (`visitor_battle_ui.js` → `conquer`) | the visit's own marks (`m.won && !m.fog`), held by the visit and the holdings ledger | `map_chunks.building`: a paper-white body, softer side shade, an ink `</>` sign and the conquest flag | no |
| **3 · Tutorial** | the web itself (`town_plan.js` + `map_chunks.KINDS`) | baked into the served page. There are eight town buildings with interiors (hostel, coliseum, choir, workshop, agora, customs, visitor-house and doctor, in `building_interiors.json`), plus the model tower. Scattered grey copies held by NPC guardians are what a visitor conquers into class 2 | the Acho canon roofs and colours (`map_chunks.KINDS`). They are grey while an NPC holds them | **no**: the whole first adventure runs with no gateway at all |

## Proof that the tutorial needs no LIVE node

`atlas/bang_walk_browser.mjs` serves `public/` from loopback with **no `/api` route**: the gateway is absent, so there are no nodes. A newcomer presses only the blinking «!».

Measured on 2026-11-24 at 360×716: 19 presses take the visitor from play to explore, through meet, beacon, summon ×2, practice (the coliseum) and conquest (a grey building). The conquest becomes class 2, and then come town and explore.

`atlas/first_adventure_browser.mjs` holds the same walk as a gate.

## Summons and odds without a lottery

- The summoning call lives in **Army** and in the **House** call.
- The honest odds («per thousand») sit next to each summon button.
- The Coliseum options are «Summons» (a door to Army) and «Summon odds, before you summon» (the `odds` action of `gacha.js`).
- The weighted draw in `canon.js` is `sorteo` (formerly `loteria`).
- The only trace left is the holdings ledger's kind order (`holdings_*.js` `KINDS`, the WASM contract). It still lists `lottery` for its index and is marked `[deprecated 2026-11-24]`.
