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
CODIGO = ("atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-obra.js", "atlas-gesto.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js",
          "atlas-piso.js", "atlas.css", "thegame.js", "thegame.css",
          "atlas-piloto.js", "atlas-partida.js", "atlas-piloto-capa.js", "atlas-guardado.js", "atlas-hud.js", "atlas-mapa.css")
PILOTO = ("atlas-piloto.js", "atlas-partida.js", "atlas-piloto-capa.js")
DATOS = RAIZ.parent / "data"
LENGUAS = ["ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"]
# Las lenguas COMPLETAS del juego salen de `thegame.js` (una sola lista: aquí se lee, no se copia).
# El resto de LENGUAS son BORRADORES de traducción: se vigila que no traigan claves huérfanas y se
# mide su cobertura, sin exigir que estén completos (el Soberano, 2026-09-28: «hoy, solo inglés»).
LENGUAS_JUEGO = json.loads(re.search(r"var LENGUAS = (\[[^\]]*\])", (ASSETS / "thegame.js")
                                     .read_text(encoding="utf-8")).group(1).replace("'", '"'))
BORRADORES = [l for l in LENGUAS if l not in LENGUAS_JUEGO]
PESADOS = (".gguf", ".onnx", ".safetensors", ".bin", ".wav", ".mp3", ".ogg", ".opus")
TOPE_GZIP = 2 * 1024 * 1024      # §E: bundle ATLAS < 2 MB gzip
TOPE_FICHERO = 25 * 1024 * 1024         # el mismo tope por fichero que la web


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
        for l in LENGUAS_JUEGO:
            d = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertFalse(pedidas - set(d["ui"]), f"faltan {pedidas - set(d['ui'])}")

    def test_el_retrato_es_la_onda_del_emblema_sin_raster(self):
        """Firma F2 del Soberano, 2026-10-10: identidad pura, cero imagenes. El guia
        ya no es una tira PNG (firma del 2026-09-25, superada): es la onda del
        emblema del sitio, y su espectro literal tiene que ser el que tira el motor."""
        codigo = sin_comentarios((PISO / "atlas-dialogo.js").read_text(encoding="utf-8"))
        for nombre in ("atlas-dialogo.js", "atlas-piso.js", "atlas-arte.js", "atlas-mapa.js"):
            with self.subTest(fichero=nombre):
                self.assertNotIn(".src", sin_comentarios(
                    (PISO / nombre).read_text(encoding="utf-8")), f"{nombre} pide un raster")
        self.assertFalse((PISO / "preceptor-pixel.png").exists(), "vuelve la tira PNG")
        m = re.search(r"var EMBLEMA = (\[\[.*?\]\]);", codigo)
        self.assertTrue(m, "sin espectro del emblema")
        r = subprocess.run(["node", "-e", "const c=require('crypto'),G=require('./public/game/gacha.js');"
                            "const s=c.createHash('sha256').update('atlas.emblema/1:preceptoros.org').digest('hex');"
                            "process.stdout.write(JSON.stringify(G.tirada(s,'tc3').armonicos))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(m.group(1)), json.loads(r.stdout),
                         "el retrato no es el emblema que tira el motor")

    def test_celda_por_estado_es_determinista(self):
        """reposo 0, habla 1-2, revelar 3, alerta 4: el mapa congelado y el CSS
        que mueve la tira dicen lo mismo."""
        codigo = (PISO / "atlas-dialogo.js").read_text(encoding="utf-8")
        m = re.search(r"CELDAS = Object\.freeze\(\{([^}]*)\}\)", codigo)
        self.assertTrue(m, "sin mapa de celdas congelado")
        mapa = {k: [int(n) for n in re.findall(r"\d", v)]
                for k, v in re.findall(r"(\w+):\s*(\[[^\]]*\]|\d)", m.group(1))}
        self.assertEqual(mapa, {"reposo": [0], "habla": [1, 2], "revelar": [3], "alerta": [4]})
        # La celda ya no mueve una tira por CSS: repinta la onda (habla, revelar, alerta).
        self.assertRegex(codigo, r"celda: function \(n\) \{[^}]*pinta\(\)", "la celda no repinta la onda")
        self.assertIn("CELDAS.habla[(paso >> 2) % 2]", codigo, "el habla no alterna por paso")
        self.assertIn("CELDAS.revelar", codigo)
        self.assertIn("alerta ? CELDAS.alerta : CELDAS.reposo", codigo)

    def test_el_alt_del_retrato_sale_del_json(self):
        codigo = sin_comentarios((PISO / "atlas-dialogo.js").read_text(encoding="utf-8"))
        self.assertIn("ui.atlas_retrato_alt", codigo)
        self.assertEqual(re.findall(r"\.alt\s*=\s*'[^']+'", codigo), [], "alt escrito a mano")
        for l in LENGUAS_JUEGO:
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
        # En la portada (mudanza b1, 2026-10-11) es una <section> dentro del panel; fuera, el <dialog>.
        for pieza in ("P ? 'section' : 'dialog'", "showModal()", "'cancel'", "s.async = false",
                      "window.AtlasJuego.monta", "window.AtlasJuego.pausa", "origen.focus",
                      "cierre_aviso"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, capa)
        for g in ("atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js", "atlas-piso.js"):
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
                             ("techo_bloque_b", 25 * 1024 * 1024)):
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
        base = json.loads((PUBLICO / f"atlas-{LENGUAS_JUEGO[0]}.json").read_text(encoding="utf-8"))
        codigo = (PISO / "atlas-piso.js").read_text(encoding="utf-8")
        pedidas = set(re.findall(r"\bU\('([a-z0-9_]+)'\)", codigo))
        pedidas |= {x + "n" for x in re.findall(r"'(b[1-4])'", codigo)}
        # Claves que el panel compone (las cinco fases) y la que pide la capa.
        pedidas |= {f"f{n}" for n in range(1, 6)} | {"cierre_aviso"}
        # Y las que pide la capa del piloto.
        capa = (PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8")
        pedidas |= set(re.findall(r"\bT\('([a-z0-9_]+)'\)", capa))
        pedidas |= set(re.findall(r"'(piloto_[hn]\d)'", capa))
        for l in LENGUAS_JUEGO:
            d = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))
            with self.subTest(lengua=l):
                self.assertEqual(d["idioma"], l)
                self.assertTrue(d.get("procedencia"), "sin procedencia declarada")
                self.assertEqual(set(d["ui"]), set(base["ui"]))
                self.assertEqual(len(d["skills"]), 7, "no son siete skills")
                self.assertFalse(pedidas - set(d["ui"]),
                                 f"claves que el piso pide y faltan: {pedidas - set(d['ui'])}")
        for l in BORRADORES:
            ui = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            with self.subTest(borrador=l):
                self.assertFalse(set(ui) - set(base["ui"]), f"{l} trae claves que el juego ya no tiene")
            print(f"  borrador {l}: {len(set(ui) & set(base['ui']))}/{len(base['ui'])} claves")

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
        for nombre in ("atlas-piloto.js", "atlas-partida.js", "atlas-carta.js", "atlas-coord.js"):
            codigo = sin_comentarios((PISO / nombre).read_text(encoding="utf-8"))
            for impuro in ("document", "window.", "fetch", "localStorage", "indexedDB",
                           "sessionStorage", "setInterval", "setTimeout", "Math.random",
                           "Date", "XMLHttpRequest", "innerHTML"):
                with self.subTest(fichero=nombre, impuro=impuro):
                    self.assertNotIn(impuro, codigo, f"{nombre} deja de ser puro: {impuro}")

    def test_la_carta_es_un_mundo_para_todos_y_su_niebla_no_retrocede(self):
        """`atlas-carta.js` (el mundo abierto, 2026-09-28): el mismo fondo para todas las personas,
        cada sector en la banda del motor que su lore dice, tu nodo fuera del poblado y siempre en
        el mismo sitio para la misma clave, la niebla que solo se abre al subir de fase, las ondas
        iguales para la misma tropa, y el JSON que lee un agente, cerrado y sin inventar ajenos."""
        js = r"""
const C = require('./public/assets/atlas-carta.js'), out = {};
out.bandas = Object.fromEntries(Object.entries(C.SECTORES).map(([k, x]) => [k, C.BANDAS[C.banda(C.suelo(x))][0]]));
const a = C.nodo('dea9298c11223344556677'), b = C.nodo('dea9298c11223344556677');
out.nodo_igual = JSON.stringify(a) === JSON.stringify(b);
out.nodo_fuera = Object.values(C.SECTORES).every((x) => Math.abs(C.dx(x, a.x)) >= 20);
out.sin_clave = C.nodo('') === null && C.nodo('zz') === null;
let prev = null; out.monotona = true;
for (let f = 1; f <= 5; f++) { const m = C.niebla({ fase: f, profundidad: '0-50', grieta: { abierta: false } }, a);
  if (prev) for (let i = 0; i < m.length; i++) if (m[i] < prev[i]) out.monotona = false; prev = m; }
const t = [{ armonicos: [[1, 24, 24, 0], [3, 9, 10, 12]] }];
out.ondas_iguales = JSON.stringify(C.helices(a, t)) === JSON.stringify(C.helices(b, t))
  && C.onda(C.helices(a, t)[0], 0.3, 1.5, 1) === C.onda(C.helices(b, t)[0], 0.3, 1.5, 1);
out.raices = C.raices(a).length;
const e = C.estado({ fase: 1, profundidad: '0-50' }, null);
out.esquema = e.esquema; out.nodo_nd = e.nodo.valor === null && !!e.nodo.causa; out.ajenos_nd = e.nodos_ajenos.valor === null;
process.stdout.write(JSON.stringify(out));
"""
        r = subprocess.run(["node", "-e", js], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        o = json.loads(r.stdout)
        self.assertEqual(o["bandas"], {"forja": "0-50", "ojo": "0-50", "nucleo": "300+",
                                       "grieta": "150-300", "aguja": "150-300"})
        for k in ("nodo_igual", "nodo_fuera", "sin_clave", "monotona", "ondas_iguales", "nodo_nd", "ajenos_nd"):
            with self.subTest(propiedad=k):
                self.assertTrue(o[k], k)
        self.assertGreater(o["raices"], 10)
        self.assertEqual(o["esquema"], "atlas.carta/1")

    def test_la_voz_exacta_es_la_misma_en_cada_aparato_y_va_en_partes_de_16_kb(self):
        """`atlas-voz.js` (2026-09-28): solo enteros (nada de `Math.sin`, que no esta garantizado
        igual en cada motor), misma tropa = misma huella, WAV en partes <= 16 KiB, y se carga al
        pulsar Escuchar: fuera de la puerta del juego y del precache (el SW la guarda al usarla)."""
        codigo = sin_comentarios((ASSETS / "atlas-voz.js").read_text(encoding="utf-8"))
        for impuro in ("Math.sin", "Math.cos", "Math.random", "Date", "fetch", "localStorage",
                       "indexedDB", "new Audio(", "http://", "https://"):
            with self.subTest(impuro=impuro):
                self.assertNotIn(impuro, codigo)
        js = r"""
const V = require('./public/assets/atlas-voz.js'), G = require('./public/game/gacha.js'), c = require('crypto');
const ts = [0, 1, 2].map((i) => G.tirada(c.createHash('sha256').update('v' + i).digest('hex'), 'tc' + (1 + i)));
const a = ts.map((t) => V.voz(t)), b = ts.map((t) => V.voz(t));
process.stdout.write(JSON.stringify({
  iguales: a.every((x, i) => x.huella.hex === b[i].huella.hex),
  distintas: new Set(a.map((x) => x.huella.hex)).size,
  partes: a.map((x) => x.partes), riff: String.fromCharCode(...a[0].wav.slice(0, 4)),
  sin: V.voz({ armonicos: [] }) === null }));
"""
        r = subprocess.run(["node", "-e", js], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        o = json.loads(r.stdout)
        self.assertTrue(o["iguales"], "la misma tropa no da los mismos bytes")
        self.assertEqual(o["distintas"], 3, "tres tropas distintas suenan igual")
        self.assertEqual(o["riff"], "RIFF")
        self.assertTrue(o["sin"], "sin armonicos inventa una voz")
        for partes in o["partes"]:
            self.assertTrue(all(0 < n <= 16 * 1024 for n in partes), partes)
        capa = (ASSETS / "thegame.js").read_text(encoding="utf-8")
        self.assertNotIn("atlas-voz.js", capa, "la voz exacta pesa en la puerta del juego")
        self.assertNotIn("atlas-voz", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"), "la voz entra en el precache")
        self.assertIn("s.src = '/assets/atlas-voz.js'", (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8"))

    def test_el_juego_abre_sin_red_y_la_ley_sin_red_es_no_data(self):
        """Los textos de las lenguas del juego son CONTENIDO para el SW (se guardan y abren sin red);
        `atlas-mundo.json` y `atlas-record.json` son MEDIDAS y siguen fuera: sin red, NO_DATA."""
        # Sin comentarios: el que explica por que las medidas quedan fuera las NOMBRA.
        listas = sin_comentarios((PUBLICO / "sw-listas.js").read_text(encoding="utf-8"))
        m = re.search(r"const ATLAS = \[([^\]]*)\]", listas)
        self.assertTrue(m, "sin la lista ATLAS del SW, el juego no abre sin red")
        dentro = re.findall(r"'(\w\w)'", m.group(1))
        for l in LENGUAS_JUEGO:
            with self.subTest(lengua=l):
                self.assertIn(l, dentro)
        self.assertIn("...ATLAS", listas)
        self.assertIn("'/atlas-opina-' + l + '.json'", listas, "los textos de opinar no abren sin red")
        for medida in ("atlas-mundo.json", "atlas-record.json"):
            self.assertNotIn(medida, listas, f"{medida} es una medida: fresca o no se sirve")

    def test_guardar_solo_al_pulsar_y_retomar_reproduce(self):
        """`atlas-guardado.js`: el unico sitio de la puerta con almacen; escribe por DOS caminos
        (Guardar, que tambien usa el autoguardado de la capa C1, y Olvidar); lo que retoma se vuelve a
        jugar y una partida tocada no vuelve a entrar. Desde el 2026-10-05 (plan firmado, C1) se guarda
        solo, pero NUNCA antes de haber leido lo guardado, y «Olvidar» apaga el autoguardado."""
        for nombre in CODIGO:
            if not nombre.endswith(".js") or nombre == "atlas-guardado.js":
                continue
            with self.subTest(pieza=nombre):
                self.assertNotIn("indexedDB", sin_comentarios((ASSETS / nombre).read_text(encoding="utf-8")))
        g = sin_comentarios((ASSETS / "atlas-guardado.js").read_text(encoding="utf-8"))
        self.assertEqual(g.count("'readwrite'"), 2, "se escribe desde algo que no es Guardar u Olvidar")
        self.assertIn("boton(T('guardar'), guarda)", g)
        self.assertIn("boton(T('olvidar'), olvida)", g)
        for pieza in ("if (callado === true && !auto) { return; }", "function olvida() {\n    auto = false;",
                      "document.addEventListener('visibilitychange'", "window.addEventListener('pagehide'"):
            with self.subTest(autoguardado=pieza):
                self.assertIn(pieza, g)
        lee = g.index("op('readonly', function (s) { return s.get(CLAVE); }).then(function (p) {\n      if (p && p.final && !retoma(")
        self.assertLess(lee, g.index("      auto = true;\n    }).catch"), "el autoguardado se enciende antes de leer lo guardado")
        for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage", "http://", "https://"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, g)
        js = r"""
const M = require('./public/assets/atlas-motor.js'), P = require('./public/assets/atlas-partida.js');
const f = require('fs'), o = JSON.parse(f.readFileSync('partidas/ejemplo-navegador-sin-cabeza.json', 'utf8'));
const p = o.partida || o, out = {};
out.ok = P.retoma(p, M).t === p.final.ciclo;
const t = JSON.parse(JSON.stringify(p)); t.final.ciclo += 1;
try { P.retoma(t, M); out.tocada = 'aceptada'; } catch (x) { out.tocada = x.message; }
const v = JSON.parse(JSON.stringify(p)); v.contenido_v = 'otra';
try { P.retoma(v, M); out.version = 'aceptada'; } catch (x) { out.version = x.message; }
process.stdout.write(JSON.stringify(out));
"""
        r = subprocess.run(["node", "-e", js], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        o = json.loads(r.stdout)
        self.assertTrue(o["ok"])
        self.assertEqual(o["tocada"], "final")
        self.assertTrue(o["version"].startswith("contenido_v otra"), o["version"])

    def test_la_coordenada_es_sha256_de_verdad(self):
        """`atlas-coord.js` escribe SHA-256 a mano: se compara con el de node en varios tamanos."""
        js = r"""
const H = require('./public/assets/atlas-coord.js'), c = require('crypto');
const ok = ['', 'abc', 'x'.repeat(55), 'y'.repeat(56), 'z'.repeat(64), 'p0x:1987:base:1,2'.repeat(9)]
  .every((s) => H.sha256(s) === c.createHash('sha256').update(s).digest('hex'));
process.stdout.write(JSON.stringify(ok));
"""
        r = subprocess.run(["node", "-e", js], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.stdout, "true", r.stderr)

    def test_opinar_firmado_se_carga_al_pulsar_y_su_contrato_es_cerrado(self):
        """`atlas-opina.js` (2026-09-28): fuera de la puerta del juego y del precache; solo pide su
        texto al propio origen; sus claves estan en cada lengua del juego; el contrato
        `atlas.opinion/1` acepta una opinion buena y rechaza la mala (ruta, correo, fuera del enum,
        campo de mas)."""
        capa = (ASSETS / "thegame.js").read_text(encoding="utf-8")
        self.assertNotIn("['atlas-opina.js']", capa, "opinar pesa en la puerta del juego")
        self.assertIn("s.src = '/assets/atlas-opina.js'", capa)
        self.assertNotIn("atlas-opina.js", sin_comentarios((PUBLICO / "sw-listas.js").read_text(encoding="utf-8")))
        cod = sin_comentarios((ASSETS / "atlas-opina.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", cod), ["'/atlas-opina-' + lang + '.json'"])
        for salida in ("http://", "https://", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage",
                       "indexedDB", "innerHTML"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, cod)
        usadas = set(re.findall(r"T\('(\w+)'\)", cod)) | {"sobre_sugerencia", "sobre_veredicto", "sobre_grieta",
                                                            "de_acuerdo", "en_desacuerdo", "no_se"}
        for l in LENGUAS_JUEGO:
            with self.subTest(lengua=l):
                d = json.loads((PUBLICO / f"atlas-opina-{l}.json").read_text(encoding="utf-8"))
                self.assertEqual(usadas - set(d), set(), f"atlas-opina-{l}.json sin claves")
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · sin jsonschema. Remedio: pip install jsonschema")
        esq = json.loads((DATOS / "atlas_opinion_schema.json").read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator.check_schema(esq)
        val = jsonschema.Draft202012Validator(esq)
        op = {"esquema": "atlas.opinion/1", "contenido_v": "2026-09-27.1", "sobre": "veredicto", "ciclo": 120,
              "estado_sha256": "a" * 64, "mostrado": "Structural tie", "eleccion": "de_acuerdo", "nota": "the pilot was right"}
        bueno = {"esquema": "atlas.opinion.firmada/1", "opinion": op, "firma": "ed25519:" + "b" * 128,
                 "algoritmo": "Ed25519", "pseudonimo": "Atlante-7F3A", "clave_publica": "c" * 64}
        self.assertEqual([e.message for e in val.iter_errors(bueno)], [])
        # Los ejemplos malos se construyen por partes: escritos enteros, la doctrina de test_web
        # (cero rutas, cero IPs, un solo CDN) los caza en ESTE fichero, que es lo que debe hacer.
        ruta, url, ip = "/" + "home/x", "https" + "://x", ".".join(["10", "0", "0", "1"])
        for nombre, malo in (("ruta", dict(op, nota="see " + ruta)), ("correo", dict(op, nota="me" + "@x.org")),
                             ("url", dict(op, nota=url)), ("ip", dict(op, nota="at " + ip)),
                             ("enum", dict(op, eleccion="quizas")), ("campo", dict(op, pc="mio"))):
            with self.subTest(malo=nombre):
                self.assertTrue(list(val.iter_errors(dict(bueno, opinion=malo))), f"el contrato acepta {nombre}")

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
        for l in LENGUAS_JUEGO:
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


# Modulos de `public/game/` que NINGUN guion pide todavia (ni la puerta ni el Army): el multijugador y
# la cria, firmados por el Soberano el 2026-09-28 («ve construyendo todo… enfocados al multiplayer»).
# Ver atlas/POST_VERIFICACION_MGNO_LAB.md y atlas/POST_VERIFICACION_SISIL_CRIA.md.
PUROS = ("canon.js", "sobres.js", "rating.js", "arena.js", "duelo.js", "mercado.js", "narragrafo.js", "cria.js", "genoma.js")
# La Arena (2026-09-28, «el mapa multi-jugador en una pestana»): se carga al abrir su pestana, detras del Army.
ARENA = ("sobres.js", "rating.js", "arena.js", "duelo.js", "fog_of_war.js", "world_camera.js", "mar.js", "nodos-pesos.js",
         "nodos-cedulas.js", "nodos.js", "cuenta.js", "ui-nodos.js", "ui-rack.js",
         "battle_choreography.js", "battle_replay.js", "ui-arena.js", "ui-duelo.js")
# La CASA (2026-10-05): la primera pantalla, detras del Army. Lleva canon y escena, que la Arena reutiliza.
CASA = ("canon.js", "escena.js", "wave_render.js", "gdpr-art25-ephemeral-crab.js", "home_base_scene.js", "home_buildings.js", "summon_reveal.js")
FUERA_DE_LA_PUERTA = tuple(sorted(set(PUROS + ARENA + CASA)))


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
    MODULOS = ("valores.js", "gacha.js", "db.js", "core.js", "ui.js", "juez.js")

    def _js(self, nombre):
        return sin_comentarios((self.JUEGO / nombre).read_text(encoding="utf-8"))

    def test_v15_cada_modulo_cabe_en_16_kb(self):
        """Instruccion 1 de la directiva: ningun modulo pasa de 16 KB."""
        presentes = sorted(q.name for q in self.JUEGO.glob("*.js"))
        self.assertEqual(presentes, sorted(self.MODULOS + FUERA_DE_LA_PUERTA),
                         "aparece un modulo de la v1.5 sin su firma (ver DIRECTIVA_V15_ESTADO.md)")
        for q in self.JUEGO.iterdir():
            with self.subTest(modulo=q.name):
                self.assertLessEqual(q.stat().st_size, TOPE_FICHERO, f"{q.name} pasa del bloque")

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

    def test_v15_los_valores_son_provisionales_y_solo_datos(self):
        """Los valores viven en `valores.js`, marcados PROVISIONALES y dichos en
        pantalla; la logica no lleva cifras de equilibrio."""
        import subprocess
        v = self._js("valores.js")
        for impuro in ("function", "=>", "fetch", "Math.", "Date"):
            with self.subTest(impuro=impuro):
                self.assertNotIn(impuro, v.split("var VALORES = ")[1].split("if (typeof module")[0])
        r = subprocess.run(["node", "-e", "process.stdout.write(JSON.stringify(require('./public/game/valores.js')))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=30)
        d = json.loads(r.stdout)
        self.assertEqual(d["estado"], "provisional")
        self.assertIn("T('provisional')", self._js("ui.js"), "la pantalla no dice que son valores provisionales")
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
        for l in LENGUAS_JUEGO:
            ui_l = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            with self.subTest(lengua=l):
                self.assertFalse(pedidas - set(ui_l), f"faltan en {l}: {sorted(pedidas - set(ui_l))}")


class Juez(unittest.TestCase):
    """El juez de theGame (public/game/juez.js): el mismo en la pestaña y en la Aduana del rack."""

    JS = r"""
      const M = require('./public/assets/atlas-motor.js'), Pa = require('./public/assets/atlas-partida.js');
      const Pi = require('./public/assets/atlas-piloto.js'), J = require('./public/game/juez.js');
      const ley = { nd: false, integridad_max: 117, dano: 1 };
      let e = M.inicial(ley);
      for (let i = 0; i < 400; i++) { e = M.ciclo(e, ley); }
      const rep = { accion: 'reparar' }, esp = { accion: 'esperar' }, rec = { accion: 'recoger' };
      const r1 = J.juzga(M, Pa, Pi, e, rep, esp, ley, 200), r2 = J.juzga(M, Pa, Pi, e, rep, esp, ley, 200);
      const nada = J.juzga(M, Pa, Pi, M.inicial(ley), rec, null, ley, 50);
      const igual = J.juzga(M, Pa, Pi, e, rep, rep, ley, 100);
      process.stdout.write(JSON.stringify({ r1, mismo: JSON.stringify(r1) === JSON.stringify(r2), nada, igual,
        abierta: e.abierta, cobre: e.cobre }));
    """

    def test_determinista_nulo_y_empate(self):
        import subprocess
        r = subprocess.run(["node", "-e", self.JS], cwd=RAIZ.parent, capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertTrue(d["mismo"], "el mismo juicio dos veces da dos veredictos")
        self.assertIn(d["r1"]["gana"], ("humano", "piloto", "empate"))
        self.assertEqual(d["r1"]["horizonte"], 200)
        self.assertTrue(d["nada"]["alucinacion"], "recoger sin nada pendiente no es una jugada")
        self.assertIsNone(d["nada"]["piloto"], "sin rama: null, nunca ceros de relleno")
        self.assertEqual(d["igual"]["gana"], "empate", "la misma jugada en las dos ramas empata")

    def test_no_sale_a_la_red_y_simula_con_el_motor_puro(self):
        j = (RAIZ.parent / "public" / "game" / "juez.js").read_text(encoding="utf-8")
        for red in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource"):
            with self.subTest(red=red):
                self.assertNotIn(red, j)
        self.assertIn("puro = Pa.puro", j, "en la pestaña el juez tiene que simular con el motor SIN grabadora")
        partida = (RAIZ.parent / "public" / "assets" / "atlas-partida.js").read_text(encoding="utf-8")
        self.assertIn("AtlasPartida.puro = graba(", partida)
        self.assertIn("'/game/juez.js'", (RAIZ.parent / "public" / "assets" / "thegame.js").read_text(encoding="utf-8"))

    def test_la_capa_habla_una_lengua_completa(self):
        """Cualquier portada abre el juego en una lengua COMPLETA, y la capa lo declara (lang y dir)."""
        t = (RAIZ.parent / "public" / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("en", LENGUAS_JUEGO)
        self.assertIn("capa.lang = lengua", t)
        self.assertIn("capa.dir =", t)

    def test_los_textos_del_juez_en_las_nueve_lenguas(self):
        for l in LENGUAS_JUEGO:
            ui = json.loads((RAIZ.parent / "public" / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            for k in ("juez_humano", "juez_piloto", "juez_empate", "juez_nulo"):
                with self.subTest(lengua=l, clave=k):
                    self.assertTrue(ui.get(k))
            if l != "es" and "es" in LENGUAS_JUEGO:
                self.assertNotEqual(ui["juez_humano"], json.loads((RAIZ.parent / "public" / "atlas-es.json")
                                    .read_text(encoding="utf-8"))["ui"]["juez_humano"], f"{l} lleva el texto en castellano")


# Regla de oro del Soberano (2026-09-27): la web publica es educacion, comunidad y soberania
# tecnica. Lo financiero/DePIN vive en el rack privado. En `public/`, `atlas/`, `data/` y
# `partidas/` no se nombra NEAR, mainnet, testnet, el Alquimista ni cuentas o unidades de cadena.
# `near` en minuscula es ingles corriente y no se mira; `NEAR` en mayusculas y las cuentas si.
CRIPTO = re.compile(r"\bNEAR\b|near_tx|hexelion\.near|\b[a-z0-9_-]+\.near\b|\byocto|(?i:mainnet|testnet|alquimista)")
TEXTO = (".html", ".js", ".mjs", ".json", ".css", ".md", ".py", ".txt", ".svg", ".xml", ".webmanifest")


def menciones_cripto(texto):
    return [m.group(0) for m in CRIPTO.finditer(texto)]


class SinCripto(unittest.TestCase):
    def test_la_web_publica_no_nombra_cripto(self):
        raiz = RAIZ.parent
        vistos, hallados = 0, []
        for carpeta in ("public", "atlas", "data", "partidas"):
            for f in sorted((raiz / carpeta).rglob("*")):
                if not f.is_file() or f.suffix not in TEXTO or f == Path(__file__).resolve():
                    continue
                vistos += 1
                for n, linea in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                    hallados += [f"{f.relative_to(raiz)}:{n}: {m}" for m in menciones_cripto(linea)]
        self.assertGreater(vistos, 100, "la guarda no ha mirado casi nada: falla cerrado")
        self.assertEqual(hallados, [], "\n".join(hallados[:20]))

    def test_la_guarda_caza_lo_que_debe(self):
        for sembrado in ("saldo en NEAR", "hexelion.near", "red: mainnet", "valores de Testnet",
                         "El Alquimista dice", "1e24 yoctoNEAR", "import near_tx"):
            with self.subTest(sembrado=sembrado):
                self.assertTrue(menciones_cripto(sembrado))
        self.assertEqual(menciones_cripto("the cave is near the core"), [])

class Opiniones(unittest.TestCase):
    """Enviar las opiniones firmadas (Soberano, 2026-09-28: «quiero enviar ya los feedback mios y de
    otros users»): lo envia la PERSONA con el menu de compartir del sistema, con un clic propio y
    sin servidor; quien lo recibe lo verifica con `atlas/verifica_opinion.mjs`."""

    def test_el_verificador_caza_lo_que_debe(self):
        r = subprocess.run(["node", str(RAIZ / "opinion_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 7)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_enviar_es_un_gesto_de_la_persona_y_no_una_red(self):
        """`navigator.share` solo dentro del clic de «Send»; ni fetch nuevo, ni direccion escrita,
        ni envio automatico al firmar."""
        cod = sin_comentarios((ASSETS / "atlas-opina.js").read_text(encoding="utf-8"))
        self.assertEqual(cod.count("navigator.share("), 1)
        clic = cod.index("b.addEventListener('click', function () {\n      navigator.share(")
        self.assertLess(cod.index("function ofreceEnvio"), clic)
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", cod), ["'/atlas-opina-' + lang + '.json'"])
        for fuga in ("mailto:", "http://", "https://", "sendBeacon", "XMLHttpRequest"):
            with self.subTest(fuga=fuga):
                self.assertNotIn(fuga, cod)
        d = json.loads((PUBLICO / "atlas-opina-en.json").read_text(encoding="utf-8"))
        for k in ("enviar", "enviado", "enviar_no", "enviar_nd"):
            with self.subTest(clave=k):
                self.assertTrue(d.get(k, "").strip())

    def test_el_workflow_verifica_cada_opinion(self):
        wf = (RAIZ.parent / ".github" / "workflows" / "opiniones.yml").read_text(encoding="utf-8")
        vivo = "\n".join(l for l in wf.splitlines() if not l.lstrip().startswith("#"))
        self.assertIn('node atlas/verifica_opinion.mjs "$f"', vivo)
        self.assertIn("contents: read", vivo)
        self.assertNotIn("pull_request_target", vivo)
        self.assertIn('[ "$fallos" -eq 0 ]', vivo)
        for f in sorted((RAIZ.parent / "opiniones").glob("*.json")):
            with self.subTest(opinion=f.name):
                r = subprocess.run(["node", str(RAIZ / "verifica_opinion.mjs"), str(f)], capture_output=True,
                                   text=True, timeout=60)
                self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("node atlas/tabla_opiniones.mjs --comprueba", vivo)

    def test_copiar_es_un_gesto_de_la_persona(self):
        """El portapapeles solo se escribe dentro del clic de «Copy», y una sola vez en el guion."""
        cod = sin_comentarios((ASSETS / "atlas-opina.js").read_text(encoding="utf-8"))
        self.assertEqual(cod.count("navigator.clipboard.writeText("), 1)
        self.assertIn("c.addEventListener('click', function () {\n        navigator.clipboard.writeText(", cod)
        d = json.loads((PUBLICO / "atlas-opina-en.json").read_text(encoding="utf-8"))
        for k in ("copiar", "copiado", "copiar_no", "enviar_copia"):
            with self.subTest(clave=k):
                self.assertTrue(d.get(k, "").strip())

    def test_la_tabla_esta_al_dia(self):
        r = subprocess.run(["node", str(RAIZ / "tabla_opiniones.mjs"), "--comprueba"], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_la_tabla_no_cuenta_ejemplos_ni_rechazos(self):
        """Una opinion de persona cuenta; la de ejemplo y la manipulada no, y la manipulada sale con su
        motivo. La celda escapa lo que abriria formato o HTML."""
        import tempfile
        buena = json.loads((RAIZ.parent / "opiniones" / "ejemplo-navegador-sin-cabeza.json").read_text(encoding="utf-8"))
        mala = json.loads(json.dumps(buena))
        mala["opinion"]["eleccion"] = "de_acuerdo"
        with tempfile.TemporaryDirectory() as d:
            for n, o in (("ejemplo-a.json", buena), ("b.json", buena), ("c.json", mala)):
                (Path(d) / n).write_text(json.dumps(o), encoding="utf-8")
            js = ("import { tabla } from " + json.dumps((RAIZ / "tabla_opiniones.mjs").as_uri()) +
                  "; process.stdout.write(JSON.stringify(tabla(process.argv[1])));")
            r = subprocess.run(["node", "--input-type=module", "-e", js, d], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        t = json.loads(r.stdout)
        self.assertEqual((t["entran"], t["ejemplos"], t["fuera"]), (1, 1, 1))
        self.assertIn("| **total** | 0 | 1 | 0 | 1 |", t["texto"])
        self.assertIn("- c.json: firma: no verifica", t["texto"])
        self.assertEqual([o["fichero"] for o in t["corpus"]], ["b.json"], "el corpus lleva ejemplos o rechazos")
        self.assertEqual(set(t["corpus"][0]), {"fichero", "pseudonimo", "clave_publica", "contenido_v", "sobre",
                                               "ciclo", "estado_sha256", "mostrado", "eleccion", "nota"})
        r = subprocess.run(["node", str(RAIZ / "tabla_opiniones.mjs"), "--json"], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout)["esquema"], "atlas.opiniones.corpus/1")


class Vigia(unittest.TestCase):
    """El vigia diario de `main` (sugerencia firmada por el Soberano, 2026-09-28): el umbral del peso
    lo da el motor, no una cifra copiada; avisa en el run diario y no bloquea ningun PR."""

    def corre(self, mundo=None):
        orden = ["node", str(RAIZ / "vigia.mjs")] + ([str(mundo)] if mundo else [])
        r = subprocess.run(orden, capture_output=True, text=True, timeout=60)
        return r.returncode, json.loads(r.stdout.splitlines()[0])

    def test_el_mundo_de_hoy_no_dana_de_mas(self):
        cod, v = self.corre()
        self.assertEqual(cod, 0, v)
        m = json.loads((PUBLICO / "atlas-mundo.json").read_text(encoding="utf-8"))
        self.assertEqual(v["gzip_juego_b"], m["gzip_juego_b"])
        self.assertEqual(v["margen_b"], v["umbral_b"] - 1 - m["gzip_juego_b"])

    def test_pasar_el_umbral_o_romper_el_arnes_sale_en_rojo(self):
        import tempfile
        _, v = self.corre()
        m = json.loads((PUBLICO / "atlas-mundo.json").read_text(encoding="utf-8"))
        casos = (("justo", {"gzip_juego_b": v["umbral_b"] - 1}, 0),
                 ("pesado", {"gzip_juego_b": v["umbral_b"]}, 1),
                 ("arnes", {"arnes_sw": "23/24"}, 1))
        with tempfile.TemporaryDirectory() as d:
            for nombre, cambio, esperado in casos:
                with self.subTest(caso=nombre):
                    f = Path(d) / (nombre + ".json")
                    f.write_text(json.dumps(dict(m, **cambio)), encoding="utf-8")
                    cod, r = self.corre(f)
                    self.assertEqual(cod, esperado, r)

    def test_el_vigia_corre_cada_dia_y_no_en_los_pr(self):
        wf = (RAIZ.parent / ".github" / "workflows" / "vigia.yml").read_text(encoding="utf-8")
        vivo = "\n".join(l for l in wf.splitlines() if not l.lstrip().startswith("#"))
        self.assertRegex(vivo, r'schedule:\s*\n\s*- cron: "[0-9]+ [0-9]+ \* \* \*"')
        self.assertNotIn("pull_request", vivo)
        self.assertIn("contents: read", vivo)
        for orden in ("python test_web.py", "python atlas/test_atlas.py", "node atlas/vigia.mjs"):
            with self.subTest(orden=orden):
                self.assertIn(orden, vivo)



class Pestanas(unittest.TestCase):
    """La capa en CUATRO pestanas grandes (Soberano, 2026-10-04: «pestanas faciles y limpias», «NO hacer
    paginas largas», «un nino debe poder jugarlo»): Map, Battle, My node y Help. Lo que antes eran las
    pestanas Crafts y Army, y la expedicion del Bosque, son PLIEGOS dentro de My node (uno abierto a
    la vez). Sigue en pie lo de 2026-09-28: «los JSON son textos que asustan: ocultarlos siempre»."""

    CAPA = ASSETS / "thegame.js"
    HOJA = ASSETS / "thegame.css"
    IDS = ("casa", "mapa", "arena", "partida")
    PLIEGOS = ()
    ARMY = ("valores.js", "gacha.js", "db.js", "core.js", "ui.js")

    def _capa(self):
        return sin_comentarios(self.CAPA.read_text(encoding="utf-8"))

    def test_cuatro_pestanas_accesibles_que_mueven_y_no_rehacen(self):
        c = self._capa()
        ids = re.findall(r"\['(\w+)', '\\u[0-9A-F]{4}", c)
        self.assertEqual(tuple(ids), self.IDS)
        for pieza in ("setAttribute('role', 'tablist')", "setAttribute('role', 'tab')",
                      "setAttribute('role', 'tabpanel')", "'aria-selected'", "'aria-controls'",
                      "piso.appendChild(d)", "ArrowRight", "ArrowLeft", "ordena();"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, c)
        self.assertNotIn("innerHTML", c)
        lista = c[c.index("var PESTANAS"):c.index("var TECNICO")]
        for freno in ("thegame-piloto", "thegame-sugerencia", "thegame-juez", "thegame-cerrar"):
            with self.subTest(freno=freno):
                self.assertNotIn(freno, lista, "el piloto y su freno salen del cabecero")
        for l in LENGUAS_JUEGO:
            ui = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            for k in ["pes_" + i for i in self.IDS] + list(self.PLIEGOS) + ["pes_aria", "tecnico", "army_carga"] + \
                     [f"ayuda_{i}" for i in range(1, 8)]:
                with self.subTest(lengua=l, clave=k):
                    self.assertTrue(ui.get(k, "").strip())

    def test_lo_tecnico_va_siempre_plegado(self):
        c = self._capa()
        tecnico = c[c.index("var TECNICO"):c.index("var PANEL")]
        for sel in (".atlas-carta-json", ".atlas-nucleo > .atlas-medido", ".atlas-incubadora > .atlas-medido",
                    ".atlas-incubadora > .atlas-casa", ".atlas-nucleo > .atlas-nota"):
            with self.subTest(selector=sel):
                self.assertIn(sel, tecnico)
        self.assertIn("el('details', 'thegame-tecnico')", c)
        self.assertNotIn(".open = true", c, "lo tecnico se abre a proposito, nunca solo")
        self.assertNotIn("setAttribute('open'", c)

    def test_el_army_se_carga_con_su_pestana_y_no_pesa_en_la_puerta(self):
        c = self._capa()
        guiones = c[c.index("var GUIONES"):c.index("var ARMY")]
        army = c[c.index("var ARMY"):c.index("var ARENA")]
        for m in self.ARMY:
            with self.subTest(modulo=m):
                self.assertNotIn(m, guiones, f"{m} vuelve a la puerta")
                self.assertIn(f"['/game/{m}']", army)
        self.assertIn("['/game/juez.js']", guiones, "el juez escucha desde el primer ciclo")
        # Sin pestana Army (2026-10-05): el Army se pide con la CASA, la pestana de entrada, y vive en su
        # edificio (`.casa-army`, que reparte home_buildings.js). Su peso sigue fuera de la puerta.
        self.assertIn("if (id === 'casa') { cargaCasa(); }", c)
        self.assertIn("casa = cargaArmy().then(function () { return pide(CASA); })", c)
        self.assertIn("ARMYZ = el('div', 'casa-army'); PANEL.casa.appendChild(ARMYZ);", c)
        self.assertIn("army: '.casa-army'", (PUBLICO / "game" / "home_buildings.js").read_text(encoding="utf-8"))
        self.assertIn("army: cargaArmy", c)
        sys.path.insert(0, str(RAIZ))
        import mundo
        for m in self.ARMY:
            self.assertNotIn(f"../game/{m}", mundo.PIEZAS)
        for q in ("../game/juez.js", "thegame.css"):
            self.assertIn(q, mundo.PIEZAS, f"{q} baja al abrir y no se cuenta")
        g = sin_comentarios((ASSETS / "atlas-guardado.js").read_text(encoding="utf-8"))
        self.assertLess(g.index("TG.army()"), g.index("A.verificaWeb("),
                        "la firma importada se mira antes de tener su verificador")

    def test_la_hoja_de_la_capa(self):
        css = self.HOJA.read_text(encoding="utf-8")
        self.assertLessEqual(len(css.encode("utf-8")), TOPE_FICHERO)
        self.assertIn("'thegame.css'", self._capa())
        vivo = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        self.assertEqual(re.findall(r"#[0-9a-fA-F]{3,8}\b", vivo), [], "un color fuera de los tokens")
        for regla in (".thegame-panel[hidden]{display:none}", "env(safe-area-inset-bottom)",
                      "@media (min-width:48rem)", ".thegame-piloto{display:contents}"):
            with self.subTest(regla=regla):
                self.assertIn(regla, vivo)
        for prohibido in ("gradient", "blur(", "@keyframes"):
            with self.subTest(prohibido=prohibido):
                self.assertNotIn(prohibido, vivo)
        listas = (PUBLICO / "sw.js").read_text(encoding="utf-8") + (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        self.assertNotIn("thegame.css", listas, "la hoja de la capa entra en el precache")
        for h in PUBLICO.rglob("*.html"):
            self.assertNotIn("thegame.css", h.read_text(encoding="utf-8"))



class Multijugador(unittest.TestCase):
    """La rebanada pura del multijugador (auditoria MGNO): sobres firmados, commit-reveal, duelo fantasma,
    rating entero, mercado A2A y narragrafo. Todo en node, determinista, sin red ni reloj."""

    def _node(self, *args):
        r = subprocess.run(["node", str(RAIZ / "mp_casos.mjs"), *args], capture_output=True, text=True, timeout=180)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_los_casos_del_multijugador(self):
        casos = self._node()
        self.assertGreaterEqual(len(casos), 48, "faltan casos del multijugador")
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_lo_que_sale_del_js_cumple_su_contrato(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        m = self._node("--muestras")
        for clave, fichero in (("sobre", "atlas_sobre_schema.json"), ("mp_sesion", "atlas_mp_sesion_schema.json"),
                               ("defensa", "atlas_defensa_schema.json"), ("asalto", "atlas_asalto_schema.json"),
                               ("resultado", "atlas_duelo_resultado_schema.json"), ("oferta", "atlas_oferta_schema.json"),
                               ("asiento", "atlas_asiento_schema.json"), ("mgno_nodo", "atlas_mgno_nodo_schema.json"),
                               ("mgno_operacion", "atlas_mgno_operacion_schema.json")):
            with self.subTest(contrato=fichero):
                v = jsonschema.Draft202012Validator(json.loads((DATOS / fichero).read_text(encoding="utf-8")))
                self.assertEqual([e.message for e in v.iter_errors(m[clave])], [])

    def test_cada_contrato_caza_sus_seis_violaciones(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        m = self._node("--muestras")
        def con(base, **cambios):
            d = json.loads(json.dumps(base)); d.update(cambios); return d
        def sin(base, clave):
            d = json.loads(json.dumps(base)); d.pop(clave); return d
        h = "a" * 64
        contra = {"esquema": "atlas.contraoferta/1", "oferta": h, "da": {"luz": 1}, "pide": {"cobre": 2},
                  "expira_ciclo": 10, "nonce": "2" * 32, "procedencia": "humano"}
        acepta = {"esquema": "atlas.aceptacion_oferta/1", "oferta": h, "ciclo": 5}
        tropa = m["defensa"]["tropas"][0]
        casos = {
            "atlas_sobre_schema.json": (m["sobre"], [
                con(m["sobre"], extra=1), con(m["sobre"], tipo="firmar_por_ti"), con(m["sobre"], seq=2),
                con(m["sobre"], pseudonimo="ana@correo"), con(m["sobre"], firma="ed25519:abc"),
                con(m["sobre"], cuerpo={"esquema": "atlas.oferta/1"})]),
            "atlas_mp_sesion_schema.json": (m["mp_sesion"], [
                con(m["mp_sesion"], modo="mesh"), con(m["mp_sesion"], semilla="firma"), con(m["mp_sesion"], max_bytes=99999),
                con(m["mp_sesion"], pares=[h, h]), con(m["mp_sesion"], nonce="xyz"), con(m["mp_sesion"], servidor="relevo")]),
            "atlas_defensa_schema.json": (m["defensa"], [
                con(m["defensa"], tropas=[dict(tropa, stats={"vida": 9999})]), con(m["defensa"], tropas=[]),
                con(m["defensa"], tropas=[tropa] * 7), con(m["defensa"], tropas=[dict(tropa, tc="tc9")]),
                con(m["defensa"], en_juego={"cobre": -1, "luz": 0}), con(m["defensa"], pack_sha="x")]),
            "atlas_asalto_schema.json": (m["asalto"], [
                con(m["asalto"], defensa="x"), con(m["asalto"], tropas=[]), con(m["asalto"], stats={}),
                con(m["asalto"], tropas=[dict(tropa, semilla="zz")]), sin(m["asalto"], "pack_sha"),
                con(m["asalto"], esquema="atlas.defensa/1")]),
            "atlas_duelo_resultado_schema.json": (m["resultado"], [
                con(m["resultado"], gana="yo"), con(m["resultado"], procedencia="inventada"), con(m["resultado"], rondas=0),
                con(m["resultado"], semilla="x"), con(m["resultado"], hora="12:00"),
                con(m["resultado"], en_juego={"cobre": 1, "luz": 0, "eur": 5})]),
            "atlas_oferta_schema.json": (m["oferta"], [
                con(m["oferta"], da={"eur": 5}), con(m["oferta"], da={"cobre": 1.5}), con(m["oferta"], da={}),
                con(m["oferta"], expira_ciclo=-1), con(m["oferta"], procedencia="bot"), con(m["oferta"], wallet="x")]),
            "atlas_contraoferta_schema.json": (contra, [
                con(contra, oferta="x"), sin(contra, "oferta"), con(contra, da={"usd": 1}), con(contra, nonce="12"),
                con(contra, precio_real=3), con(contra, procedencia="agente")]),
            "atlas_aceptacion_oferta_schema.json": (acepta, [
                con(acepta, ciclo=-1), con(acepta, ciclo=1.5), con(acepta, oferta="x"), con(acepta, firma_auto=True),
                sin(acepta, "ciclo"), con(acepta, esquema="atlas.oferta/1")]),
            "atlas_asiento_schema.json": (m["asiento"], [
                con(m["asiento"], n=0), con(m["asiento"], prev="x"), con(m["asiento"], da={"eur": 1}),
                con(m["asiento"], aplicado=True), sin(m["asiento"], "aceptacion"), con(m["asiento"], ciclo=-2)]),
            "atlas_mgno_nodo_schema.json": (m["mgno_nodo"], [
                con(m["mgno_nodo"], texto="<script>x</script>"), con(m["mgno_nodo"], texto="see https:" + "//x"),
                con(m["mgno_nodo"], texto=""), con(m["mgno_nodo"], afinidad=[1] * 7),
                con(m["mgno_nodo"], afinidad=[256] + [0] * 7), con(m["mgno_nodo"], etiquetas=["Mayus"])]),
            "atlas_mgno_operacion_schema.json": (m["mgno_operacion"], [
                con(m["mgno_operacion"], op="ejecuta"), con(m["mgno_operacion"], arco=dict(m["mgno_operacion"]["arco"], peso=0)),
                {"esquema": "atlas.mgno_operacion/1", "op": "voto", "voto": {"de": h, "a": "b" * 64, "delta": 2}},
                {"esquema": "atlas.mgno_operacion/1", "op": "poda", "poda": "x"},
                {"esquema": "atlas.mgno_operacion/1", "op": "nodo", "nodo": con(m["mgno_nodo"], texto="{{prompt}}")},
                con(m["mgno_operacion"], codigo="1")]),
        }
        relajado = jsonschema.Draft202012Validator({"type": "object"})
        for nombre, (bueno, malos) in casos.items():
            esquema = json.loads((DATOS / nombre).read_text(encoding="utf-8"))
            jsonschema.Draft202012Validator.check_schema(esquema)
            v = jsonschema.Draft202012Validator(esquema)
            with self.subTest(contrato=nombre, caso="bueno"):
                self.assertEqual([e.message for e in v.iter_errors(bueno)], [])
            self.assertEqual(len(malos), 6)
            for i, malo in enumerate(malos):
                with self.subTest(contrato=nombre, violacion=i):
                    self.assertFalse(v.is_valid(malo), f"{nombre} deja pasar la violacion {i}")
                    self.assertTrue(relajado.is_valid(malo))
            self.assertIn("additionalProperties", json.dumps(esquema))

    def test_a_demanda_bajo_16_kb_y_fuera_de_la_puerta(self):
        capa = (ASSETS / "thegame.js").read_text(encoding="utf-8")
        listas = (PUBLICO / "sw.js").read_text(encoding="utf-8") + (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        sys.path.insert(0, str(RAIZ))
        import mundo
        puerta = capa[capa.index("var GUIONES"):capa.index("var ARMY")]
        for m in FUERA_DE_LA_PUERTA:
            f = PUBLICO / "game" / m
            with self.subTest(modulo=m):
                self.assertLess(f.stat().st_size, TOPE_FICHERO, f"{m} pasa del bloque")
                self.assertNotIn(m, puerta, f"{m} entra en la puerta del juego")
                self.assertNotIn("/game/" + m, listas, f"{m} entra en el precache")
                self.assertNotIn("../game/" + m, mundo.PIEZAS)
                for h in PUBLICO.rglob("*.html"):
                    self.assertNotIn("game/" + m, h.read_text(encoding="utf-8"))



class Cria(unittest.TestCase):
    """La cria soberana y el genoma de SISIL (auditoria SISIL_CRIA): validar, nunca calibrar ni adoptar solo.
    Las odds se ven y son las que se tiran."""

    def _node(self, codigo):
        r = subprocess.run(["node", "-e", codigo], capture_output=True, text=True, timeout=120, cwd=str(RAIZ.parent))
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_los_casos_de_la_cria(self):
        r = subprocess.run(["node", str(RAIZ / "cria_casos.mjs")], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 12)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_contratos_de_la_cria_y_del_genoma(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        base = self._node("process.stdout.write(JSON.stringify(require('./public/game/cria.js').desdeValores()))")
        lim = self._node("process.stdout.write(JSON.stringify(require('./public/game/genoma.js').LIMITES))")
        def con(b, **c):
            d = json.loads(json.dumps(b)); d.update(c); return d
        gen = {"esquema": "atlas.genoma/1", "base": "a" * 64, "procedencia": "sintetico",
               "dominios": {"incubacion": {"ciclos_min_tc1": 15, "ciclos_max_tc1": 25}, "rareza": {"unico_tc4": 60}}}
        rar = json.loads(json.dumps(base["rareza"])); rar["tc1"] = [700.5, 250, 40, 5]
        casos = {
            "atlas_cria_calibracion_schema.json": (base, [
                con(base, auto_invoke=True), con(base, rareza=rar),
                con(base, rareza={k: v for k, v in base["rareza"].items() if k != "tc3"}),
                con(base, incubacion=dict(base["incubacion"], tc1=[0, 20])), con(base, version="https:" + "//x"),
                con(base, afijos={"max": base["afijos"]["max"], "exclusiones": [["atlante", "inventado"]]})]),
            "atlas_genoma_schema.json": (gen, [
                con(gen, dominios={"invocation_permission": {"x": 1}}), con(gen, dominios={"rareza": {"auto_invoke": 1}}),
                con(gen, dominios={"rareza": {"unico_tc4": 20000}}), con(gen, dominios={"combate": {"k": 32.5}}),
                con(gen, procedencia="silicio_firma"), con(gen, dominios={})]),
        }
        relajado = jsonschema.Draft202012Validator({"type": "object"})
        for nombre, (bueno, malos) in casos.items():
            esquema = json.loads((DATOS / nombre).read_text(encoding="utf-8"))
            jsonschema.Draft202012Validator.check_schema(esquema)
            v = jsonschema.Draft202012Validator(esquema)
            with self.subTest(contrato=nombre, caso="bueno"):
                self.assertEqual([e.message for e in v.iter_errors(bueno)], [])
            for i, malo in enumerate(malos):
                with self.subTest(contrato=nombre, violacion=i):
                    self.assertFalse(v.is_valid(malo), f"{nombre} deja pasar la violacion {i}")
                    self.assertTrue(relajado.is_valid(malo))
        # El contrato del genoma es espejo EXACTO de `genoma.js › LIMITES`: no pueden divergir.
        dom = json.loads((DATOS / "atlas_genoma_schema.json").read_text(encoding="utf-8"))["properties"]["dominios"]["properties"]
        self.assertEqual(sorted(dom), sorted(lim))
        for d, ps in lim.items():
            for k, b in ps.items():
                with self.subTest(parametro=d + "." + k):
                    self.assertEqual([dom[d]["properties"][k]["minimum"], dom[d]["properties"][k]["maximum"]], b)

    def test_las_odds_se_ven_y_son_las_que_se_tiran(self):
        ui = sin_comentarios((PUBLICO / "game" / "ui.js").read_text(encoding="utf-8"))
        gacha = sin_comentarios((PUBLICO / "game" / "gacha.js").read_text(encoding="utf-8"))
        self.assertIn("G.odds(tc)", ui)
        self.assertIn("T('odds_h')", ui)
        self.assertIn("return [1000 - c[0] - c[1] - c[2], c[2], c[1], c[0]];", gacha)
        for l in LENGUAS_JUEGO:
            ui_t = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            self.assertTrue(ui_t.get("odds_h", "").strip(), f"{l} sin el rotulo de las odds")



class Arena(unittest.TestCase):
    """La Arena: el mar multijugador, los lugares NPC, el combate en vivo con las tropas de onda y los duelos
    entre personas por paquetes firmados, con la regla de abandono (Soberano, 2026-09-28)."""

    def _js(self, nombre):
        return sin_comentarios((PUBLICO / "game" / nombre).read_text(encoding="utf-8"))

    def test_los_casos_del_duelo(self):
        r = subprocess.run(["node", str(RAIZ / "duelo_casos.mjs")], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stderr)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 8)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_contratos_del_paquete_y_del_abandono(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        r = subprocess.run(["node", str(RAIZ / "duelo_casos.mjs"), "--muestras"], capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr)
        m = json.loads(r.stdout)
        v = jsonschema.Draft202012Validator(json.loads((DATOS / "atlas_paquete_mp_schema.json").read_text(encoding="utf-8")))
        def con(b, **c):
            d = json.loads(json.dumps(b)); d.update(c); return d
        d, x = m["paquete_defensa"], m["paquete_desafio"]
        for bueno in (d, x):
            self.assertEqual([e.message for e in v.iter_errors(bueno)], [])
        sobre_roto = json.loads(json.dumps(d)); sobre_roto["sobres"][0]["firma"] = "ed25519:abc"
        malos = [con(d, tipo="saqueo"), con(d, sobres=[]), con(d, defensa=x["defensa"]), con(x, defensa=None),
                 sobre_roto, con(d, servidor="relevo")]
        for i, malo in enumerate(malos):
            with self.subTest(violacion=i):
                self.assertFalse(v.is_valid(malo))
        res = jsonschema.Draft202012Validator(json.loads((DATOS / "atlas_duelo_resultado_schema.json").read_text(encoding="utf-8")))
        base = {"esquema": "atlas.duelo_resultado/1", "defensa": "a" * 64, "asalto": "b" * 64, "defensor": "c" * 64,
                "atacante": "d" * 64, "semilla": "e" * 64, "registro_sha": "f" * 64, "gana": "defensa", "rondas": 0,
                "procedencia": "humano", "en_juego": {"cobre": 0, "luz": 0}, "final": "abandono"}
        self.assertTrue(res.is_valid(base), "el abandono (rondas 0) es un resultado valido")
        self.assertFalse(res.is_valid(con(base, final="combate")), "un combate sin rondas")
        self.assertFalse(res.is_valid(con(base, rondas=3)), "un abandono con rondas")
        self.assertFalse(res.is_valid(con(base, final="rendicion")))

    def test_la_arena_se_carga_con_su_pestana(self):
        capa = (ASSETS / "thegame.js").read_text(encoding="utf-8")
        lista = capa[capa.index("var ARENA"):capa.index("function el(")]
        for m in ARENA:
            with self.subTest(modulo=m):
                self.assertIn(f"['/game/{m}']", lista)
        self.assertIn("if (id === 'arena') { cargaArena(); }", capa)
        self.assertIn("arena = cargaCasa().then(function () { return pide(ARENA); })", capa, "la Arena sin su Army ni su casa")
        casa = capa[capa.index("var CASA"):capa.index("var TECNICO")]
        for m in CASA:
            with self.subTest(casa=m):
                self.assertIn(f"['/game/{m}']", casa)

    def test_los_textos_de_la_arena_existen_y_van_aparte(self):
        ar = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        juego = json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertLess((PUBLICO / "atlas-arena-en.json").stat().st_size, TOPE_FICHERO)
        for f in ("ui-arena.js", "ui-duelo.js", "mar.js"):
            for k in set(re.findall(r"T\('(\w+)'\)", self._js(f))):
                with self.subTest(fichero=f, clave=k):
                    self.assertTrue((ar.get(k) or juego.get(k) or "").strip(), f"{k} sin texto")
        for k in ("pes_arena", "arena_carga"):
            self.assertTrue(juego.get(k, "").strip())
        for l in LENGUAS_JUEGO:
            self.assertTrue((PUBLICO / f"atlas-arena-{l}.json").is_file(), f"la Arena sin textos en {l}")

    def test_la_arena_no_sale_a_la_red_ni_usa_el_azar_del_sistema(self):
        for f in ("escena.js", "mar.js", "ui-arena.js", "ui-duelo.js", "duelo.js", "rating.js"):
            c = self._js(f)
            for malo in ("Math.random", "localStorage", "indexedDB", "innerHTML", "sendBeacon", "WebSocket",
                         "RTCPeerConnection", "http://", "https://", "XMLHttpRequest", "Date."):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
            fetches = re.findall(r"fetch\(([^)]*)\)", c)
            self.assertEqual(fetches, ["'/atlas-arena-' + l + '.json'"] if f == "ui-arena.js" else [], f)
        self.assertIn("window.crypto.getRandomValues(b)", self._js("ui-duelo.js"), "el r del commit-reveal sin azar real")
        self.assertIn("I.firmarTexto(t)", self._js("ui-duelo.js"))
        self.assertIn("window.AtlasArmy.verificaWeb", self._js("ui-duelo.js"))


class Conquista(unittest.TestCase):
    """Conquista (FIRMO del Soberano, 2026-10-10): ganar a un lugar NPC lo deja CONQUISTADO en este aparato.
    Se guarda por db.js (la unica puerta de almacenamiento), se ve en la lista y en el mapa con su sello
    LOCAL · practica, y NO da rating, ni botin, ni entra en el combate."""

    def _js(self, nombre):
        return sin_comentarios((PUBLICO / "game" / nombre).read_text(encoding="utf-8"))

    def test_se_guarda_por_la_puerta_de_db(self):
        db, ui = self._js("db.js"), self._js("ui-arena.js")
        self.assertIn("conquistasWeb", db)
        self.assertIn("'atlas-conquista'", db)
        self.assertIn("conquistasWeb(record, lugares, pintaLista)", ui)
        alfin = ui[ui.index("alFin: function (x)"):ui.index("function sonido(")]
        self.assertIn("if (CQ) { CQ.pon(record); }", alfin, "la conquista se guarda tras cada combate NPC")
        for malo in ("indexedDB", "localStorage", "sessionStorage"):
            with self.subTest(malo=malo):
                self.assertNotIn(malo, ui)

    def test_no_entra_en_el_combate(self):
        ui = self._js("ui-arena.js")
        self.assertIn("var semilla = K.sha(['atlas.pve/1', l.id, K.huella(sq), n].join(':'));", ui)
        self.assertIn("var c = A.combate(l.defensa.tropas, sq, semilla);", ui)
        self.assertNotIn("conquist", self._js("arena.js"))
        self.assertNotIn("conquist", self._js("rating.js"))

    def test_lo_guardado_no_se_cree(self):
        """Lo que vuelve del almacen se limpia: solo lugares NPC conocidos y cuentas enteras >= 0."""
        js = ("const D=require('./public/game/db.js');"
              "const l=D.limpiaRecord({a:{g:2,p:1},b:{g:-1,p:0},c:{g:1.5,p:0},x:{g:9,p:9},d:'mal',e:{g:1}},['a','b','c','d','e']);"
              "const n=D.limpiaRecord(null,['a']);const m=D.limpiaRecord([1,2],['a']);"
              "process.stdout.write(JSON.stringify({l,n,m}))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual(d["l"], {"a": {"g": 2, "p": 1}})
        self.assertEqual((d["n"], d["m"]), ({}, {}))

    def test_se_ve_con_su_sello(self):
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))
        texto = json.dumps(tx)
        self.assertIn("arena_conquistado", texto)
        self.assertRegex(texto, r"arena_conquistado[^}]*LOCAL")
        self.assertIn("T('arena_conquistado')", self._js("ui-arena.js"))
        self.assertIn("arena_conquistado", self._js("mar.js"))


class CombateLimpio(unittest.TestCase):
    """2026-10-10 (Soberano, captura del Doogee): el combate se ve entero y su calidad la manda el jugador.
    El automatico solo baja tras medir fps, lo dice en pantalla y volver a Maxima es un toque."""

    def test_la_eleccion_del_jugador_manda_y_la_bajada_se_dice(self):
        rp = sin_comentarios((PUBLICO / "game" / "battle_replay.js").read_text(encoding="utf-8"))
        self.assertIn("m === 'luz' ? 0 : m && m !== 'auto' ? 1 : med.nivel(", rp)
        self.assertIn("R.ahorro.hidden = cal !== 0;", rp)
        self.assertIn("dibuja(t, 0, 0, W, H, cal);", rp)
        self.assertIn("C.pon('maxima')", rp)
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertIn("same result", tx["rp_ahorro"])

    def test_el_medidor_no_baja_sin_medir(self):
        """Con menos de 60 cuadros medidos el medidor no degrada: si no puede medir, no toca."""
        import subprocess
        js = ("const vm=require('vm'),fs=require('fs');const c={AtlasValores:require('./public/game/valores.js'),"
              "AtlasGacha:require('./public/game/gacha.js'),Math};vm.runInNewContext(fs.readFileSync('./public/game/wave_render.js','utf-8'),c);"
              "const m=c.AtlasOnda.medidor();let t=0;for(let i=0;i<30;i++){m.cuadro(t);t+=100;}"
              "const pocos=m.nivel(2);for(let i=0;i<80;i++){m.cuadro(t);t+=100;}process.stdout.write(JSON.stringify([pocos,m.nivel(2)]))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(json.loads(r.stdout), [2, 0], "a 10 fps: sin medir no baja; medido, baja")


class CasaGranja(unittest.TestCase):
    """La primera pantalla es TU CASA (Soberano, 2026-10-05): una ciudad sumergida en corte con cinco
    edificios que son botones del DOM, cada uno con su cifra MEDIDA o NO_DATA en niebla; personalizar
    (paleta, estilo, emblema, postura) se guarda en el aparato, sin datos personales, y no da ventaja;
    la invocacion se revela armonico a armonico. Las ondas se trazan fieles a sus armonicos."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))

    def test_casos_del_cangrejo(self):
        """J1 (plan de ronda 2026-10-11): misma semilla, mismo paseo (huella fijada); tamano y clase son dato."""
        r = subprocess.run(["node", str(RAIZ / "gdpr-art25-ephemeral-crab_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 10, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_casos_de_la_casa(self):
        r = subprocess.run(["node", str(RAIZ / "casa_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 6, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_la_casa_no_sale_a_la_red_ni_usa_el_azar(self):
        for f in CASA:
            c = self._js(f)
            for malo in ("Math.random", "localStorage", "innerHTML", "sendBeacon", "XMLHttpRequest", "http://", "https://", "Date."):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
            fetches = re.findall(r"fetch\(([^)]*)\)", c)
            self.assertEqual(fetches, ["'/atlas-casa-' + l + '.json'"] if f == "home_buildings.js" else [], f)

    def test_los_edificios_son_botones_con_su_medida_o_no_data(self):
        b = self._js("home_buildings.js")
        self.assertIn("var b = boton('', 'casa-edificio')", b, "un edificio que no es un boton")
        self.assertIn("b.setAttribute('aria-label', T('ed_' + e[0])", b)
        self.assertIn("m ? m.txt : 'NO_DATA'", b, "lo no medido se inventa un numero")
        self.assertIn("J.instantanea()", b, "la cifra no sale del estado del juego")
        e = self._js("home_base_scene.js")
        self.assertIn("if (!e || !e.medido) { enNiebla(", e, "lo no medido no va en niebla")
        self.assertIn("prefers-reduced-motion: reduce", e)
        self.assertIn("med.nivel(2)", e, "la calidad no baja sola cuando caen los fps")
        tx = json.loads((PUBLICO / "atlas-casa-en.json").read_text(encoding="utf-8"))["ui"]
        for k in re.findall(r"T\('(\w+)'\)", b):
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), f"{k} sin texto")
        for i in ("faro", "army", "taller", "bosque", "arena"):
            self.assertTrue(tx.get("ed_" + i) and tx.get("nd_" + i), i)

    def test_la_onda_se_traza_fiel_y_la_invocacion_se_revela(self):
        o = self._js("wave_render.js")
        self.assertIn("G.punto(arm, i / n * TAU)", o, "la figura no sale de los armonicos de la gacha")
        self.assertIn("globalCompositeOperation = 'lighter'", o)
        self.assertIn("var peso = Math.max(0, Math.min(1, c * n - j))", o, "no nace armonico a armonico")
        self.assertIn("if (window.AtlasRevela) { window.AtlasRevela.muestra(t); }", self._js("ui.js"))
        self.assertIn("prefers-reduced-motion: reduce", self._js("summon_reveal.js"))


class MapaMovible(unittest.TestCase):
    """El mapa global se arrastra hasta chocar con la niebla (Soberano, 2026-10-05): empieza en tu casa,
    se mueve con el dedo, el raton, las flechas y botones grandes; la niebla sale de lo MEDIDO y es el
    limite fisico de la camara. Terreno por teselas, sin azar ni red."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))

    def test_casos_de_la_camara_y_la_niebla(self):
        r = subprocess.run(["node", str(RAIZ / "camara_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 7, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_se_mueve_con_dedo_teclado_y_botones_y_dice_el_choque(self):
        m = self._js("mar.js")
        for pieza in ("addEventListener('pointerdown'", "setPointerCapture", "addEventListener('keydown'", "ArrowLeft",
                      "x.setAttribute('aria-label', f.texto(b[0]))", "aviso.setAttribute('role', 'status')",
                      "f.texto('mapa_niebla')", "f.texto(casa ? 'mapa_en_casa' : 'mapa_sin_casa')", "C.arrastra(cam,", "quieto()"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, m)
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        for k in re.findall(r"\['(mapa_\w+)', '", m) + ["mapa_niebla", "mapa_en_casa", "mapa_sin_casa", "mapa_medido"]:
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), k)
        self.assertIn("Fog", tx["mapa_niebla"])

    def test_sin_azar_ni_red_y_por_teselas(self):
        for f in ("fog_of_war.js", "world_camera.js", "mar.js"):
            c = self._js(f)
            for malo in ("Math.random", "localStorage", "fetch(", "Date."):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
        self.assertIn("function tesela(i, j)", self._js("mar.js"))
        self.assertIn("if (nt > 90)", self._js("mar.js"), "la cache de teselas no esta acotada")


class BatallaRTS(unittest.TestCase):
    """La batalla se repite como una partida de estrategia (Soberano, 2026-10-05: «unidades en movimiento
    por el mapa… no solo el combate por turnos»). Es una COREOGRAFIA del registro de `arena.combate`:
    sembrada con la semilla de la partida, determinista, y nunca ensena ganar a quien pierde. Las
    formaciones cambian la coreografia, nunca el registro."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))

    def test_casos_de_la_repeticion(self):
        r = subprocess.run(["node", str(RAIZ / "replay_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 12, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_sin_azar_ni_reloj_ni_red(self):
        for f in ("battle_choreography.js", "battle_replay.js"):
            c = self._js(f)
            for malo in ("Math.random", "Date.", "performance.now", "fetch(", "localStorage", "innerHTML"):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
        self.assertNotIn("arena.combate", self._js("battle_replay.js"), "la repeticion vuelve a decidir el combate")

    def test_mandos_de_nino_y_accesible(self):
        r = self._js("battle_replay.js")
        for pieza in ("R.tiempo.type = 'range'", "R.tiempo.setAttribute('aria-label', T('rp_tiempo'))",
                      "R.narra.setAttribute('aria-live', 'polite')", "vel = vel >= 4 ? 1 : vel * 2",
                      "lienzo.setAttribute('aria-label', T('rp_aria'))", "var claves = [0, 3000, Math.round(k.fin / 2), k.total];",
                      "desafina: Math.min(1, (1 - p[2] / k.max[j])", "color: velColor(k.vel[j])"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, r)
        self.assertIn("actual = (window.AtlasReplay || E).escena(R.lienzo, def, asa, c, { semilla: info.semilla, texto: T,",
                      self._js("ui-arena.js"))
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        for k in set(re.findall(r"T\('(\w+)'\)", r)) | {"rp_marcha", "rp_choque", "rp_f_agresiva", "rp_f_defensiva", "rp_f_flanqueo"}:
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), k)


class Persistencia(unittest.TestCase):
    """C1 (plan firmado 2026-10-05): recargar conserva recursos y army. La partida se REPRODUCE y cada
    tropa vuelve POR `adopta`, re-verificada; un almacen tocado no mete nada (`persiste_casos.mjs`)."""
    def test_casos_de_la_persistencia(self):
        r = subprocess.run(["node", str(RAIZ / "persiste_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 7, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        db = sin_comentarios((PUBLICO / "game" / "db.js").read_text(encoding="utf-8"))
        self.assertIn("return yo.adopta(u && u.adopcion, u && u.firma)", db, "lo guardado entra sin pasar por adopta")
        self.assertIn("army.restaura()", sin_comentarios((PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")))


class EsteticaMedida(unittest.TestCase):
    """La estetica PINTA LO MEDIDO (directiva del Soberano, 2026-10-04): el dano se ve como desafinacion
    de la ecuacion, no como barra de vida; la niebla es tramado Atkinson de un bit (sin alfas); el
    origen medido | emulado | NO_DATA se ve en el mapa y se dice en texto; movimiento reducido manda."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))

    def test_el_dano_es_desafinacion_y_no_barra(self):
        e = self._js("escena.js")
        self.assertIn("function afina(arm, d, t)", e)
        self.assertIn("desafina: Math.min(1, (1 - u.vida / u.max)", e, "la vida no desafina la figura")
        self.assertNotIn("function barra(", e, "vuelve la barra de vida")
        self.assertIn("[[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]", e, "el tramado no es Atkinson")
        self.assertIn("(v - q) / 8", e, "Atkinson reparte 1/8 a cada vecino")

    def test_el_mapa_pinta_el_origen_de_cada_cifra(self):
        m = self._js("mar.js")
        self.assertIn("var NIEBLA = [null, ", m, "la niebla no es de un bit")
        self.assertIn("N.niebla(i * TESELA + x * RES, j * TESELA + y * RES, circ)", m, "la niebla no sale de lo despejado (fog_of_war.js)")
        self.assertIn("n.gen.estado === 'NO_DATA'", m, "NO_DATA no se pinta como ausencia")
        self.assertIn("prefers-reduced-motion: reduce", m)
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        for k in ("mapa_leyenda", "mapa_medido", "arena_vs"):
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), k)
        self.assertIn("NO_DATA", tx["mapa_leyenda"], "la leyenda no dice NO_DATA en texto")
        self.assertIn("T('mapa_leyenda')", self._js("ui-arena.js"), "la leyenda no se pinta en el DOM")


class NodosComoCuenta(unittest.TestCase):
    """Una cuenta = un nodo con su cedula (`preceptoros.cedula-nodo/1`), y Hexelion contra Doogee en
    vivo (orquestador, 2026-10-04). El combate sale de una semilla y el render reproduce su log; el
    equilibrio es una PROPUESTA en datos (`nodos-pesos.js`) y se MIDE simulando; lo que no se midio
    lucha con su niebla. Jugar sin firma no saca nada del navegador; enviar exige gesto, la firma
    de la partida y una SEGUNDA firma de consentimiento (consent 1)."""

    NODOS = ("nodos-pesos.js", "nodos-cedulas.js", "nodos.js", "ui-nodos.js")

    def _js(self, nombre):
        return sin_comentarios((PUBLICO / "game" / nombre).read_text(encoding="utf-8"))

    def _node(self, codigo):
        r = subprocess.run(["node", "-e", codigo], cwd=str(RAIZ.parent), capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_los_casos_de_los_nodos(self):
        r = subprocess.run(["node", str(RAIZ / "nodos_casos.mjs")], capture_output=True, text=True, timeout=300)
        casos = json.loads(r.stdout) if r.stdout.strip() else []
        self.assertGreaterEqual(len(casos), 19, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_ni_red_ni_reloj_ni_azar_en_los_nodos(self):
        """Cero peticiones al cargar: ningun modulo de los nodos sale a la red ni guarda nada. La
        unica salida es `Enviar.paquete`, que vive en `enviar.js` y se pide al pulsar."""
        for m in self.NODOS:
            codigo = self._js(m)
            for impuro in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "importScripts",
                           "localStorage", "sessionStorage", "indexedDB", "Math.random", "Date", "performance.now",
                           "innerHTML", "http://", "https://"):
                with self.subTest(modulo=m, impuro=impuro):
                    self.assertNotIn(impuro, codigo)

    def test_enviar_solo_tras_gesto_y_por_la_puerta_que_ya_existe(self):
        ui = self._js("ui-nodos.js")
        self.assertEqual(ui.count("Enviar.paquete("), 1, "otro camino de salida")
        self.assertEqual(ui.count("N.envio("), 1)
        self.assertIn("gesto: ev.isTrusted === true", ui, "el envio no exige un gesto de verdad")
        self.assertLess(ui.index("N.envio("), ui.index("Enviar.paquete("), "se manda antes de pasar la puerta")
        env = sin_comentarios((ASSETS / "enviar.js").read_text(encoding="utf-8"))
        self.assertEqual(env.count("fetch("), 2, "enviar.js abre otra salida")
        self.assertEqual(re.findall(r"fetch\((API \+ '/\w+')", env), ["API + '/reto'", "API + '/paquetes'"])
        self.assertIn("paquete: paquete", env, "la puerta de la partida no reutiliza la del rack")

    def test_los_pesos_son_PROPUESTA_y_el_Beelink_sale_de_cerebros_json(self):
        p = self._node("process.stdout.write(JSON.stringify(require('./public/game/nodos-pesos.js')))")
        self.assertEqual(p["estado"], "PROPUESTA")
        self.assertIsNone(p["firma"])
        c = self._node("process.stdout.write(JSON.stringify(require('./public/game/nodos-cedulas.js')))")
        cer = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        mini = next(x for x in cer["cerebros"] if x["id"] == "mini")
        hex_ = next(n for n in c["nodos"] if n["nodo"] == c["cuentas"][0]["nodo"])
        g = hex_["aparato"]["medidas"]["gen_cps"]
        self.assertEqual(g["estado"], "MEDIDO")
        self.assertEqual(g["valor"], round(mini["generacion"] * 100), "la cifra no es la de cerebros.json")
        self.assertIn("cerebros.json", g["fuente"])
        self.assertEqual(g["fecha"], cer["medido"])

    def test_los_textos_de_los_nodos_existen(self):
        ui = self._js("ui-nodos.js")
        usadas = set(re.findall(r"T\('(nodos_\w+)'\)", ui))
        usadas |= {"nodos_ram_mib", "nodos_gen_cps", "nodos_est_MEDIDO", "nodos_est_EMULADO", "nodos_est_NO_DATA"}
        self.assertGreater(len(usadas), 10)
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        for k in sorted(usadas):
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), f"falta {k} en atlas-arena-en.json")
        self.assertIn("window.AtlasNodosUI.monta(R.nodos, T)", (PUBLICO / "game" / "ui-arena.js").read_text(encoding="utf-8"))


class RedisenoDoogee(unittest.TestCase):
    """El rediseno grafico que sale de la constatacion en el Doogee real (2026-10-04,
    `propuestas/2026-10-04_constatacion_web_en_el_doogee.md`). Cada guarda tiene su sabotaje: se
    ensenaron en rojo antes que en verde. La LOGICA no cambia: `nodos.js`, el contrato del envio y
    las dos firmas siguen como estaban; esto vigila la pantalla."""

    def _js(self, nombre, carpeta="game"):
        return sin_comentarios((PUBLICO / carpeta / nombre).read_text(encoding="utf-8"))

    def _tx(self):
        return json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]

    def _node(self, codigo):
        r = subprocess.run(["node", "-e", codigo], cwd=str(RAIZ.parent), capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_el_boton_gris_dice_por_que(self):
        """Hallazgo 1: «Sign consent and send» gris sin decir por que hizo fallar el primer envio.
        Toda escritura de `R.enviar.disabled` vive en `cerrojo()`, que escribe a la vez el porque."""
        ui = self._js("ui-nodos.js")
        self.assertIn("R.enviar.setAttribute('aria-describedby', R.porque.id)", ui, "el porque no esta ligado al boton")
        fuera = re.sub(r"function cerrojo\(\w*\) \{.*?\n  \}", "", ui, flags=re.S)
        self.assertNotIn("R.enviar.disabled =", fuera, "se desactiva el boton fuera de cerrojo(), sin decir por que")
        cuerpo = re.search(r"function cerrojo\(\w*\) \{(.*?)\n  \}", ui, re.S)
        self.assertTrue(cuerpo, "falta cerrojo()")
        for k in ("R.enviar.disabled =", "R.porque.textContent =", "T('nodos_porque')", "T('nodos_porque_firma')"):
            with self.subTest(pieza=k):
                self.assertIn(k, cuerpo.group(1))
        tx = self._tx()
        self.assertIn("Tick the box above", tx["nodos_porque"])
        self.assertIn("step 1", tx["nodos_porque_firma"].lower())

    def test_las_dos_firmas_son_dos_pasos_numerados(self):
        """Hallazgo 4: la firma de la partida y la del consentimiento se parecian. Dos pasos con su
        numero, cada boton en el suyo, y la hoja los pinta distintos."""
        ui, tx = self._js("ui-nodos.js"), self._tx()
        self.assertTrue(tx["nodos_paso1_h"].startswith("Step 1 of 2"))
        self.assertTrue(tx["nodos_paso2_h"].startswith("Step 2 of 2"))
        self.assertIn("R.paso1.appendChild(R.firma)", ui)
        self.assertIn("R.envio.appendChild(R.enviar)", ui)
        self.assertIn("'atlas-paso atlas-paso-1'", ui)
        self.assertIn("'atlas-paso atlas-paso-2'", ui)
        css = (ASSETS / "thegame.css").read_text(encoding="utf-8")
        uno = re.search(r"\.atlas-paso-1\{([^}]*)\}", css)
        dos = re.search(r"\.atlas-paso-2\{([^}]*)\}", css)
        self.assertTrue(uno and dos, "los pasos sin estilo propio")
        self.assertNotEqual(uno.group(1), dos.group(1), "los dos pasos se pintan igual")
        self.assertNotEqual(tx["nodos_firmar"], tx["nodos_enviar"])

    def test_el_combate_arriba_y_las_cedulas_plegadas(self):
        """Hallazgo 3: las cedulas ocupaban mas de una pantalla antes de «Fight live»."""
        ui = self._js("ui-nodos.js")
        self.assertIn("R.cedulas = el('details'", ui)
        self.assertIn("fila.appendChild(ficha(0)); fila.appendChild(ficha(1)); R.cedulas.appendChild(fila);", ui)
        self.assertLess(ui.index("s.appendChild(m);"), ui.index("s.appendChild(R.cedulas);"), "las cedulas antes del combate")
        self.assertLess(ui.index("s.appendChild(R.escena);"), ui.index("s.appendChild(R.cedulas);"))

    def test_un_solo_boton_de_juego_y_la_ruta_a_la_arena_sigue_valiendo(self):
        """Hallazgo 2: «entrar y jugar» costaba dos toques de mas. `#thegame/arena` abre la Arena;
        `#thegame` sigue abriendo el juego como siempre."""
        cab = self._js("cabezal-rotulos.js", "assets")
        rx = re.search(r"var RUTA = /(.+?)/;", cab)
        self.assertTrue(rx, "falta la ruta del juego")
        ruta = re.compile(rx.group(1).replace("\\/", "/"))
        self.assertTrue(ruta.match("#thegame"), "#thegame ya no abre el juego")
        self.assertEqual(ruta.match("#thegame/arena").group(1), "arena")
        self.assertFalse(ruta.match("#thegamex"))
        # 2026-10-05, el Soberano: «thegame es solo 1 boton». La Arena vive DENTRO (pestana Battle);
        # `#thegame/arena` sigue valiendo como ruta, pero el cabezal lleva UNA sola puerta de juego.
        puertas = re.findall(r"\['cab-boton thegame[^']*', [^\]]*\]", cab)
        self.assertEqual(len(puertas), 1, f"vuelven a ser dos botones de juego: {puertas}")
        self.assertIn("'#thegame'", puertas[0])
        self.assertNotIn("'#thegame/arena'", cab, "la Arena vuelve al cabezal como boton propio")
        tg = self._js("thegame.js", "assets")
        self.assertIn("function abre(desde, pes)", tg)
        self.assertIn("if (pes && PANEL[pes]) { muestra(pes); }", tg)
        self.assertIn("RUTA", tg, "cerrar no reconoce la ruta nueva")

    def test_la_alerta_de_core_se_lee_como_juego(self):
        """Hallazgo 5: «RED ALERT» al entrar asustaba; es lore, no un error del sistema."""
        u = json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertTrue(u["alerta"].startswith("IN-GAME EVENT"), u["alerta"])
        self.assertNotIn("RED ALERT", u["alerta"])
        self.assertIn("not an error", u["alerta_p"])

    def test_los_rechazos_del_envio_salen_en_ingles(self):
        """Hallazgo 6: la pantalla en ingles y el rechazo en castellano. Cada causa que lanza
        `AtlasNodos.envio` tiene su texto ingles, y el recibo no ensena el mensaje crudo."""
        nodos = (PUBLICO / "game" / "nodos.js").read_text(encoding="utf-8")
        env = nodos[nodos.index("function envio(o)"):nodos.index("var AtlasNodos =")]
        causas = re.findall(r"throw new Error\('([^']+)'\)", env)
        self.assertGreaterEqual(len(causas), 4)
        ui, tx = self._js("ui-nodos.js"), self._tx()
        mapa = re.search(r"var RECHAZOS = \{(.*?)\};", ui, re.S)
        self.assertTrue(mapa, "sin tabla de rechazos")
        for c in causas:
            with self.subTest(causa=c):
                m = re.search(r"'" + re.escape(c) + r"': '(nodos_\w+)'", mapa.group(1))
                self.assertTrue(m, f"«{c}» sale en castellano")
                self.assertTrue(tx.get(m.group(1)), m.group(1))
        for k in ("nodos_rech_canal", "nodos_rech_http", "nodos_rech_red", "nodos_rech_otro"):
            self.assertTrue(tx.get(k), k)
        for k, v in tx.items():
            if k.startswith("nodos_"):
                with self.subTest(clave=k):
                    self.assertFalse(re.search(r"[ñáíóú¿¡]| sin | la partida", v), f"{k} no esta en ingles: {v}")
        self.assertNotIn("{ c: (e && e.message)", ui, "el recibo ensena el mensaje crudo")

    def test_hexelion_activo_sale_de_la_cedula_y_el_latido_es_NO_DATA(self):
        """Mapa global: «activo» no es decoracion. Sale de una medida MEDIDA con fecha en la cedula;
        sin latido que leer sin red, el latido es NO_DATA. Doogee, que no tiene medidas, no esta activo."""
        e = self._node("const C=require('./public/game/nodos-cedulas.js'),Q=require('./public/game/cuenta.js');"
                       "process.stdout.write(JSON.stringify(C.nodos.map(Q.estadoNodo)))")
        hexe, doo = e
        self.assertEqual(hexe["nodo"], "nodo.0.hexelion")
        self.assertEqual(hexe["activo"], "DECLARADO")
        self.assertEqual(hexe["latido"], "NO_DATA")
        self.assertTrue(hexe["desde"])
        self.assertTrue(hexe["medidas"] >= 1)
        self.assertEqual(doo["activo"], "NO_DATA", "un nodo sin medidas sale activo")
        tx = self._tx()
        self.assertIn("heartbeat NO_DATA", tx["rack_latido"])
        self.assertIn("window.AtlasRackUI.monta(", self._js("ui-arena.js"))
        for k in set(re.findall(r"T\('(\w+)'\)", self._js("ui-rack.js"))):
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k, "").strip(), f"{k} sin texto")

    def test_la_cuenta_maestra_es_PROPUESTA_y_solo_lleva_lo_publico(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        m = self._node("const C=require('./public/game/nodos-cedulas.js'),Q=require('./public/game/cuenta.js');"
                       "let r={ok:Q.cuentaMaestra(C,'ab'.repeat(32))};"
                       "for (const p of ['xyz', '', null, 'ab'.repeat(31)]) { try { Q.cuentaMaestra(C,p); r.malo=p; } catch(e) {} }"
                       "process.stdout.write(JSON.stringify(r))")
        self.assertNotIn("malo", m, "acepta una clave publica que no lo es")
        ok = m["ok"]
        v = jsonschema.Draft202012Validator(json.loads((DATOS / "preceptoros_cuenta_maestra_schema.json").read_text(encoding="utf-8")))
        self.assertTrue(v.is_valid(ok), list(v.iter_errors(ok)))
        self.assertEqual((ok["estado"], ok["firma"], ok["nodo"]), ("PROPUESTA", None, "nodo.0.hexelion"))

        def con(**c):
            d = json.loads(json.dumps(ok)); d.update(c); return d
        sin_nodo = json.loads(json.dumps(ok)); sin_nodo.pop("nodo")
        for i, malo in enumerate([con(estado="FIRMADA"), con(firma="a" * 128), con(privada="a" * 64),
                                  con(publica="ZZ" * 32), sin_nodo, con(une=["app-local", "lab", "web", "mainnet"])]):
            with self.subTest(violacion=i):
                self.assertFalse(v.is_valid(malo))
        for f in ("cuenta.js", "ui-rack.js"):
            c = self._js(f)
            for impuro in ("fetch", "XMLHttpRequest", "localStorage", "sessionStorage", "indexedDB", "Math.random",
                           "Date", "innerHTML", "http://", "https://", "privad", "passphrase", "100.", "tailnet"):
                with self.subTest(fichero=f, impuro=impuro):
                    self.assertNotIn(impuro, c)


if __name__ == "__main__":
    unittest.main(verbosity=1)
