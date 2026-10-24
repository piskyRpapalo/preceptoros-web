import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const cache = join(homedir(), '.npm', '_npx');
const dir = existsSync(cache) && readdirSync(cache).map((d) => join(cache, d, 'node_modules', 'playwright')).find(existsSync);
if (!dir) { console.log('NO_DATA · playwright library not found in the npx cache'); process.exit(2); }
const { chromium } = createRequire(import.meta.url)(dir);
const [url, out, script = ''] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().startsWith(new URL(url).origin)) || ctx.pages().find((p) => p.url().startsWith('http://127.0.0.1:'));
if (!page) { console.log('NO_DATA · no rack Android tab on ' + url); process.exit(3); }
await page.goto(url, { waitUntil: 'networkidle' });
await page.bringToFront();
if (script) await page.evaluate(script);
const m = await page.evaluate(() => {
  const vw = innerWidth, wide = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > vw + 1).slice(0, 6).map((e) => e.tagName + '.' + e.className + '#' + e.id + ' ' + Math.round(e.getBoundingClientRect().right));
  return { innerWidth: vw, scrollWidth: document.documentElement.scrollWidth, dpr: devicePixelRatio, wide, state: window.preceptorFace ? window.preceptorFace.state().stop : null };
});
if (out) await page.screenshot({ path: out, fullPage: true });
console.log(JSON.stringify(m));
await browser.close();
