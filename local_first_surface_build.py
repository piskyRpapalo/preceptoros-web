"""Escribe las paginas de entrada de preceptoros.org desde una plantilla: la portada, el juego y /get-the-app/.

    python3 local_first_surface_build.py            reescribe public/index.html, public/get-the-app/index.html y public/aduana/index.html
    python3 local_first_surface_build.py --comprueba  sale con 1 si alguna no es la que dice la plantilla

POR QUE (decreto de recencia del Soberano + canon P1, 2026-10-25). Hasta MVP todo en INGLES, y la
entrada muestra solo lo construido en los ultimos dias. Antes habia diez portadas (la raiz y nueve
lenguas) que eran la misma pagina inglesa con el juego montado dentro, y todas cargaban las hojas
compartidas de septiembre. Ahora:
  - `/` es UNA portada inglesa: la puerta a lo reciente (el juego, los mundos, la creacion). Carga solo
    su hoja nueva (`assets/landing.css`) y la marca nueva (`assets/mark.svg`); ninguna hoja vieja.
  - (Norte 7 D, 2026-10-28) `/play/` se retiro: ya no se genera. La puerta Tutorial sale de la INTRO (decreto del Sovereign: solo OpenWorld y Tools; el tutorial es el camino dentro de OpenWorld).
  - `/ar/` ... `/ru/` responden 301 a `/` desde el Worker (`worker/index.js`); sus ficheros salen de
    `public/`.
"""
import html, json, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
ORIGEN = "https://preceptoros.org"
DESCRIPCION = ("theGame: a game of waves that runs on your own device. No account, no cloud, "
               "no tracking. Build your undersea city, summon wave troops, conquer the reef.")


def cabeza(titulo, url, hojas, color, extra=""):
    return f"""<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{titulo}</title>
<meta name="description" content="{DESCRIPCION}">
<link rel="icon" type="image/svg+xml" href="/assets/mark.svg">
<link rel="canonical" href="{url}">
<meta property="og:title" content="PreceptorOS · theGame">
<meta property="og:description" content="{DESCRIPCION}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:image" content="{ORIGEN}/assets/og-card.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="{color}">
""" + "".join(f'<link rel="stylesheet" href="{h}">\n' for h in hojas) + extra + "</head>\n"


# NORTE 7 · PR 1 (decreto 2026-10-28): la INTRO. Dos puertas (OpenWorld · Tools; la puerta Tutorial sale con el corte D); Tools es un
# clic directo a la PWA mas un desplegable visible de dispositivo/descarga. OpenWorld va a /openworld/
# hasta que /openworld/ exista (PR 2): ese destino entonces cambia, y se declara en su PR.
ESTILO_INTRO = """<style>
button.door{width:100%;font:inherit;background:var(--bg);text-align:left;cursor:pointer}
#tools-dispositivo{margin-top:8px}
#tools-dispositivo h2{font-size:1.25rem;margin:24px 0 4px}
#tools-dispositivo summary{cursor:pointer;min-height:44px;padding:10px 0}
.dispositivos{margin:6px 0 0;padding-left:20px}
.dispositivos li{margin:8px 0}
.dispositivos a{color:var(--fg);min-height:44px;display:inline-block}
#release h2{font-size:1.25rem;margin:28px 0 8px}
#release code{overflow-wrap:anywhere}
</style>
"""


