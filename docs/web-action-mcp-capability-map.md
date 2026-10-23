# Web action → MCP capability map

Base: WEB `08a0be9311066bade3a1225834311597781dc536`.

`web-mcp-capability-map.json` records the six static deep-link IDs, the UI
target/effect implemented by `public/game/deep_links.js`, the MCP binding, and
the human action still required. All six MCP bindings are explicitly `null`:
the click opens or focuses local UI and does not send JSON-RPC or authorize a
state change. No UI action is equated with a similarly named MCP tool.

`tests/web_mcp_capability_map.test.mjs` compares the map with both manifest
copies and the implementation table. A nonexistent MCP binding is a test
failure. These checks do not establish a browser transport or attached MCP
client; those remain `NO_DATA`.

## Public title hygiene remains gated

The served root and `public/` inventory currently expose an internal node name
inside an action title. The proposed replacement is the generic title
“Move the lighthouse”; the user-facing effect should name only the destination
list. The duplicated `deep_links.js` title needs the same wording. This branch
does not edit served files because those changes require a Mesa-assigned seal
version and a same-PR re-seal. The Mesa must assign that version before the
runtime hygiene change is made. No seal or public deployment is claimed here.

Verification: `node --test tests/web_mcp_capability_map.test.mjs`. This is a
contract/source test, not an external client or browser test.
