// The web node brain (2026-11-01): a small model that lives IN the web, served by this same origin in chunks, and runs
// on the visitor's own CPU (WebAssembly; no WebGPU needed, so it reaches the Doogee). Model: SmolLM2-135M-Instruct
// Q4_K_M (Apache-2.0), 105,454,144 bytes in 5 chunks under 25 MiB. Runtime: wllama 3.8.1 (MIT), vendored in
// /vendor/wllama/. /models/web-node/manifest.json pins one SHA-256 for every byte that runs: the runtime script, the
// wasm and each chunk. Nothing is fetched without an explicit consent; a byte that does not match is NO_DATA with its
// cause, never a guess. Verified bytes are kept in CacheStorage by hash, so a second visit downloads nothing.
// 2026-11-01 (guia LoRA): load() takes the manifest to load, so the visitor can choose the base model or the house guide
// (/models/web-node-guide/, a LoRA of the same base trained on this map's facts); both pass the same integrity checks.
// Answers are greedy (temperature 0, top_k 1) and grounded on the page's own labels; the runtime reuses its prompt cache,
// so wording may vary between turns (measured 2026-11-01). The model advises;
// it never signs, plays or spends for the visitor.
(function (root) {
  'use strict';
  var MANIFEST = '/models/web-node/manifest.json', CACHE = 'web-node-brain-1';
  // Only a same-origin manifest under /models/<one folder>/ may be chosen: the chooser cannot point anywhere else.
  var MANIFEST_PATH = /^\/models\/[a-z0-9-]+\/manifest\.json$/;
  // The facts the guide may use: the real labels of this page. Small models invent when they are not given facts.
  var SYSTEM = 'You are the guide of the tutorial cabin on the PreceptorOS web map. Reply in one or two short sentences. ' +
    'Facts: Move with the arrow keys or by dragging the on-screen stick on the map. Press "Start an ephemeral visit" to play. ' +
    '"Visit the beacon" gives 100 copper once per visit. "Sign invocation" summons a wave creature; the reef summon costs 50 copper. ' +
    'Eggs hatch after some steps with "Sign adoption". Battles are practice and are replayed exactly. ' +
    'If the answer is not in these facts, say NO_DATA.';
  var state = { status: 'idle', engine: null, manifest: null, model: null, src: null };

  function noData(cause, detail) { var e = new Error(detail || cause); e.cause = cause; return e; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha(buf) { return root.crypto.subtle.digest('SHA-256', buf).then(hex); }

  // check(m) → the manifest when every entry is same-origin, bounded and pinned; throws the cause otherwise.
  function check(m) {
    if (!m || m.schema !== 'preceptoros.web-node-brain/1' || typeof m.model !== 'string') { throw noData('model_integrity_unavailable', 'manifest rejected'); }
    var all = (m.runtime || []).concat(m.chunks || []);
    if ((m.runtime || []).length !== 2 || !(m.chunks || []).length) { throw noData('model_integrity_unavailable', 'manifest incomplete'); }
    all.forEach(function (e) {
      if (!e || typeof e.name !== 'string' || e.name.charAt(0) !== '/' || e.name.charAt(1) === '/' ||
          !Number.isSafeInteger(e.bytes) || e.bytes <= 0 || e.bytes > 25 * 1024 * 1024 || !/^[0-9a-f]{64}$/.test(e.sha256)) {
        throw noData('model_integrity_unavailable', 'entry rejected: ' + (e && e.name));
      }
    });
    return m;
  }

  // bytes(entry, say) → the verified bytes of one entry: from the cache when present, else fetched once and cached.
  function bytes(entry, say) {
    var cache = root.caches ? root.caches.open(CACHE) : Promise.resolve(null), key = '/web-node-brain/' + entry.sha256;
    return cache.then(function (c) {
      return (c ? c.match(key) : Promise.resolve(null)).then(function (hit) {
        var got = hit ? hit.arrayBuffer() : root.fetch(entry.name, { credentials: 'omit' }).then(function (r) {
          if (!r.ok) { throw noData('model_integrity_unavailable', entry.name + ' HTTP ' + r.status); }
          return r.arrayBuffer();
        });
        return got.then(function (buf) {
          if (buf.byteLength !== entry.bytes) { throw noData('model_integrity_unavailable', entry.name + ' size mismatch'); }
          return sha(buf).then(function (h) {
            if (h !== entry.sha256) { if (c && hit) { c.delete(key); } throw noData('model_integrity_unavailable', entry.name + ' SHA-256 mismatch'); }
            say((hit ? 'Verified from this device: ' : 'Downloaded and verified: ') + entry.name.split('/').pop());
            if (c && !hit) { return c.put(key, new Response(buf.slice(0))).then(function () { return buf; }); }
            return buf;
          });
        });
      });
    });
  }

  // load({ consent, say, manifest }) → resolves when the model answers; say(text) narrates each verified step (for
  // #chat-note). manifest defaults to MANIFEST; choosing another one unloads the running model first.
  function load(opts) {
    var say = (opts && opts.say) || function () {};
    if (!opts || opts.consent !== true) { return Promise.reject(noData('consent_required', 'Explicit download consent is required')); }
    var src = opts.manifest === undefined ? MANIFEST : opts.manifest;
    if (typeof src !== 'string' || !MANIFEST_PATH.test(src)) { return Promise.reject(noData('model_integrity_unavailable', 'manifest path rejected: ' + src)); }
    if (state.status === 'loading' || state.status === 'busy') { return Promise.reject(noData('model_busy', 'The brain is already loading')); }
    if (state.status === 'ready' && state.src === src) { return Promise.resolve(state); }
    if (state.engine) { try { if (state.engine.exit) { state.engine.exit(); } } catch (e) { /* the old engine is dropped either way */ } }
    state.engine = null; state.model = null; state.src = null;
    state.status = 'loading';
    return root.fetch(src, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (m) {
      state.manifest = check(m);
      var js = m.runtime[0], wasm = m.runtime[1];
      return bytes(js, say).then(function (jsBuf) {
        return bytes(wasm, say).then(function (wasmBuf) {
          var parts = [], chain = Promise.resolve();
          m.chunks.forEach(function (c, i) { chain = chain.then(function () { say('Model chunk ' + (i + 1) + ' of ' + m.chunks.length + '…'); return bytes(c, say).then(function (b) { parts.push(b); }); }); });
          return chain.then(function () {
            var jsUrl = URL.createObjectURL(new Blob([jsBuf], { type: 'text/javascript' }));
            var wasmUrl = URL.createObjectURL(new Blob([wasmBuf], { type: 'application/wasm' }));
            return import(jsUrl).then(function (W) {
              var engine = new W.Wllama({ default: wasmUrl, 'single-thread/wllama.wasm': wasmUrl }, { suppressNativeLog: true });
              say('Starting the model on this device…');
              return engine.loadModel([new Blob(parts)], { n_ctx: 1024, n_threads: 1 }).then(function () {
                state.engine = engine; state.model = m.model; state.src = src; state.status = 'ready'; return state;
              });
            });
          });
        });
      });
    }).catch(function (e) { state.status = 'idle'; throw e.cause ? e : noData('model_unavailable', e.message); });
  }

  // reply(text, context) → { text, model, sha, verified: true } — sha is the SHA-256 of the answer text (Voice Star).
  function reply(text, context) {
    if (state.status !== 'ready') { return Promise.reject(noData('model_not_installed', 'Browser brain is not loaded')); }
    if (typeof text !== 'string' || !text.trim() || new TextEncoder().encode(text).length > 600) { return Promise.reject(noData('input_out_of_bounds', 'Chat input exceeds its context budget')); }
    state.status = 'busy';
    return state.engine.createChatCompletion({
      messages: [{ role: 'system', content: SYSTEM + ' Selected on the map: ' + String(context || 'Tutorial cabin').slice(0, 160) + '.' }, { role: 'user', content: text }],
      temperature: 0, temp: 0, top_k: 1, seed: 1, max_tokens: 56, stream: false
    }).then(function (r) {
      var out = (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content || '').trim();
      // Keep the first paragraph and at most two sentences: a small model drifts after that.
      out = out.split(/\n\s*\n/)[0].replace(/\s+/g, ' ');
      var two = out.match(/^(.*?[.!?])(\s.*?[.!?])?(\s|$)/); if (two) { out = (two[1] + (two[2] || '')).trim(); }
      if (!out) { throw noData('model_unavailable', 'The model returned no visible answer'); }
      while (new TextEncoder().encode(out).length > 600) { out = Array.from(out).slice(0, -1).join(''); }
      return sha(new TextEncoder().encode(out)).then(function (h) { return { text: out, model: state.model, sha: h, verified: true }; });
    }).then(function (a) { state.status = 'ready'; return a; }, function (e) { state.status = 'ready'; throw e.cause ? e : noData('model_unavailable', e.message); });
  }

  root.AtlasWebNodeBrain = { load: load, reply: reply, check: check, status: function () { return state.status; }, loaded: function () { return state.src; }, MANIFEST: MANIFEST };
})(globalThis);
