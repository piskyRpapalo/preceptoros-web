(function (root) {
  'use strict';

  var URL_LOCAL = 'http://127.0.0.1:8740/api/orquestador';
  var MAX_BYTES = 1024;
  var encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;

  function bytes(text) {
    if (encoder) { return encoder.encode(text).length; }
    return unescape(encodeURIComponent(text)).length;
  }

  function noData(cause) { return { estado: 'NO_DATA', causa: cause }; }

  function validar(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p) || p.esquema !== 'preceptoros.orquestador/1' ||
        p.intent !== 'QUERY_STATE' || typeof p.estado !== 'string' ||
        (typeof p.causa !== 'string' && p.causa !== null)) { return noData('invalid local app response envelope'); }
    if (['MEASURED', 'STALE', 'NO_DATA'].indexOf(p.estado) < 0) { return noData('local app returned an unsupported state'); }
    if (p.estado === 'NO_DATA' && (!p.causa || !p.causa.trim())) { return noData('local app omitted the NO_DATA cause'); }
    if (p.estado === 'MEASURED' && (typeof p.origen !== 'string' || !p.origen || typeof p.respuesta !== 'string' || !p.respuesta)) {
      return noData('measured answer omitted its source or answer');
    }
    return p;
  }

  async function consultar(consulta, fetcher) {
    if (typeof consulta !== 'string' || !consulta.trim() || Array.from(consulta).length > 600) {
      return noData('query must contain 1 to 600 characters');
    }
    var body = JSON.stringify({ esquema: 'preceptoros.orquestador/1', intent: 'QUERY_STATE', payload: { consulta: consulta.trim() } });
    if (bytes(body) >= MAX_BYTES) { return noData('request reached the 1,024-byte limit'); }
    var call = fetcher || root.fetch;
    if (typeof call !== 'function') { return noData('browser fetch is unavailable'); }
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? root.setTimeout(function () { controller.abort(); }, 6000) : null;
    try {
      var response = await call(URL_LOCAL, { method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
        redirect: 'error', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' }, body: body,
        signal: controller ? controller.signal : undefined });
      if (!response || response.ok !== true || typeof response.text !== 'function') { return noData('local app request failed or was denied'); }
      var raw = await response.text();
      if (bytes(raw) >= MAX_BYTES) { return noData('response reached the 1,024-byte limit'); }
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) { return noData('local app returned invalid JSON'); }
      return validar(parsed);
    } catch (e) {
      return noData('local app unavailable or browser local-network access denied');
    } finally { if (timer !== null) { root.clearTimeout(timer); } }
  }

  root.AtlasLocalAppBridge = { consultar: consultar, URL: URL_LOCAL, MAX_BYTES: MAX_BYTES };
  if (typeof module === 'object' && module.exports) { module.exports = root.AtlasLocalAppBridge; }
})(typeof window !== 'undefined' ? window : globalThis);
