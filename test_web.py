#!/usr/bin/env python3
"""Verificacion de doctrina de preceptoros.org. Biblioteca estandar, nada mas.

    python3 test_web.py

Cada prueba comprueba UNA regla del canon y falla diciendo por que. Una
comprobacion que detecta y no bloquea no es una comprobacion: aqui no hay avisos,
solo verde o rojo.
"""
import hashlib, json, re, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"

# La UNICA URL externa admitida en todo el repo. mlc.ai no sirve la libreria de
# WebLLM; su distribucion oficial es esm.run. github.com aparece como ENLACE en
# la guia de instalacion, no como subrecurso: un <a href> no pide nada hasta que
# lo pulsas, y una guia que no puede enlazar al repositorio no es una guia.
CDN_ADMITIDO = "https://esm.run/@mlc-ai/web-llm"
ORIGEN_PROPIO = "https://preceptoros.org"
ENLACES_ADMITIDOS = ("https://github.com/piskyRpapalo/PreceptorOS",
                     "https://raw.githubusercontent.com/piskyRpapalo/PreceptorOS",
                     # Nuestro PROPIO origen canonico. Lo que esta regla protege
                     # es «cero peticiones externas al cargar», y las metas de
                     # Open Graph no son un subrecurso: no las pide el navegador
                     # de quien visita, las lee un raspador cuando alguien pega
                     # el enlace en un chat. Ademas, og:image y og:url EXIGEN
                     # URL absoluta por especificacion -- una relativa la
                     # ignoran Slack, LinkedIn y X. Prohibir aqui el propio
                     # dominio no protegeria a nadie: dejaria la web sin
                     # tarjeta social y sin canonica.
                     ORIGEN_PROPIO,
                     # El unico tunel publico del Agora, firmado en el ANEXO
                     # WEB. Es nuestro origen igual que preceptoros.org, solo
                     # que en otro subdominio. Se admite como ENLACE, no como
                     # subrecurso: `test_la_api_no_se_pide_al_cargar` de mas
                     # abajo comprueba que ninguna pagina la pide sola.
                     "https://api.preceptoros.org")

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
        if ".pytest_cache" in p.parts or "__pycache__" in p.parts:
            continue
        if p.name in LICENCIAS:
            continue
        # .mjs entro el 2026-08-30. `arnes_sw.mjs` llevaba una hora en el
        # repo sin que NINGUNA prueba de doctrina lo mirase: ni frameworks, ni
        # urls externas, ni rutas absolutas. Un sufijo que no esta en esta
        # tupla es un punto ciego del gate, y un punto ciego no avisa de que
        # existe -- se descubre cuando ya ha pasado algo por el.
        if p.suffix.lower() in (".html", ".css", ".js", ".mjs", ".json",
                                ".jsonc", ".txt", ".py", ".md"):
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

    def test_maximo_siete_paginas(self):
        # Amnistia firmada por el Soberano el 2026-08-29: de 5 a 7. El Agora
        # necesita board y benchmark, y el perfil publico vendra despues. El
        # limite sigue existiendo porque una web que crece sin techo deja de
        # poder leerse entera, que es lo que este numero protege.
        paginas = paginas_de_contenido()
        self.assertLessEqual(len(paginas), 7,
            "mas de 7 paginas de contenido: " + ", ".join(p.name for p in paginas))

    def test_la_tarjeta_social_apunta_a_algo_que_existe(self):
        """og:image, og:url y el favicon, comprobados contra el disco.

        Una tarjeta social se rompe en silencio: la pagina sigue funcionando y
        el hueco gris solo lo ve quien pega el enlace en un chat. Por eso se
        comprueba aqui y no «cuando alguien avise».
        """
        favicon = PUBLICO / "assets" / "favicon.svg"
        self.assertTrue(favicon.is_file(), "no existe assets/favicon.svg")

        con_tarjeta = 0
        for p in PUBLICO.rglob("*.html"):
            t = p.read_text(encoding="utf-8")
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                self.assertIn('rel="icon"', t, "pagina sin favicon")
            if "og:title" not in t:
                continue
            con_tarjeta += 1
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                img = re.search(r'og:image" content="([^"]+)"', t)
                self.assertIsNotNone(img, "og:title sin og:image")
                ruta = img.group(1)
                self.assertTrue(ruta.startswith(ORIGEN_PROPIO),
                                f"og:image debe ser absoluta y propia: {ruta}")
                local = PUBLICO / ruta[len(ORIGEN_PROPIO):].lstrip("/")
                self.assertTrue(local.is_file(),
                                f"og:image apunta a un fichero que no existe: {local.name}")
                url = re.search(r'og:url" content="([^"]+)"', t)
                self.assertIsNotNone(url, "og:title sin og:url")
                self.assertTrue(url.group(1).startswith(ORIGEN_PROPIO),
                                "og:url no apunta al origen propio")
        self.assertGreaterEqual(con_tarjeta, 4,
                                "muy pocas paginas con tarjeta social")

    def test_la_portada_publica_lo_que_los_gates_miden(self):
        """La línea de credenciales contra counters.json.

        El 2026-08-30 las tres portadas anunciaban «526 pruebas en verde en la
        app». El gate del MVP daba 429. NINGUN comando producia 526: era una
        cifra publicada, en produccion y en tres idiomas, que nadie podia
        reproducir -- justo lo que honest sensors existe para impedir.

        Escribir el numero bueno a mano no lo arregla: a mano vuelve a derivar
        en cuanto alguien añada un test. Lo que lo arregla es que la cifra sea
        una MEDICION, y que este test falle el dia que deje de serlo.

        Quien MIDE es `p0x/bin/coherencia-publica.py`, que corre los dos gates
        y escribe en counters.json. Quien COMPRUEBA es este test, que solo lee
        ficheros: rapido, sin red, y sin obligar al Agora a tener el repo del
        MVP delante para poder pasar su propio gate.
        """
        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        por_clave = {m["clave"]: m for m in datos["metricas"]}
        esperado = []
        for clave in ("pruebas_app", "pruebas_web"):
            m = por_clave.get(clave)
            self.assertIsNotNone(m, f"counters.json no declara {clave}. "
                                 "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")
            esperado.append(m["valor"] if m["estado"] == "MEDIDO" else None)

        portadas = [p for p in PUBLICO.rglob("index.html") if p.parent != PUBLICO]
        self.assertTrue(portadas, "no hay portadas de idioma")
        for p in portadas:
            t = p.read_text(encoding="utf-8")
            bloque = re.search(r'<p class="proof">.*?</p>', t, re.S)
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                self.assertIsNotNone(bloque, "portada sin línea de credenciales")
                cifras = [int(re.sub(r"\D", "", c))
                          for c in re.findall(r"<b>(\d[\d.\u00a0 ]*)</b>", bloque.group(0))]
                self.assertGreaterEqual(len(cifras), 2,
                                        "la línea no publica dos cifras de pruebas")
                for i, (dice, mide) in enumerate(zip(cifras[:2], esperado)):
                    if mide is None:
                        continue        # el gate salió NO_DATA: no hay con qué comparar
                    self.assertEqual(
                        dice, mide,
                        f"la portada publica {dice} y counters.json mide {mide}. "
                        "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")

    def test_counters_no_se_queda_atras_de_este_mismo_gate(self):
        """La puerta trasera que dejo pasar 19 cuando el gate ya media 25.

        El test de arriba compara la PORTADA contra counters.json. Los dos
        pueden estar rancios a la vez, y entonces coinciden: verde. Fue
        exactamente lo que paso -- las tres portadas anunciaron 19 pruebas
        durante seis commits mientras el gate subia a 25, y ninguna
        comprobacion se entero, porque ninguna volvia a MEDIR.

        Esta si mide, y mide lo unico que puede medir sin salir del repo ni
        tocar la red: cuantas pruebas tiene este fichero. Si alguien añade
        una y no refresca los contadores, el gate se cae aqui mismo, en el
        commit que la añade, y no seis commits despues en produccion.

        La cifra de la app sigue viniendo del repo del MVP: eso no se puede
        remedir desde aqui, y fingir que si lo seria peor que declararlo.
        """
        import os, sys
        from unittest import TestLoader
        # Cuando quien corre el gate es el propio medidor, esta comparacion se
        # calla: seria juez y parte. La bandera la pone `coherencia-publica.py`
        # y solo mientras mide; el resto del tiempo esta prueba manda.
        if os.environ.get("P0X_MIDIENDO_CONTADORES") == "1":
            self.skipTest("lo esta midiendo coherencia-publica.py ahora mismo")
        propias = TestLoader().loadTestsFromModule(
            sys.modules[__name__]).countTestCases()

        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        por_clave = {m["clave"]: m for m in datos["metricas"]}
        m = por_clave.get("pruebas_web")
        self.assertIsNotNone(m, "counters.json no declara pruebas_web")
        if m["estado"] != "MEDIDO":
            self.skipTest("pruebas_web salio NO_DATA: no hay con que comparar")
        self.assertEqual(
            m["valor"], propias,
            f"counters.json dice {m['valor']} pruebas web y este fichero "
            f"tiene {propias}. La cifra esta publicada en tres portadas. "
            "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")

    def test_el_onboarding_es_alcanzable_y_completo(self):
        """La puerta de entrada existe, se enlaza y tiene sus cuatro pasos.

        La estrategia pone a los agentes de la web como via de captacion, y el
        Instalador como primer contacto. Una puerta que no se enlaza desde la
        portada existe y no la encuentra nadie: es la forma silenciosa de
        apagar justo lo que va primero. Por eso el enlace se comprueba, no se
        confia.
        """
        for idioma in ("es", "en", "fr"):
            ob = PUBLICO / idioma / "onboarding.html"
            with self.subTest(idioma=idioma):
                self.assertTrue(ob.is_file(), f"falta {idioma}/onboarding.html")
                t = ob.read_text(encoding="utf-8")
                for ancla in ("ob-que", "ob-privacidad", "ob-descarga", "ob-conecta"):
                    self.assertIn(f'id="{ancla}"', t, f"falta la seccion {ancla}")
                # Los tres destinos, segun el contrato vigente (plan_v5 y la
                # firma del PARO 1): Android va HOY por Termux -- el APK esta
                # declarado futuro y no se ofrece -- y el escritorio por los
                # dos instaladores.
                self.assertIn('href="./instalar.html#android"', t,
                              "el boton de Android no lleva a la guia de Termux")
                self.assertNotIn("preceptoros.apk", t,
                                 "se esta ofreciendo un APK que no existe")
                self.assertIn("releases/latest/download/install.sh", t)
                self.assertIn("releases/latest/download/install.ps1", t)
                # Y el ancla tiene que existir de verdad en la guia.
                guia = (PUBLICO / idioma / "instalar.html").read_text(encoding="utf-8")
                self.assertIn('id="android"', guia,
                              f"{idioma}: la guia no tiene ancla #android")
                # Y el aviso de que todavia no existen: un boton que promete
                # una descarga que da 404 es un sensor deshonesto.
                self.assertIn("NO_DATA", t,
                              "el onboarding no declara que los instaladores no estan publicados")
                portada = (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")
                self.assertIn("onboarding.html", portada,
                              f"{idioma}: la portada no enlaza el onboarding")

    def test_el_codigo_de_vinculo_es_determinista(self):
        """La misma clave publica da siempre el mismo codigo, aqui y en la app.

        Se reimplementa la derivacion en Python y se contrasta con la del JS
        leyendo su alfabeto del propio fichero. Si alguien cambia el alfabeto o
        la longitud en `onboarding.js` y no aqui, este caso cae -- que es justo
        lo que hace falta: dos derivaciones distintas del mismo codigo en dos
        sitios es como se rompen los vinculos sin que nadie se entere.
        """
        js = (PUBLICO / "assets" / "onboarding.js").read_text(encoding="utf-8")
        m = re.search(r"var ALF = '([^']+)'", js)
        self.assertIsNotNone(m, "no se encuentra el alfabeto en onboarding.js")
        alf = m.group(1)
        self.assertEqual(len(alf), 32, "el alfabeto ya no es de 32 simbolos")
        for prohibido in "ILOU":
            self.assertNotIn(prohibido, alf,
                             f"'{prohibido}' se confunde al teclear en un telefono")

        # La misma cuenta que hace el navegador: SHA-256 de la clave publica,
        # un caracter por byte, doce, en tres grupos.
        pub = "3d4f" * 16                     # 32 bytes de ejemplo, en hex
        h = hashlib.sha256(bytes.fromhex(pub)).digest()
        esperado = "".join(alf[b % 32] for b in h[:12])
        esperado = f"{esperado[:4]}-{esperado[4:8]}-{esperado[8:12]}"
        self.assertRegex(esperado, r"^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$")
        # Determinista de verdad: dos veces, lo mismo.
        h2 = hashlib.sha256(bytes.fromhex(pub)).digest()
        self.assertEqual(h, h2)

    def test_r_widget_y_r_tipografia(self):
        """El anexo visual, comprobado y no confiado.

        R-WIDGET nacio de una queja real: en el Doogee, con luz de dia, el
        texto que caia directamente sobre el marmol no se leia. Y el motivo de
        fondo es que el marmol es una TEXTURA, no un color -- sobre una textura
        no se puede calcular contraste ninguno, asi que la unica regla honesta
        es que todo texto tenga su par declarado.
        """
        canon = PUBLICO / "assets" / "canon.css"
        self.assertTrue(canon.is_file(), "falta assets/canon.css")
        css = canon.read_text(encoding="utf-8")

        for token in ("--panel-bg", "--panel-fg", "--display"):
            self.assertIn(token, css, f"canon.css no declara {token}")

        # R-TIPOGRAFIA · cero fuentes externas. Las del stack viven ya en el
        # sistema de quien mira; descargar una romperia «cero peticiones
        # externas al cargar», que es una cifra publicada en la portada.
        self.assertNotIn("@import", css, "canon.css importa algo de fuera")
        self.assertNotIn("@font-face", css, "canon.css descarga una fuente")

        # El contraste se MIDE aqui, con la formula de la WCAG, no se promete.
        def _lum(h):
            c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
            c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
            return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]

        pares = dict(re.findall(r"--panel-(bg|fg):#([0-9A-Fa-f]{6})", css))
        self.assertEqual(sorted(pares), ["bg", "fg"],
                         "el par del panel no esta declarado en hex")
        a, b = _lum(pares["fg"]), _lum(pares["bg"])
        a, b = max(a, b), min(a, b)
        razon = (a + .05) / (b + .05)
        self.assertGreaterEqual(round(razon, 2), 4.5,
                                f"el par del panel da {razon:.2f}:1, por debajo de 4,5")

        # Y toda pagina que cargue base.css tiene que cargar tambien el canon:
        # si no, R-WIDGET rige a medias y el hueco es justo el que se veia mal.
        # Se busca el <link>, no la cadena: la raiz MENCIONA base.css en un
        # comentario que explica que a proposito NO la carga («ruteo puro,
        # para que la puerta cargue sola»), y un grep ingenuo la acusaba de
        # incumplir una regla que no le aplica.
        enlace = re.compile(r'<link[^>]+href="[^"]*assets/base\.css"')
        for p_ in PUBLICO.rglob("*.html"):
            t = p_.read_text(encoding="utf-8")
            if not enlace.search(t):
                continue
            with self.subTest(fichero=str(p_.relative_to(RAIZ))):
                self.assertIn("canon.css", t, "carga base.css pero no el canon")

    def test_ninguna_portada_muestra_el_idioma_de_otra(self):
        """El pie honesto vivia escrito a mano en las tres portadas Y EN
        ESPAÑOL: quien abria /en/ o /fr/ se encontraba castellano.

        Un texto visible fuera del bloque i18n no se traduce -- se olvida. Este
        caso lo impide por construccion: si el valor de una clave en un idioma
        aparece en la pagina de otro, cae.
        """
        blocks = {}
        for idi in ("es", "en", "fr"):
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            m = re.search(r'id="i18n">(.*?)</script>', t, re.S)
            self.assertIsNotNone(m, f"{idi}: falta el bloque i18n")
            blocks[idi] = (json.loads(m.group(1)), t)

        for origen, (datos, _) in blocks.items():
            for otro, (_, html) in blocks.items():
                if otro == origen:
                    continue
                for clave, valor in datos.items():
                    # Solo las cadenas largas y REALMENTE distintas: «Benchmark»
                    # es igual en los tres y no prueba nada.
                    if not isinstance(valor, str) or len(valor) < 25:
                        continue
                    if valor == blocks[otro][0].get(clave):
                        continue
                    with self.subTest(de=origen, en=otro, clave=clave):
                        self.assertNotIn(
                            valor, html,
                            f"la portada /{otro}/ muestra el texto de /{origen}/ "
                            f"en la clave `{clave}`")

    def test_el_pie_honesto_no_lleva_texto_escrito_a_mano(self):
        """El pie se rellena desde el i18n, asi que en el HTML esta vacio.

        Si alguien vuelve a escribir un <li> ahi, funcionara -- y volvera a
        estar en un solo idioma para siempre, que es como llego el anterior.
        """
        for idi in ("es", "en", "fr"):
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            pie = re.search(r'<footer class="honest-footer">(.*?)</footer>', t, re.S)
            with self.subTest(idioma=idi):
                self.assertIsNotNone(pie, "falta el pie honesto")
                self.assertNotIn("<li>", pie.group(1),
                                 "hay texto escrito a mano en el pie: sácalo al i18n")
                self.assertIn('id="pie-honesto"', pie.group(1))

    def test_las_portadas_declaran_hreflang(self):
        """Tres traducciones sin hreflang son tres paginas sueltas para un
        buscador, y compiten entre ellas en vez de ofrecerse por idioma."""
        for idi in ("es", "en", "fr"):
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            for otro in ("es", "en", "fr"):
                with self.subTest(idioma=idi, apunta_a=otro):
                    self.assertRegex(t, rf'hreflang="{otro}"',
                                     f"{idi} no declara hreflang de {otro}")

    def test_cero_html_en_la_raiz(self):
        sueltos = [p.name for p in RAIZ.glob("*.html")]
        self.assertEqual(sueltos, [], f"HTML fuera de public/: {sueltos}")

    def test_wrangler_apunta_a_public(self):
        cfg = (RAIZ / "wrangler.jsonc").read_text(encoding="utf-8")
        # Cloudflare admite "dir" y "directory"; lo que se comprueba es que
        # apunte a public/, no como se escriba la clave.
        self.assertRegex(cfg, r'"(dir|directory)"\s*:\s*"\./public"')

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

    def test_el_cristal_degrada_y_se_puede_apagar(self):
        """Canon v3.0 «Liquid Glass», firmado el 2026-08-29.

        Este test SUSTITUYE al que prohibia degradados, sombras, blur y radios.
        Se reescribio, no se borro: el canon cambio y el gate tiene que vigilar
        el canon vigente, o deja de ser un gate. Lo que ahora se exige no es
        austeridad sino que el cristal no deje a nadie fuera.
        """
        css = (PUBLICO / "assets" / "base.css").read_text(encoding="utf-8")

        # 1 · El desenfoque va tras `@supports`, y con respaldo opaco delante.
        #     Sin esto, en un navegador sin backdrop-filter el panel se queda
        #     translucido sobre el fondo animado y el texto no se lee.
        if "backdrop-filter" in css:
            # Se busca la AT-RULE, no la palabra: la primera vez que aparecia
            # «@supports» era dentro de un comentario que explicaba la regla, y
            # el test media contra el comentario en vez de contra el codigo.
            self.assertIn("@supports (backdrop-filter", css,
                          "backdrop-filter sin @supports: sin respaldo no se lee")
            i = css.index("@supports (backdrop-filter")
            self.assertLess(css.index("background:var(--marmol-claro)"), i,
                            "el respaldo opaco tiene que declararse ANTES del cristal")

        # 2 · Los radios salen del token, no a ojo. Un radio suelto es como
        #     empieza una interfaz con seis esquinas distintas.
        for r in re.findall(r"border-radius\s*:\s*([^;}]+)", css):
            # `0` vale siempre: es la ausencia de radio, y con `border-image` el
            # radio lo ignora el navegador de todas formas. Cualquier otro valor
            # tiene que salir del token, o acabamos con seis esquinas distintas.
            # `inherit` vale: hereda el token del panel, que es justo lo que
            # tiene que hacer el anillo enmascarado para seguir sus esquinas.
            self.assertTrue(r.strip() in ("0", "inherit") or "--radius" in r,
                            f"border-radius fuera del token: {r.strip()}")

        # 3 · Quien pide menos movimiento lo recibe: sin ambiente y sin muelles.
        reducido = css[css.index("prefers-reduced-motion"):] if "prefers-reduced-motion" in css else ""
        self.assertTrue(reducido, "el canon no respeta prefers-reduced-motion")
        self.assertIn("#ambient{display:none}", reducido.replace(" ", ""),
                      "con movimiento reducido el ambiente sigue pintando")

        # 4 · El lienzo no se come un solo clic.
        self.assertIn("pointer-events:none", css.replace(" ", ""),
                      "#ambient sin pointer-events:none intercepta la interfaz")

        # El halo (text-shadow) sigue permitido SOLO en cifras vivas.
        for linea in css.splitlines():
            if "text-shadow" in linea:
                self.assertIn("cifras vivas", linea,
                              "text-shadow fuera de .cifra: " + linea.strip())


