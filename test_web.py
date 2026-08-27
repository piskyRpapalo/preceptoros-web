#!/usr/bin/env python3
"""Verificacion de doctrina de preceptoros.org. Biblioteca estandar, nada mas.

    python3 test_web.py

Cada prueba comprueba UNA regla del canon y falla diciendo por que. Una
comprobacion que detecta y no bloquea no es una comprobacion: aqui no hay avisos,
solo verde o rojo.
"""
import json, re, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"

# La UNICA URL externa admitida en todo el repo. mlc.ai no sirve la libreria de
# WebLLM; su distribucion oficial es esm.run. github.com aparece como ENLACE en
# la guia de instalacion, no como subrecurso: un <a href> no pide nada hasta que
# lo pulsas, y una guia que no puede enlazar al repositorio no es una guia.
CDN_ADMITIDO = "https://esm.run/@mlc-ai/web-llm"
ENLACES_ADMITIDOS = ("https://github.com/piskyRpapalo/PreceptorOS",
                     "https://raw.githubusercontent.com/piskyRpapalo/PreceptorOS")

FRAMEWORKS = r"\breact\b|vue\.js|angular|htmx|alpine\.js|jquery|svelte|tailwind"

# Los ficheros de licencia se excluyen POR SU NOMBRE, a proposito. Llevan dentro
# urls de apache.org y creativecommons.org, y son texto legal literal que no se
# toca ni se recorta. Ya quedaban fuera antes, pero por accidente —no tienen
# sufijo—, y una regla que se cumple por casualidad se rompe el dia que alguien
# renombre el fichero a LICENSE.txt.
LICENCIAS = {"LICENSE", "LICENSE-PROSE"}
TOPE_FICHERO = 10 * 1024
TOPE_SPRITE = 50 * 1024
TOPE_LAMINA = 30 * 1024


def textos():
    """Todo fichero de texto del repo, con su ruta. .git fuera."""
    for p in sorted(RAIZ.rglob("*")):
        if not p.is_file() or ".git" in p.parts or "historial" in p.parts:
            continue
        if p.name in LICENCIAS:
            continue
        if p.suffix.lower() in (".html", ".css", ".js", ".json", ".jsonc", ".txt", ".py", ".md"):
            yield p, p.read_text(encoding="utf-8")


def paginas_de_contenido():
    """Paginas de CONTENIDO unico.

    Criterio fijado en el commit 1 y usado igual por contadores.py: la raiz es
    ruteo (3 KB de selector, sin contenido) y en/ y fr/ son traducciones de es/,
    no paginas nuevas. Si este criterio cambia, cambia en los dos sitios — o el
    test dara verde sobre una regla que ya no es la del proyecto.
    """
    return sorted(p for p in PUBLICO.rglob("*.html")
                  if p.parent not in (PUBLICO / "en", PUBLICO / "fr")
                  and p != PUBLICO / "index.html")


class Estructura(unittest.TestCase):

    def test_maximo_cinco_paginas(self):
        paginas = paginas_de_contenido()
        self.assertLessEqual(len(paginas), 5,
            "mas de 5 paginas de contenido: " + ", ".join(p.name for p in paginas))

    def test_cero_html_en_la_raiz(self):
        sueltos = [p.name for p in RAIZ.glob("*.html")]
        self.assertEqual(sueltos, [], f"HTML fuera de public/: {sueltos}")

    def test_wrangler_apunta_a_public(self):
        cfg = (RAIZ / "wrangler.jsonc").read_text(encoding="utf-8")
        self.assertIn('"dir": "./public"', cfg)

    def test_cada_fichero_bajo_10_kb(self):
        for p in PUBLICO.rglob("*"):
            if p.is_file() and p.suffix in (".html", ".css", ".js"):
                with self.subTest(fichero=str(p.relative_to(RAIZ))):
                    self.assertLess(p.stat().st_size, TOPE_FICHERO,
                        f"{p.name} pesa {p.stat().st_size} B")


class Doctrina(unittest.TestCase):

    def test_cero_frameworks(self):
        for p, t in textos():
            if p.name == "test_web.py":
                continue    # este fichero NOMBRA los frameworks para prohibirlos
            with self.subTest(fichero=p.name):
                self.assertIsNone(re.search(FRAMEWORKS, t, re.I),
                                  f"framework mencionado en {p}")

    def test_solo_un_cdn_y_es_webllm(self):
        for p, t in textos():
            if p.name == "test_web.py":
                continue
            for url in re.findall(r"https?://[^\s\"'<>)]+", t):
                url = url.rstrip(".,")
                if url.startswith("http://127.0.0.1"):
                    continue                      # localhost del usuario, no un tercero
                if url.startswith(ENLACES_ADMITIDOS):
                    continue                      # enlaces, no subrecursos
                with self.subTest(fichero=p.name, url=url):
                    self.assertTrue(url.startswith(CDN_ADMITIDO),
                                    f"URL externa no admitida en {p}: {url}")

    def test_cero_rutas_absolutas_ni_ips(self):
        for p, t in textos():
            if p.name in ("test_web.py", "contadores.py"):
                continue    # guiones locales: resuelven su propia ruta, no la escriben
            with self.subTest(fichero=p.name):
                self.assertNotIn("/home/", t, f"ruta absoluta en {p}")
                for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", t):
                    self.assertEqual(ip, "127.0.0.1", f"IP incrustada en {p}: {ip}")

    def test_cero_gradientes_sombras_y_radios(self):
        css = (PUBLICO / "assets" / "base.css").read_text(encoding="utf-8")
        for prohibido in ("linear-gradient", "radial-gradient", "box-shadow", "backdrop-filter"):
            self.assertNotIn(prohibido, css)
        radios = re.findall(r"border-radius\s*:\s*([^;}]+)", css)
        self.assertTrue(all(r.strip() == "0" for r in radios), f"border-radius no nulo: {radios}")
        # El halo (text-shadow) esta permitido SOLO en cifras vivas.
        for linea in css.splitlines():
            if "text-shadow" in linea:
                self.assertIn("cifras vivas", linea,
                              "text-shadow fuera de .cifra: " + linea.strip())


