#!/usr/bin/env python3
"""modelos-rack.py · el inventario real de modelos del rack, sellado, para que el gate lo lea sin red.

    python3 bin/modelos-rack.py           dice que escribiria
    python3 bin/modelos-rack.py --sellar  lee /api/tags del Ollama del Soberano y escribe config/modelos-rack.json

POR QUE EXISTE. El 2026-09-24 se vio que `loratelier.json` publicaba
`servido_en_el_rack: mistral-small3.2:24b-instruct-2506`, un modelo que NO esta
instalado -- y `escenario.js` usa ese campo como el modelo con el que habla el
chat. Una mentira de inventario en la cara publica. El gate corre sin red, asi
que no puede preguntar a Ollama: lee esta lista, que alguien genero midiendo, y
comprueba que no la han tocado a mano (el sello es el sha256 de la lista).
"""
import hashlib
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

SALIDA = Path(__file__).resolve().parent.parent / "config" / "modelos-rack.json"


def sello(modelos):
    return hashlib.sha256(json.dumps(sorted(modelos)).encode()).hexdigest()[:16]


def main(argv):
    tags = json.load(urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=10))
    modelos = sorted(m["name"] for m in tags["models"])
    d = {"generado": str(date.today()), "fuente": "GET /api/tags del Ollama de soberano",
         "modelos": modelos, "sello": sello(modelos)}
    if "--sellar" not in argv:
        print(f"SECO · {len(modelos)} modelos · sello {d['sello']}")
        return 0
    SALIDA.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"SELLADO · {len(modelos)} modelos · sello {d['sello']} -> {SALIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
