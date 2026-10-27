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
import hashlib
import json
import os
import re
import subprocess
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ.parent / "public"
ASSETS = PUBLICO / "assets"

# FIRMO M1 (2026-10-13): la familia de ui.js es ui.js + su satelite ui-invoca.js (la invocacion sale de ui.js).
def _fam(nombre, texto):
    """Texto de un modulo; si es ui.js, con su satelite pegado: las pruebas leen la familia, no el fichero suelto."""
    if nombre == "ui.js":
        return texto + "\n" + (PUBLICO / "game" / "ui-invoca.js").read_text(encoding="utf-8")
    return texto
PISO = ASSETS  # los guiones, la hoja y la tira viven en public/assets/
CODIGO = ("atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-obra.js", "atlas-gesto.js", "atlas-dialogo.js", "atlas-motor.js",
          "atlas-piso.js", "atlas.css", "thegame.js", "thegame.css",
          "atlas-piloto.js", "atlas-partida.js", "atlas-piloto-capa.js", "atlas-guardado.js", "atlas-hud.js")
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
        # Desde la limpieza (2026-10-12) puede no pedir ninguno: la ventana y su voz se retiraron. Lo que pida, existe.
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
        # La celda repinta la onda (el retrato sigue vivo en el Primer Eco y el piso).
        self.assertRegex(codigo, r"celda: function \(n\) \{[^}]*pinta\(\)", "la celda no repinta la onda")
        # Limpieza 2026-10-12 (firmada): la ventana modal que alternaba «habla» se retiro; nadie la abria.
        for retirado in ("function abre(", "function cierra(", "function voz(", "aria-modal"):
            with self.subTest(retirado=retirado):
                self.assertNotIn(retirado, codigo, "vuelve la ventana muerta del dialogo")

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
        # La capa ES la portada (mudanza b1): una <section> dentro de #juego-panel. U0 («el mapa unico»,
        # 2026-10-11) retiro el camino del <dialog> (X, About, Escape, aviso de cierre): nunca corria.
        for muerto in ("showModal", "'cancel'", "cierre_aviso", "thegame-cerrar", "en-thegame"):
            with self.subTest(retirado=muerto):
                self.assertNotIn(muerto, capa, "vuelve el camino muerto del <dialog>")
        for pieza in ("capa = el('section', 'thegame-capa')", "s.async = false", "window.AtlasJuego.monta"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, capa)
        for g in ("atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-dialogo.js", "atlas-motor.js", "atlas-piso.js"):
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

    def test_q4_recurso_x2_se_mide_en_ciclos_del_motor(self):
        """Q4 measures sealed-rift production; Q5 supplies the open-rift modifier."""
        r = subprocess.run(["node", str(RAIZ / "recurso_x2_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual((d["ciclos"], d["segundos"], d["cobre"], d["cobre_por_ciclo"],
                          d["ciclos_para_50_cobre"], d["segundos_por_cobre"]),
                         (1000, 1000, 800, 0.8, 63, 1.26))

    def test_q5_grieta_modifica_recursos_y_reabre_por_ciclos(self):
        """Open rift restores base yield; sealed doubles it, visible to the Radio."""
        r = subprocess.run(["node", str(RAIZ / "grieta_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual((d["abierta_cobre_1000"], d["sellada_cobre_1000"],
                          d["estado_final_abierta"]), (400, 800, True))
        self.assertIn("Resource gain: base (1x)", d["radio_abierta"])
        self.assertIn("Resource gain: doubled (2x)", d["radio_sellada"])

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
        pedidas |= {f"f{n}" for n in range(1, 6)}
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
        # D7 (mudanza bloque 2, FIRMO 2026-10-11): el juego ENTRA en el precache: offline tras la primera visita.
        self.assertIn("/assets/atlas-voz.js", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"), "la voz no esta en el precache")
        self.assertIn("s.src = '/assets/atlas-voz.js'", (PUBLICO / "game" / "ui-ficha.js").read_text(encoding="utf-8"))  # T

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
        self.assertIn("'/atlas-opina-en.json'", listas, "los textos de opinar no abren sin red")   # solo existe en ingles (mudanza b3)
        for medida in ("atlas-mundo.json", "atlas-record.json"):
            self.assertNotIn(medida, listas, f"{medida} es una medida: fresca o no se sirve")

    def test_guardar_solo_al_pulsar_y_retomar_exige_motor_de_la_version(self):
        """`atlas-guardado.js`: el unico sitio de la puerta con almacen; escribe por DOS caminos
        (Guardar, que tambien usa el autoguardado de la capa C1, y Olvidar); lo que retoma se vuelve a
        jugar y una partida tocada no vuelve a entrar. Desde el 2026-10-05 (plan firmado, C1) se guarda
        solo, pero NUNCA antes de haber leido lo guardado; el motor cambiado rechaza una partida
        antigua con su version y causa, mientras la Aduana conserva el verificador historico."""
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
try { P.retoma(p, M); out.version_motor = 'aceptada'; } catch (x) { out.version_motor = x.message; }
const t = JSON.parse(JSON.stringify(p)); t.contenido_v = M.CATALOGO.contenido_v; t.final.contenido_v = M.CATALOGO.contenido_v; t.final.ciclo += 1;
try { P.retoma(t, M); out.tocada = 'aceptada'; } catch (x) { out.tocada = x.message; }
const v = JSON.parse(JSON.stringify(p)); v.contenido_v = 'otra';
try { P.retoma(v, M); out.version = 'aceptada'; } catch (x) { out.version = x.message; }
process.stdout.write(JSON.stringify(out));
"""
        r = subprocess.run(["node", "-e", js], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr)
        o = json.loads(r.stdout)
        self.assertTrue(o["version_motor"].startswith("contenido_v 2026-09-27.1 != 2026-10-14.2"), o["version_motor"])
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
        # R2: opinar vive en la caja de la partida, plegada en el terminal J7; baja al pulsar.
        term = (PUBLICO / "game" / "aiact-art50-crab-terminal.js").read_text(encoding="utf-8")
        self.assertIn("pide('/assets/atlas-opina.js'", term)
        self.assertIn("pide('/assets/atlas-hud.js'", term)
        # D7 (mudanza bloque 2, FIRMO 2026-10-11): el juego ENTRA en el precache: offline tras la primera visita.
        self.assertIn("/assets/atlas-opina.js", sin_comentarios((PUBLICO / "sw-listas.js").read_text(encoding="utf-8")))
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
        op = {"esquema": "atlas.opinion/1", "contenido_v": "2026-10-14.2", "sobre": "veredicto", "ciclo": 120,
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

    def test_limpieza_sin_puertas_muertas_una_puerta_una_cerradura(self):
        """Limpieza (orden del Soberano, 2026-10-11): PILOT y SUGGEST se retiran (medido: su freno `capa.open` era siempre
        falso, el piloto nunca actuaba, y su ventana solo cerraba con Escape). REPAIR deja de ser una ventana modal: el
        boton y la grieta llaman a UNA funcion que repara. Queda la partida firmada que te llevas (L-076), sin red."""
        codigo = sin_comentarios((PISO / "atlas-piloto-capa.js").read_text(encoding="utf-8"))
        for muerta in ("T('piloto')", "T('sugerir')", "piloto_soltar", "capa.open", "fetch(", "sugiere", "dialogo(", "setInterval"):
            with self.subTest(retirada=muerta):
                self.assertNotIn(muerta, codigo, "vuelve una puerta muerta")
        self.assertIn("window.Identity.firmar(p)", codigo, "la partida exportada ya no va firmada")
        self.assertIn("esquema: 'atlas.partida.firmada/1'", codigo)
        self.assertIn("R.exporta.id = 'thegame-exporta';", codigo)
        piso = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertIn("function repara() { if (E && E.abierta) { actua(M.reparar(E)); } }", piso)
        self.assertEqual(piso.count("addEventListener('click', repara)"), 1, "solo el control de reparacion sigue conectado")
        self.assertNotIn("function dialogo(", piso, "vuelve la ventana modal de reparar")
        for f in list((PUBLICO / "game").glob("*.js")) + list((PUBLICO / "assets").glob("*.js")):
            if f.name == "atlas-dialogo.js":
                continue
            with self.subTest(fichero=f.name):
                self.assertNotIn("AtlasDialogo.abre(", f.read_text(encoding="utf-8"), "alguien vuelve a abrir la ventana modal")

    def test_ninguna_peticion_apunta_a_un_fichero_que_no_existe(self):
        """Medido en el Doogee (2026-10-11): `auth.js` pedia `/nav.json` en CADA carga, un 404 desde que la mudanza b3
        lo retiro. Una peticion literal a un fichero propio que no existe es una puerta muerta: se caza aqui. Las
        rutas compuestas (`'/atlas-arena-' + lengua + '.json'`) no son literales y no entran."""
        for f in list((PUBLICO / "assets").glob("*.js")) + list((PUBLICO / "game").glob("*.js")) + [PUBLICO / "sw.js"]:
            codigo = sin_comentarios(f.read_text(encoding="utf-8"))
            for ruta in re.findall(r"fetch\('(/[^'?]+)'", codigo):
                if ruta.endswith("-") or ruta.endswith("/"):
                    continue
                with self.subTest(fichero=f.name, ruta=ruta):
                    self.assertTrue((PUBLICO / ruta.lstrip("/")).exists(), f"{f.name} pide {ruta}, que no existe")

    def test_en_el_telefono_el_dedo_llega_a_workshop_y_a_fight(self):
        """Medido en el Doogee con toques REALES (adb input tap, 2026-10-11): la cabecera del sitio (dos lineas a 360 px,
        hasta 147 px) recibia el toque de Workshop, y el unico Fight vivia en un pliego cerrado. La barra va por
        encima de la cabecera y baja en telefonos estrechos; elegir un lugar abre su pliego y deja el Fight a la vista."""
        css = re.sub(r"/\*.*?\*/", "", (PUBLICO / "assets" / "terminal_menu_shell.css").read_text(encoding="utf-8"), flags=re.S)
        barra = re.search(r"\.thegame-barra\{position:fixed;z-index:(\d+);", css)
        self.assertTrue(barra and int(barra.group(1)) > 5, "la barra queda bajo la cabecera (z-index 5)")
        self.assertIn("@media (max-width:25rem){:root{--thegame-tope:9.5rem}}", css)
        a = self._js("ui-arena.js") if hasattr(self, "_js") else sin_comentarios((PUBLICO / "game" / "ui-arena.js").read_text(encoding="utf-8"))
        self.assertIn("var p = document.getElementById('pliego-lugares');\n    if (p && !p.open) { p.open = true; }", a)

    def test_la_escuadra_propia_no_lleva_undefined(self):
        """Medido en el Doogee (2026-10-11), con tropas adoptadas de verdad: `lucha` hacia K.huella(escuadra) y una tropa
        sin lijar iba como {lija: undefined}: «canon: tipo undefined» y la batalla con tropas propias NO arrancaba.
        El canon tiene razon al rechazarlo: lo que se arregla es la escuadra."""
        r = subprocess.run(["node", "-e", """
          const K = require('./public/game/canon.js');
          let roto = ''; try { K.huella([{ tc: 'tc1', semilla: 'a', lija: undefined }]); } catch (e) { roto = e.message; }
          console.log(JSON.stringify({ roto, sano: K.huella([{ tc: 'tc1', semilla: 'a' }]).length }));
        """], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        d = json.loads(r.stdout)
        self.assertIn("undefined", d["roto"], "el canon deberia rechazar undefined (si no, la prueba no prueba nada)")
        self.assertGreater(d["sano"], 0)
        a = sin_comentarios((PUBLICO / "game" / "ui-arena.js").read_text(encoding="utf-8"))
        self.assertNotIn("lija: L[s] }", a, "vuelve la tropa con lija: undefined")
        self.assertIn("if (L[s]) { t.lija = L[s]; }", a)

    def test_la_revelacion_nunca_tapa_una_batalla(self):
        """FIRMO 2026-10-12 (medido en el Doogee: un huevo eclosiono a mitad de pelea y su revelacion cubrio la hoja). Con
        la hoja de Batalla abierta, la revelacion espera a que se cierre (observa `hidden`, sin reloj) y despues sale."""
        r = sin_comentarios((PUBLICO / "game" / "summon_reveal.js").read_text(encoding="utf-8"))
        self.assertIn("function batalla() { var b = document.getElementById('thegame-batalla'); return b && !b.hidden ? b : null; }", r)
        self.assertIn("if (enCurso.hidden) { ob.disconnect(); muestra(t, alCerrar); }", r)
        self.assertLess(r.index("var enCurso = batalla();"), r.index("capa.appendChild(fondo)"), "la revelacion se pinta antes de mirar si hay batalla")
        for reloj in ("setInterval", "setTimeout"):
            self.assertNotIn(reloj, r.split("function muestra(t, alCerrar)")[1].split("var g = cv.getContext")[0], "la espera usa reloj")

    def test_ley_del_suelo_paso_1_el_rombo_es_la_ley(self):
        """LEY DEL SUELO (firmada 2026-10-12), paso 1: rombo 2:1, (col,fila) -> x=(col-fila)*W/2, y=(col+fila)*H/2, anclaje al
        CENTRO del rombo, orden de pintor por (col+fila). Sin parallax ni sombras. Sabotaje medido: la rejilla cuadrada
        tumba 3 de 9 casos. La prueba visual vive en el lab (atlas/isometric_floor_prueba.html)."""
        r = subprocess.run(["node", str(RAIZ / "isometric_floor_casos.mjs")], capture_output=True, text=True, timeout=60)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 9)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        f = sin_comentarios((PUBLICO / "game" / "isometric_floor_projection.js").read_text(encoding="utf-8"))
        for prohibido in ("parallax", "shadow", "Math.random", "Date.now", "fetch("):
            with self.subTest(prohibido=prohibido):
                self.assertNotIn(prohibido, f)
        self.assertLess(len(f.encode()), 16384)

    def test_6b_el_ejercito_no_cobra_por_dormir(self):
        """6b+6a (FIRMO 2026-10-12, manda la ficha V3.0 «la cosecha pasiva es veneno»): volver a la pestana NO paga; la
        pantalla «while you were away» narra, en ciclos (sin reloj de pared). Medido en el navegador: pestana oculta y 8 h
        de reloj adelantado -> los mismos recursos y el mismo ciclo. Las partidas guardadas con pasos `dormir_ms` siguen
        reproduciendose (el motor conserva `dormir` SOLO para rehacer la historia: quitarlo romperia esas partidas)."""
        piso = sin_comentarios((PISO / "atlas-piso.js").read_text(encoding="utf-8"))
        for veneno in ("M.dormir(", "Date.now", "M.recoger(E)", "U('recoger')"):
            with self.subTest(veneno=veneno):
                self.assertNotIn(veneno, piso, "vuelve el pago por dormir (V3.0)")
        r = subprocess.run(["node", "-e", """
          const M = require('./public/assets/atlas-motor.js'), Pa = require('./public/assets/atlas-partida.js');
          const ley = { nd: false, integridad_max: 100, dano: 1 };
          const p = { esquema: 'atlas.partida/1', contenido_v: M.CATALOGO.contenido_v, ley, truncada: false,
                      pasos: [{ ciclos: 5 }, { dormir_ms: 60000 }, { accion: 'recoger', origen: 'humano' }] };
          console.log(JSON.stringify({ ciclo: Pa.instantanea(Pa.reproduce(p, M), M).ciclo }));
        """], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(json.loads(r.stdout)["ciclo"], 5, "una partida vieja con dormir_ms ya no se reproduce")
        ui = json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertNotIn("produces while this tab is hidden", ui["dormias_vacio"], "el texto vuelve a prometer pago por dormir")

    def test_ley_del_suelo_paso3_orden_de_pintor(self):
        """LEY DEL SUELO, paso 3: lo que se pinta en el mapa se ENCOLA con su sitio y se pinta de atras a delante por
        profundidad (`IsometricFloor.ordena`), ANTES de la niebla. Cada capa (cangrejos, anclas, edificios, cristal)
        encola si le dan cola y pinta directo si no. Medido en el navegador: 11 piezas, ordenadas, 60 veces por segundo."""
        m = sin_comentarios((PUBLICO / "game" / "sea.js").read_text(encoding="utf-8"))
        vacia = m.index("window.IsometricFloor.ordena(cola).forEach(function (x) { x.f(); });")
        self.assertLess(vacia, m.index("TS.niebla(g, cam, W, H, z);"), "la niebla debe tapar lo pintado, no al reves")
        for pieza in ("var cola = [], pon = function (x, y, d, fi) { cola.push({ col: x, fila: y, f: d, ficha: fi }); };",
                      "f.lugares().forEach(function (l, i) { var s = sitio(l),", "cz = v === 0 ? 0 : Z.color(v); pon(s.x, s.y, function () {",
                      "window.AtlasMapNodes.pinta(g, P, { H0: H0, col: col, t: t, dpr: dpr, pon: pon });"):  # los nodos: su modulo
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, m)
        self.assertEqual(m.count("pon: pon"), 4, "nodos, cangrejos, anclas y edificios reciben la cola")
        nodos = (PUBLICO / "game" / "map_nodes_layer.js").read_text(encoding="utf-8")
        self.assertIn("H0.forEach(function (n) { pon(n.x, n.y, function () {", nodos, "los nodos pintan por la cola desde su modulo")
        self.assertLess(len((PUBLICO / "game" / "sea.js").read_bytes()), 16000, "sea.js vuelve a engordar: split primero")
        for f in ("sea-crabs.js", "sea-anchors.js", "reef_buildings_layer.js", "latency_crystal.js"):
            with self.subTest(capa=f):
                self.assertIn("o.pon || function (x, y, d) { d(); }", (PUBLICO / "game" / f).read_text(encoding="utf-8"))

    def test_pr2_gusanos_y_pr3_vector(self):
        """PR-2 (FIRMO 2026-10-12): la trayectoria del gusano ES el dato (pura de S_t; revela, no decide; color del sello).
        PR-3: cada transicion se narra en la Radio y se lee en el inspector; y TODO el estado visible cabe en un vector
        < 1 KB (`AtlasVector.leer()`), leible de una llamada por un LLM pequeno («piensa vectorialmente»)."""
        import jsonschema
        for casos in ("gusano_casos.mjs", "vector_casos.mjs"):
            with self.subTest(casos=casos):
                r = subprocess.run(["node", str(RAIZ / casos)], capture_output=True, text=True, timeout=60)
                self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])
        contrato = json.loads((DATOS / "atlas_vector_schema.json").read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator.check_schema(contrato)
        validador = jsonschema.Draft202012Validator(contrato)
        vector = {"v": "preceptoros.vector/1", "c": 1, "r": [1, 2, 3, 4], "k": [0, 0, 0, 0, 0],
                  "p": ["panel", "LIVE", 0], "t": None, "e": [["buoy", "alive", 1]],
                  "l": [["reef", 1, 0]], "n": [["node", "1/1"]], "z": 0,
                  "q": [["Map", "LIVE", 1]], "g": [None, "panel", 0, 1], "nd": {}}
        self.assertTrue(validador.is_valid(vector), list(validador.iter_errors(vector)))
        for malo in ({**vector, "extra": True}, {**vector, "c": None},
                     {**vector, "e": []}, {**vector, "r": [1, None, 3, 4]}):
            with self.subTest(vector=malo):
                self.assertFalse(validador.is_valid(malo), "el contrato deja pasar una forma incompleta o abierta")
        puerta = (ASSETS / "thegame.js").read_text(encoding="utf-8")
        self.assertLess(puerta.index("['/game/vector_contract.js']"), puerta.index("['/game/state_vector.js']"))
        self.assertIn("'/game/vector_contract.js'", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"))
        w = (ASSETS / "worm_transition.js").read_text(encoding="utf-8")
        self.assertIn("R.dice({ quien: 'Terminal', fuente: 'gusano',", w, "una transicion que no se narra no entra")
        self.assertIn("['worm_transition.js']", (ASSETS / "thegame.js").read_text(encoding="utf-8"))

    def test_pr1_la_ventana_como_conversacion(self):
        """PR-1 (FIRMO 2026-10-12): el cajon es UNA ventana: cabecero con titulo, sello, fuente y edad en ciclos; cierre
        de 46 px; rotulos del menu COMPLETOS (medido: 4 se cortaban). Plug&play: observa el cajon, no toca el shell."""
        r = subprocess.run(["node", str(RAIZ / "ventana_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])
        css = (ASSETS / "terminal_menu_shell.css").read_text(encoding="utf-8")
        self.assertNotIn("text-overflow:ellipsis;white-space:nowrap}", css.split(".thegame-menu-rotulo{")[1].split("\n")[0], "los rotulos vuelven a cortarse")
        self.assertIn(".terminal-enmarcado{", css)
        self.assertIn(".meta-objetivo{white-space:normal", css, "el objetivo no puede cortarse con puntos suspensivos a zoom")
        self.assertIn("c.dataset.zoom = '1.00';", (PUBLICO / "game" / "map_zoom.js").read_text(encoding="utf-8"), "zoom del mapa: pellizco y rueda")
        self.assertIn("if (ev.ctrlKey) { return; }", (PUBLICO / "game" / "map_zoom.js").read_text(encoding="utf-8"), "Ctrl+rueda es del navegador, no del mapa")
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        self.assertIn("document.addEventListener('pointerdown', function (e) {", sh, "fuera-clic cierra: un solo handler para el cajon y las hojas")
        self.assertIn("if (abierto) { abre(abierto, false); }", sh, "el fuera-clic cierra el cajon sin destruir lo ganado")
        self.assertIn("S.ARMYZ = el('div', 'casa-army'); ond.appendChild(S.ARMYZ);", sh, "RONDA 1: la invocacion (incubadora, odds, nido) vive en el ARMY, no en el Taller")
        # RONDA 3 · payload de Hexelion: la ficha del coral cita el fichero con su sha256; cero red.
        self.assertIn("var HB = raiz.AtlasHexBench;", (PUBLICO / "game" / "reef_corals.js").read_text(encoding="utf-8"))
        cor = (PUBLICO / "game" / "reef_corals.js").read_text(encoding="utf-8")
        self.assertIn("var CORAL_C = { h: 12, s: 82, l: 62 };", cor, "el coral en el hue de la clase coral (12), no uno inventado")
        self.assertIn("f.causas.push('lab: ' + B.fuente.enlace);", cor, "la ficha de Hexelion enlaza el benchmark del lab")
        r3 = subprocess.run(["node", str(RAIZ / "hexelion_bench_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r3.returncode, 0, r3.stdout[-1200:] + r3.stderr[-400:])
        # RONDA 2 · chunk 3: boya y cristal en toon desde su vector (hue del propio edificio, sin inventar).
        self.assertIn("raiz.AtlasBuildingsToon.forma(g, 'boya', p[0], y, r, c, dpr, c.a)", (PUBLICO / "game" / "reef_buildings_paint.js").read_text(encoding="utf-8"))  # M1: el pintor conserva las siluetas
        self.assertIn("TB.forma(g, 'cristal', p[0], p[1], lado, { h: niv[2][0], s: niv[2][1], l: niv[2][2] }", (PUBLICO / "game" / "latency_crystal.js").read_text(encoding="utf-8"))
        r2 = subprocess.run(["node", str(RAIZ / "buildings_toon_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r2.returncode, 0, r2.stdout[-1200:] + r2.stderr[-400:])
        f = (ASSETS / "terminal_window_frame.js").read_text(encoding="utf-8")
        self.assertIn("if (cab.dataset.c === clave) { return; }", f, "sin esto, el cabecero se observa a si mismo en bucle")
        self.assertIn("['terminal_window_frame.js']", (ASSETS / "thegame.js").read_text(encoding="utf-8"))

    def test_r1_cangrejo_toon(self):
        """REALISMO ANIME HONESTO, R1 (FIRMO 2026-10-12): el cangrejo en cel shading desde SU onda. Bandas del mismo hue
        (sabotaje estrella: un hue inventado -> rojo), sellos de una sola tabla, morf armonico de 2 s, parpadeo del ciclo;
        el paseo J1 sin tocar; sin raster, sin azar, sin red."""
        r = subprocess.run(["node", str(RAIZ / "toon_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])
        t = sin_comentarios((PUBLICO / "game" / "crab_render_hd.js").read_text(encoding="utf-8"))
        for malo in ("Date", "Math.random", "fetch(", "localStorage", "innerHTML", "createLinearGradient", "createRadialGradient", "shadowBlur", "drawImage", "Image("):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, t)
        mc = (PUBLICO / "game" / "sea-crabs.js").read_text(encoding="utf-8")
        self.assertIn("(Tn ? Tn.cangrejo : CJ.pinta)(g, p[0], p[1] + dy, r,", mc)
        self.assertIn("pc = CJ.paseo(cj.semilla, cj.ciclo,", mc, "el paseo J1 sigue mandando")

    def test_t_crt_gramatica_acustica_cumple_su_contrato(self):
        """T_CRT §8.3 (FIRMO 2026-10-19, Comando #15): las 12 salidas (3 verbos x 4 estados) del gestor de audio, en sus
        tres caminos de sonido, validan contra data/audio_feedback_manager.schema.json $defs.verbo con el validador real."""
        guion = ("const vm=require('vm'),fs=require('fs');const out=[];"
                 "for(const modo of ['off','on','suspended']){const r={AtlasSintesis:{activa:()=>true,contexto:()=>({state:modo==='suspended'?'suspended':'running'}),suena:x=>x}};"
                 "vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),r);const A=r.AudioFeedbackManager;if(modo!=='off')A.habilitar();"
                 "for(const v of A.VERBS)for(const s of A.STATES)out.push(A.verb(v,s,s==='STALE'?'old reading':null));}"
                 "console.log(JSON.stringify(out));")
        r = subprocess.run(["node", "-e", guion, str(PUBLICO / "game" / "audio_feedback_manager.js")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr[-400:])
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · sin jsonschema. Remedio: pip install jsonschema")
        salidas = json.loads(r.stdout)
        esquema = json.loads((DATOS / "audio_feedback_manager.schema.json").read_text(encoding="utf-8"))
        v = jsonschema.Draft202012Validator({**esquema, "$ref": "#/$defs/verbo"})
        self.assertEqual(len(salidas), 36)
        self.assertEqual({s["sonido"] for s in salidas}, {"INACTIVO", "SONADO", "NO_DATA"})
        for s in salidas:
            with self.subTest(verbo=s["verbo"], estado=s["estado"], sonido=s["sonido"]):
                self.assertEqual([], [e.message for e in v.iter_errors(s)])
        malo = dict(salidas[0], estado="NO_DATA", causa=None)
        self.assertTrue(list(v.iter_errors(malo)), "un NO_DATA sin causa tiene que fallar el contrato")

    def test_b_cangrejo_funcional_y_e_tutorial_de_genesis(self):
        """B: el manejo libre va ENCIMA del paseo J1 (paseo intocado), la niebla no se pisa, y las skills salen solo de lo
        que el cangrejo hace (Swim, Reach). E: el tutorial es el esquema de acciones renderizado, bajo el teaching kernel
        (dry-run en lo irreversible, fallo como ramificacion, objetivo siempre a la vista, ayuda que decae, saltable)."""
        for casos in ("cangrejo_libre_casos.mjs", "audio_feedback_manager_casos.mjs", "tutorial_casos.mjs", "corales_casos.mjs"):
            with self.subTest(casos=casos):
                r = subprocess.run(["node", str(RAIZ / casos)], capture_output=True, text=True, timeout=60)
                self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])
        self.assertIn("VE = 620,", (PUBLICO / "game" / "sea.js").read_text(encoding="utf-8"), "A: el mapa, mas grande a la vista")
        self.assertIn("if (av) { meta.appendChild(av); }", (PUBLICO / "game" / "genesis_tutorial.js").read_text(encoding="utf-8"), "el aviso y el objetivo se pisaban")
        mc = (PUBLICO / "game" / "sea-crabs.js").read_text(encoding="utf-8")
        self.assertIn("pc = CJ.paseo(cj.semilla, cj.ciclo,", mc, "el paseo J1 sigue mandando debajo")
        self.assertIn("if (L) { var d = L.paso(s, o.circ); s = { x: s.x + d.x, y: s.y + d.y }; }", mc)
        t = sin_comentarios((PUBLICO / "game" / "genesis_tutorial.js").read_text(encoding="utf-8"))
        for pieza in ("id = 'tutorial-salta'", "'Goal · '", "' · Now: '", "function verbosidad()", "'Not yet, and why'", "c >= k ?"):
            with self.subTest(tutorial=pieza):
                self.assertIn(pieza, t)
        for malo in ("Date", "Math.random", "fetch(", "localStorage", "innerHTML"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, t + sin_comentarios((PUBLICO / "game" / "crab_free_move.js").read_text(encoding="utf-8")))

    def test_b1_sin_skills_de_relleno(self):
        """B1 (FIRMO 2026-10-12): el panel no pinta oficios que el cangrejo no puede ejercer (Descent, Fishing, Mining,
        Smithing, Herbalism, Restoration, Engineering), ni sus barras de XP, ni el Core Level. El motor no se toca."""
        p = sin_comentarios((ASSETS / "atlas-piso.js").read_text(encoding="utf-8"))
        for malo in ("atlas-skills", "TXT.skills", "'nucleo_h'", "'nucleo_p'", "'desbloqueo'", "'sube'", "Atlante-7F3A", "nivelTexto"):
            with self.subTest(fuera=malo):
                self.assertNotIn(malo, p)
        self.assertIn("pon(R.fase, rellena(U('fase_h')", p, "la fase se queda: mueve el mapa")

    def test_c_paneles_amables_y_grandes(self):
        """The signed shell keeps five stable routes and one combined Waves/Army sheet. T_CRT (FIRMO 2026-10-19,
        Comando #15) supersedes the visible map margin of PR-1 for OPEN panels: the drawer and the sheets open on the
        whole tube surface (surface-slot); closed, the map stays whole underneath (RC-20)."""
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        self.assertLess(sh.index("entrada('waves',"), sh.index("entrada('buildings',"), "Waves Army precedes other routes")
        for pieza in ("muestra(actual === 'ondas' ? null : 'ondas')", "S.HOJA.ondas", "function mueveArmy()",
                      "Promise.resolve(x.alTaller()).then(mueveArmy)", "e.key !== 'Escape'"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, sh)
        css = (ASSETS / "terminal_menu_shell.css").read_text(encoding="utf-8")
        self.assertIn("width:min(24rem,calc(100vw - var(--menu) - 1.5rem))", css)
        self.assertIn("left:calc(var(--menu) + .5rem)", css.split(".thegame-terminal{")[1].split("}")[0])
        self.assertIn(".thegame-terminal.surface-slot,.thegame-hoja.surface-slot{left:var(--menu);right:0;top:var(--thegame-tope);bottom:var(--pie);", css)
        self.assertIn("#thegame summary{min-height:2.75rem;", css)
        self.assertIn("#thegame :is(.boton,.boton-sec){min-height:2.875rem;min-width:2.875rem}", css)

    def test_a1b8_un_estado_y_lo_ausente_es_no_data(self):
        """A1B8 (lote 0): la carta del mapa lee el MISMO Army que el Taller (adopciones desenvueltas), sin Army es NO_DATA;
        el INSPECTOR (0d) da de cada pieza que es, estado, coordenada y sonido, y formatea lo ausente como NO_DATA con
        causa (tambien dentro de un texto ya armado). El arnes conductual `sin_undefined.mjs` (Chrome) va aparte."""
        for casos in ("ejercito_mapa_casos.mjs", "inspector_casos.mjs", "place_reading_casos.mjs"):
            with self.subTest(casos=casos):
                r = subprocess.run(["node", str(RAIZ / casos)], capture_output=True, text=True, timeout=60)
                self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])
        self.assertIn("u && u.adopcion ? u.adopcion.tropa : u", (ASSETS / "atlas-mapa.js").read_text(encoding="utf-8"))
        m = (PUBLICO / "game" / "sea.js").read_text(encoding="utf-8")
        self.assertIn("window.AtlasInspector.registra(cola, P, f.texto);", m)
        self.assertIn("v = Z && l.npc ? Z.vector(rec[l.clave], l.lider) : 0, cz = v === 0 ? 0 : Z.color(v);", m, "∇C opcion A: el lugar pinta su registro de combate")
        self.assertIn("raiz.AtlasInspector.toca(px, py, 44 * x.dpr, tocado, lugar)", (PUBLICO / "game" / "map_pointer_input.js").read_text(encoding="utf-8"))

    def test_los_lugares_informan_antes_de_actuar(self):
        r = subprocess.run(["node", str(RAIZ / "place_card_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1800:] + r.stderr[-500:])
        a = (ASSETS / "auth.js").read_text(encoding="utf-8")
        for k in ("idClave", "idPublica", "idEntrar", "idAviso", "idFallo"):
            with self.subTest(rotulo=k):
                self.assertRegex(a, k + r": '[^']+'", "sin bloque i18n el rotulo seria undefined")

    def test_5c_guion_unico_del_cangrejo_y_arranque(self):
        """5C: una sola fuente de estado, seis secciones en orden fijo, recibos en su lugar, sin JSON humano ni
        relojes paralelos. El contrato incluye la carga inicial real en Chrome, no solo que el panel exista."""
        r = subprocess.run(["node", str(RAIZ / "crab_state_screen_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1400:] + r.stderr[-500:])
        guion = (PUBLICO / "game" / "crab_state_screen.js").read_text(encoding="utf-8")
        casa = (PUBLICO / "game" / "home_buildings.js").read_text(encoding="utf-8")
        frame = (ASSETS / "terminal_window_frame.js").read_text(encoding="utf-8")
        save = (ASSETS / "atlas-guardado.js").read_text(encoding="utf-8")
        inspector = (PUBLICO / "game" / "piece_inspector.js").read_text(encoding="utf-8")
        term = (PUBLICO / "game" / "aiact-art50-crab-terminal.js").read_text(encoding="utf-8")
        for title in ("who", "body", "core", "budget", "receipts", "actions"):
            with self.subTest(section=title):
                self.assertIn("'" + title + "'", guion)
        self.assertIn("function cangrejo()", casa, "el panel lee la fuente única del cuerpo")
        # D1 (2026-10-16): the citation moved from a code comment to the canon doc; the code calls C.cangrejo() directly
        mc = (PUBLICO / "game" / "sea-crabs.js").read_text(encoding="utf-8")
        self.assertTrue("C.cangrejo()" in mc or "AtlasCasa.cangrejo()" in mc,
                        "sea-crabs lee la fuente unica del cuerpo")
        self.assertIn("function ficha()", frame, "la ventana entrega un único sello de frescura")
        self.assertIn("montaInspector", inspector + save, "los controles del aparato viven en Inspector")
        self.assertNotIn("LIVE", guion, "la frescura se pinta una vez en el marco del canal")
        self.assertIn("slots.receipts.appendChild(saveReceipt)", guion)
        self.assertNotIn("boton(T('guardar')", save[save.index("function monta(capa)"):save.index("function montaInspector")])
        self.assertNotIn("JSON.stringify(pedido)", term, "el terminal humano no debe mostrar JSON crudo")
        self.assertNotIn("application/json", (PUBLICO / "game" / "crab_state_screen.js").read_text(encoding="utf-8"))
        self.assertNotIn("reopens in {s} s", (PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))
        self.assertIn("startup", (RAIZ / "sin_undefined.mjs").read_text(encoding="utf-8"),
                      "la regresión de arranque debe ejecutarse en Chrome")

    def test_los_9_objetos_nacen_con_tiempo(self):
        """LOS 9 OBJETOS (FIRMO 2026-10-12): el estado de un edificio es funcion PURA de (manifiesto, tic). Desgaste en tics,
        NO_DATA con causa (nunca «0»), ∇C como telemetria (Hue vida, Sat carga, Light escudo). 9/9 casos; el sabotaje que
        deja vivir para siempre lo desatendido tumba 2."""
        r = subprocess.run(["node", str(RAIZ / "reef_building_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1500:] + r.stderr[-500:])
        f = "".join(sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))
                    for n in ("reef_building_lifecycle.js", "reef_buildings_layer.js", "latency_crystal.js"))
        for malo in ("Date", "Math.random", "fetch(", "localStorage", "innerHTML", "performance.now"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, f)
        # El OBSERVATORIO despeja con los MISMOS circulos que lo medido (fog_of_war), y sus textos viajan con el mapa.
        m = (PUBLICO / "game" / "sea.js").read_text(encoding="utf-8")
        self.assertIn("circ = circ.concat(window.AtlasArrecife.circulos());", m, "lo que mira el observatorio no despeja")
        ui = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        for k in ("boya_estado", "boya_fases", "obs_nombre", "obs_mirar", "obs_fases", "lap_nombre", "lap_vacio", "lap_recibo"):
            with self.subTest(texto=k):
                self.assertTrue(ui.get(k, "").strip())
        self.assertEqual(len(ui["obs_fases"].split("|")), 4, "las cuatro fases de lo visto")
        # Las LAPIDAS: el recibo nombra lo que cayo, cuando, por que y su huella; su panel tiene hogar (icono) en el menu.
        for campo in ("{id}", "{nace}", "{muere}", "{causa}", "{huella}"):
            with self.subTest(recibo=campo):
                self.assertIn(campo, ui["lap_recibo"])
        self.assertIn("history: ['pliego-estado', 'pliego-lapidas']", (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8"))

    def test_la_terminal_chatbot_y_el_chat_de_la_radio(self):
        """LA TERMINAL (FIRMO 2026-10-12): menu a la izquierda (64 px iconos / 220 px expandido), el chat de la Radio abajo,
        PLEGADO de salida (una linea: jamas se come el mundo). Cada burbuja dice quien, sello (LIVE/STALE/SIMULATED/
        NO_DATA), fuente y edad EN CICLOS, y lo lleva en data-* (el lab lee el chat, no pixeles). El chat se alimenta de
        las lineas de estado que el juego YA escribe: no inventa mensajes. Opinar tiene su hogar en el menu."""
        r = sin_comentarios((ASSETS / "radio_message_log.js").read_text(encoding="utf-8"))
        for pieza in ("R.lista.setAttribute('role', 'log')", "R.lista.setAttribute('aria-live', 'polite')",
                      "li.dataset.quien = m.quien; li.dataset.sello = s; li.dataset.fuente = m.fuente;",
                      "if (/^\\s*NO_DATA/.test(texto)) { return 'NO_DATA'; }", "li.dataset.ciclo = cicloValido(m.ciclo) ? String(m.ciclo) : 'NO_DATA';",
                      "closest('[role=\"status\"],[aria-live]')", "el('section', 'radio-chat plegado')", "function registro()"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, r)
        # Measure age behavior against the actual module, including missing cycles and resets.
        measured = subprocess.run(["node", str(RAIZ / "radio_age_cases.mjs")],
                                  capture_output=True, text=True, timeout=60)
        self.assertEqual(measured.returncode, 0, measured.stdout + measured.stderr)
        self.assertEqual(json.loads(measured.stdout)["cases"], 14)
        self.assertIn("R.tabs.setAttribute('role', 'tablist')", r)
        self.assertIn("global chat has no tested repository channel", r)
        self.assertIn("function registro() { return lista.map(function (m) { return { quien: m.quien, sello: sello(m), fuente: m.fuente, ciclo: m.ciclo, texto: m.texto }; }); }", r)
        for malo in ("Date.now", "fetch(", "localStorage", "innerHTML", "Math.random"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, r)
        css = (ASSETS / "terminal_menu_shell.css").read_text(encoding="utf-8")
        for regla in (":root{--thegame-tope:7.2rem;--menu:4rem;--chat:3rem;--pie:calc(var(--chat) + 1px + env(safe-area-inset-bottom,0px))}", ".mapa-mandos{position:fixed;z-index:1;left:calc(var(--menu) + .6rem);bottom:calc(var(--pie) + .6rem)}", ":root:has(.thegame-menu.expandido){--menu:13.75rem}",
                      "body.portada-juego .pc-boton{display:none}", "grid-template-columns:minmax(0,1fr)", "min-height:3rem"):
            with self.subTest(regla=regla):
                self.assertIn(regla, css)
        sh = sin_comentarios((ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8"))
        for destino in ("history", "waves", "buildings", "nodes", "start"):
            self.assertIn("entrada('" + destino + "'", sh, "falta un destino principal del sidebar")
        self.assertIn("'pliego-nodos'", sh, "Nodes & Events debe exponer el roster publicado")
        self.assertIn("'pliego-opinar'", sh, "feedback conserva su acceso dentro de Nodes & Events")
        for vista in (".thegame-terminal{position:fixed;z-index:4;left:calc(var(--menu) + .5rem)",
                      ".thegame-hoja{position:fixed;z-index:4;top:calc(var(--thegame-tope) + .5rem)",
                      ".radio-chat-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))",
                      "@media(max-width:47.999rem)", "prefers-reduced-motion:reduce"):
            self.assertIn(vista, css, vista)
        for f in ("radio_message_log.js", "terminal_menu_shell.js"):
            self.assertLess(len((ASSETS / f).read_bytes()), 16384, f)

    def test_lo_que_flota_recibe_el_dedo(self):
        """U1 puso pointer-events:none en la capa para que el mapa reciba el dedo, y eso se HEREDA: la revelacion,
        Customize y los dialogos solo se cerraban con Escape (medido en vivo). Toda clase `position:fixed` del juego
        tiene que estar en una regla pointer-events:auto (salvo el aviso del mapa, que no es pulsable a proposito)."""
        hojas = [PUBLICO / "assets" / n for n in ("thegame.css", "terminal_menu_shell.css", "atlas.css")] + [PUBLICO / "game" / "home.css"]
        vivo = "".join(re.sub(r"/\*.*?\*/", "", h.read_text(encoding="utf-8"), flags=re.S) for h in hojas)
        # Excepciones, NO pulsables a proposito: el aviso del mapa y el lienzo del gusano (PR-2: revela, no decide; si
        # recibiera el dedo, taparia el juego durante la transicion). Y se exige que el gusano lo deje pasar.
        fijas = set(re.findall(r"\.([a-z][a-z0-9-]*)\{position:fixed", vivo)) - {"mapa-aviso", "gusano-lienzo"}
        self.assertIn("pointer-events:none", vivo.split(".gusano-lienzo{")[1].split("}")[0], "el gusano no puede recibir el dedo")
        auto = set()
        for sel, cuerpo in re.findall(r"([^{}]+)\{([^{}]*)\}", vivo):
            if "pointer-events:auto" in cuerpo:
                auto |= set(re.findall(r"\.([a-z][a-z0-9-]*)", sel))
        self.assertGreaterEqual(len(fijas), 8)
        for c in sorted(fijas):
            with self.subTest(capa=c):
                self.assertIn(c, auto, f".{c} flota y no recibe el dedo: solo se cerraria con Escape")

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
        ok_tal = {"esquema": "atlas.taller/1", "op": "desintegra", "prev": "0" * 64, "clave_publica": pub, "semilla": "b" * 64,
                  "tc": "tc4", "aristas": 13, "gramos": 39, "saldo": 39}
        ok_inv = {"esquema": "atlas.invocacion/2", "tc": "tc2", "seq": 3, "prev": "c" * 64, "clave_publica": pub}
        casos = {
            # G0: el eslabon solo firma lo que fija la semilla (ni pseudonimo ni ciclo: eso era pesca de semilla).
            "atlas_invocacion_schema.json": (ok_inv, [
                con(ok_inv, seq=0), con(ok_inv, prev="genesis2"), con(ok_inv, tc="tc9"),
                con(ok_inv, pseudonimo="x"), con(ok_inv, ciclo=4), sin(ok_inv, "prev")]),
            "atlas_taller_schema.json": (ok_tal, [
                con(ok_tal, op="regalar"), con(ok_tal, saldo=-1), con(ok_tal, stat="velocidad"),
                con(ok_tal, gramos=-4), con(ok_tal, aristas=2), con(ok_tal, bandera="teal")]),
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


# Modulos de `public/game/` que NINGUN guion pide todavia (ni la puerta ni el Army): el multijugador y
# la cria, firmados por el Soberano el 2026-09-28 («ve construyendo todo… enfocados al multiplayer»).
# Ver atlas/POST_VERIFICACION_MGNO_LAB.md y atlas/POST_VERIFICACION_SISIL_CRIA.md.
PUROS = ("canon.js", "sobres.js", "rating.js", "arena.js", "duelo.js", "mercado.js", "narragrafo.js", "cria.js", "genoma.js")  # T_CRT §8.1: el orquestador mini lo lee; ningun guion de la web lo pide aun
# La Arena (2026-09-28, «el mapa multi-jugador en una pestana»): se carga al abrir su pestana, detras del Army.
ARENA = ("sobres.js", "rating.js", "combate_ticks.js", "arena.js", "duelo.js", "sea-anchors.js", "crab_render_hd.js", "audio_feedback_manager.js", "crab_free_move.js", "genesis_tutorial.js", "buildings_toon.js", "reef_place_cards.js", "shell_schematics.js", "reef_buildings_paint.js", "latency_crystal.js", "hexelion_bench.js", "bubble_bestiary.js", "map_bubble_figures.js", "reef_corals.js", "reef_buildings_layer.js", "sea-crabs.js", "map_pointer_input.js", "semiotic_glyph.js", "hexelion_dictionary.js", "map_nodes_layer.js", "map_zoom.js", "piece_inspector.js", "vector_contract.js", "state_vector.js", "place_reading.js", "npc_territory_map.js", "map_integrity.js", "sea.js", "nodos-pesos.js",
         "node_reception_contract.js", "node_trust_anchor.js", "node_trust_manifest.js", "node_signature_messages.js", "node_signature_verify.js", "node_bindings_messages.js", "node_bindings.js", "node_projection.js", "nodos.js", "cuenta.js", "ui-nodos.js", "ui-rack.js", "node_preview.js", "node_file_receiver.js",
         "escuadron.js", "battle_choreography.js", "battle_replay.js", "npc_occupancy.js", "npc_walls.js", "ui-arena-comun.js", "combat_screen.js", "ui-arena.js", "ui-duelo.js")
# La CASA (2026-10-05): la primera pantalla, detras del Army. Lleva canon y escena, que la Arena reutiliza.
# C1+C2 (#264, 2026-10-23): editor Bubble y Paint se cargan con la Casa; ambos son modulos v1.5 a demanda.
CASA = ("canon.js", "tabla_semantica.js", "comic_tokens.js", "comic_atoms.js", "escena.js", "wave_render.js", "gdpr-art25-ephemeral-crab.js", "aiact-art50-crab-terminal.js", "nodos-cedulas.js", "fog_of_war.js", "isometric_floor_projection.js", "world_camera.js", "sea-floor.js", "sea_rift.js", "bubble_editor.js", "bubble_paint.js", "gdpr-art7-entry-choice.js", "aiact-art50-state-radio.js", "casa-medidas.js", "casa-personaliza.js", "casa-lateral.js", "crab_state_screen.js", "reef_building_lifecycle.js", "home_buildings.js", "summon-wave-card.js", "summon_reveal.js", "taller.js", "army-wave-panel.js", "ui-taller.js", "primer_eco.js", "summon-access.js", "deep_links.js", "hitl_firma.js", "onda_profunda.js", "tarjeta_cantada.js", "cable_llamar.js", "cable_terminal.js")
# El descenso (obra abku, 2026-10-18): los pide thegame.js por su lista DESCENSO, no con la casa.
DESCENSO = ("front_door.js", "silueta.js", "en301_practice_model.js", "en301_practice_arena.js", "en301_tutorial_copy.js", "en301_tutorial_model.js", "en301_tutorial_audio.js", "en301_tutorial.js", "deploy_building.js", "etiqueta.js", "en301_tutorial_building.js", "world_creator.js", "tutorial_fases.js", "ui-tutorial-fases.js", "comic_accents.js", "bubble_language.js", "bubble_light.js", "bubble_bestiary.js", "bubble_world.js", "bubble_letters.js", "bubble_game.js", "bubble_icons.js", "descent_sound.js", "local_app_bridge.js")
# VT6 (compuerta de lanzamiento): modulo puro, fuera de la puerta del juego; la pantalla aun no la carga.
VT6 = ("launch_gate.js",)
# J1 (estrella Hexelion capturable): modulo puro, fuera de la puerta; la mecanica aun no la carga el juego.
J1 = ("estrella_captura.js",)
# VT5 (tutorial F0-F3, #189 + pantallas): maquina de fases y pantallas; el cargador es el modo aparte de descent_view.
# VT5 y world_creator entran por la lista del descenso (thegame.js): grupo DESCENSO.
# VT2 (etiqueta 1 KB) y VT4 (silueta): modulos puros fuera de la puerta (registrados en main tras sus PR).
VT2_ETIQUETA = ()
VT4_SILUETA = ("silueta.js",)
# Visión Léxica Determinista (Plan Mode B, FIRMO 2026-10-20): proyector léxico < 1 KB, cargado por el Codex.
VISION_LEXICA = ("lexical_projector.js",)
# La creacion (E1+E2+E4): módulos cargados por creation.html, no por theGame.
CREACION = ("creation_package.js", "creation_feedback.js", "creation_flow.js")
CREATION_PAGE_DEPENDENCIES = CREACION + (
    "bubble_language.js", "comic_tokens.js", "comic_accents.js",
    "tabla_semantica.js", "bubble_editor.js", "bubble_paint.js",
)
# /aduana/ (Norte N3, 2026-10-26): el catalogo publico de cedulas, puro; solo lo carga la pagina /aduana/.
ADUANA = ("node_catalogue.js",)
# [W] O1a (2026-10-27): la escena del duelo de ondas, OSCURA: ninguna pagina la carga todavia (O1b la conecta y retira las
# caras viejas en la misma pieza). Por eso no entra al precache ni a ninguna pagina; la regla D7 lo exige asi.
W_O1A = ("wave_duel_scene.js",)
FUERA_DE_LA_PUERTA = tuple(sorted(set(PUROS + ARENA + CASA + DESCENSO + VT6 + J1 + VT2_ETIQUETA + VT4_SILUETA + VISION_LEXICA + ADUANA + W_O1A)))
# La cara del juego (2026-10-25) es su propia superficie en public/face/, fuera
# de la puerta: carga de una vez las piezas que usa, como creation.html. Se
# declaran aqui las suyas, leidas de sus paginas, y nada mas.
FACE_PAGE_DEPENDENCIES = tuple(sorted(set(re.findall(r'src="/game/([^"]+)"', (PUBLICO / "face" / "basic.html").read_text(encoding="utf-8")))))
# La portada (P3 [1d], decreto 2026-10-26) dibuja sus tres puertas en bubble language: carga UNA vez
# estas piezas de dibujo, y solo estas. Se DECLARAN aqui (no se leen de la pagina), asi la portada no
# puede ampliar la lista en silencio; test_web.Puerta exige que cargue exactamente esta lista.
LANDING_PAGE_DEPENDENCIES = ("tabla_semantica.js", "comic_tokens.js", "comic_accents.js", "comic_atoms.js",
                             "bubble_language.js", "bubble_letters.js")
# /aduana/ (Norte N2, 2026-10-26): el comprobador de cedulas, OBSERVANTE, carga la cadena de nodos y solo esa. Se
# DECLARA aqui; local_first_surface_build.ADUANA_SCRIPTS es la misma lista, y tests/aduana_page.test.mjs exige que
# coincidan.
ADUANA_PAGE_DEPENDENCIES = ("canon.js", "node_reception_contract.js", "node_trust_anchor.js", "node_trust_manifest.js",
                            "node_signature_messages.js", "node_signature_verify.js", "node_bindings_messages.js",
                            "node_bindings.js", "node_projection.js", "node_preview.js", "node_file_receiver.js",
                            "node_catalogue.js")



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
    MODULOS = ("valores.js", "gacha.js", "db.js", "core.js", "killswitch_dot.js", "ui-ficha.js", "ui-invoca.js", "ui.js", "juez.js", "z_cutoff.js")  # T: ui-ficha sale de ui

    def _js(self, nombre):
        return sin_comentarios(_fam(nombre, (self.JUEGO / nombre).read_text(encoding="utf-8")))

    def test_v15_cada_modulo_cabe_en_16_kb(self):
        """Instruccion 1 de la directiva: ningun modulo pasa de 16 KB."""
        presentes = sorted(q.name for q in self.JUEGO.glob("*.js"))
        self.assertEqual(presentes, sorted(self.MODULOS + FUERA_DE_LA_PUERTA + CREACION),
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

    def test_q1_wave_panel_contract_and_direct_tap(self):
        """Q1 reads the shared wave and verified Workshop receipt in one tap."""
        import subprocess
        r = subprocess.run(["node", str(RAIZ / "army_wave_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        ui = (PUBLICO / "game" / "ui-taller.js").read_text(encoding="utf-8")
        self.assertIn("AtlasArmyWavePanel.alToque(t, fichaDe)", ui)
        self.assertIn("AtlasIncubadora", ui)
        module = (PUBLICO / "game" / "army-wave-panel.js").read_text(encoding="utf-8")
        self.assertIn("I.army()", module)
        self.assertIn("V.semantica[k]", module)

    def test_q2_reveal_card_uses_wave_and_game_cycles(self):
        """Q2 exposes the exact spectrum at the reveal peak and routes to the existing Workshop."""
        import subprocess
        r = subprocess.run(["node", str(RAIZ / "summon_wave_card_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        reveal = (PUBLICO / "game" / "summon_reveal.js").read_text(encoding="utf-8")
        self.assertIn("cicloActual()", reveal)
        self.assertIn("transcurrido", reveal)
        self.assertNotRegex(reveal, r"\bDate\b|performance\.now|function cuadro\(ts\)")
        self.assertIn("AtlasRevelaFicha.personaliza()", reveal)
        card = (PUBLICO / "game" / "summon-wave-card.js").read_text(encoding="utf-8")
        self.assertIn("root.TheGame.ve('ondas')", card)
        self.assertIn(".taller-unido", card)

    def test_q3_summon_access_in_base_reuses_existing_buttons(self):
        """Q3 moves the existing summon controls to Base and exposes only measured costs/cap."""
        import subprocess
        r = subprocess.run(["node", str(RAIZ / "summon_access_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        source = (PUBLICO / "game" / "summon-access.js").read_text(encoding="utf-8")
        self.assertIn("getElementById('casa-estado')", source)
        self.assertIn("querySelector('#invoca-' + o.tc)", source)
        self.assertIn("insertBefore(card, target.firstChild)", source)
        self.assertIn("V.combate.tropas_max", source)

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
        # G0: se firma el ESLABON de la cadena (atlas.invocacion/2) y solo despues paga el motor.
        self.assertLess(ui.index("window.Identity.firmar(o)"), ui.index("window.AtlasJuego.invoca(TC.coste)"))
        for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage",
                       "sessionStorage", "indexedDB", "innerHTML", "http://", "https://"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, ui)
        capa = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")   # D7 (mudanza bloque 2, FIRMO 2026-10-11): el juego ENTRA en el precache: offline tras la primera visita.
        for m in self.MODULOS:
            with self.subTest(modulo=m):
                self.assertIn(f"['/game/{m}']", capa, f"la puerta no carga {m}")
                self.assertIn(f"/game/{m}", listas, f"{m} no esta en el precache")
                for h in PUBLICO.rglob("*.html"):
                    if h.parent.name == "face" and m in FACE_PAGE_DEPENDENCIES:
                        continue   # la cara es su propia superficie (2026-10-25)
                    if h == PUBLICO / "index.html" and m in LANDING_PAGE_DEPENDENCIES:
                        continue   # las puertas de la portada en bubble language (P3 [1d])
                    if h == PUBLICO / "aduana" / "index.html" and m in ADUANA_PAGE_DEPENDENCIES:
                        continue   # el comprobador de cedulas de /aduana/ (Norte N2)
                    self.assertNotIn(f"game/{m}", h.read_text(encoding="utf-8"))

    def test_creation_page_dependencies_are_precached(self):
        page = (PUBLICO / "creation.html").read_text(encoding="utf-8")
        lists = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        self.assertIn("/creation.html", lists)
        for module in CREACION:
            with self.subTest(module=module):
                self.assertIn(f"/game/{module}", page)
                self.assertIn(f"/game/{module}", lists)
        for module in ("bubble_language.js", "comic_tokens.js", "comic_accents.js",
                       "tabla_semantica.js", "bubble_editor.js", "bubble_paint.js"):
            with self.subTest(dependency=module):
                self.assertIn(f"/game/{module}", page)
                self.assertIn(f"/game/{module}", lists)

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
        # Limpieza 2026-10-12 (firmada): la mitad de la pestaña se retiro (solo despertaba con Suggest y envolvia
        # CADA funcion del motor). Queda lo puro: que no vuelva a envolver el motor ni a escuchar respuestas.
        for envoltura in ("Pa.anota = function", "M[k] = function", "MutationObserver"):
            with self.subTest(retirado=envoltura):
                self.assertNotIn(envoltura, j, "vuelve la mitad muerta del juez")
        self.assertIn("module.exports = AtlasJuez", j)
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
    IDS = ("casa", "mapa", "taller")
    PLIEGOS = ()
    ARMY = ("valores.js", "gacha.js", "db.js", "core.js", "killswitch_dot.js", "ui-ficha.js", "ui-invoca.js", "ui.js")

    def _capa(self):
        return sin_comentarios(self.CAPA.read_text(encoding="utf-8"))

    def test_u1_un_mapa_una_terminal_y_dos_hojas(self):
        """U1 + LA TERMINAL CHATBOT (FIRMO 2026-10-12): el MAPA es la pantalla; la interfaz vive en los bordes. Menu a la
        IZQUIERDA (unico hogar de cada panel, entradas sacadas de los paneles que existen), un CAJON que abre un panel cada
        vez (cerrado de salida: el centro limpio), TALLER y BATALLA como hojas sobre el mapa, Escape y Alt+M. Las zonas
        siguen repartiendo lo que pinta el motor (casa, mapa, taller), en ese orden."""
        c = self._capa() + (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        ids = re.findall(r"\['(\w+)', '\\u[0-9A-F]{4}", c)
        self.assertEqual(tuple(ids), self.IDS)
        for pieza in ("el('aside', 'thegame-terminal')", "cajon.hidden = true", "'pliego-estado', true", "el('nav', 'thegame-menu')",
                      "el('div', 'taller-unido')", "S.ZB = hoja('batalla', T('hoja_batalla'))", "'aria-expanded'",
                      ".setAttribute('aria-controls', 'thegame-ondas')", "classList.toggle('con-hoja', !!actual)",
                      "var siguiente = abierto === id ? null : id;", "e.key !== 'Escape'", "e.altKey && (e.key === 'm'",
                      "c.id = 'thegame-' + id + '-cierra'", "new MutationObserver(sincroniza)", "ordena();"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, c)
        for viejo in ("role', 'tab'", "aria-selected", "ArrowRight", "pes_casa", "pes_mapa"):
            with self.subTest(retirado=viejo):
                self.assertNotIn(viejo, c, "las pestanas vuelven")
        self.assertNotIn("innerHTML", c)
        lista = c[c.index("var PESTANAS"):c.index("var TECNICO")]
        for freno in ("thegame-piloto", "thegame-sugerencia", "thegame-juez", "thegame-cerrar"):
            with self.subTest(freno=freno):
                self.assertNotIn(freno, lista, "el piloto y su freno salen del cabecero")
        for l in LENGUAS_JUEGO:
            ui = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            for k in ["pes_taller", "hoja_mapa", "hoja_batalla", "pl_estado", "pl_lugares", "pl_entrada", "menu_aria", "menu_ancho",
                      "menu_opinar", "chat_aria", "chat_edad", "chat_vacio", "terminal_aria", "tecnico", "army_carga"] + [f"ayuda_{i}" for i in range(1, 8)]:
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
        # U1: el Army vive en la hoja del TALLER y se pide con la CASA (que se monta al ordenar) o al abrir el
        # Taller. Su peso sigue fuera de la puerta.
        c = c + (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")  # la terminal (hojas incluidas) salio a su modulo
        self.assertIn("PARTIDA = S.PARTIDA; MAPA = S.MAPA; muestra = S.muestra; pliego = S.pliego;\n    cargaCasa();", c)
        self.assertIn("if (actual === 'ondas') { Promise.resolve(x.alTaller()).then(mueveArmy); }", c)
        self.assertIn("casa = cargaArmy().then(function () { return pide(CASA); })", c)
        self.assertIn("S.ARMYZ = el('div', 'casa-army'); ond.appendChild(S.ARMYZ);", c)  # RONDA 1: el ARMY, no el Taller
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
        # Desde la terminal chatbot (2026-10-12) la capa tiene DOS hojas: thegame.css y terminal_menu_shell.css. La doctrina
        # (tokens sin hex, sin degradados ni desenfoques ni keyframes) vale para las dos.
        css = self.HOJA.read_text(encoding="utf-8") + (ASSETS / "terminal_menu_shell.css").read_text(encoding="utf-8")
        self.assertLessEqual(len(css.encode("utf-8")), TOPE_FICHERO)
        self.assertIn("'thegame.css'", self._capa())
        self.assertIn("'terminal_menu_shell.css'", self._capa())
        vivo = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        self.assertEqual(re.findall(r"#[0-9a-fA-F]{3,8}\b", vivo), [], "un color fuera de los tokens")
        for regla in (".thegame-hoja[hidden]{display:none}", "env(safe-area-inset-bottom)",
                      "@media (min-width:48rem)", ".thegame-piloto{display:contents}"):
            with self.subTest(regla=regla):
                self.assertIn(regla, vivo)
        for prohibido in ("gradient", "blur(", "@keyframes"):
            with self.subTest(prohibido=prohibido):
                self.assertNotIn(prohibido, vivo)
        listas = (PUBLICO / "sw.js").read_text(encoding="utf-8") + (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        # D7 (mudanza bloque 2, FIRMO 2026-10-11): el juego ENTRA en el precache: offline tras la primera visita.
        self.assertIn("/assets/thegame.css", listas, "la hoja de la capa no esta en el precache")
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
                con(m["defensa"], tropas=[tropa] * 11), con(m["defensa"], tropas=[dict(tropa, tc="tc9")]),
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
                if m in ARENA + CASA + DESCENSO + ADUANA:   # D7: lo que una pagina carga entra en el precache (ADUANA: /aduana/, Norte N3)
                    self.assertIn("/game/" + m, listas, f"{m} no esta en el precache")
                else:                   # los puros que nadie pide, tampoco al precache
                    self.assertNotIn("/game/" + m, listas, f"{m} entra en el precache sin que nadie lo pida")
                self.assertNotIn("../game/" + m, mundo.PIEZAS)
                for h in PUBLICO.rglob("*.html"):
                    if h.name == "creation.html" and m in CREATION_PAGE_DEPENDENCIES:
                        continue
                    if h.parent.name == "face" and m in FACE_PAGE_DEPENDENCIES:
                        continue
                    if h == PUBLICO / "index.html" and m in LANDING_PAGE_DEPENDENCIES:
                        continue   # las puertas de la portada en bubble language (P3 [1d])
                    if h == PUBLICO / "aduana" / "index.html" and m in ADUANA_PAGE_DEPENDENCIES:
                        continue   # el comprobador de cedulas de /aduana/ (Norte N2)
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
        # M18-B: las odds por rareza se SUMAN de la tabla de aristas que tira `tirada`, y la tabla entera se ensena.
        self.assertIn("ARISTAS[tc].forEach(function (x) { o[RAREZAS.indexOf(rarezaDe(x[0]))] += x[1]; });", gacha)
        self.assertIn("G.oddsAristas(tc)", ui)
        for l in LENGUAS_JUEGO:
            ui_t = json.loads((PUBLICO / f"atlas-{l}.json").read_text(encoding="utf-8"))["ui"]
            self.assertTrue(ui_t.get("odds_h", "").strip(), f"{l} sin el rotulo de las odds")



class Arena(unittest.TestCase):
    """La Arena: el mar multijugador, los lugares NPC, el combate en vivo con las tropas de onda y los duelos
    entre personas por paquetes firmados, con la regla de abandono (Soberano, 2026-09-28)."""

    def _js(self, nombre):
        return sin_comentarios(_fam(nombre, (PUBLICO / "game" / nombre).read_text(encoding="utf-8")))

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
        # U1: el mapa ES la pantalla: la Arena se pide en cuanto esta la casa, y su lienzo y mandos pasan al MAPA.
        self.assertIn("setTimeout(cargaArena, 0);", capa)
        self.assertIn("cada(ZM.querySelectorAll('.atlas-arena-mapa,.mapa-mandos,.mapa-aviso'), function (n) { MAPA.appendChild(n); });", capa)
        self.assertNotIn("'arena', '\\u2694", capa, "vuelve la pestana Battle")
        self.assertIn("arena = cargaCasa().then(function () { return pide(ARENA); })", capa, "la Arena sin su Army ni su casa")
        casa = capa[capa.index("var CASA"):capa.index("var TECNICO")]
        for m in CASA:
            with self.subTest(casa=m):
                self.assertIn(f"['/game/{m}']", casa)

    def test_los_textos_de_la_arena_existen_y_van_aparte(self):
        ar = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        juego = json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertLess((PUBLICO / "atlas-arena-en.json").stat().st_size, TOPE_FICHERO)
        for f in ("ui-arena.js", "ui-arena-comun.js", "ui-duelo.js", "sea.js"):
            for k in set(re.findall(r"T\('(\w+)'\)", self._js(f))):
                with self.subTest(fichero=f, clave=k):
                    self.assertTrue((ar.get(k) or juego.get(k) or "").strip(), f"{k} sin texto")
        for k in ("hoja_batalla", "arena_carga"):
            self.assertTrue(juego.get(k, "").strip())
        for l in LENGUAS_JUEGO:
            self.assertTrue((PUBLICO / f"atlas-arena-{l}.json").is_file(), f"la Arena sin textos en {l}")

    def test_la_arena_no_sale_a_la_red_ni_usa_el_azar_del_sistema(self):
        for f in ("escena.js", "sea.js", "ui-arena.js", "ui-arena-comun.js", "ui-duelo.js", "duelo.js", "rating.js"):
            c = self._js(f)
            for malo in ("Math.random", "localStorage", "indexedDB", "innerHTML", "sendBeacon", "WebSocket",
                         "RTCPeerConnection", "http://", "https://", "XMLHttpRequest", "Date."):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
            fetches = re.findall(r"fetch\(([^)]*)\)", c)
            # U0: los textos de la Arena se piden desde `ui-arena-comun.js` (lo comun), y solo desde ahi.
            self.assertEqual(fetches, ["'/atlas-arena-' + l + '.json'"] if f == "ui-arena-comun.js" else [], f)
        self.assertIn("window.crypto.getRandomValues(b)", self._js("ui-duelo.js"), "el r del commit-reveal sin azar real")
        self.assertIn("I.firmarTexto(t)", self._js("ui-duelo.js"))
        self.assertIn("window.AtlasArmy.verificaWeb", self._js("ui-duelo.js"))


class PuenteAppLocal(unittest.TestCase):
    def test_puente_app_local_casos(self):
        """La consulta local solo sale tras accion; indisponibilidad queda como NO_DATA con causa."""
        r = subprocess.run(["node", str(RAIZ / "local_app_bridge_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])


class PrecacheDelJuego(unittest.TestCase):
    """D7 (mudanza bloque 2, FIRMO 2026-10-11): el juego entra en el precache y se juega SIN RED tras la
    primera visita. El oraculo: la lista JUEGO de sw-listas.js contiene TODO lo que thegame.js carga (sus
    listas y lo que pide a demanda), y todo existe. Lo que es MEDIDA (atlas-mundo, atlas-record) sigue
    fuera: sin red se dice NO_DATA, no una cifra vieja con cara de fresca."""

    def test_juego_contiene_todo_lo_que_la_puerta_carga(self):
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        pide = set()
        for m in re.finditer(r"\['([^']+\.js)'(?:,\s*'[^']*')?\]", tg):
            r = m.group(1); pide.add(r if r.startswith("/") else "/assets/" + r)
        for c in re.findall(r"'([\w.-]+\.css)'", tg):
            pide.add("/assets/" + c)
        pide |= {"/assets/atlas-hud.js", "/assets/atlas-opina.js", "/assets/atlas-voz.js", "/game/home.css"}
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        juego = set(re.findall(r"'(/(?:game|assets)/[\w.-]+)'", listas[listas.index("const JUEGO"):listas.index("];", listas.index("const JUEGO"))]))
        self.assertEqual(sorted(pide - juego), [], "lo que la puerta carga y el precache no guarda")
        for r in juego:
            with self.subTest(ruta=r):
                self.assertTrue((PUBLICO / r.lstrip("/")).is_file(), f"{r} no existe")

    def test_lo_que_es_medida_sigue_fuera(self):
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        for medida in ("/atlas-mundo.json", "/atlas-record.json"):
            with self.subTest(medida=medida):
                self.assertNotIn(medida, listas[listas.index("const JUEGO"):])


class TerminalCangrejo(unittest.TestCase):
    """J7 (plan de ronda 2026-10-11): el cangrejo toca SOLO las acciones del enum y el MOTOR decide.
    Una sola puerta (AtlasJuego.aplica); ni una regla de juego en el terminal; nada sale de la pestana."""

    def _js(self):
        return sin_comentarios((PUBLICO / "game" / "aiact-art50-crab-terminal.js").read_text(encoding="utf-8"))

    def test_una_sola_puerta_y_ninguna_regla(self):
        t = self._js()
        self.assertIn("J.aplica(a)", t)
        for malo in ("AtlasMotor", "M.reparar", "M.recoger", "M.ciclo", ".cobre -", "fetch", "localStorage", "indexedDB",
                     "Math.random", "Date", "sendBeacon", "XMLHttpRequest", "innerHTML"):
            with self.subTest(malo=malo):
                self.assertNotIn(malo, t)

    def test_el_enum_es_el_del_piloto(self):
        tp = (PUBLICO / "assets" / "atlas-piloto.js").read_text(encoding="utf-8")
        enum = re.search(r"var ACCIONES = (\[[^\]]*\])", tp).group(1)
        self.assertIn("var ACCIONES = " + enum + ";", self._js(), "el terminal y el piloto no comparten el enum")

    def test_la_linea_dice_lo_que_respondio_el_motor(self):
        js = ("const T=require('./public/game/aiact-art50-crab-terminal.js');"
              "const a=T.accion('reparar');const b=T.accion('bajar_a','ruinas');"
              "process.stdout.write(JSON.stringify({f:T.linea(a,{resultado:'fallo',tipo:'reparar',mision:'grieta-120',profundidad:'50-150'}),"
              "n:T.linea(a,null),b:b,v:T.variables(null),m:T.variables({ciclo:204,integridad:80,profundidad:'50-150',"
              "grieta:{abierta:false,cierre:110},recursos:{luz:9,biomasa:7,flujo:2,cobre:3}})}))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertIn("Result: fallo", d["f"]); self.assertIn("NO_DATA", d["n"]); self.assertIn("NO_DATA", d["v"])
        self.assertIn("110 cycles", d["m"]); self.assertNotIn('{"', d["m"]); self.assertNotIn('{"', d["f"])
        self.assertEqual(d["b"], {"esquema": "atlas.accion/1", "accion": "bajar_a", "origen": "humano", "banda": "ruinas"})


class EntradaCangrejo(unittest.TestCase):
    """J8 (joya firmada 2026-10-11): al entrar se elige mar abierto o un nodo y se VEN sus reglas, que
    salen de las cedulas (lo medido), no de un texto a mano. Sin ventaja: ni motor ni combate."""

    def _js(self):
        return sin_comentarios((PUBLICO / "game" / "gdpr-art7-entry-choice.js").read_text(encoding="utf-8"))

    def test_sin_ventaja_y_sin_salida(self):
        t = self._js()
        for malo in ("AtlasArena", "combate", "AtlasMotor", "aplica", "fetch", "localStorage", "indexedDB", "Math.random", "Date", "innerHTML"):
            with self.subTest(malo=malo):
                self.assertNotIn(malo, t)
        self.assertIn("Y.cajaWeb('atlas-entrada'", t, "la eleccion se guarda por db.js, la unica puerta")

    def test_las_reglas_salen_de_las_cedulas(self):
        js = ("const C=require('./public/game/nodos-cedulas.js');const E=require('./public/game/gdpr-art7-entry-choice.js');"
              "const ced=C.CEDULAS||C;process.stdout.write(JSON.stringify({t:E.territorios(ced),h:E.reglas('nodo.0.hexelion',ced),"
              "m:E.reglas(E.MAR,ced),x:E.reglas('nodo.9.nadie',ced)}))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual(d["t"][0], "mar-abierto")
        self.assertIn("nodo.0.hexelion", d["t"])
        self.assertIn("no admin", d["h"]["no_puedes"][0], "sin admin nadie acepta: se dice")
        self.assertTrue(any(m.startswith("ram_mib: 58980") for m in d["h"]["medidas"]))
        self.assertIsNone(d["x"], "un nodo que no esta en las cedulas no se inventa")


class RadioDelEstado(unittest.TestCase):
    """J2+J9 (plan de ronda 2026-10-11): la melodia ES el estado (pentatonica, determinista, con huella);
    el boletin sale SOLO de la instantanea; suena por la sintesis de core.js; voces solo locales."""

    def _js(self):
        return sin_comentarios((PUBLICO / "game" / "aiact-art50-state-radio.js").read_text(encoding="utf-8"))

    def test_pureza_y_una_sola_sintesis(self):
        t = self._js()
        for malo in ("fetch", "localStorage", "indexedDB", "Math.random", "Date", "new AudioContext", "createOscillator", "innerHTML", "AtlasMotor", "aplica"):
            with self.subTest(malo=malo):
                self.assertNotIn(malo, t)
        self.assertIn("S.suena({", t)
        self.assertIn("v.localService", t, "el locutor solo con voces locales")

    def test_ni_un_fichero_de_audio_en_public(self):
        """Cero assets binarios de sonido: todo es sintesis (sabotaje: un .mp3 aqui da rojo)."""
        malos = [str(p.relative_to(PUBLICO)) for p in PUBLICO.rglob("*") if p.suffix.lower() in (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".opus")]
        self.assertEqual(malos, [])

    def test_misma_instantanea_misma_melodia_y_mismo_boletin(self):
        js = ("const R=require('./public/game/aiact-art50-state-radio.js');"
              "const i={esquema:'atlas.instantanea/1',ciclo:12,fase:1,nivel_nucleo:3,profundidad:'50-150',"
              "recursos:{luz:4,biomasa:3,cobre:2,flujo:0,oxigeno:290},integridad:110,integridad_max:117,grieta:{abierta:true,cierre:0}};"
              "const sin={esquema:'atlas.instantanea/1',recursos:{cobre:1}};"
              "process.stdout.write(JSON.stringify({g:R.guion(i),g2:R.guion(JSON.parse(JSON.stringify(i))),b:R.boletin(i),h:R.huella(i),"
              "nada:R.boletin(null),falta:R.boletin(sin),penta:R.PENTA,base:R.BASE_HZ}))")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual(d["g"], d["g2"])
        self.assertEqual(len(d["g"]), 8)
        import math
        for f in d["g"]:
            semis = round(12 * math.log2(f / d["base"])) % 12
            self.assertIn(semis, d["penta"], f"{f} Hz no es de la pentatonica")
        self.assertIn("Copper 2", d["b"]); self.assertIn("The rift is open.", d["b"])
        self.assertIn("NO_DATA", d["nada"]); self.assertIn("NO_DATA", d["falta"], "lo que falta no se inventa")
        self.assertEqual(d["h"], "a2ba1cd90687f786286735323da3a3aecb5d4885c5d2e4edce92d9bab45c7786", "la huella de la melodia y el boletin cambio: el estado suena distinto")

    def test_incomplete_snapshot_has_cause_and_schedules_no_audio(self):
        js = ("const R=require('./public/game/aiact-art50-state-radio.js');"
              "const i={esquema:'atlas.instantanea/1',recursos:{cobre:1}};"
              "const calls=[]; global.AtlasSintesis={activa:x=>calls.push('active'),suena:x=>calls.push('play')};"
              "global.setTimeout=(f)=>{calls.push('timer')};"
              "process.stdout.write(JSON.stringify({g:R.guion(i),h:R.huella(i),c:R.causaGuion(i),t:R.toca(i),calls}));")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        d = json.loads(r.stdout)
        self.assertIsNone(d["g"])
        self.assertIsNone(d["h"])
        self.assertIn("integridad", d["c"])
        self.assertIn("oxigeno", d["c"])
        self.assertIn("grieta.abierta", d["c"])
        self.assertIsNone(d["t"])
        self.assertEqual(d["calls"], [])

    def test_nonfinite_and_invalid_integrity_are_rejected(self):
        js = ("const R=require('./public/game/aiact-art50-state-radio.js');"
              "const base={esquema:'atlas.instantanea/1',integridad:1,integridad_max:1,fase:0,nivel_nucleo:0,"
              "recursos:{cobre:0,biomasa:0,luz:0,oxigeno:0},grieta:{abierta:false}};"
              "const cases=[{...base,recursos:{...base.recursos,cobre:NaN}},"
              "{...base,integridad:1e308,integridad_max:1e-308},{...base,integridad_max:0}];"
              "process.stdout.write(JSON.stringify(cases.map(i=>({g:R.guion(i),c:R.causaGuion(i)}))));")
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, cwd=RAIZ.parent)
        self.assertEqual(r.returncode, 0, r.stderr)
        cases = json.loads(r.stdout)
        self.assertEqual(len(cases), 3)
        for case in cases:
            with self.subTest(cause=case["c"]):
                self.assertIsNone(case["g"])
                self.assertIn("NO_DATA:", case["c"])


class Conquista(unittest.TestCase):
    """Conquista (FIRMO del Soberano, 2026-10-10): ganar a un lugar NPC lo deja CONQUISTADO en este aparato.
    Se guarda por db.js (la unica puerta de almacenamiento), se ve en la lista y en el mapa con su sello
    LOCAL · practica, y NO da rating, ni botin, ni entra en el combate."""

    def _js(self, nombre):
        return sin_comentarios(_fam(nombre, (PUBLICO / "game" / nombre).read_text(encoding="utf-8")))

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
        self.assertIn("arena_conquistado", self._js("sea.js"))

    def test_q6_mensajes_y_mantenimiento_firmados_con_decaimiento_ciclico(self):
        r = subprocess.run(["node", str(RAIZ / "npc_occupancy_cases.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual(d["ciclos_mantenimiento"], 900)
        self.assertEqual(d["fallos"], [])
        ui = self._js("ui-arena.js")
        mar = self._js("sea.js")
        self.assertIn("AtlasNpcTerritoryMap", self._js("npc_territory_map.js"))
        inspector = self._js("piece_inspector.js")
        self.assertIn("AtlasNpcWalls.captura(l.id, cicloJuego())", ui)
        self.assertIn("Declared defenses", inspector)
        self.assertIn("mapaOcupacion.mensaje(g, l, f, rotulo, p, r, dpr)", mar)
        self.assertIn("AtlasNpcWalls.estado(id, cicloJuego(), pub)", ui)
        self.assertIn("/game/npc_occupancy.js", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"))
        self.assertIn("/game/npc_walls.js", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"))
        self.assertIn("/game/npc_territory_map.js", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"))


class TopeEquipo(unittest.TestCase):
    def test_q7_tope_de_diez_esquemas_tutorial_y_pruebas_de_render(self):
        r = subprocess.run(["node", str(RAIZ / "team_cap_casos.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        d = json.loads(r.stdout)
        self.assertEqual((d["cap"], d["schemas"], d["tutorial"], d["fallos"]), (10, 2, True, []))
        self.assertIn("tropas_max: 10", (PUBLICO / "game" / "valores.js").read_text(encoding="utf-8"))


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
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))

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

    def test_las_partes_del_cangrejo_son_un_riel_con_su_medida_o_no_data(self):
        """U1 (contrato «el mapa unico»): las partes dejan de flotar sobre el cuerpo (la escena lateral se RETIRA
        ENTERA) y son un RIEL de botones al borde de la terminal: `#parte-<id>`, `.casa-lateral-parte`,
        `data-parte`, nombre en texto y su cifra MEDIDA o NO_DATA, aria-label real, foco itinerante con flechas."""
        r = self._js("casa-lateral.js")
        for pieza in ("b.id = 'parte-' + e[0]", "b.dataset.parte = e[0]", "el('button', 'casa-lateral-parte')",
                      "b.setAttribute('aria-label', ctx.T('parte_' + e[0]) + ' \u00b7 '", "m ? m.txt : 'NO_DATA'",
                      "ArrowDown: 1, ArrowUp: -1", "R.b[e[0]].tabIndex = k === i ? 0 : -1", "c.entra(e[0])"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, r)
        b = self._js("home_buildings.js")
        self.assertIn("J.instantanea()", b, "la cifra no sale del estado del juego")
        self.assertIn("AtlasCasaLateral.monta(R.est, { T: T, medidas: medidas, entra: entra })", b)
        self.assertFalse((PUBLICO / "game" / "home_base_scene.js").exists(), "la escena lateral vuelve")
        for viejo in ("anclas", "pintaPartes", "'casa-parte'", "paleta: ["):
            with self.subTest(retirado=viejo):
                self.assertNotIn(viejo, sin_comentarios(b), "la escena lateral vuelve como codigo muerto")
        css = (PUBLICO / "game" / "home.css").read_text(encoding="utf-8")
        for viejo in ("casa-escena", "casa-edificio", ".casa-parte{"):
            self.assertNotIn(viejo, css)
        self.assertIn("min-height:3rem", css.split("#thegame .casa-lateral-parte{")[1].split("}")[0], "parte de menos de 48 px")
        tx = json.loads((PUBLICO / "atlas-casa-en.json").read_text(encoding="utf-8"))["ui"]
        for k in set(re.findall(r"T\('(\w+)'\)", b + r)):
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), f"{k} sin texto")
        for i in ("caparazon", "pinzas", "patas", "ojos"):
            self.assertTrue(tx.get("parte_" + i), i)
        for i in ("nucleo", "army", "bosque", "faro"):
            self.assertTrue(tx.get("nd_" + i), i)

    def test_la_onda_se_traza_fiel_y_la_invocacion_se_revela(self):
        o = self._js("wave_render.js")
        self.assertIn("G.punto(arm, i / n * TAU)", o, "la figura no sale de los armonicos de la gacha")
        self.assertIn("globalCompositeOperation = 'lighter'", o)
        self.assertIn("var peso = Math.max(0, Math.min(1, c * n - j))", o, "no nace armonico a armonico")
        self.assertIn("if (window.AtlasRevela) { window.AtlasRevela.muestra(t, window.AtlasTallerUI.aterriza(R.eclosion)); }", self._js("ui.js"))
        self.assertIn("prefers-reduced-motion: reduce", self._js("summon_reveal.js"))


class MapaMovible(unittest.TestCase):
    """El mapa global se arrastra hasta chocar con la niebla (Soberano, 2026-10-05): empieza en tu casa,
    se mueve con el dedo, el raton, las flechas y botones grandes; la niebla sale de lo MEDIDO y es el
    limite fisico de la camara. Terreno por teselas, sin azar ni red."""

    def _js(self, n):
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))

    def test_casos_de_la_camara_y_la_niebla(self):
        r = subprocess.run(["node", str(RAIZ / "camara_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 7, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])

    def test_se_mueve_con_dedo_teclado_y_botones_y_dice_el_choque(self):
        # LEY DEL SUELO, paso 2 (2026-10-12): el dedo y las teclas salieron a `map_pointer_input.js`; el mapa lo monta.
        m = self._js("sea.js") + self._js("map_pointer_input.js")
        for pieza in ("addEventListener('pointerdown'", "setPointerCapture", "addEventListener('keydown'", "ArrowLeft",
                      "x.setAttribute('aria-label', f.texto('mapa_' + d))", "aviso.setAttribute('role', 'status')",
                      "J.aplica(a)", "accion: 'mover'", "window.AtlasPiloto.DIRS",
                      "f.texto('mapa_niebla')", "f.texto(casa ? 'mapa_en_casa' : 'mapa_sin_casa')", "C.arrastra(x.cam(),", "quieto()",
                      "window.AtlasMapaDedo.monta(", "C.aMundoDelta("):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, m)
        dedo = self._js("map_pointer_input.js")
        libre = self._js("crab_free_move.js")
        self.assertNotIn("wasd", dedo.lower())
        self.assertIn("north: [0, -1]", libre)
        self.assertIn("west: [-1, 0]", libre)
        self.assertIn("data-voice-control", libre)
        tx = json.loads((PUBLICO / "atlas-arena-en.json").read_text(encoding="utf-8"))["ui"]
        piloto = (PUBLICO / "assets" / "atlas-piloto.js").read_text(encoding="utf-8")
        dirs = json.loads(re.search(r"var DIRS = (\[[^\]]*\])", piloto).group(1).replace("'", '"'))
        for k in ["mapa_" + d for d in dirs] + ["mapa_niebla", "mapa_en_casa", "mapa_sin_casa", "mapa_medido"]:
            with self.subTest(clave=k):
                self.assertTrue(tx.get(k), k)
        self.assertIn("Fog", tx["mapa_niebla"])

    def test_sin_azar_ni_red_y_por_teselas(self):
        for f in ("fog_of_war.js", "world_camera.js", "sea.js", "sea-floor.js", "map_pointer_input.js", "isometric_floor_projection.js"):
            c = self._js(f)
            for malo in ("Math.random", "localStorage", "fetch(", "Date."):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
        self.assertIn("function tesela(i, j)", self._js("sea-floor.js"))
        self.assertIn("if (nt >= TOPE) { suelta(tierra); nt--; }", self._js("sea-floor.js"), "la cache de teselas no esta acotada")
        # MEDIDO en el Doogee (2026-10-13): la caja visible del rombo son 132 teselas; un tope por debajo, o vaciar la cache
        # entera, la rehace cada cuadro (2,7 fps). El tope cubre lo visible con holgura y el rombo fuera de pantalla no se pide.
        tope = int(re.search(r"var TOPE = (\d+);", self._js("sea-floor.js")).group(1))
        self.assertGreaterEqual(tope, 2 * 132 * 3 // 4, "la cache no cabe lo que se ve: se rehace cada cuadro")
        self.assertIn("{ continue; }", self._js("sea-floor.js"), "las teselas fuera de pantalla vuelven a pedirse")



    def test_p9_casos_del_polvo_de_taller(self):
        """P9 (firmado 2026-10-11): residuo por aristas, lijar sin tocar aristas, cadena de recibos que se comprueba
        entera, el Army solo suelta con recibo firmado por quien adopto, y lo lijado solo cuenta en practica.
        P10: tenir a la bandera es otra operacion de la cadena, de la paleta CERRADA, y no toca el combate."""
        r = subprocess.run(["node", str(RAIZ / "taller_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 12, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("window.AtlasTallerUI.monta(PANEL.taller)", tg)
        self.assertIn("var TL = enNode ? require('./taller.js') : raiz.AtlasTaller;", (PUBLICO / "game" / "arena.js").read_text(encoding="utf-8"))

    def test_g0_la_cadena_de_invocaciones_y_el_huevo_que_vuelve(self):
        """G0 (aceptada por el Soberano, 2026-10-11): cada invocacion es un eslabon firmado (seq + prev), guardado en el
        aparato con sus huevos. Dos bugs medidos dentro: recargar cobraba el cobre y devolvia 0 huevos (vivian en
        memoria), y `tic()` salia siempre con `!capa.open` (la capa dejo de ser un <dialog>): nada eclosionaba."""
        r = subprocess.run(["node", str(RAIZ / "g0_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 8)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        e = json.loads(subprocess.run(["node", "-e", "console.log(JSON.stringify(require('./public/game/db.js').eslabon([], 'tc1', 'a'.repeat(64))))"],
                                      cwd=RAIZ.parent, capture_output=True, text=True, timeout=60).stdout)
        try:
            import jsonschema
            v = jsonschema.Draft202012Validator(json.loads((DATOS / "atlas_invocacion_schema.json").read_text(encoding="utf-8")))
            self.assertEqual([x.message for x in v.iter_errors(e)], [], "el eslabon que se firma no cumple su contrato")
        except ImportError:
            pass
        u = self._js("ui.js")
        for pieza in ("var o = A.eslabon(c, tc, Z.clave);", "window.Identity.firmar(o)", "A.cadenaWeb(Z.clave).pon(Z.cadena);",
                      "var next = A.anexa(Z.cadena, o, f.firma, semilla, desde, desde + TC.incuba);",
                      "A.verificaCadena(c, pub, A.verificaWeb, A.semillaWeb)", "Z.huevos = Z.cadena ? A.huevos(Z.cadena) : [];",
                      "Z.cadena = A.abre(Z.cadena, h.seq)", "if (!capa || !capa.isConnected || document.hidden) { return; }"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, u)
        # G5b measures transaction completion and rapid requests behaviorally.
        # The former substring guard accepted fire-and-forget writes before success.
        r = subprocess.run(["node", "--test", "tests/invocation_persistence.test.mjs"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        for viejo in ("capa.open", "atlas.invocacion/1", "n += 1"):
            with self.subTest(retirado=viejo):
                self.assertNotIn(viejo, u)

    def test_gacha_honesto_odds_piedad_y_cronica(self):
        """Piezas 4, 1+2 y 3 (FIRMO): el leviatan de cada capsula, junto al boton y ANTES del gesto, sale de la MISMA tabla
        que tira (R5 medida: 1,4-3,6 %); la piedad sale de TU cadena G0 (hueco = NO_DATA) y su garantia, sin numero
        firmado, es NO_DATA; la cronica reutiliza la espiral de los escuadrones (la misma funcion, sin copiarla)."""
        u, f = self._js("ui.js"), self._js("ui-ficha.js")
        self.assertIn("var lev = G.oddsAristas(tc).reduce(function (a, x) { return a + (x[0] > 12 ? x[1] : 0); }, 0);", u)
        self.assertIn("b.id = 'invoca-' + tc;", u)
        self.assertIn("if (R.cron) { cronica(R.cron, Z.cadena, Z.causa); }", u)
        self.assertIn("A.piedad(cadena, function (e) { return G.tirada(e.semilla, e.obj.tc).rareza; })", f)
        self.assertIn("E.sitios(l.length, 'atlas.cronica', null)", f)
        for gemelo in ("Math.sqrt(5)", "137.5", "AUREO"):
            with self.subTest(gemelo=gemelo):
                self.assertNotIn(gemelo, f, "la cronica copia la espiral en vez de reutilizarla")
        r = subprocess.run(["node", "-e", "const G=require('./public/game/gacha.js');console.log(JSON.stringify(Object.keys(G.TCS).map(t=>G.oddsAristas(t).reduce((a,x)=>a+(x[0]>12?x[1]:0),0))))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        for por_mil in json.loads(r.stdout):
            self.assertTrue(14 <= por_mil <= 36, f"leviatan {por_mil} por mil fuera de la cifra medida y firmada (1,4-3,6 %)")
        ui = json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]
        self.assertIn("NO_DATA", ui["garantia_nd"], "la garantia sin cifra firmada se inventa un numero")
        for k in ("inc_leviatan", "piedad_t", "cronica_h", "cronica_item"):
            self.assertTrue(ui.get(k, "").strip(), k)

    def test_t_la_ficha_sale_de_ui_sin_gemelos(self):
        """T (troceo, PROPUESTA pendiente de FIRMO: ui.js es intocable): la ficha de la tropa (lienzo, traza, nombre,
        ficha, voz) vive SOLO en `ui-ficha.js`; `ui.js` la ata en `monta` y deja sitio a G0. Sin gemelos."""
        u, f = self._js("ui.js"), self._js("ui-ficha.js")
        for fn in ("function lienzo(", "function traza(", "function nombre(", "function ficha(", "function oye("):
            with self.subTest(funcion=fn):
                self.assertIn(fn, f)
                self.assertNotIn(fn, u, "gemelo en ui.js")
        self.assertIn("var F = window.AtlasFicha.crea({ G: G, A: A, S: S, T: T, el: el, boton: boton, rellena: rellena, dice: dice });", u)  # piezas 1+2/3: A para la piedad
        # G0 uso el sitio que gano T (16.355 -> 12.947 -> 14.623 B): queda al menos 1 KiB de margen bajo el techo.
        self.assertLess(len((PUBLICO / "game" / "ui.js").read_bytes()), 16384 - 1024, "ui.js vuelve a rozar su techo")
        c = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertLess(c.index("['/game/ui-ficha.js']"), c.index("['/game/ui.js']"), "la ficha carga despues de quien la usa")

    def test_u2_los_cangrejos_viven_en_el_mapa_y_vibran_con_el_estado(self):
        """U2 (contrato «el mapa unico» + projectM: «aqui el PCM es el estado»): tu cangrejo vive EN el mapa, con el
        paseo de J1 (no uno propio) proyectado bajo la casa (x = casa.x + (paseo.x - 0.5)*2*R, R = 140); el emblema
        suelto se retira. Vibra con la nota de su radio y, sin senal, NO baila. Los otros, con lo que se sabe de
        ellos: quietos (ciclo 0) y con el cuerpo en niebla, solo en lo despejado. Sin red ni azar."""
        r = subprocess.run(["node", "-e", """
          const M = require('./public/game/sea-crabs.js');
          const s = M.sitio({ x: 1000, y: 500 }, 0.75);
          const v = [0, 137, 300, 777].map((ms) => M.vibra([220, 330, 440], ms));
          console.log(JSON.stringify({ R: M.R, s, nulo: M.vibra(null, 500), vacio: M.vibra([], 500), v, otra: M.vibra([220, 330, 440], 137) }));
        """], cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        d = json.loads(r.stdout)
        self.assertEqual(d["R"], 140)
        self.assertEqual(d["s"], {"x": 1070, "y": 534}, "la linea bajo la casa no es la del contrato")
        self.assertEqual((d["nulo"], d["vacio"]), (0, 0), "sin senal del estado el cangrejo baila igual")
        self.assertEqual(d["v"][1], d["otra"], "el temblor no es determinista")
        self.assertTrue(any(abs(x) > 0.1 for x in d["v"]), "con senal no vibra")
        c = self._js("sea-crabs.js")
        for pieza in ("CJ.paseo(cj.semilla, cj.ciclo", "C.cangrejo()", "Ra.guion(J.instantanea())",
                      "{ semilla: j.de, ciclo: 0,", "cuerpo: CJ.cuerpo(null) }", "N.niebla(c.x, c.y, o.circ || []) > 0.5",
                      "g.ellipse(", "N.HEX.y + MAR_ABIERTO"):
            with self.subTest(pieza=pieza):
                self.assertIn(pieza, c)
        for malo in ("Math.random", "Date.now", "fetch(", "shadowBlur", "function paseo("):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, c)
        m = self._js("sea.js")
        self.assertIn("window.AtlasMarCangrejos.pinta(g, P,", m)
        self.assertNotIn("E.figura(g, em.armonicos, yo[0], yo[1]", m, "vuelve el emblema suelto sobre la casa")
        cj = self._js("gdpr-art25-ephemeral-crab.js")
        self.assertIn("function paseo(semilla, ciclo, f)", cj, "J1: el paseo cambia de firma")

    def test_u1_el_faro_es_un_destino_y_hay_un_solo_fight(self):
        """U1 (contrato «el mapa unico»): UNA lista de destinos de camara. Los ojos llevan al Faro (Hexelion) y ese
        destino existe igual en el piloto, en la terminal del cangrejo, en el esquema y en la camara del mapa:
        si falta en uno, el humano y el silicio ya no ven el mismo juego. Y «Fight» es UNA via (estaba en la
        ficha del lugar y en la del rival): un solo boton, con id estable, que abre la hoja de batalla."""
        dirs = []
        for f in (ASSETS / "atlas-piloto.js", PUBLICO / "game" / "aiact-art50-crab-terminal.js"):
            m = re.search(r"var DIRS = \[([^\]]*)\]", f.read_text(encoding="utf-8"))
            dirs.append(tuple(re.findall(r"'(\w+)'", m.group(1))))
        esq = json.loads((RAIZ.parent / "data" / "atlas_accion_schema.json").read_text(encoding="utf-8"))
        dirs.append(tuple(esq["properties"]["dir"]["enum"]))
        self.assertEqual(len(set(dirs)), 1, f"los destinos no coinciden: {dirs}")
        self.assertIn("faro", dirs[0])
        mar = self._js("sea.js")
        self.assertIn("if (d === 'faro') { C.planea(cam, N.HEX.x, N.HEX.y, circ, quieto());", mar, "la camara no PLANEA al Faro (F357)")
        self.assertNotRegex(mar, r"cam\.[xy] = ", "la camara vuelve a teletransportarse (F357)")
        self.assertIn("faro: '\u25c8'", mar, "el mando del Faro sin icono")
        med = self._js("casa-medidas.js")
        self.assertIn("['ojos', '\u25c8', 'faro', 'faro']", med, "los ojos no abren la puerta del Faro")
        hb = self._js("home_buildings.js")
        self.assertIn("accion: 'mover', dir: 'faro', origen: 'humano'", hb, "los ojos no mueven la camara por la via del piloto")
        ar = self._js("ui-arena.js")
        self.assertEqual(ar.count("T('arena_luchar')"), 1, "«Fight» vuelve a salir en dos sitios")
        self.assertIn("b.id = 'arena-lucha';", ar)
        # El boton sale de un bucle sobre DOS fichas (lugar y rival): una sola aparicion en la fuente no basta; el
        # corte de la ficha del rival (i = 1) tiene que ir justo antes del boton (sabotaje medido: sin el, verde).
        self.assertIn("      if (i) { return; }\n      var b = boton('\\u2694\\uFE0E ' + (sel.npc ? T('arena_luchar')", ar,
                      "«Fight» vuelve a pintarse en la ficha del rival")
        # P2 (2026-10-26): el boton y cada combate entran por la PANTALLA de combate (combat_screen.js), que
        # muestra la hoja de batalla en su propia ruta; sin ella, la hoja de siempre como reserva.
        self.assertIn("b.addEventListener('click', function () { pantalla(null); pelea(); });", ar)
        self.assertIn("if (S) { S.entra({ alSalir: alSalir }); } else if (window.TheGame && window.TheGame.ve) { window.TheGame.ve('batalla'); }", ar)
        self.assertIn("if (actual) { actual.para(); }\n    var aplicado = false", ar)

    def test_u0_los_troceos_son_una_puerta_sin_gemelos(self):
        """U0 («el mapa unico»): home_buildings, ui-arena y thegame se parten ANTES de tocarlos. Lo que sale vive en
        UN sitio: la lista de partes en casa-medidas.js (pura), «Customize» en casa-personaliza.js, lo comun de la
        Arena en ui-arena-comun.js; y el camino muerto del <dialog> no vuelve. Ningun fichero del juego pasa de 16 KiB."""
        g = lambda n: sin_comentarios((PUBLICO / "game" / n).read_text(encoding="utf-8"))
        hb, ua = g("home_buildings.js"), g("ui-arena.js")
        for gemelo, f in (("['caparazon', '", hb), ("function grupo(", hb), ("function personaliza() {\n    var d", hb),
                          ("function miniLienzo(", ua), ("function textos(", ua), ("function colores(", ua)):
            with self.subTest(gemelo=gemelo[:24]):
                self.assertNotIn(gemelo, f, "el troceo dejo un gemelo")
        self.assertIn("var CM = raiz.AtlasCasaMedidas, PARTES = CM.PARTES, DENTRO = CM.DENTRO;", hb)
        self.assertIn("raiz.AtlasCasaPersonaliza.abre(", hb)
        self.assertIn("var AC = window.AtlasArenaComun", ua)
        r = subprocess.run(["node", "-e", "const M=require('./public/game/casa-medidas.js');const T=k=>k+'{n}';"
                            "const s={nivel_nucleo:3,recursos:{biomasa:5,oxigeno:9}};const a=M.medidas(s,2,null,T),b=M.medidas(null,null,null,T);"
                            "process.stdout.write(JSON.stringify([M.PARTES.map(p=>p[0]),a.nucleo.nivel,a.bosque.nivel,a.army.nivel,a.faro,b.nucleo,b.army]))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(json.loads(r.stdout), [["caparazon", "pinzas", "patas", "ojos"], 3, 2, 2, None, None, None], r.stderr)
        # El techo de 16 KiB por fichero manda, salvo una entrada en EXCEPCIONES.md cuya HUELLA coincida con el fichero
        # de hoy (regla del Soberano, 2026-10-12: «si cruza, EXCEPCIONES.md con huella y causa, no silencio»). Si el
        # fichero cambia, la huella deja de coincidir y vuelve el rojo hasta renovar la entrada o trocearlo.
        exc = (RAIZ.parent / "EXCEPCIONES.md")
        exc = exc.read_text(encoding="utf-8") if exc.exists() else ""
        for f in sorted((PUBLICO / "game").glob("*.js")) + sorted((PUBLICO / "assets").glob("thegame*")):
            with self.subTest(techo=f.name):
                if f.stat().st_size > 16384:
                    h = hashlib.sha256(f.read_bytes()).hexdigest()
                    self.assertIn(h, exc, f"{f.name} cruza 16 KiB sin entrada (con su huella) en EXCEPCIONES.md")
                else:
                    self.assertLessEqual(f.stat().st_size, 16384)

    def test_la_portada_lleva_la_zona_de_identidad_sin_ella_nadie_firma(self):
        """Defecto MEDIDO en vivo el 2026-10-11 (preceptoros.org/en/: «Identity is not defined»): la mudanza b1
        (3e4c9a7) genero las 10 portadas sin `<div id="identity">`, y `auth.js` se va sin definir `Identity` si
        no hay zona. Sin Identity nadie crea su clave ni firma nada: invocar, adoptar, el Taller, duelos. La
        plantilla la lleva y las 10 portadas son la plantilla; y auth.js sigue dependiendo de esa zona."""
        plantilla = (RAIZ.parent / "local_first_surface_build.py").read_text(encoding="utf-8")
        self.assertIn('<div id="identity" class="fila identity"></div>', plantilla)
        self.assertIn("if (!zona) return;", (PUBLICO / "assets" / "auth.js").read_text(encoding="utf-8"))
        for h in [PUBLICO / "index.html"] + sorted(PUBLICO.glob("*/index.html")):
            html = h.read_text(encoding="utf-8")
            if "/assets/auth.js" not in html:
                continue
            with self.subTest(portada=str(h.relative_to(PUBLICO))):
                self.assertIn('id="identity"', html, "una portada carga auth.js sin su zona: Identity no existe")
        r = subprocess.run([sys.executable, str(RAIZ.parent / "local_first_surface_build.py"), "--comprueba"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_p9_casos_del_polvo_de_taller(self):
        """P9 (firmado 2026-10-11): residuo por aristas, lijar sin tocar aristas, cadena de recibos que se comprueba
        entera, el Army solo suelta con recibo firmado por quien adopto, y lo lijado solo cuenta en practica."""
        r = subprocess.run(["node", str(RAIZ / "taller_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 9, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("window.AtlasTallerUI.monta(PANEL.taller)", tg)
        self.assertIn("var TL = enNode ? require('./taller.js') : raiz.AtlasTaller;", (PUBLICO / "game" / "arena.js").read_text(encoding="utf-8"))

    def test_p6_casos_del_escuadron(self):
        """P6 (firmado 2026-10-11): combate a escala por escuadrones; el combate sigue por tropa."""
        r = subprocess.run(["node", str(RAIZ / "escuadron_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 5, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        self.assertIn("raiz.AtlasEscuadron.pinta(g, u,", (PUBLICO / "game" / "wave_duel_scene.js").read_text(encoding="utf-8"))

    def test_p11_casos_del_primer_eco(self):
        """P11 (firmado 2026-10-11): el capitulo 1.5 ensena el Taller con sus reglas de verdad, en simulacro."""
        r = subprocess.run(["node", str(RAIZ / "eco_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 4, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        self.assertIn("window.AtlasPrimerEco.monta(PANEL.taller)", (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8"))

    def test_r8_la_ceremonia_es_real_no_decide_y_se_queda_quieta(self):
        """R8 (plan «el refresco»): la diversion esta en la CEREMONIA, no en el azar, y la ceremonia es real:
        la revelacion no tira ni decide (no llama a la tirada ni al generador, sin azar ni reloj de pared),
        su anticipacion es corta (<= 1,5 s) y con movimiento reducido no hay ni anticipacion ni temblor. La
        vitrina del Army ensena los stats REALES de la tropa; las ondas respiran y se paran con quietud."""
        r = sin_comentarios((PUBLICO / "game" / "summon_reveal.js").read_text(encoding="utf-8"))
        for malo in ("tirada(", "generador(", "Math.random", "Date.", "fetch("):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, r)
        ant = int(re.search(r"ANT = (\d+)", r).group(1))
        self.assertLessEqual(ant, 1500, "la anticipacion retiene a la persona demasiado")
        self.assertIn("if (!q && transcurrido < ANT)", r, "la anticipacion no respeta el movimiento reducido")
        self.assertIn("tiembla === null || q ? 0", r, "el temblor no respeta el movimiento reducido")
        self.assertIn("cicloActual()", r, "la ceremonia no lee el reloj de ciclos")
        self.assertNotRegex(r, r"\bDate\b|performance\.now|function cuadro\(ts\)", "la ceremonia depende del reloj de pared")
        u = sin_comentarios((PUBLICO / "game" / "ui-ficha.js").read_text(encoding="utf-8"))  # T: la ficha salio de ui.js
        self.assertIn("el('small', 'atlas-stats', G.STATS.filter(function (k) { return t.stats[k]; })", u)
        css = (PUBLICO / "assets" / "atlas.css").read_text(encoding="utf-8")
        self.assertIn("@keyframes atlas-respira", css)
        self.assertIn(".atlas-army .atlas-onda{animation:none}", css.split("prefers-reduced-motion:reduce){.atlas-army")[0] + "prefers-reduced-motion:reduce){.atlas-army" + css.split("prefers-reduced-motion:reduce){.atlas-army")[1][:60])

    def test_r7_la_radio_suena_en_el_mapa_y_las_anclas_no_envian_nada(self):
        """R7 (plan «el refresco»): la radio se monta tambien en el MAPA (misma sintesis, misma instantanea: el
        mismo modulo, no un gemelo); el mapa dibuja las ANCLAS (N.anclas) y nada de esto envia: ni fetch, ni
        sendBeacon, ni cifrado (EV_SURFACE_ECHO se construye con su propio FIRMO)."""
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        # U1: «Play the state» salia DOS veces (casa y mapa): ahora la radio se monta UNA vez, en la terminal.
        self.assertIn("if (window.AtlasRadio) { window.AtlasRadio.monta(PANEL.casa); }", tg)
        self.assertEqual(tg.count("AtlasRadio.monta("), 1, "la radio vuelve a salir en dos sitios")
        m = (PUBLICO / "game" / "sea-anchors.js").read_text(encoding="utf-8")
        self.assertIn("N.anclas({ pub: o.pub, sha: o.sha, nodos: o.nodos || [] })", m)
        self.assertIn("window.AtlasMarAnclas.pinta(g, P,", (PUBLICO / "game" / "sea.js").read_text(encoding="utf-8"))
        for f in ("sea.js", "sea-anchors.js", "fog_of_war.js"):
            c = sin_comentarios((PUBLICO / "game" / f).read_text(encoding="utf-8"))
            for malo in ("fetch(", "sendBeacon", "crypto.subtle", "XMLHttpRequest", "WebSocket"):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
        r = subprocess.run(["node", str(RAIZ / "camara_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = {c["caso"]: c for c in json.loads(r.stdout)}
        r7 = [k for k in casos if k.startswith("R7:")]
        self.assertGreaterEqual(len(r7), 2, "faltan los casos R7")
        for k in r7:
            with self.subTest(caso=k):
                self.assertTrue(casos[k]["ok"], casos[k]["detalle"])

    def test_r4_acentos_bioluminiscentes_sin_tocar_los_colores_senal(self):
        """R4 (plan «el refresco»): cuatro acentos (teal, ambar, hielo, violeta) como TOKENS, usados por el mapa,
        los tubos y las partes del cangrejo. Los colores-senal no cambian: la vida (tono por vida y luz por
        escudo, valores.fluidez) y los tonos de caracter de las ondas quedan fijados aqui."""
        tok = (PUBLICO / "assets" / "soberano.css").read_text(encoding="utf-8")
        for t in ("--bio-teal:", "--bio-ambar:", "--bio-hielo:", "--bio-violeta:"):
            with self.subTest(token=t):
                self.assertIn(t, tok)
        self.assertIn("css('--bio-ambar'", (PUBLICO / "game" / "ui-arena-comun.js").read_text(encoding="utf-8"))
        self.assertIn("var(--bio-teal)", (PUBLICO / "assets" / "tubo.css").read_text(encoding="utf-8"))
        r = subprocess.run(["node", "-e", "const V=require('./public/game/valores.js').fluidez;"
                            "process.stdout.write(JSON.stringify([V.vida_hue_base,V.vida_hue_cobre,V.escudo_lightness_base,V.escudo_lightness_min]))"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(json.loads(r.stdout), [270, 30, 72, 40], "un color-senal (la vida) cambio")
        e = (PUBLICO / "game" / "escena.js").read_text(encoding="utf-8")
        self.assertIn("var TONOS=['hsl(35 75% 58%)','hsl(140 45% 55%)','hsl(275 55% 68%)','hsl(210 12% 68%)'];", e,
                      "los tonos de caracter de las ondas cambiaron")

    def test_r3_los_tubos_son_css_puro_quieto_y_dentro_del_techo(self):
        """R3 (plan «el refresco»): terminal, popups y paneles son TUBOS. Una hoja con una puerta (la lista de
        hojas de thegame.js), cero imagenes y cero importaciones, sin animar (quieta con movimiento reducido),
        sin desenfoque, bajo 16 KiB, con fondo solido debajo del cristal y el fosforo solo en el terminal."""
        css = (PUBLICO / "assets" / "tubo.css").read_text(encoding="utf-8")
        vivo = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        self.assertLessEqual(len(css.encode("utf-8")), 16384)
        for malo in ("url(", "@import", "image-set(", "@keyframes", "animation", "blur(", "backdrop-filter"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, vivo)
        self.assertIn("var(--bg-secondary);", vivo, "el cristal sin fondo solido debajo no se lee a pleno sol")
        self.assertIn("border-radius:50%", vivo, "sin extremos elipticos no es un tubo")
        self.assertIn("pointer-events:none", vivo, "las tapas se comen los clics")
        self.assertEqual(re.findall(r"text-shadow[^;}]*", vivo.split(".terminal-log)")[0]), [], "fosforo fuera del terminal")
        self.assertIn("'tubo.css'].forEach", (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8"))
        sys.path.insert(0, str(RAIZ))
        import mundo
        self.assertIn("tubo.css", mundo.PIEZAS, "la hoja baja al abrir y no se cuenta en la puerta")

    def test_j6_una_sola_fuente_de_teselas_y_el_mapa_es_el_fondo(self):
        """J6 (plan «el refresco») y U1: el mapa pide el pintor UNICO de teselas (T0-D: sin gemelos); la deriva es
        global y no se hornea en cada tesela (las costuras de M4). Desde U1 el fondo de la portada ES el mapa:
        el lienzo de fondo propio (monta, portada, .sea-floor) se RETIRA; el mapa se pausa bajo una hoja."""
        m, f = self._js("sea.js"), self._js("sea-floor.js")
        self.assertLess(len(f.encode()), 16 * 1024, "the single sea painter stays below the piece cap")
        self.assertIn("function texturaLecho", f, "the floor keeps a deterministic, hand-shaped palette raster")
        for forbidden in ("Math.random", "fetch(", "XMLHttpRequest", "WebSocket", "https://", "http://"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, f, "map scenery cannot add randomness or an external asset path")
        for gemelo in ("function tesela(", "function bruma(", "E.textura(", "offsetTemporal"):
            with self.subTest(gemelo=gemelo):
                self.assertNotIn(gemelo, m, "sea.js vuelve a tener teselas propias")
        self.assertIn("MF.pintor()", m)
        self.assertNotIn("offset", f.split("function tesela(")[1].split("function bruma(")[0], "la deriva vuelve a hornearse en la tesela")
        for viejo in ("function monta(", "function portada(", "juego-panel"):
            with self.subTest(retirado=viejo):
                self.assertNotIn(viejo, f, "vuelve el segundo lienzo de fondo")
        self.assertIn("document.documentElement.classList.contains('con-hoja')", m, "el mapa no se pausa bajo una hoja")
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertNotIn("AtlasMarFondo.portada", tg)
        orden = [tg.index("'/game/" + n + "'") for n in ("escena.js", "fog_of_war.js", "world_camera.js", "sea-floor.js")]
        self.assertEqual(orden, sorted(orden), "sea-floor.js se carga antes que lo que usa")
        css = (PUBLICO / "assets" / "thegame.css").read_text(encoding="utf-8")
        self.assertNotIn(".sea-floor", css)
        # U2: en el telefono el mapa es la franja de encima de la terminal (si no, su centro cae detras de la hoja).
        # La terminal chatbot (2026-10-12): el mapa es TODA la pantalla; los bordes (menu, chat plegado) no le comen el centro.
        css = (PUBLICO / "assets" / "terminal_menu_shell.css").read_text(encoding="utf-8")
        self.assertIn(".thegame-mapa{position:fixed;inset:0;z-index:0}", css)
        self.assertIn(".radio-chat.plegado :is(.radio-chat-tabs,.radio-chat-lista,.radio-chat-no-data){display:none}", css, "the folded channels must leave the map clear")
        self.assertIn("max-height:44dvh", css.split(".radio-chat{position:fixed")[1].split("}")[0], "the open comms panel exceeds its height limit")

    def _js(self, n):
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))

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
                      "vel = vel >= 4 ? 1 : vel * 2",
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
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))

    def test_el_dano_es_desafinacion_y_no_barra(self):
        # 2026-10-04 (directiva): el dano es desafinacion, no barra. 2026-10-27 ([W] O1, fallo HIBRIDO del Soberano): el
        # duelo de ondas lleva la barra de vida de v1.1 bajo cada tropa Y sigue desafinando la figura con el dano. La
        # desafinacion sigue siendo OBLIGATORIA; la barra solo vive en el duelo, nunca en la libreria compartida.
        e, d = self._js("escena.js"), self._js("wave_duel_scene.js")
        self.assertIn("function afina(arm, d, t)", e)
        self.assertIn("desafina: Math.min(1, (1 - u.vida / u.max)", d, "la vida no desafina la figura")
        self.assertNotIn("function barra(", e, "la barra de vida se sale del duelo")
        self.assertIn("function barra(u)", d, "el duelo hibrido perdio la barra de v1.1")
        self.assertIn("[[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]", e, "el tramado no es Atkinson")
        self.assertIn("(v - q) / 8", e, "Atkinson reparte 1/8 a cada vecino")

    def test_el_mapa_pinta_el_origen_de_cada_cifra(self):
        m, mf = self._js("sea.js"), self._js("sea-floor.js")
        self.assertIn("var NIEBLA = [null, ", mf, "la niebla no es de un bit")
        self.assertIn("N.niebla(i * TESELA + x * RES, j * TESELA + y * RES, circ)", mf, "la niebla no sale de lo despejado (fog_of_war.js)")
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

    NODOS = ("nodos-pesos.js", "nodos-cedulas.js", "nodos.js", "ui-nodos.js", "node_preview.js", "node_file_receiver.js", "node_catalogue.js")

    def _js(self, nombre):
        return sin_comentarios(_fam(nombre, (PUBLICO / "game" / nombre).read_text(encoding="utf-8")))

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

    def test_node_reception_contract(self):
        r = subprocess.run(["node", "--test", "tests/node_reception_contract.test.mjs"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"# tests [1-9][0-9]*")

    def test_node_signature_verify(self):
        r = subprocess.run(["node", "--test", "tests/node_signature_verify.test.mjs"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"# tests [1-9][0-9]*")

    def test_node_bindings(self):
        r = subprocess.run(["node", "--test", "tests/node_bindings.test.mjs"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"# tests [1-9][0-9]*")

    def test_node_file_receiver(self):
        r = subprocess.run(["node", "--test", "tests/node_file_receiver.test.mjs"],
                           cwd=RAIZ.parent, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"# tests [1-9][0-9]*")

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
        return sin_comentarios(_fam(nombre, (PUBLICO / carpeta / nombre).read_text(encoding="utf-8")))

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
        self.assertIn("nodosCasa.id = 'pliego-nodos'", self._js("ui-arena.js"))
        self.assertIn("terminal.appendChild(nodosCasa)", self._js("ui-arena.js"))
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


class PolvoDeEclosion(unittest.TestCase):
    """Mision 2026-10-13, paso 3. Rechazar en la eclosion y aceptar-y-desintegrar tienen que dar el MISMO
    residuo y el MISMO recibo atlas.taller/1. Medido antes del cambio (node, 15 tropas): las cifras de
    residuo ya coinciden (0 de 15 distintas); lo que no coincide es el camino: «soltar» daba 0 g y ningun
    recibo, mientras que desintegrar da residuo(t) g (6-9 g en la muestra) con recibo firmado."""

    def _node(self, codigo):
        r = subprocess.run(["node", "-e", codigo], cwd=RAIZ.parent, capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, r.stderr[-400:])
        return json.loads(r.stdout)

    def test_las_cifras_del_residuo_coinciden_entre_caminos(self):
        """Guarda: la tropa de la eclosion y la copia que queda en el Army dan el mismo residuo (15 casos)."""
        out = self._node(
            "const G=require('./public/game/gacha.js'),TL=require('./public/game/taller.js'),C=require('crypto');"
            "const r=[];for(const tc of ['tc1','tc2','tc3'])for(const x of ['a1','b2','c3','d4','e5']){"
            "const t=G.tirada(C.createHash('sha256').update(x).digest('hex'),tc);"
            "r.push([TL.residuo(t),TL.residuo(JSON.parse(JSON.stringify(t)))]);}"
            "console.log(JSON.stringify(r));")
        self.assertEqual(len(out), 15)
        self.assertTrue(all(a == b for a, b in out), out)

    def test_el_recibo_de_eclosion_es_el_de_desintegrar(self):
        """Guarda: el recibo `atlas.taller/1` se arma igual desde la eclosion que desde el Army."""
        out = self._node(
            "const G=require('./public/game/gacha.js'),TL=require('./public/game/taller.js'),C=require('crypto');"
            "const t=G.tirada(C.createHash('sha256').update('a1').digest('hex'),'tc1');"
            "const e={saldo:0,lijas:{},disueltas:{},tintes:{},ultimo:'0'.repeat(64),clave:null,n:0};"
            "const k='ab'.repeat(32);"
            "console.log(JSON.stringify([TL.recibo(e,{op:'desintegra',tropa:t},k),"
            "TL.recibo(e,{op:'desintegra',tropa:JSON.parse(JSON.stringify(t))},k)]));")
        self.assertEqual(out[0], out[1])
        self.assertEqual(out[0]["esquema"], "atlas.taller/1")

    def test_rechazar_en_la_eclosion_llama_al_mismo_camino_de_desintegrar(self):
        """ROJO hasta el cambio: el boton «no» de la eclosion solo ocultaba el panel (ui.js:121)."""
        self.assertIn("window.AtlasTallerUI.desintegraSuelta(t, R.eclosion)", (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8"))

    def test_desintegrar_suelta_firma_el_recibo_sin_sacarla_del_army(self):
        """ROJO hasta el cambio: la suelta firma `desintegra` con la misma `opera` y NO llama a `retira`
        (la tropa nunca entro al Army)."""
        ui = (PUBLICO / "game" / "ui-taller.js").read_text(encoding="utf-8")
        m = re.search(r"function desintegraSuelta\(t, panel\)\s*\{(.*?)\n  \}", ui, re.S)
        self.assertTrue(m, "no existe desintegraSuelta")
        cuerpo = m.group(1)
        self.assertIn("opera({ op: 'desintegra', tropa: t }", cuerpo)
        self.assertNotIn("retira", cuerpo, "la suelta no debe sacar del Army una tropa que nunca entro")
        self.assertIn("AtlasTallerUI", ui)


class EclosionDirecta(unittest.TestCase):
    """Mision 2026-10-13, paso 2. Al cerrarse la revelacion de una eclosion, el foco y la vista aterrizan en
    quedarse / no quedarse. La revelacion en si no se quita (es la de 2026-10-05): solo se cierra en su sitio."""

    def test_la_revelacion_acepta_una_funcion_al_cerrar(self):
        """ROJO hasta el cambio: summon_reveal.js no tenia `alCerrar`."""
        self.assertIn("function muestra(t, alCerrar)", (PUBLICO / "game" / "summon_reveal.js").read_text(encoding="utf-8"))

    def test_la_eclosion_pasa_su_eleccion_al_cerrar_la_revelacion(self):
        """ROJO hasta el cambio: ui.js llamaba `muestra(t)` sin nada al cerrar."""
        ui = (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")
        self.assertIn("AtlasRevela.muestra(t, window.AtlasTallerUI.aterriza(R.eclosion))", ui)
        tal = (PUBLICO / "game" / "ui-taller.js").read_text(encoding="utf-8")
        cuerpo = tal[tal.index("function aterriza(panel)"):][:300]
        self.assertIn("atlas-dlg-mandos", cuerpo, "aterriza no lleva el foco a la eleccion")
        self.assertIn("b.focus()", cuerpo)


class TrozoInvoca(unittest.TestCase):
    """FIRMO M1 (2026-10-13, dividir ui.js): la invocacion (identidad, cadena, invocar) sale de ui.js a
    `ui-invoca.js`, como `ui-ficha.js`. Cirugia de estructura: mismo comportamiento, mismas pruebas.
    El estado compartido vive en `Z` (lo crea ui.js). Rojo antes del movimiento."""

    def test_el_satelite_existe_y_se_registra_antes_que_ui(self):
        self.assertTrue((PUBLICO / "game" / "ui-invoca.js").exists(), "falta ui-invoca.js")
        th = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("['/game/ui-invoca.js']", th, "thegame.js no carga el satelite")
        self.assertLess(th.index("['/game/ui-invoca.js']"), th.index("['/game/ui.js']"), "el satelite debe cargar antes que ui.js")
        self.assertIn("'/game/ui-invoca.js'", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"), "no esta en el precache")

    def test_ui_ya_no_define_el_invocar_y_lo_crea_desde_el_satelite(self):
        ui = (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")
        for f in ("function invoca(", "function cadenaLista(", "function sinIdentidad(", "function firma("):
            self.assertNotIn(f, ui, f"ui.js sigue definiendo {f}")
        self.assertIn("window.AtlasInvoca.crea(", ui)
        self.assertIn("var Z = {", ui, "el estado compartido no vive en Z")

    def test_nido_solo_muestra_progreso_con_ciclos_medidos(self):
        r = subprocess.run(["node", str(RAIZ / "incubator_cases.mjs")], capture_output=True,
                           text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(json.loads(r.stdout), {"cases": 8, "state": "MEDIDO", "provenance": "SYNTHETIC"})
        ui = (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")
        sat = (PUBLICO / "game" / "ui-invoca.js").read_text(encoding="utf-8")
        self.assertNotIn("function pintaNido(", ui)
        self.assertIn("function pintaNido(", sat)
        self.assertIn("INV.pintaNido()", ui)
        self.assertIn("x.b.disabled = !i || ciclo === null", ui)
        self.assertIn("if (ciclo === null) { dice(T('inc_ciclo_nd')); }", ui)
        self.assertIn("if (c === null) { pinta(); return; }", ui)

    def test_el_satelite_no_usa_azar_ni_reloj(self):
        sat = (PUBLICO / "game" / "ui-invoca.js").read_text(encoding="utf-8")
        for impuro in ("Math.random", "Date.now", "new Date("):
            self.assertNotIn(impuro, sat)

    def test_el_tamano_baja_y_cada_fichero_tiene_holgura(self):
        ui = (PUBLICO / "game" / "ui.js").read_bytes()
        sat = (PUBLICO / "game" / "ui-invoca.js").read_bytes()
        # Umbral fijado tras medir (12.624 B tras el corte): holgura de ~2,5 KB bajo el techo de 15.360 B.
        self.assertLess(len(ui), 12800, f"ui.js sigue en {len(ui)} B (umbral < 12800)")
        self.assertLess(len(sat), 8192, f"ui-invoca.js en {len(sat)} B")


class CasillerosDelArmy(unittest.TestCase):
    """Mision 2026-10-13, paso 4 (el Army como grid de casilleros). Cada tropa en su casillero (dibujado con
    su ficha, sin imagenes), con aria-label, 44 px y foco visible. Elegir un casillero muestra en la MISMA
    hoja su ficha, TODAS sus stats y los controles de lija y desintegrar, que ya existen en ui-taller.js."""

    def test_ui_pinta_el_army_como_casilleros_del_taller(self):
        """ROJO hasta el cambio: ui.js pintaba un li con la ficha, sin casillero ni eleccion."""
        ui = (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")
        self.assertIn("window.AtlasTallerUI.casilleros(R.army, l, ficha)", ui)
        self.assertNotIn("li.appendChild(ficha(u.adopcion.tropa, 64))", ui, "queda el pintado antiguo")

    def test_cada_casillero_tiene_nombre_y_se_marca_al_elegirlo(self):
        tal = (PUBLICO / "game" / "ui-taller.js").read_text(encoding="utf-8")
        self.assertIn("function casilleros(", tal)
        self.assertIn("el('button', 'army-casillero')", tal)
        self.assertIn("b.setAttribute('aria-label'", tal, "el casillero no tiene nombre accesible")
        self.assertIn("aria-pressed", tal, "el casillero elegido no se marca")

    def test_el_detalle_muestra_todas_las_stats_y_reusa_lija_y_polvo(self):
        tal = (PUBLICO / "game" / "ui-taller.js").read_text(encoding="utf-8")
        self.assertIn("G.STATS.forEach(", tal, "no enseña todas las stats")
        self.assertIn("TL.coste(nv)", tal, "la lija no reusa el coste de taller.js")
        self.assertIn("TL.residuo(t)", tal, "el polvo no reusa residuo(t)")
        self.assertIn("lija(t, s.value)", tal)

    def test_el_casillero_mide_44_px_y_tiene_foco_visible(self):
        css = (PUBLICO / "assets" / "thegame.css").read_text(encoding="utf-8")
        self.assertRegex(css, r"\.army-casillero\{[^}]*min-width:2\.75rem[^}]*min-height:2\.75rem")
        base = (PUBLICO / "assets" / "soberano.css").read_text(encoding="utf-8")
        self.assertRegex(base, r":focus-visible\{outline:2px solid")


class ArmyYTallerEnUnaHoja(unittest.TestCase):
    """Decision del Soberano (2026-10-13, FIRMO nuevo: unificacion Army+Taller). El Taller vive DENTRO de la
    hoja `ondas`, debajo del Army; ya no hay hoja propia. `PANEL.taller` sigue siendo su contenedor."""

    def test_el_taller_cuelga_de_la_hoja_ondas_debajo_del_army(self):
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        self.assertIn("ond.appendChild(tal)", sh, "el Taller no cuelga de la hoja ondas")
        self.assertLess(sh.index("S.ARMYZ = el('div', 'casa-army'); ond.appendChild(S.ARMYZ);"),
                        sh.index("ond.appendChild(tal)"), "el Taller debe ir debajo del Army")
        self.assertNotIn("hoja('taller'", sh, "sigue existiendo una hoja propia del Taller")

    def test_la_entrada_del_taller_abre_la_hoja_unica_y_baja_a_el(self):
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        i = sh.index("entrada('waves',")
        bloque = sh[i:i + 400]
        self.assertIn("'thegame-ondas'", bloque, "la entrada del Taller no apunta a la hoja unica")
        self.assertIn("muestra(actual === 'ondas' ? null : 'ondas')", bloque, "Waves Army no abre su hoja compartida")
        self.assertIn("ond.appendChild(tal)", sh, "Workshop no comparte la hoja Waves Army")


class EclosionEspera(unittest.TestCase):
    def test_no_nace_otro_huevo_mientras_la_eleccion_esta_abierta(self):
        """ui.js: `tic` espera a que el panel de la eleccion este cerrado (no a un flag que un cierre desde
        fuera dejaria pegado). `R.eclosion` nace oculto (ui.js: `R.eclosion.hidden = true`)."""
        ui = (PUBLICO / "game" / "ui.js").read_text(encoding="utf-8")
        self.assertIn("if (R.eclosion.hidden) {", ui)
        self.assertIn("R.eclosion = el('div', 'atlas-eclosion'); R.eclosion.hidden = true;", ui)


class AccesoTactilYPanel(unittest.TestCase):
    """Lote 3-4 (botones, 2026-10-13): los controles de la web llegan a 44 px, el foco se ve con el
    teclado y los controles del panel del cangrejo tienen nombre. Lee `ATLAS_FUENTE` (por defecto el
    `public/` del repo): apuntarlo al arbol anterior es el rojo que demuestra que la prueba muerde."""
    FUENTE = Path(os.environ.get("ATLAS_FUENTE", PUBLICO))

    def _lee(self, rel):
        return (self.FUENTE / rel).read_text(encoding="utf-8")

    def test_selector_del_panel_del_cangrejo_llega_a_44(self):
        """thegame.css: el select de acciones mide 41 px sin esto (medido en vivo)."""
        self.assertRegex(self._lee("assets/thegame.css"), r"\.terminal-fila select\{[^}]*min-height:2\.75rem")

    def test_etiqueta_de_consentimiento_llega_a_44(self):
        """page-comment.css: la etiqueta de la casilla media 24 px de alto; es lo que se toca."""
        self.assertRegex(self._lee("assets/page-comment.css"), r"\.pc-acepto\{[^}]*min-height:2\.75rem")

    def test_boton_enviar_del_comentario_llega_a_44(self):
        self.assertRegex(self._lee("assets/page-comment.css"), r"\.pc-enviar,\.pc-sec\{min-height:2\.75rem")

    def test_icono_de_identidad_llega_a_44(self):
        self.assertIn("var(--talla-par,44px)", self._lee("assets/canon.css"))

    def test_idioma_y_marca_tienen_area_tactil_de_44_sin_mover_el_dibujo(self):
        """eaa-art12: el area tactil es un ::before que no cambia el alto de la cabecera (116 -> 217 px
        si se subia el alto real). Ambas reglas tienen que estar."""
        css = self._lee("assets/eaa-art12-local-first-surface.css")
        self.assertRegex(css, r"\.cab-lenguas a::before\{[^}]*inset:-10px -8px")
        self.assertRegex(css, r"\.cab-marca::before\{[^}]*inset:-14px 0")

    def test_el_foco_visible_cubre_todo_el_teclado(self):
        """soberano.css: un `:focus-visible` global; sin el, un control nuevo queda sin contorno."""
        self.assertRegex(self._lee("assets/soberano.css"), r":focus-visible\{outline:2px solid")

    def test_el_panel_del_cangrejo_nombra_sus_controles_y_su_boton(self):
        """aiact-art50-crab-terminal.js: action, depth y direction con nombre; el boton «Run» con texto."""
        js = self._lee("game/aiact-art50-crab-terminal.js")
        for nombre in ("action", "depth", "direction"):
            self.assertIn(f"setAttribute('aria-label', '{nombre}')", js, nombre)
        self.assertIn("T('term_run', 'Run')", js, "el boton de accion no tiene texto propio")

    def test_la_bandera_de_la_casa_es_una_imagen_con_nombre(self):
        """home_buildings.js: un span con aria-label y sin rol lo ignoran muchos lectores."""
        self.assertIn("R.color.setAttribute('role', 'img')", self._lee("game/home_buildings.js"))

    def test_la_repeticion_de_batalla_es_una_imagen_con_nombre(self):
        """battle_replay.js: el canvas lleva aria-label; sin rol no tiene nombre para muchos lectores."""
        self.assertIn("lienzo.setAttribute('role', 'img')", self._lee("game/battle_replay.js"))


class EstrellaHexelion(unittest.TestCase):
    def test_catalogo_publico_y_sabotaje_de_id(self):
        """El catálogo conserva sus anclajes como texto, retiene las dos entradas con causa y rechaza IDs duplicados."""
        r = subprocess.run(["node", str(RAIZ / "dictionary_cases.mjs")], cwd=RAIZ.parent,
                           capture_output=True, text=True, check=False)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        data = json.loads(r.stdout)
        self.assertEqual((data["entries"], data["glyph_max_bytes"]), (43, 9))
        s = subprocess.run(["node", str(RAIZ / "dictionary_cases.mjs"), "--sabotage-duplicate"], cwd=RAIZ.parent,
                           capture_output=True, text=True, check=False)
        self.assertNotEqual(s.returncode, 0, "duplicate catalogue ID sabotage should fail red")
        self.assertIn("unique IDs", s.stdout)


class LaunchGateVT6(unittest.TestCase):
    """VT6: compuerta de lanzamiento. 1 clic PWA, 2 clics app y modelos, NO_DATA con causa, cero peticiones externas en carga."""

    def test_launch_gate_casos_en_node(self):
        r = subprocess.run(["node", str(RAIZ / "launch_gate_casos.mjs")], capture_output=True, text=True, check=False)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        casos = json.loads(r.stdout)
        self.assertEqual(len(casos), 7)
        self.assertTrue(all(c["ok"] for c in casos), [c for c in casos if not c["ok"]])


class EstrellaCapturaJ1(unittest.TestCase):
    """J1: una estrella se captura en su edificio enlazado, una vez, con semiotica medida; lo no medido es NO_DATA."""

    def test_estrella_captura_casos_en_node(self):
        r = subprocess.run(["node", str(RAIZ / "estrella_captura_casos.mjs")], capture_output=True, text=True, check=False)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        casos = json.loads(r.stdout)
        self.assertEqual(len(casos), 7)
        self.assertTrue(all(c["ok"] for c in casos), [c for c in casos if not c["ok"]])


class PantallasTutorialVT5(unittest.TestCase):
    """VT5 pantallas: modelo de vista puro + DOM sin innerHTML + toque de 44 px (y su regla CSS)."""

    def test_pantallas_casos_en_node(self):
        r = subprocess.run(["node", str(RAIZ / "ui_tutorial_casos.mjs")], capture_output=True, text=True, check=False)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        casos = json.loads(r.stdout)
        self.assertEqual(len(casos), 7)
        self.assertTrue(all(c["ok"] for c in casos), [c for c in casos if not c["ok"]])


class PasoFinalDeLaCara(unittest.TestCase):
    """La linea del tutorial de la cara lleva siempre «Step n of total», tambien en el ultimo paso (2026-10-25)."""

    def test_ultimo_paso_conserva_el_contador(self):
        js = (PUBLICO / "face" / "face_tutorial.js").read_text(encoding="utf-8")
        self.assertIn("'Step ' + steps.length + ' of ' + steps.length + ': '", js)
        self.assertNotIn("'Now: '", js)


if __name__ == "__main__":
    unittest.main(verbosity=1)
