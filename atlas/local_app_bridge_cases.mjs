import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'public/game/local_app_bridge.js'), 'utf8');
const casos = [];
const caso = (nombre, ok, detalle) => casos.push({ nombre, ok: !!ok, detalle });
let llamadas = 0, opciones;
const respuesta = (obj) => ({ ok: true, text: async () => JSON.stringify(obj) });
const contexto = { TextEncoder, AbortController, setTimeout, clearTimeout, fetch: async (url, init) => {
  llamadas += 1; opciones = { url, init };
  return respuesta({ esquema: 'preceptoros.orquestador/1', intent: 'QUERY_STATE', estado: 'MEASURED', causa: null,
    origen: 'memory.fts5', respuesta: 'respuesta local', fuentes: 1 });
} };
createContext(contexto);
runInContext(source, contexto);
const bridge = contexto.AtlasLocalAppBridge;
caso('cargar el modulo no hace peticion', llamadas === 0, 'llamadas=' + llamadas);
const measured = await bridge.consultar(' ¿estado? ');
caso('QUERY_STATE va solo a loopback tras consultar()', measured.estado === 'MEASURED' && llamadas === 1 &&
  opciones.url === 'http://127.0.0.1:8740/api/orquestador' && JSON.parse(opciones.init.body).intent === 'QUERY_STATE', 'consulta loopback medida');
caso('request tiene cors sin credenciales ni redirecciones', opciones.init.mode === 'cors' && opciones.init.credentials === 'omit' &&
  opciones.init.redirect === 'error' && opciones.init.cache === 'no-store' && opciones.init.referrerPolicy === 'no-referrer' &&
  opciones.init.headers['Content-Type'] === 'application/json', 'opciones de aislamiento');
const before = llamadas;
const invalid = await bridge.consultar('x'.repeat(601));
caso('limite 600 caracteres sin emitir request', invalid.estado === 'NO_DATA' && invalid.causa && llamadas === before, invalid.causa);
const cause = await bridge.consultar('estado', async () => ({ ok: true, text: async () => JSON.stringify({
  esquema: 'preceptoros.orquestador/1', intent: 'QUERY_STATE', estado: 'NO_DATA', causa: 'RAG local ausente' }) }));
caso('NO_DATA conserva causa', cause.estado === 'NO_DATA' && cause.causa === 'RAG local ausente', cause.causa);
const bad = await bridge.consultar('estado', async () => ({ ok: true, text: async () => JSON.stringify({
  esquema: 'preceptoros.orquestador/1', intent: 'QUERY_STATE', estado: 'NO_DATA', causa: null }) }));
caso('rechaza NO_DATA sin causa', bad.estado === 'NO_DATA' && bad.causa === 'local app omitted the NO_DATA cause', bad.causa);
const tooBig = await bridge.consultar('estado', async () => ({ ok: true, text: async () => ' '.repeat(1024) }));
caso('rechaza cuerpo de respuesta de 1.024 bytes', tooBig.estado === 'NO_DATA' && /1,024-byte/.test(tooBig.causa), tooBig.causa);
const failed = await bridge.consultar('estado', async () => { throw new Error('browser permission'); });
caso('error local resulta NO_DATA con causa no inventada', failed.estado === 'NO_DATA' && /unavailable|denied/.test(failed.causa), failed.causa);
const ok = casos.every((c) => c.ok);
console.log(JSON.stringify({ ok, casos }));
process.exitCode = ok ? 0 : 1;
