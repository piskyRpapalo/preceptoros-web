# Portugués de la web · lo que falta, medido

La carpeta `public/pt/` se creó el 2026-09-04 con la portada traducida y se
retiró el mismo día: **una lengua a medias rompe 25 pruebas**, y el motivo es
que el criterio de idiomas se descubre del disco. Eso es correcto — significa
que todo lo que es por idioma reclama el suyo en cuanto la carpeta existe — y
sirve como lista exacta de lo que necesita una lengua completa:

| lo que falta | de dónde salió |
|---|---|
| `pt/community.html`, `pt/onboarding.html`, `pt/profile.html` | tres pruebas los abren por idioma |
| `pt/benchmark.html`, `pt/instalar.html`, `pt/playground.html` | para que el sitemap ofrezca lo mismo que las otras |
| `assets/prompts-pt.js` | `test_el_papel_no_puede_inventar_enlaces` lo lee |
| entradas `pt` en `public/anuncios.json` | tres pruebas del tablón |
| `pt` en el selector de la raíz | `test_selector_de_idioma_por_path` |
| `hreflang="pt"` en las cuatro portadas | `test_las_portadas_declaran_hreflang` |
| el segundo bloque i18n de la portada | hay claves fuera de `id="i18n"` — el `pieSolar` y los `rack*` viven en otro bloque, y `test_ninguna_portada_muestra_el_idioma_de_otra` las caza |

La portada ya traducida queda en `pt-index.html.pendiente`: 55 claves del
bloque `id="i18n"`, más títulos y metas. No se tira, se guarda.

**Y el hallazgo que importa para las cuatro lenguas siguientes:** la portada
tiene DOS bloques de traducción, no uno. Traducir solo el que lleva `id="i18n"`
deja castellano dentro de la página portuguesa, y solo se ve porque hay una
prueba que lo compara. Antes de traducir la próxima, se unifican los dos.
