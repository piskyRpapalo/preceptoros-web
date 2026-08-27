# preceptoros-web

**🇬🇧 The site does not talk to anyone until you press a button. That is not a
promise — it is a measurement, and there is a test for it.**

**🇪🇸 Este sitio no habla con nadie hasta que pulsas un botón. No es una promesa:
es una medición, y tiene un test.**

La web pública de [PreceptorOS](https://github.com/piskyRpapalo/PreceptorOS) —
un preceptor que vive en tu máquina, sin nube, sin cuenta y sin turno.

---

## 🇬🇧 What it does / 🇪🇸 Qué hace

🇬🇧 You can talk to a model **before installing anything**. On first keystroke the
page works out what your machine can actually do and offers the most sovereign
route it can run — never the other way round:

🇪🇸 Puedes hablar con un modelo **antes de instalar nada**. Al primer tecleo, la
página averigua qué puede hacer tu máquina de verdad y te ofrece la vía más
soberana que puedas correr — nunca al revés:

| | Route / Vía | Cost / Coste |
|---|---|---|
| 1 | `LanguageModel` · already on device | zero network / cero red |
| 2 | `LanguageModel` · `downloadable` | Gemini Nano, 2.7–4 GB — **stated before the button** |
| 3 | WebLLM | ~945 MB, once / una vez |
| 4 | Portable JSON | paste into the AI you already have |

🇬🇧 Route 4 is not a consolation prize. The four "copy" buttons copy **exactly the
same text**, and the page says so instead of faking four things.

🇪🇸 La vía 4 no es un premio de consolación. Los cuatro botones de copiar copian
**exactamente el mismo texto**, y la página lo dice en vez de fingir cuatro cosas.

## 🇬🇧 The one rule / 🇪🇸 La regla

🇬🇧 Nothing external loads until you ask for it. The WebLLM `import()` lives
**inside the click handler**, not at the top of the file. Verified in a real
browser: `performance.getEntriesByType('resource')` lists only same-origin
resources, before *and* after detection runs.

🇪🇸 Nada externo se carga hasta que lo pidas. El `import()` de WebLLM vive
**dentro del manejador del clic**, no arriba del fichero. Verificado en navegador
real: `performance.getEntriesByType('resource')` solo lista recursos de origen
propio, antes *y* después de que la detección decida.

🇬🇧 When you do press, the footer names who sees your IP: `esm.run` (the library)
and `huggingface.co` (the weights). / 🇪🇸 Cuando pulsas, el pie nombra quién ve tu
IP: `esm.run` y `huggingface.co`.

## Stack

HTML5 + CSS3 + vanilla JS. **Zero frameworks, zero build step, zero cookies, zero
analytics, zero persistent IDs.** Python standard library for the scripts. The
only external URL in the whole repo is `https://esm.run/@mlc-ai/web-llm`.

`localStorage` holds **two letters** (`es`, `en` or `fr`) so the language is not
asked twice. The language lives in the path, so the metric comes from the URL and
not from you.

## Estructura

```
wrangler.jsonc        Cloudflare Workers · assets.dir = ./public
public/
  index.html          language selector (3 KB) · no chat, no tracking
  es|en|fr/index.html landing + chat
  es/instalar.html    install guide
  es/lore.html        five slides · no JavaScript at all (:target + :has())
  hitos.html          reads counters.json
  counters.json       written by contadores.py · measured only
  assets/             sprite, marble, láminas, css, js
contadores.py         stdlib · O_EXCL lock · atomic write · daily rotation
test_web.py           17 doctrine checks
```

## Comprobar / Verify

```
python3 test_web.py
```

🇬🇧 17 checks: page count, no frameworks, no foreign CDNs, path-based selector,
honest footers, sprite under 50 KB, **no broken internal links**, i18n key parity
across the three languages, 10 KB per file, no gradients or radii, and
`counters.json` coherence.

🇪🇸 Las 17 se escribieron rompiendo las reglas a propósito para ver si saltaban.
Siete de ocho mutaciones dieron rojo; la octava no, y descubrió que el test del
«cero decorativo» era él mismo decorativo — solo miraba que un texto fuese largo.
Está corregido y re-mutado.

## Contribuir una traducción / Contributing a translation

🇬🇧 A language is one folder and one JSON block. No build step, no framework, no
translation platform.

1. Copy `public/en/index.html` to `public/<xx>/index.html`.
2. Translate the prose **and** the `<script type="application/json" id="i18n">`
   block at the bottom. Keep every key: the strings are what the chat shows.
3. Add the language to `public/index.html`.
4. Run `python3 test_web.py`. The parity check fails loudly if a key is missing —
   a half-translated interface falls back to nothing, not to English.

🇪🇸 Un idioma es una carpeta y un bloque JSON. Sin build, sin framework, sin
plataforma de traducción. Traduce la prosa **y** el bloque `i18n`, conserva todas
las claves, y pasa el test: si falta una, salta en rojo.

## Arte / Art

🇬🇧 Nothing was drawn for this site. The head is two 4-frame sprite strips from
the PreceptorOS repo (`aurelius-up.png`, `aurelius-talks.png`), cropped and
reduced to 43,720 bytes for all eight frames. The five láminas are the
application's own icons on a violet-veined marble derived from the app's real
marble texture.

🇪🇸 Aquí no se dibujó nada. La cabeza son dos tiras de 4 fotogramas del repo de
PreceptorOS, recortadas y reducidas: 43.720 B los ocho. Las cinco láminas son los
iconos de la propia aplicación sobre un mármol violeta derivado del mármol real
de la app.

## NO_DATA

🇬🇧 Things this repo knows it does not have, stated rather than hidden:

- **`instalar.html` and `lore.html` exist in Spanish only.** The English and
  French landings link to them and say so, with the cause.
- **Local-token counter.** The schema has room for it. There is no source, because
  the site does not track anyone — it can only ever come from a voluntary, signed
  report. Until then it renders `NO_DATA`, not a flattering number.

## Licencia / Licence

- **Código** (HTML, CSS, JS, Python): Apache License 2.0 — ver [`LICENSE`](LICENSE)
- **Contenido** (texto, imágenes, lore): CC BY-SA 4.0 — ver [`LICENSE-PROSE`](LICENSE-PROSE)

🇬🇧 The split mirrors the sibling repo, and it is not cosmetic: the lore and the
honest footers are prose, and a software licence is not their natural home.
BY-SA also requires sharing alike, which is the coherent choice for a project
that exists so people can take things with them.

---

*El silicio propone, el carbono firma.*
