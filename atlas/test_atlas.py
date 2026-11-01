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
# Corte D (2026-10-28): el juego de /play/ se retiro; sin thegame.js no hay lengua completa que leer.
LENGUAS_JUEGO = json.loads(re.search(r"var LENGUAS = (\[[^\]]*\])", (ASSETS / "thegame.js")
                                     .read_text(encoding="utf-8")).group(1).replace("'", '"')) \
    if (ASSETS / "thegame.js").exists() else []
BORRADORES = [l for l in LENGUAS if l not in LENGUAS_JUEGO]
PESADOS = (".gguf", ".onnx", ".safetensors", ".bin", ".wav", ".mp3", ".ogg", ".opus")
TOPE_GZIP = 2 * 1024 * 1024      # §E: bundle ATLAS < 2 MB gzip
TOPE_FICHERO = 25 * 1024 * 1024         # el mismo tope por fichero que la web


def sin_comentarios(js):
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", js)


class Piso(unittest.TestCase):












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
        ok_car = {"v": "atlas.carta/1", "radius": 8, "seed": 1, "budget": {"chunk_bytes_max": 65536, "visible_bytes_max": 458752}, "frame": {"t": "Tutorial cabin chunk", "d": "Floor and water around the tutorial cabin."},
                  "chunks": [{"id": "0_0", "c": [0, 0], "sha256": "a" * 64, "bytes": 900, "frame": {"t": "Tutorial cabin chunk", "d": "Floor and water around the tutorial cabin."}}]}
        ok_chu = {"v": "atlas.chunk/1", "c": [0, 0], "seed": 1, "frame": {"t": "Tutorial cabin chunk", "d": "Floor and water around the tutorial cabin."}, "cells": [[0, 0, 0, "floor"], [1, 0, 0, "water"]], "assets": ["sea-palette"]}
        ok_ass = {"v": "atlas.asset/1", "id": "sea-palette", "kind": "palette", "frame": {"t": "Tutorial cabin chunk", "d": "Floor and water around the tutorial cabin."}, "data": {"bands": [[23, 19, 31]]}}
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
            # P1 del plan 2.5D (odd/tasks/mapa-25d-aldea.md, 2026-11-01): el mapa por chunks hex.
            "atlas_carta_schema.json": (ok_car, [
                con(ok_car, v="atlas.carta/2"), sin(ok_car, "frame"),
                con(ok_car, chunks=[dict(ok_car["chunks"][0], sha256="x")]), con(ok_car, x=1),
                sin(ok_car, "budget"), con(ok_car, budget={"chunk_bytes_max": 0, "visible_bytes_max": 1})]),
            "atlas_chunk_schema.json": (ok_chu, [
                con(ok_chu, cells=[[0, 0, 0, "lava"]]), con(ok_chu, cells=[[0, 0, -1, "floor"]]),
                con(ok_chu, assets=["Big Sprite.png"]), sin(ok_chu, "frame"), con(ok_chu, c=[0]),
                con(ok_chu, png="AAAA")]),
            "atlas_asset_schema.json": (ok_ass, [
                con(ok_ass, kind="glb"), con(ok_ass, id="Up Case"), sin(ok_ass, "frame"),
                con(ok_ass, frame={"t": "", "d": "x"}), sin(ok_ass, "data"), con(ok_ass, url="https://x")]),
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




