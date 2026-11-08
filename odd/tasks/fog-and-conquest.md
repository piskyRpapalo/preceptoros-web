# Fog of war, the node's city, and conquest

The Sovereign in chat, 2026-11-08:
- «poner niebla de guerra y mostrar en el nodo solo 1 tipo de cada edificio; el resto en gris, y les ponemos los NPC»;
- «pintar el suelo simulando la propiedad del nodo, con los edificios dentro: todo el suelo del mismo color, como una ciudad»;
- «sacar de House los edificios de combate (los nombres que aparecían); ahora son los edificios NPC los que usa la cuenta para luchar y conquistar»;
- «una página de conquista con una bandera en los edificios controlados, y un extensible con los tipos de edificio y el nivel de personalización; así salen de Settings (Build). Cuando el usuario tiene edificios vivos en el mapa, le aparecen en su House»;
- «la niebla es preciosa».

This continues `mundo-grande.md` (G4 the fog on the floor, G5 the patrols on the floor) and `lugares-del-rack.md` (`npc` kind).

## C1 · Fog, city and NPC buildings (this PR)

**`map_chunks.js` `landmarks()`:**
- The node keeps one building of each kind: the one nearest the cabin. It is drawn in colour and named.
- Every other building is an NPC's (`m.fog = true`): drawn grey, never named.
- `world.city` holds the node's property: land within 2 of the cabin and within 2 of each of the node's buildings.
  - The painter gives it one stone paving colour and no band texture: one city.
  - Buildings are spaced 4 apart, so no NPC building can stand in the city (tested).

**`map_fog_layer.js` (new):**
- **The fog.** One veil from the tokens at 62 % over the floor. It is cut by soft clearings:
  - the cabin (radius 4);
  - the node's buildings (2);
  - every hex the crab stands on (2), so walking clears it.
  - The clearings are in page memory for this visit: nothing is stored or sent.
- **The NPCs.** An NPC creature (Acho: body, eyes, a wave) stands by each grey building.
- **The tap law.** A tap on a building still in the fog opens no card; the bubble says «An NPC holds this … Walk closer to clear it».

**Measured:**
- `map_chunks.js` 7145 B gzip (cap 7168); `gamepad.js` 8991 B (cap 9000); 148 precached routes.
- On the Doogee at zoom 1: the stone city around the crab with 3 of the node's buildings named, grey NPC buildings with their creatures, and fog at the edges.
- **Guards:**
  - `map_fog_cases` (4) is pure. Its `draw` case caught a comment that cut the fog's `fillRect`; it was sabotaged red first.
  - `map_drag` now taps the node's building nearest the centre. It also taps an NPC building in the fog: no card, and the bubble names it. Removing the tap law turns it red.

## C2 · NPC buildings are the fights (next)

- **House** loses the six patrol places of `visitor_battle.js` (Reef, Kelp, Ruins, Silt, Abyss, Core: «the names that appeared»). Their list in `visitor_battle_ui.js` goes.
- **A cleared NPC building** offers «Challenge» in its card. The duel is `wave_duel_scene` through `visitor_battle.run`.
  - The place comes from the mark: id = `q,r`.
  - Troops are seeded from `sha('atlas.patrulla/1:' + kind + ':' + q + ',' + r)`.
  - It is deterministic: no chance, no clock.
- **Winning conquers it for the session** (`e.luchados`): its building turns to colour with a flag, and its clearing opens wide.
  - It is never persisted off the device. Persistence, loot and loss stay on CLAUDE.md's signature list.
- **Guard:** a challenge on an NPC building reaches the duel, and a win flips `m.fog` for that session only.

## C3 · The Conquest page (next)

- A page `/game/conquest.html` (its own file: `openworld/index.html` is at its ceiling).
  - It shows a flag on each controlled building: the node's own, plus this visit's conquests.
- **An expandable «Building types» list:** the nine kinds and the model tower. For each kind:
  - its roof;
  - its colour token;
  - the customisation level reached (none, name, skin, speech). It is honest: what is not yet built says NO_DATA with its cause.
- **Build moves here from Settings.** `settings_sheet.js` loses its Build section, and the same `preceptoros.built` list is kept (no data lost).

## C4 · House shows the user's live buildings (next)

- When the account has live buildings on the map, House lists them, each with the aura on a tap.
  - «Live» means the sealed LIVE state of `lugares-del-rack.md`. Until the rack transmits, the list says NO_DATA with its cause.
- The app is the origin of buildings for packaging (`PreceptorOS data/edificio.schema.json`, the `DEPLOY_BUILDING` route). See web#759, NO_DATA 1.

## C5 · The pre-companion (proposal; gated)

- A user who holds a live building with a chatbot can give it a custom speech through a chunk AI: a «pre-companion».
- **Gate:** only once two ephemeral accounts are measured working at the same time (`ephemeral-user.md`). One user's conquest and customisation must be visible, live, to the other, who can talk to the building.
- Until then it is NO_DATA: «two simultaneous ephemeral accounts not yet measured».

Agent: claude-code · Model: claude-opus-5-5

## Also in this PR · the pad (Sovereign, 2026-11-08, with a photo of the Doogee)

- «3 abajo y 2 arriba, para que cuadren con los joysticks»: Town and Settings ride high between the wings; Play, Welcome and Communication sit low in a smile.
- «iconos más gorditos, como en el mini-html»: the glyphs are 23 px, weight 900, their strokes thickened with their own colour (off under forced colours).
- The rules live in `/game/talk.css` (2395 B gzip), because `openworld.css` is at its cap (now 7086 B, the old row rules removed).
- Measured on the Doogee: top row y = 594 (Town 133, Settings 183); bottom row y = 640/648/640 (Play 108, Welcome 158, Communication 208); all 44 px.
- Guards green: gamepad, two_clicks, eye_carbon, openworld.
