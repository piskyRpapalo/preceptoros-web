// version_sw_gate: a change that the service worker caches must ship with a new VERSION.
//
// Why (R-INVESTIGATION, frozen map, 2026-10-25): test_web already marries the huella to
// VERSION inside ONE tree, but nothing compares VERSION against the base. A PR can re-seal
// the huella with `sellar.py --version <the same>` and keep VERSION: visitors who already
// hold that VERSION keep its SHELL and OBRA caches and get the change one visit per route
// late, mixed with old modules. This gate closes that gap across the diff.
//
// Rule: if the diff base..head touches a public/ path that sw.js caches, VERSION at head
// must differ from VERSION at base. "Cached" is computed with the same rule as sw.js:
// a .json outside CONTENIDO_JSON is passed to the network, RED_PRIMERO is network-first;
// everything else lands in SHELL or OBRA.
//
// Exception path: a line ADDED in this same diff to config/sw-version-waivers.txt,
//   public/<exact path> | YYYY-MM-DD | reason
// A waiver already present at base does not count, so it can never leak into a later PR.
//
// CLI: node atlas/version_sw_gate.mjs            (CI: base = HEAD^1, the PR merge ref's base)
//      node atlas/version_sw_gate.mjs --base origin/main   (local: base = merge-base)
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

export const WAIVERS = 'config/sw-version-waivers.txt';

export function versionOf(swSource) {
  const m = /const VERSION = '([^']+)'/.exec(swSource || '');
  return m ? m[1] : null;
}

export function listsOf(listasSource) {
  const ctx = {};
  vm.runInNewContext(listasSource + '\n;globalThis.__l = { CONTENIDO_JSON, RED_PRIMERO };', ctx);
  return { contenidoJson: [...ctx.__l.CONTENIDO_JSON], redPrimero: [...ctx.__l.RED_PRIMERO] };
}

export function cached(path, lists) {
  if (!path.startsWith('public/')) return false;
  const served = '/' + path.slice('public/'.length);
  if (lists.redPrimero.includes(served)) return false;
  if (served.endsWith('.json') && !lists.contenidoJson.includes(served)) return false;
  return true;
}

export function parseWaivers(text) {
  const out = [];
  for (const raw of (text || '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [path, date, ...rest] = line.split('|').map((s) => s.trim());
    const reason = rest.join('|').trim();
    if (path && /^\d{4}-\d{2}-\d{2}$/.test(date || '') && reason) out.push({ line, path, date, reason });
  }
  return out;
}

// Pure decision: no git, no clock. Everything the verdict depends on is an argument.
export function decide({ changed, versionBase, versionHead, lists, waiversBase, waiversHead }) {
  const fresh = new Set(parseWaivers(waiversBase).map((w) => w.line));
  const added = parseWaivers(waiversHead).filter((w) => !fresh.has(w.line));
  const hits = changed.filter((p) => cached(p, lists));
  const waived = hits.filter((p) => added.some((w) => w.path === p));
  const blocking = hits.filter((p) => !waived.includes(p));
  const bumped = versionHead !== null && versionHead !== versionBase;
  const ok = versionHead !== null && (bumped || blocking.length === 0);
  return { ok, bumped, versionBase, versionHead, hits, waived, blocking };
}

export function message(v) {
  if (v.versionHead === null) return 'version_sw_gate: RED · public/sw.js declares no VERSION.';
  if (v.ok) {
    const why = v.bumped ? `VERSION ${v.versionBase} -> ${v.versionHead}`
      : v.hits.length ? `${v.waived.length} cached path(s) waived in this diff` : 'no cached path changed';
    return `version_sw_gate: GREEN · ${why}.`;
  }
  return [
    `version_sw_gate: RED · ${v.blocking.length} cached path(s) changed and VERSION stayed ${v.versionBase}.`,
    ...v.blocking.slice(0, 12).map((p) => '  ' + p),
    ...(v.blocking.length > 12 ? [`  ... and ${v.blocking.length - 12} more`] : []),
    'Visitors who already hold this VERSION keep serving the old copies (frozen-map outage, 2026-10-25).',
    'Cure: python3 bin/sellar.py --sellar   (bumps VERSION and re-seals the huella), then the seal chain in CLAUDE.md.',
    `Exception (rare, reviewed): add in THIS diff to ${WAIVERS} one line per path:`,
    '  public/<exact path> | YYYY-MM-DD | why stale copies are harmless',
  ].join('\n');
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
function show(rev, path) {
  try { return git('show', `${rev}:${path}`); } catch { return ''; }
}

function main() {
  const i = process.argv.indexOf('--base');
  const base = i > 0 ? git('merge-base', process.argv[i + 1], 'HEAD').trim() : git('rev-parse', 'HEAD^1').trim();
  const changed = git('diff', '--name-only', base, 'HEAD', '--', 'public/').split('\n').filter(Boolean);
  const v = decide({
    changed,
    versionBase: versionOf(show(base, 'public/sw.js')),
    versionHead: versionOf(show('HEAD', 'public/sw.js')),
    lists: listsOf(show('HEAD', 'public/sw-listas.js')),
    waiversBase: show(base, WAIVERS),
    waiversHead: show('HEAD', WAIVERS),
  });
  console.log(message(v));
  process.exit(v.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
