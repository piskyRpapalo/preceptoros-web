"""Headless Chrome visual and accessibility audit for Acho Living Lab across 3 viewports."""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
HTML_PATH = HERE / 'acho_lab.html'

VIEWPORTS = [
    (360, 640, 'mobile-360'),
    (420, 800, 'mobile-420-doogee'),
    (1280, 800, 'desktop-1280')
]

def audit():
    print(f"Auditing {HTML_PATH.name} with headless Chrome...")
    results = {}
    for width, height, label in VIEWPORTS:
        cmd = [
            'google-chrome',
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            f'--window-size={width},{height}',
            '--dump-dom',
            HTML_PATH.as_uri()
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        out = res.stdout

        # Extract data-receipt
        m = re.search(r'data-receipt="([^"]+)"', out)
        if not m:
            print(f"FAIL [{label}]: data-receipt missing from DOM")
            sys.exit(1)

        raw = m.group(1).replace('&quot;', '"')
        receipt = json.loads(raw)

        # Assertions for L1-L4 and constraints
        assert receipt['lawL1'] is True, f"L1 failed in {label}"
        assert receipt['lawL2'] is True, f"L2 failed in {label}"
        assert receipt['lawL3'] is True, f"L3 failed in {label}"
        assert receipt['lawL4'] is True, f"L4 failed in {label}"
        assert receipt['badgeDiameter'] == 44, f"Badge not 44px in {label}"
        assert receipt['byteCount'] <= 1024, f"Acho frame exceeds 1024 B: {receipt['byteCount']}"

        # Verify outside-canvas table is in dumped DOM
        assert 'Outside-Canvas Observable Telemetry' in out
        assert 'Haven (1,0)' in out
        assert 'RIGHT: NO_DATA' in out

        results[label] = {
            'width': width,
            'height': height,
            'receipt': receipt,
            'status': 'PASS'
        }
        print(f"PASS [{label}]: w={width}px, sun={receipt['sunDeg']:.2f}°, badge={receipt['badgeDiameter']}px, L1-L4 verified")

    print("\nAll viewport audits passed successfully.")
    return results

if __name__ == '__main__':
    audit()
