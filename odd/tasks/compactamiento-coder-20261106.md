# odd · compactamiento-coder-web-20261106

## Pieza
Compactamiento de preceptoros-coder → preceptoros-web. Decreto del Soberano: «ejecutar el compactamiento de las repos dobles, y meter unas en otras que sean coherentes, para tener un menor número». Dictamen de la pluma gemela (mesa-github, sesión cerrada ·6649113603): preceptoros-coder DOBLE → preceptoros-web. 1 pieza = 1 PR.

## SCRUB medido antes de compactar (nada se pierde)
- preceptoros-coder es un fork COMPLETO del sitio viejo (censado por API, raíz íntegra): atlas/ · public/ · traducciones/ · test_web.py · arnes_sw.mjs · wrangler.jsonc · bin/ · config/ · data/ · docs/ · herramientas/ · opiniones/ · partidas/ · revision/ · contadores.py · hreflang.py · humo_lenguas.py · nav.py · sitemap.py · traducciones.py.
- Su promesa está VENCIDA frente a la madurez de este repo: 8 idiomas y techo de 16 KB (medidos en su AGENTS.md) vs los 9 idiomas y 25 MiB de hoy (main a0e003bc). El gemelo midió además README/cierres por API.
- Vivo único del repo, PRESERVADO ÍNTEGRO por el archivo:
  (a) odd/tasks/retiro-md-agentes-coder.md — registro de la pieza coder#1 (FIRMA buzon#30 ·6648765900, cabeza exacta 35e9e60e, merged squash 45b70e02);
  (b) AGENTS.md — contrato único adaptado (las doctrinas del ecosistema viven también en el AGENTS.md de este repo);
  (c) .claude/launch.json — config de herramienta.
- ARCHIVO ≠ borrado: el archivo del repo preserva contenido e historia completos, legibles para siempre. Cero pérdida de valor; el repo sale del censo activo (17 → 16).

## Ejecución
- Este PR: mapa del ecosistema actualizado (línea «Compacted into this repository») + este registro en odd/tasks/. Docs-only: 2 ficheros, sin tocar código, páginas ni tests.
- Manos del Soberano (mañana, reversible con unarchive): gh repo archive piskyRpapalo/preceptoros-coder --yes
- La casa de codex HOY es p0x (comisión buzon#30 ·6648741199: daemon + cola); coder era su casa vieja.

## Verificación
- Anti-dup: reclamo de la guardia extendida buzon#53 ·6649748481 + dictamen DOBLE del gemelo; 0 PRs de compactamiento en web antes de esta (medido).
- Standing: «firmo todo» (buzon#30) + concesión de la noche «te concedo mi firma» + «firmo tus optimizaciones».

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA