#!/usr/bin/env python3
"""Guarda del piso ATLAS mientras vive fuera de `public/`. Biblioteca estandar.

    python3 atlas/test_atlas.py

Vive aparte de `test_web.py` a proposito: el piso aun no se despliega, y meter
sus pruebas en el gate de la web obligaria a tocar `public/` (contadores,
cifra publicada, huella del service worker) por algo que no se sirve. El dia
del paso 3, cuando el piso se mude a `public/`, estas pruebas se mudan con el.

Cubre lo que el documento maestro (§F.4) pide y ya se puede medir hoy:
(b) ninguna salida de red salvo su propio texto, (c) las nueve lenguas con las
mismas claves, (d) presupuesto de peso, (e) ningun binario pesado. Las de motor
--curva XP, combate, red multi-recurso, Nivel del Nucleo-- llegan con el motor.
"""
import gzip
import json
import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PISO = RAIZ / "piso"
LENGUAS = ["ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"]
PESADOS = (".gguf", ".onnx", ".safetensors", ".bin", ".wav", ".mp3", ".ogg", ".opus")
TOPE_GZIP = 2 * 1024 * 1024      # §E: bundle ATLAS < 2 MB gzip
TOPE_FICHERO = 16 * 1024         # el mismo tope por fichero que la web


def sin_comentarios(js):
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", js)


class Piso(unittest.TestCase):

    def test_una_sola_salida_de_red_su_propio_texto(self):
        codigo = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", codigo),
                         ["BASE + 'atlas-' + lang + '.json'"],
                         "el piso pide algo mas que su texto")
        for salida in ("XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
                       "RTCPeerConnection", "new Image", "Worker(", "importScripts",
                       "http://", "https://", "innerHTML"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, codigo, f"el piso puede salir por {salida}")

    def test_se_monta_como_los_demas_pisos(self):
        codigo = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertIn("preceptor:torre", codigo, "no escucha el aviso de la Torre")
        self.assertIn("piso-atlas", codigo, "no busca su piso")

    def test_las_nueve_lenguas_tienen_las_mismas_claves(self):
        base = json.loads((PISO / "atlas-es.json").read_text(encoding="utf-8"))
        codigo = (PISO / "atlas-piso.js").read_text(encoding="utf-8")
        pedidas = set(re.findall(r"\bU\('([a-z0-9_]+)'\)", codigo))
        pedidas |= {x + "n" for x in re.findall(r"'(b[1-4])'", codigo)}
        for l in LENGUAS:
            d = json.loads((PISO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertEqual(d["idioma"], l)
                self.assertTrue(d.get("procedencia"), "sin procedencia declarada")
                self.assertEqual(set(d["ui"]), set(base["ui"]))
                self.assertEqual(len(d["skills"]), 7, "no son siete skills")
                self.assertFalse(pedidas - set(d["ui"]),
                                 f"claves que el piso pide y faltan: {pedidas - set(d['ui'])}")

    def test_presupuesto_de_peso(self):
        total = 0
        for f in PISO.rglob("*"):
            if f.is_file():
                with self.subTest(fichero=f.name):
                    if f.suffix in (".js", ".css", ".json", ".html"):
                        self.assertLessEqual(f.stat().st_size, TOPE_FICHERO,
                                             f"{f.name} pasa del tope por fichero")
                total += len(gzip.compress(f.read_bytes()))
        self.assertLess(total, TOPE_GZIP, f"el piso pesa {total} B gzip")

    def test_ningun_binario_pesado(self):
        for base in (PISO, RAIZ.parent / "public"):
            for f in base.rglob("*"):
                if f.suffix.lower() in PESADOS:
                    with self.subTest(fichero=str(f)):
                        self.fail(f"binario pesado donde no debe: {f}")


if __name__ == "__main__":
    unittest.main(verbosity=1)
