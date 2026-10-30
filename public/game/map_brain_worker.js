let engine = null, manifest = null, active = false, history = [];
const encoder = new TextEncoder(), originalFetch = self.fetch.bind(self);
const MODULE = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js';
const LIBRARY = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/146ed9cd4b4062e967b017fd2291f7106b50599f/web-llm-models/v0_2_84/base/Qwen3-1.7B-q4f16_1_cs1k-webgpu.wasm';
function hex(bytes) { return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join(''); }
function recordFor(url) {
  if (!manifest || !url.startsWith(manifest.base)) return null;
  return manifest.records.find(r => new URL(url).pathname.endsWith('/' + r.name));
}
async function verify(buffer, record) {
  if (buffer.byteLength !== record.bytes) throw Error('Model shard size mismatch');
  for (const chunk of record.chunks) {
    const part = buffer.slice(chunk.offset, chunk.offset + chunk.bytes);
    if (hex(await crypto.subtle.digest('SHA-256', part)) !== chunk.sha256) throw Error('Model chunk SHA-256 mismatch');
  }
  return buffer;
}
self.fetch = async (input, options) => {
  const url = typeof input === 'string' ? input : input.url, record = recordFor(url);
  if (!record) return originalFetch(input, options);
  const parts = [];
  for (const chunk of record.chunks) {
    const source = manifest.base + record.name + '?part=' + chunk.offset;
    const response = await originalFetch(source, { headers: { Range: 'bytes=' + chunk.offset + '-' + (chunk.offset + chunk.bytes - 1) }, credentials: 'omit', redirect: 'follow' });
    if (response.status !== 206) throw Error('Model source did not honor the bounded range');
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== chunk.bytes || hex(await crypto.subtle.digest('SHA-256', bytes)) !== chunk.sha256) throw Error('Model chunk integrity rejected');
    parts.push(bytes);
  }
  const buffer = await new Blob(parts).arrayBuffer(); await verify(buffer, record);
  return new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream' } });
};
// Recheck persistent runtime cache reads against the same pinned SHA-256 inventory.
if (self.caches) {
  const open = caches.open.bind(caches);
  caches.open = async name => {
    const cache = await open(name);
    return new Proxy(cache, { get(target, key) {
      if (key === 'match') return async (...args) => {
        const response = await target.match(...args), input = args[0], record = recordFor(typeof input === 'string' ? input : input.url);
        if (response && record) await verify(await response.clone().arrayBuffer(), record);
        return response;
      };
      const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
    } });
  };
}
self.onmessage = async event => {
  const message = event.data;
  if (active) { postMessage({ id: message.id, error: 'The brain is busy' }); return; }
  active = true;
  try {
    if (message.type === 'load') {
      if (message.consent !== true || engine) throw Error('Explicit download consent is required');
      const response = await originalFetch('/game/browser_brain_manifest.json', { cache: 'no-store' });
      if (!response.ok) throw Error('Browser model inventory unavailable');
      manifest = await response.json();
      if (manifest.schema !== 'preceptoros.browser-brain/1' || manifest.weightBytes !== 968001536) throw Error('Browser model inventory rejected');
      const runtime = await import(MODULE);
      engine = await runtime.CreateMLCEngine(manifest.model, {
        appConfig: { useIndexedDBCache: false, model_list: [{ model_id: manifest.model, model: manifest.base, model_lib: LIBRARY, vram_required_MB: 2036.66, low_resource_required: true }] },
        initProgressCallback: progress => postMessage({ progress: String(progress.text || 'Loading model').slice(0, 400) })
      }, { context_window_size: 1024 });
      postMessage({ id: message.id, ready: true, model: manifest.model });
    } else if (message.type === 'reply') {
      if (!engine) throw Error('Browser brain is not loaded');
      if (typeof message.text !== 'string' || !message.text.trim() || encoder.encode(message.text).length > 600 || typeof message.context !== 'string' || message.context.length > 160) throw Error('Chat input exceeds its context budget');
      const response = await engine.chat.completions.create({
        messages: [{ role: 'system', content: 'You are the local PreceptorOS map companion. Explain the selected map piece. Never execute actions or claim node telemetry, balance, ownership or rewards. Missing facts are NO_DATA. Replies are brief. Context: ' + message.context }, ...history, { role: 'user', content: message.text + '\n/no_think' }],
        temperature: 0, max_tokens: 96, stream: false
      });
      let text = response.choices?.[0]?.message?.content?.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (!text) throw Error('The model returned no visible answer');
      while (encoder.encode(JSON.stringify({ text, model: manifest.model })).length >= 900) text = Array.from(text).slice(0, -1).join('');
      history = [{ role: 'user', content: message.text }, { role: 'assistant', content: text }];
      postMessage({ id: message.id, text, model: manifest.model });
    } else throw Error('Unknown brain request');
  } catch (error) { postMessage({ id: message.id, error: String(error.message || error).slice(0, 500) }); }
  finally { active = false; }
};
