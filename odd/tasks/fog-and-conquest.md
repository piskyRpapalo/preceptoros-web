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

## C2 · NPC buildings are the fights (built: web PR after #774)

- **House** loses the six patrol places of `visitor_battle.js` (Reef, Kelp, Ruins, Silt, Abyss, Core: «the names that appeared»). Their list in `visitor_battle_ui.js` goes.
- **A cleared NPC building** offers «Challenge» in its card. The duel is `wave_duel_scene` through `visitor_battle.run`.
  - The place comes from the mark: id = `q,r`.
  - Troops are seeded from `sha('atlas.patrulla/1:' + kind + ':' + q + ',' + r)`.
  - It is deterministic: no chance, no clock.
- **Winning conquers it for the session** (`e.luchados`): its building turns to colour with a flag, and its clearing opens wide.
  - It is never persisted off the device. Persistence, loot and loss stay on CLAUDE.md's signature list.
- **Guard:** a challenge on an NPC building reaches the duel, and a win flips `m.fog` for that session only.
- **Built and measured (2026-11-08):**
  - `visitor_battle.js npcPlace('b:<kind>:<q>,<r>')` builds the NPC's squad from the key alone (`npc_place_cases`), and `verify` replays it.
  - House shows one line («walk to a grey NPC building… and challenge it»): no patrol buttons, guarded.
  - The card of a cleared grey building offers «Challenge the NPC of this <kind>». It says NO_DATA when no troop has been adopted, and the tap closes the card (`panel_x`).
  - A win runs `conquer()`: colour (the painter's bake cache is dropped once), a flag (`map_fog_layer.js`) and a clearing of radius 4. Visit memory only.
  - On the Doogee: real taps walked the crab to (3,−2), then tapped the grey doctor at (4,−4); its card offered the challenge, and the duel played on the map («NPC wins · 2 rounds»: one troop against the NPC's squad). `conquer()` on the same doctor turned it green, with its flag.
- **Next, from the Sovereign's photos:**
  - Combat waves must be the summon's creature waves, with no extra adornments; the triangle and star squads are discarded.
  - Summoned waves must flow and move. Sound comes later, with the whole engine.

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

## C7 · Spectators: the eye over a fight (proposal; gated like C5)

The Sovereign, 2026-11-08:
- «es solo el individuo que está combatiendo el que ve el combate con zoom»;
- «los usuarios live de otros hardware verían 2 individuos luchando en mini, y un ojo sobre ellos»;
- «si clicka, se pone la vista del luchador (preferiblemente la de otro carbono frente a la de un NPC)»;
- «eso abrirá muchas puertas».

**The plan:**
- **On the fighter's own screen:** the zoomed duel (D1).
- **On every other live screen,** at the fight's hex on the map:
  - two minis (the fighter's crab and its opponent, or an NPC ghost) bobbing against each other;
  - an eye drawn above them. It is a 44 px target with an honest aria label, «Watch this fight».
- **A tap on the eye** opens the fighter's view: the same D1 face, replayed from the shared, resolved combat (deterministic, so both screens agree). It is never the fighter's private state.
  - If one fighter is another human (carbon) and the other an NPC, the view is the human's.
  - With two humans, either one.
- **What travels:** only the fight's public key (place, seed, the troops' public seeds) and its round index. Nothing about the person.
- **Gate:** the same as C5. Two simultaneous ephemeral accounts must first be measured live (`ephemeral-user.md`). Until then it is NO_DATA: «two simultaneous ephemeral accounts not yet measured».

Agent: claude-code · Model: claude-opus-5-5

## Also in this PR · the pad (Sovereign, 2026-11-08, with a photo of the Doogee)

- «3 abajo y 2 arriba, para que cuadren con los joysticks»: Town and Settings ride high between the wings; Play, Welcome and Communication sit low in a smile.
- «iconos más gorditos, como en el mini-html»: the glyphs are 23 px, weight 900, their strokes thickened with their own colour (off under forced colours).
- The rules live in `/game/talk.css` (2395 B gzip), because `openworld.css` is at its cap (now 7086 B, the old row rules removed).
- Measured on the Doogee: top row y = 594 (Town 133, Settings 183); bottom row y = 640/648/640 (Play 108, Welcome 158, Communication 208); all 44 px.
- Guards green: gamepad, two_clicks, eye_carbon, openworld.

## C6 · The game's chat over the World tab (app; proposal, visual first)

The Sovereign in chat, 2026-11-08: «sin moverse de la pantalla de "world" en la app, poder hablar con el mini-orquestador, y ver ambos la pantalla del juego al mismo tiempo… una ventana de chat transparente con letras que se vean bien».

- **Where:** the PreceptorOS app (`interface/app.html`), in the World tab, over `#openworld-frame`.
- **What:** a transparent chat panel over the live map. The user asks the mini-orchestrator how to play on the map and about strategy. Both see the same game screen.
- **Visual first.** This mission is only the window. The brain link comes later, as part of the base product: Hexelion running locally, still on the waiting list. Until then the panel says NO_DATA with its cause («the game brain is not linked yet»), and never invents answers.
- **Legible over any map colour:** text in the web's ink (#1d1b26) on a cream veil (#fffdf6 at about 80 %) with a soft blur behind it. The final colour is left for the Sovereign to choose.
  - Contrast is measured against the darkest and the lightest map tiles (≥ 4.5:1).
  - Forced colours: Canvas / CanvasText. Reduced motion: no slide.
- **The map stays playable:** the panel takes the bottom third at most and can be collapsed to one 44 px button. Map taps outside it still reach the map.
- **Done when:** in the mini window (420×642) and on the Doogee, the World tab shows the map with the chat over it, and a question shows its NO_DATA answer without leaving World.

## D1 · The duel's face: the summon's creature waves (built)

The Sovereign, 2026-11-08, with photos of the Doogee:
- «las ondas de combate no se parecen a las invocadas; esas que vemos en Doogee debes descartarlas»;
- «deben ser como la de la invocación, sin adornos extra por ahora»;
- «que aparezcan frente al cangrejo al comenzar el combate… el cangrejo y el oponente en esquinas contrarias… con Acho y movimiento real. Las ondas se chocan y desafinan».

**`public/game/duel_face.js` (new; same contract as `wave_duel_scene.escena`):**
- Each troop is drawn with `AtlasOnda.dibuja`, the summon reveal's creature. It has its face and its breath, and no squads, triangles or stars.
- The crab's side comes out in front of the crab, then stands near, low and left. The opponent stands far, high and right.
- Each side's wave runs to the middle, and the two meet there.
- Every hit detunes the struck creature (`desafina` = the wound plus a short shiver), as the canon says.
- The result comes only from the resolved combat. With reduced motion, the face shows the final frame.
- If the wave renderer is not loaded yet, it falls back to the old face, never to a blank.

**Measured:**
- `duel_face_cases` (3): the corners, the detuning, and no raw colour, chance or squad.
- `battle_replay_controls` now spies on the face in use and requires `duel_face`; its rates follow the controls `[0,0,0,4,2,0,2]`.
- Guards green: visitor_battle, visitor_conquest, openworld, eye_carbon, two_clicks.
- Doogee: the crab's glowing creature low-left in front of the crab, three NPC creatures high-right, and the waves meeting.
- `wave_duel_scene.js` is untouched (184 B under its cap). It stays as the fallback, and for the pages that still call it.
- Lexicon: the new face is in English. `visitor_battle.js` hands the hits over as `result.hits`, so no new Spanish word and no exception were added.

**Cinematic (Sovereign, later the same night):**
- «el cangrejo de espaldas mirando hacia el combate, y el enemigo en el ángulo contrario mirando de frente (los NPC fantasmas)».
  - The crab is drawn from behind, low-left. The NPC ghost faces us, high-right. The map is dimmed under a veil.
- «mejor que las ondas se muevan por la pantalla a que estén disparando… combate dinámico».
  - The fired wave lines are gone.
  - The creatures roam the field around the middle, cross, touch and bounce.
  - On its hit an attacker runs into its target until they touch, and the struck one is pushed back and shakes.
- «a lo mucho un 80 % del tamaño del cangrejo».
  - The radius is capped at `0.8 · CRAB · k / 2`.
- «iniciar el encuentro saliendo de la esquina del cangrejo… y las enemigas de la esquina contraria».
  - Each side spawns at its own `CORNER`.
- `duel_face_cases` now has 5 cases (corners, the 80 % cap, no fired wave).

- «mover realmente al cangrejo vivo a la esquina izquierda»: the duel takes the live crab off the map from where it stands (`surface.dataset.youx/youy`). It walks it into its corner and turns it to show its back.
  - `map_chunks.js` skips its crab while `surface.dataset.duel` is set (7153 B gzip, cap 7168).
  - `para()` gives the crab back to the map when the duel closes.
  - Doogee: the crab leaves its hex, glides to the corner, fights, and is back on its hex after Return.

**Rows, ending, night (Sovereign, later):**
- «las ondas deben avanzar y retroceder, empujando de frente contra el rival, reculando y volviendo a la marcha… una línea media… el ganador acabaría empujando y eliminando a las ondas del rival hasta la esquina oponente».
  - Each side forms a row on its own side of a middle line on the diagonal (`front`, `spot`: pure and tested).
  - The rows push, recoil and come on again. The line leans toward the side losing life.
  - At the end the winner pushes the line into the loser's corner while the beaten waves fade out.
- «que acabe en el momento en que las ondas enemigas mueran, y pon un Win o Defeat».
  - The end comes when the beaten side's last wave is gone.
  - A plate pops in: Win (gold), Defeat (violet) or Draw, from the crab's side.
- «el color crema del mapa en el combate no me gusta… oscuro, para disfrutar los neones de las ondas».
  - A night veil from the ink token covers the floor during the fight.
- «este será el único tipo de combate».
  - `visitor_battle_ui` and `scene.js` (`AtlasEscena.escena`, when given the hits) both draw with this face.
  - `wave_duel_scene.js` is kept only as the fallback, if the wave renderer cannot load. Retiring it is the next step.

## E1 · The summon turns, and the creatures get eyes (built; the lore is a proposal)

- «cuando se invoca una onda, debe moverse girando (no los ojitos) hasta que el usuario le da a Continue».
  - The reveal moved in whole game cycles (about 1 s), so the figure looked still.
  - The motion now runs on its own visual clock: about one turn every 6 s, with breathing. The phases stay on the cycle.
  - The eyes never turn.
- «ponles ojos como al cangrejo a las invocaciones; variados según el color de la onda o la exclusividad».
  - `wave_render.drawFace`: the eyes are drawn like the crab's: white, a crisp ink ring, an ink pupil and a glint. They stay opaque even over the additive glow.
  - The iris is in the wave's own colour.
  - The pupil's shape follows the rarity (`eyeKind`): normal round, magic ringed, rare slit, unique star.
  - Measured on the Doogee: a Rare summon with slit pupils.
  - Case with a canvas test double: broken slit → red.
- «ojos un 30 % más pequeños, y varía el número: entre 1 y 5».
  - The eyes are 30 % smaller.
  - `eyeCount(t)` reads 1 to 5 from the creature's own harmonics. It is deterministic: no chance, so the same creature keeps its eyes on every screen.
  - «los ojos pueden estar repartidos desde el centro, no tienen por qué ser humanos, solo dentro del centro esférico de la onda».
    - With 1, 4 or 5 eyes, one sits at the centre.
    - The others sit on a small ring tilted by `eyeSeed(t)`, also read from the harmonics.
    - Case: every eye stays within 45 % of the radius, for every count and tilt.
    - Doogee gallery: 1 centred, 2 diagonal, 3 a triangle, 4 and 5 around a centre eye.
- «no les pongas boca, solo ojos»: the mouth is gone. A ring seen between the eyes on some creatures is their own wave's inner loop, which turns with the body.
- «un background detrás de la invocación… la vista lejana del mapa, como si el user se hubiera encontrado a la onda mientras caminaba».
  - The summon's backdrop is a snapshot of the map taken at the summon. It drifts in a slow loop, blurred and dimmed under the night tint.
  - Its motion uses a frame count, not a clock: the reveal's law is the game cycle (test_web q2).
- «chispas cuando comienza el choque».
  - Every hit bursts in sparks where the two waves touch: rays in the hitter's gold or violet plus white, and a flash. They are additive on the night floor and deterministic.
  - Case: the hit still wounds; the wound line is code, not a comment.
- «que los combates duren al menos el triple».
  - Each hit now takes 1680 ms on screen instead of 560. Only the pacing changes; the result does not.
- **Lore and combat (proposal, needs his FIRMO):** each eye kind could carry one honest, legible trait in the fight. These are our own designs, not borrowed from any series. For example:
  - the ringed eye sees the next hit (a small lean);
  - the slit eye hits a little sooner;
  - the star eye shrugs off the first detune.
  - Every number goes through the engine's rules, never the face.
 and move more (task 8's first half). Sound comes later, with the whole engine.
