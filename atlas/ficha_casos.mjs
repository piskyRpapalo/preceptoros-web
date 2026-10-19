// Juez de la ficha de lenguaje (VT8): 1 caso valido + 6 violaciones.
// Idioma de atlas/tutorial_casos.mjs. Cada violacion comprueba antes que la ficha original da null,
// para que el rojo sea del sabotaje y no del fixture.
import { readFileSync } from 'node:fs';
import { ficha, quitaPiel, canonica, bytes, valida, compara, PIEZAS } from './ficha_lenguaje.mjs';
const dic = JSON.parse(readFileSync(new URL('../public/dictionary.json', import.meta.url), 'utf8'));
const casos = [];
const caso = (n, f) => { let r; try { r = f(); } catch (e) { r = String(e); } casos.push({ caso: n, ok: r === true, detalle: r === true ? '' : JSON.stringify(r) }); };
const PIEZAS_ID = Object.keys(PIEZAS);
const base = (p, mundo = 'atlantis-rift') => ficha(p, dic, { mundo, sello: 'MEDIDO' });

// Sabotaje: copia estructurada de la ficha original, se muta, y la causa debe empezar por el prefijo.
const sabota = (prefijo, mutar) => {
  for (const p of PIEZAS_ID) {
    const f = base(p);
    if (valida(f, dic) !== null) return p + ': el fixture original ya falla: ' + valida(f, dic);
    const c = structuredClone(f);
    mutar(c);
    const r = valida(c, dic);
    if (typeof r !== 'string' || !r.startsWith(prefijo)) return p + ': esperaba ' + prefijo + ' y dio ' + r;
  }
  return true;
};

caso('valido: dos pieles distintas sobre la misma ficha miden identico', () => {
  for (const p of PIEZAS_ID) {
    const f = base(p);
    const a = { ...f, visual_skin: 'coral', silhouette_hex: '0f0f', lore: 'el rift' };
    const b = { ...f, visual_skin: 'lapida', silhouette_hex: 'f0f0', lore: 'los zombis' };
    const qa = quitaPiel(a), qb = quitaPiel(b);
    if (canonica(qa) !== canonica(qb)) return p + ': canonica distinta entre pieles';
    if (valida(qa, dic) !== null) return p + ': valida(a) = ' + valida(qa, dic);
    if (valida(qb, dic) !== null) return p + ': valida(b) = ' + valida(qb, dic);
    if (bytes(qa) > 1024) return p + ': bytes ' + bytes(qa);
    const c = compara(f, base(p, 'zombis'));
    if (c.veredicto !== 'IGUAL') return p + ': compara dio ' + c.veredicto;
  }
  return true;
});

caso('violacion: piel que muta la matematica', () => sabota('piel:', (c) => { c.mesura.glyph = [3, 3, 3, 3]; }));

caso('violacion: ficha > 1.024 B', () => sabota('techo:', (c) => { c.texto = 'x'.repeat(1100); }));

caso('violacion: comparacion con dato NO_DATA del otro mundo sin causa', () => {
  for (const p of PIEZAS_ID) {
    const a = base(p);
    const b = ficha(p, dic, { mundo: 'zombis', sello: 'NO_DATA', causa: null });
    let lanzo = false;
    try { compara(a, b); } catch (e) { lanzo = /NO_DATA sin causa/.test(String(e)); }
    if (!lanzo) return p + ': compara sin causa no lanzo';
    const causa = 'el nodo zombis aun no sirve su dato';
    const r = compara(a, ficha(p, dic, { mundo: 'zombis', sello: 'NO_DATA', causa }));
    if (r.veredicto !== 'NO_DATA' || r.niebla !== true) return p + ': veredicto ' + r.veredicto + ' niebla ' + r.niebla;
    if (r.causa !== 'mundo zombis: ' + causa) return p + ': causa ' + r.causa;
    const j = JSON.stringify(r);
    if (j.includes(a.texto) || j.includes(a.mesura.trazo)) return p + ': el resultado filtra el dato ajeno';
  }
  return true;
});

caso('violacion: vocablo prohibido', () => {
  const r1 = sabota('vocablo:', (c) => { c.texto = 'x token'; });
  if (r1 !== true) return r1;
  return sabota('vocablo:', (c) => { c.texto = 'Oracle'; });
});

caso('violacion: sin correspondencia acustica/textual', () => {
  const r1 = sabota('correspondencia:', (c) => { c.sonido_hz = 999; });
  if (r1 !== true) return r1;
  return sabota('correspondencia:', (c) => { c.texto = ''; });
});

caso('violacion: ficha sin vara declarada', () => {
  const r1 = sabota('vara:', (c) => { delete c.vara; });
  if (r1 !== true) return r1;
  return sabota('vara:', (c) => { c.vara = ''; });
});

console.log(JSON.stringify(casos, null, 1));
process.exitCode = casos.every((c) => c.ok) ? 0 : 1;
