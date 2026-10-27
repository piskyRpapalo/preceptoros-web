"""Pruebas RETIRADAS por NORTE 5 [3] (decreto ·6452880777, 2026-10-27): «play the game» (/play/, thegame.js y lo que solo el
cargaba) y el Creation Studio de la web salieron. Estas pruebas solo miraban lo que salio. Historia: no se ejecutan."""

# --- Portada · la carcasa de /play/ (cabezal-juego + panel unico, thegame.js): /play/ salio y responde 301 a /face/
class Portada(unittest.TestCase):
    """LA PORTADA ES EL JUEGO (mudanza firmada 2026-10-11, bloque 1; plan por capas C1; canon de UI,
    ideas6oct:1711): cabezal arriba y UN SOLO panel debajo con el juego dentro. Sustituye a las pruebas
    del hub retiradas (config/pruebas-retiradas.json)."""

    PERMITIDOS = {"/assets/auth.js", "/assets/consiento.js", "/assets/enviar.js", "/assets/pwa.js",
                  "/assets/page-comment.js", "/assets/thegame.js", "/assets/eaa-art12-local-first-surface.js"}

    def portadas(self):
        # Recencia + canon ingles (2026-10-25): el juego se monto en /play/; la raiz es la puerta (Puerta, abajo).
        yield "play", (PUBLICO / "play" / "index.html").read_text(encoding="utf-8")

    def test_las_diez_son_la_plantilla(self):
        r = subprocess.run([sys.executable, str(RAIZ / "local_first_surface_build.py"), "--comprueba"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, "una portada no es la plantilla (python3 local_first_surface_build.py): " + r.stdout)

    def test_un_solo_panel_y_nada_del_hub(self):
        for l, t in self.portadas():
            with self.subTest(portada=l):
                self.assertEqual(t.count("<main"), 1)
                self.assertIn('<main id="juego-panel"', t)
                self.assertEqual(t.count("<header"), 1)
                for hub in ('id="cabezal"', 'id="i18n"', "chat", "honest-footer", "panel-modelos", "cabezal-rotulos"):
                    self.assertNotIn(hub, t, f"{l}: la portada trae HTML del hub ({hub})")

    def test_solo_carga_lo_que_el_juego_necesita(self):
        """Medido (propuestas/mudanza-20261011/pide.js): Identity, el canal, la PWA y el juego."""
        for l, t in self.portadas():
            with self.subTest(portada=l):
                guiones = set(re.findall(r'<script src="([^"]+)"', t))
                sobran = {g for g in guiones - self.PERMITIDOS if not re.fullmatch(r"/assets/enviar-[a-z]{2}\.js", g)}
                self.assertEqual(sobran, set(), f"{l} carga lo que el juego no pide")
                self.assertIn("/assets/thegame.js", guiones)

    def test_la_pagina_se_reordena_no_carga(self):
        """J10: cambiar de pestana va en startViewTransition, con el cambio de siempre como reserva y SIN
        animacion con movimiento reducido; el contenido final lo pone muestraYa, el mismo de antes."""
        # La terminal (menu, cajon, hojas) salio de thegame.js a terminal_menu_shell.js (FIRMO 2026-10-12): se miran los dos.
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8") + (PUBLICO / "assets" / "terminal_menu_shell.js").read_text(encoding="utf-8")
        self.assertIn("d.startViewTransition && !rm", tg)
        self.assertIn(".thegame-menu-item.con-aviso::after", (PUBLICO / "assets" / "terminal_menu_shell.css").read_text(encoding="utf-8"),
                      "History mode must show a visible notification light")
        self.assertIn("else { muestraYa(id, foco); }", tg)
        self.assertIn("prefers-reduced-motion: reduce", tg[tg.index("function muestra(id"):tg.index("function muestraYa")])
        css = (PUBLICO / "assets" / "eaa-art12-local-first-surface.css").read_text(encoding="utf-8")
        self.assertIn("@media (prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}}", css)
        for red in ("fetch(", "XMLHttpRequest"):
            self.assertNotIn(red, tg[tg.index("function muestra(id"):tg.index("function muestraYa")])

    def test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez(self):
        shell = sin_comentarios((PUBLICO / "assets" / "terminal_menu_shell.js").read_text(encoding="utf-8"))
        muestra = shell[shell.index("function muestraYa"):shell.index("function hoja(")]
        abre = shell[shell.index("function abre("):shell.index("function entrada(")]
        self.assertRegex(muestra, r"if\s*\(actual\)[\s\S]*?(?:cierraCajon|cajon\.hidden\s*=\s*true)",
                         "abrir hoja debe cerrar el panel lateral antes de mostrarla")
        self.assertRegex(abre, r"if\s*\(siguiente[\s\S]*?cierraHoja\(\)",
                         "abrir panel lateral debe cerrar la hoja abierta")

    def test_el_juego_se_monta_en_el_panel_no_encima(self):
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("var P = document.getElementById('juego-panel');", tg)
        # U0 («el mapa unico»): todas las paginas son portadas; el camino del <dialog> se retiro (nunca corria).
        self.assertIn("P.textContent = ''; P.appendChild(capa);", tg)
        self.assertNotIn("showModal", sin_comentarios(tg))
        self.assertIn("window.TheGame.abre(null", (PUBLICO / "assets" / "eaa-art12-local-first-surface.js").read_text(encoding="utf-8"))

# --- ComentarEnTodasLasPaginas · page-comment.js y sus nueve lenguas: solo los cargaba /play/; ninguna pagina viva comenta ya por esa via
class ComentarEnTodasLasPaginas(unittest.TestCase):
    """Comentar cualquier pagina, en las nueve lenguas, por el canal que YA llega al rack (Soberano,
    2026-10-05): `Enviar.paquete` -> POST /api/v1/paquetes con `preceptoros/correcciones/1`, firmado
    con la identidad del navegador. Un solo modulo compartido, ningun endpoint nuevo; dice que se envia
    y que no; consentimiento por acto; el texto viaja tal cual."""

    JS = PUBLICO / "assets" / "page-comment.js"


    def test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra(self):
        self.assertTrue(self.JS.is_file(), "falta public/assets/page-comment.js")
        js = sin_comentarios(self.JS.read_text(encoding="utf-8"))
        self.assertLessEqual(self.JS.stat().st_size, 16 * 1024)
        for malo in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "innerHTML", "localStorage"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, js, "el comentario sale por enviar.js y por nada mas")
        self.assertEqual(js.count(".paquete('preceptoros/correcciones/1'"), 1)
        self.assertIn("s.src = '/assets/enviar.js'", js)
        self.assertIn("correccion: texto", js, "el texto no viaja tal cual")
        self.assertNotIn(".trim()", js, "el texto se recorta antes de viajar")
        self.assertIn("tipo: 'comentario'", js, "un comentario entraria en el dataset de correcciones")
        self.assertIn("R.casilla.checked = false; R.estado.textContent = ''", js, "el consentimiento no es por acto")
        env = sin_comentarios((PUBLICO / "assets" / "enviar.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\((API \+ '/\w+')", env), ["API + '/reto'", "API + '/paquetes'"])

    def test_dice_que_se_envia_en_las_nueve_lenguas(self):
        js = self.JS.read_text(encoding="utf-8")
        for l in LENGUAS_DATOS:
            with self.subTest(lengua=l):
                m = re.search(r"\n    " + l + r": \[(.*?)\]", js, re.S)
                self.assertTrue(m, f"sin textos en {l}")
                self.assertEqual(len(re.findall(r"'(?:[^'\\]|\\.)*'", m.group(1))), 14, l)
                self.assertIn("{p}", m.group(1), f"{l}: no dice que pagina se envia")

