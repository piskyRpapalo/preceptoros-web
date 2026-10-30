#!/usr/bin/env python3
"""Escribe public/openworld/estado.json (esquema v2) desde odd/data/nodes.json (MVP moderno, mapa unico).

Uso:  python3 bin/estado_v2.py            # escribe el estado
      python3 bin/estado_v2.py --check    # no escribe; sale con 1 si el estado escrito no coincide

Reglas: un nodo sin evidencia no entra; un LIVE sin fecha se rechaza; un sello fuera de las seis etiquetas
se rechaza; un edificio sobre un nodo ausente se rechaza; el resultado es determinista (orden por id).
Sin red, sin reloj, sin azar.
"""
import json
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "odd" / "data" / "nodes.json"
SALIDA = RAIZ / "public" / "openworld" / "estado.json"
SELLOS = ["LIVE", "STALE", "STATIC", "SIMULATED", "NO_DATA", "ERROR"]
LOOKS = ["basic", "atlantis", "zombie"]
FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def fallo(causa):
    raise SystemExit("estado_v2: " + causa)


def construye(fuente):
    if fuente.get("esquema") != "preceptoros.nodes-evidencia/1":
        fallo("esquema de la fuente desconocido")
    nodos, vistos = [], set()
    for n in fuente.get("nodos", []):
        nid = n.get("id")
        if not isinstance(nid, str) or not nid or nid in vistos:
            fallo("nodo sin id o repetido: " + repr(nid))
        vistos.add(nid)
        if not isinstance(n.get("q"), int) or not isinstance(n.get("r"), int):
            fallo(nid + ": q y r deben ser enteros")
        if not isinstance(n.get("alive"), bool):
            fallo(nid + ": alive debe ser booleano")
        if n.get("seal") not in SELLOS:
            fallo(nid + ": sello fuera de las seis etiquetas: " + repr(n.get("seal")))
        since = n.get("since")
        if since is not None and (not isinstance(since, str) or not FECHA.match(since)):
            fallo(nid + ": fecha mal formada")
        if n.get("seal") == "LIVE" and since is None:
            fallo(nid + ": LIVE sin fecha medida")
        if not isinstance(n.get("evidence"), str) or not n["evidence"].strip():
            fallo(nid + ": sin evidencia; no entra en el mapa")
        if n.get("look") not in LOOKS:
            fallo(nid + ": look desconocido")
        nodos.append({"id": nid, "q": n["q"], "r": n["r"], "alive": n["alive"], "seal": n["seal"],
                      "since": since, "look": n["look"], "evidence": n["evidence"]})
    ids = {n["id"] for n in nodos}
    edificios = []
    for b in fuente.get("edificios", []):
        if b.get("node") not in ids:
            fallo("edificio " + repr(b.get("id")) + " sobre un nodo ausente")
        edificios.append({"id": b["id"], "node": b["node"]})
    nodos.sort(key=lambda n: n["id"])
    edificios.sort(key=lambda b: b["id"])
    return {
        "esquema": "preceptoros.openworld-estado/2",
        "nodes": [],
        "colonia": {"nodes": nodos, "buildings": edificios, "units": []},
    }


def main():
    fuente = json.loads(FUENTE.read_text(encoding="utf-8"))
    texto = json.dumps(construye(fuente), ensure_ascii=False, indent=2) + "\n"
    if "--check" in sys.argv:
        if not SALIDA.exists() or SALIDA.read_text(encoding="utf-8") != texto:
            print("estado_v2: el estado escrito no coincide con la fuente")
            return 1
        print("estado_v2: estado al dia con la fuente")
        return 0
    SALIDA.write_text(texto, encoding="utf-8")
    print("estado_v2: escrito " + str(SALIDA.relative_to(RAIZ)) + " (" + str(len(texto.encode())) + " B)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
