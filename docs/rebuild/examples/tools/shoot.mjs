import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const cache = join(homedir(), '.npm', '_npx');
const dir = existsSync(cache) && readdirSync(cache).map((d) => join(cache, d, 'node_modules', 'playwright')).find(existsSync);
if (!dir) { console.log('NO_DATA · playwright library not found in the npx cache'); process.exit(2); }
const { chromium } = createRequire(import.meta.url)(dir);
const [url, out, width = '412', mode = ''] = process.argv.slice(2);
const pw = join(homedir(), '.cache', 'ms-playwright');
const exe = existsSync(pw) && readdirSync(pw).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse()
  .map((d) => join(pw, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell')).find(existsSync);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: +width, height: +width < 600 ? 915 : 900 }, deviceScaleFactor: 2, reducedMotion: mode.includes('reduce') ? 'reduce' : 'no-preference' });
const remote = [], errors = [];
page.on('request', (r) => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !u.protocol.startsWith('data')) remote.push(r.url()); });
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
for (const step of mode.split(',').filter((s) => s.startsWith('key:'))) await page.keyboard.press(step.slice(4));
if (mode.includes('walk')) { await page.focus('#joy'); for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowRight']) await page.keyboard.press(k); }
await page.screenshot({ path: out, fullPage: true });
const state = await page.evaluate(() => (window.preceptorFace ? window.preceptorFace.state() : null));
console.log(JSON.stringify({ out, remote, errors, station: state && state.station, bytes: state && state.bytes }));
await browser.close();
