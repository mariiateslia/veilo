"""Build a self-contained static site and the installable Chrome beta. Stdlib only."""
from pathlib import Path
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / 'extension'
DIST = ROOT / 'dist'
REPO = 'https://github.com/mariiateslia/veilo'
manifest = json.loads((EXTENSION / 'manifest.json').read_text())
version = manifest['version']
if DIST.exists():
    shutil.rmtree(DIST)
shutil.copytree(ROOT / 'site', DIST)
assets = DIST / 'assets'
for name in ('mark.svg', 'atmosphere.webp'):
    shutil.copy2(EXTENSION / 'assets' / name, assets / name)
for name in ('editor.js', 'mask-core.js'):
    shutil.copy2(EXTENSION / name, assets / name)
# Editor CSS lives in assets on both surfaces, so its asset-relative image path differs.
(assets / 'editor.css').write_text((EXTENSION / 'editor.css').read_text().replace("url('assets/atmosphere.webp')", "url('atmosphere.webp')"))
for file in DIST.rglob('*.html'):
    data = file.read_text()
    policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    data = data.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+policy+'">')
    for key, value in {'VERSION': version, 'MIN_CHROME': manifest['minimum_chrome_version'], 'REPO': REPO}.items():
        data = data.replace(f'@@{key}@@', value)
    if '@@' in data:
        raise ValueError(f'Unresolved release placeholder in {file}')
    file.write_text(data)
(DIST / '.nojekyll').touch()
(DIST / 'downloads').mkdir()
archive = DIST / 'downloads' / f'veilo-{version}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as output:
    for file in sorted(EXTENSION.rglob('*')):
        if file.is_file() and not any(part.startswith('.') for part in file.relative_to(EXTENSION).parts):
            output.write(file, Path('Veilo') / file.relative_to(EXTENSION))
    output.write(ROOT / 'LICENSE', 'Veilo/LICENSE')
    output.write(ROOT / 'ASSETS.md', 'Veilo/ASSET-LICENSE.txt')
print(f'Built dist/ and {archive.relative_to(ROOT)} ({archive.stat().st_size:,} bytes)')