# Modulos de `public/game/` que NINGUN guion pide todavia (ni la puerta ni el Army): el multijugador y
# la cria, firmados por el Soberano el 2026-09-28 («ve construyendo todo… enfocados al multiplayer»).
# Ver atlas/POST_VERIFICACION_MGNO_LAB.md y atlas/POST_VERIFICACION_SISIL_CRIA.md.
PUROS = ("canon.js", "sobres.js", "rating.js", "arena.js", "duelo.js", "battle_choreography.js", "mercado.js", "narragrafo.js", "cria.js")  # genoma.js salio del arbol servido (atlas/puros/, 2026-10-27) · T_CRT §8.1: el orquestador mini lo lee; ningun guion de la web lo pide aun
# La Arena (2026-09-28, «el mapa multi-jugador en una pestana»): se carga al abrir su pestana, detras del Army.
ARENA = ("sobres.js", "rating.js", "combate_ticks.js", "arena.js", "duelo.js", "sea-anchors.js", "crab_render_hd.js", "audio_feedback_manager.js", "crab_free_move.js", "genesis_tutorial.js", "buildings_toon.js", "reef_place_cards.js", "shell_schematics.js", "reef_buildings_paint.js", "latency_crystal.js", "hexelion_bench.js", "bubble_bestiary.js", "map_bubble_figures.js", "reef_corals.js", "reef_buildings_layer.js", "sea-crabs.js", "map_pointer_input.js", "semiotic_glyph.js", "hexelion_dictionary.js", "map_nodes_layer.js", "map_zoom.js", "piece_inspector.js", "vector_contract.js", "state_vector.js", "place_reading.js", "npc_territory_map.js", "map_integrity.js", "sea.js", "nodos-pesos.js",
         "node_reception_contract.js", "node_trust_anchor.js", "node_trust_manifest.js", "node_signature_messages.js", "node_signature_verify.js", "node_bindings_messages.js", "node_bindings.js", "node_projection.js", "nodos.js", "cuenta.js", "ui-nodos.js", "ui-rack.js", "node_preview.js", "node_file_receiver.js",
         "escuadron.js", "wave_duel_scene.js", "npc_occupancy.js", "npc_walls.js", "ui-arena-comun.js", "combat_screen.js", "ui-arena.js", "ui-duelo.js")
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
# [W] O1b (2026-10-27): la escena del duelo de ondas entra en la Arena (ARENA) y en los mundos; battle_choreography queda
# en PUROS (motor intacto, ya no lo carga ninguna cara).
# /openworld/ (NORTE 8 · audio slice 2, 2026-10-28): el sonido nativo del fotograma, cargado solo por esa pagina.
MUNDO_ABIERTO = ("bubble_sonify.js", "chunk_router.js", "global_map.js")   # /openworld/: sonido, router y el mapa global (NODO-MAPA, 2026-10-28), fuera de la puerta y fuera del precache
FUERA_DE_LA_PUERTA = tuple(sorted(set(PUROS + ARENA + CASA + DESCENSO + VT6 + J1 + VT2_ETIQUETA + VT4_SILUETA + VISION_LEXICA + ADUANA + MUNDO_ABIERTO)))
# La cara del juego (2026-10-25) es su propia superficie en public/face/, fuera
# de la puerta: carga de una vez las piezas que usa, como creation.html. Se
# declaran aqui las suyas, leidas de sus paginas, y nada mas.
FACE_PAGE_DEPENDENCIES = tuple(sorted(set(re.findall(r'src="/game/([^"]+)"', (PUBLICO / "face" / "basic.html").read_text(encoding="utf-8")))))
# La portada (P3 [1d], decreto 2026-10-26) dibuja sus tres puertas en bubble language: carga UNA vez
# estas piezas de dibujo, y solo estas. Se DECLARAN aqui (no se leen de la pagina), asi la portada no
# puede ampliar la lista en silencio; test_web.Puerta exige que cargue exactamente esta lista.
LANDING_PAGE_DEPENDENCIES = ("tabla_semantica.js", "comic_tokens.js", "comic_accents.js", "comic_atoms.js",
                             "bubble_language.js", "bubble_letters.js")
# /openworld/ (NORTE 7 · PR 2, 2026-10-28): el mapa y su cabana dibujan en la misma burbuja que la portada; se DECLARA aqui.
OPENWORLD_PAGE_DEPENDENCIES = LANDING_PAGE_DEPENDENCIES + ("bubble_sonify.js", "valores.js", "gacha.js", "chunk_router.js", "isometric_floor_projection.js", "global_map.js")   # the native sound: on demand, on the first click; the map: the projection and its state
# /aduana/ (Norte N2, 2026-10-26): el comprobador de cedulas, OBSERVANTE, carga la cadena de nodos y solo esa. Se
# DECLARA aqui; local_first_surface_build.ADUANA_SCRIPTS es la misma lista, y tests/aduana_page.test.mjs exige que
# coincidan.
# NORTE 5 a1 (2026-10-27): /get-the-app/ draws the launch gate (VT6).
APP_PAGE_DEPENDENCIES = ("launch_gate.js",)
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


