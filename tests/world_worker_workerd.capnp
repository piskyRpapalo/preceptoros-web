using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
  (name = "bridge", worker = (modules = [(name = "test.mjs", esModule = embed "world_worker_workerd.mjs"), (name = "world_state.mjs", esModule = embed "../worker/world_state.js")], bindings = [(name = "ADUANA", service = "upstream")], compatibilityDate = "2026-08-27")),
  (name = "upstream", worker = (modules = [(name = "upstream.mjs", esModule = embed "world_worker_upstream.mjs")], compatibilityDate = "2026-10-16"))
]);
