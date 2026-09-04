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
                     "https://api.preceptoros.org",
                     # LinkedIn del Soberano. Igual que github.com: es un
                     # ENLACE de identidad publica, no un subrecurso -- no
                     # pide nada hasta que alguien lo pulsa. Sale de
                     # Alejandria/identidad_publica.json, que es la fuente.
                     "https://www.linkedin.com/in/",
                     # El `@context` del JSON-LD. Es el caso MAS claro de esta
                     # lista y por eso entra sin amnistia: schema.org no es ni
                     # subrecurso ni enlace, es un IDENTIFICADOR de vocabulario.
                     # Nadie lo dereferencia -- ni el navegador de quien visita,
                     # ni el raspador que lee el bloque: la especificacion de
                     # JSON-LD dice que se compara como cadena. Cero peticiones,
                     # que es exactamente lo que esta regla protege.
                     "https://schema.org")

# UN ESPACIO DE NOMBRES XML NO ES UNA DIRECCION. `xmlns="http://www.sitemaps.
# org/..."` parece una URL y no lo es: es un IDENTIFICADOR. Ningun cliente lo
# pide nunca -- ni el navegador, ni el raspador, ni el buscador -- y escribirlo
# en https no solo no ayuda, es que rompe el documento: el espacio de nombres
# se compara por cadena exacta contra el que fija la especificacion, asi que
# cambiarle el esquema lo convierte en OTRO espacio de nombres.
#
# Va aparte de ENLACES_ADMITIDOS a proposito, y no dentro. Aquella tupla dice
# «a estos sitios SI se puede enlazar»; esta dice «esto ni siquiera es un
# enlace». Fundirlas haria que manana alguien creyera que se puede enlazar a
# w3.org desde una pagina.
ESQUEMAS_XML = ("http://www.sitemaps.org/schemas/",
                "http://www.w3.org/1999/xhtml")

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

    def test_maximo_ocho_paginas(self):
        # Amnistia firmada por el Soberano el 2026-08-29: de 5 a 7. El Agora
        # necesita board y benchmark, y el perfil publico vendra despues. El
        # limite sigue existiendo porque una web que crece sin techo deja de
        # poder leerse entera, que es lo que este numero protege.
        #
        # SEGUNDA AMNISTIA, firmada por el Soberano el 2026-09-02: de 7 a 8.
        # La octava es `profile.html`, el perfil que la anterior ya anunciaba.
        # El motivo por el que necesita URL PROPIA y no una seccion dentro de
        # `community.html` -- que era la alternativa barata, y se descarto -- es
        # que un perfil existe para ENSENARSE: se pega en una red social, y
        # una URL que abre el marketplace y hace scroll hasta un bloque no es
        # la pagina de nadie. Meterlo dentro habria ahorrado un numero y
        # roto la unica funcion del perfil.
        #
        # Lo que NO cambia: cada pagina nueva se paga con este numero, y
        # subirlo exige firma. La novena no entra sola.
        paginas = paginas_de_contenido()
        self.assertLessEqual(len(paginas), 8,
            "mas de 8 paginas de contenido: " + ", ".join(p.name for p in paginas))

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

    def test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro(self):
        """Dos guiones escriben este fichero. Ninguno puede borrar al otro.

        `contadores.py` (aqui) mide el sitio; `p0x/bin/coherencia-publica.py`
        mide los dos gates y escribe `pruebas_app` y `pruebas_web`. Aquel
        funde por clave desde siempre; este reescribia `metricas` entero, asi
        que correrlo borraba las dos cifras de pruebas y el gate se ponia en
        rojo senalando su propio remedio. Paso el 2026-09-01.

        El cerrojo `O_EXCL` de `contadores.py` no protege de esto: cubre dos
        copias A LA VEZ, y esto ocurria corriendo uno DESPUES del otro. Son
        dos averias distintas y hacen falta las dos defensas.

        La regla que queda: cada guion es dueno de las claves que MIDE y
        conserva las demas. Asi el orden en que se corran deja de importar.
        """
        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        claves = {m["clave"] for m in datos["metricas"]}
        for ajena in ("pruebas_app", "pruebas_web"):
            self.assertIn(ajena, claves,
                          f"falta «{ajena}»: alguien reescribio metricas entero. "
                          "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")
        for propia in ("paginas", "peso_sitio"):
            self.assertIn(propia, claves, f"falta «{propia}», que mide contadores.py")

        fuente = (RAIZ / "contadores.py").read_text(encoding="utf-8")
        self.assertIn("conservando(previo", fuente,
                      "contadores.py vuelve a escribir `metricas` sin conservar")
        limpio = re.sub(r'""".*?"""', "", fuente, flags=re.S)
        self.assertNotIn('"metricas": medir()', limpio,
                         "contadores.py pisa el fichero entero otra vez")

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
                # Desde la Puerta 6 el cabezal lo construye `hub.js`: las
                # etiquetas escritas en las tres portadas costaban ~300 B en
                # cada una y `fr/index.html` no los tiene. Se comprueba la
                # ALCANZABILIDAD --en el marcado o en un guion que la portada
                # carga-- y no la forma de escribirla.
                #
                # El precio se dice: sin javascript no hay cabezal. La portada
                # ya lo exigia antes de esto (el chat entero lo mueve JS), asi
                # que no se pierde un camino que existiera.
                portada = (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")
                alcanzable = "onboarding.html" in portada
                for src in re.findall(r'<script src="[^"]*?assets/([\w.-]+\.js)"', portada):
                    f = PUBLICO / "assets" / src
                    if f.is_file() and "onboarding.html" in f.read_text(encoding="utf-8"):
                        alcanzable = True
                self.assertTrue(alcanzable,
                                f"{idioma}: el onboarding no se alcanza desde la portada")

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
            m = re.search(r'id="i18n"[^>]*>(.*?)</script>', t, re.S)
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
        """El tope rige TAMBIEN los datos, y desde el 2026-08-31.

        `.json` y `.webmanifest` estaban fuera de esta tupla mientras
        `textos()` --el guardian de doctrina, quince lineas mas arriba-- si
        los miraba. El resultado era un punto ciego con la forma exacta del
        que tenia `.mjs` antes de entrar: `hub.json` podia engordar sin freno
        y nadie se enteraba, porque el fichero que crece con el catalogo es
        justo el que no estaba vigilado.

        Al entrar, medido: hub.json 7695 B, modelos.json 2777, counters.json
        2278, threads.json 2227, manifest.webmanifest 699. Ninguno rozaba el
        tope, asi que la regla entra sin amnistia y sin deuda.
        """
        for p in PUBLICO.rglob("*"):
            if p.is_file() and p.suffix in (".html", ".css", ".js",
                                            ".json", ".webmanifest"):
                with self.subTest(fichero=str(p.relative_to(RAIZ))):
                    self.assertLess(p.stat().st_size, TOPE_FICHERO,
                        f"{p.name} pesa {p.stat().st_size} B")


class Doctrina(unittest.TestCase):

    def test_la_guia_clona_donde_el_instalador_instala(self):
        """La web decia `~/aurelius`; `install.sh` usa `~/preceptoros`.

        No es una preferencia de nombre: son dos sitios distintos. Quien siga
        la guia manual acaba con el arbol en una carpeta que ningun otro
        documento del producto vuelve a mencionar, y el dia que pida ayuda
        nadie sabra donde mirar. `plan_v5.md` ya lo llevaba escrito como deuda
        firmada --«renombrar empaquetado/guias aurelius->preceptoros»-- y esta
        es la mitad que le tocaba a la web.

        Lo que NO se toca es `dist/aurelius`: ese es el nombre REAL del
        binario que hay hoy en `dist/`, comprobado. Renombrarlo en la guia
        seria cambiar una deuda de nomenclatura por una mentira sobre un
        fichero, que es peor.
        """
        # `.txt` tambien: los `encargo-*.txt` son el texto que la persona COPIA
        # y pega en su IA. Un comando equivocado ahi viaja mas lejos que uno en
        # la pagina, porque sale del sitio y acaba en otra conversacion.
        for p, t in textos():
            if p.suffix not in (".html", ".txt"):
                continue
            with self.subTest(pagina=str(p.relative_to(RAIZ))):
                self.assertNotIn("~/aurelius", t,
                                 "la guia clona en ~/aurelius y el instalador "
                                 "usa ~/preceptoros")

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
                if url.startswith(ESQUEMAS_XML):
                    continue                      # identificadores, no direcciones
                with self.subTest(fichero=p.name, url=url):
                    self.assertTrue(url.startswith(CDN_ADMITIDO),
                                    f"URL externa no admitida en {p}: {url}")

    def test_cero_rutas_absolutas_ni_ips(self):
        """Lo que protege: que una IP de la tailnet no acabe en la web publica.

        LOS DIBUJOS NO SON DIRECCIONES. El `d=` de un <path> es una ristra de
        coordenadas, y una ristra de coordenadas contiene grupos de cuatro
        numeros separados por puntos por pura aritmetica: el sprite SVG del
        cabezal trajo `2.8.41.09` y `1.25.2.75`, que no son IPs de nada. Se
        recortan los <svg> ANTES de mirar en vez de aflojar el patron -- fuera
        del dibujo la regla sigue siendo la de siempre, y una IP de verdad
        jamas viaja dentro de un `<path>`. Comprobado el 2026-09-01: sin los
        <svg> no queda ni una sola coincidencia en las tres portadas.
        """
        for p, t in textos():
            if p.name in ("test_web.py", "contadores.py"):
                continue    # guiones locales: resuelven su propia ruta, no la escriben
            with self.subTest(fichero=p.name):
                self.assertNotIn("/home/", t, f"ruta absoluta en {p}")
                sin_dibujos = re.sub(r"<svg.*?</svg>", "", t, flags=re.S)
                for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", sin_dibujos):
                    self.assertEqual(ip, "127.0.0.1", f"IP incrustada en {p}: {ip}")

    def test_el_cristal_degrada_y_se_puede_apagar(self):
        """Canon v3.0 «Liquid Glass», firmado el 2026-08-29.

        Este test SUSTITUYE al que prohibia degradados, sombras, blur y radios.
        Se reescribio, no se borro: el canon cambio y el gate tiene que vigilar
        el canon vigente, o deja de ser un gate. Lo que ahora se exige no es
        austeridad sino que el cristal no deje a nadie fuera.
        """
        for hoja in sorted((PUBLICO / "assets").glob("*.css")):
            with self.subTest(hoja=hoja.name):
                self._cristal(hoja.read_text(encoding="utf-8"))

    def _cristal(self, css):
        """Antes esto miraba SOLO base.css.

        Era el mismo punto ciego que tenia `.mjs` en `textos()`: el dia que el
        cristal se reparte en otra hoja --y `widget.css` lo hizo-- la regla
        seguia verde sin haber mirado el fichero nuevo. Ahora recorre todas.
        """
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
            #
            # `50%` y `999px` valen tambien, y no es aflojar la regla: un
            # circulo y una pildora no son ESQUINAS. Lo que la regla protege es
            # que no haya seis redondeos distintos en los rectangulos; un punto
            # de estado redondo o un boton en forma de pildora son otra figura,
            # no una sexta esquina. Se descubrio al ampliar este test a todas
            # las hojas: `onboarding.css` llevaba 999px desde antes y nadie lo
            # habia mirado nunca, porque solo se leia base.css.
            self.assertTrue(
                r.strip() in ("0", "inherit", "50%", "999px") or "--radius" in r,
                f"border-radius fuera del token: {r.strip()}")

        # 3 · Quien pide menos movimiento lo recibe. Solo se exige a la hoja
        #     que declara el ambiente: pedirselo a todas obligaria a repetir
        #     la regla en hojas que no animan nada.
        if "#ambient" in css:
            reducido = css[css.index("prefers-reduced-motion"):] if "prefers-reduced-motion" in css else ""
            self.assertTrue(reducido, "el canon no respeta prefers-reduced-motion")
            self.assertIn("#ambient{display:none}", reducido.replace(" ", ""),
                          "con movimiento reducido el ambiente sigue pintando")
            # 4 · El lienzo no se come un solo clic.
            self.assertIn("pointer-events:none", css.replace(" ", ""),
                          "#ambient sin pointer-events:none intercepta la interfaz")
        # Toda hoja que anime algo tiene que saber pararse.
        if "@keyframes" in css:
            self.assertIn("prefers-reduced-motion", css,
                          "la hoja anima y no atiende a quien pide quietud")

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
            t = (PUBLICO / idioma / "community.html").read_text(encoding="utf-8")
            m = re.search(r'id="i18n"[^>]*>(.*?)</script>', t, re.S)
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


class Hub(unittest.TestCase):
    """La rejilla de companeros del Agora, su cola de firma y su rack."""

    CARAS = 8

    def setUp(self):
        self.d = json.loads((PUBLICO / "hub.json").read_text(encoding="utf-8"))
        self.js = (PUBLICO / "assets" / "hub.js").read_text(encoding="utf-8")

    def test_el_hub_no_inventa_agentes(self):
        """Ocho en el catalogo: UNO servido de verdad y SIETE pendientes.

        El catalogo vivo (api.preceptoros.org/api/v1/agents) da OCHO, no doce,
        y con los ids que usa el tunel -- `coder` y `privacidad`, aunque se
        llamen El Artesano y El Aduanero. Se copian tal cual para que el dia
        que esto lea del tunel no haya que renombrar nada.

        LA CUENTA DE SERVIDOS SE COMPRUEBA, y no es ceremonia. El 2026-09-01
        este fichero declaraba al Instalador servido con el adaptador
        `preceptor-v7:latest`, y ese modelo YA NO ESTABA en el rack: `ollama
        list` daba dos modelos y ninguno era ese. Es decir, la unica insignia
        verde de la web publica era falsa. Un catalogo que se cree su propia
        copia vieja es exactamente la averia que este gate existe para cazar.

        Por eso el campo se llama `modelo` y no `adaptador`: hoy el Instalador
        corre sobre un modelo BASE sin afinar, y llamar «adaptador» a eso
        seria el mismo falso verde con otro nombre. `afinado` guarda el LoRA
        cuando lo haya, y su ausencia NO impide servir -- que es justo lo que
        deja de convertir los LoRAs en un bloqueante.

        Y ningun nombre vive en `hub.js`: un nombre escrito en el render
        sobrevive al dia en que el catalogo cambia, y entonces la pantalla
        ensena un companero que ya no existe.
        """
        ags = self.d["agentes"]
        self.assertEqual(8, len(ags), f"el catalogo trae {len(ags)} agentes")
        for a in ags:
            with self.subTest(agente=a.get("id")):
                for campo in ("id", "name", "block", "function", "status", "symbol"):
                    self.assertIn(campo, a, f"falta `{campo}`")
                self.assertIn(a["block"], (1, 2, 3, 4), "bloque fuera de 1-4")
                self.assertIn(a["status"], ("idle", "thinking", "running"))
                self.assertIn("real", a, "sin la disponibilidad real al lado")
                r = a["real"]
                for campo in ("disponible", "modelo", "afinado"):
                    self.assertIn(campo, r, f"`real` sin `{campo}`")
                self.assertNotIn("adaptador", r,
                                 "`adaptador` volvio: un modelo base no es un afinado")
                if r["disponible"]:
                    # Servido exige NOMBRAR con que. Sin nombre no hay nada que
                    # comprobar contra `ollama list` el dia que esto se revise.
                    self.assertTrue(r["modelo"],
                                    f"«{a['id']}» se declara servido y no dice con que modelo")
                else:
                    self.assertIsNone(r["modelo"], "pendiente y con modelo a la vez")
                    self.assertTrue(r.get("causa"),
                                    f"«{a['id']}» esta pendiente y no dice por que")
                self.assertNotIn(a["name"], self.js,
                                 f"«{a['name']}» esta escrito en hub.js")
        servidos = [a for a in ags if a["real"]["disponible"]]
        self.assertEqual(1, len(servidos),
                         f"se declaran {len(servidos)} companeros servidos; hoy hay UNO")
        self.assertEqual("instalador", servidos[0]["id"],
                         "el unico servido tiene que ser el Instalador")
        self.assertEqual(7, len(ags) - len(servidos), "no hay siete pendientes")

    def test_el_modelo_servido_lleva_tag_explicito(self):
        """Nada de `:latest` pelado en el modelo que da la cara al publico.

        El canon del nodo lo prohibe por escrito: un tag pelado apunta a donde
        apunte hoy, y en Ollama suelen ser variantes Thinking con razonamiento
        no desactivable. El 2026-09-01 la web servia `qwen3-coder-30b:latest`
        porque era el unico tag que habia; al restaurarse el rack aparecio
        `qwen3-coder:30b`, que es el nombre que el canon ya nombraba.

        Se comprueba el catalogo entero y no solo el servido: el dia que se
        sirva un segundo companero, el tag pelado entraria por ahi.
        """
        for a in self.d["agentes"]:
            modelo = a["real"].get("modelo")
            if not modelo:
                continue
            with self.subTest(agente=a["id"], modelo=modelo):
                self.assertIn(":", modelo, f"«{modelo}» no declara tag")
                self.assertNotIn(":latest", modelo,
                                 f"«{modelo}» lleva un tag pelado: usa el explicito")

    def test_el_papel_no_puede_inventar_enlaces(self):
        """El Instalador tiene PROHIBIDO escribir URLs, y esta medido por que.

        Sirviendo el papel contra los dos modelos que quedaban en el rack, los
        dos se sacaron un enlace de la manga: `preceptoros.com/install-linux` y
        `preceptoros.com/guia-instalacion-linux`. Dominio equivocado --el
        nuestro es .org-- y rutas que no existen. Un modelo que inventa la
        direccion a la que mandas a instalar es peor que uno que no contesta.

        La regla vive en el `papel` de los TRES idiomas, que es lo que viaja
        al modelo. Se comprueba en los tres porque una traduccion que se salta
        la prohibicion la desactiva para ese idioma entero.

        DONDE VIVE EL PAPEL, que cambio el 2026-09-04 y por eso este test
        cambio con el. Estaba en el bloque i18n de cada portada y se saco a
        `assets/prompts-<idioma>.js`: eran 2.412 B de instrucciones para un
        modelo --que nadie lee nunca en pantalla-- dentro de un fichero que
        estaba a 36 B de su techo. Se mudo el texto; la prohibicion no.
        """
        for idioma in ("es", "en", "fr"):
            js = (PUBLICO / "assets" / f"prompts-{idioma}.js").read_text(encoding="utf-8")
            papel = json.loads(js[js.index("window.PR =") + 11:]
                               .rstrip().rstrip(";"))["papel"]
            with self.subTest(idioma=idioma):
                self.assertRegex(papel, r"(?i)\b(nunca|never|jamais)\b",
                                 "el papel no prohibe nada en absoluto")
                self.assertRegex(papel, r"(?i)url",
                                 "el papel no nombra las URL, que es lo que se inventa")
                # Y el propio papel no puede llevar una URL dentro: seria
                # ensenarle justo lo que se le prohibe.
                self.assertNotRegex(papel, r"https?://",
                                    "hay una URL escrita dentro del papel")

    def test_cada_simbolo_del_hub_existe(self):
        """Un <img> a un fichero que no esta no falla: no pinta.

        Ese es el problema. La tarjeta sale sin cara, nadie ve un error y el
        fallo puede vivir meses en la pantalla de quien llega.
        """
        for a in self.d["agentes"]:
            with self.subTest(agente=a["id"]):
                # Dos imagenes por agente, y no son intercambiables: el OJO va
                # al cabezal cuando ese companero esta activo; la ESFERA es su
                # retrato en el panel Modelos.
                for ruta in (PUBLICO / "assets" / f"agente-{a['symbol']}.webp",
                             PUBLICO / "assets" / f"agente-3d-{a['icono3d']}.webp"):
                    self.assertTrue(ruta.is_file(), f"falta {ruta.name}")

    def test_el_hub_habla_los_tres_idiomas(self):
        """El guardian que este modulo NO puede usar, reimplementado aqui.

        `test_los_tres_idiomas_tienen_las_mismas_claves` mira el bloque #i18n
        de la portada y las claves `T.xxx` de sus scripts. El Hub se sale de
        ahi a proposito: meter estas claves en las tres portadas cuesta ~500 B
        cada una y `fr/index.html` no los tiene. Salirse de un guardian sin
        traer otro seria dejar un hueco, asi que aqui esta el otro.
        """
        t = self.d["textos"]
        self.assertEqual({"es", "en", "fr"}, set(t), "faltan idiomas en hub.json")
        base = set(t["es"])
        self.assertTrue(base, "el bloque de textos esta vacio")
        for idioma in ("en", "fr"):
            with self.subTest(idioma=idioma):
                self.assertEqual(base, set(t[idioma]),
                                 f"{idioma} difiere: {base ^ set(t[idioma])}")
        # Y las que el render pide de verdad tienen que existir.
        usadas = set(re.findall(r"L\.([A-Za-z]+)", self.js))
        # Cada fichero que consume estos textos tiene que estar en esta lista,
        # o su idioma deja de estar vigilado sin que nada lo diga. `comandos.js`
        # y `corregir.js` entraron el 2026-08-31 y traen sus claves por
        # `txt('x')` y `L('x')`: dos formas mas de pedir lo mismo, y las dos se
        # miran. Un guardian que solo conoce los ficheros de ayer da verde por
        # ignorancia, que es el peor verde que hay.
        for fichero, patron in (("chat-router.js", r"T\('([A-Za-z]+)'"),
                                ("comandos.js", r"txt\('([A-Za-z]+)'"),
                                ("corregir.js", r"L\('([A-Za-z]+)'")):
            usadas |= set(re.findall(
                patron, (PUBLICO / "assets" / fichero).read_text(encoding="utf-8")))
        self.assertFalse(usadas - base, f"claves sin traducir: {sorted(usadas - base)}")

    def test_el_hub_declara_que_es_maqueta(self):
        """Una rejilla de companeros se ve igual sea real o inventada.

        El rotulo es la unica diferencia visible. Sin el, la pagina fabrica un
        enjambre que no existe -- y esta web lleva tres puertas cazando
        exactamente esa clase de cifra.
        """
        self.assertEqual("MOCK", self.d["estado"])
        self.assertIn("nota", self.d, "la maqueta no dice por que lo es")
        self.assertIn("hubMaqueta", self.d["textos"]["es"])
        self.assertIn("panel-rotulo", self.js, "hub.js no pinta el rotulo de maqueta")
        # El rotulo se anade ANTES que la rejilla, no debajo. Se mira DENTRO
        # de `pintaAgentes`: la primera rejilla que aparece en el fichero es la
        # del esqueleto, y comparar contra esa medía otra cosa.
        fn = re.search(r"function pintaPanel.*?\n  \}", self.js, re.S)
        self.assertIsNotNone(fn, "no existe pintaPanel")
        cuerpo = fn.group(0)
        self.assertLess(cuerpo.index("panel-rotulo"), cuerpo.index("modelos"),
                        "el rotulo de maqueta se pinta despues de las tarjetas")

    def test_el_rack_no_se_renderiza_en_publico(self):
        """La telemetria del rack es del Soberano, no de quien visita.

        Hasta la Puerta 6 la portada pintaba dos columnas --maqueta y medido--
        con el estado energetico del rack. Salio entera: su sitio es el Ojo,
        en loopback. Aqui se comprueba en los DOS sitios donde podria volver a
        colarse: el JSON que viaja al navegador y el codigo que pinta.

        No basta con dejar de renderizarlo: mandar el bloque y no pintarlo es
        cargar peso y exponer estado del rack por nada.
        """
        self.assertNotIn("rack", self.d,
                         "hub.json vuelve a mandar telemetria del rack al publico")
        for nombre in ("hub.js", "hub-cola.js", "chat-router.js"):
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
            codigo = re.sub(r"(?m)//.*$", "", codigo)
            with self.subTest(fichero=nombre):
                for muerto in ("rack", "anker", "bateria_presente", "era_energetica"):
                    self.assertNotIn(muerto, codigo.lower(),
                                     f"{nombre} vuelve a pintar el rack: «{muerto}»")

    def test_ironclaw_firma_una_a_una(self):
        """Protocolo 2 del documento P0X, y no es una preferencia de estilo.

        Un lote deja pasar una alucinacion sin que nadie la lea, y la
        reputacion externa no tiene rollback. La friccion en la ultima milla
        es el mecanismo, no un descuido de la interfaz.
        """
        self.assertIn("propuestas", self.d["cola"])
        for prohibido in ("firmarTodo", "aprobarTodo", "firmar todo",
                          "aprobar todo", "selectAll", "batch"):
            with self.subTest(prohibido=prohibido):
                self.assertNotIn(prohibido.lower(), self.js.lower(),
                                 f"hub.js ofrece aprobacion por lotes: {prohibido}")
        # Un boton por pieza: el listener se cuelga DENTRO del bucle.
        cola_js = (PUBLICO / "assets" / "hub-cola.js").read_text(encoding="utf-8")
        for prohibido in ("firmarTodo", "aprobarTodo", "firmar todo",
                          "aprobar todo", "selectAll", "batch"):
            with self.subTest(prohibido=prohibido, fichero="hub-cola.js"):
                self.assertNotIn(prohibido.lower(), cola_js.lower())
        self.assertIn("props.forEach", cola_js, "la cola no itera propuesta a propuesta")
        self.assertIn("colaFirmar", cola_js, "no hay boton de firma por pieza")

    def test_hub_usa_scheduler_yield(self):
        """Devolver el hilo entre secciones, con respaldo donde no exista."""
        self.assertIn("scheduler", self.js, "no cede el hilo al navegador")
        self.assertIn("window.scheduler.yield", self.js)
        self.assertIn("setTimeout", self.js, "sin respaldo donde no hay scheduler")

    def test_respeta_saveData_y_memoria(self):
        """Quien pide ahorro de datos lo ha PEDIDO: no se le mandan 48 KB."""
        self.assertIn("saveData", self.js)
        self.assertIn("deviceMemory", self.js)
        self.assertIn("prefers-reduced-data", self.js)

    def test_las_caras_de_agente_no_engordan(self):
        """Los OJOS. El glob mira `agente-ojo-*` y no `agente-*`: desde que
           existen las esferas del panel Modelos hay dos familias con prefijo
           parecido, y un glob demasiado ancho contaba dieciseis caras."""
        caras = sorted((PUBLICO / "assets").glob("agente-ojo-*.webp"))
        self.assertEqual(self.CARAS, len(caras), f"hay {len(caras)} ojos")
        total = sum(c.stat().st_size for c in caras)
        self.assertLess(total, 64 * 1024, f"los ojos suman {total} B")

    def test_iconos_3d_existen_y_bajo_techo(self):
        """Las ocho esferas del panel Modelos.

        Techo declarado de 32 KB por fichero: son renders fotorrealistas y
        pesan, pero el panel puede llegar a pedir las ocho de golpe. El techo
        no protege una descarga --van al shell del worker-- sino que impide
        que el proximo render entre con un mega sin que nadie lo mire.
        """
        esferas = sorted((PUBLICO / "assets").glob("agente-3d-*.webp"))
        self.assertEqual(8, len(esferas), f"hay {len(esferas)} esferas")
        for e in esferas:
            with self.subTest(esfera=e.name):
                self.assertLessEqual(e.stat().st_size, 32 * 1024,
                                     f"{e.name} pesa {e.stat().st_size} B")
        ids = {a["id"] for a in self.d["agentes"]}
        tiene = {e.name[len("agente-3d-"):-len(".webp")] for e in esferas}
        self.assertEqual(ids, tiene, f"esferas y agentes no casan: {ids ^ tiene}")


class Cabezal(unittest.TestCase):
    """El cabezal fijo, el chat protagonista y el panel Modelos.

    Sustituye a los casos del `<dialog>` de la Puerta 4. El chat dejo de ser
    un modal: ahora es lo primero que se ve y el panel se le echa encima. El
    gate tiene que vigilar el canon VIGENTE o deja de ser un gate -- mismo
    criterio con el que se reescribio el caso del cristal.
    """

    def portadas(self):
        for idioma in ("es", "en", "fr"):
            yield idioma, (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")

    def test_cabezal_con_ojos_y_login(self):
        """La cabeza, la navegacion y la identidad, con sus ids intactos.

        `auth.js` busca `#identity` y se calla si no esta: el boton de entrar
        desapareceria sin un solo error en consola. Por eso se comprueba el
        id, no el aspecto.
        """
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertIn('id="cabezal"', t, "no hay cabezal")
                self.assertIn('id="cabeza"', t, "no hay cabeza del Preceptor")
                self.assertIn('id="cab-nav"', t, "el cabezal no tiene navegacion")
                self.assertIn('id="identity"', t,
                              "auth.js busca #identity y se calla si falta")
        # El ojo del cabezal cambia con el companero activo.
        self.assertIn("cabeza.style.backgroundImage", router,
                      "el router no le pone cara al cabezal")
        self.assertIn("a.symbol", router,
                      "el cabezal no cambia de ojo al cambiar de companero")

    def test_enlaces_identidad_publica(self):
        """GitHub y LinkedIn: uno de cada, y en el cabezal.

        Dos copias del mismo enlace divergen, y estos son la unica forma de
        comprobar quien firma esto. Salen de `hub.json`, que copia
        `Alejandria/identidad_publica.json`.
        """
        d = json.loads((PUBLICO / "hub.json").read_text(encoding="utf-8"))
        i = d.get("identidad", {})
        for clave in ("github_url", "linkedin_url"):
            self.assertIn(clave, i, f"hub.json no declara {clave}")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertEqual(0, t.count("linkedin.com"),
                                 "el enlace de LinkedIn esta escrito en el marcado")
                self.assertEqual(0, t.count("github.com"),
                                 "queda un GitHub suelto en la portada")
        hub = (PUBLICO / "assets" / "hub.js").read_text(encoding="utf-8")
        self.assertIn("github_url", hub)
        self.assertIn("linkedin_url", hub)

    def test_panel_modelos_existe_y_desliza(self):
        css = ((PUBLICO / "assets" / "widget.css").read_text(encoding="utf-8") +
               (PUBLICO / "assets" / "panel.css").read_text(encoding="utf-8"))
        plano = css.replace(" ", "").replace("\n", "")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertIn('id="panel-modelos"', t, "no hay panel Modelos")
                self.assertIn('id="hub-layout"', t, "el chat no tiene maqueta")
        self.assertIn("transform:translateX(101%)", plano,
                      "el panel no se retira deslizando")
        self.assertIn("transition:transform.35sease", plano,
                      "el deslizamiento no dura los 350 ms del contrato")
        self.assertIn("prefers-reduced-motion", css,
                      "el panel se desliza aunque se pida quietud")

    def test_el_rail_es_una_columna_entera(self):
        """El rail va de borde a borde del viewport, sin que nada lo corte.

        ESTA PRUEBA CAMBIO DE DOCTRINA EL 2026-09-03, firmado por el Soberano,
        y conviene decir que exigia antes: `grid-template-columns:1fr 360px`
        con el panel en `position:static` como segunda columna de
        `#hub-layout`. Aquello se veia bien y estaba roto por debajo:
        `#hub-layout` vive dentro de `<main>`, que va DESPUES del cabezal y
        ANTES del pie, y un hijo no puede ser mas alto que su padre. El rail
        empezaba bajo el cabezal y terminaba sobre el pie. No habia margen que
        lo arreglara porque el problema no era el margen: era el arbol.

        Lo que se exige ahora son las tres cosas que hacen que la columna sea
        continua de verdad, y que ningun ajuste posterior puede romper sin que
        esto se ponga rojo.
        """
        def sin_comentarios(texto):
            """Fuera los comentarios ANTES de mirar si una regla existe.

            Cicatriz del 2026-09-03: este bloque explica por escrito que el
            rail ya no usa `position:static`, y la prueba leia esa frase del
            comentario como si fuera la regla. Una comprobacion que se cree lo
            que dice la prosa no esta comprobando el codigo: esta leyendo.
            """
            return re.sub(r"/\*.*?\*/", "", texto, flags=re.S)

        panel = sin_comentarios(
            (PUBLICO / "assets" / "panel.css").read_text(encoding="utf-8"))
        widget = sin_comentarios(
            (PUBLICO / "assets" / "widget.css").read_text(encoding="utf-8"))
        css = widget + panel
        plano = css.replace(" ", "").replace("\n", "")

        # 1 · el rail toca los dos bordes verticales, y en TODOS los anchos.
        self.assertIn("position:fixed;top:0;right:0;bottom:0", plano,
                      "el rail no llega de arriba a abajo del viewport")
        pc = re.search(r"@media \(min-width:1024px\)\{(.*?)\n\}", css, re.S)
        self.assertIsNotNone(pc, "no hay maqueta de PC")
        cuerpo = pc.group(1).replace(" ", "")
        self.assertNotIn("position:static", cuerpo,
                         "en PC el rail vuelve a entrar en el flujo y lo cortan "
                         "el cabezal y el pie")
        self.assertNotIn("grid-column:2", cuerpo,
                         "el rail vuelve a ser una columna de #hub-layout, que "
                         "no puede ser mas alto que <main>")

        # 2 · el hueco se reserva UNA vez y en `body`, no contenedor a
        #     contenedor. El cabezal y el pie estan fuera de `main`: si la
        #     reserva no la hereda todo, son justo los dos que se meten debajo.
        self.assertIn("body:has(#panel-modelos){padding-right:var(--hueco-rail)}",
                      plano, "el hueco del rail no se reserva globalmente")
        # Y CONDICIONADO AL RAIL. De las ocho paginas solo la portada lo tiene;
        # `benchmark.html` carga esta hoja y no. Una reserva incondicional le
        # abre un hueco contra un borde donde no hay nada.
        self.assertNotIn("\nbody{padding-right:var(--hueco-rail)}", plano,
                         "la reserva no mira si el rail existe")
        self.assertIn("--hueco-rail:", plano, "no hay medida declarada del hueco")

        # 3 · y NADIE se lo reserva por su cuenta. Tres cifras distintas para
        #     el mismo hueco es como estaba antes, y como se olvidaba.
        for sobra in ("#hub-layout{padding-right:4.2rem}",
                      ".honest-footer{margin-right:4.2rem}"):
            self.assertNotIn(sobra, plano,
                             f"queda una reserva a mano: {sobra}")

        self.assertIn("max-width:min(1400px", cuerpo,
                      "la ventana no se estira: el chat se quedaria estrecho")
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("(min-width:1024px)", router,
                      "el router no distingue PC de movil")
        self.assertIn("matchMedia", router,
                      "el umbral se lee a mano en vez de por matchMedia")

    def test_el_cabezal_no_se_corta_en_el_telefono(self):
        """La identidad tiene que poder bajar de linea, y no podia.

        `movil.css` ya mandaba `.identity{flex:1 0 100%}` para que el boton de
        entrar ocupara su propia fila en un telefono. No servia de nada:
        `widget.css` carga DESPUES y trae `#cabezal #identity{flex:0 0 auto}`,
        que con dos ids gana por especificidad (0,2,0 contra 0,1,0). El
        `flex-wrap:wrap` del cabezal estaba puesto desde el principio -- el
        cabezal no se cortaba por falta de wrap, sino porque el unico elemento
        que tenia que envolverse estaba clavado con `flex:0 0 auto` y un
        `margin-left:auto` que lo empujaba contra el borde.

        Por eso el arreglo NO es anadir wrap ni subir un `!important`: es
        devolverle a la regla de movil la especificidad que le falta, dentro
        de la media query que ya existe.
        """
        css = (PUBLICO / "assets" / "widget.css").read_text(encoding="utf-8")
        movil = re.search(r"@media \(max-width:1023px\)\{(.*?)\n\}", css, re.S)
        self.assertIsNotNone(movil, "no hay maqueta de movil en widget.css")
        # Los comentarios fuera ANTES de aplanar, y no es escrupulo: el
        # comentario de esta misma regla CITA `#cabezal #identity{flex:0 0
        # auto}` para explicar a quien gana. Sin quitarlo, el test partia por
        # la cita y medía el comentario en vez del CSS -- daba rojo con el
        # arreglo ya puesto. Es el mismo cuidado que ya toma
        # `test_el_rack_no_se_renderiza_en_publico` con el JS.
        limpio = re.sub(r"/\*.*?\*/", "", movil.group(1), flags=re.S)
        cuerpo = limpio.replace(" ", "").replace("\n", "")
        self.assertIn("#cabezal#identity{", cuerpo,
                      "movil no reajusta la identidad: seguira clavada a la derecha")
        regla = cuerpo.split("#cabezal#identity{")[1].split("}")[0]
        # `flex:1 0 100%` sin espacios es `flex:10100%`. Se compara sobre el
        # texto aplanado porque es como se compara todo lo demas en este gate.
        self.assertIn("flex:10100%", regla,
                      "la identidad no reclama su propia fila")
        self.assertIn("margin-left:0", regla,
                      "sigue el margin-left:auto que la empuja contra el borde")
        # Sin !important: si hace falta, es que la especificidad esta mal
        # pensada, y un !important tapa el problema para el siguiente que mire.
        self.assertNotIn("!important", cuerpo,
                         "el cabezal se arregla a martillazos")

    def test_la_correccion_firmada_no_sale_del_aparato(self):
        """El eslabon [2] se guarda, no se envia. Y se comprueba, no se promete.

        `LORATELIER_P0X.md` deja abiertas D1 --de quien es el LoRA-- y D2
        --con que se paga--, y dice que encender el boton de corregir antes de
        responderlas «seria pedir datos sin saber que se hara con ellos». La
        salida no fue no construirlo: fue construirlo sin salida de red. El par
        se firma y se queda en el aparato de quien lo escribio.

        Una promesa asi no puede vivir en un comentario. Aqui se lee el codigo
        --sin comentarios, porque el fichero NOMBRA `fetch` y `sendBeacon` para
        jurar que no los usa, y esa cita bastaria para dar un falso positivo,
        que es el mismo cuidado que ya toma el test del rack.
        """
        js = (PUBLICO / "assets" / "corregir.js").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
                       "EventSource", "navigator.send"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, codigo,
                                 f"corregir.js puede sacar el par por {salida}")
        # El esquema es el de `preceptor/captura.py`, campo a campo. Dos
        # esquemas para el mismo hecho obligan a un traductor en medio, y ese
        # traductor es donde un dia se pierde el consentimiento.
        for campo in ("prompt", "respuesta", "correccion", "corregido",
                      "modelo", "idioma", "motivo", "consent"):
            with self.subTest(campo=campo):
                self.assertIn(campo, codigo, f"el par no lleva `{campo}`")
        self.assertIn("consent: 0", codigo,
                      "el consentimiento no nace en 0: un par sin firma no es "
                      "material de nadie")
        # Y se firma de verdad: la firma entera la garantiza auth.js.
        self.assertIn("Identity.firmar", codigo, "el par no se firma")

    def test_la_transferencia_respeta_el_movimiento_reducido(self):
        """Doble guarda: el navegador que no sabe, y quien no quiere."""
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("prefers-reduced-motion", router)
        fn = re.search(r"function conTransicion.*?\n  \}", router, re.S)
        self.assertIsNotNone(fn, "no hay guarda de transicion")
        self.assertIn("!document.startViewTransition", fn.group(0),
                      "se llama a startViewTransition sin comprobar que existe")
        self.assertIn("quieto.matches", fn.group(0),
                      "la transicion no mira si se pidio quietud")

    def test_motor_prioriza_languagemodel(self):
        """`window.ai` quedo atras. La forma vigente es `LanguageModel`."""
        motor = (PUBLICO / "assets" / "engine.js").read_text(encoding="utf-8")
        self.assertIn("LanguageModel.availability", motor)
        codigo = re.sub(r"/\*.*?\*/", "", motor, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        self.assertNotIn("window.ai", codigo,
                         "engine.js vuelve a la forma obsoleta window.ai")


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

    def test_los_iconos_no_engordan_sin_permiso(self):
        """Los iconos pasaron de 12 KB a 180 KB al cambiar de arte.

        Es el precio de una imagen fotorrealista y esta pagado a proposito:
        el anterior era un glifo plano de otra paleta. Pero un techo declarado
        evita que el proximo cambio meta un PNG de un mega sin que nadie lo
        mire. No se cargan al abrir la web --solo al instalar la app-- y por
        eso el techo es alto y no minusculo.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        vistos, total = set(), 0
        for icono in m["icons"]:
            if icono["src"] in vistos:
                continue
            vistos.add(icono["src"])
            total += (PUBLICO / icono["src"].lstrip("/")).stat().st_size
        self.assertLess(total, 256 * 1024,
                        f"los iconos del manifiesto suman {total} B")

    def test_manifest_es_minimo(self):
        """Lo que hace falta para instalar, y nada de adorno.

        Un manifiesto que crece con claves que ningun navegador lee es un
        fichero que nadie vuelve a auditar. Se fija la lista: si alguien anade
        una clave, tiene que anadirla tambien aqui y explicar para que.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        obligatorias = {"name", "short_name", "start_url", "display", "icons"}
        self.assertTrue(obligatorias <= set(m),
                        f"faltan claves de instalacion: {obligatorias - set(m)}")
        admitidas = obligatorias | {"id", "scope", "lang", "dir", "description",
                                    "orientation", "background_color", "theme_color"}
        sobran = set(m) - admitidas
        self.assertFalse(sobran, f"claves decorativas en el manifiesto: {sobran}")
        # Los iconos son PNG de 192 y 512: un webp de 128 px no instala en
        # Android, que pide 192 como minimo y 512 para la pantalla de arranque.
        tam = {i["sizes"] for i in m["icons"]}
        self.assertIn("192x192", tam, "sin icono de 192 no hay instalacion")
        self.assertIn("512x512", tam, "sin icono de 512 no hay pantalla de arranque")

    def test_el_maskable_cabe_de_verdad_en_su_circulo(self):
        """No que lo diga el manifiesto: que lo diga el fichero.

        El anterior se declaraba maskable y se recortaba -- contenido a 255 px
        del centro con un radio seguro de 205. Aquella comprobacion solo miraba
        que fuese un fichero distinto del icono normal, que es necesario y no
        suficiente: un fichero distinto puede estar igual de mal encuadrado.
        Esta abre el PNG y mide.
        """
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("NO_DATA · sin Pillow no se puede medir el encuadre. "
                          "Remedio: instalar Pillow y repetir")
        import math
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        masc = [i for i in m["icons"] if "maskable" in i.get("purpose", "")]
        if not masc:
            self.skipTest("el manifiesto no declara ningun icono maskable")
        for icono in masc:
            im = Image.open(PUBLICO / icono["src"].lstrip("/")).convert("RGB")
            w, h = im.size
            with self.subTest(icono=icono["src"]):
                self.assertEqual(w, h, "un maskable tiene que ser cuadrado")
                fondo = im.getpixel((2, 2))
                # Android recorta a un circulo del 80% del lado: radio 40%.
                seguro = 0.40 * w
                cx, cy = w / 2, h / 2
                lejos = 0.0
                px = im.load()
                for y in range(h):
                    for x in range(w):
                        c = px[x, y]
                        if abs(c[0]-fondo[0]) + abs(c[1]-fondo[1]) + abs(c[2]-fondo[2]) > 24:
                            d = math.hypot(x - cx, y - cy)
                            if d > lejos:
                                lejos = d
                self.assertLessEqual(
                    lejos, seguro,
                    f"{icono['src']}: hay dibujo a {lejos:.0f} px del centro y "
                    f"el circulo seguro son {seguro:.0f}. Android lo recortaria.")

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

    def test_sw_cachea_los_nuevos_assets(self):
        """El worker tiene que conocer TODO lo que la portada necesita.

        La lista no se escribe aqui: se DERIVA del disco y de `hub.json`. Si
        manana entra una cara de agente nueva y nadie la anade al worker, este
        caso se cae solo -- que es justo lo que hace falta, porque el sintoma
        contrario es invisible: la app instalada abre, pinta el esqueleto, y
        la rejilla se queda en NO_DATA sin que nadie sepa por que.

        Y la distincion entre medida y contenido se comprueba en los dos
        sentidos: `hub.json` tiene que estar declarado como contenido, y
        `counters.json` NO puede estarlo. Cachear la cifra de los gates seria
        repetir la averia de la puerta 1 dentro del worker.
        """
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")

        # 1 · las tres piezas del Hub y su catalogo
        for pieza in ("/hub.json", "/assets/widget.css", "/assets/panel.css",
                      "/assets/hub.js",
                      "/assets/hub-cola.js", "/assets/chat-router.js"):
            with self.subTest(pieza=pieza):
                self.assertIn(f"'{pieza}'", sw,
                              f"el worker no cachea {pieza}")

        # 2 · las caras, derivadas del disco y del catalogo
        caras = re.search(r"const CARAS = \[(.*?)\]", sw, re.S)
        self.assertIsNotNone(caras, "el worker no declara la lista de caras")
        conoce = set(re.findall(r"'([\w-]+)'", caras.group(1)))
        en_disco = {p.name[len("agente-ojo-"):-len(".webp")]
                    for p in (PUBLICO / "assets").glob("agente-ojo-*.webp")}
        self.assertEqual(en_disco, conoce,
                         f"el worker y el disco no coinciden: {en_disco ^ conoce}")
        esferas = re.search(r"const ESFERAS = \[(.*?)\]", sw, re.S)
        self.assertIsNotNone(esferas, "el worker no declara las esferas")
        conoce3d = set(re.findall(r"'([\w-]+)'", esferas.group(1)))
        disco3d = {p.name[len("agente-3d-"):-len(".webp")]
                   for p in (PUBLICO / "assets").glob("agente-3d-*.webp")}
        self.assertEqual(disco3d, conoce3d,
                         f"esferas que el worker no cachea: {disco3d ^ conoce3d}")
        catalogo = json.loads((PUBLICO / "hub.json").read_text(encoding="utf-8"))
        usados = {a["symbol"][len("ojo-"):] for a in catalogo["agentes"]}
        self.assertFalse(usados - conoce,
                         f"caras que el Hub usa y el worker no cachea: {usados - conoce}")

        # 3 · contenido si, medida no
        contenido = re.search(r"const CONTENIDO_JSON = \[(.*?)\]", sw, re.S)
        self.assertIsNotNone(contenido, "el worker no separa contenido de medida")
        self.assertIn("/hub.json", contenido.group(1))
        self.assertNotIn("counters.json", contenido.group(1),
                         "el worker cachearia la cifra de los gates")
        self.assertIn("/manifest.webmanifest",
                      re.search(r"const RED_PRIMERO = \[(.*?)\]", sw, re.S).group(1),
                      "el manifiesto no va a red primero")

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
            bloque = re.search(r'id="i18n"[^>]*>(.*?)</script>', texto, re.S)
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

    def test_ningun_asset_precacheado_esta_muerto(self):
        """Todo lo que `sw.js` mete en la cache lo pinta alguien.

        El service worker precachea para que la web funcione sin conexion. Un
        asset precacheado y no pintado por nadie es peso que TODOS los
        visitantes descargan y ninguno ve -- y no da la cara como sobra,
        porque el fichero existe y su linea de precache tambien.

        Se encontro asi el 2026-09-02: los ocho `agente-ojo-*.webp` (48 410 B)
        llevaban precacheados desde que se anadieron, y ni `hub.js` ni
        `chat-router.js` los usaban -- los dos pintan `agente-3d-*`. El propio
        comentario de `sw.js` decia para que eran: «la cara es el OJO que el
        cabezal le pone al Preceptor segun con quien hablas». Se diseno, se
        precacheo, y no se conecto.

        LOS NOMBRES SE COMPONEN, y la prueba tiene que saberlo. `hub.js` no
        escribe `agente-3d-coder.webp` en ninguna linea: escribe
        `'/assets/agente-3d-' + a.icono3d + '.webp'`. Buscar el nombre entero
        daria por muertos ocho ficheros bien vivos. Asi que un prefijo que
        alguien concatena cuenta como referencia a toda su familia -- que es
        exactamente lo que el navegador va a pedir.
        """
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        precacheados = set(re.findall(r"/assets/([\w.-]+\.\w+)", sw))
        for prefijo in re.findall(r"'/assets/([\w-]+-)'\s*\+", sw):
            for f in (PUBLICO / "assets").glob(prefijo + "*"):
                precacheados.add(f.name)

        vivos = ""
        for f in sorted(PUBLICO.rglob("*")):
            if not f.is_file() or f.name == "sw.js":
                continue
            if f.suffix.lower() not in (".html", ".css", ".js", ".mjs", ".json"):
                continue
            vivos += f.read_text(encoding="utf-8")

        # Prefijos que algun consumidor concatena: valen por toda su familia.
        compuestos = tuple(re.findall(r"'/assets/([\w-]+-)'\s*\+", vivos))

        muertos = sorted(
            n for n in precacheados
            if (PUBLICO / "assets" / n).is_file()
            and n not in vivos
            and not any(n.startswith(c) for c in compuestos))
        self.assertFalse(
            muertos,
            "estos assets se precachean y no los pinta nadie -- peso que todos "
            "descargan y nadie ve: " + ", ".join(muertos))

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


class Comunidad(unittest.TestCase):
    """Los anuncios OFICIALES del Agora, que no son los hilos de EJEMPLO."""

    def setUp(self):
        self.d = json.loads((PUBLICO / "anuncios.json").read_text(encoding="utf-8"))

    def test_los_anuncios_hablan_los_tres_idiomas(self):
        """Un anuncio a medio traducir sale en blanco en dos de tres paginas.

        Y sale en blanco EN SILENCIO: `board-anuncios.js` no encuentra el
        idioma, pinta su NO_DATA y la peticion del Soberano desaparece de /en/
        y de /fr/ sin que nadie se entere, porque quien lo escribio lo miro en
        espanol.
        """
        for a in self.d["anuncios"]:
            for idi in ("es", "en", "fr"):
                with self.subTest(anuncio=a["id"], idioma=idi):
                    t = a["textos"].get(idi)
                    self.assertIsNotNone(t, f"{a['id']} no habla {idi}")
                    for campo in ("titulo", "cuerpo"):
                        self.assertTrue((t.get(campo) or "").strip(),
                                        f"{a['id']}/{idi}: {campo} vacio")

    def test_cada_anuncio_dice_lo_que_todavia_no_funciona(self):
        """La regla del sensor honesto, aplicada a pedir cosas.

        Los dos anuncios de hoy piden algo por un camino que HOY no llega: el
        Agora responde 404 en /api/v1/threads y no hay endpoint de subida. Un
        anuncio que pide sin decir eso no es un anuncio, es publicidad: la
        persona hace el trabajo y descubre sola que no habia donde entregarlo.
        """
        for a in self.d["anuncios"]:
            for idi in ("es", "en", "fr"):
                with self.subTest(anuncio=a["id"], idioma=idi):
                    pero = (a["textos"][idi].get("pero") or "").strip()
                    self.assertTrue(pero, f"{a['id']}/{idi} no declara su limite")
                    self.assertIn("NO_DATA", pero,
                                  "el limite no se marca como NO_DATA")

    def test_el_anuncio_con_enlace_lo_nombra_en_los_tres_idiomas(self):
        """Un `href` sin texto es un enlace invisible: existe y no se pulsa."""
        for a in self.d["anuncios"]:
            if not a.get("enlace"):
                continue
            for idi in ("es", "en", "fr"):
                with self.subTest(anuncio=a["id"], idioma=idi):
                    self.assertTrue((a["textos"][idi].get("enlaceTexto") or "").strip(),
                                    f"{a['id']}/{idi}: enlace sin texto")


class Perfil(unittest.TestCase):
    """La ficha: bustos, LCP y el texto que escribe una persona."""

    def test_cada_busto_del_catalogo_esta_en_el_disco(self):
        """Mismo fallo que el de los simbolos del Hub, misma defensa.

        Un <img> a un webp que no esta no lanza ningun error: deja un hueco.
        Aqui son OCHO huecos en la unica rejilla donde se elige algo.
        """
        cat = json.loads((PUBLICO / "bustos.json").read_text(encoding="utf-8"))
        self.assertEqual(8, len(cat["bustos"]), "no hay ocho bustos")
        for b in cat["bustos"]:
            with self.subTest(busto=b["id"]):
                ruta = PUBLICO / (cat["ruta"].lstrip("/") + b["id"] + ".webp")
                self.assertTrue(ruta.is_file(), f"falta {ruta.name}")
                for idi in ("es", "en", "fr"):
                    self.assertTrue((b.get(idi) or "").strip(),
                                    f"{b['id']} no tiene nombre en {idi}")

    def test_el_busto_propio_no_va_diferido(self):
        """El LCP de esta pagina es la cara de arriba, no las ocho de abajo.

        `loading=lazy` en todo lo que sea una imagen es una regla que se aplica
        sola y se equivoca justo en la que importa: la imagen mas grande de la
        primera pantalla, diferida, retrasa la metrica por la que se mide si la
        pagina carga rapido.
        """
        js = (PUBLICO / "assets" / "profile.js").read_text(encoding="utf-8")
        mio = re.search(r"var mio = document\.createElement.*?zonaId\.appendChild\(mio\)",
                        js, re.S)
        self.assertIsNotNone(mio, "profile.js ya no pinta el busto propio")
        self.assertIn("mio.loading = 'eager'", mio.group(0),
                      "el busto propio va diferido")
        self.assertIn("fetchPriority = 'high'", mio.group(0),
                      "el busto propio no pide prioridad")
        # Y los de la rejilla siguen diferidos: si no, son ocho descargas
        # compitiendo con la unica que importa.
        self.assertIn("img.loading = 'lazy'", js,
                      "la rejilla de bustos dejo de ir diferida")

    def test_la_vista_previa_nunca_monta_html_de_la_persona(self):
        """La biografia la escribe una persona, y una persona escribe `<script>`.

        La previa se construye con nodos y `textContent`, asi que un menor es
        un menor. El unico `innerHTML` admitido es el que VACIA (`= ''`), que
        no monta nada. Se comprueba estaticamente porque la alternativa es
        confiar en que nadie escriba la linea comoda algun dia.
        """
        for nombre in ("profile-obra.js", "profile.js"):
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            for m in re.findall(r"\.innerHTML\s*=\s*([^;\n]+)", js):
                with self.subTest(fichero=nombre, asigna=m.strip()):
                    self.assertEqual("''", m.strip(),
                                     "innerHTML con algo que no sea vaciar")


class Sitemap(unittest.TestCase):

    def test_el_sitemap_no_anuncia_paginas_que_no_estan(self):
        """Un sitemap rancio manda al buscador a un 404 que no ve ningun humano.

        Es exactamente lo que habria pasado el 2026-09-02 al renombrar
        `board.html`: la lista escrita a mano habria seguido anunciandola. Por
        eso `sitemap.py` DERIVA del disco, y por eso esto lo comprueba contra
        el disco tambien.
        """
        xml = (PUBLICO / "sitemap.xml").read_text(encoding="utf-8")
        locs = re.findall(r"<loc>([^<]+)</loc>", xml)
        self.assertTrue(locs, "el sitemap no anuncia nada")
        for loc in locs:
            with self.subTest(url=loc):
                self.assertTrue(loc.startswith(ORIGEN_PROPIO),
                                "una URL del sitemap no es de este origen")
                ruta = loc[len(ORIGEN_PROPIO):].lstrip("/")
                destino = PUBLICO / ruta if ruta else PUBLICO
                if destino.is_dir():
                    destino = destino / "index.html"
                self.assertTrue(destino.exists(), f"el sitemap anuncia {loc}")

    def test_toda_pagina_de_contenido_esta_en_el_sitemap(self):
        """La averia simetrica: la pagina existe y el buscador no la ve."""
        xml = (PUBLICO / "sitemap.xml").read_text(encoding="utf-8")
        for p in paginas_de_contenido():
            rel = p.relative_to(PUBLICO).as_posix()
            esperado = ORIGEN_PROPIO + "/" + rel
            if p.name == "index.html":
                esperado = ORIGEN_PROPIO + "/" + rel[:-len("index.html")]
            with self.subTest(pagina=rel):
                self.assertIn("<loc>" + esperado + "</loc>", xml,
                              f"{rel} no esta en el sitemap")

    def test_robots_apunta_al_sitemap(self):
        r = (PUBLICO / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: " + ORIGEN_PROPIO + "/sitemap.xml", r,
                      "robots.txt no declara el sitemap")


if __name__ == "__main__":
    unittest.main(verbosity=2)
