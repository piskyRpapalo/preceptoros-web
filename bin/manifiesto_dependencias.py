#!/usr/bin/env python3
# Manifiesto de dependencias de public/ (corte Norte 7, pieza D). Medido, no supuesto.
# Recorre el grafo de referencias (html src/href, literales de cadena con rutas de fichero en js/css)
# desde dos grupos de raices y clasifica cada fichero de public/.
#   THEGAME  = /play/index.html y /assets/thegame.js (lo que se borra)
#   VIVO     = las puertas que deben seguir (/, /openworld/, /face/*, /get-the-app/, /aduana/, /creation.html)
# Sobre-aproxima: cualquier literal que parezca fichero cuenta como referencia. Eso solo hace el
# conjunto "exclusivo" MAS PEQUENO, es decir, mas conservador para borrar.
import json, os, re, sys

RAIZ = sys.argv[1]
PUB = os.path.join(RAIZ, 'public')
THEGAME = ['play/index.html', 'assets/thegame.js']
VIVO = ['index.html', 'openworld/index.html', 'face/index.html', 'face/basic.html', 'game/army.html',
        'get-the-app/index.html', 'aduana/index.html', 'creation.html']
EXT = ('.js', '.css', '.html', '.json', '.svg', '.png', '.webmanifest', '.woff2', '.mjs')
LIT = re.compile(r"""['"`]([A-Za-z0-9_\-./]+\.(?:js|css|html|json|svg|png|webmanifest|woff2|mjs))['"`]""")
SRCHREF = re.compile(r"""(?:src|href)=["']([^"'#?]+)""")

def existe(rel):
    return os.path.isfile(os.path.join(PUB, rel.lstrip('/')))

def resuelve(origen, ref):
    # Rutas absolutas o relativas al fichero que cita, y nombres sueltos en /assets/ o /game/ (thegame.js carga asi).
    cands = []
    if ref.startswith('/'):
        cands.append(ref.lstrip('/'))
    else:
        base = os.path.dirname(origen)
        cands.append(os.path.normpath(os.path.join(base, ref)))
        for d in ('assets', 'game', 'face', ''):
            cands.append(os.path.join(d, ref) if d else ref)
    for c in cands:
        c = c.replace('\\', '/').lstrip('./')
        if c and existe(c):
            return c
    return None

def refs(rel):
    txt = open(os.path.join(PUB, rel), encoding='utf-8', errors='replace').read()
    out = set()
    if rel.endswith('.html'):
        for m in SRCHREF.finditer(txt):
            r = resuelve(rel, m.group(1))
            if r:
                out.add(r)
    for m in LIT.finditer(txt):
        r = resuelve(rel, m.group(1))
        if r:
            out.add(r)
    out.discard(rel)
    return out

def clausura(raices):
    vistos, cola, padre = set(), list(raices), {}
    for r in raices:
        vistos.add(r)
    while cola:
        f = cola.pop()
        for h in refs(f):
            if h not in vistos:
                vistos.add(h)
                padre[h] = f
                cola.append(h)
    return vistos, padre

tg, pt = clausura(THEGAME)
vv, pv = clausura(VIVO)
todos = []
for dp, _, fs in os.walk(PUB):
    for f in fs:
        todos.append(os.path.relpath(os.path.join(dp, f), PUB).replace('\\', '/'))

clasif = {}
for f in sorted(todos):
    en_tg = f in tg
    en_vv = f in vv
    if en_tg and not en_vv:
        c = 'EXCLUSIVO_THEGAME'
    elif en_tg and en_vv:
        c = 'COMPARTIDO'
    elif en_vv:
        c = 'VIVO'
    else:
        c = 'HUERFANO_SIN_REF'
    clasif[f] = c

res = {'raices_thegame': THEGAME, 'raices_vivo': VIVO, 'conteo': {}, 'ficheros': {}}
for f, c in clasif.items():
    res['conteo'][c] = res['conteo'].get(c, 0) + 1
    tam = os.path.getsize(os.path.join(PUB, f))
    res['ficheros'][f] = {'clase': c, 'bytes': tam}
json.dump(res, sys.stdout, ensure_ascii=False, indent=1, sort_keys=True)
print()
