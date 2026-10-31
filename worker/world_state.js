// Fixed read-only service binding. No client-selected upstream or credentials.
const SCHEMA = 'preceptoros.openworld-estado/2';
function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'
  }});
}
function missing(cause) {
  return reply({esquema: SCHEMA, colonia: {nodes: [], buildings: [], units: []},
    cobertura: {estado: 'NO_DATA', causa: cause}}, 503);
}
export async function worldState(request, env) {
  if (request.method !== 'GET') return new Response(null, {status: 405, headers: {Allow: 'GET'}});
  if (!env.ADUANA) return missing('world_publisher_unavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await env.ADUANA.fetch(new Request('https://api.preceptoros.org/api/v1/latidos', {
      method: 'GET', redirect: 'error', signal: controller.signal
    }));
    if (!response.ok || !response.body) return missing('world_publisher_failed');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', {fatal: true});
    let size = 0, raw = '';
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) { await reader.cancel(); return missing('world_state_too_large'); }
        raw += decoder.decode(value, {stream: true});
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
    const data = JSON.parse(raw);
    if (data.esquema !== SCHEMA || !data.colonia || !Array.isArray(data.colonia.nodes) ||
        !Array.isArray(data.colonia.buildings) || !Array.isArray(data.colonia.units)) {
      return missing('world_state_invalid');
    }
    return reply(data);
  } catch { return missing('world_publisher_unavailable'); }
  finally { clearTimeout(timer); }
}
