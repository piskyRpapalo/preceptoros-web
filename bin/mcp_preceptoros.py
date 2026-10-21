import hashlib
import json
import math
import os
import pathlib
import re
import subprocess
import sys

PROTOCOL = "2025-11-25"
FRAME_LIMIT = 1024
RECEIPT_LIMIT = 1024
PENTA = (0, 2, 4, 7, 9)
TOOL_NAMES = [
    "web.validate_bubble",
    "web.check_wave_math",
    "web.check_detuning",
    "web.run_gates",
    "web.manifest_status",
    "app.read_state",
    "rack.sensors",
    "receipt.emit",
]


class ToolFailure(Exception):
    pass


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def require_keys(args, required):
    if not isinstance(args, dict) or set(args) != set(required):
        raise ToolFailure("arguments do not match the closed input shape")


def radio_hz(grade, octave):
    if type(grade) is not int or type(octave) is not int or not 0 <= grade <= 4 or not 0 <= octave <= 2:
        raise ToolFailure("grade or octave outside the measured radio range")
    return round(220 * (2 ** (octave + PENTA[grade] / 12)), 2)


def validate_bubble(args):
    require_keys(args, ("frame",))
    frame = args["frame"]
    if not isinstance(frame, dict):
        raise ToolFailure("frame must be an object")
    raw = encode(frame).encode("utf-8")
    if len(raw) >= FRAME_LIMIT:
        raise ToolFailure("frame must be below 1,024 UTF-8 bytes")
    if frame.get("v") != "preceptoros.bubble/1" or not isinstance(frame.get("id"), str) or not frame["id"]:
        raise ToolFailure("frame schema or id is unsupported")
    atoms = frame.get("atoms")
    if not isinstance(atoms, list) or len(atoms) > 64:
        raise ToolFailure("atoms must be a bounded list")
    for atom in atoms:
        if not isinstance(atom, dict) or not isinstance(atom.get("k"), str) or not isinstance(atom.get("i"), list):
            raise ToolFailure("atom shape is invalid")
        for item in atom["i"]:
            if not isinstance(item, dict) or not isinstance(item.get("o"), str):
                raise ToolFailure("item shape is invalid")
    bands = frame.get("bands", [])
    if not isinstance(bands, list) or any(not isinstance(x, str) for x in bands):
        raise ToolFailure("bands must be named strings")
    sound = frame.get("sound")
    sound_ok = isinstance(sound, str) and bool(sound) and sound != "NO_DATA"
    cause = None if sound_ok else "frame sound is not measured"
    return {"state": "LIVE", "bytes": len(raw), "objects": sum(len(a["i"]) for a in atoms),
            "bands": len(bands), "sound": "LIVE" if sound_ok else "NO_DATA", "cause": cause}


def check_wave_math(args):
    require_keys(args, ("harmonics",))
    rows = args["harmonics"]
    if not isinstance(rows, list) or not rows or len(rows) > 64:
        raise ToolFailure("harmonics must contain 1 to 64 rows")
    for row in rows:
        if not isinstance(row, list) or len(row) != 4 or any(type(x) is not int for x in row):
            raise ToolFailure("each harmonic must be four integers")
        if row[0] == 0 or not 0 <= row[3] < 64:
            raise ToolFailure("harmonic index or phase outside contract")
    peak = 0.0
    for sample in range(720):
        angle = sample * math.tau / 720
        x = sum(ax * math.cos(k * angle + phase * math.pi / 32) for k, ax, _, phase in rows)
        y = sum(ay * math.sin(k * angle + phase * math.pi / 32) for k, _, ay, phase in rows)
        peak = max(peak, math.hypot(x, y))
    return {"state": "MEASURED", "samples": 720, "peak_radius": round(peak, 6), "harmonics": len(rows)}


def check_detuning(args):
    require_keys(args, ("grade", "octave", "observed_hz"))
    expected = radio_hz(args["grade"], args["octave"])
    observed = args["observed_hz"]
    if type(observed) not in (int, float) or not math.isfinite(observed):
        raise ToolFailure("observed_hz must be finite")
    measured = round(float(observed), 2)
    return {"state": "LIVE" if measured == expected else "ERROR", "expected_hz": expected,
            "observed_hz": measured, "cause": None if measured == expected else "radio frequency differs after cent rounding"}


