import importlib.util
from importlib.machinery import SourceFileLoader
import io
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "bin/capturar-bateria"
SPEC = importlib.util.spec_from_loader("capturar_bateria", SourceFileLoader("capturar_bateria", str(SCRIPT)))
CAPTURE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CAPTURE)


class Terminal:
    def __init__(self):
        self.buffer = io.BytesIO()


class BatteryCaptureTests(unittest.TestCase):
    def test_output_is_streamed_and_rotated_at_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            terminal = Terminal()
            with patch.object(CAPTURE.sys, "stdout", terminal):
                result = CAPTURE.ejecutar(
                    [sys.executable, "-c", "import sys;sys.stdout.buffer.write(bytes(range(25)))"],
                    root=Path(tmp), name="gate", max_bytes=8, rotations=2,
                )
            self.assertEqual(result, 0)
            self.assertEqual(terminal.buffer.getvalue(), bytes(range(25)))
            logs = [Path(tmp) / f"gate.log.{i}" for i in (2, 1)] + [Path(tmp) / "gate.log"]
            logs = [path for path in logs if path.exists()]
            self.assertLessEqual(len(logs), 3)
            self.assertTrue(all(path.stat().st_size <= 8 for path in logs))
            self.assertEqual(b"".join(path.read_bytes() for path in logs), bytes(range(8, 25)))
            self.assertTrue(all((path.stat().st_mode & 0o777) == 0o600 for path in logs))
            self.assertEqual(Path(tmp).stat().st_mode & 0o777, 0o700)

    def test_process_exit_status_is_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(CAPTURE.sys, "stdout", Terminal()):
                result = CAPTURE.ejecutar(
                    [sys.executable, "-c", "raise SystemExit(7)"],
                    root=Path(tmp), name="gate", max_bytes=8,
                )
            self.assertEqual(result, 7)

    def test_unsafe_label_is_rejected_before_launch(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, "unsafe log label"):
                CAPTURE.ejecutar(["/command/that/must/not/run"], root=Path(tmp), name="../escape")

    def test_oversized_existing_log_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, "gate.log").write_bytes(b"123456789")
            with self.assertRaisesRegex(ValueError, "exceeds"):
                CAPTURE.ejecutar(["/command/that/must/not/run"], root=Path(tmp), name="gate", max_bytes=8)

    def test_state_root_uses_xdg_and_falls_back_to_local_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(CAPTURE.state_root({"XDG_STATE_HOME": tmp}),
                             Path(tmp) / "preceptoros-web/batteries")
        self.assertEqual(CAPTURE.state_root({}), Path.home() / ".local/state/preceptoros-web/batteries")

    def test_cli_writes_under_xdg_and_preserves_stream(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = dict(os.environ, XDG_STATE_HOME=tmp)
            completed = __import__("subprocess").run(
                [str(ROOT / "bin/capturar-bateria"), "--name", "smoke", "--",
                 sys.executable, "-c", "print('bounded')"],
                check=False, capture_output=True, env=env, text=True,
            )
            self.assertEqual(completed.returncode, 0)
            self.assertEqual(completed.stdout, "bounded\n")
            log = Path(tmp, "preceptoros-web/batteries/smoke.log")
            self.assertEqual(log.read_text(), "bounded\n")


if __name__ == "__main__":
    unittest.main()
