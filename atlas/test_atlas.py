#!/usr/bin/env python3
"""Guarda del piso 9, ATLAS, ya dentro de `public/`. Biblioteca estandar.

    python3 atlas/test_atlas.py

Sigue aparte de `test_web.py`: aqui vive lo propio del juego (celdas del
sprite, alt, presupuesto del bundle); en `test_web.py` queda lo que ata el
piso a la Torre (nueve pisos, carga a demanda, fuera del precache).

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
PUBLICO = RAIZ.parent / "public"
ASSETS = PUBLICO / "assets"
PISO = ASSETS  # los guiones, la hoja y la tira viven en public/assets/
CODIGO = ("atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-piso.js",
          "atlas.css", "preceptor-pixel.png", "camino-atlas.js")
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

    def test_arte_mapa_y_dialogo_no_salen_a_la_red(self):
        """El arte es geometria: ni un raster, ni una peticion, ni innerHTML."""
        for nombre in ("atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js"):
            codigo = sin_comentarios((PISO / nombre).read_text(encoding="utf-8"))
            for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
                           "EventSource", "new Image", "Worker(", "importScripts",
                           "innerHTML", "drawImage(new"):
                with self.subTest(fichero=nombre, salida=salida):
                    self.assertNotIn(salida, codigo, f"{nombre} puede salir por {salida}")
            # `url(#id)` es una referencia DENTRO del propio SVG; cualquier otro
            # `url(` seria un recurso de fuera.
            with self.subTest(fichero=nombre, salida="url("):
                self.assertFalse(re.search(r"url\((?!#)", codigo),
                                 f"{nombre} pide un recurso por url(")

    def test_el_dialogo_tiene_su_texto_en_las_nueve(self):
        codigo = (PISO / "atlas-dialogo.js").read_text(encoding="utf-8")
        pedidas = set(re.findall(r"ui\.(dlg_[a-z0-9]+)", codigo))
        pedidas |= set(re.findall(r"'(dlg_[a-z0-9]+)'", codigo))
        self.assertTrue(pedidas, "el dialogo no pide ningun texto")
        for l in LENGUAS:
            d = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertFalse(pedidas - set(d["ui"]), f"faltan {pedidas - set(d['ui'])}")

    def test_el_sprite_es_el_unico_raster_y_no_va_al_precache(self):
        """La tira del Preceptor se pide al abrir el dialogo, nunca de salida."""
        codigo = sin_comentarios((PISO / "atlas-dialogo.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"\.src\s*=\s*([^;]+);", codigo), ["BASE + TIRA"])
        self.assertIn("var TIRA = 'preceptor-pixel.png';", codigo)
        for nombre in ("atlas-piso.js", "atlas-arte.js", "atlas-mapa.js"):
            with self.subTest(fichero=nombre):
                self.assertNotIn(".src", sin_comentarios(
                    (PISO / nombre).read_text(encoding="utf-8")), f"{nombre} pide un raster")
        for f in ("sw.js", "sw-listas.js"):
            ruta = PUBLICO / f
            if ruta.exists():
                with self.subTest(fichero=f):
                    self.assertNotIn("preceptor-pixel", ruta.read_text(encoding="utf-8"),
                                     "el sprite no se precachea: se carga a demanda")
        tira = PISO / "preceptor-pixel.png"
        self.assertTrue(tira.read_bytes().startswith(b"\x89PNG"))
        self.assertLess(tira.stat().st_size, 96 * 1024, "la tira engorda")

    def test_celda_por_estado_es_determinista(self):
        """reposo 0, habla 1-2, revelar 3, alerta 4: el mapa congelado y el CSS
        que mueve la tira dicen lo mismo."""
        codigo = (PISO / "atlas-dialogo.js").read_text(encoding="utf-8")
        m = re.search(r"CELDAS = Object\.freeze\(\{([^}]*)\}\)", codigo)
        self.assertTrue(m, "sin mapa de celdas congelado")
        mapa = {k: [int(n) for n in re.findall(r"\d", v)]
                for k, v in re.findall(r"(\w+):\s*(\[[^\]]*\]|\d)", m.group(1))}
        self.assertEqual(mapa, {"reposo": [0], "habla": [1, 2], "revelar": [3], "alerta": [4]})
        css = (PISO / "atlas.css").read_text(encoding="utf-8")
        for n in range(1, 5):
            with self.subTest(celda=n):
                self.assertIn(f'.atlas-pre[data-celda="{n}"] .atlas-pre-tira'
                              f'{{transform:translateX(-{n * 20}%)}}', css)
        self.assertIn("CELDAS.habla[(paso >> 2) % 2]", codigo, "el habla no alterna por paso")
        self.assertIn("CELDAS.revelar", codigo)
        self.assertIn("alerta ? CELDAS.alerta : CELDAS.reposo", codigo)

    def test_el_alt_del_retrato_sale_del_json(self):
        codigo = sin_comentarios((PISO / "atlas-dialogo.js").read_text(encoding="utf-8"))
        self.assertIn("ui.atlas_retrato_alt", codigo)
        self.assertEqual(re.findall(r"\.alt\s*=\s*'[^']+'", codigo), [], "alt escrito a mano")
        for l in LENGUAS:
            d = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertGreater(len(d["ui"].get("atlas_retrato_alt", "")), 20)
                self.assertTrue(d["procedencia"].get("retrato"), "retrato sin procedencia")

    def test_se_monta_como_los_demas_pisos(self):
        codigo = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertIn("preceptor:torre", codigo, "no escucha el aviso de la Torre")
        self.assertIn("piso-atlas", codigo, "no busca su piso")

    def test_las_nueve_lenguas_tienen_las_mismas_claves(self):
        base = json.loads((PUBLICO / "atlas-es.json").read_text(encoding="utf-8"))
        codigo = (PISO / "atlas-piso.js").read_text(encoding="utf-8")
        pedidas = set(re.findall(r"\bU\('([a-z0-9_]+)'\)", codigo))
        pedidas |= {x + "n" for x in re.findall(r"'(b[1-4])'", codigo)}
        for l in LENGUAS:
            d = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertEqual(d["idioma"], l)
                self.assertTrue(d.get("procedencia"), "sin procedencia declarada")
                self.assertEqual(set(d["ui"]), set(base["ui"]))
                self.assertEqual(len(d["skills"]), 7, "no son siete skills")
                self.assertFalse(pedidas - set(d["ui"]),
                                 f"claves que el piso pide y faltan: {pedidas - set(d['ui'])}")

    def test_presupuesto_de_peso(self):
        total = 0
        piezas = [ASSETS / n for n in CODIGO] + sorted(PUBLICO.glob("atlas-*.json"))
        for f in piezas:
            if f.is_file():
                with self.subTest(fichero=f.name):
                    if f.suffix in (".js", ".css", ".json", ".html"):
                        self.assertLessEqual(f.stat().st_size, TOPE_FICHERO,
                                             f"{f.name} pasa del tope por fichero")
                total += len(gzip.compress(f.read_bytes()))
        self.assertLess(total, TOPE_GZIP, f"el piso pesa {total} B gzip")

    def test_ningun_binario_pesado(self):
        for base in (PUBLICO,):
            for f in base.rglob("*"):
                if f.suffix.lower() in PESADOS:
                    with self.subTest(fichero=str(f)):
                        self.fail(f"binario pesado donde no debe: {f}")


if __name__ == "__main__":
    unittest.main(verbosity=1)