def run_gates(root, args):
    require_keys(args, ())
    commands = [
        ("test_web", [sys.executable, "test_web.py"], re.compile(r"Ran (\d+) tests")),
        ("service_worker", ["node", "arnes_sw.mjs"], re.compile(r"(\d+)/(\d+)")),
        ("initial_gzip", ["node", "atlas/phase_gate.mjs"], re.compile(r'"gzip_initial_b":(\d+)')),
    ]
    rows = []
    for name, command, pattern in commands:
        try:
            result = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=120, shell=False,
                                    env={**os.environ, "NO_PROXY": "*", "no_proxy": "*"})
            match = pattern.search(result.stdout + "\n" + result.stderr)
            measure = match.group(0) if match else "NO_DATA"
            within = name != "initial_gzip" or (match is not None and int(match.group(1)) < 153600)
            state = "LIVE" if result.returncode == 0 and match is not None and within else "ERROR"
            cause = None if state == "LIVE" else "fixed gate failed or its measure was absent"
            rows.append({"gate": name, "state": state, "measure": measure, "cause": cause})
        except (OSError, subprocess.TimeoutExpired):
            rows.append({"gate": name, "state": "NO_DATA", "measure": "NO_DATA", "cause": "gate process unavailable or timed out"})
    states = {row["state"] for row in rows}
    state = "ERROR" if "ERROR" in states else "NO_DATA" if "NO_DATA" in states else "LIVE"
    return {"state": state, "gates": rows,
            "cause": None if state == "LIVE" else "one or more fixed local gates failed or were unavailable"}


def manifest_status(root, args):
    require_keys(args, ())
    paths = (root / "mcp-manifest.json", root / "public" / "mcp-manifest.json")
    try:
        data = [p.read_bytes() for p in paths]
    except OSError:
        return {"state": "NO_DATA", "bytes": None, "sha256": None, "copies_equal": False,
                "cause": "static manifest copy unavailable"}
    digest = hashlib.sha256(data[0]).hexdigest()
    same = data[0] == data[1]
    try:
        parsed = json.loads(data[0])
        valid = isinstance(parsed, dict) and isinstance(parsed.get("actions"), list)
    except (ValueError, UnicodeDecodeError):
        valid = False
    return {"state": "LIVE" if same and valid else "ERROR", "bytes": len(data[0]),
            "sha256": digest, "copies_equal": same,
            "cause": None if same and valid else "manifest copies differ or static inventory is invalid"}


def app_read_state(args):
    require_keys(args, ())
    return {"state": "NO_DATA", "cause": "no approved local state adapter is configured; network access is disabled"}


def rack_sensors(args):
    require_keys(args, ())
    paths = sorted(pathlib.Path("/sys/class/thermal").glob("thermal_zone*/temp"))
    values = []
    for path in paths:
        try:
            raw = path.read_text(encoding="ascii").strip()
            if raw.isdigit():
                values.append({"sensor": "thermal", "millidegrees_c": int(raw)})
        except OSError:
            continue
    if not values:
        return {"state": "NO_DATA", "sensors": [], "cause": "no readable thermal sensor exposed in sysfs"}
    return {"state": "LIVE", "sensors": values, "cause": None}


def emit_receipt(args):
    if not isinstance(args, dict) or set(args) not in ({"state", "code", "count", "sha256"},
                                                       {"state", "code", "count", "sha256", "cause"}):
        raise ToolFailure("arguments do not match the closed receipt shape")
    if args["state"] not in ("LIVE", "NO_DATA"):
        raise ToolFailure("receipt state is outside the manifest vocabulary")
    if not isinstance(args["code"], str) or not re.fullmatch(r"[a-z0-9_-]{1,24}", args["code"]):
        raise ToolFailure("receipt code is invalid")
    if type(args["count"]) is not int or args["count"] < 0:
        raise ToolFailure("receipt count must be a nonnegative integer")
    if not isinstance(args["sha256"], str) or not re.fullmatch(r"[0-9a-f]{64}", args["sha256"]):
        raise ToolFailure("receipt digest must be lowercase SHA-256")
    cause = args.get("cause")
    if args["state"] == "NO_DATA" and (not isinstance(cause, str) or not re.fullmatch(r"[a-z0-9 _-]{1,96}", cause)):
        raise ToolFailure("NO_DATA receipt requires a bounded cause")
    if args["state"] == "LIVE" and cause is not None:
        raise ToolFailure("LIVE receipt cannot carry a cause")
    receipt = {"state": args["state"], "code": args["code"], "count": args["count"], "sha256": args["sha256"]}
    if cause is not None:
        receipt["cause"] = cause
    raw = encode(receipt).encode("utf-8")
    if len(raw) >= RECEIPT_LIMIT:
        raise ToolFailure("receipt must be below 1,024 UTF-8 bytes")
    return {"receipt": raw.decode("utf-8"), "bytes": len(raw)}


def call_tool(root, name, args):
    handlers = {
        "web.validate_bubble": validate_bubble,
        "web.check_wave_math": check_wave_math,
        "web.check_detuning": check_detuning,
        "web.run_gates": lambda value: run_gates(root, value),
        "web.manifest_status": lambda value: manifest_status(root, value),
        "app.read_state": app_read_state,
        "rack.sensors": rack_sensors,
        "receipt.emit": emit_receipt,
    }
    if name not in handlers:
        raise ToolFailure("unknown tool")
    return handlers[name](args)