# --- GlifoSemantico · semiotic_glyph.js: grafico del mapa viejo (>1 semana), solo lo cargaba /play/
class GlifoSemantico(unittest.TestCase):
    """P2: family-friendly vector marks, WCAG non-text contrast and a compact four-value record."""

    def test_palette_vectorial_contrasta_con_el_panel(self):
        fuente = (PUBLICO / "game" / "semiotic_glyph.js").read_text(encoding="utf-8")
        paleta = re.search(r"var COLORS = \[([^]]+)\]", fuente)
        self.assertIsNotNone(paleta)
        colores = re.findall(r"#[0-9A-Fa-f]{6}", paleta.group(1))
        self.assertEqual(colores, ["#E6A817", "#00D2FF", "#2ECC71", "#9B59B6", "#7F8C8D"])

        def lum(h):
            rgb = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
            linear = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in rgb]
            return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2]

        fondo = lum("#111827")
        for color in colores:
            with self.subTest(color=color):
                self.assertGreaterEqual((max(lum(color), fondo) + .05) / (min(lum(color), fondo) + .05), 3.0,
                                        "WCAG 1.4.11 non-text contrast for the glyph edge")

    def test_glifo_es_accesible_local_y_acotado(self):
        fuente = (PUBLICO / "game" / "semiotic_glyph.js").read_text(encoding="utf-8")
        css = (PUBLICO / "game" / "home.css").read_text(encoding="utf-8")
        self.assertLess(len(fuente.encode()), 16 * 1024)
        self.assertLess(len(css.encode()), 16 * 1024)
        self.assertIn("role: 'img'", fuente)
        self.assertIn("'aria-label': describe(g, note)", fuente)
        self.assertRegex(css, r"semiotic-sound\{[^}]*min-height:2\.75rem")
        self.assertIn("@media(prefers-reduced-motion:reduce)", css)
        for remote in ("fetch(", "WebSocket", "XMLHttpRequest", "sendBeacon"):
            self.assertNotIn(remote, fuente)
        r = subprocess.run(["node", str(RAIZ / "atlas" / "semiotic_glyph_cases.mjs")],
                           capture_output=True, text=True, cwd=RAIZ, timeout=30)
        self.assertEqual(r.returncode, 0, r.stderr or r.stdout)
        self.assertIn('"casos":180', r.stdout)

