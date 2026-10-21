import importlib.util
import ast
import json
import pathlib
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("mcp_preceptoros", ROOT / "bin" / "mcp_preceptoros.py")
MODULE = importlib.util.module_from_spec(SPEC)
if SPEC.loader:
    SPEC.loader.exec_module(MODULE)


class McpBridgeTests(unittest.TestCase):
    def test_piece_budget_and_no_network_imports(self):
        source = (ROOT / "bin" / "mcp_preceptoros.py").read_bytes()
        self.assertLess(len(source), 16384)
        imported = {alias.name.split(".")[0] for node in ast.walk(ast.parse(source.decode("utf-8")))
                    if isinstance(node, ast.Import) for alias in node.names}
        imported.update(alias.name.split(".")[0] for node in ast.walk(ast.parse(source.decode("utf-8")))
                        if isinstance(node, ast.ImportFrom))
        self.assertFalse(imported & {"socket", "urllib", "http", "requests"})

    def test_initialize_then_list_exposes_fixed_tools(self):
        server = MODULE.Server(ROOT)
        init = server.dispatch({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
        self.assertEqual(init["result"]["protocolVersion"], "2025-11-25")
        self.assertIsNone(server.dispatch({"jsonrpc": "2.0", "method": "notifications/initialized"}))
        result = server.dispatch({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        self.assertEqual([x["name"] for x in result["result"]["tools"]], MODULE.TOOL_NAMES)

    def test_rejects_tool_call_before_handshake(self):
        server = MODULE.Server(ROOT)
        response = server.dispatch({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
        self.assertEqual(response["error"]["code"], -32002)

    def test_bubble_frame_under_limit_is_measured(self):
        frame = {"v": "preceptoros.bubble/1", "id": "RIFT", "atoms": [], "sound": "NO_DATA"}
        result = MODULE.call_tool(ROOT, "web.validate_bubble", {"frame": frame})
        self.assertEqual(result["state"], "LIVE")
        self.assertLess(result["bytes"], 1024)
        self.assertEqual(result["sound"], "NO_DATA")

    def test_sabotage_exact_limit_is_rejected(self):
        frame = {"v": "preceptoros.bubble/1", "id": "RIFT", "atoms": [], "sound": ""}
        frame["sound"] = "x" * (1024 - len(MODULE.encode(frame).encode("utf-8")))
        self.assertEqual(len(MODULE.encode(frame).encode("utf-8")), 1024)
        with self.assertRaises(MODULE.ToolFailure):
            MODULE.call_tool(ROOT, "web.validate_bubble", {"frame": frame})

    def test_sabotage_wrong_frame_schema_is_rejected(self):
        with self.assertRaises(MODULE.ToolFailure):
            MODULE.call_tool(ROOT, "web.validate_bubble", {"frame": {"v": "wrong", "id": "RIFT", "atoms": []}})

    def test_wave_math_is_finite_and_bounded(self):
        result = MODULE.call_tool(ROOT, "web.check_wave_math", {"harmonics": [[1, 24, 24, 0], [2, 3, 4, 16]]})
        self.assertEqual(result["state"], "MEASURED")
        self.assertEqual(result["samples"], 720)
        with self.assertRaises(MODULE.ToolFailure):
            MODULE.call_tool(ROOT, "web.check_wave_math", {"harmonics": [[1, 1, float("inf"), 0]]})

    def test_detuning_uses_radio_formula_and_rejects_mismatch(self):
        expected = MODULE.radio_hz(2, 1)
        self.assertEqual(MODULE.call_tool(ROOT, "web.check_detuning", {"grade": 2, "octave": 1, "observed_hz": expected})["state"], "LIVE")
        result = MODULE.call_tool(ROOT, "web.check_detuning", {"grade": 2, "octave": 1, "observed_hz": expected + 1})
        self.assertEqual(result["state"], "ERROR")

    def test_manifest_has_equal_public_copy(self):
        result = MODULE.call_tool(ROOT, "web.manifest_status", {})
        self.assertIn(result["state"], ("LIVE", "NO_DATA"))
        self.assertEqual(len(result["sha256"]), 64)

    def test_app_state_does_not_read_unconfigured_storage(self):
        with patch.dict(MODULE.os.environ, {}, clear=True):
            result = MODULE.call_tool(ROOT, "app.read_state", {})
        self.assertEqual(result["state"], "NO_DATA")
        self.assertTrue(result["cause"])

    def test_receipt_is_canonical_and_below_limit(self):
        result = MODULE.call_tool(ROOT, "receipt.emit", {"state": "LIVE", "code": "ok", "count": 1, "sha256": "a" * 64})
        self.assertLess(result["bytes"], 1024)
        self.assertEqual(json.loads(result["receipt"])["state"], "LIVE")
        with self.assertRaises(MODULE.ToolFailure):
            MODULE.call_tool(ROOT, "receipt.emit", {"state": "MAYBE", "code": "x", "count": 0, "sha256": "a" * 64})
        with self.assertRaises(MODULE.ToolFailure):
            MODULE.call_tool(ROOT, "receipt.emit", {"state": "NO_DATA", "code": "missing", "count": 0, "sha256": "a" * 64})
        result = MODULE.call_tool(ROOT, "receipt.emit", {"state": "NO_DATA", "code": "missing", "count": 0,
                                                           "sha256": "a" * 64, "cause": "source unavailable"})
        self.assertLess(result["bytes"], 1024)

    def test_gate_runner_uses_allowlisted_commands_without_shell(self):
        seen = []

        class Done:
            returncode = 0
            stderr = ""

        def fake_run(args, **kwargs):
            seen.append((args, kwargs))
            result = Done()
            if "test_web.py" in args:
                result.stdout = "Ran 78 tests in 1s\nOK (skipped=1)"
            elif "arnes_sw.mjs" in args:
                result.stdout = "22/22 en verde"
            else:
                result.stdout = '{"gzip_initial_b":90000}'
            return result

        with patch.object(MODULE.subprocess, "run", side_effect=fake_run):
            result = MODULE.call_tool(ROOT, "web.run_gates", {})
        self.assertEqual(result["state"], "LIVE")
        self.assertTrue(seen)
        self.assertTrue(all(x[1].get("shell") is False for x in seen))

    def test_protocol_invalid_json_and_unknown_method(self):
        server = MODULE.Server(ROOT)
        self.assertEqual(server.parse_line("{")["error"]["code"], -32700)
        response = server.dispatch({"jsonrpc": "2.0", "id": "x", "method": "unknown"})
        self.assertEqual(response["error"]["code"], -32601)

    def test_stdio_round_trip_uses_only_json_lines(self):
        request = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "app.read_state", "arguments": {}}},
        ]
        proc = subprocess.run([sys.executable, str(ROOT / "bin" / "mcp_preceptoros.py")],
                              input="\n".join(json.dumps(x) for x in request) + "\n",
                              capture_output=True, text=True, timeout=5, check=True)
        rows = [json.loads(line) for line in proc.stdout.splitlines()]
        self.assertEqual([row["id"] for row in rows], [1, 2, 3])
        self.assertEqual(rows[2]["result"]["structuredContent"]["state"], "NO_DATA")


if __name__ == "__main__":
    unittest.main()
