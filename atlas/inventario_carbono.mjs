// Inventario a ojos de carbono: recorre cada pagina servida de public/ en Chrome headless (CDP) y
// enumera cada pieza (button, a, input, select, textarea, details, [aria-live], [role], [hidden], dialog).
// Para cada pieza: selector, texto visible, tamano (>=44 px?), visibilidad, fuente (fichero:linea),
// clic seguro (sin flujos de firma) con excepciones y cambio de DOM medidos, y errores de consola.
// No se sirve, no entra en gate.yml: el resultado depende del tiempo de carga del navegador.
// Uso: node atlas/inventario_carbono.mjs <carpeta-public> <etiqueta> > salida.json
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, extname, join, relative } from 'node:path';
import { launchChrome } from './chrome_launch.mjs';

const PUBLIC = resolve(process.argv[2] || 'public');
const ETIQUETA = process.argv[3] || 'main';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Botones que no se pulsan: firma, invocacion, envio, descarga, borrado (fuera del alcance de un visitante de prueba).
const NO_PULSAR = /sign|firm|summon|invoc|adopt|send|download|copy|delete|borra|reset|install|share|pay|accept|challenge|settle|clear|forget/i;

function htmls(dir) {
  const out = [];
  for (const n of readdirSync(dir)) { const f = join(dir, n); if (statSync(f).isDirectory()) out.push(...htmls(f)); else if (n.endsWith('.html')) out.push(f); }
  return out.sort();
}
function sirve(raiz) {
  const tipos = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const s = createServer((req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname); if (ruta.endsWith('/')) ruta += 'index.html';
      const f = resolve(raiz, '.' + ruta); if (!f.startsWith(raiz)) { res.writeHead(403); res.end(); return; }
      const c = readFileSync(f); res.writeHead(200, { 'Content-Type': tipos[extname(f)] || 'text/plain', 'Cache-Control': 'no-store' }); res.end(c);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r(s)));
}
// Fuente: primera linea de un .html/.js de public/ que contiene id="x" (o 'x' en JS), o la clase, o el texto.
const FUENTES = [];
function indexa(dir) { for (const n of readdirSync(dir)) { const f = join(dir, n); if (statSync(f).isDirectory()) indexa(f); else if (/\.(html|js)$/.test(n)) FUENTES.push([relative(resolve(PUBLIC, '..'), f), readFileSync(f, 'utf8').split('\n')]); } }
function fuente(pieza, pagina) {
  const pruebas = [];
  if (pieza.id) pruebas.push(`id="${pieza.id}"`, `'${pieza.id}'`, `"${pieza.id}"`);
  if (pieza.cls) pruebas.push(`class="${pieza.cls}`);
  if (pieza.texto && pieza.texto.length > 2 && pieza.texto.length < 40) pruebas.push(pieza.texto);
  const orden = [...FUENTES].sort((a, b) => (b[0] === 'public/' + pagina ? 1 : 0) - (a[0] === 'public/' + pagina ? 1 : 0));
  for (const p of pruebas) for (const [f, ls] of orden) { const i = ls.findIndex((l) => l.includes(p)); if (i >= 0) return f + ':' + (i + 1); }
  return 'NO_DATA (generado en tiempo de ejecucion)';
}

