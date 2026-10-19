import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

// An unavailable browser must produce a failed measurement, never a skipped green gate.
const run = spawnSync(process.execPath, [new URL('./sin_undefined.mjs', import.meta.url).pathname], {
  env: { ...process.env, CHROME_BINARY: '/nonexistent/phase-chrome' },
  encoding: 'utf8', timeout: 20000
});
assert.equal(run.error, undefined, run.error?.message);
assert.equal(run.status, 1, 'missing Chrome escaped the gate');
const report = JSON.parse(run.stdout);
assert.equal(report.pasos, 0);
assert(report.fallos.some(f => /NO_DATA: Chrome CDP unavailable/.test(f.snippet) && /ENOENT/.test(f.snippet)));
console.log('Chrome unavailable: exit 1, zero steps, NO_DATA with cause; rejection verified.');

// Case "sin huérfanos ante SIGTERM": a process that launches Chrome and then receives SIGTERM must not
// leave Chrome behind, neither its main PID nor any process still using its profile directory.
const LAUNCHER = new URL('./chrome_launch.mjs', import.meta.url).href;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const ps = args => spawnSync('ps', args, { encoding: 'utf8' }).stdout || '';
const argsOf = pid => ps(['-o', 'args=', '-p', String(pid)]).trim();
const alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; } };
// The browser, its helpers and the crashpad handler all name the profile directory in their command line.
const ownersOf = dir => !dir ? [] : ps(['-axo', 'pid=,args=']).split('\n').flatMap(row => {
  const m = /^\s*(\d+)\s+(.*)$/.exec(row);
  return m && m[2].includes(dir) ? [Number(m[1])] : [];
});

// Child under test: launches Chrome, waits until its CDP answers, announces the browser PID and waits.
function childSource(port) {
  return String.raw`
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { launchChrome } from ${JSON.stringify(LAUNCHER)};
const PORT = ${port};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const cdpUp = () => new Promise(resolve => {
  const req = http.get('http://127.0.0.1:' + PORT + '/json/version', res => { res.resume(); resolve(res.statusCode === 200); });
  req.on('error', () => resolve(false));
  req.setTimeout(500, () => { req.destroy(); resolve(false); });
});
// The browser is the child of this process that carries our debugging port.
const chromePid = () => {
  for (const row of execFileSync('ps', ['-axo', 'pid=,ppid=,args='], { encoding: 'utf8' }).split('\n')) {
    const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(row);
    if (m && Number(m[2]) === process.pid && m[3].includes('--remote-debugging-port=' + PORT)) return Number(m[1]);
  }
  return null;
};
const ch = launchChrome(PORT);
const limit = Date.now() + 20000;
let pid = null;
while (!pid && !ch.failure() && Date.now() < limit) {
  if (await cdpUp()) pid = chromePid();
  if (!pid) await sleep(200);
}
if (!pid) {
  await ch.close();
  console.log(ch.diagnostic().replace(/\s+/g, ' '));
  process.exit(3);
}
console.log('CHROME_PID ' + pid);
setInterval(() => {}, 1000);
`;
}

async function sinHuerfanosAnteSigterm() {
  if (spawnSync('ps', ['-p', String(process.pid)]).error) return { estado: 'NO_DATA', causa: 'ps not available' };
  const port = await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port: libre } = srv.address(); srv.close(() => resolve(libre)); });
  });
  const hijo = spawn(process.execPath, ['--input-type=module', '-e', childSource(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let salida = '', errores = '', cerrado = false, chrome = null, perfil = null;
  hijo.stdout.on('data', d => { salida += d; });
  hijo.stderr.on('data', d => { errores = (errores + d).slice(-2000); });
  hijo.once('close', () => { cerrado = true; });
  const marca = () => /^(CHROME_PID \d+|NO_DATA.*)$/m.exec(salida)?.[1] ?? null;
  const sobrevivientes = () => [...new Set([chrome, ...ownersOf(perfil)])].filter(p => p != null && alive(p));
  try {
    const t0 = Date.now();
    let m = marca();
    while (!m && !cerrado && Date.now() - t0 < 30000) { await sleep(100); m = marca(); }
    if (!m && cerrado) throw new Error('the child exited before announcing Chrome: ' + errores.trim());
    if (!m) return { estado: 'NO_DATA', causa: 'no Chrome PID announced in 30 s' };
    if (m.startsWith('NO_DATA')) return { estado: 'NO_DATA', causa: m };
    chrome = Number(m.split(' ')[1]);
    perfil = /--user-data-dir=(\S+)/.exec(argsOf(chrome))?.[1] ?? null;
    if (!alive(chrome)) return { estado: 'NO_DATA', causa: `Chrome ${chrome} was gone before the signal` };
    hijo.kill('SIGTERM');
    const t1 = Date.now();
    while (!cerrado && Date.now() - t1 < 10000) await sleep(50);
    if (!cerrado) throw new Error('the child did not exit within 10 s of SIGTERM');
    const t2 = Date.now();
    let quedan = sobrevivientes();
    while (quedan.length && Date.now() - t2 < 5000) { await sleep(100); quedan = sobrevivientes(); }
    if (quedan.length) throw new Error(`orphan: pids ${quedan.join(',')} alive 5 s after the child exited (Chrome ${chrome}, profile ${perfil})`);
    return { estado: 'PASS', causa: `Chrome ${chrome} and its profile processes gone ${Date.now() - t2} ms after the child exited` };
  } finally {
    // What this case started is closed here, even when the case fails.
    if (!cerrado) hijo.kill('SIGKILL');
    const restos = sobrevivientes();
    for (const pid of restos) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    if (restos.length) await sleep(300);
    if (perfil && path.dirname(perfil) === tmpdir() && path.basename(perfil).startsWith('sinundef-')) {
      try { rmSync(perfil, { recursive: true, force: true }); } catch {}
    }
  }
}

const caso = await sinHuerfanosAnteSigterm();
console.log(`sin huérfanos ante SIGTERM: ${caso.estado} (${caso.causa})`);
