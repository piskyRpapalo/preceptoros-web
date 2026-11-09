# Inventario de referencias · consolidación de repos (COMPACT-01) · 2026-11-09

> Comisión: HEXELION · MISTRAL-WEB · COMPACT-01; acta TARGET-11 (buzon#53, ·6753074777).
> Regla: no se sustituye un enlace sin destino verificado. Nada de lo propuesto se describe como LIVE.

## 1 · Alcance medido

Barrido de 23 superficies (docs de raíz, docs/, índices de máquina y reglas) en main 8d338bd7, 2026-11-09. La búsqueda de código de GitHub NO indexa este repo (medido: «duel_face» da 0 resultados), así que el censo es lectura directa de archivos. NO_DATA: ~100 archivos de docs/ sin barrer uno a uno.

## 2 · Repos que se pliegan o archivan, con sus referencias medidas

| Repo | Destino declarado (TARGET-11) | Referencias en docs web | Clase | Acción |
| --- | --- | --- | --- | --- |
| study | preceptoros-companion/doctrine/ | README (×3), CONTRIBUTING (×2 enlaces blob), odd/README.md, canon-map-details §9 | navegación viva | inventario; sin cambio: el destino aún no existe |
| roadmap | preceptoros-private-mesa/ | README | navegación viva | inventario |
| preceptoros-atlas | preceptoros-private-mesa/ | README | navegación viva | inventario |
| buzon | preceptoros-private-mesa/ | README (#30, #19, #53) | navegación viva, tráfico diario | inventario; el archivo exige sucesor con custodia antes |
| firmas | preceptoros-private-mesa/ | README, AGENTS.md | navegación viva, solo apéndices | inventario; custodia solo-apéndice antes del archivo |
| preceptoros-terminal | p0x/services/ | README | navegación viva | inventario |
| hexelion-nexo | p0x/services/ | README | navegación viva | inventario |
| coder | ya archivado | README | cita histórica | sin cambio |

Los enlaces de la tabla quedan como están: sus destinos nuevos todavía no existen (regla de arriba). Las citas históricas (por ejemplo, el nombre antiguo del APP en actas viejas) no se tocan: no son navegación.

## 3 · Nombre canónico del APP repo

Corregido en este PR: README.md y CONTRIBUTING.md apuntan a preceptoros-app (nombre canónico por MARCHA DOC-4). Destinos verificados en vivo: el repo y PRECEPTOR.md en su main. La URL antigua sigue funcionando; no se rompe nada.

Pendiente, fuera de este PR:

- llms.txt raíz: gemelo byte a byte de public/llms.txt (regla de test_web.py: las dos copias son iguales); tiene 5 enlaces APP antiguos. Tocarlo es tocar bytes servidos: pieza propia.
- test_web.py, ENLACES_ADMITIDOS: admite la URL antigua como regla de runtime: pieza propia.
- ai-index.json (generado por lab): quedará desfasado tras este PR; la regeneración es del lado lab. Ningún test exige su frescura (medido: 0 menciones en test_web.py y tests/).

## 4 · Correcciones de estado aplicadas en este PR

- CITATION.cff: «a game … in nine languages» pasa a «an open world … in English» (la matriz de idiomas se retiró con el corte D de theGame).
- tablero-nodata-20261108 e indice-territorios-ste-20261108: N2, N3, N4 y N7 servidas, con PR y merge exactos: #738 (3a83bccf), #739 (ac37a62c), #742 (24365369), #737 (1f667006); fusionadas el 8-nov. N5 y N6 pierden su prerrequisito y siguen abiertas.

## 5 · Enlaces a repos activos: sin cambio

app (preceptoros-app), web, lab, companion, mesa pública, mesa privada, babel, p0x, profile, aduana; CineK es externo e intocable. Medidos en README y CONTRIBUTING: válidos.

## 6 · Consecuencias públicas del archivo (revisión de consolidación)

- El archivo conserva las URLs legibles pero de solo lectura: sin issues, PRs ni comentarios nuevos. buzon#19, buzon#30 y buzon#53 reciben tráfico diario: necesitan sucesor con custodia ANTES del archivo.
- No hay enlaces medidos a releases ni a GitHub Pages de los repos plegables (medido en las 23 superficies).
- Índices de máquina: ai-index.json (deriva declarada, §3); mcp-manifest.json y DEPRECATED.json limpios (medido); llms.txt raíz y servido fuera de alcance (gemelos).
- CONTRIBUTING.md no depende de repos privados (medido).

## 7 · NO_DATA

- Consumidores de los archivos de duelos retirados más allá de gate.yml y DEPRECATED.json: sin medir (la búsqueda de código no indexa el repo).
- CI de los PR #794 y #795: sin tocar (protegidos por comisión).
- Tests no corridos aquí: sin runtime local; 0 B de public/ cambiados, así que las reglas de test_web.py sobre lo servido no cambian.

Agent: preceptor-web · Model: GLM (Vibe) · Run: NO_DATA