def portada():
    return cabeza("PreceptorOS", f"{ORIGEN}/", ["/assets/landing.css"], "#17131F", ESTILO_INTRO) + """<body>
<a class="skip" href="#doors">Skip to the doors</a>
<main>
<img class="mark" src="/assets/mark.svg" alt="" width="48" height="48">
<h1>PreceptorOS</h1>
<p class="lead">A game of waves that runs on your own device. No account, no cloud, no tracking.</p>
<nav id="doors" aria-label="Doors">
<a class="door" href="/openworld/"><b>OpenWorld</b><span>The map and the chat, side by side. Your node's world.</span></a>
<button class="door door-tools" id="door-tools" type="button" aria-controls="tools-dispositivo"><b>Tools</b><span id="tools-estado">Install the app on this device, or pick a download below.</span></button>
</nav>
<section id="tools-dispositivo" aria-labelledby="tools-h">
<h2 id="tools-h">Tools</h2>
<details open>
<summary>Device and download</summary>
<ul class="dispositivos">
<li><a href="/get-the-app/">Linux and macOS: the installer and its fingerprint</a></li>
<li><a href="/get-the-app/">Windows: the PowerShell installer</a></li>
<li><a href="/get-the-app/">Android: the Termux guide</a></li>
<li><a href="/creation.html">Creation studio: draw a ribbon and sign it</a></li>
</ul>
</details>
</section>
<section id="release" aria-labelledby="release-h">
<h2 id="release-h">Get the app</h2>
<p>Release <b data-rel="version">NO_DATA</b> (<span data-rel="fecha">NO_DATA</span>). Fingerprint of the installer: <code data-rel="sha">NO_DATA</code>.</p>
<p class="note" data-rel="estado">NO_DATA: this page has not read the release card yet. The version above is not verified.</p>
</section>
<p class="note">One language until the MVP: English. The old translated addresses lead here.</p>
</main>
<script src="/game/tabla_semantica.js"></script>
<script src="/game/comic_tokens.js"></script>
<script src="/game/comic_accents.js"></script>
<script src="/game/comic_atoms.js"></script>
<script src="/game/bubble_language.js"></script>
<script src="/game/bubble_letters.js"></script>
<script src="/assets/landing_doors.js"></script>
<script src="/assets/pwa.js"></script>
<script src="/assets/intro.js"></script>
</body>
</html>
"""


ESTADO_EN = {"PROBADO": "Tested", "NO_PROBADO": "Not tested", "NO_DATA": "NO_DATA"}
DETALLE_EN = {("install.sh", "Linux"): "Run end to end on 2026-08-31 on the development node, with an isolated home.",
              ("install.sh", "macOS"): "The Homebrew branch is written and reviewed, but there is no Mac in the rack.",
              ("install.ps1", "Windows"): "Reviewed line by line, never run: there is no Windows machine in the rack.",
              ("INSTALACION_ANDROID.md", "Android · Termux"): "The app's own guide says Termux works today and the APK does not exist yet. Not measured here."}


def release():
    return json.loads((PUBLICO / "release.json").read_text(encoding="utf-8"))


# NORTE 5 (a1, 2026-10-27): the launch gate (VT6) on top, in one or two clicks. Its data is written here, from the cards the
# web serves (release.json, cerebros.json), so the page makes no request. Only the models the landing shows (`puerta`) enter;
# their size is the measured `bytes`, with the machine and date of that measurement. No sha256 in the card: no download.
def gate(r):
    c = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
    cer = [{"id": x["id"], "size_gb": round(x["bytes"] / 1e9, 2), "sha256": x.get("sha256"), "maquina": c["backend"],
            "fecha": c["medido"][:10]} for x in c["cerebros"] if x.get("puerta") and isinstance(x.get("bytes"), int)]
    d = {"version": r["version"], "pagina": f"https://github.com/{r['repo']}/releases/tag/{r['version']}",
         "release": {"firmada": r.get("firmada", {})}, "cerebros": cer, "descargas": {}}
    return json.dumps(d, ensure_ascii=True, separators=(",", ":")).replace("</", "<\\/")


