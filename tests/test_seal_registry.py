"""Pruebas del registro de sellos (bin/seal_registry.py). Todo en temporales: no toca el repo real."""
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("seal_registry", RAIZ / "bin" / "seal_registry.py")
S = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(S)

ID = "preceptoros:seal-registry/1"


def v(letra):
    return "preceptoros-2026-25-" + letra


def doc(top, reserved=()):
    return {"$id": ID, "consumed_top": v(top) if top else None,
            "reserved": [{"version": v(x), "by": b, "cause": "c"} for x, b in reserved]}


def git(cwd, *args):
    return subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@example.com", *args], cwd=cwd,
                          check=True, capture_output=True, text=True).stdout


class Registro(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = pathlib.Path(self.tmp.name)
        self.reg = self.dir / "reg.json"

    def tearDown(self):
        self.tmp.cleanup()

    def escribir(self, d):
        S.save(d, self.reg)

    def test_next_salta_reservadas(self):
        d = doc("fq", [("fr", "Mesa"), ("fs", "Mesa")])
        self.assertEqual(S.next_free(d, v("fq")), v("ft"))
        self.assertEqual(S.next_free(doc("fq"), v("fq")), v("fr"))

    def test_next_tras_z_da_aa(self):
        self.assertEqual(S.next_free(doc("z"), v("z")), v("aa"))

    def test_reserve_rechaza_duplicado_y_causa_vacia(self):
        self.escribir(doc("fq", [("fd", "Mesa")]))
        with self.assertRaises(ValueError):
            S.reserve(v("fd"), "Mesa", "otra", root=self.dir, reg=self.reg)
        with self.assertRaises(ValueError):
            S.reserve(v("fk"), "Mesa", "  ", root=self.dir, reg=self.reg)
        with self.assertRaises(ValueError):
            S.reserve(v("fk"), "", "causa", root=self.dir, reg=self.reg)
        self.assertEqual(len(S.load(self.reg)["reserved"]), 1)

    def test_reserve_rechaza_consumida_sin_historial(self):
        self.escribir(doc("fq"))
        with self.assertRaises(ValueError):
            S.reserve(v("fo"), "Mesa", "tarde", root=self.dir, reg=self.reg)

    def test_check_rojo_con_desorden(self):
        fails, _ = S.check(doc("fq", [("fe", "Mesa"), ("fd", "Mesa")]), v("fq"))
        self.assertIn("reserved_not_in_order", fails)
        fails, _ = S.check(doc("fq", [("fd", "Mesa"), ("fd", "Mesa")]), v("fq"))
        self.assertIn("reserved_duplicate", fails)
        bad = doc("fq")
        bad["$id"] = "otro"
        self.assertIn("schema", S.check(bad, v("fq"))[0])

    def test_check_aviso_si_la_servida_esta_reservada(self):
        fails, warns = S.check(doc("fq", [("fr", "Mesa")]), v("fr"))
        self.assertEqual(fails, [])
        self.assertEqual(warns, ["served version is reserved by Mesa"])

    def test_measure_sin_historial_no_toca_nada(self):
        self.escribir(doc("fq", [("fd", "Mesa")]))
        antes = self.reg.read_bytes()
        subprocess.run(["git", "init", "-q", str(self.dir)], check=True)
        self.assertEqual(S.measure(root=self.dir, reg=self.reg), "NO_DATA shallow_history")
        self.assertEqual(self.reg.read_bytes(), antes)

    def test_measure_con_historial_real_y_superficial(self):
        origen = self.dir / "origen"
        origen.mkdir()
        git(origen, "init", "-q")
        (origen / "public").mkdir()
        sw = origen / "public" / "sw.js"
        for letra in ["fo", "fp", "fq"]:
            sw.write_text("const VERSION = '%s';\n" % v(letra), encoding="utf-8")
            git(origen, "add", "-A")
            git(origen, "commit", "-q", "-m", letra)
        completo = self.dir / "completo"
        subprocess.run(["git", "clone", "-q", "file://" + str(origen), str(completo)], check=True)
        self.escribir(doc("fo", [("fp", "Mesa"), ("fz", "Mesa")]))
        self.assertIn("consumed_top=" + v("fq"), S.measure(root=completo, reg=self.reg))
        d = S.load(self.reg)
        self.assertEqual(d["consumed_top"], v("fq"))
        self.assertTrue(d["reserved"][0].get("consumed"))
        self.assertNotIn("consumed", d["reserved"][1])
        with self.assertRaises(ValueError):
            S.reserve(v("fp"), "Mesa", "tarde", root=completo, reg=self.reg)

        superficial = self.dir / "superficial"
        subprocess.run(["git", "clone", "-q", "--depth", "1", "file://" + str(origen), str(superficial)], check=True)
        antes = self.reg.read_bytes()
        self.assertEqual(S.measure(root=superficial, reg=self.reg), "NO_DATA shallow_history")
        self.assertEqual(self.reg.read_bytes(), antes)


if __name__ == "__main__":
    unittest.main()
