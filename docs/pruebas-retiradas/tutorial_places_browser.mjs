// [1c] in a real browser: the /play/ tutorial walks the nine live places end to end. It opens its own
// drawer, ✕ and ← Map close it, and every place (4 house parts, 5 reef places tapped for real on the
// map) counts as visited. Fixture: EMULATED house coordinates (same as place_card_browser); nothing is
// signed or stored. Uso: node atlas/tutorial_places_browser.mjs
import { fileURLToPath } from 'node:url';
import { launchChrome } from './chrome_launch.mjs';
import { sirve } from './sirve_publico.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const fallos = [], pend = new Map();
const ok = (cond, que) => { if (!cond) { fallos.push(que); } };
const REEF = ['boya', 'observatorio', 'lapidas', 'cristal', 'coral'];
let ws = null, ch = null, srv = null, id = 0, medida = {};

async function main() {
  srv = await sirve(PUBLIC);
  const port = srv.address().port, cdpPort = 9600 + (process.pid % 300);
  ch = launchChrome(cdpPort);
  let lista = null;
  for (let i = 0; i < 60 && !lista && !ch.failure(); i++) { await espera(250); try { lista = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); } catch {} }
  if (!lista) { throw new Error(ch.diagnostic()); }
  ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('WebSocket CDP'))); });
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') { fallos.push('exception: ' + String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0].slice(0, 100)); }
  });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  const hasta = async (e, ms) => { for (let t = 0; t < ms; t += 250) { if (await ev(e)) { return true; } await espera(250); } return false; };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  // The 360×716 window of chrome_launch, the one place_card_browser's 'inside the visible map' rule is written for.
  await cmd('Page.navigate', { url: `http://127.0.0.1:${port}/play/` });
  await hasta("!!document.querySelector('.descent-skip')", 15000);
  await ev("(b => b && b.click())(document.querySelector('.descent-skip'))");
  ok(await hasta("!!(window.AtlasTutorial && window.AtlasChatTerminal && window.AtlasInspector && window.AtlasArrecife && document.getElementById('parte-caparazon'))", 40000), 'tutorial, terminal and reef did not load');
  // The reef around an EMULATED house, and the screen position of every piece with a card.
  await ev(`(() => { const base = { x: AtlasNiebla.HEX.x, y: AtlasNiebla.HEX.y }; window.__t = { pieces: [] }; AtlasNiebla.sitioCasa = () => ({ ...base });
    const reg = AtlasInspector.registra; AtlasInspector.registra = function (cola, P, T) { reg(cola, P, T);
      const c = document.querySelector('.atlas-arena-mapa'), dpr = c.width / c.clientWidth, r = c.getBoundingClientRect();
      __t.pieces = cola.filter((q) => q.ficha && q.ficha().kind).map((q) => { const p = P(q.col, q.fila), f = q.ficha(); return { kind: f.kind, x: r.left + (p[0] + (f.hit?.dx || 0)) / dpr, y: r.top + (p[1] + (f.hit?.dy || 0)) / dpr }; }); };
    AtlasMar.mueve('casa'); })()`);
  await espera(3000);
  const visible = (sel) => `(() => { const n = document.querySelector(${JSON.stringify(sel)}); return !!n && !n.hidden && !n.closest('[hidden]'); })()`;

  // 1 · the tutorial opens its own drawer; ✕ and ← Map close it (both used to click a missing menu button).
  await ev("AtlasTutorial.abre('harness')"); await espera(900);
  medida.abre = await ev(visible('#pliego-tutorial'));
  await ev("document.getElementById('terminal-cierra').click()"); await espera(900);
  medida.cierraX = !(await ev(visible('#thegame-terminal')));
  await ev("AtlasTutorial.abre('harness')"); await espera(900);
  await ev("document.getElementById('tutorial-al-mapa').click()"); await espera(900);
  medida.cierraMapa = !(await ev(visible('#thegame-terminal')));

  // 2 · the four house parts, by their own buttons.
  for (const p of ['caparazon', 'pinzas', 'patas', 'ojos']) {
    await ev(`document.getElementById('parte-${p}').click()`); await espera(700);
    await ev("(() => { const c = document.querySelector('.thegame-hoja:not([hidden]) .thegame-hoja-cierra'); if (c) c.click(); const v = document.getElementById('casa-volver'); if (v) v.click(); })()"); await espera(500);
  }
  // 3 · the five reef places, tapped for real on the map (the camera brings each one into view first).
  for (const kind of REEF) {
    await ev("AtlasChatTerminal.cierra(); AtlasMar.mueve('casa')"); await espera(900);
    let p = null;
    for (let n = 0; n < 12; n++) {
      p = await ev(`__t.pieces.find((q) => q.kind === ${JSON.stringify(kind)})`);
      if (!p) { break; }
      const s = await ev('({ w: innerWidth, h: innerHeight, top: document.getElementById("thegame-menu").getBoundingClientRect().top })');
      const hit = await ev(`!!document.elementFromPoint(${p.x}, ${p.y})?.closest('.atlas-arena-mapa')`);
      if (hit && p.x > 70 && p.x < s.w - 10 && p.y > s.top + 10 && p.y < s.h - 65) { break; }
      await ev('AtlasMar.mueve(' + JSON.stringify(p.x <= 70 ? 'izq' : p.x >= s.w - 10 ? 'der' : p.y <= s.top + 80 ? 'arr' : 'aba') + ')'); await espera(700);
    }
    if (!p) { fallos.push('piece missing on the map: ' + kind); continue; }
    await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await espera(900);
  }
  await espera(1200);
  medida.lugares = JSON.parse(await ev('JSON.stringify(AtlasTutorial.LUGARES.map((p) => [p.id, p.mide()]))'));
  medida.pasos = await ev('AtlasTutorial.PASOS.length');
  medida.texto = await ev("(() => { AtlasTutorial.abre('harness'); return document.getElementById('pliego-tutorial')?.innerText || ''; })()");

  ok(medida.abre, 'the tutorial does not open its drawer');
  ok(medida.cierraX, 'the drawer ✕ does not close the drawer');
  ok(medida.cierraMapa, 'the tutorial ← Map does not close the drawer');
  ok(medida.pasos === 15, 'the tutorial does not have its 15 steps: ' + medida.pasos);
  ok(medida.lugares.length === 9 && medida.lugares.every((l) => l[1] === 1), 'not every place counted as visited: ' + JSON.stringify(medida.lugares));
  ok(/Step \d+ of 15/.test(medida.texto) && !/\bundefined\b|\bNaN\b/.test(medida.texto), 'tutorial text missing or shows a missing value');
  console.log(JSON.stringify({ piece: '1c', receipt: 'MEDIDO', fixture: 'EMULATED house coordinates', abre: medida.abre, cierraX: medida.cierraX, cierraMapa: medida.cierraMapa,
    pasos: medida.pasos, lugares: medida.lugares, fallos }));
}

main().catch((e) => { fallos.push(String(e && e.message || e)); console.log(JSON.stringify({ piece: '1c', fallos })); })
  .finally(() => { try { ws && ws.close(); } catch {} ch && ch.close && ch.close(); srv && srv.close(); process.exitCode = fallos.length ? 1 : 0; });
