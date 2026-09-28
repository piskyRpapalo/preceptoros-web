#!/usr/bin/env python3
"""humo_feedback.py · ¿LLEGA un sobre firmado al laboratorio? Conectividad, no estructura.

    python3 humo_feedback.py                 manda UN sobre de verdad y comprueba el acuse
    python3 humo_feedback.py --escribe       lo mismo, y apunta la medida en public/rutas-medidas.json
    python3 humo_feedback.py --simula 405    sin red: prueba la regla con un codigo inventado (gate)

POR QUE EXISTE. El Soberano, 2026-09-28: «171 verdes y NINGUNO ha entregado un sobre». La misma leccion que
dio `humo_lenguas.py` el 2026-09-24 («un gate verde prueba ESTRUCTURA, no CONECTIVIDAD»), en otro canal.

QUE HACE, sin navegador. Pide un reto (`GET /api/v1/reto`); firma un `atlas.lab_envio/1` de verdad con una
identidad DESECHABLE (`atlas/humo_sobre.mjs`, con el mismo `canal.js` y la misma Aduana que la web); lo manda
a la ruta de entrega (`POST /api/v1/paquetes`); y exige que (i) vuelva un acuse, (ii) quede registrado (el
acuse trae su fila y su hash de registro) y (iii) el acuse se verifique con la clave del receptor cuya
huella fija `public/rutas-medidas.json`. El texto del sobre no se guarda: se guarda su longitud y su hash.

LA REGLA NUEVA, la que habria cazado el defecto hace semanas: EL HUMO SE PONE ROJO si la ruta devuelve 404 o
405, si no hay red, si no vuelve acuse o si el acuse no verifica. Y en rojo, ademas, grita PROMESA
INCUMPLIDA si `rutas-medidas.json` decia que esa ruta entregaba. Prometer y no entregar no da verde.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.abspath(__file__))
MEDIDAS = os.path.join(RAIZ, "public", "rutas-medidas.json")
API = os.environ.get("P0X_API_WEB", "https://api.preceptoros.org")
MAQUINA = os.environ.get("HUMO_MAQUINA", "rack (maquina sin declarar en HUMO_MAQUINA)")


def pide(metodo, url, cuerpo=None):
    datos = None if cuerpo is None else json.dumps(cuerpo).encode()
    r = urllib.request.Request(url, datos, {"Content-Type": "application/json"}, method=metodo)
    try:
        with urllib.request.urlopen(r, timeout=30) as f:
            return f.status, json.loads(f.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:  # sin red, tunel caido, proxy que corta
        return None, str(e)


def node(*args, entrada=None):
    p = subprocess.run(["node", os.path.join(RAIZ, "atlas", "humo_sobre.mjs"), *args], input=entrada,
                       capture_output=True, text=True, timeout=60)
    return json.loads(p.stdout or "{}")


def mide(simula=None):
    m = json.load(open(MEDIDAS, encoding="utf-8"))
    ruta = next(r for r in m["rutas"] if r["id"] == "paquetes")
    prometia = bool(ruta.get("acuse_verificado"))
    res = {"ruta": "POST " + ruta["ruta"], "medido_el": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "maquina": MAQUINA, "prometia_entrega": prometia}
    if simula is not None:
        codigo, cuerpo, sobre = int(simula), None, {"hash": "0" * 64}
    else:
        c, r = pide("GET", API + "/api/v1/reto")
        if c != 200 or not isinstance(r, dict) or "reto" not in r:
            return rojo(res, c, "sin reto (GET /api/v1/reto respondio %s)" % (c if c else "sin red: %s" % r))
        sobre = node("sobre", r["reto"])
        texto = json.dumps(sobre, sort_keys=True)
        res["sobre"] = {"bytes": len(texto), "sha256": hashlib.sha256(texto.encode()).hexdigest()}
        codigo, cuerpo = pide("POST", API + ruta["ruta"], sobre)
    if codigo in (404, 405):
        return rojo(res, codigo, "la ruta de entrega respondio %d" % codigo)
    if codigo not in (200, 201):
        return rojo(res, codigo, "sin red o sin respuesta: %s" % (cuerpo if codigo is None else codigo))
    acuse = (cuerpo or {}).get("acuse") if isinstance(cuerpo, dict) else None
    v = node("acuse", entrada=json.dumps({"acuse": acuse, "envio_hash": sobre["hash"],
                                            "receptor_hash": m.get("receptor_clave_hash")}))
    if not v.get("ok"):
        return rojo(res, codigo, v.get("motivo", "el acuse no verifica"))
    res.update(estado="VERDE", codigo=codigo, acuse_verificado=True,
               registro={"n": acuse.get("registro_n"), "hash": acuse.get("registro_hash")})
    return res


def rojo(res, codigo, motivo):
    res.update(estado="ROJO", codigo=codigo, acuse_verificado=False, motivo=motivo)
    if res["prometia_entrega"]:
        res["motivo"] = "PROMESA INCUMPLIDA: rutas-medidas.json decia que entregaba · " + motivo
    return res


def escribe(res):
    m = json.load(open(MEDIDAS, encoding="utf-8"))
    for r in m["rutas"]:
        if r["id"] == "paquetes" and res.get("codigo") is not None:
            r.update(codigo=res["codigo"], medido_el=res["medido_el"][:10], maquina=res["maquina"],
                     acuse_verificado=res["acuse_verificado"])
            if res["acuse_verificado"]:
                r["acuse_el"] = res["medido_el"][:10]
            else:
                r.pop("acuse_el", None)
            r.pop("causa", None)
    with open(MEDIDAS, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    simula = sys.argv[sys.argv.index("--simula") + 1] if "--simula" in sys.argv else None
    res = mide(simula)
    if "--escribe" in sys.argv and simula is None:
        escribe(res)
    print(json.dumps(res, ensure_ascii=False, indent=1))
    sys.exit(0 if res["estado"] == "VERDE" else 1)
