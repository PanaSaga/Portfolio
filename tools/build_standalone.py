#!/usr/bin/env python3
"""
index.html 을 단일 파일(모든 이미지가 data URI 로 인라인된) 로 만든다.
아이콘/스티커/게임 썸네일을 base64 로 박아 넣어 서버 없이 열 수 있는
portfolio-standalone.html 을 생성한다.

사용법:
    python3 tools/build_standalone.py [출력경로]
    (출력경로 생략 시 리포 루트에 portfolio-standalone.html)
"""
import base64, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # tools/ 의 부모 = 리포 루트

def durl(path, mime):
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode())

def png(path): return durl(path, 'image/png')
def jpg(path): return durl(path, 'image/jpeg')

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

# --- 아이콘: ICONS 객체(의미이름:파일basename) 를 data URI 로 치환 ---
icon_names = ['birth', 'school', 'email', 'phone', 'pin', 'office', 'project',
              'target', 'poker', 'resume', 'gamepad', 'pdf', 'video', 'chart', 'domino']
icon_map = {n: png(os.path.join(ROOT, 'assets/icons', n + '.png')) for n in icon_names}
new_icons = "var ICONS = {\n" + ",\n".join("    %s:'%s'" % (n, icon_map[n]) for n in icon_names) + "\n  };"
html = html.replace(re.search(r"var ICONS = \{.*?\};", html, re.S).group(0), new_icons)
html = html.replace("var ICON_DIR = 'assets/icons/';", "var ICON_DIR = '';")
html = html.replace("ICON_DIR + f + '.png\"", "ICON_DIR + f + '\"")
html = html.replace("(ICONS[icon] || ICONS.project) + '.png\"", "(ICONS[icon] || ICONS.project) + '\"")

# --- 스티커 (리터럴 경로) ---
for f in ['chess', 'dice', 'sword', 'controller', 'dpad']:
    html = html.replace('src="assets/stickers/%s.png"' % f,
                        'src="%s"' % png(os.path.join(ROOT, 'assets/stickers', f + '.png')))

# --- 게임 썸네일(JPEG): 리터럴 경로 문자열을 data URI 로 치환 ---
gdir = os.path.join(ROOT, 'assets/images/games')
gn = 0
if os.path.isdir(gdir):
    for fn in sorted(os.listdir(gdir)):
        if not fn.lower().endswith('.jpg'):
            continue
        rel = 'assets/images/games/' + fn
        if rel in html:
            html = html.replace(rel, jpg(os.path.join(gdir, fn)))
            gn += 1

assert 'assets/images/games/' not in html, '게임 경로가 남아있음'
leftover = re.findall(r'src="assets/[^"]+"', html)
assert not leftover, leftover

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'portfolio-standalone.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote %s  %.1f MB  (icons %d, games %d)' % (out, len(html) / 1e6, len(icon_map), gn))