class Cria(unittest.TestCase):
    """La cria soberana y el genoma de SISIL (auditoria SISIL_CRIA): validar, nunca calibrar ni adoptar solo.
    Las odds se ven y son las que se tiran."""

    def _node(self, codigo):
        r = subprocess.run(["node", "-e", codigo], capture_output=True, text=True, timeout=120, cwd=str(RAIZ.parent))
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)


    def test_contratos_de_la_cria_y_del_genoma(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest("NO_DATA · jsonschema no instalado")
        base = self._node("process.stdout.write(JSON.stringify(require('./public/game/cria.js').desdeValores()))")
        lim = self._node("process.stdout.write(JSON.stringify(require('./atlas/puros/genoma.js').LIMITES))")
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






class PuenteAppLocal(unittest.TestCase):
    def test_puente_app_local_casos(self):
        """La consulta local solo sale tras accion; indisponibilidad queda como NO_DATA con causa."""
        r = subprocess.run(["node", str(RAIZ / "local_app_bridge_casos.mjs")], capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout[-1200:] + r.stderr[-400:])


class PrecacheDelJuego(unittest.TestCase):
    """D7 (mudanza bloque 2, FIRMO 2026-10-11) SUPERSEDIDO por Norte 7 corte C (2026-10-28): el juego ya no entra
    en el precache. web#390 retiro la puerta (301 /play/ -> /openworld/); thegame.js y su hoja siguen en el arbol
    hasta el corte D, asi que esta guarda es de RETIRADA: que no se precacheen mientras existen. Lo que es MEDIDA
    (atlas-mundo, atlas-record) sigue fuera del precache, como antes."""

    def test_juego_retirado_no_se_precachea(self):
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        juego = listas[listas.index("const JUEGO"):listas.index("];", listas.index("const JUEGO"))]
        for r in ("/assets/thegame.js", "/assets/thegame.css"):
            with self.subTest(ruta=r):
                self.assertNotIn("'" + r + "'", juego, "el juego retirado sigue en el precache")

    def test_lo_que_es_medida_sigue_fuera(self):
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        for medida in ("/atlas-mundo.json", "/atlas-record.json"):
            with self.subTest(medida=medida):
                self.assertNotIn(medida, listas[listas.index("const JUEGO"):])






class RadioDelEstado(unittest.TestCase):
    """J2+J9 (plan de ronda 2026-10-11): la melodia ES el estado (pentatonica, determinista, con huella);
    el boletin sale SOLO de la instantanea; suena por la sintesis de core.js; voces solo locales."""

    def _js(self):
        return sin_comentarios((PUBLICO / "game" / "aiact-art50-state-radio.js").read_text(encoding="utf-8"))


    def test_ni_un_fichero_de_audio_en_public(self):
        """Cero assets binarios de sonido: todo es sintesis (sabotaje: un .mp3 aqui da rojo)."""
        malos = [str(p.relative_to(PUBLICO)) for p in PUBLICO.rglob("*") if p.suffix.lower() in (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".opus")]
        self.assertEqual(malos, [])





class Conquista(unittest.TestCase):
    """Conquista (FIRMO del Soberano, 2026-10-10): ganar a un lugar NPC lo deja CONQUISTADO en este aparato.
    Se guarda por db.js (la unica puerta de almacenamiento), se ve en la lista y en el mapa con su sello
    LOCAL · practica, y NO da rating, ni botin, ni entra en el combate."""

    def _js(self, nombre):
        return sin_comentarios(_fam(nombre, (PUBLICO / "game" / nombre).read_text(encoding="utf-8")))



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






class CombateLimpio(unittest.TestCase):
    """2026-10-10 (Soberano, captura del Doogee): el combate se ve entero y su calidad la manda el jugador.
    El automatico solo baja tras medir fps, lo dice en pantalla y volver a Maxima es un toque."""


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






class MapaMovible(unittest.TestCase):
    """El mapa global se arrastra hasta chocar con la niebla (Soberano, 2026-10-05): empieza en tu casa,
    se mueve con el dedo, el raton, las flechas y botones grandes; la niebla sale de lo MEDIDO y es el
    limite fisico de la camara. Terreno por teselas, sin azar ni red."""

    def _js(self, n):
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))






















    def _js(self, n):
        return sin_comentarios(_fam(n, (PUBLICO / "game" / n).read_text(encoding="utf-8")))


    def test_sin_azar_ni_reloj_ni_red(self):
        for f in ("battle_choreography.js", "wave_duel_scene.js"):
            c = self._js(f)
            for malo in ("Math.random", "Date.", "performance.now", "fetch(", "localStorage", "innerHTML"):
                with self.subTest(fichero=f, prohibido=malo):
                    self.assertNotIn(malo, c)
        self.assertNotIn("arena.combate", self._js("wave_duel_scene.js"), "la escena vuelve a decidir el combate")





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





