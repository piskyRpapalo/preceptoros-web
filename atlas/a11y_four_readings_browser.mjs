// Four readings of one radio line, in a real browser, on /openworld/ at 360×716 (accessibility lane A11Y-S110).
// For each line the radio says, this harness reads the SAME event four ways and holds them to one id:
//   eye      what the list shows (the seal on the row, its words, the row is on screen)
//   reader   what the accessibility tree exposes (a live log; the words are in a node that is not ignored)
//   ear      the tone AtlasRadioFrame hands to Web Audio, or NO_DATA with its cause
//   machine  AtlasRadioChat.registro()
// A reading that is missing must carry its cause; two readings that disagree on seal or words are red.
// What a desktop browser cannot measure is printed as NO_DATA, never as green: a sound a person heard, and TalkBack
// on a phone. It changes no setting anywhere. radio_frame.js is injected by the harness: no page mounts it yet.
// Sabotage: SABOTAJE=seal serves the radio log painting another seal on the row ⇒ red.
// Use: node atlas/a11y_four_readings_browser.mjs
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC = join(ROOT, 'public/');
const SAB = process.env.SABOTAJE || '';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function serve(root) {
  const s = createServer((req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (path.endsWith('/')) { path += 'index.html'; }
      const f = resolve(root, '.' + path); if (!f.startsWith(resolve(root))) { res.writeHead(403); res.end(); return; }
      let body = readFileSync(f);
      if (path === '/assets/radio_message_log.js' && SAB === 'seal') { body = Buffer.from(String(body).replace('li.dataset.sello = s;', "li.dataset.sello = 'LIVE';")); }
      res.writeHead(200, { 'Content-Type': types[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
const failures = [], measured = {};
const ok = (cond, what) => { if (!cond) { failures.push(what); } };
let ws = null, ch = null, srv = null, id = 0;
const pending = new Map();

// The lines the harness asks the radio to say: one per kind of evidence, through the page's own door.
const SAY = [
  { who: 'Harness', seal: 'SIMULATED', source: 'a11y-harness', words: 'SIMULATED · the tide table is a rehearsal.' },
  { who: 'Harness', seal: 'ERROR', source: 'a11y-harness', words: 'The beacon did not answer.' },
  { who: 'Harness', seal: 'NO_DATA', source: 'a11y-harness', words: 'NO_DATA · nobody has measured the reef today.' },
  { who: 'Harness', seal: 'LIVE', source: 'a11y-harness', words: 'A visitor arrived at the plaza.' }
];

async function main() {
  srv = await serve(PUBLIC);
  const origin = 'http://127.0.0.1:' + srv.address().port, cdpPort = 9700 + (process.pid % 90);
  ch = launchChrome(cdpPort);
  let targets = null;
  for (let i = 0; i < 60 && !targets && !ch.failure(); i++) { await wait(250); try { targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!targets) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; failures.push('exception: ' + String(x.exception?.description || x.text).split('\n')[0].slice(0, 90)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Accessibility.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 360, height: 716, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: origin + '/openworld/' }); await wait(2500);

  // The pieces the page does not load yet, injected in order. A page that already had them would be a different slice.
  const loaded = await ev(`(async () => { for (const src of ['/game/bb_radio.js', '/game/radio_frame.js']) {
    await new Promise((r, j) => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = () => j(new Error(src)); document.head.appendChild(s); }); }
    return !!(window.AtlasRadioChat && window.AtlasBBRadio && window.AtlasRadioFrame); })()`);
  ok(loaded === true, 'the radio log, bb_radio and radio_frame are all present');
  if (loaded !== true) { return; }

  const before = await ev('window.AtlasRadioChat.registro().length');
  // The visitor's own way in: the Communication button on the map, then the radio's own toggle. Two presses.
  const reached = await ev(`(() => { const door = document.querySelector('.cats button[data-cat="Communication"]'), toggle = document.getElementById('radio-chat-alterna');
    if (!door || !toggle) { return false; } door.click(); if (toggle.getAttribute('aria-expanded') !== 'true') { toggle.click(); }
    return door.getAttribute('aria-pressed') === 'true' && toggle.getAttribute('aria-expanded') === 'true'; })()`);
  ok(reached === true, 'the radio is reached with two presses (Communication, then the radio toggle), each a named button');
  measured.presses_to_radio = 2;
  await ev(`(() => { const R = window.AtlasRadioChat; R.canal('radio');
    ${JSON.stringify(SAY)}.forEach((m) => R.dice({ quien: m.who, sello: m.seal, fuente: m.source, texto: m.words })); return true; })()`);
  await wait(300);

  // One pass in the page: eye from the DOM, machine from the log, ear from the frame, each with its own id.
  const rows = JSON.parse(await ev(`JSON.stringify((() => {
    const R = window.AtlasRadioChat, F = window.AtlasRadioFrame, log = R.registro().slice(${before});
    const list = document.getElementById('radio-chat-lista'), items = Array.from(list.children).slice(${before});
    const ctx = window.AudioContext ? new AudioContext() : null;
    const cycle = (c) => (c === 'NO_DATA' || c == null || c === '' ? null : Number(c));
    return log.map((m, i) => {
      const li = items[i], words = li ? li.querySelector('.radio-msg-texto') : null;
      const fromLog = { seal: m.sello, source: m.fuente, cycle: m.ciclo, text: m.texto };
      const fromDom = li ? { seal: li.dataset.sello, source: li.dataset.fuente, cycle: cycle(li.dataset.ciclo), text: words ? words.textContent : '' } : null;
      const box = words ? words.getBoundingClientRect() : null;
      const played = F.play(ctx, fromLog, 3), four = F.readings(fromLog, 3);
      return { said: m.texto, machine: { id: F.eventId(fromLog), seal: m.sello },
        eye: fromDom ? { id: F.eventId(fromDom), seal: fromDom.seal, onScreen: !!(box && box.width > 0 && box.height > 0), twin: four.eye } : { cause: 'NO_DATA: the row is not in the list' },
        ear: played, readerText: typeof four.reader === 'string' ? four.reader : null };
    });
  })())`) || '[]');
  ok(rows.length === SAY.length, 'the radio kept every line the harness said (' + rows.length + ' of ' + SAY.length + ')');

  // Reader: the accessibility tree, not the DOM. The list must be a live log and each line's words an exposed node.
  const tree = (await cmd('Accessibility.getFullAXTree')).result?.nodes || [];
  const exposed = tree.filter((n) => !n.ignored);
  const logNode = exposed.find((n) => n.role?.value === 'log');
  ok(!!logNode, 'reader: the radio list is exposed with the role log');
  const live = await ev("document.getElementById('radio-chat-lista').getAttribute('aria-live')");
  ok(live === 'polite', 'reader: the radio list is a polite live region (' + live + ')');
  const names = exposed.map((n) => String(n.name?.value || ''));

  const table = rows.map((r) => {
    const reader = names.some((t) => t.includes(r.said)) ? { exposed: true, seal: r.machine.seal }
      : { cause: 'NO_DATA: the words are not in the accessibility tree' };
    ok(!r.eye.cause && r.eye.onScreen, 'eye: the row is on screen · ' + r.said);
    ok(r.eye.id === r.machine.id, 'eye and machine give one id · ' + r.said + ' (' + r.eye.id + ' vs ' + r.machine.id + ')');
    ok(r.eye.seal === r.machine.seal, 'eye and machine give one seal · ' + r.said);
    ok(reader.exposed === true, 'reader: the words are exposed · ' + r.said);
    ok(r.ear.id === r.machine.id && r.ear.seal === r.machine.seal, 'ear and machine give one id and seal · ' + r.said);
    ok(r.ear.played === true || /^NO_DATA: /.test(r.ear.cause), 'ear: a tone, or NO_DATA with its cause · ' + r.said);
    ok(r.ear.played === (r.machine.seal !== 'NO_DATA'), 'ear: only an unmeasured line is silent · ' + r.said + ' (' + r.machine.seal + ')');
    ok(!r.eye.twin || !r.eye.twin.cause, 'eye: the seal has a static twin (text and shape, no motion needed) · ' + r.said);
    return { id: r.machine.id, seal: r.machine.seal, eye: r.eye.cause || 'row ' + r.eye.seal + ' · twin ' + r.eye.twin.text + '/' + r.eye.twin.shape,
      reader: reader.cause || 'exposed in a polite log', ear: r.ear.played ? 'tone ' + r.ear.ms + ' ms' : r.ear.cause, machine: r.machine.seal };
  });
  // A page with no game clock cannot age a LIVE line, so the log itself reports it as NO_DATA: the four readings must follow.
  ok(new Set(table.map((t) => t.id)).size === table.length, 'four different lines give four different ids');
  measured.lines = table;
  measured.voice = await ev("(() => { const s = window.speechSynthesis; return s ? 'speechSynthesis present, ' + s.getVoices().length + ' voices' : 'NO_DATA: this browser has no speechSynthesis'; })()");
  measured.not_measured = ['NO_DATA: audible_to_a_person (a headless browser has no ear)', 'NO_DATA: talkback_disabled (phone screen reader is off; no setting is changed by this harness)'];
  console.log(JSON.stringify({ piece: 'a11y-four-readings', sabotage: SAB || null, receipt: failures.length ? 'RED' : 'GREEN', measured, failures }));
}
main().catch((e) => { failures.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: 'a11y-four-readings', sabotage: SAB || null, receipt: 'RED', measured, failures })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = failures.length ? 1 : 0; });
