# Neutral terminal on the shared map

`/face/basic.html` is a terminal view of `/openworld/`, not a second world. Its canvas renders the colony produced by `openworld_state.js` from `/openworld/estado.json`; its ephemeral walker moves only through `colony_controls.js` onto visible LIVE or STALE nodes. Pointer drag and arrow keys use the same movement rule.

The terminal does not save walker state, declare node liveness, or create buildings. A rejected step reports the source node seal when that hex exists in the source data. The other face pages remain available as deep links.

`/face/army.html` keeps its deep link but reports NO_DATA until an account army and SHA-256 profile are connected to the shared state. It no longer draws the synthetic army map or presents fixture waves as account data; its link opens the shared terminal.