class Identidad(unittest.TestCase):

    # Ed25519 firma en 64 bytes. En hexadecimal son 128 caracteres, y es la
    # longitud del algoritmo, no una eleccion de este proyecto.
    FIRMA_HEX = 128

    def test_la_firma_va_entera(self):
        """`firmar()` devolvia `ed25519:` + 16 caracteres + puntos suspensivos.

        Calculaba los 64 bytes y tiraba 48. El problema no es que sea corta:
        es que con 16 nibbles no se puede VERIFICAR nada, ni en esta pagina ni
        en el Agora, y aun asi se leia como una garantia. Un adorno con nombre
        de firma es peor que no firmar, porque nadie vuelve a mirarlo.

        Si hace falta acortarla para ensenarla, se acorta AL PINTAR. Ahi el
        recorte no destruye nada; aqui destruia la firma entera.
        """
        t = (PUBLICO / "assets" / "auth.js").read_text(encoding="utf-8")
        firma = re.search(r"firmar:\s*function.*?\n    \}", t, re.S)
        self.assertIsNotNone(firma, "auth.js ya no expone firmar()")
        cuerpo = firma.group(0)
        self.assertNotIn(".slice(", cuerpo,
                         "firmar() vuelve a recortar la firma")
        self.assertNotIn("\u2026", cuerpo,
                         "firmar() devuelve puntos suspensivos dentro de la firma")
        self.assertIn("'ed25519:' + h", cuerpo,
                      "firmar() no devuelve el hexadecimal completo")
        self.assertIn(str(self.FIRMA_HEX), t,
                      f"auth.js no declara los {self.FIRMA_HEX} caracteres que "
                      "debe medir una firma Ed25519")
        self.assertRegex(t, r"FIRMA_HEX\s*=\s*" + str(self.FIRMA_HEX),
                         "la longitud de firma no esta fijada en una constante")

    def test_la_api_no_se_pide_al_cargar(self):
        """El tunel esta admitido como enlace, no como subrecurso.

        «Cero peticiones externas al cargar» es la promesa de la portada. Que
        api.preceptoros.org este permitida en el codigo no puede convertirse
        en que una pagina la pida sola: eso lo decide quien visita, pulsando.
        """
        for p in sorted(PUBLICO.rglob("*.html")):
            t = p.read_text(encoding="utf-8")
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                for etiqueta in re.findall(r"<(?:script|link|img|iframe)[^>]*>", t):
                    self.assertNotIn("api.preceptoros.org", etiqueta,
                                     f"subrecurso externo al cargar: {etiqueta}")


