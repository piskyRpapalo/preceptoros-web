"""Pruebas de test_web.py RETIRADAS por el canon ingles hasta MVP y el decreto de recencia, 2026-10-25.
Las nueve portadas de lengua (/ar/ ... /ru/) responden 301 a `/` desde worker/index.js y sus carpetas salieron
de public/; estas cuatro pruebas solo miraban esas carpetas y habrian pasado EN VACIO (bucle sobre cero lenguas).
Repo e historia intactos: las portadas siguen en git. No se ejecutan: son historia."""

# --- Estructura.test_las_portadas_declaran_hreflang · el hreflang entre las nueve portadas de lengua; las portadas son 301 a `/` y ninguna pagina declara ya hreflang (lo vigila test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN, que exige igualdad con el disco: vacio)
    def test_las_portadas_declaran_hreflang(self):
        """Tres traducciones sin hreflang son tres paginas sueltas para un
        buscador, y compiten entre ellas en vez de ofrecerse por idioma."""
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            for otro in IDIOMAS:
                with self.subTest(idioma=idi, apunta_a=otro):
                    self.assertRegex(t, rf'hreflang="{otro}"',
                                     f"{idi} no declara hreflang de {otro}")

# --- Paginas.test_selector_de_idioma_por_path · el selector de idioma de la raiz enlazaba a /<l>/; la raiz es ahora la puerta inglesa (Puerta.test_una_lengua_hasta_mvp)
    def test_selector_de_idioma_por_path(self):
        s = (PUBLICO / "index.html").read_text(encoding="utf-8")
        for idioma in IDIOMAS:
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

# --- Traducciones.test_cada_pagina_declara_SU_lengua_en_el_bloque · el bloque i18n de las paginas bajo /<l>/; esas carpetas salieron de public/
    def test_cada_pagina_declara_SU_lengua_en_el_bloque(self):
        """`lang` dentro del bloque no es decorativo: se lo lleva el modelo.

        `pt/onboarding.html` declaraba `lang: "es"`. La pagina se veia
        portuguesa en el navegador --`<html lang="pt">` estaba bien-- y por
        dentro se presentaba como castellana. Un dato que solo se lee desde
        JavaScript no tiene sintoma visual: por eso hace falta esta prueba y
        no basta con mirar la pagina.
        """
        for idioma in IDIOMAS:
            for f in sorted((PUBLICO / idioma).glob("*.html")):
                m = re.search(r'id="i18n">(.*?)</script>',
                              f.read_text(encoding="utf-8"), re.S)
                if not m:
                    continue
                datos = json.loads(m.group(1))
                if "lang" not in datos:
                    continue
                with self.subTest(pagina=f"{idioma}/{f.name}"):
                    self.assertEqual(datos["lang"], idioma,
                        f"{idioma}/{f.name} declara lang={datos['lang']!r} "
                        f"dentro de su bloque i18n")

# --- LoQueNoSeVeConElGateVerde.test_lo_que_depende_de_bronce_se_carga_despues · el orden de carga en las portadas /<l>/index.html; esas portadas salieron de public/ y el juego de /play/ lo vigila Portada
    def test_lo_que_depende_de_bronce_se_carga_despues(self):
        for idi in IDIOMAS:
            f = PUBLICO / idi / "index.html"
            if not f.exists():
                continue
            t = f.read_text(encoding="utf-8")
            for hijo, padre in self.DEPENDE.items():
                i, j = t.find("/assets/" + padre), t.find("/assets/" + hijo)
                if j < 0:
                    continue
                with self.subTest(pagina=idi, guion=hijo):
                    self.assertTrue(0 <= i < j,
                        f"{idi}/index.html carga {hijo} antes que {padre}: {hijo} "
                        f"se retira en silencio y la rueda se queda sin su casilla")
