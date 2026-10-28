"""Tools · pruebas del bloque de cerebros (decreto 1). Uso: python3 -m unittest atlas.test_tools_cerebros"""
import importlib.util
import json
import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("gen", RAIZ / "atlas" / "genera_tools_cerebros.py")
gen = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gen)


class BloqueCerebros(unittest.TestCase):
    def setUp(self):
        self.datos = json.loads((RAIZ / "public" / "cerebros.json").read_text(encoding="utf-8"))
        self.index = (RAIZ / "public" / "index.html").read_text(encoding="utf-8")
        self.bloque = re.search(r"<!-- cerebros:inicio -->.*?<!-- cerebros:fin -->", self.index, re.S).group(0)

    def test_un_articulo_por_modelo_del_fichero(self):
        self.assertEqual(self.bloque.count("<article"), len(self.datos["cerebros"]))
        for c in self.datos["cerebros"]:
            self.assertIn(f'id="cerebro-{c["id"]}"', self.bloque)

    def test_el_bloque_esta_al_dia_con_el_generador(self):
        self.assertEqual(gen.aplica(self.index, gen.bloque(self.datos)), self.index)

    def test_sin_enlaces_externos_ni_peticiones(self):
        self.assertNotIn("http", self.bloque)
        self.assertNotIn("<script", self.bloque)

    def test_los_medidos_llevan_su_marca_MEDIDO(self):
        self.assertIn("MEDIDO 2026-09-07", self.bloque)
        self.assertIn("MEDIDO 2026-09-23", self.bloque)

    def test_null_se_pinta_NO_DATA_con_causa(self):
        texto, marca = gen.valor_de({"prompt": None}, "prompt")
        self.assertEqual(texto, "NO_DATA")
        self.assertEqual(marca, "null en cerebros.json")

    def test_campo_ausente_se_pinta_NO_DATA_con_causa(self):
        texto, marca = gen.valor_de({}, "generacion")
        self.assertEqual(texto, "NO_DATA")
        self.assertEqual(marca, "campo ausente en cerebros.json")

    def test_bytes_en_GiB_con_dos_decimales(self):
        self.assertEqual(gen.valor_de({"bytes": 2**30}, "bytes")[0], "1.00")

    def test_un_modelo_sin_datos_no_rompe_el_bloque(self):
        d = {"contexto": 1, "backend": "x", "muestras": 1, "cerebros": [{"id": "vacio", "modelo": "x:1"}]}
        b = gen.bloque(d)
        self.assertEqual(b.count("NO_DATA"), len(gen.ETIQUETAS))


if __name__ == "__main__":
    unittest.main()