class CasillerosDelArmy(unittest.TestCase):
    """Mision 2026-10-13, paso 4 (el Army como grid de casilleros). Cada tropa en su casillero (dibujado con
    su ficha, sin imagenes), con aria-label, 44 px y foco visible. Elegir un casillero muestra en la MISMA
    hoja su ficha, TODAS sus stats y los controles de lija y desintegrar, que ya existen en ui-taller.js."""


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







class AccesoTactilYPanel(unittest.TestCase):
    """Lote 3-4 (botones, 2026-10-13): los controles de la web llegan a 44 px, el foco se ve con el
    teclado y los controles del panel del cangrejo tienen nombre. Lee `ATLAS_FUENTE` (por defecto el
    `public/` del repo): apuntarlo al arbol anterior es el rojo que demuestra que la prueba muerde."""
    FUENTE = Path(os.environ.get("ATLAS_FUENTE", PUBLICO))

    def _lee(self, rel):
        return (self.FUENTE / rel).read_text(encoding="utf-8")









    def test_la_repeticion_de_batalla_es_una_imagen_con_nombre(self):
        """wave_duel_scene.js (antes battle_replay.js): el canvas lleva aria-label; sin rol no tiene nombre para muchos lectores."""
        self.assertIn("lienzo.setAttribute('role', 'img')", self._lee("game/wave_duel_scene.js"))




class LaunchGateVT6(unittest.TestCase):
    """VT6: compuerta de lanzamiento. 1 clic PWA, 2 clics app y modelos, NO_DATA con causa, cero peticiones externas en carga."""

    def test_launch_gate_casos_en_node(self):
        r = subprocess.run(["node", str(RAIZ / "launch_gate_casos.mjs")], capture_output=True, text=True, check=False)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        casos = json.loads(r.stdout)
        self.assertEqual(len(casos), 7)
        self.assertTrue(all(c["ok"] for c in casos), [c for c in casos if not c["ok"]])






class PasoFinalDeLaCara(unittest.TestCase):
    """La linea del tutorial de la cara lleva siempre «Step n of total», tambien en el ultimo paso (2026-10-25)."""

    def test_ultimo_paso_conserva_el_contador(self):
        # H2 (2026-11-01): la piel se retiro con recibo; la regla se guarda en su copia retirada.
        js = (RAIZ.parent / "retirados" / "face" / "face_tutorial.js").read_text(encoding="utf-8")
        self.assertIn("'Step ' + steps.length + ' of ' + steps.length + ': '", js)
        self.assertNotIn("'Now: '", js)


class JuegoRetirado(unittest.TestCase):
    """Corte D (2026-10-28): el juego de /play/ se retiro con su pagina. Las pruebas de theGame que fallaban con
    sus ficheros ausentes se quitaron; esta guarda pide que no vuelvan y que no se precacheen (mismo patron que
    mapa_viejo_desmontado y los guards de test_web)."""

    FICHEROS = ("assets/thegame.js", "assets/thegame.css", "assets/atlas-piso.js", "assets/atlas-motor.js",
                "assets/atlas-partida.js", "assets/atlas-piloto.js", "assets/atlas-guardado.js",
                "game/ui-arena.js", "game/semiotic_glyph.js", "assets/soberano.css", "assets/canon.css",
                "assets/page-comment.js", "atlas-en.json", "atlas-arena-en.json")

    def test_ningun_fichero_del_juego_retirado_existe(self):
        vivos = [f for f in self.FICHEROS if (PUBLICO / f).exists()]
        self.assertEqual(vivos, [], "vuelven ficheros del juego retirado")

    def test_el_precache_no_los_lista(self):
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8") + (PUBLICO / "sw.js").read_text(encoding="utf-8")
        for f in self.FICHEROS:
            with self.subTest(fichero=f):
                self.assertNotIn("'/" + f + "'", listas, f"el precache sigue listando /{f}")


if __name__ == "__main__":
    unittest.main(verbosity=1)
