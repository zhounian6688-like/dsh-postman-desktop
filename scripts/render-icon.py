
import math
from PIL import Image, ImageDraw

S = 512  # supersampled canvas size for 180 output -> we render directly at 180*4 then downscale

def render(size, out):
    SS = 4
    W = size * SS
    scale = W / 64.0

    # diagonal gradient  #2f6df6 -> #1b3fbf  along (1,1)
    grad = Image.new('RGB', (W, W))
    px = grad.load()
    x0, y0 = 2.0, 2.0
    x1, y1 = 62.0, 62.0
    dx, dy = (x1 - x0) * scale, (y1 - y0) * scale
    denom = dx * dx + dy * dy
    c0 = (0x2f, 0x6d, 0xf6)
    c1 = (0x1b, 0x3f, 0xbf)
    for y in range(W):
        for x in range(W):
            t = ((x - x0 * scale) * dx + (y - y0 * scale) * dy) / denom
            t = 0.0 if t < 0 else (1.0 if t > 1 else t)
            px[x, y] = (
                int(c0[0] + (c1[0] - c0[0]) * t),
                int(c0[1] + (c1[1] - c0[1]) * t),
                int(c0[2] + (c1[2] - c0[2]) * t),
            )

    # rounded-rect mask: x=2 y=2 w=60 h=60 rx=15
    mask = Image.new('L', (W, W), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle(
        [2 * scale, 2 * scale, 62 * scale, 62 * scale],
        radius=15 * scale,
        fill=255,
    )

    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    lw = max(2, int(round(3.4 * scale)))
    white = (255, 255, 255, 255)

    def pt(x, y):
        return (x * scale, y * scale)

    # paper plane body (closed, stroke only)
    body = [pt(17, 31.5), pt(47, 18), pt(36.5, 47), pt(31.5, 34.5), pt(17, 31.5)]
    d.line(body, fill=white, width=lw, joint='curve')
    # tail crease
    d.line([pt(31.5, 34.5), pt(40, 26)], fill=white, width=lw)
    # round the caps by stamping dots
    r = lw / 2.0
    for (cx, cy) in [pt(17, 31.5), pt(47, 18), pt(36.5, 47), pt(31.5, 34.5), pt(40, 26)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=white)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(out, 'PNG')
    return out

import os
base = r'E:\projects\dsh-postman-desktop'
os.makedirs(os.path.join(base, 'assets'), exist_ok=True)
render(180, os.path.join(base, 'assets', 'icon-180.png'))
render(512, os.path.join(base, 'assets', 'icon-512.png'))
print('done')
