#!/usr/bin/env python3
"""Guarda de theGame (ATLAS, el Bosque Sumergido). Biblioteca estandar + node.

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
import subprocess
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ.parent / "public"
ASSETS = PUBLICO / "assets"
PISO = ASSETS  # los guiones, la hoja y la tira viven en public/assets/
CODIGO = ("atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js",
          "atlas-piso.js", "atlas.css", "preceptor-pixel.png", "thegame.js")
LENGUAS = ["ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"]
PESADOS = (".gguf", ".onnx", ".safetensors", ".bin", ".wav", ".mp3", ".ogg", ".opus")
TOPE_GZIP = 2 * 1024 * 1024      # §E: bundle ATLAS < 2 MB gzip
TOPE_FICHERO = 16 * 1024         # el mismo tope por fichero que la web


def sin_comentarios(js):
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", js)


class Piso(unittest.TestCase):

    def test_solo_pide_su_texto_y_sus_leyes(self):
        """Dos salidas de red, las dos al propio origen: su texto y las leyes
        medidas del mundo. Ni una mas."""
        codigo = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", codigo), ["BASE + ruta"])
        self.assertEqual(re.findall(r"json\(('[^)]*)\)", codigo),
                         ["'atlas-' + lang + '.json'", "'atlas-mundo.json'"],
                         "el juego pide algo mas que su texto y sus leyes")
        for salida in ("XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
                       "RTCPeerConnection", "new Image", "Worker(", "importScripts",
                       "http://", "https://", "innerHTML"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, codigo, f"el piso puede salir por {salida}")

    def test_arte_mapa_y_dialogo_no_salen_a_la_red(self):
        """El arte es geometria: ni un raster, ni una peticion, ni innerHTML."""
        for nombre in ("atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js"):
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

    def test_solo_se_entra_por_thegame(self):
        """El juego salio de la Torre (Soberano, 2026-09-26): vive tras la
        puerta theGame y no escucha a la Torre ni busca un piso."""
        piso = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertIn("window.AtlasJuego", piso)
        self.assertIn("atlas.instantanea/1", piso, "falta la instantanea para la guia")
        for torre in ("preceptor:torre", "piso-atlas", "TorreUI"):
            with self.subTest(resto=torre):
                self.assertNotIn(torre, piso, "el juego vuelve a depender de la Torre")
        capa = sin_comentarios((PISO / "thegame.js").read_text(encoding="utf-8"))
        # <dialog> nativo con showModal(): el navegador deja inerte la pagina de
        # debajo (trampa de foco real, la que respetan TalkBack y VoiceOver) y
        # Escape llega como `cancel`.
        for pieza in ("el('dialog'", "showModal()", "'cancel'", "s.async = false",
                      "window.AtlasJuego.monta", "window.AtlasJuego.pausa", "origen.focus",
                      "cierre_aviso"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, capa)
        for g in ("atlas-arte.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js", "atlas-piso.js"):
            with self.subTest(guion=g):
                self.assertIn(f"['{g}'", capa, f"la capa no carga {g}")

    def test_el_motor_es_puro_y_cumple_sus_casos(self):
        """`atlas-motor.js` sin DOM ni red, y sus casos deterministas en verde:
        curva OSRS, reparacion, tope de 24 h, oxigeno, Ingenieria 60, eventos."""
        motor = sin_comentarios((PISO / "atlas-motor.js").read_text(encoding="utf-8"))
        for impuro in ("document", "window.", "fetch", "localStorage", "indexedDB",
                       "setInterval", "setTimeout", "Math.random"):
            with self.subTest(impuro=impuro):
                self.assertNotIn(impuro, motor, f"el motor deja de ser puro: {impuro}")
        r = subprocess.run(["node", str(RAIZ / "motor_casos.mjs")], capture_output=True,
                           text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 30, "faltan casos del motor")
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_la_curva_es_la_canonica_osrs_y_se_recalcula(self):
        """PROCEDENCIA DE LA CURVA: la formula publica de RuneScape (Jagex),
        la misma de Old School RuneScape: XP(L) = floor(1/4 * sum_{n=1}^{L-1}
        floor(n + 300 * 2^(n/7))). No se copia de una web: se recalcula aqui y
        se compara con la tabla entera del motor, nivel a nivel.

        Los cuatro valores que se citan en el juego y en la PR son XP MINIMA
        para alcanzar un nivel: 83 = nivel 2 · 1 154 = nivel 10 · 273 742 =
        nivel 60 (el umbral de Ingenieria para bajar a 300 m+) · 13 034 431 =
        nivel 99 (el tope de nivel; la XP sigue hasta 200 000 000)."""
        import math
        tabla, puntos = [0], 0
        for n in range(1, 99):
            puntos += math.floor(n + 300 * 2 ** (n / 7))
            tabla.append(puntos // 4)
        r = subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify("
                            "require('./public/assets/atlas-motor.js').XP))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout), tabla, "la tabla del motor no es la curva OSRS")
        for nivel, xp in ((2, 83), (10, 1154), (60, 273742), (99, 13034431)):
            with self.subTest(nivel=nivel):
                self.assertEqual(tabla[nivel - 1], xp)

    def test_las_leyes_del_mundo_coinciden_con_lo_medido(self):
        """`atlas-mundo.json` no es decorado: cada cifra se recalcula aqui.
        Remedio si falla: python3 atlas/mundo.py"""
        sys.path.insert(0, str(RAIZ))
        import mundo
        d = json.loads((PUBLICO / "atlas-mundo.json").read_text(encoding="utf-8"))
        self.assertEqual(d["esquema"], "atlas.mundo/1")
        for clave, valor in (("pruebas_web", mundo.pruebas_web()), ("lenguas", mundo.lenguas()),
                             ("gzip_juego_b", mundo.gzip_juego()), ("version_sw", mundo.version_sw()),
                             ("techo_fichero_b", 16 * 1024)):
            with self.subTest(ley=clave):
                self.assertEqual(d[clave], valor, f"{clave} desfasado: python3 atlas/mundo.py")
        self.assertRegex(d["arnes_sw"], r"^\d+/\d+$|^NO_DATA$")
        # Cuando y donde: la doctrina pide las dos cosas, sin nombre de nodo.
        self.assertRegex(d.get("medido_el", ""), r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$")
        self.assertTrue(d.get("maquina"), "no dice en que maquina se midio")
        import socket
        self.assertNotIn(socket.gethostname(), d["maquina"], "el mundo lleva un hostname")
        texto = json.dumps(d)
        # Las rutas se escriben partidas: este fichero tambien pasa la guarda
        # de rutas absolutas de `test_web.py`.
        for fuga in ("/ho" + "me/", "/ro" + "ot/", "\\\\", "@"):
            with self.subTest(fuga=fuga):
                self.assertNotIn(fuga, texto, "el mundo lleva una ruta o un nombre")

    def test_las_nueve_lenguas_tienen_las_mismas_claves(self):
        base = json.loads((PUBLICO / "atlas-es.json").read_text(encoding="utf-8"))
        codigo = (PISO / "atlas-piso.js").read_text(encoding="utf-8")
        pedidas = set(re.findall(r"\bU\('([a-z0-9_]+)'\)", codigo))
        pedidas |= {x + "n" for x in re.findall(r"'(b[1-4])'", codigo)}
        # Claves que el panel compone (las cinco fases) y la que pide la capa.
        pedidas |= {f"f{n}" for n in range(1, 6)} | {"cierre_aviso"}
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
