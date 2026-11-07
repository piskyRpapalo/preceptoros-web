// Build the judge corpus (F0 plan, slice i): passages of docs/canon-*.md, each with its sha256,
// for the web judge that quotes or stays silent. Deterministic: same canon, same bytes.
//   node tools/build_juez_corpus.mjs           writes public/openworld/juez-corpus.json
//   node tools/build_juez_corpus.mjs --check   exits 1 when the file differs from a fresh build
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('public/openworld/juez-corpus.json', ROOT);
const CEILING = 16384;      // house ceiling for one served piece
// test_web.py: no served file may spend half a network trip (7 KiB gzip -9); 64 B margin
// covers the header difference between node and python gzip.
const GZIP_CEILING = 7 * 1024 - 64;
const PASSAGE_MAX = 768;    // same ceiling as the app judge (hexelion_book MAX_SOURCE_TEXT_B)
const PASSAGE_MIN = 40;     // decision mia (sin firma): shorter paragraphs are labels, not law
// Private-looking content never reaches a public corpus: house paths, IPv4, ports.
const PRIVATE = /\/home\/|~\/|\b\d{1,3}(\.\d{1,3}){3}\b|:\d{4,5}\b/;

const sha = (b) => createHash('sha256').update(b).digest('hex');
const bytes = (s) => Buffer.byteLength(s, 'utf8');

function passagesOf(text) {
  const out = [];
  let skipped = 0;
  // The preamble before the first `## ` section is metadata (provenance, counts), not law.
  const start = text.search(/^## /m);
  const body = start >= 0 ? text.slice(start) : text;
  for (const block of body.split(/\n\s*\n/)) {
    const raw = block.trim();
    if (!raw || /^(#|```|\||>|- \[)/.test(raw) || raw.includes('```')) continue;
    const flat = raw.replace(/\s+/g, ' ');
    if (bytes(flat) < PASSAGE_MIN || bytes(flat) > PASSAGE_MAX) continue;
    if (PRIVATE.test(flat)) { skipped++; continue; }
    out.push(flat);
  }
  return { list: out, skipped };
}

export function build() {
  const names = readdirSync(new URL('docs/', ROOT)).filter((n) => /^canon-.*\.md$/.test(n)).sort();
  const docs = names.map((n) => {
    const buf = readFileSync(new URL('docs/' + n, ROOT));
    return { doc: 'docs/' + n, sha256: sha(buf), ...passagesOf(buf.toString('utf8')) };
  });
  const corpus = { schema: 'preceptoros.judge-corpus/1', sources: [], passages: [] };
  const size = () => bytes(JSON.stringify(corpus));
  // Round robin: the first useful passage of every doc, then the second, and so on, until the
  // next passage would reach either ceiling. Then stop: the order decides, not a guess.
  const rounds = Math.max(0, ...docs.map((d) => d.list.length));
  outer: for (let k = 0; k < rounds; k++) {
    for (const d of docs) {
      if (k >= d.list.length) continue;
      const fresh = !corpus.sources.some((s) => s.doc === d.doc);
      if (fresh) corpus.sources.push({ doc: d.doc, sha256: d.sha256 });
      corpus.passages.push({ id: corpus.passages.length + 1, doc: d.doc, sha256: sha(d.list[k]), text: d.list[k] });
      if (size() >= CEILING || gzipSync(JSON.stringify(corpus), { level: 9 }).length >= GZIP_CEILING) {
        corpus.passages.pop();
        if (fresh) corpus.sources.pop();
        break outer;
      }
    }
  }
  const covered = new Set(corpus.sources.map((s) => s.doc));
  return { corpus, json: JSON.stringify(corpus),
    report: { docs: names.length, covered: covered.size, passages: corpus.passages.length,
      privateSkipped: docs.reduce((n, d) => n + d.skipped, 0),
      uncovered: docs.filter((d) => !covered.has(d.doc)).map((d) => d.doc) } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { json, report } = build();
  if (process.argv.includes('--check')) {
    const same = existsSync(OUT) && readFileSync(OUT, 'utf8') === json;
    console.log(JSON.stringify({ check: same ? 'GREEN' : 'RED', bytes: bytes(json) }));
    process.exit(same ? 0 : 1);
  }
  writeFileSync(OUT, json);
  console.log(JSON.stringify({ bytes: bytes(json), ...report }));
}
