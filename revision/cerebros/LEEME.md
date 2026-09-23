# cerebros-<l>.json · candidatos para revisión nativa (NO publicados)

Traducidos el 2026-09-24 por `qwen2.5:14b` en el rack
(`~/p0x/hexelion/laboratorio/traduce_familia.py`), a través de la frontera MCP
y con la salida acotada por esquema. Cada texto pasó reglas deterministas:
marcadores, cifras, longitud, alfabeto y ni inglés colado ni igual al original.
Lo que no pasó quedó `NO_DATA · traducción descartada: <motivo>`.

| lengua | traducidos | NO_DATA | bytes (indentado) |
|---|---|---|---|
| fr | 68 | 2 | 11.537 |
| pt | 69 | 1 | 10.761 |
| it | 68 | 2 | 10.724 |
| de | 70 | 0 | 12.229 |
| ru | 68 | 2 | 16.753 |
| el | 68 | 2 | 19.106 |
| ar | 63 | 7 | 13.952 |

**Por qué no están en `public/`.** `cerebros.json › prosa_pendiente` declara estas
siete lenguas y fija la condición para publicarlas: una traducción revisada por
nativo. Las reglas prueban la forma, no la voz; el 2026-09-19 un 7B dio 21/21
válidas y 3 impublicables.

**Antes de publicar una:**
1. Que la lea alguien con oído nativo.
2. Que quepa en el tope. En JSON compacto, ru ocupa 15.984 B y cabe; **el ocupa
   18.337 B y no cabe**, ni siquiera sin la `nota` (17.781 B). Hay que partir la
   familia por asunto, porque recortar no es la regla de la casa.
3. Quitarla de `prosa_pendiente` en `cerebros.json` y de `HUECOS_DECLARADOS` en
   `test_web.py`, y sellar.