def tool_specs():
    empty = {"type": "object", "properties": {}, "required": [], "additionalProperties": False}
    schemas = {
        "web.validate_bubble": {"type": "object", "properties": {"frame": {"type": "object"}}, "required": ["frame"], "additionalProperties": False},
        "web.check_wave_math": {"type": "object", "properties": {"harmonics": {"type": "array", "items": {"type": "array"}}}, "required": ["harmonics"], "additionalProperties": False},
        "web.check_detuning": {"type": "object", "properties": {"grade": {"type": "integer"}, "octave": {"type": "integer"}, "observed_hz": {"type": "number"}}, "required": ["grade", "octave", "observed_hz"], "additionalProperties": False},
        "receipt.emit": {"type": "object", "properties": {"state": {"enum": ["LIVE", "NO_DATA"]}, "code": {"type": "string"}, "count": {"type": "integer"}, "sha256": {"type": "string"}, "cause": {"type": "string"}}, "required": ["state", "code", "count", "sha256"], "additionalProperties": False},
    }
    descriptions = {
        "web.validate_bubble": "Validate a bounded preceptoros.bubble/1 frame without rendering it.",
        "web.check_wave_math": "Measure the sampled radius of a closed harmonic vector.",
        "web.check_detuning": "Compare an observed radio frequency with the fixed pentatonic rule.",
        "web.run_gates": "Run fixed local tests and the initial gzip budget gate.",
        "web.manifest_status": "Measure the static manifest copies and digest.",
        "app.read_state": "Read an approved local app state adapter or return a cause.",
        "rack.sensors": "Read exposed thermal sensors without identifying the machine.",
        "receipt.emit": "Format a bounded state, code, count, and digest receipt.",
    }
    return [{"name": name, "description": descriptions[name], "inputSchema": schemas.get(name, empty)} for name in TOOL_NAMES]


class Server:
    def __init__(self, root):
        self.root = pathlib.Path(root).resolve()
        self.started = False
        self.ready = False

    def parse_line(self, line):
        try:
            value = json.loads(line, parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))
        except (ValueError, json.JSONDecodeError):
            return {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}
        return self.dispatch(value)

    def dispatch(self, message):
        if not isinstance(message, dict) or message.get("jsonrpc") != "2.0" or not isinstance(message.get("method"), str):
            return {"jsonrpc": "2.0", "id": message.get("id") if isinstance(message, dict) else None,
                    "error": {"code": -32600, "message": "Invalid Request"}}
        method, ident, params = message["method"], message.get("id"), message.get("params", {})
        has_id = "id" in message
        if method == "notifications/initialized" and not has_id:
            if self.started:
                self.ready = True
            return None
        if not has_id or isinstance(ident, bool) or not isinstance(ident, (str, int)):
            return {"jsonrpc": "2.0", "id": ident, "error": {"code": -32600, "message": "Invalid Request"}} if has_id else None
        if method == "initialize":
            self.started = True
            self.ready = False
            return {"jsonrpc": "2.0", "id": ident, "result": {"protocolVersion": PROTOCOL,
                    "capabilities": {"tools": {"listChanged": False}}, "serverInfo": {"name": "preceptoros", "version": "1.0.0"}}}
        if method in ("tools/list", "tools/call") and not self.ready:
            return {"jsonrpc": "2.0", "id": ident, "error": {"code": -32002, "message": "Server not initialized"}}
        if method == "tools/list":
            return {"jsonrpc": "2.0", "id": ident, "result": {"tools": tool_specs()}}
        if method == "tools/call":
            if not isinstance(params, dict) or not isinstance(params.get("name"), str):
                return {"jsonrpc": "2.0", "id": ident, "error": {"code": -32602, "message": "Invalid params"}}
            try:
                output = call_tool(self.root, params["name"], params.get("arguments", {}))
                text = encode(output)
                return {"jsonrpc": "2.0", "id": ident, "result": {"content": [{"type": "text", "text": text}],
                        "structuredContent": output, "isError": output.get("state") == "ERROR"}}
            except (ToolFailure, OSError, ValueError, TypeError) as error:
                output = {"state": "ERROR", "cause": str(error)}
                return {"jsonrpc": "2.0", "id": ident, "result": {"content": [{"type": "text", "text": encode(output)}],
                        "structuredContent": output, "isError": True}}
        return {"jsonrpc": "2.0", "id": ident, "error": {"code": -32601, "message": "Method not found"}}


def main():
    server = Server(pathlib.Path(__file__).resolve().parents[1])
    for line in sys.stdin:
        if len(line.encode("utf-8")) > 65536:
            sys.stdout.write(encode({"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Request too large"}}) + "\n")
            sys.stdout.flush()
            continue
        response = server.parse_line(line)
        if response is not None:
            sys.stdout.write(encode(response) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
