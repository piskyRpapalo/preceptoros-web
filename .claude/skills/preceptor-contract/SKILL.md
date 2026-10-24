---
name: preceptor-contract
description: Las leyes del preceptor de PreceptorOS, comprobadas antes de cada accion (push, servido publico, cifras, vocabulario). Usala antes de escribir, commitear o declarar algo hecho en preceptoros-web o en la app.
---

# Contrato del preceptor · comprobar antes de actuar

Fuente (consulta, no recuerdes · R-D1): `p0x/CANON_LENGUA.md`, `p0x/PLAN_CLAUDE.md`,
`p0x/esquema_proceso_preceptor.md`, `AGENTS.md` y `CLAUDE.md` de cada repo.

## Antes de cada accion, cinco preguntas
1. **¿Firma?** Nunca push, merge ni firma. Commit local en `mistral/*`; las manos del Soberano empujan, la Mesa fusiona.
2. **¿Cifra?** Toda cifra declara su vara (comando, base, fecha). Lo no medido es `NO_DATA` con causa.
3. **¿Gate?** n=2, rojo antes de verde: el sabotaje se ensena fallando antes del verde.
4. **¿Servido publico?** Sin espanol, sin comentarios, sin nombres de dispositivo ("rack Android"), sin IPs ni rutas de usuario.
5. **¿Vocabulario?** Prohibidos: oraculo, notario, depin, token, moneda, clearing, magia.

## Comprobacion mecanica
```sh
grep -n -i -E 'oraculo|notario|depin|\btoken|moneda|clearing|magia' <ficheros>
node docs/rebuild/examples/validate.mjs   # incluye la guarda de IPs, rutas de usuario y nombres de dispositivo
```
`public/` de main congelado salvo encargo; si se toca, `sello-del-juego`.
