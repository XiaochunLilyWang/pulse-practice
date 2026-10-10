"""Stamp web assets by content; leave the independent Xiaohongshu source untouched."""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
for name in ('index.html', 'play.html'):
    page = ROOT / name
    def version(match):
        asset = match.group(2)
        digest = hashlib.sha256((ROOT / asset).read_bytes()).hexdigest()[:12]
        return f'{match.group(1)}="./{asset}?v={digest}"'
    source = page.read_text()
    page.write_text(re.sub(r'(src|href)="\./(web\.css|web\.js|history\.js|celebration\.js|favicon\.svg)(?:\?v=[^"\s]*)?"', version, source))
print('Versioned web asset links by content.')
