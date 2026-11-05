"""Cases of bin/deploy_guard.py: the pure judge of the deploy (incident of 2026-11-02, buzon#30 ·6590360027).
Preceptor contract: study/05-contracts.md · PS: propose-only + seal."""
import importlib.util
import pathlib
import unittest

RUTA = pathlib.Path(__file__).resolve().parent.parent / "bin" / "deploy_guard.py"
spec = importlib.util.spec_from_file_location("deploy_guard", RUTA)
G = importlib.util.module_from_spec(spec)
spec.loader.exec_module(G)
A, B = "a" * 40, "b" * 40


class Juez(unittest.TestCase):
    def test_main_igual_a_origin_y_limpio_pasa(self):
        self.assertTrue(G.juzga({}, "main", A, A, [])[0])

    def test_el_incidente_de_esta_noche_se_corta(self):
        ok, motivo = G.juzga({}, "mistral/interior-army-20261020", A, B, [])
        self.assertFalse(ok)
        self.assertIn("no main", motivo)

    def test_main_atrasado_se_corta(self):
        ok, motivo = G.juzga({}, "main", A, B, [])
        self.assertFalse(ok)
        self.assertIn("pull --ff-only", motivo)

    def test_head_suelto_o_sin_red_se_corta(self):
        self.assertFalse(G.juzga({}, "", A, A, [])[0])
        self.assertFalse(G.juzga({}, "main", "", A, [])[0])
        self.assertFalse(G.juzga({}, "main", A, "", [])[0])

    def test_cambios_en_lo_servido_se_cortan(self):
        ok, motivo = G.juzga({}, "main", A, A, ["public/sw.js"])
        self.assertFalse(ok)
        self.assertIn("public/sw.js", motivo)

    def test_ci_solo_desde_main(self):
        self.assertTrue(G.juzga({"GITHUB_ACTIONS": "true", "GITHUB_REF": "refs/heads/main"}, "", "", "", [])[0])
        self.assertFalse(G.juzga({"GITHUB_ACTIONS": "true", "GITHUB_REF": "refs/heads/otra"}, "", "", "", [])[0])

    def test_la_excepcion_pasa_pero_se_dice(self):
        ok, motivo = G.juzga({"PRECEPTOROS_DEPLOY_EXCEPCION": "rollback a dq"}, "x", A, B, ["public/a"])
        self.assertTrue(ok)
        self.assertIn("EXCEPCIÓN DECLARADA: rollback a dq", motivo)
        self.assertFalse(G.juzga({"PRECEPTOROS_DEPLOY_EXCEPCION": "   "}, "x", A, B, [])[0])

    def test_wrangler_la_corre_antes_de_cada_deploy(self):
        conf = (RUTA.parent.parent / "wrangler.jsonc").read_text(encoding="utf-8")
        self.assertIn('"build": { "command": "python3 bin/deploy_guard.py" }', conf)


if __name__ == "__main__":
    unittest.main()
