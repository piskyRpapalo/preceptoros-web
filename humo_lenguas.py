#!/usr/bin/env python3
"""humo_lenguas.py · ¿contesta el piso en cada lengua? Conectividad, no estructura.

    python3 humo_lenguas.py              un piso del rack por lengua (9 llamadas)
    python3 humo_lenguas.py --todo       los seis pisos del rack en las nueve (54)
    python3 humo_lenguas.py --json       lo mismo, en JSON

POR QUE EXISTE. El Soberano, 2026-09-24: «un gate verde prueba ESTRUCTURA, no
CONECTIVIDAD. Mediste que el árabe se pinta y se voltea; no mediste que el piso
CONTESTE». Tenía razón: 161 verdes y ninguno había mandado una pregunta.

QUÉ HACE, sin navegador. Compone el system prompt de un piso EXACTAMENTE como
`camino-papel.js › papelDelPiso` (anfitrión, reglas de `prompts-<l>.js`, hechos,
[título], frase/falla/papel, saltándose lo que es NO_DATA), toma el modelo del
reparto de `cerebros.json › pisos`, y lo manda a `https://api.preceptoros.org/api/generate`,
que es por donde pasa la pregunta de una persona. Pasa si vuelve 200, con texto,
y en la escritura de la lengua (árabe, cirílico y griego se comprueban por
alfabeto; las latinas, por palabras que no son castellanas).

Y cuenta aparte lo que la estructura ya sabe: cuántas claves de `caminos-<l>.json`
son NO_DATA. Un piso con el papel sin escribir puede contestar y aun así estar a
medias: las dos cifras van juntas y ninguna tapa a la otra.

Los textos de las respuestas no se guardan: se guarda su longitud y su hash.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
import urllib.request

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
API = os.environ.get("P0X_API_WEB", "https://api.preceptoros.org") + "/api/generate"
LENGUAS = ("es", "en", "fr", "pt", "it", "de", "ru", "el", "ar")
PREGUNTA = {
    "es": "¿Qué es PreceptorOS, en una frase?",
    "en": "What is PreceptorOS, in one sentence?",
    "fr": "Qu'est-ce que PreceptorOS, en une phrase ?",
    "pt": "O que é o PreceptorOS, numa frase?",
    "it": "Che cos'è PreceptorOS, in una frase?",
    "de": "Was ist PreceptorOS, in einem Satz?",
    "ru": "Что такое PreceptorOS, в одном предложении?",
    "el": "Τι είναι το PreceptorOS, σε μία πρόταση;",
    "ar": "ما هو PreceptorOS، في جملة واحدة؟",
}
ALFABETO = {"ru": r"[Ѐ-ӿ]", "el": r"[Ͱ-Ͽ]", "ar": r"[؀-ۿ]"}
# Palabras corrientes de cada lengua latina que el castellano no usa: si no sale
# ninguna en 60 tokens, lo mas probable es que haya contestado en otra lengua.
PALABRAS = {
    "en": r"\b(the|is|and|your|you|it)\b",
    "fr": r"\b(est|une|le|vous|qui|des)\b",
    "pt": r"\b(é|uma|você|não|seu|ao)\b",
    "it": r"\b(è|il|che|una|sono|gli)\b",
    "de": r"\b(ist|ein|eine|und|die|der|das)\b",
    "es": r"\b(es|una|que|el|tu|los)\b",
}


def ui(l):
    return json.load(open(os.path.join(RAIZ, f"caminos-{l}.json"), encoding="utf-8")).get("ui", {})


def reglas(l):
    s = open(os.path.join(RAIZ, "assets", f"prompts-{l}.js"), encoding="utf-8").read()
    m = re.search(r'"reglas"\s*:\s*(\[[^\]]*\])', s)
    return ". ".join(json.loads(m.group(1))) if m else ""


def es_nd(t):
    return not t or str(t).startswith("NO_DATA")


def papel(p, u, base):
    partes = [x for x in (u.get("torre_anfitrion"), base, u.get("torre_hechos")) if not es_nd(x)]
    partes.append("[" + (u.get(f"camino_{p}_titulo") or p) + "]")
    partes += [u[f"camino_{p}_{c}"] for c in ("frase", "falla", "papel")
               if not es_nd(u.get(f"camino_{p}_{c}"))]
    return "\n".join(partes)


def reparto():
    d = json.load(open(os.path.join(RAIZ, "cerebros.json"), encoding="utf-8"))
    modelo = {c["id"]: c["modelo"] for c in d["cerebros"]}
    return {p: modelo[v["cerebro"]] for p, v in d["pisos"].items()
            if isinstance(v, dict) and v.get("donde") == "rack"}


def pregunta(modelo, sistema, texto):
    cuerpo = {"model": modelo, "system": sistema, "prompt": texto, "stream": False,
              "think": False, "options": {"num_predict": 60, "temperature": 0}}
    r = urllib.request.Request(API, json.dumps(cuerpo).encode(),
                               {"Content-Type": "application/json",
                                "Origin": "https://preceptoros.org",
                                # Cloudflare responde 403 al User-Agent por defecto de
                                # urllib (medido 2026-09-24, 54/54 en 0,1 s): la sonda
                                # se identifica como lo que es.
                                "User-Agent": "preceptoros-humo/1 (sonda de conectividad del rack)"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(r, timeout=240) as f:
            cod, crudo = f.status, f.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, "", time.time() - t0, f"HTTP {e.code}"
    except Exception as e:                                         # noqa: BLE001
        return 0, "", time.time() - t0, type(e).__name__
    try:
        d = json.loads(crudo.strip().splitlines()[-1])
    except Exception:                                              # noqa: BLE001
        return cod, "", time.time() - t0, "cuerpo no es JSON"
    if d.get("error"):
        return cod, "", time.time() - t0, "ollama: " + str(d["error"])[:60]
    return cod, d.get("response", ""), time.time() - t0, None


def en_su_lengua(l, texto):
    if l in ALFABETO:
        return len(re.findall(ALFABETO[l], texto)) >= 5
    return bool(re.search(PALABRAS[l], texto.lower()))


def main(argv):
    rep = reparto()
    pisos = list(rep) if "--todo" in argv else ["exposicion"]
    filas = []
    for p in pisos:                     # por piso y luego lengua: un cambio de modelo por piso
        for l in LENGUAS:
            u = ui(l)
            cod, txt, s, fallo = pregunta(rep[p], papel(p, u, reglas(l)), PREGUNTA[l])
            ok = cod == 200 and bool(txt.strip()) and not fallo
            filas.append({"piso": p, "lengua": l, "modelo": rep[p], "http": cod,
                          "contesta": ok, "su_lengua": ok and en_su_lengua(l, txt),
                          "fallo": fallo, "s": round(s, 1), "chars": len(txt),
                          "sha": hashlib.sha256(txt.encode()).hexdigest()[:10],
                          "papel_nd": sum(1 for k, v in u.items() if k.startswith(f"camino_{p}_") and es_nd(v))})
            if "--json" not in argv:
                f = filas[-1]
                print(f"{p:12s} {l}  {f['http']:3d}  contesta={'SI' if f['contesta'] else 'NO':2s} "
                      f"su_lengua={'SI' if f['su_lengua'] else 'NO':2s}  papel_nd={f['papel_nd']}  "
                      f"{f['s']:5.1f}s  {f['fallo'] or ''}", flush=True)
    nd = {l: sum(1 for v in ui(l).values() if es_nd(v)) for l in LENGUAS}
    res = {"filas": filas, "caminos_no_data": nd,
           "contestan": sum(f["contesta"] for f in filas), "en_su_lengua": sum(f["su_lengua"] for f in filas),
           "total": len(filas)}
    if "--json" in argv:
        print(json.dumps(res, ensure_ascii=False, indent=1))
    else:
        print(f"\ncontestan {res['contestan']}/{res['total']} · en su lengua {res['en_su_lengua']}/{res['total']}")
        print("claves NO_DATA en caminos-<l>.json: " + " · ".join(f"{l} {n}" for l, n in nd.items()))
    return 0 if res["contestan"] == res["total"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
