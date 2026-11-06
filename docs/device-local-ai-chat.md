# Device-local AI chat

The OpenWorld chat sends a question to the PreceptorOS app running on the same device as the browser. It uses the existing `AtlasLocalAppBridge` and the app's bounded `POST /api/oruestador` `QUERY_STATE` contract. The local app's RAG path supplies the response; the web page does not proxy the message through its server.

No request runs on page load. A person must submit a question. The bridge omits credentials, refuses redirects, uses `no-store`, limits questions to 600 characters and request/response bodies to 1,023 UTF-8 bytes, and returns NO_DATA with a cause if the app or browser local-network permission is unavailable.

The loopback target is the browser's own device. This feature does not address another device over the network and does not infer a map node from the local app. A missing app, RAG result, or permission stays visible as NO_DATA.
