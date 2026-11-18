"""Check the release's relative links, ZIP layout, and runtime boundaries."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self,tag,attrs):
        for name,value in attrs:
            if name in ('href','src') and value:
                self.links.append(value)

for file in DIST.rglob('*.html'):
    parser=Links(); parser.feed(file.read_text())
    for link in parser.links:
        parsed=urlparse(link)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        assert not parsed.path.startswith('/'), f'Root-relative path breaks project Pages: {file}: {link}'
        target=(file.parent/unquote(parsed.path)).resolve()
        assert target.is_relative_to(DIST.resolve()), f'Path escapes site: {link}'
        assert target.exists(), f'Missing target: {file.name} -> {link}'

version=json.loads((ROOT/'extension/manifest.json').read_text())['version']
with zipfile.ZipFile(DIST/'downloads'/f'veilo-{version}.zip') as archive:
    names=archive.namelist()
    assert 'Veilo/manifest.json' in names
    assert all(n.startswith('Veilo/') for n in names)
    assert all(not any(x in n for x in ('node_modules','tests/','demo/','site/','.DS_Store')) for n in names)
    manifest=json.loads(archive.read('Veilo/manifest.json'))
    assert manifest['version']==version
    for path in [manifest['action']['default_popup'],*manifest['icons'].values()]:
        assert f'Veilo/{path}' in names
    assert 'Veilo/mask-core.js' in names
    assert 'Veilo/editor-capture.js' in names
for file in DIST.rglob('*.js'):
    data=file.read_text()
    assert 'chrome.' not in data, f'Chrome adapter leaked into public site: {file}'
    assert 'fetch(' not in data and 'XMLHttpRequest' not in data and 'sendBeacon' not in data, f'Unexpected runtime network: {file}'
print('Release links, subpath URLs, ZIP layout, and public runtime boundaries verified.')
