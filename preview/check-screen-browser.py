"""Exercise the local fixture at two viewport widths using headless Chrome."""
from pathlib import Path
import html
import json
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
CHECK = """<script>
let bad=0,clipped=0,overlap=0; const box=scene.getBoundingClientRect();
for(let i=6;i<=30;i++) { slider.value=String(i/10); slider.dispatchEvent(new Event('input')); let rects=[];
 for(const b of buttons) { const r=b.getBoundingClientRect(); rects.push(r);
  if(r.width<44 || r.height<44 || parseFloat(getComputedStyle(b).fontSize)<16) bad++;
  if(r.left<box.left || r.right>box.right || r.top<box.top || r.bottom>box.bottom) clipped++;
  b.click(); if(!document.getElementById('result').textContent.startsWith(b.textContent+':')) bad++;
 }
 for(let j=0;j<rects.length;j++) for(let k=j+1;k<rects.length;k++)
  if(rects[j].left<rects[k].right && rects[j].right>rects[k].left && rects[j].top<rects[k].bottom && rects[j].bottom>rects[k].top) overlap++;
} document.body.dataset.receipt=JSON.stringify({bad,clipped,overlap,width:innerWidth});</script>"""
source = (HERE / 'screen-labels.html').read_text()
with tempfile.NamedTemporaryFile(mode='w', suffix='.html', dir=HERE, delete=False) as fixture:
    fixture.write(source.replace('</body>', CHECK + '</body>'))
    path = Path(fixture.name)
try:
    for width in (500, 1200):
        result = subprocess.run(['google-chrome', '--headless', '--no-sandbox', '--disable-gpu',
                                 f'--window-size={width},850', '--dump-dom', path.as_uri()],
                                capture_output=True, text=True, check=True)
        match = re.search(r'data-receipt="([^"]+)"', result.stdout)
        if not match:
            raise AssertionError('browser receipt missing')
        receipt = json.loads(html.unescape(match.group(1)))
        print(width, receipt)
        assert all(receipt[key] == 0 for key in ('bad', 'clipped', 'overlap'))
finally:
    path.unlink()
