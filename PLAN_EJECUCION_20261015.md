# PLAN AI FLUENCY · RATIFICADO · 15-oct-2026

Fuente de autoridad: ratificación del Soberano p0, 15-oct noche, en esta sesión.
Construcción M0–MVP autorizada. Cierre del MVP pendiente de FIRMO aparte.
Entrega inicial local. Orden posterior del Soberano: tras gates completos
verdes, commitear y empujar plan y M0 a origin; PR de M0 en borrador.
Sin push directo a main ni a jetson, sin tocar ramas mistral/*.

## Base y cola 1 EN 1

Base exacta: e01462ba260d3d18869eadc96129d62ddf052b24, merge #100.
Objetos recuperados por el conector GitHub ante fallo DNS de git fetch; bytes
de blobs, árboles y commits comprobados contra sus SHA Git originales.
Worktree separado; árbol ajeno y claude/refresco intactos.
Baseline MEDIDO sobre ese commit: 175 ficheros públicos versionados;
huella SW de 174 ficheros (excluye sw.js) = f0749dd815981ef6.
Coincide con config/sw-huella.txt, versión preceptoros-2026-17-abho.
#97 = 1f1d720; #98 = 13c0b7f. #100 añade manifiesto estático fuera de public/.

Orden actualizado por FIRMO posterior: reintentar ADB/TOUR y cerrar el commit
documental; M0 PRIMERO por requisito técnico; después WavesCraft y Transparency
Log con sus gates repetidos. #89 permanece abierto: prohibida su fusión
sin FPS físico y FIRMO. #99 se lee; no se modifica. Corrección posterior del
Soberano: medir Doogee desde el rack/scrcpy. Si Acurast está delante o la
medida no es posible, registrar NO_DATA con la causa observada y seguir.

Secuencia: M0 → WavesCraft → Transparency Log → M1 → L4a → L5a → L4b → L5b,
una pieza cada vez.
M0 compacta atlas-en.json sin cambiar su objeto. M1 limpia comentarios y
verifica la frontera de nombres públicos, conservando datos de rechazo.
L4a añade registro cerrado de decisiones; L5a práctica aislada; L4b evaluador;
L5b inicio voluntario e informe accesible. Cada ID tiene casos propios,
sabotaje rojo y recibo en PARA_LA_MESA.md antes de integrar.

## Métrica y matriz FIRMADAS

SIMULATED, motor real aislado; inputs humanos, escenarios sintéticos. Sin
modelos conectados ni IA fingida: propuestas de reglas/fixtures declaradas.
Generalización a modelos reales: NO_DATA, no se han ensayado.
20 episodios congelados: A1–A8 iniciales, P1–P4 guiados, B1–B8 finales.
Orden por evaluación: dos evidence use, dos uncertainty calibration, dos
human oversight, dos outcome verification. P usa un caso A por competencia,
con ayuda explícita y registrada. Sin ajustar dificultad ni umbral.

Con C = COBRE_REPARAR, A usa C y 2C; B usa C+1 y 2C+1, alcanzados por ciclos.
Evidence use: consultar fuente/ciclo y ensayo, elegir reparación adecuada,
comprobar coste y resultado. Uncertainty: recurso/ciclo ausente solo en la
observación; retener y solicitar observación, cero aplicaciones. Oversight:
bajar_a nucleo incompatible o propuesta del ciclo previo; rechazar/invalidar,
revisar estado vigente y decidir de nuevo. Outcome: recibo fiel/alterado
(cobre real+1), comparar resultado y replay, continuar/detener según igualdad.

F = 100 × m/8. Solo secuencias completas con resultado verificado puntúan.
Error = 0; clics repetidos/aperturas no suman. Abandono, instrumento fallido
o desbordamiento = NO_DATA con causa y avance x/8; denominador siempre 8.
Umbral: final ≥7/8, incertidumbre y supervisión 4/4, cero aplicaciones sin
decisión humana y cero efectos sobre la cuenta. Si inicial <7, mejora ≥2;
si inicial ≥7, mantener/superar, sin atribuir aprendizaje. Sin inferencia
poblacional ni causal. Actor humano no acredita humanidad.

MVP cerrado solo tras instrumento verde, ensayo con una persona, dos sesiones
humanas válidas presenciadas por el Soberano y FIRMO del cierre/entrega.
Hoy aprendizaje humano = NO_DATA: faltan esas sesiones. n=2 valida solamente
el instrumento. No se firman ni fabrican sesiones humanas.

## Contrato y aislamiento

preceptoros.fluency.event/1 cerrado: episodio/etapa, secuencia, ciclo,
actor humano/fixture, tipo, propuesta/acción, huellas de estado, resultado,
causa. Sin identidad, texto libre, hora ni datos interiores.
Secuencia: evidence_opened → proposal_reviewed → human_decided →
action_applied/withheld → outcome_checked → episode_closed. Cada decisión
vinculada a bytes JSON UTF-8 exactos de estado y contenido_v.
Memoria de pestaña, ≤400 eventos; desbordamiento invalida sin descarte.
Sin telemetría, autoguardado, recompensa ni envío. Evidencias por gesto
humano, por episodio <16 KiB.

Usar AtlasPartida.puro; jamás inicializar el motor envuelto, que vacía la
grabadora principal. Acciones con sin-dia; ciclos explícitos. Sin dormir,
Date ni temporizador como autoridad. Pestaña oculta pausa. Cuenta, claves,
almacenamiento y grabadora principal idénticos tras cada evaluación.

## Gates por pieza

Árbol público estabilizado y sellado; n=2 en el mismo árbol:
caso propio y sabotaje en memoria/copia; python3 test_web.py;
python3 atlas/test_atlas.py; node arnes_sw.mjs;
node atlas/sin_undefined.mjs; node atlas/phase_gate.mjs; higiene/diff.
Registrar phase en .github/workflows/phase.yml, sin reducir pruebas previas.
JS/CSS/JSON/HTML públicos y artefactos nuevos <16.384 B; vector <1024 B UTF-8;
carga inicial gzip <153.600 B incluyendo nuevas cargas iniciales.
Vanilla JS, sin build, LENGUAS=['en'], estáticos propios a demanda, cero red
nueva. D67: allowlist y canarios privados sintéticos excluidos. Nombres
vetados solo como datos de rechazo; no debilitar defensas.
Misma semilla/versión/estado/input = misma traza y resultado; cero reloj,
FOMO, premios por puntuar o castigo por salir.
Mouse, teclado, tacto, foco y ≥44 px; movimiento reducido; audio/voz local
inglesa tras gesto y equivalente textual. Capacidad ausente = NO_DATA.
Dos recorridos físicos mapa/combate 10×10 ≥58 fps pendientes: ADB no puede
crear su listener en este sandbox (Operation not permitted); estado de la
aplicación en primer plano = NO_DATA. Headless no sustituye esa medida.

Recibo: commit/árbol, fuentes/hashes, antes/después, comandos, recuentos/skips,
n=2 y sabotajes; MEDIDO solo observado, resto NO_DATA con causa. Sin cifras
APP nuevas. Cambios public/: sellar.py, contadores.py y mundo.py hasta
estabilizar. Conservar cifras ajenas. llms.txt se corrige al publicar, no antes.
Sin corredor APP ni bin/publica_pr.sh. PRs propios solo se fusionan con CI
doble verde, gates n=2 y recibo, bajo la delegación AUTÓNOMO HASTA EL MVP.

## Fuera de esta ronda

G1–G5 en cuarentena: #100 ya fusionado y G2 externo asignado a otra sesión.
No construir G, H ni F. Periodo 32 de F2 sigue REQUIERE_FIRMO. Audio al final.
No re-minar inspiraciones heredadas; ninguna copia de código/assets ajenos.
Sin ampliar idiomas, persistencia, entrenamiento, economía ni red. Sin push
a jetson; claude/refresco intacto.

Reporte de ronda: gastos CLI/modelos locales (NO_DATA si no hay contador
verificable), sugerencias y New_Naming_Proposal; sin inventar consumo.

## Recibo de arranque local · no integrado

Documento <16 KiB, preparado en la rama solicitada desde e01462b. El intento
de commit fue rechazado por el gancho pre-commit: test_ningun_enlace_interno_roto
necesita un socket y el sandbox devuelve Operation not permitted. Sin
--no-verify, sin alterar el gancho ni reducir pruebas. Commit documental
pendiente; no se declara entregado como commit.
Baseline: python3 test_web.py, 78 pruebas, 1 error de socket y 1 skip;
python3 atlas/test_atlas.py, 177/177; node arnes_sw.mjs, 22/22;
node atlas/sin_undefined.mjs, 0 pasos, puerto de depuración no disponible.
git fetch origin: DNS de github.com no disponible; recuperación exacta de
objetos por conector GitHub completada sin cambiar main ni origin/main.

TOUR: casos 11/11 ×2 en 3a64f9f; sello preceptoros-2026-17-abhj
y huella c43c361e44a78ee9 comprobados en seco. Recibo físico NO_DATA
registrado en la rama del TOUR; #89 no fusionado.
Primera micro-pieza WavesCraft preparada aparte en codex/wavescraft-name-20261015;
no integrada. Su JSON heredado aún supera 16 KiB; M0 resuelve el requisito
técnico antes de re-anidar y repetir gates de los renombres.
FIRMO posterior adelanta M0: preparado en rama separada desde e01462b;
WavesCraft no integrado y Transparency Log/M1/L4/L5 pendientes. G/H/F intactos.
llms.txt intacto, pendiente de publicación. El reintento previo de ADB y del
commit documental volvió a fallar por sockets denegados. No se anula el gancho.

Gastos CLI: NO_DATA, contador verificable no expuesto en esta sesión. Modelos
locales: no invocados; sin delegación. Sugerencia: reanudar los gates completos
en un contexto que permita sockets locales, conservando este árbol y los
ganchos. New_Naming_Proposal: ninguna ampliación; conservar los dos renombres
ya firmados y los nombres del MVP ratificados.

Reintento solicitado por el Soberano en esta sesión: ADB vuelve a fallar al
crear listener (Operation not permitted); gate web vuelve a fallar por socket
local (76 passed, 1 failed, 1 skipped en pytest del gancho); el gancho vuelve
a rechazar el commit documental. git fetch origin sigue sin resolver
DNS de github.com. No se omiten guardas ni se reclama cierre.

Orden posterior de accesos abiertos: reintento ejecutado. Esta sesión todavía
recibe Operation not permitted para listener ADB/socket local y fallo DNS de
git fetch. No se pudo conocer el foco ni acceder al teléfono. El Soberano
reporta desde su terminal web 78 OK (1 skip), Chrome 24 pasos sin fallos,
fase 159 ficheros/gzip 92.085 y caso M0 objeto igual. Se conserva como lectura
aportada por el Soberano: no se presenta como segunda pasada propia verde.
La pasada propia repite Atlas 177/177, SW 22/22, vector 8/8, M0 y fase verdes;
web y Chrome siguen bloqueados. El gancho vuelve a rechazar el commit.
Push de ambas ramas y PR borrador autorizados cuando se cumplan los gates;
fusión propia solo con CI doble ×2, n=2 y recibo. No se ejecutaron aún.

Triaje solicitado completado con tres subagentes de solo lectura. Informe
privado separado, sin publicar datos interiores ni modificar el árbol raíz.
Se contrastaron también heads GitHub de vector/audio/H/incubación; coinciden
con las referencias locales. Raíz sigue congelada, stash intacta y solo cuatro
prunable registrados; el quinto es NO_DATA. Destinos son propuestas sin FIRMO.
Consumo CLI/subagentes = NO_DATA por falta de contador; sin modelos locales.
