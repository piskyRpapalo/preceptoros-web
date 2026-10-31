let engine = null, manifest = null, active = false, history = [];
const encoder = new TextEncoder(), originalFetch = self.fetch.bind(self);
const EXPECTED_BASE = 'https://huggingface.co/mlc-ai/Qwen3-1.7B-q4f16_1-MLC/resolve/80b3abcec6c3b3f5355dc0cc99cc4fb578f192bc/';
function hex(bytes) { return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join(''); }
function recordFor(url) {
  if (!manifest || !url.startsWith(EXPECTED_BASE)) return null;
  const parsed = new URL(url);
  if (parsed.origin !== new URL(EXPECTED_BASE).origin || !parsed.pathname.startsWith(new URL(EXPECTED_BASE).pathname)) return null;
  const name = parsed.pathname.slice(new URL(EXPECTED_BASE).pathname.length);
  return manifest.records.find(r => r.name === name) || null;
}
function validateManifest(data) {
  if (!data || data.schema !== 'preceptoros.browser-brain/1' || data.model !== 'Qwen3-1.7B-q4f16_1-MLC' ||
      data.revision !== '80b3abcec6c3b3f5355dc0cc99cc4fb578f192bc' || data.base !== EXPECTED_BASE ||
      data.weightBytes !== 968001536 || !Array.isArray(data.records) || data.records.length !== 30) throw Error('Browser model inventory rejected');
  let total = 0; const seen = new Set();
  for (const record of data.records) {
    if (!record || !/^params_shard_(?:[0-9]|[12][0-9])\.bin$/.test(record.name) || seen.has(record.name) ||
        !Number.isSafeInteger(record.bytes) || record.bytes <= 0 || !Array.isArray(record.chunks) || !record.chunks.length) throw Error('Invalid model shard inventory');
    seen.add(record.name); let offset = 0;
    for (const chunk of record.chunks) {
      if (!chunk || chunk.offset !== offset || !Number.isSafeInteger(chunk.bytes) || chunk.bytes <= 0 || chunk.bytes > 16777216 ||
          !/^[0-9a-f]{64}$/.test(chunk.sha256)) throw Error('Invalid model chunk inventory');
      offset += chunk.bytes;
    }
    if (offset !== record.bytes) throw Error('Incomplete model chunk inventory');
    total += record.bytes;
  }
  if (total !== data.weightBytes) throw Error('Model weight inventory mismatch');
  return data;
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
  if (!record) {
    if (url.startsWith(EXPECTED_BASE) && /\.bin(?:[?#]|$)/.test(url)) throw Error('Unlisted model shard rejected');
    return originalFetch(input, options);
  }
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
        const url = typeof input === 'string' ? input : input.url;
        if (!record && url.startsWith(EXPECTED_BASE) && /\.bin(?:[?#]|$)/.test(url)) throw Error('Unlisted cached shard rejected');
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
      throw Error('runtime_integrity_unavailable: runtime, library and model configuration are not verified');
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