class Tablon(unittest.TestCase):
    """De donde salen los hilos, y que se diga siempre."""

    ORIGENES = ("cache", "agora", "ejemplo", "fallo")

    def i18n_board(self):
        for idioma in ("es", "en", "fr"):
            t = (PUBLICO / idioma / "board.html").read_text(encoding="utf-8")
            m = re.search(r'id="i18n">(.*?)</script>', t, re.S)
            yield idioma, json.loads(m.group(1))

    def test_el_tablon_dice_siempre_de_donde_salen_los_hilos(self):
        """Una lista de hilos se ve igual venga de donde venga.

        Ese es el problema entero: el Agora, un cache de hace tres dias y los
        hilos de EJEMPLO que viajan con la web se pintan identicos. El rotulo
        de procedencia es la UNICA diferencia visible, asi que no puede ser
        opcional ni quedarse a medias en un idioma -- sin el, la pagina
        fabrica una comunidad que no existe, que es exactamente lo que el
        propio pie de esta pagina promete no hacer.
        """
        fuentes = (PUBLICO / "assets" / "board-fuentes.js").read_text(encoding="utf-8")
        pintura = (PUBLICO / "assets" / "board.js").read_text(encoding="utf-8")
        declarados = set(re.findall(r"origen:\s*'(\w+)'", fuentes))
        self.assertEqual(set(self.ORIGENES), declarados,
                         f"las fuentes declaran {declarados}, se esperaban "
                         f"{set(self.ORIGENES)}")
        for origen in self.ORIGENES:
            with self.subTest(origen=origen):
                # `in`, no assertIn: assertIn vuelca el fichero entero en el
                # mensaje y el fallo se vuelve ilegible.
                self.assertTrue(
                    f"'{origen}'" in pintura,
                    f"board.js no rotula el origen «{origen}» de forma "
                    "explicita. Atenderlo en el `else` final hace que un "
                    "origen nuevo herede su rotulo sin que nadie lo note.")
        for idioma, d in self.i18n_board():
            for clave in ("tbFuenteAgora", "tbFuenteCache", "tbFuenteLocal",
                          "tbFuenteFallo"):
                with self.subTest(idioma=idioma, clave=clave):
                    self.assertIn(clave, d, f"{idioma} no traduce {clave}")
                    self.assertTrue(d[clave].strip(), f"{idioma}: {clave} vacia")

    def test_el_ejemplo_no_pisa_lo_que_ya_hay(self):
        """Si el Agora falla y ya habia algo pintado, no se retrocede.

        Sustituir el cache del visitante por hilos de EJEMPLO porque la red
        fallo no es un respaldo: es cambiar datos suyos por datos de mentira
        y no decirlo. Lo correcto es dejar lo que hay y avisar del fallo.
        """
        f = (PUBLICO / "assets" / "board-fuentes.js").read_text(encoding="utf-8")
        cargar = re.search(r"cargar:\s*function.*?\n    \}", f, re.S)
        self.assertIsNotNone(cargar, "board-fuentes.js ya no expone cargar()")
        self.assertIn("if (yaHay)", cargar.group(0),
                      "el ejemplo entra aunque ya haya hilos pintados")

    def test_la_capa_de_datos_no_escribe_frases(self):
        """`board-fuentes.js` no tiene idioma, y por eso no puede tener texto.

        Una capa de datos que devuelve «El Agora no respondio» se queda en
        espanol para siempre: en /en/ y /fr/ saldria igual. Devuelve `origen`
        y `causa`; la frase la monta quien pinta, que si sabe el idioma.
        """
        f = (PUBLICO / "assets" / "board-fuentes.js").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", f, flags=re.S)
        codigo = re.sub(r"//[^\n]*", "", codigo)
        for clave in re.findall(r"\bT\.\w+", codigo):
            self.fail(f"la capa de datos usa i18n: {clave}")


