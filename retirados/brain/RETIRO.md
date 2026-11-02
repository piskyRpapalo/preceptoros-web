# Retiro del cerebro externo (Qwen3 1.7B por MLC) · 2026-11-01

Lo que se retira con `git mv` y este recibo:
- `public/game/map_brain_worker.js`
- `public/game/browser_brain_manifest.json`
- `tests/map_brain_integrity.test.mjs`

Por qué, con medida:
- **Nunca cargó.** `load` terminaba siempre en `runtime_integrity_unavailable`: el runtime, la librería y la
  configuración del modelo no estaban verificados.
- **Pedía WebGPU**, que el Doogee no garantiza.
- **Sus pesos venían de fuera**: jsDelivr, Hugging Face y MLC GitHub.

Lo sustituye el cerebro del **nodo web**:
- `public/game/web_node_brain.js` y `public/models/web-node/manifest.json`.
- El runtime vendorizado en `public/vendor/wllama/`.
- Todo del mismo origen y con un SHA-256 por cada byte que se ejecuta.

Se conserva el contrato del veredicto (`odd/contracts/map-brain-status-verdict.schema.json`): las causas NO_DATA son las
mismas. Revertir: `git revert` del commit de esta pieza.
