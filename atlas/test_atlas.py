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
          "atlas-piso.js", "atlas.css", "preceptor-pixel.png", "thegame.js",
          "atlas-piloto.js", "atlas-partida.js", "atlas-piloto-capa.js")
PILOTO = ("atlas-piloto.js", "atlas-partida.js", "atlas-piloto-capa.js")
DATOS = RAIZ.parent / "data"
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
        # La instantanea se mudo a `atlas-partida.js` (2026-09-27) para que la
        # pestana, el arnes y la Aduana la calculen con el MISMO codigo; el piso
        # la sigue exponiendo como antes.
        partida = sin_comentarios((PISO / "atlas-partida.js").read_text(encoding="utf-8"))
        self.assertIn("atlas.instantanea/1", partida, "falta la instantanea para la guia")
        self.assertIn("instantanea: instantanea", piso, "el piso ya no expone la instantanea")
        self.assertIn("AtlasPartida.instantanea(E, M)", piso)
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
        # Y las que pide la capa del piloto.
        capa = (PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8")
        pedidas |= set(re.findall(r"\bT\('([a-z0-9_]+)'\)", capa))
        pedidas |= set(re.findall(r"'(piloto_[hn]\d)'", capa))
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


class Piloto(unittest.TestCase):
    """El piloto base, la partida firmada y sus contratos (Soberano, 2026-09-27:
    «un LoRA por nodo que mueve los valores del juego; el usuario acepta y la
    maquina juega sola»). Hoy juega una REGLA FIJA; el LoRA entra solo si le
    gana en el arnes."""

    def test_el_piloto_y_la_partida_son_puros(self):
        """La regla y la partida no tocan DOM, red, reloj ni azar: misma
        instantanea, misma accion; misma partida, mismo final."""
        for nombre in ("atlas-piloto.js", "atlas-partida.js"):
            codigo = sin_comentarios((PISO / nombre).read_text(encoding="utf-8"))
            for impuro in ("document", "window.", "fetch", "localStorage", "indexedDB",
                           "sessionStorage", "setInterval", "setTimeout", "Math.random",
                           "Date", "XMLHttpRequest", "innerHTML"):
                with self.subTest(fichero=nombre, impuro=impuro):
                    self.assertNotIn(impuro, codigo, f"{nombre} deja de ser puro: {impuro}")

    def test_casos_del_piloto_y_la_partida(self):
        """Casos en node: la regla, la grabadora, la reproduccion y la firma.
        Incluye la partida INVENTADA y bien firmada que solo caza la
        reproduccion: si se quita, ese caso se pone rojo."""
        r = subprocess.run(["node", str(RAIZ / "piloto_casos.mjs")], capture_output=True,
                           text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 18, "faltan casos del piloto")
        self.assertTrue(any("INVENTADA" in c["caso"] for c in casos), "falta el caso de la partida inventada")
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_el_record_de_la_casa_se_recalcula(self):
        """`atlas-record.json` no es decorado: el arnes lo vuelve a medir y
        tiene que salir igual, byte a byte. Remedio: node atlas/arnes_piloto.mjs"""
        r = subprocess.run(["node", str(RAIZ / "arnes_piloto.mjs"), "--stdout"],
                           capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual((PUBLICO / "atlas-record.json").read_text(encoding="utf-8"), r.stdout,
                         "record desfasado: node atlas/arnes_piloto.mjs")
        d = json.loads(r.stdout)
        self.assertEqual(d["politica"], "piloto_base")
        self.assertEqual(d["piloto_base"]["invalidas"], 0, "la regla propone acciones fuera del enum")
        self.assertEqual(d["ley"], {k: d["ley"][k] for k in ("nd", "integridad_max", "dano")})

    def test_la_capa_del_piloto_solo_pide_el_record(self):
        """Una salida de red, al propio origen: el record de la casa. Ni la
        partida ni la aceptacion salen solas; exportar es un fichero."""
        codigo = sin_comentarios((PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", codigo), ["'/atlas-record.json'"])
        for salida in ("http://", "https://", "XMLHttpRequest", "sendBeacon", "WebSocket",
                       "EventSource", "importScripts", "innerHTML", "localStorage",
                       "sessionStorage", "indexedDB", "Enviar"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, codigo)

    def test_acepto_firma_y_declara_lo_que_no_hace(self):
        """Sin firma no arranca: `arranca()` solo se llama tras `Identity.firmar`
        de una `atlas.aceptacion/1` que lleva las cuatro negaciones. Y las
        cuatro se DICEN en las nueve lenguas, con el mismo peso que lo que hace."""
        codigo = sin_comentarios((PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8"))
        llamadas = re.findall(r"(?<!function )\barranca\(\)", codigo)
        self.assertEqual(len(llamadas), 1, "el piloto arranca por otro camino")
        self.assertIn("firma = f.firma; cierra(); arranca();", codigo)
        self.assertIn("window.Identity.firmar(obj)", codigo)
        self.assertIn("que_no_hace: ['valor', 'credenciales', 'red', 'guardado']", codigo)
        self.assertIn("'piloto_hace'", codigo); self.assertIn("'piloto_no'", codigo)
        for l in LENGUAS:
            ui = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            for k in ("piloto_acepto", "piloto_n1", "piloto_n2", "piloto_n3", "piloto_n4",
                      "piloto_modelo", "piloto_firma", "piloto_soltar", "piloto_fusible"):
                with self.subTest(lengua=l, clave=k):
                    self.assertTrue(ui.get(k, "").strip(), f"{l} no dice {k}")

    def test_el_piloto_se_carga_con_el_juego_y_no_antes(self):
        """A demanda, detras del piso, fuera del precache y de todo HTML."""
        capa = (PISO / "thegame.js").read_text(encoding="utf-8")
        orden = [capa.index(f"['{g}'") for g in ("atlas-piso.js",) + PILOTO]
        self.assertEqual(orden, sorted(orden), "el piloto se carga antes que el piso")
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        for q in PILOTO + ("atlas-record.json",):
            with self.subTest(pieza=q):
                self.assertNotIn(q, sw, f"{q} entra en el precache")
                for h in PUBLICO.rglob("*.html"):
                    self.assertNotIn(q, h.read_text(encoding="utf-8"), f"{h.name} carga {q}")

    def test_los_contratos_cazan_sus_violaciones(self):
        """Por contrato: un caso bueno VERDE y seis violaciones ROJAS. Y el
        sabotaje: con el esquema relajado a un objeto cualquiera las seis
        pasarian, asi que es el contrato --no el JSON roto-- quien las caza."""
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · sin jsonschema no se valida el contrato. Remedio: pip install jsonschema")
        pub = "a" * 64
        ok_acc = {"esquema": "atlas.accion/1", "accion": "bajar_a", "banda": "bosque", "origen": "piloto_base", "ciclo": 3}
        ok_ace = {"esquema": "atlas.aceptacion/1", "modo": "piloto", "politica": "piloto_base",
                  "contenido_v": "2026-09-26.1", "que_hace": ["lee_instantanea"],
                  "que_no_hace": ["valor", "credenciales", "red", "guardado"],
                  "pseudonimo": "x", "clave_publica": pub}
        final = {"esquema": "atlas.instantanea/1", "ciclo": 1, "fase": 1, "nivel_nucleo": 1,
                 "integridad": 117, "recursos": {}, "niveles": {}}
        ok_par = {"esquema": "atlas.partida/1", "contenido_v": "2026-09-26.1",
                  "ley": {"nd": False, "integridad_max": 117, "dano": 1},
                  "pasos": [{"ciclos": 3}, {"dormir_ms": 0},
                            {"sugerencia": {"accion": "reparar"}, "respuesta": "hecha"},
                            {"accion": "reparar", "origen": "humano"}],
                  "truncada": False, "final": final}
        def con(base, **cambios):
            d = json.loads(json.dumps(base)); d.update(cambios); return d
        def sin(base, clave):
            d = json.loads(json.dumps(base)); d.pop(clave); return d
        casos = {
            "atlas_accion_schema.json": (ok_acc, [
                con(ok_acc, accion="firmar"), sin(ok_acc, "banda"), con(ok_acc, banda="abismo"),
                con(ok_acc, origen="gemini"), con(ok_acc, firma_valor="x"), con(ok_acc, ciclo=-1)]),
            "atlas_aceptacion_schema.json": (ok_ace, [
                con(ok_ace, modo="auto"), con(ok_ace, que_no_hace=["credenciales", "red", "guardado"]),
                con(ok_ace, que_hace=[]), con(ok_ace, clave_publica="xyz"), sin(ok_ace, "pseudonimo"),
                con(ok_ace, gasto_max=10)]),
            "atlas_partida_schema.json": (ok_par, [
                con(ok_par, pasos=[{"accion": "firmar", "origen": "humano"}]),
                con(ok_par, pasos=[{"ciclos": 0}]), con(ok_par, ley={"nd": False}),
                con(ok_par, pasos=[{"accion": "reparar", "origen": "humano", "dia": "2026-09-27"}]),
                sin(ok_par, "final"), con(ok_par, hora="12:00")]),
        }
        # B6 (2026-09-27): con politica lora la firma cubre el modelo concreto.
        ace = jsonschema.Draft202012Validator(json.loads((DATOS / "atlas_aceptacion_schema.json").read_text(encoding="utf-8")))
        self.assertFalse(ace.is_valid(con(ok_ace, politica="lora")), "lora sin sha del modelo")
        self.assertTrue(ace.is_valid(con(ok_ace, politica="lora", modelo_sha256="b" * 64)))
        self.assertFalse(ace.is_valid(con(ok_ace, modelo_sha256="b" * 64)), "sha de modelo en el piloto base")
        for nombre, (bueno, malos) in casos.items():
            esquema = json.loads((DATOS / nombre).read_text(encoding="utf-8"))
            jsonschema.Draft202012Validator.check_schema(esquema)
            v = jsonschema.Draft202012Validator(esquema)
            relajado = jsonschema.Draft202012Validator({"type": "object"})
            with self.subTest(contrato=nombre, caso="bueno"):
                self.assertEqual([e.message for e in v.iter_errors(bueno)], [])
            self.assertEqual(len(malos), 6)
            for i, malo in enumerate(malos):
                with self.subTest(contrato=nombre, violacion=i):
                    self.assertFalse(v.is_valid(malo), f"{nombre} deja pasar la violacion {i}")
                    self.assertTrue(relajado.is_valid(malo), "la violacion no depende del contrato")

    def test_la_aduana_publica_vuelve_a_jugar_las_partidas(self):
        """El workflow `partidas` llama al MISMO verificador que usara el rack,
        con permisos de solo lectura y sin `pull_request_target`."""
        wf = (RAIZ.parent / ".github" / "workflows" / "partidas.yml").read_text(encoding="utf-8")
        self.assertIn('node atlas/verifica_partida.mjs "$f"', wf)
        self.assertIn("contents: read", wf)
        # Los comentarios lo nombran para decir por que NO; se mira el YAML vivo.
        vivo = "\n".join(l for l in wf.splitlines() if not l.lstrip().startswith("#"))
        self.assertNotIn("pull_request_target", vivo)
        self.assertIn('[ "$fallos" -eq 0 ]', wf, "un rechazo no pone el check en rojo")
        for f in sorted((RAIZ.parent / "partidas").glob("*.json")):
            with self.subTest(partida=f.name):
                r = subprocess.run(["node", str(RAIZ / "verifica_partida.mjs"), str(f)],
                                   capture_output=True, text=True, timeout=120)
                self.assertEqual(r.returncode, 0, r.stdout)

    def test_lo_oculto_no_se_ve(self):
        """Un `display` propio anula el atributo `hidden` (medido el 2026-09-27:
        «Hacer / Ignorar» se veia con Sugerir apagado). Toda clase de la capa
        que se oculta con `hidden` y tiene display propio necesita su regla."""
        css = (PISO / "atlas.css").read_text(encoding="utf-8")
        for clase in ("thegame-sugerencia", "atlas-eclosion"):
            with self.subTest(clase=clase):
                self.assertIn(f".{clase}[hidden]", css)

    def test_sugerir_no_juega_por_la_persona(self):
        """Humano + piloto: la regla propone y la accion solo se aplica al
        pulsar Hacer; lo propuesto y lo respondido quedan en la partida."""
        codigo = sin_comentarios((PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8"))
        self.assertIn("if (modo === 'sugerir') { return sugiere(); }", codigo)
        self.assertIn("window.AtlasPartida.anota(a, hacer ? 'hecha' : 'ignorada');", codigo)
        self.assertEqual(codigo.count("window.AtlasJuego.aplica(a)"), 1,
                         "sugerir aplica la accion sin que la persona la pulse")
        self.assertIn("if (hacer) { window.AtlasJuego.aplica(a); return; }", codigo)


class TheGameV15(unittest.TestCase):
    """theGame v1.5 (Directiva Maestra del Soberano, 2026-09-27): gacha
    armonico, loot al estilo Diablo, huevo, adopcion FIRMADA en el Army y
    sonido de ondas. Lo que la directiva pide y aun no se construye
    (`city_node.js`, `a2a_routes.js`: P2P, enclaves, guerra) esta PENDIENTE DE
    FIRMA en `atlas/DIRECTIVA_V15_ESTADO.md`, y esta clase lo vigila: que no
    aparezca a medias.

    VIVE AQUI Y NO EN `test_web.py`, aunque la directiva lo pida alli: el
    numero de pruebas de `test_web.py` es una cifra PUBLICADA en tres
    portadas cuyo dueno es `coherencia-publica.py`, en el rack. Subirla desde
    la nube obligaria a transcribir a mano el campo de otro dueno. El CI corre
    las dos guardas en el mismo job; moverla es un paso del rack."""

    JUEGO = PUBLICO / "game"
    MODULOS = ("valores.js", "gacha.js", "db.js", "core.js", "ui.js")

    def _js(self, nombre):
        return sin_comentarios((self.JUEGO / nombre).read_text(encoding="utf-8"))

    def test_v15_cada_modulo_cabe_en_16_kb(self):
        """Instruccion 1 de la directiva: ningun modulo pasa de 16 KB."""
        presentes = sorted(q.name for q in self.JUEGO.glob("*.js"))
        self.assertEqual(presentes, sorted(self.MODULOS),
                         "aparece un modulo de la v1.5 sin su firma (ver DIRECTIVA_V15_ESTADO.md)")
        for q in self.JUEGO.iterdir():
            with self.subTest(modulo=q.name):
                self.assertLessEqual(q.stat().st_size, 16 * 1024, f"{q.name} pasa de 16 KB")

    def test_v15_puro_y_sin_ficheros_de_sonido_ni_imagen(self):
        """Instrucciones 2 y 3: la tirada no usa el azar del sistema, y el
        sonido son OscillatorNode de seno, sin un solo MP3."""
        for nombre in ("gacha.js", "core.js"):
            codigo = self._js(nombre)
            for impuro in ("Math.random", "Date", "fetch", "localStorage", "indexedDB",
                           "XMLHttpRequest", "http://", "https://", "innerHTML"):
                with self.subTest(modulo=nombre, impuro=impuro):
                    self.assertNotIn(impuro, codigo)
        core = self._js("core.js")
        self.assertIn("createOscillator()", core)
        self.assertEqual(set(re.findall(r"\.type = '(\w+)'", core)), {"sine"}, "otra onda que no es seno")
        for fichero in (".mp3", ".ogg", ".wav", ".opus", "new Audio(", ".png", ".webp", ".ttf", ".woff"):
            with self.subTest(fichero=fichero):
                for nombre in self.MODULOS:
                    self.assertNotIn(fichero, self._js(nombre), f"{nombre} carga {fichero}")

    def test_v15_casos_en_node(self):
        """Gacha, motor, partida, Army y sintesis en node, deterministas."""
        import subprocess
        r = subprocess.run(["node", str(RAIZ / "gacha_casos.mjs")], capture_output=True,
                           text=True, timeout=180)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 21, "faltan casos de la v1.5")
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_v15_el_army_solo_admite_firma_verificada(self):
        """Instruccion 4: sumar una tropa exige la firma Ed25519, y no basta
        con que exista: se VERIFICA dentro del unico camino de escritura."""
        db = self._js("db.js")
        self.assertEqual(db.count("army.push("), 1, "hay otro camino para meter tropas")
        entra = db.index("army.push(")
        self.assertLess(db.index("verifica(JSON.stringify(ad), m[1], ad.clave_publica)"), entra)
        self.assertLess(db.index("if (!ok) { throw new Error('firma: no verifica'); }"), entra)
        ui = self._js("ui.js")
        self.assertNotIn("push(u", ui); self.assertNotIn("army.push", ui)
        self.assertIn("army.adopta(r.obj, r.firma)", ui)
        self.assertIn("window.Identity.firmar(obj)", ui)

    def test_v15_invocar_firma_antes_de_pagar_y_se_carga_a_demanda(self):
        """Se firma la invocacion y SOLO DESPUES se paga por el motor; y los
        modulos entran por la puerta theGame, fuera del precache y de todo HTML."""
        ui = self._js("ui.js")
        self.assertLess(ui.index("firma({ esquema: 'atlas.invocacion/1'"), ui.index("window.AtlasJuego.invoca(TC.coste)"))
        for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage",
                       "sessionStorage", "indexedDB", "innerHTML", "http://", "https://"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, ui)
        capa = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        listas = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        for m in self.MODULOS:
            with self.subTest(modulo=m):
                self.assertIn(f"['/game/{m}']", capa, f"la puerta no carga {m}")
                self.assertNotIn(f"game/{m}", listas, f"{m} entra en el precache")
                for h in PUBLICO.rglob("*.html"):
                    self.assertNotIn(f"game/{m}", h.read_text(encoding="utf-8"))

    def test_v15_el_contrato_cubre_lo_que_cae(self):
        """Contrato antes que codigo: 400 tiradas reales validan contra
        `atlas.gacha/1`, y seis violaciones se rechazan."""
        import subprocess
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · sin jsonschema. Remedio: pip install jsonschema")
        esquema = json.loads((DATOS / "atlas_gacha_schema.json").read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator.check_schema(esquema)
        def v(defn):
            return jsonschema.Draft202012Validator({"$ref": f"#/$defs/{defn}", "$defs": esquema["$defs"]})
        r = subprocess.run(["node", "-e", "const G=require('./public/game/gacha.js'),c=require('crypto');"
                            "const o=[];for(let i=0;i<400;i++){o.push(G.tirada(c.createHash('sha256').update('t'+i).digest('hex'),'tc'+(1+i%4)))}"
                            "process.stdout.write(JSON.stringify(o))"], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        tropas = json.loads(r.stdout)
        for t in tropas:
            self.assertEqual([e.message for e in v("tropa").iter_errors(t)], [])
        t = tropas[0]
        malas = [dict(t, rareza="mitico"), dict(t, tc="tc9"), dict(t, semilla="x"), dict(t, precio=1),
                 dict(t, armonicos=[]), dict(t, stats=dict(t["stats"], vida=-1))]
        for i, m in enumerate(malas):
            with self.subTest(violacion=i):
                self.assertFalse(v("tropa").is_valid(m))
        ad = {"esquema": "atlas.adopcion/1", "tropa": t, "pseudonimo": "x", "clave_publica": "a" * 64}
        self.assertTrue(v("adopcion").is_valid(ad))
        self.assertFalse(v("adopcion").is_valid(dict(ad, tropa=dict(t, rareza="mitico"))))

    def test_v15_los_valores_son_testnet_y_solo_datos(self):
        """Los valores viven en `valores.js`, marcados TESTNET y dichos en
        pantalla; la logica no lleva cifras de equilibrio."""
        import subprocess
        v = self._js("valores.js")
        for impuro in ("function", "=>", "fetch", "Math.", "Date"):
            with self.subTest(impuro=impuro):
                self.assertNotIn(impuro, v.split("var VALORES = ")[1].split("if (typeof module")[0])
        r = subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(require('./public/game/valores.js')))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=30)
        d = json.loads(r.stdout)
        self.assertEqual(d["red"], "testnet")
        self.assertIn("T('testnet')", self._js("ui.js"), "la pantalla no dice que son valores de testnet")
        g = self._js("gacha.js")
        for cifra in ("cobre: 50", "calidad: [", "vida: [4, 9]"):
            with self.subTest(cifra=cifra):
                self.assertNotIn(cifra, g, "una cifra de equilibrio volvio a la logica")

    def test_v15_textos_en_las_nueve(self):
        """Todo lo que dice la incubadora existe en las nueve lenguas."""
        ui = self._js("ui.js")
        g = sin_comentarios((self.JUEGO / "gacha.js").read_text(encoding="utf-8"))
        pedidas = set(re.findall(r"\bT\('([a-z0-9_]+)'\)", ui))
        pedidas |= {f"tc{i}" for i in range(1, 5)} | {f"rar_{r}" for r in ("normal", "magico", "raro", "unico")}
        vj = sin_comentarios((self.JUEGO / "valores.js").read_text(encoding="utf-8"))
        pedidas |= {"base_" + b for b in re.findall(r"base: '(\w+)'", vj)}
        for bloque in ("prefijos", "sufijos"):
            cuerpo = re.search(bloque + r": \{(.*?)\n    \}", vj, re.S).group(1)
            pedidas |= {"af_" + a for a in re.findall(r"(\w+): \{", cuerpo)}
        pedidas |= {"st_" + k for k in re.search(r"var STATS = \[([^\]]+)\]", g).group(1).replace("'", "").replace(" ", "").split(",")}
        self.assertGreaterEqual(len(pedidas), 45)
        for l in LENGUAS:
            ui_l = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            with self.subTest(lengua=l):
                self.assertFalse(pedidas - set(ui_l), f"faltan en {l}: {sorted(pedidas - set(ui_l))}")


if __name__ == "__main__":
    unittest.main(verbosity=1)
