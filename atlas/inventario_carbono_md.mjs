// Inventario a ojos de carbono · paso 2: de las medidas JSON (inventario_carbono.mjs) a la tabla Markdown.
// Cada pieza recibe su marco preceptoros.bubble/1, su peso UTF-8 medido (Buffer.byteLength), su sello
// (LIVE · STALE · NO_DATA con causa · unbuilt_mechanic) por regla escrita aqui, y sus contratos que faltan.
// Uso: node atlas/inventario_carbono_md.mjs main.json pr545.json pr543.json > tabla.md
import { readFileSync } from 'node:fs';

const [main, ...prs] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')));
const RETIRADAS = /\/face\/(atlantis|walker|zombie)\.html$/;
const DORMIDO = /awaits approval|Install the app$|Download mini|Load the catalogue/i;
const PREVIO = /Review file|Listen to author|Sign drawing/i;

function sello(p, ruta) {
  if (RETIRADAS.test(ruta) && p.tag === 'p') return 'STALE (lapida: pagina retirada el 2026-11-01, sigue servida)';
  if (p.clic && p.clic.errores && p.clic.errores.length) return 'NO_DATA (causa: ' + p.clic.errores[0].replace(/^log: /, '').slice(0, 60) + ')';
  if (p.disabled && DORMIDO.test(p.texto)) return 'unbuilt_mechanic';
  if (p.disabled && PREVIO.test(p.texto)) return 'NO_DATA (causa: requiere paso previo; deshabilitado al cargar)';
  if (p.disabled) return 'NO_DATA (causa: deshabilitado al cargar)';
  if (p.clic && p.clic.omitido) return 'NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba)';
  if (p.enlace === 200) return 'LIVE';
  if (typeof p.enlace === 'number') return 'NO_DATA (causa: enlace HTTP ' + p.enlace + ')';
  if (p.enlace) return 'NO_DATA (causa: enlace externo no seguido)';
  if (!p.visible || p.hidden) return 'NO_DATA (causa: oculto/plegado al cargar, 0 px)';
  if (p.clic && p.clic.cambia) return 'LIVE';
  if (p.clic && !p.clic.cambia) return 'NO_DATA (causa: el clic no cambia el DOM medido)';
  if ((p.live || p.role === 'status' || p.role === 'log') && !p.texto) return 'NO_DATA (causa: region viva vacia al cargar)';
  return 'LIVE';
}
// Contratos que faltan: regla por texto/selector/pagina. Nombres propuestos, no firmados.
const REGLAS = [
  [/#question|#entry|Send|#log\b|Conversation/, ['chat.boca-local/1', 'chat.boca-hexelion/1']],
  [/brain-load|browser brain/i, ['chat.boca-local/1', 'cerebro.pesos-verificados/1']],
  [/world-refresh|live nodes/i, ['mundo.estado-estatico/1']],
  [/radio-chat|Radio|Echoes/, ['radio.canal-repo/1']],
  [/visitor-start|ephemeral visit/i, ['npc.niebla/1', 'pared.mensaje/1']],
  [/Tutorial cabin|#surface|Terrains/, ['npc.niebla/1', 'pared.mensaje/1', 'ruta.captura/1']],
  [/Army/, ['gacha.tirada/1']],
  [/Summons|summon/i, ['gacha.tirada/1']],
  [/News/, ['noticias.feed/1']],
  [/Delivery awaits|Load the catalogue|catalogo/, ['aduana.entrega/1']],
  [/Install the app$|Download mini/, ['release.binario/1']],
  [/Sign drawing|Create my key/, ['creacion.firma/1']],
  [/Listen/, ['sonido.coordenada/1']],
  [/#joy|walker/, ['caravana.firma/1']],
];
const contratos = (p) => { const s = p.sel + ' ' + p.texto; const out = new Set(); for (const [re, cs] of REGLAS) if (re.test(s)) cs.forEach((c) => out.add(c)); return [...out]; };
const frase = (p, ruta, se) => `${p.tag} «${(p.texto || p.sel).slice(0, 60)}» en ${ruta}: ${se.split(' ')[0]}${p.toque === 'no' ? ', toque <44 px' : ''}.`;
function marco(p, ruta, se, n) {
  const f = { v: 'preceptoros.bubble/1', id: (ruta + '#' + (p.id || n)).slice(0, 60), t: 0, atoms: [{ k: 'pieza', r: frase(p, ruta, se) }] };
  const j = JSON.stringify(f); return { j, b: Buffer.byteLength(j, 'utf8') };
}
const esc = (s) => String(s).replace(/\|/g, '\\|');
const cuenta = { LIVE: 0, STALE: 0, NO_DATA: 0, unbuilt_mechanic: 0 }; let total = 0, maxB = 0;
const faltan = new Map();
function filas(d, filtro, etiqueta) {
  const out = [];
  for (const pg of d.paginas) {
    const ps = pg.piezas.filter((p) => filtro(pg.ruta, p)); if (!ps.length) continue;
    out.push(`\n### ${pg.ruta} ${etiqueta}\n`);
    out.push(`Errores de consola al cargar: ${pg.errCarga.length ? pg.errCarga.map(esc).join(' · ') : 'ninguno medido'}.\n`);
    out.push('| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |');
    out.push('|---|---|---|---|---|---|---|---|');
    ps.forEach((p, i) => {
      const se = (etiqueta ? 'NO_DATA (causa: en PR, no desplegado) · en rama: ' : '') + sello(p, pg.ruta);
      const m = marco(p, pg.ruta, sello(p, pg.ruta), i + 1); total++; maxB = Math.max(maxB, m.b);
      cuenta[etiqueta ? 'NO_DATA' : se.split(' ')[0]]++;
      const cs = contratos(p); cs.forEach((c) => { if (!faltan.has(c)) faltan.set(c, []); faltan.get(c).push(pg.ruta + ' ' + (p.id ? '#' + p.id : p.tag) + (etiqueta ? ' ' + etiqueta : '')); });
      out.push(`| ${i + 1} | \`${esc(p.sel)}\` · ${esc(p.fuente)} | ${esc(p.texto || '—')} | ${p.visible ? p.w + '×' + p.h : '0×0'} (${p.toque}) | \`${esc(m.j)}\` | ${m.b} | ${esc(se)} | ${cs.join(', ') || '—'} |`);
    });
  }
  return out.join('\n');
}
const clave = (p) => p.sel + '|' + p.texto;
const cuerpo = [filas(main, () => true, '')];
for (const d of prs) {
  const base = new Map(main.paginas.map((pg) => [pg.ruta, new Set(pg.piezas.map(clave))]));
  cuerpo.push(filas(d, (ruta, p) => !(base.get(ruta) || new Set()).has(clave(p)), '(en PR · ' + d.etiqueta + ')'));
}
console.log(cuerpo.join('\n'));
console.log('\n<!-- recuento -->\nPiezas: ' + total + ' · ' + Object.entries(cuenta).map(([k, v]) => k + ' ' + v).join(' · ') + ' · marco mayor: ' + maxB + ' B');
console.log('\n<!-- faltan -->');
for (const [c, ds] of [...faltan].sort((a, b) => b[1].length - a[1].length)) console.log(`- **${c}** (${ds.length}): ${[...new Set(ds)].slice(0, 8).join(' · ')}`);
