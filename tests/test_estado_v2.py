"""Pruebas del escritor de estado v2 (bin/estado_v2.py). El estado del mapa solo lleva lo que tiene evidencia."""
import copy
import importlib.util
import pathlib
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("estado_v2", RAIZ / "bin" / "estado_v2.py")
E = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(E)

BASE = {
    "esquema": "preceptoros.nodes-evidencia/1",
    "nodos": [{"id": "cabin", "q": -1, "r": 0, "alive": True, "seal": "LIVE", "since": "2026-10-30",
               "look": "basic", "evidence": "medido"}],
    "edificios": [{"id": "b1", "node": "cabin"}],
}


class EstadoV2(unittest.TestCase):
    def test_un_nodo_con_evidencia_entra(self):
        out = E.construye(copy.deepcopy(BASE))
        self.assertEqual(out["esquema"], "preceptoros.openworld-estado/2")
        self.assertEqual([n["id"] for n in out["colonia"]["nodes"]], ["cabin"])

    def test_sin_evidencia_no_entra(self):
        f = copy.deepcopy(BASE); f["nodos"][0]["evidence"] = "   "
        with self.assertRaises(SystemExit):
            E.construye(f)

    def test_live_sin_fecha_se_rechaza(self):
        f = copy.deepcopy(BASE); f["nodos"][0]["since"] = None
        with self.assertRaises(SystemExit):
            E.construye(f)

    def test_sello_fuera_de_las_seis_se_rechaza(self):
        f = copy.deepcopy(BASE); f["nodos"][0]["seal"] = "PROBABLE"
        with self.assertRaises(SystemExit):
            E.construye(f)

    def test_edificio_sobre_nodo_ausente_se_rechaza(self):
        f = copy.deepcopy(BASE); f["edificios"] = [{"id": "b2", "node": "ghost"}]
        with self.assertRaises(SystemExit):
            E.construye(f)

    def test_salida_determinista(self):
        a = E.construye(copy.deepcopy(BASE)); b = E.construye(copy.deepcopy(BASE))
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
