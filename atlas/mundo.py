#!/usr/bin/env python3
"""Genera `public/atlas-mundo.json`: las leyes del mundo de theGame. Biblioteca estandar.

    python3 atlas/mundo.py

LAS LEYES SALEN DE MEDIDAS, NO DE UNA OPINION. El Bosque lee cifras reales de
esta web -- cuantas pruebas pasan, cuantas lenguas hay, cuanto pesa el juego,
que version del service worker se sirve y si el arnes del SW esta en verde -- y
el motor (`atlas-motor.js › leyes`) las convierte en fisica del juego:
integridad maxima del Nucleo, y cuanto dana la grieta.

SE REGENERA CON CADA RELEASE, como `counters.json`: `atlas/test_atlas.py` se
pone rojo si el fichero no coincide con lo medido. Orden de una release:
subir VERSION en `sw.js` -> `python3 contadores.py` -> `python3 atlas/mundo.py`
-> huella del SW.

SIN RUTAS NI NOMBRES. Solo cifras y la fecha; la prueba lo vigila.
"""
import datetime
import gzip
import json
import re
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PUBLICO = RAIZ / "public"
ASSETS = PUBLICO / "assets"
# Lo que baja una visita que abre theGame, en castellano: la lengua base.
PIEZAS = ["atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js",
          "atlas-piso.js", "atlas.css", "thegame.js", "preceptor-pixel.png"]


def gzip_juego():
    total = 0
    for f in [ASSETS / n for n in PIEZAS] + [PUBLICO / "atlas-es.json"]:
        total += len(gzip.compress(f.read_bytes(), mtime=0))
    return total


def pruebas_web():
    c = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
    for m in c["metricas"]:
        if m.get("clave") == "pruebas_web":
            return m["valor"]
    return None


def version_sw():
    m = re.search(r"const VERSION = '([^']+)'", (PUBLICO / "sw.js").read_text(encoding="utf-8"))
    return m.group(1) if m else None


def lenguas():
    return len([d for d in PUBLICO.iterdir() if d.is_dir() and len(d.name) == 2 and d.name.isalpha()])


def arnes_sw():
    try:
        r = subprocess.run(["node", "arnes_sw.mjs"], cwd=RAIZ, capture_output=True,
                           text=True, timeout=120)
    except (OSError, subprocess.TimeoutExpired):
        return "NO_DATA"
    m = re.search(r"(\d+)/(\d+) en verde", r.stdout)
    return f"{m.group(1)}/{m.group(2)}" if m else "NO_DATA"


def mide():
    return {
        "esquema": "atlas.mundo/1",
        "procedencia": "medido en local por atlas/mundo.py; sin rutas, sin nombres",
        "medido": datetime.date.today().isoformat(),
        "pruebas_web": pruebas_web(),
        "lenguas": lenguas(),
        "techo_fichero_b": 16 * 1024,
        "gzip_juego_b": gzip_juego(),
        "version_sw": version_sw(),
        "arnes_sw": arnes_sw(),
    }


if __name__ == "__main__":
    d = mide()
    (PUBLICO / "atlas-mundo.json").write_text(
        json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("atlas-mundo.json ·", ", ".join(f"{k}={v}" for k, v in d.items()
                                         if k not in ("esquema", "procedencia")))
