#!/usr/bin/env python3
"""Bangun ZIP untuk Chrome Web Store dari folder extension/.

Beda dengan ZIP biasa (Load unpacked / Releases):
  - buang "key" dari manifest (Web Store memberi ID sendiri)
  - buang izin api.github.com
  - buang fitur khusus pemilik: ikon private key admin (Board) dan upload/token GitHub (Aistim.sync).
    Kode itu diberi penanda <!--PRO-->...<!--/PRO--> (HTML) dan /*PRO*/.../*/PRO*/ (JS).

Pemakaian: python3 tools/build-store.py [folder_output]
Hasil    : <folder_output>/Aistim-Board-store-<versi>.zip   (manifest.json di root zip)
"""
import json, os, re, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'extension')
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOT

m = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
m.pop('key', None)
m['host_permissions'] = [h for h in m.get('host_permissions', []) if 'api.github.com' not in h]
assert 'key' not in m and 'api.github.com' not in json.dumps(m)
assert '<all_urls>' not in json.dumps(m)

PRO = [re.compile(r'[ \t]*<!--PRO-->.*?<!--/PRO-->[ \t]*\n?', re.S),
       re.compile(r'[ \t]*/\*PRO\*/.*?/\*/PRO\*/[ \t]*\n?', re.S)]
BANNED = ('adminKey', 'ghToken', 'api.github.com', 'Bearer ', 'PRO-->', '/*PRO*/', 'eval(', 'new Function')

zpath = os.path.join(OUT, 'Aistim-Board-store-%s.zip' % m['version'])
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(m, indent=2, ensure_ascii=False) + '\n')
    for base, _, files in os.walk(SRC):
        for f in sorted(files):
            full = os.path.join(base, f)
            rel = os.path.relpath(full, SRC)
            if rel == 'manifest.json':
                continue
            if f.endswith(('.html', '.js')) and 'vendor' not in rel.split(os.sep):
                t = open(full, encoding='utf-8').read()
                for rx in PRO:
                    t = rx.sub('', t)
                for b in BANNED:
                    assert b not in t, '%s masih memuat %r' % (rel, b)
                z.writestr(rel, t)
            else:
                z.write(full, rel)
print(zpath)
