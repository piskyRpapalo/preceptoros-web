# Device-local AI chat

**Status: proposed; OpenWorld integration is not verified.** The existing
`AtlasLocalAppBridge` module defines a same-device request to the PreceptorOS
app's `POST /api/orquestador` `QUERY_STATE` contract. The current OpenWorld
page does not load the module or call it from `map_chat.js`. A complete
browser-to-app conversation, including a RAG answer, remains NO_DATA until
it is wired and measured end to end.

When called, the bridge omits credentials, refuses redirects, uses `no-store`,
accepts up to 600 characters and rejects request or response bodies of 1,024
UTF-8 bytes or more. It returns NO_DATA with a cause for unavailable access or
an invalid response. The loopback target is the browser's own device; it does
not address another device or infer a map node.

The intended interface asks only after an explicit user action. No request is
made by the bridge merely because its module is loaded. This intent is not a
claim that the OpenWorld chat currently offers the local-app connection.
