# 공유 미리보기 이미지(1200x630) 만들기. 카카오톡·검색 결과에 보이는 그림.
# 실행: python scripts/gen-og.py  → public/og.jpg, public/og-invite.jpg, public/og-teach.jpg
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img')
FONT = os.path.join(ROOT, 'assets', 'fonts')
OUT = os.path.join(ROOT, 'public')
ORANGE = (249, 109, 50)
INK = (17, 17, 17)
GRAY = (102, 102, 102)


def font(w, s):
    return ImageFont.truetype(os.path.join(FONT, f'Pretendard-{w}.otf'), s)


def make(photo, crop_x, title, sub, tag, out):
    W, H, PW = 1200, 630, 600
    im = Image.new('RGB', (W, H), 'white')
    p = Image.open(os.path.join(IMG, photo)).convert('RGB')
    s = H / p.height
    p = p.resize((round(p.width * s), H), Image.LANCZOS)
    p = p.crop((crop_x, 0, crop_x + PW, H))
    im.paste(p, (W - PW, 0))
    d = ImageDraw.Draw(im)
    x = 64
    # 로고 마크 + 이름
    mark = Image.open(os.path.join(IMG, 'app-mark.png')).convert('RGBA').resize((56, 56), Image.LANCZOS)
    im.paste(mark, (x, 64), mark)
    d.text((x + 72, 70), '키오런', font=font('ExtraBold', 38), fill=INK)
    # 태그
    tf = font('Bold', 24)
    tw = d.textlength(tag, font=tf)
    d.rounded_rectangle((x, 196, x + tw + 36, 244), radius=24, fill=(255, 240, 233))
    d.text((x + 18, 205), tag, font=tf, fill=ORANGE)
    # 제목
    y = 272
    for line in title.split('\n'):
        d.text((x, y), line, font=font('ExtraBold', 54), fill=INK)
        y += 70
    y += 14
    for line in sub.split('\n'):
        d.text((x, y), line, font=font('Medium', 26), fill=GRAY)
        y += 38
    im.save(os.path.join(OUT, out), quality=88)
    print('ok', out)


make('og-home.jpg', 320, '부모님 댁으로\n찾아가는 디지털 수업', '휴대폰, 키오스크, 은행 앱, AI까지\n90분 1:1 · 수업마다 사진과 결과', '부모님 1:1 방문 수업', 'og.jpg')
make('og-home.jpg', 320, '가족 초대가\n왔어요', '링크를 눌러 들어오면\n부모님 수업 소식을 함께 받아요', '키오런 가족 초대', 'og-invite.jpg')
make('og-teach.jpg', 330, '동네 어르신께\n디지털을 가르쳐요', '내가 정한 요일만 · 출강 필수 교육 후\n가까운 댁으로 배정돼요', '키오런 강사', 'og-teach.jpg')
