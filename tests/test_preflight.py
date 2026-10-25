"""bin/preflight.py reads the CI battery FROM the workflows: it cannot drift from CI (X6, 2026-10-26)."""
import importlib.util
import pathlib
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("preflight", RAIZ / "bin" / "preflight.py")
P = importlib.util.module_from_spec(spec)
spec.loader.exec_module(P)


class Preflight(unittest.TestCase):
    def test_runs_every_gate_step_and_the_phase_gate(self):
        todos = "\n".join(s for _, s in P.plan(False))
        for orden in ("node atlas/phase_gate.mjs", "python test_web.py", "node arnes_sw.mjs",
                      "node atlas/todos_los_casos.mjs", "node atlas/version_sw_casos.mjs"):
            with self.subTest(orden=orden):
                self.assertIn(orden, todos)

    def test_frozen_map_rule_measures_the_pr_range(self):
        todos = "\n".join(s for _, s in P.plan(False))
        self.assertIn("node atlas/version_sw_gate.mjs --base origin/main", todos)
        self.assertNotRegex(todos, r"node atlas/version_sw_gate\.mjs\s*$")

    def test_installs_and_receipts_are_skipped(self):
        todos = "\n".join(s for _, s in P.plan(False))
        self.assertNotIn("pip install", todos)
        self.assertNotIn("GITHUB_STEP_SUMMARY", todos)

    def test_ci_runs_two_passes_rapido_one(self):
        self.assertEqual(len(P.plan(False)), 3)
        self.assertRegex("\n".join(s for _, s in P.plan(False)), r"for pasada in 1 2; do")
        rapido = "\n".join(s for _, s in P.plan(True))
        self.assertNotRegex(rapido, r"for \w+ in 1 2; do")

    def test_sabotage_a_step_dropped_from_the_plan_is_seen(self):
        original = P.pasos
        try:
            P.pasos = lambda flujo: [p for p in original(flujo) if "phase_gate" not in p[1]]
            self.assertNotIn("node atlas/phase_gate.mjs", "\n".join(s for _, s in P.plan(False)))
        finally:
            P.pasos = original


if __name__ == "__main__":
    unittest.main()
