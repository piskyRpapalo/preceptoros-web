import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Chromes launched and not yet closed by close(). If this process dies first (exit, SIGTERM or
// SIGINT), they are killed and their profiles removed, so no orphan keeps its CDP port open.
const vivos = new Set();
let cierreInstalado = false;

function matarVivos() {
  for (const { child, dir } of vivos) {
    child.kill('SIGKILL');
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* already gone or still being written */ }
  }
  vivos.clear();
}

function instalarCierre() {
  if (cierreInstalado) return;
  cierreInstalado = true;
  process.on('exit', matarVivos);
  for (const [senal, codigo] of [['SIGTERM', 143], ['SIGINT', 130]]) {
    process.once(senal, () => {
      matarVivos();
      // Exit only when nobody else listens; with another listener, its owner decides.
      if (process.listenerCount(senal) === 0) process.exit(codigo);
    });
  }
}

// Profiles live outside the checkout so browser downloads cannot pollute hygiene gates.
export function launchChrome(port) {
  instalarCierre();
  const dir = mkdtempSync(path.join(tmpdir(), 'sinundef-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run',
    '--disable-background-networking', '--disable-component-update', '--disable-sync',
    `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`, '--window-size=360,716'];
  // GitHub's disposable Linux runner may disallow Chrome's namespace sandbox.
  if (process.env.GITHUB_ACTIONS === 'true') args.push('--no-sandbox', '--disable-dev-shm-usage');
  const child = spawn(process.env.CHROME_BINARY || 'google-chrome', [...args, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  const registro = { child, dir };
  vivos.add(registro);
  let stderr = '', failure = null;
  child.stderr.on('data', data => { stderr = (stderr + data).slice(-4096); });
  const ended = new Promise(resolve => {
    child.once('error', error => { failure = error.message; resolve(); });
    child.once('close', (code, signal) => { failure ||= `Chrome exit=${code} signal=${signal}`; resolve(); });
  });
  return {
    failure: () => failure,
    diagnostic: () => `NO_DATA: Chrome CDP unavailable; ${failure || 'startup timeout'}; ${stderr}`,
    async close() {
      if (!failure) child.kill();
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
      await ended; clearTimeout(timer);
      rmSync(dir, { recursive: true, force: true });
      vivos.delete(registro);
    }
  };
}
