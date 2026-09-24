from pathlib import Path
from html.parser import HTMLParser
import re, zipfile, subprocess, json
root=Path(__file__).resolve().parents[1]; dist=root/'xhs-dist'; errors=[]
class CheckHTML(HTMLParser):
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag in ['iframe','object','base']:errors.append('Forbidden tag: '+tag)
        if tag=='script' and (not attrs.get('src') or attrs.get('type')=='module'):errors.append('Script must be external and classic')
        for k,v in attrs.items():
            if k.startswith('on'):errors.append('Inline handler '+k)
            if k in ['src','href']:
                if not v.startswith('./') or not (dist/v).is_file():errors.append('Invalid resource '+v)
        if tag=='meta' and attrs.get('http-equiv','').lower()=='content-security-policy':errors.append('CSP meta')
html=(dist/'index.html').read_text();js=(dist/'app.js').read_text();css=(dist/'style.css').read_text();CheckHTML().feed(html)
for term in [r'\bfetch\s*\(',r'XMLHttpRequest',r'\bnew\s+(?:WebSocket|EventSource|RTCPeerConnection|Worker|SharedWorker|Function)\b',r'\beval\s*\(',r'WebAssembly',r'navigator\.(?:geolocation|clipboard|bluetooth|usb|hid|serial|getBattery|connection|credentials|locks|serviceWorker)',r'window\.(?:open|prompt)\s*\(',r'requestFullscreen',r'https?://',r'\.flat(?:Map)?\(',r'catch\s*\{',r'\?\.',r'\?\?',r'\b(?:import|export)\s']:
    if re.search(term,js):errors.append('Unexpected API/syntax: '+term)
assert '<script src="./app.js"></script>' in html
assert 'viewport-fit=cover' in html
assert '--safe-area-inset-bottom' in css and '--safe-area-inset-top' in css
assert not re.search(r'(?<!-)\bgap:',css)
assert 'inset:0' not in css and ':focus{' in css
assert not re.search(r'data:[^;]+;base64,',html+js+css)
subprocess.run(['node','--check',str(dist/'app.js')],check=True)
archive=root/'releases'/'pulse-practice-xhs-tool.zip'
with zipfile.ZipFile(archive) as z:
    assert sorted(z.namelist())==['app.js','index.html','style.css']
    assert z.testzip() is None
    for name in z.namelist():assert z.read(name)==(dist/name).read_bytes()
assert archive.stat().st_size<2*1024*1024
if errors:raise SystemExit('\n'.join(errors))
print('PASS: root entry, relative local resources, classic external JS, no inline events, prohibited API scan, compatibility repairs, safe areas, no Base64, zip CRC and byte parity.')