class Paginas(unittest.TestCase):

    def test_selector_de_idioma_por_path(self):
        s = (PUBLICO / "index.html").read_text(encoding="utf-8")
        for destino in ('href="./es/"', 'href="./en/"', 'href="./fr/"'):
            self.assertIn(destino, s, f"el selector no enlaza a {destino}")
        self.assertNotIn("chat.js", s, "el selector no debe cargar el chat")
        self.assertIn("cambiar", s, "sin salida `?cambiar`, elegir mal encierra en un idioma")

    def test_todas_las_paginas_tienen_pie_honesto(self):
        for p in paginas_de_contenido() + [PUBLICO / "en/index.html", PUBLICO / "fr/index.html"]:
            with self.subTest(pagina=p.name):
                self.assertIn('class="honest-footer"', p.read_text(encoding="utf-8"))

    def test_los_enlaces_internos_existen(self):
        """Ningun enlace relativo apunta a una pagina que no esta.

        Existe por una cicatriz: las tres landings enlazaron a instalar.html y
        lore.html varios commits antes de que existieran.
        """
        for p in PUBLICO.rglob("*.html"):
            s = p.read_text(encoding="utf-8")
            for href in re.findall(r'href="([^"]+)"', s):
                if href.startswith(("http", "#", "mailto:")):
                    continue
                ruta = href.split("#")[0].split("?")[0]
                if not ruta:
                    continue
                destino = (p.parent / ruta).resolve()
                if destino.is_dir():
                    destino = destino / "index.html"
                with self.subTest(pagina=str(p.relative_to(PUBLICO)), href=href):
                    self.assertTrue(destino.exists(), f"enlace roto: {href} -> {destino}")


class Traducciones(unittest.TestCase):

    @staticmethod
    def claves_que_usa(js):
        # Se quitan los comentarios ANTES de mirar: si no, la propia
        # documentacion del fichero se inventa claves. Paso por aqui.
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        js = re.sub(r"(?m)//.*$", "", js)
        return set(re.findall(r"\bT\.([A-Za-z]+)", js))

    def test_los_tres_idiomas_tienen_las_mismas_claves(self):
        usa = self.claves_que_usa((PUBLICO / "assets" / "chat.js").read_text(encoding="utf-8"))
        self.assertTrue(usa, "no se encontro ninguna clave en chat.js")
        for idioma in ("es", "en", "fr"):
            p = PUBLICO / idioma / "index.html"
            bloque = re.search(r'id="i18n">(.*?)</script>', p.read_text(encoding="utf-8"), re.S)
            self.assertIsNotNone(bloque, f"{idioma}: falta el bloque i18n")
            datos = json.loads(bloque.group(1))
            with self.subTest(idioma=idioma):
                self.assertEqual(set(datos), usa,
                    f"{idioma}: faltan {sorted(usa - set(datos))}, sobran {sorted(set(datos) - usa)}")


class Imagenes(unittest.TestCase):

    def test_el_sprite_pesa_menos_de_50_kb(self):
        a = PUBLICO / "assets"
        total = (a / "despierta.webp").stat().st_size + (a / "habla.webp").stat().st_size
        self.assertLess(total, TOPE_SPRITE, f"el sprite pesa {total} B")

    def test_cada_lamina_pesa_menos_de_30_kb(self):
        for p in sorted((PUBLICO / "assets").glob("lamina-*.webp")):
            with self.subTest(lamina=p.name):
                self.assertLess(p.stat().st_size, TOPE_LAMINA, f"{p.name}: {p.stat().st_size} B")

    def test_hay_cinco_laminas(self):
        self.assertEqual(len(list((PUBLICO / "assets").glob("lamina-*.webp"))), 5)


class Contadores(unittest.TestCase):

    def setUp(self):
        self.datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))

    def test_toda_metrica_esta_medida_o_declara_su_causa(self):
        for m in self.datos["metricas"]:
            with self.subTest(metrica=m["clave"]):
                if m["estado"] == "MEDIDO":
                    self.assertIsNotNone(m["valor"])
                    self.assertTrue(m.get("como"), "una cifra medida lleva su metodo al lado")
                else:
                    self.assertEqual(m["estado"], "NO_DATA")
                    self.assertIsNone(m["valor"], "NO_DATA no lleva valor")
                    self.assertTrue(m.get("causa"), "NO_DATA sin causa no es NO_DATA")

    def test_ningun_cero_decorativo(self):
        """Un 0 solo vale si `como` NOMBRA la lectura de la que salio.

        La primera version de esta prueba solo miraba que `como` fuese largo, y
        una prueba de mutacion la pillo: un texto largo y vacio pasaba igual. La
        longitud no es prueba de nada. Ahora se exige vocabulario de medicion
        explicito — es una heuristica, y se dice que lo es, pero distingue "sale
        de medir con performance.getEntriesByType" de un relleno cualquiera.
        """
        medicion = re.compile(r"\bmedid[oa]\b|\bmedir\b|\blectura\b|\bmedicion\b", re.I)
        for m in self.datos["metricas"]:
            if m.get("valor") == 0:
                como = m.get("como", "")
                with self.subTest(metrica=m["clave"]):
                    self.assertTrue(como.strip(), f"{m['clave']} vale 0 y no dice de donde sale")
                    self.assertRegex(como, medicion,
                        f"{m['clave']} vale 0 y su `como` no nombra ninguna lectura: {como!r}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