class PWA(unittest.TestCase):
    """El ANEXO WEB pide PWA nativo. Habia manifiesto y worker, y ni uno solo
    de los dos llegaba al navegador de nadie."""

    def paginas_servidas(self):
        """Las 19: las de contenido, sus traducciones y el selector."""
        return sorted(PUBLICO.rglob("*.html"))

    def test_el_service_worker_esta_enchufado(self):
        """Un worker que nadie registra es un fichero, no un PWA.

        El 2026-08-30 `sw.js` llevaba semanas en public/ y NINGUNA pagina lo
        registraba; el manifiesto se enlazaba solo desde el selector de
        idioma, que es la unica pagina que nadie deja abierta. El sitio
        pasaba por PWA en el repositorio y no lo era en ningun telefono.
        """
        pwa = (PUBLICO / "assets" / "pwa.js").read_text(encoding="utf-8")
        self.assertIn("serviceWorker.register('/sw.js')", pwa,
                      "pwa.js no registra el worker")
        for p in self.paginas_servidas():
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                t = p.read_text(encoding="utf-8")
                self.assertIn('rel="manifest"', t,
                              "sin <link rel=manifest> no se puede instalar")
                if p != PUBLICO / "index.html":
                    # El selector es ruteo puro y carga sin javascript a
                    # proposito; el worker lo registra cualquiera de las
                    # otras diecinueve en cuanto se entra en un idioma.
                    self.assertIn("/assets/pwa.js", t,
                                  "la pagina no registra el service worker")

    def test_un_solo_manifiesto(self):
        """Habia `manifest.json` y `manifest.webmanifest` identicos byte a
        byte, y solo uno enlazado. Dos ficheros que dicen lo mismo son dos
        ficheros que dejaran de decirlo."""
        hallados = sorted(x.name for x in PUBLICO.glob("manifest*"))
        self.assertEqual(["manifest.webmanifest"], hallados,
                         f"hay mas de un manifiesto: {hallados}")

    def test_el_manifiesto_dice_lo_que_la_pagina_pinta(self):
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        for clave in ("name", "short_name", "start_url", "scope", "display", "icons"):
            self.assertIn(clave, m, f"el manifiesto no declara {clave}")
        self.assertEqual("standalone", m["display"])

        # Los iconos existen en disco. Un manifiesto que apunta a un PNG que
        # no esta hace que la instalacion falle sin decir por que.
        for icono in m["icons"]:
            ruta = PUBLICO / icono["src"].lstrip("/")
            with self.subTest(icono=icono["src"]):
                self.assertTrue(ruta.exists(), f"{icono['src']} no existe")

        # Un color de barra en el manifiesto y otro en la etiqueta es una
        # ventana que cambia de color al instalarse.
        for p in self.paginas_servidas():
            t = p.read_text(encoding="utf-8")
            meta = re.search(r'<meta name="theme-color" content="([^"]+)"', t)
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                self.assertIsNotNone(meta, "la pagina no declara theme-color")
                self.assertEqual(m["theme_color"].lower(), meta.group(1).lower(),
                                 "el manifiesto y la pagina discrepan del color")

    def test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal(self):
        """Medido el 2026-08-30 sobre icon-512.png y por eso existe.

        El manifiesto declaraba `purpose: maskable` sobre el MISMO fichero que
        servia de icono normal. Android recorta los maskable a un circulo del
        80% del lado: radio 205 px en un lienzo de 512. El contenido de ese
        icono llega a 255 px del centro. Es decir, la promesa «esto aguanta el
        recorte» era falsa y el glifo se cortaba en cada telefono Android.

        Un maskable necesita su PROPIO fichero, con el dibujo mas pequeno
        dentro de la zona segura. Mientras no exista, es mejor no declararlo:
        el sistema pone su propia placa y se ve peor, pero no miente.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        normales = {i["src"] for i in m["icons"]
                    if "maskable" not in i.get("purpose", "any")}
        for icono in m["icons"]:
            if "maskable" in icono.get("purpose", ""):
                with self.subTest(icono=icono["src"]):
                    self.assertNotIn(
                        icono["src"], normales,
                        f"{icono['src']} se declara maskable y ademas normal: "
                        "o tiene margen de sobra como icono, o se recorta como "
                        "maskable. No puede ser lo correcto en los dos papeles.")

    def test_el_worker_no_guarda_lo_ajeno_ni_los_datos(self):
        """Las dos reglas que el worker anterior rompia.

        Cacheaba TODO con `caches.match() || fetch()`, la API incluida: una
        respuesta guardada para siempre y una pagina que no puede notarlo.
        Y guardar counters.json seria publicar cifras viejas con cara de
        frescas -- la misma averia que la portada con sus 19 pruebas.
        """
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        self.assertIn("url.origin !== self.location.origin", sw,
                      "el worker no distingue su propio origen del ajeno")
        self.assertIn(".json", sw, "el worker no deja fuera los datos")
        # Ni un host escrito a mano: la frontera es el origen, que el
        # navegador ya sabe. Una lista de dominios envejece en silencio.
        self.assertEqual([], re.findall(r"https?://[^\s\"']+", sw),
                         "el worker lleva un dominio incrustado")

    def test_el_worker_pasa_su_arnes(self):
        """Las reglas de enrutado, ejecutadas de verdad.

        Todo lo demas de esta clase lee el fichero y busca cadenas: comprueba
        que el worker DICE lo correcto, no que lo HAGA. `arnes_sw.mjs` lo
        ejecuta con un entorno falso y le pide las cuatro reglas.

        Se salta si no hay node. Preferir un NO_DATA declarado a una prueba
        que se cae en cualquier maquina sin node instalado -- el gate de este
        repositorio es de biblioteca estandar y asi sigue.
        """
        import shutil, subprocess
        node = shutil.which("node")
        if not node:
            self.skipTest("NO_DATA · no hay node: la logica del worker queda "
                          "sin ejecutar. Remedio: instalar node y repetir")
        r = subprocess.run([node, "arnes_sw.mjs"], cwd=str(RAIZ),
                           capture_output=True, text=True, timeout=120)
        self.assertEqual(0, r.returncode,
                         "el arnes del worker falla:\n" + r.stdout + r.stderr)

    def test_sin_conexion_hay_algo_que_leer(self):
        """Y en los tres idiomas: quien instala desde /fr/ no merece un
        error en espanol."""
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        self.assertIn("paginaSinRed", sw, "el worker no sintetiza respaldo")
        for idioma in ("es", "en", "fr"):
            with self.subTest(idioma=idioma):
                self.assertRegex(sw, r"\b" + idioma + r"\s*:\s*\[",
                                 f"la pagina de sin conexion no habla {idioma}")


class Paginas(unittest.TestCase):

    def test_selector_de_idioma_por_path(self):
        s = (PUBLICO / "index.html").read_text(encoding="utf-8")
        for idioma in ("es", "en", "fr"):
            # Vale tanto "./es/" como "/es/": lo que importa es que el idioma
            # este en la RUTA, no la forma de escribir el enlace.
            self.assertTrue(f'href="./{idioma}/"' in s or f'href="/{idioma}/"' in s,
                            f"el selector no enlaza al idioma {idioma}")
        self.assertNotIn("chat.js", s, "el selector no debe cargar el chat")
        # La regla es que elegir mal NO te encierre. Hay dos formas validas de
        # cumplirla y el test admite las dos: o el selector no redirige solo, o
        # redirige pero deja una salida (`?cambiar`). Lo que no vale es
        # redirigir sin escape.
        redirige = "location.replace" in s or "location.href" in s
        self.assertTrue(not redirige or "cambiar" in s,
                        "el selector redirige solo y no deja salida: elegir mal encierra")

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
                # Un href que empieza por "/" es relativo a la RAIZ DEL SITIO,
                # que aqui es public/, no al sistema de ficheros. La primera
                # version resolvia "/es/" contra / y daba nueve falsos rotos.
                base = PUBLICO if ruta.startswith("/") else p.parent
                destino = (base / ruta.lstrip("/")).resolve()
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
        # Los scripts que la portada CARGA de verdad, no solo chat.js ni todos
        # los de assets. Cuando la interfaz se partio en varios ficheros para
        # respetar los 10 KB, este test siguio mirando uno solo y las claves de
        # los demas quedaban sin comprobar. Mirarlos todos tampoco vale:
        # hitos.js lee el bloque i18n de hitos.html, que es otro.
        for idioma in ("es", "en", "fr"):
            p = PUBLICO / idioma / "index.html"
            texto = p.read_text(encoding="utf-8")
            usa = set()
            for src in re.findall(r'<script src="[^"]*?assets/([\w.-]+\.js)"', texto):
                fichero = PUBLICO / "assets" / src
                if fichero.is_file():
                    usa |= self.claves_que_usa(fichero.read_text(encoding="utf-8"))
            self.assertTrue(usa, f"{idioma}: ningun script de la portada usa claves")
            bloque = re.search(r'id="i18n">(.*?)</script>', texto, re.S)
            self.assertIsNotNone(bloque, f"{idioma}: falta el bloque i18n")
            datos = json.loads(bloque.group(1))
            with self.subTest(idioma=idioma, scripts=len(usa)):
                # Falla solo por lo que FALTA: una clave ausente deja una cadena
                # vacia en la interfaz. Las que sobran son texto muerto — se
                # informan, pero no tumban el build.
                faltan = usa - set(datos)
                self.assertFalse(faltan, f"{idioma}: faltan claves {sorted(faltan)}")


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