def app():
    r = release()
    base = f"https://github.com/{r['repo']}/releases"
    sha = {a["nombre"]: a["sha256"] for a in r["assets"]}
    baja = lambda n: f'<a href="{base}/download/{r["version"]}/{n}">{n}</a>'
    filas = "".join(f'<tr data-asset="{html.escape(p["asset"])}" data-estado="{p["estado"]}"><td>{html.escape(p["sistema"])}</td>'
                    f'<td>{ESTADO_EN[p["estado"]]}</td><td>{html.escape(DETALLE_EN[(p["asset"], p["sistema"])])}</td></tr>'
                    for p in r["pruebas"])
    return cabeza("Get the app · PreceptorOS", f"{ORIGEN}/get-the-app/", ["/assets/landing.css"], "#17131F") + f"""<body>
<a class="skip" href="#steps">Skip to the steps</a>
<main class="guide">
<p><a href="/">← PreceptorOS</a></p>
<h1>Get the app</h1>
<p class="lead">The app is your own node, on your own machine: local memory and a local AI that stay with you. Release <b>{r['version']}</b> ({r['fecha']}).</p>
<section class="gate" aria-labelledby="gate-h">
<h2 id="gate-h">In one or two clicks</h2>
<ol class="gate-carriles" id="gate-carriles"><li>Without JavaScript, follow the steps below.</li></ol>
<script type="application/json" id="gate-datos">{gate(r)}</script>
</section>
<p class="aviso"><b>Five minutes?</b> Nobody has timed a clean install yet, so that figure is NO_DATA. The steps are short; how long they take on your machine is yours to measure.</p>
<h2>Before you start</h2>
<ul>
<li>You need <code>python3</code> and <code>git</code>. If one is missing, the installer stops and prints the exact command for your system.</li>
<li>The installer never asks for an administrator password and installs nothing behind your back.</li>
<li>Ollama is optional. Without it the app remembers, indexes and cleans text, but does not chat.</li>
<li>8 GB of memory is enough for a small model. No graphics card is needed.</li>
<li>The installer's messages are in Spanish for now.</li>
</ul>
<h2 id="steps">Linux and macOS</h2>
<ol>
<li>Download {baja('install.sh')}.</li>
<li>Check its fingerprint. <code>sha256sum install.sh</code> must print<br><code class="sha" data-asset="install.sh">{sha['install.sh']}</code></li>
<li>Run it: <code>bash install.sh</code>. It clones the app into <code>~/preceptoros</code>.</li>
<li>Start it: <code>cd ~/preceptoros &amp;&amp; bin/preceptoros-servicio arranca</code>, then open the local address it prints in your browser.</li>
</ol>
<h2>Windows</h2>
<ol>
<li>Download {baja('install.ps1')}. It has never been run: if it fails, the exact message is useful.</li>
<li>Check its fingerprint. <code>Get-FileHash install.ps1</code> must print<br><code class="sha" data-asset="install.ps1">{sha['install.ps1']}</code></li>
</ol>
<h2>Android</h2>
<p>The app's own guide, {baja('INSTALACION_ANDROID.md')} (in Spanish), covers Termux. There is no APK yet.</p>
<p class="get-app"><a href="/aduana/">Next: create a node</a></p>
<h2>What has been tested</h2>
<table class="pruebas"><thead><tr><th>System</th><th>State</th><th>Detail</th></tr></thead><tbody>{filas}</tbody></table>
<details class="tech"><summary>Technical details</summary><p>This page is written from the release card the web serves (<a href="/release.json">release.json</a>, measured {r['medido'][:10]}{(' · seal ' + r['seal'] + ': ' + r['seal_cause']) if r.get('seal') else ''}). Its fingerprints match the live {r['version']} release (re-checked 2026-10-26). Release page: <a href="{base}/tag/{r['version']}">{r['repo']} {r['version']}</a>. Manifest sha256: <code class="sha">{r['sha256_manifiesto']}</code></p></details>
</main>
<script src="/assets/pwa.js"></script>
<script src="/game/launch_gate.js"></script>
<script src="/assets/get_app_gate.js"></script>
</body>
</html>
"""


