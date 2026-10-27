# F3 · demolición visual, bloques 1 y 2 · 2026-10-10 · Claude (Opus 5.5)
Sello: MEDIDO · rama claude/web-solo-juego · frontera `frontera-pre-demolicion-20261010` = 7fc2057 · b5bcb99 (bloque 1) + 335f34d (bloque 2) · sin push.
1. Reversión probada antes de demoler: el ensayo 18d34e2 dejó 37 imágenes; `reset --hard` a la frontera devolvió las 129 con diff vacío, test_web OK y arnes 24/24. Después, cherry-pick a la rama real.
2. Bloque 1 · 92 huérfanos del censo (punto 3): gif, 9 busto-*, 6 icono-*, 2 icon-app-512*, 74 de caras/. Cero tests enmendados. ← firma F2-5 (2026-10-10). Esas piezas venían de la landing y la cara de agosto (ba06f73, 9a637c6).
3. Bloque 2 · láminas ×5 ← F2-6. Su test exigía «exactamente 5» sin que nada las pintara; nacieron en 9a637c6 (2026-08-27, lore de las salas).
4. Bloque 2 · banderas ×3 ← F2-6. Nacieron en c54b606 (2026-09-08, «la bandera del país junto al logo»). El test ahora exige que no vuelvan, y conserva la regla «el país se nombra por lengua».
5. Bloque 2 · despierta/habla ← F2-6 (ba06f73, 2026-08-27). El sprite pixel-art ← F2-7: supera la firma del 2026-09-25 «EL GUIA ES PRECEPTOR EN PIXEL ART» (0be0322; citada en atlas-dialogo.js:8, que ahora cuenta las dos firmas).
6. Lo que sustituye al sprite (F2-1 identidad + F2-2 semilla): atlas-dialogo.js dibuja en un canvas la onda del emblema `atlas.emblema/1:preceptoros.org`, que da [[1,24,24,0],[-1,9,8,17],[5,8,9,55]]. Las celdas habla, revelar y alerta repintan la misma onda. test_atlas recalcula el espectro con el motor. 16.184 B.
7. Doctrina de fondo: «los personajes son ondas… No hay imágenes» (CLAUDE.md del juego:7) y orden de identidad F132 / demolición F133 del documento de estado.
8. Gates: test_web OK (180) · arnes_sw 24/24 · motor 48 · piloto 20 · gacha 21 · opinion 7 · mp 49 · cria 12 · duelo 8 · test_atlas 94/95 (indexedDB, deuda previa) · `node --check` OK.
9. Peso: imágenes 3.476.763 → 896.760 B. Puerta gzip_juego_b 148.418 → 79.615 B (el sprite era casi la mitad).
10. Desvíos declarados: mundo.py deja de pesar el sprite (lista, no techo) · coherencia-publica.py se corrió importado contra el worktree (portadas 182→180).
11. NO_DATA: pruebas de la app. El gate del MVP está en ROJO (test_pwa) por trabajo ajeno sin commitear en ~/p0x/preceptor (CSS movido a legacy/). No lo toqué. La portada aún dice 924 y counters dice NO_DATA.
12. Quedan en la propuesta 16 entradas: 8 torre/ y 2 secuencia-256 (en uso por patrón), 3 secuencia-180 (las comparte la app), 1 sha256 de descarga, 2 de lore. Ninguna es huérfana real.
13. Siguiente: bloque 3 (F2-8, favicon, og:image e iconos PWA desde el emblema) y la capa visual referenciada (CSS, caras en uso, mármol), que pide su propia lista firmada.
Coste: ~120 k tokens de sesión en esta ronda · delegadas 2 (auditoría, bench) / hechas por Opus 9 · tiempo de fase ~1 h.