const ENUMERA = `(() => {
  const sel = 'button,a[href],input,select,textarea,details,summary,dialog,[aria-live],[role],[hidden],canvas,iframe';
  const vistos = new Set(); const out = [];
  const css = (e) => { if (e.id) return '#' + e.id; let s = e.tagName.toLowerCase(); const p = e.parentElement; if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.');
    if (p) { const hs = [...p.children].filter((x) => x.tagName === e.tagName); if (hs.length > 1) s += ':nth-of-type(' + (hs.indexOf(e) + 1) + ')'; return (p === document.body ? 'body' : css(p)) + ' > ' + s; } return s; };
  for (const e of document.querySelectorAll(sel)) {
    if (vistos.has(e)) continue; vistos.add(e);
    const r = e.getBoundingClientRect(), st = getComputedStyle(e);
    const plegado = !!e.closest('details:not([open])') && e.tagName !== 'SUMMARY' && e.tagName !== 'DETAILS';
    out.push({ tag: e.tagName.toLowerCase(), sel: css(e), id: e.id || '', cls: e.classList[0] || '',
      texto: (e.getAttribute('aria-label') || e.innerText || e.value || e.placeholder || e.getAttribute('href') || '').replace(/\\s+/g, ' ').trim().slice(0, 70),
      href: e.getAttribute('href') || '', role: e.getAttribute('role') || '', live: e.getAttribute('aria-live') || '',
      hidden: e.hidden || st.display === 'none' || st.visibility === 'hidden', plegado, disabled: !!e.disabled,
      w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 });
  }
  return JSON.stringify(out); })()`;

async function main() {
  indexa(PUBLIC);
  const srv = await sirve(PUBLIC), origen = 'http://127.0.0.1:' + srv.address().port;
  const ch = launchChrome(0); const port = await ch.debugPort();
  const lista = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(); let errores = [];
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errores.push('exception: ' + String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0].slice(0, 90));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errores.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 90));
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errores.push('log: ' + d.params.entry.text.slice(0, 90) + ' ' + String(d.params.entry.url || '').replace(origen, '')); });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value ?? null;
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Log.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const paginas = [];
  for (const f of htmls(PUBLIC)) {
    const ruta = '/' + relative(PUBLIC, f).replace(/index\.html$/, '');
    errores = [];
    await cmd('Page.navigate', { url: origen + ruta }); await espera(1800);
    const piezas = JSON.parse(await ev(ENUMERA) || '[]');
    const errCarga = [...errores];
    for (const p of piezas) {
      p.fuente = fuente(p, relative(PUBLIC, f));
      p.toque = p.visible ? (Math.min(p.w, p.h) >= 44 ? 'si' : 'no') : 'n/a';
      if (p.tag === 'a' && p.href && !/^(https?:|mailto:|#|javascript:)/.test(p.href)) {
        const u = new URL(p.href, origen + ruta); const r = await fetch(u).catch(() => null); p.enlace = r ? r.status : 'NO_DATA';
      } else if (p.tag === 'a' && /^https?:/.test(p.href)) p.enlace = 'externo (no seguido)';
      const pulsable = (p.tag === 'button' || p.tag === 'summary') && p.visible && !p.disabled && !p.hidden;
      if (pulsable && !NO_PULSAR.test(p.texto + ' ' + p.id)) {
        errores = [];
        const antes = await ev('document.body.innerHTML.length + ":" + document.querySelectorAll("[open],[aria-expanded=true],[aria-selected=true]").length');
        await ev(`(() => { const e = document.querySelector(${JSON.stringify(p.sel)}); if (e) e.click(); return !!e; })()`); await espera(250);
        const despues = await ev('document.body.innerHTML.length + ":" + document.querySelectorAll("[open],[aria-expanded=true],[aria-selected=true]").length');
        p.clic = { cambia: antes !== despues, errores: [...errores] };
        if (p.tag === 'button') { const url = await ev('location.pathname'); if (url !== ruta) { p.clic.navega = url; await cmd('Page.navigate', { url: origen + ruta }); await espera(1500); } }
      } else if (pulsable) p.clic = { omitido: 'flujo de firma/envio/descarga: no se pulsa' };
    }
    paginas.push({ ruta, fichero: relative(resolve(PUBLIC, '..'), f), errCarga, piezas });
  }
  process.stdout.write(JSON.stringify({ etiqueta: ETIQUETA, paginas }));
  ws.close(); await ch.close(); srv.close();
}
main().catch((e) => { console.error('NO_DATA: ' + e.message); process.exit(1); });
