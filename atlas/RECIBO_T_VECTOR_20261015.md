# RECIBO · Vector de lectura del juego · 2026-10-15

**Sello:** `preceptoros-2026-17-abhb` · huella `ef8a35d17cd309a2`.

El vector `preceptoros.vector/1` valida su forma antes de salir. El límite mide
bytes UTF-8 del JSON final y exige menos de 1024 bytes; si el recorte de radio y
lugares no basta, la salida se cierra con `NO_DATA` y causa. Las lecturas que
fallan quedan aisladas con causa. El contrato ejecutable y el JSON Schema están
alineados por casos: forma completa aceptada; clave extra y datos sin causa
rechazados. El archivo de producción más grande del lote mide 15314 bytes,
bajo el tope de 16384. El esquema se queda en `data/`, fuera de `public/`.

**Gates, dos pasadas consecutivas:**

| Gate | Pasada 1 | Pasada 2 |
|---|---:|---:|
| `test_web.py` | 76; 1 salto declarado | 76; 1 salto declarado |
| `atlas/test_atlas.py` | 175 | 175 |
| `arnes_sw.mjs` | 22/22; 136 rutas | 22/22; 136 rutas |

**Medido:** sitio 1253950 bytes; juego inicial comprimido 90956 bytes;
Service Worker `preceptoros-2026-17-abhb`; huella `ef8a35d17cd309a2`. El arnés
de navegación cubre 136 rutas.

**NO_DATA:** comprensión de lectores externos y render físico en teléfono no
se midieron en este lote. Los casos del vector son sintéticos y verifican el
serializador, el límite y sus causas; no certifican comprensión ni una sesión
real de una persona.