# /aduana/ (North N2, 2026-10-26, Mesa ruling A): "Create a node", OBSERVANT. It registers nothing: it shows the measured
# state of each step and mounts the node-card checker (node_file_receiver.js). Sending sleeps until the registry is live
# and the card is signed; the registry state comes from node_reception_contract.js (REGISTRO), never typed here.
ADUANA_SCRIPTS = ["/assets/atlas-coord.js", "/game/canon.js", "/game/node_reception_contract.js", "/game/node_trust_anchor.js",
                  "/game/node_trust_manifest.js", "/game/node_signature_messages.js", "/game/node_signature_verify.js",
                  "/game/node_bindings_messages.js", "/game/node_bindings.js", "/game/node_projection.js", "/game/node_preview.js",
                  "/game/node_file_receiver.js", "/game/node_catalogue.js", "/assets/aduana_page.js", "/assets/pwa.js"]


def aduana():
    guiones = "\n".join(f'<script src="{g}"></script>' for g in ADUANA_SCRIPTS)
    return cabeza("Create a node · PreceptorOS", f"{ORIGEN}/aduana/", ["/assets/landing.css"], "#17131F") + f"""<body>
<a class="skip" href="#comprueba">Skip to the card checker</a>
<main class="guide">
<p><a href="/">← PreceptorOS</a></p>
<h1>Create a node</h1>
<p class="lead">A node is your own machine, registered as part of PreceptorOS. This page registers nothing yet: it shows where each step stands today and lets you check a node card on this device.</p>
<h2>Where each step stands (measured 2026-10-26)</h2>
<table class="pruebas" id="pasos"><thead><tr><th>Step</th><th>State</th><th>What that means</th></tr></thead><tbody>
<tr data-paso="app"><td>1 · The app</td><td>Available</td><td>Release v1.3. <a href="/get-the-app/">Get the app</a>.</td></tr>
<tr data-paso="cedula"><td>2 · Your node card</td><td>Issued by the rack</td><td>The rack issues the card and the app imports it. You cannot issue one yourself yet.</td></tr>
<tr data-paso="firma"><td>3 · Its signature</td><td>NO_DATA</td><td>No signing ceremony has run yet. An unsigned card stays pending.</td></tr>
<tr data-paso="registro"><td>4 · The registry</td><td id="estado-registro">NO_DATA</td><td>Built, not deployed: its address answers with another service.</td></tr>
<tr data-paso="envio"><td>5 · Sending from here</td><td id="estado-envio">Asleep</td><td>Nothing leaves this page until the registry is live and the card is signed.</td></tr>
</tbody></table>
<h2>Check a node card</h2>
<p>Choose the card file the app gave you. It is read on this device only.</p>
<div id="comprueba"></div>
<h2 id="catalogo-h">Public catalogue</h2>
<p>The registry's public list: each node with its state and cause, never a device key. Test nodes are never listed.</p>
<p class="aviso" id="catalogo-estado">NO_DATA · the registry is not deployed, so there is nothing to list yet.</p>
<p><button type="button" id="catalogo-carga" disabled>Load the catalogue</button></p>
<table class="pruebas" id="catalogo" aria-labelledby="catalogo-h" hidden><thead><tr><th>Node</th><th>State</th><th>Cause</th><th>Received</th><th>Receipt</th></tr></thead><tbody></tbody></table>
<details class="tech"><summary>Technical details</summary><p>The checker reads <code>preceptoros.cedula-nodo/1</code> under 1 KiB and verifies its integrity hash. Its authenticity stays NO_DATA without a trust anchor. When the registry is live, it will answer with a receipt this page checks by recomputing its hash; a receipt is not a signature.</p></details>
</main>
{guiones}
</body>
</html>
"""


def todas():
    yield PUBLICO / "index.html", portada()
    yield PUBLICO / "get-the-app" / "index.html", app()
    yield PUBLICO / "aduana" / "index.html", aduana()


def main(argv):
    if "--comprueba" in argv:
        malas = [str(p.relative_to(RAIZ)) for p, t in todas()
                 if not p.is_file() or p.read_text(encoding="utf-8") != t]
        print("\n".join(malas) or f"las {len(list(todas()))} paginas de entrada son la plantilla")
        return 1 if malas else 0
    for p, t in todas():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(t, encoding="utf-8")
    print(f"{len(list(todas()))} paginas de entrada escritas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
