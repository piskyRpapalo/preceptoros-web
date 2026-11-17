# App Release Contract — Especificación

**Fecha:** 2026-11-16  
**Autor:** Junie  
**Estado:** Contrato puro + 74 pruebas, listo para que Codex construya la implementación

---

## Propósito

Definir un contrato mínimo de actualización segura para la APP PreceptorOS que compruebe:

1. Identidad del producto que se instala.
2. Versión publicada y versión instalada.
3. Digest del artefacto.
4. Procedencia de la release.
5. Compatibilidad con la instalación existente.
6. Conservación de memoria y configuración local.
7. Rechazo de actualizaciones alteradas.
8. Posibilidad de recuperación si la actualización falla.
9. Información accesible para personas ciegas.
10. Estado `NO_DATA` cuando no existe una release verificada.

## Regla fundamental

El botón «Update PreceptorOS» debe actualizar la **APP**, no la PWA de OpenWorld.  
La web no puede afirmar conocer la versión instalada de una aplicación de escritorio sin una fuente autorizada.

## Esquema

```
{
  "schema": "preceptoros.app-release/1",
  "product_id": "PreceptorOS",
  "version": "v1.4",
  "via": "release",
  "ref": "v1.4",
  "digest": "<SHA-256 hex>",
  "files": [
    { "fichero": "interface/app.css", "sha256": "...", "bytes": 1024 }
  ]
}
```

## Decisiones

- **R1:** `via` solo acepta `raw` o `release`. `edge` no está publicado.
- **R2:** El downgrade no está permitido. Si la versión instalada es mayor, se rechaza.
- **R3:** El manifiesto no puede incluir archivos de memoria (`memory.db`, `estado.json`, `.preceptoros/`).
- **R4:** Sin firma válida, la actualización se rechaza.
- **R5:** La versión antigua permanece hasta que la nueva pase todos los checks de digest.
- **R6:** La web no puede reclamar la versión del escritorio sin que la app lo reporte.
- **R7:** `NO_DATA` con causa cuando no hay release verificada, nunca se inventa una.

## Archivos

| Archivo | Líneas | Tests | Descripción |
|---------|--------|-------|-------------|
| `atlas/puros/app_release_contract.js` | 461 | — | Contrato puro |
| `atlas/app_release_cases.mjs` | 592 | 74 | Pruebas de las 10 áreas + sabotajes |

## Integración con Codex

Codex puede consumir `createUpdateContract(installed, manifest, signature, trustedKey)` como punto de entrada único. Devuelve un objeto con 10 checks individuales y un `overall.ok` que resume si la actualización puede proceder.
