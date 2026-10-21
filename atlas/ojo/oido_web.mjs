import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from '../chrome_launch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = 'atlas/ojo/fixtures/oido.html';
const TRACKS = ['descent', 'radio', 'card', 'feedback'];
const SOURCES = ['public/game/descent_sound.js', 'public/game/aiact-art50-state-radio.js', 'public/game/tarjeta_cantada.js', 'public/game/audio_feedback_manager.js', 'public/game/core.js'];
const NO_CLOCK = /\b(?:Date\.now|performance\.now|new Date\s*\()/;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
class NoData extends Error {}

function freePort() {
  const server = net.createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); });
  });
}

function serve() {
  const server = createServer((req, res) => {
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400); res.end(); return; }
    const file = path.resolve(ROOT, `.${pathname}`);
    if (!(file === ROOT || file.startsWith(ROOT + path.sep)) || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(404); res.end(); return;
    }
    readFile(file).then(data => {
      const type = file.endsWith('.js') || file.endsWith('.mjs') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(data);
    }, () => { res.writeHead(404); res.end(); });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server)); });
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url), pending = new Map(), events = [], external = [];
    let seq = 0;
    socket.addEventListener('message', event => {
      const data = JSON.parse(event.data);
      if (data.id !== undefined && pending.has(data.id)) {
        const p = pending.get(data.id); pending.delete(data.id);
        data.error ? p.reject(new NoData(`NO_DATA: CDP ${p.method} failed`)) : p.resolve(data.result || {});
      } else {
        if (data.method === 'Network.requestWillBeSent') {
          const host = new URL(data.params.request.url).hostname;
          if (host !== '127.0.0.1' && host !== 'localhost') external.push(host);
        }
        for (const item of [...events]) if (item.method === data.method) { events.splice(events.indexOf(item), 1); item.resolve(data.params); }
      }
    });
    socket.addEventListener('open', () => resolve({
      external,
      command(method, params = {}) { return new Promise((ok, bad) => { const id = ++seq; pending.set(id, { resolve: ok, reject: bad, method }); socket.send(JSON.stringify({ id, method, params })); }); },
      event(method) { return new Promise(ok => events.push({ method, resolve: ok })); },
      close() { socket.close(); }
    }));
    socket.addEventListener('error', () => reject(new NoData('NO_DATA: CDP socket unavailable')));
  });
}

async function pageSocket(chrome, port) {
  for (let attempt = 0; attempt < 80 && !chrome.failure(); attempt++) {
    await wait(250);
    try { const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const page = pages.find(x => x.type === 'page' && x.webSocketDebuggerUrl); if (page) return page.webSocketDebuggerUrl; }
    catch {}
  }
  throw new NoData(chrome.diagnostic());
}

async function evaluate(cdp, expression) {
  const result = await cdp.command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new NoData(`NO_DATA: browser evaluation failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
}

async function navigate(cdp, url, reload = false) {
  const loaded = cdp.event('Page.loadEventFired');
  const result = reload ? await cdp.command('Page.reload', { ignoreCache: true }) : await cdp.command('Page.navigate', { url });
  if (result?.errorText) throw new NoData(`NO_DATA: navigation failed: ${result.errorText}`);
  await Promise.race([loaded, wait(20000).then(() => { throw new NoData('NO_DATA: page load timeout'); })]);
  for (let attempt = 0; attempt < 400; attempt++) {
    const value = await evaluate(cdp, 'window.__oido || null');
    if (value) return value;
    await wait(25);
  }
  throw new NoData('NO_DATA: audio fixture did not return a result');
}

function valid(result) {
  if (!result || result.ok !== true) return false;
  if (result.track === 'card' && result.result === 'NO_DATA') return validChannel(result.channel_bytes) && typeof result.result_cause === 'string' && result.result_cause.length > 0;
  const rows = result.track === 'descent' ? result.frames : [result];
  return rows.every(row => row.channel_bytes > 0 && row.channel_bytes < 1024 && /^[0-9a-f]{64}$/.test(row.channel_sha256) && (row.result === 'NO_DATA' || /^[0-9a-f]{64}$/.test(row.waveform_sha256)));
}

function validChannel(bytes) { return Number.isInteger(bytes) && bytes > 0 && bytes < 1024; }
function sameWave(a, b) { return typeof a === 'string' && a === b; }

async function main() {
  let server, chrome, cdp;
  try {
    for (const file of SOURCES) {
      const source = await readFile(path.join(ROOT, file), 'utf8');
      if (Buffer.byteLength(source) > 16384) throw new NoData(`NO_DATA: source exceeds 16384 B: ${file}`);
      if (NO_CLOCK.test(source)) throw new NoData(`NO_DATA: undeclared wall clock in ${file}`);
    }
    server = await serve();
    const debugPort = await freePort();
    chrome = launchChrome(debugPort);
    cdp = await connect(await pageSocket(chrome, debugPort));
    await cdp.command('Network.enable');
    await cdp.command('Network.setBypassServiceWorker', { bypass: true });
    await cdp.command('Page.enable');
    const base = `http://127.0.0.1:${server.address().port}/${PAGE}`;
    const reports = [];
    for (const track of TRACKS) {
      const first = await navigate(cdp, `${base}?track=${track}`);
      const second = await navigate(cdp, `${base}?track=${track}`, true);
      const equal = JSON.stringify(first) === JSON.stringify(second);
      const a = track === 'descent' ? first.frames : [first];
      const b = track === 'descent' ? second.frames : [second];
      const changed = a.filter((row, index) => row.waveform_sha256 !== b[index]?.waveform_sha256).map(row => row.id || track);
      const status = track === 'descent' && changed.length ? 'RED' : first.result === 'NO_DATA' ? 'NO_DATA' : 'SIMULATED';
      reports.push({ track, measurement_ok: valid(first) && valid(second), signal_status: status, reload_equal: equal, changed_frames: changed, result: first, ...(equal ? {} : { reloaded: second }) });
    }
    const problems = cdp.external.length ? ['external_request'] : [];
    const sabotages = { unstable_wave_rejected: !sameWave('a', 'b'), channel_1024_rejected: !validChannel(1024), undeclared_clock_rejected: NO_CLOCK.test('Date.now()') };
    const measurementCompleted = reports.every(x => x.measurement_ok) && problems.length === 0 && Object.values(sabotages).every(Boolean);
    console.log(JSON.stringify({ measurement_completed: measurementCompleted, signal_green: reports.every(x => x.signal_status === 'SIMULATED' && x.reload_equal), sabotages, base: 'origin/main', loopback_only: cdp.external.length === 0, external_request_count: cdp.external.length, tracks: reports }));
    process.exitCode = measurementCompleted ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({ ok: false, cause: error instanceof NoData ? error.message : `NO_DATA: ${error.message}` }));
    process.exitCode = 2;
  } finally {
    cdp?.close();
    if (chrome) await chrome.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }
}

await main();
