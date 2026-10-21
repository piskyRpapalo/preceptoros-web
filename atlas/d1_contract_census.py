"""Read-only census of explicit Spanish keys in served JSON contracts."""
import argparse
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
TERMS = set('esquema estado causa fase paso etiqueta mesuras medidas nombre nombre_juego id_interno estandar_humano anclaje_abierto semiotica onda_hz trazo movimiento archivo_verificador clave valor unidad como nota fecha ultima_lectura metricas integridad integridad_max recursos cobre biomasa luz oxigeno nivel_nucleo grieta abierta ciclo profundidad tipo sello modo autoridad manifiesto firma firmas llave publica privada requiere efecto col fila huella nace_tic madura_tics desgaste_por_tic huevos primer_edificio eventos dato motivo sonido sonido_causa verbo texto frecuencia_hz duracion'.split())


def scan():
    rows = []
    for path in sorted((ROOT / 'public').rglob('*.json')):
        data = path.read_bytes()
        found = {}
        for line, text in enumerate(data.decode().splitlines(), 1):
            for match in re.finditer(r'"([^"\\]+)"\s*:', text):
                if match[1] in TERMS:
                    found.setdefault(match[1], set()).add(line)
        if found:
            rows.append({'path': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(data).hexdigest(),
                         'keys': {key: sorted(lines) for key, lines in sorted(found.items())}})
    return rows


def report(rows):
    lines = ['# Served contract identifier census · 2026-10-21', '',
             'Base `0b5da04`; read-only lexical census for #157. Spanish contract identifiers are present.',
             'Scope: explicit vocabulary in `atlas/d1_contract_census.py`, matched against quoted JSON keys under public/. This is a lower bound, not a complete language classifier. Repeated keys on one line count once; values and private identifiers are not copied. Translation-table keys are included and are not necessarily visible prose.', '',
             f'Matched files: {len(rows)}. Unique file/key/line tuples: {sum(len(v) for r in rows for v in r["keys"].values())}.', '',
             '| Served path | Keys @ lines | Source SHA-256 |', '|---|---|---|']
    for row in rows:
        keys = '; '.join(k + '@' + ','.join(map(str, v)) for k, v in row['keys'].items())
        lines.append(f'| `{row["path"]}` | {keys} | `{row["sha256"]}` |')
    lines += ['', 'The concrete #157 case also remains in `public/game/gacha.js:78,82-86`: campo_origen and the values medido/emulado. ORIGENES is the enum identifier. causa_origen has zero matches in that file on this base. These are source identifiers and values, not a rendered-language measurement.', '',
              'Cause: existing serialized field names remain Spanish even where display text is English. `public/dictionary.json` has nine matched fields; translating values did not rename that contract. No field has been renamed in this proposal.',
              'Visual exposure, all JavaScript identifiers and unlisted vocabulary: NO_DATA, outside this lexical pass. Canon status remains pending.', '',
              'Open 1 (#157): does the Mesa authorize a versioned migration of these served contract keys and their consumers?']
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--sabotage', action='store_true')
    args = parser.parse_args()
    rows = scan()
    if args.sabotage:
        rows = []
    result = report(rows)
    if args.check:
        assert result == (ROOT / 'docs/d1-contract-census-2026-10-21.md').read_text(), 'census drift'
    else:
        print(result, end='')