# --- ElJuegoEnInglesEnLasNueve · los textos del juego viejo en nueve lenguas (atlas-<l>.json): salieron las ocho no inglesas; el ingles queda como dependencia de piezas conservadas
class ElJuegoEnInglesEnLasNueve(unittest.TestCase):
    """theGame habla solo ingles y se presenta en las nueve lenguas de la web (Soberano,
    2026-10-04). Medido jugando en headless: el juego se abria bien en las nueve, pero el aviso
    «This game speaks English for now» caia en la pestana GAME y nadie de /es/ o /ar/ lo veia."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "assets" / n).read_text(encoding="utf-8"))

    def test_las_lenguas_del_juego_son_solo_ingles(self):
        self.assertIn("var LENGUAS = ['en']", self._js("thegame.js"))
        for n in ("atlas-opina.js",):
            self.assertIn("window.AtlasLengua.actual) || 'en'", self._js(n), n)
        self.assertIn("window.AtlasLengua.actual) || 'en'",
                      sin_comentarios((PUBLICO / "game" / "ui-arena-comun.js").read_text(encoding="utf-8")))  # U0: los textos de la Arena

    def test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada(self):
        # Desde U1 («el mapa unico», 2026-10-11) no hay pestanas: la primera zona es el pliego «Estado» de la
        # terminal, ABIERTO de salida, y ahi tiene que caer el aviso (si no, cae plegado y no se ve).
        js = self._js("thegame.js")
        primera = re.search(r"var PESTANAS = \[\s*\['(\w+)', '[^']*', '([^']*)'\]", js)
        self.assertTrue(primera, "no encuentro la primera pestana")
        self.assertTrue(primera.group(2).startswith("#atlas-juego > .no-data:first-child"),
                        "el aviso de lengua no va el primero en la pestana de entrada: cae en Help y no se ve")
        self.assertEqual(primera.group(1), "casa", "la primera zona ya no es la del Estado")
        # Desde la terminal chatbot (FIRMO 2026-10-12) el mapa queda limpio y el cajon cerrado: el aviso de lengua va,
        # ademas, como PRIMER mensaje del chat de la Radio, que se ve aun plegado (su ultima linea).
        shell = self._js("terminal_menu_shell.js")
        self.assertIn("var est = S.PANEL.casa;", shell)
        self.assertIn("raiz.AtlasRadioChat.dice({ quien: 'Radio', fuente: 'lengua', texto: aviso.textContent, sello: 'NO_DATA' })", shell,
                      "el aviso de lengua no llega al chat de la Radio")
        # R2 (plan «el refresco»): Help desaparece; el aviso generico (`#atlas-juego > .no-data`) lo reparte MAP.
        self.assertLess(js.index(f"['{primera.group(1)}'"), js.index("['mapa'"),
                        "la entrada tiene que repartir antes que MAP, o MAP se lleva el aviso")
        piso = self._js("atlas-piso.js")
        self.assertIn("zona.insertBefore(el('p', 'no-data', U('lengua_nd')", piso)
        self.assertIn("{l}", json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]["lengua_nd"])

# --- Estructura.test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera · assets/soberano.css: hoja de septiembre (>1 semana) que solo cargaba /play/
    def test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera(self):
        """Soberania Violeta-Cobre, 2026-09-25. Una capa ENCIMA del tema.

        Tiene que cargarse detras de `tema.css` en cada pagina que lo carga:
        antes, `tema.css` volveria a pisar la paleta y la web saldria a medias
        segun la pagina. Y no puede traer nada de fuera: ni una fuente.
        """
        css = (PUBLICO / "assets" / "soberano.css").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        self.assertNotIn("http", codigo, "la capa visual pide algo fuera")
        self.assertNotIn("@import", codigo, "la capa visual encadena otra hoja")
        for token in ("--bg-primary:#0f0c1b", "--bg-secondary:#1a152a",
                      "--accent-violet:#7c3aed", "--accent-copper:#d97706",
                      "--text-main:#e2e8f0", "--text-muted:#94a3b8"):
            with self.subTest(token=token):
                self.assertIn(token, codigo, f"falta la paleta firmada: {token}")
        tema = '<link rel="stylesheet" href="/assets/tema.css">'
        capa = '<link rel="stylesheet" href="/assets/soberano.css">'
        for pag in sorted(PUBLICO.rglob("*.html")):
            t = pag.read_text(encoding="utf-8")
            if tema not in t:
                continue
            with self.subTest(pagina=pag.relative_to(PUBLICO).as_posix()):
                self.assertIn(capa, t, "la pagina carga el tema y no la capa")
                self.assertLess(t.index(tema), t.index(capa),
                                "la capa va antes que el tema y este la pisa")

# --- Estructura.test_r_widget_y_r_tipografia · assets/canon.css: hoja de octubre-13 (>1 semana) que solo cargaba /play/; los mundos usan sus propios tokens
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

# --- AccesoTactilYPanel.test_boton_enviar_del_comentario_llega_a_44 · solo miraba assets/page-comment.css, que salio con «play the game»
    def test_boton_enviar_del_comentario_llega_a_44(self):
        self.assertRegex(self._lee("assets/page-comment.css"), r"\.pc-enviar,\.pc-sec\{min-height:2\.75rem")

# --- AccesoTactilYPanel.test_el_foco_visible_cubre_todo_el_teclado · solo miraba assets/soberano.css, que salio con «play the game»
    def test_el_foco_visible_cubre_todo_el_teclado(self):
        """soberano.css: un `:focus-visible` global; sin el, un control nuevo queda sin contorno."""
        self.assertRegex(self._lee("assets/soberano.css"), r":focus-visible\{outline:2px solid")

# --- AccesoTactilYPanel.test_etiqueta_de_consentimiento_llega_a_44 · solo miraba assets/page-comment.css, que salio con «play the game»
    def test_etiqueta_de_consentimiento_llega_a_44(self):
        """page-comment.css: la etiqueta de la casilla media 24 px de alto; es lo que se toca."""
        self.assertRegex(self._lee("assets/page-comment.css"), r"\.pc-acepto\{[^}]*min-height:2\.75rem")

# --- AccesoTactilYPanel.test_icono_de_identidad_llega_a_44 · solo miraba assets/canon.css, que salio con «play the game»
    def test_icono_de_identidad_llega_a_44(self):
        self.assertIn("var(--talla-par,44px)", self._lee("assets/canon.css"))

# --- AccesoTactilYPanel.test_idioma_y_marca_tienen_area_tactil_de_44_sin_mover_el_dibujo · solo miraba assets/eaa-art12-local-first-surface.css, que salio con «play the game»
    def test_idioma_y_marca_tienen_area_tactil_de_44_sin_mover_el_dibujo(self):
        """eaa-art12: el area tactil es un ::before que no cambia el alto de la cabecera (116 -> 217 px
        si se subia el alto real). Ambas reglas tienen que estar."""
        css = self._lee("assets/eaa-art12-local-first-surface.css")
        self.assertRegex(css, r"\.cab-lenguas a::before\{[^}]*inset:-10px -8px")
        self.assertRegex(css, r"\.cab-marca::before\{[^}]*inset:-14px 0")

# --- AccesoTactilYPanel.test_selector_del_panel_del_cangrejo_llega_a_44 · solo miraba assets/thegame.css, que salio con «play the game»
    def test_selector_del_panel_del_cangrejo_llega_a_44(self):
        """thegame.css: el select de acciones mide 41 px sin esto (medido en vivo)."""
        self.assertRegex(self._lee("assets/thegame.css"), r"\.terminal-fila select\{[^}]*min-height:2\.75rem")

# --- Arena.test_la_arena_se_carga_con_su_pestana · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- ArmyYTallerEnUnaHoja.test_el_taller_cuelga_de_la_hoja_ondas_debajo_del_army · solo miraba assets/terminal_menu_shell.js, que salio con «play the game»
    def test_el_taller_cuelga_de_la_hoja_ondas_debajo_del_army(self):
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        self.assertIn("ond.appendChild(tal)", sh, "el Taller no cuelga de la hoja ondas")
        self.assertLess(sh.index("S.ARMYZ = el('div', 'casa-army'); ond.appendChild(S.ARMYZ);"),
                        sh.index("ond.appendChild(tal)"), "el Taller debe ir debajo del Army")
        self.assertNotIn("hoja('taller'", sh, "sigue existiendo una hoja propia del Taller")

# --- ArmyYTallerEnUnaHoja.test_la_entrada_del_taller_abre_la_hoja_unica_y_baja_a_el · solo miraba assets/terminal_menu_shell.js, que salio con «play the game»
    def test_la_entrada_del_taller_abre_la_hoja_unica_y_baja_a_el(self):
        sh = (ASSETS / "terminal_menu_shell.js").read_text(encoding="utf-8")
        i = sh.index("entrada('waves',")
        bloque = sh[i:i + 400]
        self.assertIn("'thegame-ondas'", bloque, "la entrada del Taller no apunta a la hoja unica")
        self.assertIn("muestra(actual === 'ondas' ? null : 'ondas')", bloque, "Waves Army no abre su hoja compartida")
        self.assertIn("ond.appendChild(tal)", sh, "Workshop no comparte la hoja Waves Army")

# --- CasillerosDelArmy.test_el_casillero_mide_44_px_y_tiene_foco_visible · solo miraba assets/thegame.css, que salio con «play the game»
    def test_el_casillero_mide_44_px_y_tiene_foco_visible(self):
        css = (PUBLICO / "assets" / "thegame.css").read_text(encoding="utf-8")
        self.assertRegex(css, r"\.army-casillero\{[^}]*min-width:2\.75rem[^}]*min-height:2\.75rem")
        base = (PUBLICO / "assets" / "soberano.css").read_text(encoding="utf-8")
        self.assertRegex(base, r":focus-visible\{outline:2px solid")

# --- Juez.test_determinista_nulo_y_empate · miraba la carcasa o las listas de /play/ (thegame.js, su precache o sus textos), que salieron
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

# --- Juez.test_la_capa_habla_una_lengua_completa · solo miraba assets/thegame.js, que salio con «play the game»
    def test_la_capa_habla_una_lengua_completa(self):
        """Cualquier portada abre el juego en una lengua COMPLETA, y la capa lo declara (lang y dir)."""
        t = (RAIZ.parent / "public" / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("en", LENGUAS_JUEGO)
        self.assertIn("capa.lang = lengua", t)
        self.assertIn("capa.dir =", t)

# --- Juez.test_no_sale_a_la_red_y_simula_con_el_motor_puro · solo miraba game/juez.js, que salio con «play the game»
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

# --- MapaMovible.test_j6_una_sola_fuente_de_teselas_y_el_mapa_es_el_fondo · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- MapaMovible.test_la_portada_lleva_la_zona_de_identidad_sin_ella_nadie_firma · miraba la carcasa o las listas de /play/ (thegame.js, su precache o sus textos), que salieron
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

# --- MapaMovible.test_p11_casos_del_primer_eco · solo miraba assets/thegame.js, que salio con «play the game»
    def test_p11_casos_del_primer_eco(self):
        """P11 (firmado 2026-10-11): el capitulo 1.5 ensena el Taller con sus reglas de verdad, en simulacro."""
        r = subprocess.run(["node", str(RAIZ / "eco_casos.mjs")], capture_output=True, text=True, timeout=120)
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 4, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
        self.assertIn("window.AtlasPrimerEco.monta(PANEL.taller)", (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8"))

# --- MapaMovible.test_p9_casos_del_polvo_de_taller · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- MapaMovible.test_r3_los_tubos_son_css_puro_quieto_y_dentro_del_techo · solo miraba assets/tubo.css, que salio con «play the game»
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

# --- MapaMovible.test_r4_acentos_bioluminiscentes_sin_tocar_los_colores_senal · solo miraba assets/soberano.css, que salio con «play the game»
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

# --- MapaMovible.test_r7_la_radio_suena_en_el_mapa_y_las_anclas_no_envian_nada · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- MapaMovible.test_r8_la_ceremonia_es_real_no_decide_y_se_queda_quieta · solo miraba assets/atlas.css, que salio con «play the game»
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

# --- MapaMovible.test_t_la_ficha_sale_de_ui_sin_gemelos · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Multijugador.test_a_demanda_bajo_16_kb_y_fuera_de_la_puerta · solo miraba assets/thegame.js, que salio con «play the game»
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
                if m in ARENA + CASA + DESCENSO + ADUANA + APP_PAGE_DEPENDENCIES:   # D7: lo que una pagina carga entra en el precache (ADUANA: /aduana/, Norte N3)
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
                    if h == PUBLICO / "get-the-app" / "index.html" and m in APP_PAGE_DEPENDENCIES:
                        continue   # la compuerta de lanzamiento de /get-the-app/ (NORTE 5 a1)
                    self.assertNotIn("game/" + m, h.read_text(encoding="utf-8"))

# --- Pestanas.test_el_army_se_carga_con_su_pestana_y_no_pesa_en_la_puerta · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Pestanas.test_la_hoja_de_la_capa · solo miraba assets/thegame.css, que salio con «play the game»
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

# --- Pestanas.test_lo_tecnico_va_siempre_plegado · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Pestanas.test_u1_un_mapa_una_terminal_y_dos_hojas · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piloto.test_a1b8_un_estado_y_lo_ausente_es_no_data · solo miraba assets/atlas-mapa.js, que salio con «play the game»
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

# --- Piloto.test_c_paneles_amables_y_grandes · solo miraba assets/terminal_menu_shell.js, que salio con «play the game»
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

# --- Piloto.test_el_juego_abre_sin_red_y_la_ley_sin_red_es_no_data · miraba la carcasa o las listas de /play/ (thegame.js, su precache o sus textos), que salieron
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

# --- Piloto.test_el_piloto_se_carga_con_el_juego_y_no_antes · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piloto.test_en_el_telefono_el_dedo_llega_a_workshop_y_a_fight · solo miraba assets/terminal_menu_shell.css, que salio con «play the game»
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

# --- Piloto.test_la_carta_es_un_mundo_para_todos_y_su_niebla_no_retrocede · miraba la carcasa o las listas de /play/ (thegame.js, su precache o sus textos), que salieron
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

# --- Piloto.test_la_terminal_chatbot_y_el_chat_de_la_radio · solo miraba assets/terminal_menu_shell.css, que salio con «play the game»
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

# --- Piloto.test_la_voz_exacta_es_la_misma_en_cada_aparato_y_va_en_partes_de_16_kb · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piloto.test_limpieza_sin_puertas_muertas_una_puerta_una_cerradura · solo miraba assets/atlas-piloto-capa.js, que salio con «play the game»
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

# --- Piloto.test_lo_oculto_no_se_ve · solo miraba assets/atlas.css, que salio con «play the game»
    def test_lo_oculto_no_se_ve(self):
        """Un `display` propio anula el atributo `hidden` (medido el 2026-09-27:
        «Hacer / Ignorar» se veia con Sugerir apagado). Toda clase de la capa
        que se oculta con `hidden` y tiene display propio necesita su regla."""
        css = (PISO / "atlas.css").read_text(encoding="utf-8")
        for clase in ("thegame-sugerencia", "atlas-eclosion"):
            with self.subTest(clase=clase):
                self.assertIn(f".{clase}[hidden]", css)

# --- Piloto.test_lo_que_flota_recibe_el_dedo · solo miraba assets/thegame.css, que salio con «play the game»
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

# --- Piloto.test_los_9_objetos_nacen_con_tiempo · solo miraba assets/terminal_menu_shell.js, que salio con «play the game»
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

# --- Piloto.test_opinar_firmado_se_carga_al_pulsar_y_su_contrato_es_cerrado · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piloto.test_pr1_la_ventana_como_conversacion · miraba la carcasa o las listas de /play/ (thegame.js, su precache o sus textos), que salieron
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

# --- Piloto.test_pr2_gusanos_y_pr3_vector · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piso.test_arte_mapa_y_dialogo_no_salen_a_la_red · solo miraba assets/atlas-arte.js, que salio con «play the game»
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

# --- Piso.test_el_retrato_es_la_onda_del_emblema_sin_raster · solo miraba assets/atlas-arte.js, que salio con «play the game»
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

# --- Piso.test_las_leyes_del_mundo_coinciden_con_lo_medido · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- Piso.test_las_nueve_lenguas_tienen_las_mismas_claves · solo miraba assets/atlas-piloto-capa.js, que salio con «play the game»
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

# --- Piso.test_solo_se_entra_por_thegame · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- PrecacheDelJuego.test_juego_contiene_todo_lo_que_la_puerta_carga · solo miraba assets/thegame.js, que salio con «play the game»
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

# --- RedisenoDoogee.test_las_dos_firmas_son_dos_pasos_numerados · solo miraba assets/thegame.css, que salio con «play the game»
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

# --- TheGameV15.test_creation_page_dependencies_are_precached · solo miraba creation.html, que salio con «play the game»
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

# --- TheGameV15.test_v15_invocar_firma_antes_de_pagar_y_se_carga_a_demanda · solo miraba assets/thegame.js, que salio con «play the game»
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
                    if h == PUBLICO / "get-the-app" / "index.html" and m in APP_PAGE_DEPENDENCIES:
                        continue   # la compuerta de lanzamiento de /get-the-app/ (NORTE 5 a1)
                    self.assertNotIn(f"game/{m}", h.read_text(encoding="utf-8"))

# --- TrozoInvoca.test_el_satelite_existe_y_se_registra_antes_que_ui · solo miraba assets/thegame.js, que salio con «play the game»
    def test_el_satelite_existe_y_se_registra_antes_que_ui(self):
        self.assertTrue((PUBLICO / "game" / "ui-invoca.js").exists(), "falta ui-invoca.js")
        th = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("['/game/ui-invoca.js']", th, "thegame.js no carga el satelite")
        self.assertLess(th.index("['/game/ui-invoca.js']"), th.index("['/game/ui.js']"), "el satelite debe cargar antes que ui.js")
        self.assertIn("'/game/ui-invoca.js'", (PUBLICO / "sw-listas.js").read_text(encoding="utf-8"), "no esta en el precache")

# --- tests/a11y_dom_guardian.test.mjs (las dos pruebas de la carcasa de /play/) · /play/ salio; la puerta de la portada sigue guardada
r'''
// English canon until MVP (2026-10-25): the game shell lives at /play/; the root is the door (checked below).
const LENS = ['play/'];

function page(l) { return readFileSync(ROOT + 'public/' + l + 'index.html', 'utf8'); }

test('skip-link exists in every portada, visible-on-focus, points to the game panel', () => {
  for (const l of LENS) {
    const t = page(l);
    if (!/class="skip-link" href="#juego-panel"/.test(t)) {
      throw new Error('skip-link ausente en la portada ' + (l || 'raíz'));
    }
  }
});

test('one h1 per portada, inside main, visually quiet (cab-h1)', () => {
  for (const l of LENS) {
    const t = page(l);
    const n = (t.match(/<h1\b/g) || []).length;
    if (n !== 1) { throw new Error('portada ' + (l || 'raíz') + ' tiene ' + n + ' h1 (esperado 1)'); }
    if (!/aria-label="theGame"><h1 class="cab-h1">theGame<\/h1>/.test(t)) {
      throw new Error('h1 no está en el main con cab-h1 en ' + (l || 'raíz'));
    }
  }
});

'''

# --- tests/map_bubble_figures.test.mjs · arena loads bestiary before either map painter · leia la lista ARENA de thegame.js, que salio
r'''
test('arena loads bestiary before either map painter', () => {
  const source = read('public/assets/thegame.js');
  const arena = source.match(/var ARENA = \[([\s\S]*?)\];/)[1];
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') >= 0);
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') < arena.indexOf('/game/reef_corals.js'));
  assert.ok(arena.indexOf('/game/bubble_bestiary.js') < arena.indexOf('/game/map_nodes_layer.js'));
});
'''

# --- atlas/sin_undefined.mjs (el recorrido de /play/: descenso, WavesCraft, glifo, inspector) · /play/ salio; la regla sigue en las paginas vivas
r'''
  for (const p of ['/play/']) {
    actual = { path: p, step: 'carga' };
    await cmd('Page.navigate', { url: `http://127.0.0.1:${port}${p}` });
    await espera(7000);
    actual.step = 'dibujos';  /* FIRMO 2026-10-19: llegar = dibujos; x = casa */
    const d = await evalua("(q=>{const x=q('.descent-skip');if(!x||!q('canvas.descent-art'))return 0;x.click();return 'ok'})(s=>document.querySelector(s))");
    pasos++; if (d !== 'ok') { fallos.push({ path: p, step: 'dibujos', snippet: 'no drawings' }); }
    await espera(6000);

    actual.step = 'abre'; await espera(1500); await revisa('abre');
    await checkWavesCraft(evalua, fallos, p);
    actual.step = 'glyph-accessibility';
    const glyph = await evalua(`(() => {
      if (!window.AtlasGlyph) return JSON.stringify({ready:false});
      const host=document.createElement('div'); host.id='semiotic-fixture';
      (document.getElementById('thegame')||document.body).appendChild(host);
      AtlasGlyph.monta(host,[1,0,0,2],'A cyan shield keeps red packets inside the boundary.');
      const svg=host.querySelector('svg'), b=host.querySelector('button'), status=host.querySelector('[role=status]');
      const result={ready:true,role:svg?.getAttribute('role'),label:svg?.getAttribute('aria-label'),height:b?parseFloat(getComputedStyle(b).minHeight):0,
        quiet:status?.textContent,description:host.innerText}; host.remove(); return JSON.stringify(result);
    })()`);
    let glyphData=null; try { glyphData=JSON.parse(glyph||'{}'); } catch {}
    if (!glyphData?.ready || glyphData.role!=='img' || !/signal cyan.*transport vector/i.test(glyphData.label||'') || glyphData.height<44 || !/Sound is off until you tap/.test(glyphData.quiet||'') || !/red packets/.test(glyphData.description||'')) {
      fallos.push({path:p,step:actual.step,snippet:'glyph rendering/accessibility/audio opt-in mismatch: '+JSON.stringify(glyphData)});
    }
    await revisa(actual.step);

    actual.step = 'hexelion-dictionary';
    const dictionary = await evalua(`(async () => {
      const A=window.AtlasHexelionDictionary;
      if (!A) return JSON.stringify({ready:false});
      await A.ready;
      const host=document.createElement('details'); host.open=true; document.body.appendChild(host); A.monta(host);
      await new Promise(r=>setTimeout(r,30));
      const buttons=[...host.querySelectorAll('.hexelion-crystal')]; buttons[1]?.click();
      const result={ready:true,count:buttons.length,nativeButtons:buttons.every(b=>b.tagName==='BUTTON'&&!b.hasAttribute('role')),state:A.state(),detail:host.querySelector('.hexelion-crystal-detail')?.innerText||'',
        glyph:!!host.querySelector('.hexelion-crystal-detail .semiotic-glyph svg[role=img]'),anchorsVisible:/Wikidata:|EUR-Lex-CELEX:/.test(host.innerText),
        reward:/Cobre|Coppers|Capture star/.test(host.innerText)}; host.remove(); return JSON.stringify(result);
    })()`);
    let dictionaryData = null; try { dictionaryData = JSON.parse(dictionary || '{}'); } catch {}
    if (!dictionaryData?.ready || dictionaryData.count !== 43 || !dictionaryData.nativeButtons || dictionaryData.state?.total?.indexOf('NO_DATA') !== 0 ||
        !/Clear Reef/.test(dictionaryData.detail) || !dictionaryData.glyph || dictionaryData.anchorsVisible || dictionaryData.reward) {
      fallos.push({ path: p, step: actual.step, snippet: 'public catalogue interaction or limits mismatch: ' + JSON.stringify(dictionaryData) });
    }
    await revisa(actual.step);

    actual.step = 'startup';
    const stateEntry = await evalua("document.getElementById('menu-history')");
    if (!stateEntry) { fallos.push({ path: p, step: 'startup', snippet: 'theGame state entry did not mount' }); }
    await evalua("document.getElementById('menu-history')?.click()");
    await espera(1500);
    const stateBoot = await evalua("JSON.stringify({ready:Boolean(document.querySelector('#crab-state-screen') && document.querySelector('#thegame-estado'))," +
      "sections:[...document.querySelectorAll('#crab-state-screen [data-section]')].map(e=>e.dataset.section)," +
      "text:document.querySelector('#crab-state-screen')?.innerText||''," +
      "controls:[...document.querySelectorAll('#crab-state-screen button')].map(e=>e.innerText)," +
      "summon:document.querySelector('#crab-state-screen a[href=\\\"#thegame-ondas\\\"]')!==null})");
    let screen = null; try { screen = JSON.parse(stateBoot); } catch {}
    if (!screen?.ready || JSON.stringify(screen.sections) !== JSON.stringify(['who', 'body', 'core', 'budget', 'receipts', 'actions']) || !screen.summon) {
      fallos.push({ path: p, step: 'startup', snippet: 'crab state screen structure/order/action missing' });
    }
    if (/\{"|\bSave on this device\b|\bForget saved game\b|\bImport game\b/.test(screen?.text || '')) {
      fallos.push({ path: p, step: 'startup', snippet: 'machine data or controls leaked into the crab screen' });
    }
    if (!/WHO YOU ARE[\s\S]*YOUR BODY[\s\S]*CORE AND RIFT[\s\S]*YOUR BUDGET[\s\S]*RECEIPTS[\s\S]*WHAT YOU CAN DO/.test(screen?.text || '')) {
      fallos.push({ path: p, step: 'startup', snippet: 'state titles did not render in the fixed order' });
    }
    const summon = await evalua("JSON.stringify((() => { const base=document.getElementById('casa-estado'), card=base?.querySelector('#summon-access'), buttons=[...(card?.querySelectorAll('.summon-access-button')||[])]; return {top:base?.firstElementChild?.id==='summon-access',symbol:card?.querySelector('.summon-access-symbol')?.textContent,cap:card?.querySelector('.summon-access-cap')?.textContent,ids:buttons.map(b=>b.id),labels:buttons.map(b=>b.getAttribute('aria-label')),height:buttons.length?Math.min(...buttons.map(b=>parseFloat(getComputedStyle(b).minHeight))):0}; })())");
    let access = null; try { access = JSON.parse(summon); } catch {}
    if (!access?.top || access.symbol !== '∿' || access.cap !== 'Team limit: 10 waves' || access.ids.length !== 4 || access.height < 44 || !access.labels.every(x => /Cost: [0-9]+ copper · [0-9]+ light/.test(x || ''))) {
      fallos.push({ path: p, step: 'startup', snippet: 'Base summon card is not first, measured, priced or touch sized: ' + JSON.stringify(access) });
    }
    await revisa('startup');
    await evalua("document.getElementById('menu-history')?.click()");
    await espera(300);

    const n = (await evalua("document.querySelectorAll('.thegame-menu-item').length")) ?? 0;
    const ids = (await evalua("[...document.querySelectorAll('.thegame-menu-item')].map((e,i)=>e.id||('item-'+i))")) ?? [];
    const labels = await evalua("JSON.stringify([...document.querySelectorAll('.thegame-menu-item')].map(e=>e.getAttribute('aria-label')))");
    const routeLabels = JSON.parse(labels || '[]').map(x => x.replace(/ · alert$/, ''));
    if (n !== 5 || JSON.stringify(routeLabels) !== JSON.stringify(['History mode','Waves Army','Buildings','Nodes & Events','How to start?'])) {
      fallos.push({ path: p, step: 'sidebar', snippet: 'expected the five English routes: ' + String(labels) });
    }
    for (let i = 0; i < n; i++) {
      const paso = ids[i] || `item-${i}`;
      actual.step = paso;
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500); await revisa(paso);
      await evalua(`document.querySelectorAll('.thegame-menu-item')[${i}]?.click()`);
      await espera(1500);
    }

    actual.step = 'nodes-roster';
    await evalua("document.getElementById('menu-nodes')?.click()"); await espera(1500);
    const roster = await evalua("JSON.stringify({visible:!document.getElementById('pliego-nodos')?.hidden,text:document.getElementById('pliego-nodos')?.innerText||''})");
    const rosterData = JSON.parse(roster || '{}');
    if (!rosterData.visible || !/nodo\.0\.hexelion/.test(rosterData.text) || !/nodo\.1\.doogee/.test(rosterData.text) || !/Beelink/.test(rosterData.text) || !/Doogee S110/.test(rosterData.text) || !/heartbeat.*NO_DATA/i.test(rosterData.text)) {
      fallos.push({ path: p, step: actual.step, snippet: 'node roster missing a declared device or honest heartbeat state: ' + JSON.stringify(rosterData) });
    }
    if (process.env.SABOTAGE_SKILL_LIVE === '1') { await evalua("document.querySelector('#pliego-skills ul')?.removeAttribute('aria-live')"); }
    const mando = await evalua("JSON.stringify({panel:!document.getElementById('pliego-skills')?.hidden,skillsLive:document.querySelector('#pliego-skills ul')?.getAttribute('aria-live'),buttons:[...document.querySelectorAll('#pliego-skills .crab-joystick button')].map(b=>({label:b.getAttribute('aria-label'),height:getComputedStyle(b).minHeight})),voice:document.querySelector('[data-voice-control]')?.textContent||''})");
    const mandoData = JSON.parse(mando || '{}');
    if (mandoData.skillsLive !== 'polite' || mandoData.buttons?.length !== 4 || !mandoData.buttons.every(b => parseFloat(b.height) >= 44 && /^Move (north|south|east|west)$/.test(b.label || '')) || !/Voice movement: NO_DATA.*speech recognition/i.test(mandoData.voice)) {
      fallos.push({ path: p, step: 'crab-controls', snippet: 'live skill announcements, directional controls, or honest voice-control status missing' });
    }
    await evalua("document.getElementById('menu-start')?.click()"); await espera(1200);
    const entry = await evalua("document.getElementById('pliego-entrada')?.innerText||''");
    if (!/Enter as a crab/.test(entry) || !/nodo\.1\.doogee/.test(entry)) { fallos.push({ path: p, step: 'entry', snippet: 'the visitor cannot choose the Doogee node as a crab' }); }
    await evalua("document.getElementById('menu-waves')?.click()"); await espera(1500);
    let superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    if (JSON.parse(superficies || '{}').panel) { fallos.push({ path: p, step: actual.step, snippet: 'Army hoja left the side panel open' }); }
    await evalua("document.getElementById('menu-history')?.click()"); await espera(1500);
    superficies = await evalua("JSON.stringify({panel:!document.getElementById('thegame-terminal')?.hidden,hoja:[...document.querySelectorAll('.thegame-hoja')].some(e=>!e.hidden)})");
    const exclusivas = JSON.parse(superficies || '{}');
    if (exclusivas.hoja) { fallos.push({ path: p, step: actual.step, snippet: 'side panel left an Army or Battle sheet open' }); }
    await evalua("document.getElementById('menu-history')?.click()"); await espera(300);

    actual.step = 'chat';
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500); await revisa('chat');
    const channelCount = await evalua("document.querySelectorAll('#radio-chat [role=tab]').length");
    if (channelCount !== 3) { fallos.push({ path: p, step: 'chat', snippet: 'three communication channels did not render' }); }
    await evalua("[...document.querySelectorAll('#radio-chat [role=tab]')].find(b=>b.textContent==='Chat')?.click()"); await espera(200);
    const noData = await evalua("document.getElementById('radio-chat-no-data')?.innerText||''");
    if (!/NO_DATA.*global chat.*tested repository channel/i.test(noData)) { fallos.push({ path: p, step: 'chat', snippet: 'global chat does not declare its repository-data cause' }); }
    const records = await evalua("JSON.stringify((()=>{const r=window.AtlasRadioChat;if(r)r.dice({quien:'Browser test',texto:'synthetic message for schema check',fuente:'browser-test',sello:'SIMULATED'});return r?.registro().slice(-1).map(x=>Object.keys(x));})())");
    if (!records || !/quien/.test(records) || !/sello/.test(records) || !/fuente/.test(records) || !/ciclo/.test(records) || !/texto/.test(records)) {
      fallos.push({ path: p, step: 'ai-fluency', snippet: 'Radio does not expose structured, sourced messages to the agent interface' });
    }
    await evalua("[...document.querySelectorAll('#radio-chat [role=tab]')].find(b=>b.textContent==='Radio')?.click()");
    await evalua("document.getElementById('radio-chat-alterna')?.click()");
    await espera(1500);

    actual.step = 'inspector';  /* 0d: la ficha de cada pieza del mapa, mas un toque real al centro de la primera */
    const fichas = (await evalua("window.AtlasInspector ? JSON.stringify(AtlasInspector.todas()) : 'NO_INSPECTOR'")) ?? '';
    pasos++;
    if (!fichas || fichas === 'NO_INSPECTOR' || fichas === '[]' || /inspector: /.test(fichas)) { fallos.push({ path: p, step: 'inspector', snippet: 'sin fichas: ' + fichas }); }
    if (!fichas.includes('HEXELION Star')) { fallos.push({ path: p, step: 'inspector', snippet: 'map queue has no HEXELION Star building card' }); }
    for (const m of fichas.matchAll(/\bundefined\b|\bNaN\b/g)) { fallos.push({ path: p, step: 'inspector', snippet: fichas.slice(Math.max(0, m.index - 30), m.index + 30) }); }

    actual.step = 'identidad';
    await evalua("document.querySelector('[popovertarget=identity-menu]')?.click()");
    await espera(1500); await revisa('identidad');
  }
}
'''

# --- atlas/wave_duel_browser.mjs (fases de /play/: arena, voz O2 y practica del tutorial) · /play/ salio; la voz y el escenario se miden ahora en un mundo
r'''
  // 1 · /play/ arena: a PvE fight through ui-arena's real juega (the duel plays through the same juega).
  await cmd('Page.navigate', { url: origen + '/play/' });
  await hasta("!!document.querySelector('.descent-skip')", 15000); await ev("(b => b && b.click())(document.querySelector('.descent-skip'))");
  ok(await hasta('!!(window.AtlasArenaUI && window.AtlasArena && window.AtlasWaveDuel)', 40000), '/play/: the arena or the wave duel did not load');
  medida.oscAntes = await ev('__osc.length');
  await ev(`(() => { AtlasSintesis.activa(true); const K = AtlasCanon, A = AtlasArena, l = A.lugares().find((x) => x.id === 'arrecife'), asa = [1, 2, 3].map((n) => ({ tc: 'tc1', semilla: K.sha('w-captura-ref-' + n) })),
    s = K.sha('w-captura-ref-semilla'); AtlasArenaUI.juega(l.defensa.tropas, asa, A.combate(l.defensa.tropas, asa, s), { titulo: 'ref', yo: 1, semilla: s, pve: true }); return true; })()`);
  await espera(3000);
  medida.play = JSON.parse(await ev(`JSON.stringify({ montajes: __montajes.slice(), replay: typeof window.AtlasReplay, tinta: ${tinta('canvas.atlas-arena-lienzo')} })`));
  ok(medida.play.montajes.includes('atlas-arena-lienzo') && medida.play.replay === 'undefined' && medida.play.tinta > 500, '/play/ arena is not on the wave duel: ' + JSON.stringify(medida.play));
  // O2: the fight is heard at its seals' pitch (LIVE 440 Hz, SIMULATED 275 Hz: this PvE side is emulated), only after opting in.
  await espera(9000);
  medida.voz = JSON.parse(await ev('JSON.stringify({ antes: ' + medida.oscAntes + ', osc: __osc.length, f: [...new Set(__osc)].sort((a, b) => a - b) })'));
  ok(medida.voz.antes === 0 && medida.voz.f.includes(440) && medida.voz.f.includes(275), 'O2: the duel is not heard at its seal pitch: ' + JSON.stringify(medida.voz));
  if (CAPTURA) { const s = await cmd('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(CAPTURA, 'o1b-play.png'), Buffer.from(s.result.data, 'base64')); }
  // 2 · the tutorial practice: its own scripts, mounted, rounds advanced until the model ends it (measured: this seed ends at round 2).
  await ev('TheGame.tutorial()'); await hasta('!!(window.AtlasPracticeArena && window.AtlasWaveDuel)', 30000);
  await ev(`(() => { const h = document.createElement('div'); h.id = 'w-practica'; document.body.appendChild(h); window.__pr = AtlasPracticeArena.mount(document, h, { seed: AtlasCanon.sha('w-practica') });
    for (let i = 0; i < 3; i++) { [...h.querySelectorAll('button')].find((b) => b.textContent === 'Next round').click(); } return true; })()`);
  await espera(2500);
  medida.practica = JSON.parse(await ev(`JSON.stringify({ montajes: __montajes.slice(), tick: __pr.state().tick, tinta: ${tinta('#w-practica canvas.en301-duel')} })`));
  ok(medida.practica.montajes.includes('en301-duel') && medida.practica.tick >= 1 && medida.practica.tinta > 200, 'the practice is not on the wave duel: ' + JSON.stringify(medida.practica));
'''
