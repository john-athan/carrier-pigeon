#!/usr/bin/env python3
"""Generate the PNG icons for Carrier Pigeon. Requires only Python stdlib.

The picture is meta/icon.svg: a carrier pigeon with a die tied to its leg, the
die being the message (the parameters it carries are random). This file draws
the same shapes in the same order, so the committed PNGs can be rebuilt and
checked byte for byte without an SVG renderer in the dependency list.

Everything is drawn on a 128 unit canvas and scaled to the output size. Each
shape is flattened to polygons and filled scanline by scanline with SS x SS
samples per pixel, then composited front to back in the order of the SVG.
"""
import math, os, struct, zlib

SS = 4  # samples per pixel along each axis

# -- PNG writer ----------------------------------------------------------------
def write_png(path, rgba, size):
    raw = b''.join(b'\x00' + bytes(rgba[y * size * 4:(y + 1) * size * 4]) for y in range(size))
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))

# -- geometry, in the 128 unit space of meta/icon.svg ---------------------------
def cubic(p0, p1, p2, p3, n=16):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(1, n + 1))]

def ellipse(cx, cy, rx, ry, rot=0.0, n=64):
    r = math.radians(rot); c, s = math.cos(r), math.sin(r)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts

def rrect(x, y, w, h, r, n=12):
    pts = []
    for cx, cy, a0 in ((x+w-r, y+r, -90), (x+w-r, y+h-r, 0), (x+r, y+h-r, 90), (x+r, y+r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def capsule(x1, y1, x2, y2, w, n=10):
    """A stroked segment with round caps, as one polygon."""
    a = math.atan2(y2 - y1, x2 - x1); r = w / 2
    pts = []
    for cx, cy, a0 in ((x2, y2, a - math.pi / 2), (x1, y1, a + math.pi / 2)):
        for i in range(n + 1):
            t = a0 + math.pi * i / n
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts

def rotate(pts, deg, ox, oy):
    r = math.radians(deg); c, s = math.cos(r), math.sin(r)
    return [(ox + (x-ox)*c - (y-oy)*s, oy + (x-ox)*s + (y-oy)*c) for x, y in pts]

def hexc(h):
    return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))

def vgrad(top, bottom, y0, y1):
    a, b = hexc(top), hexc(bottom)
    def f(x, y):
        t = min(1.0, max(0.0, (y - y0) / (y1 - y0)))
        return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
    return f

def dgrad(c0, c1, x0, y0, x1, y1):
    a, b = hexc(c0), hexc(c1); dx, dy = x1 - x0, y1 - y0; L = dx*dx + dy*dy
    def f(x, y):
        t = min(1.0, max(0.0, ((x - x0)*dx + (y - y0)*dy) / L))
        return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
    return f

def solid(h):
    c = hexc(h)
    return lambda x, y: c

# Back to front, as in meta/icon.svg.
neck = [(74, 66)] + cubic((74, 66), (78, 56), (82, 50), (86, 45)) + [(100, 50)] + cubic((100, 50), (98, 60), (94, 68), (88, 76))
wing = [(38, 74)] + cubic((38, 74), (52, 64), (72, 64), (84, 76)) + cubic((84, 76), (70, 86), (52, 90), (30, 90))
SHAPES = [
    (rrect(0, 0, 128, 128, 28), vgrad('#5462d6', '#3a43a8', 0, 128)),
    ([(42, 78), (8, 80), (10, 101), (44, 92)], solid('#6f7690')),
    ([(8, 80), (10, 101), (17, 99.4), (15, 80.3)], solid('#2c3146')),
    (ellipse(62, 80, 32, 21, -12), solid('#c9cdda')),
    (neck, dgrad('#58c9a8', '#9a6be0', 74, 45, 100, 76)),
    (ellipse(93, 40, 12, 12), solid('#b9bed0')),
    ([(104, 38), (115, 42), (104, 45)], solid('#3a3a46')),
    ([(103, 37.5), (104.6, 36.5), (106, 36.5), (107, 37.8), (103.4, 39.4)], solid('#f2f2f5')),
    (ellipse(96, 37, 3, 3), solid('#f08a24')),
    (ellipse(96.4, 37, 1.4, 1.4), solid('#111111')),
    (wing, solid('#9aa1b8')),
    (capsule(50, 76, 62, 80, 3), solid('#3d4258')),
    (capsule(44, 81, 58, 85, 3), solid('#3d4258')),
    (capsule(60, 99, 58, 112, 3), solid('#ef6f7d')),
    (capsule(70, 98, 72, 112, 3), solid('#ef6f7d')),
    (capsule(58, 106, 47, 108, 1.5), solid('#f4f1e9')),
    (rotate(rrect(32, 100, 16, 16, 3.5), -12, 40, 108), solid('#ffffff')),
] + [(rotate(ellipse(x, y, 1.7, 1.7, n=24), -12, 40, 108), solid('#3a43a8'))
     for x, y in ((36.5, 104.5), (40, 108), (43.5, 111.5))]

# -- rasteriser -----------------------------------------------------------------
def coverage(poly, size):
    """Fraction of each pixel inside poly (nonzero rule), as a sparse dict."""
    k = size / 128.0; n = size * SS
    pts = [(x * k * SS, y * k * SS) for x, y in poly]
    edges = list(zip(pts, pts[1:] + pts[:1]))
    ys = [p[1] for p in pts]
    cov = {}
    for sy in range(max(0, int(min(ys))), min(n, int(max(ys)) + 1)):
        yc = sy + 0.5
        xs = []
        for (x0, y0), (x1, y1) in edges:
            if (y0 <= yc < y1) or (y1 <= yc < y0):
                xs.append((x0 + (yc - y0) * (x1 - x0) / (y1 - y0), 1 if y1 > y0 else -1))
        xs.sort()
        wind = 0
        for i, (x, d) in enumerate(xs[:-1]):
            wind += d
            if wind == 0:
                continue
            a = max(0, int(x + 0.5)); b = min(n, int(xs[i + 1][0] + 0.5))
            for sx in range(a, b):
                key = (sy // SS) * size + sx // SS
                cov[key] = cov.get(key, 0) + 1
    full = SS * SS
    return {key: v / full for key, v in cov.items()}

def render(size):
    buf = [0.0] * (size * size * 4)  # premultiplied RGBA, 0..1
    for poly, paint in SHAPES:
        for i, a in coverage(poly, size).items():
            x, y = (i % size + 0.5) * 128 / size, (i // size + 0.5) * 128 / size
            r, g, b = paint(x, y)
            o = i * 4; inv = 1 - a
            buf[o] = r / 255 * a + buf[o] * inv
            buf[o+1] = g / 255 * a + buf[o+1] * inv
            buf[o+2] = b / 255 * a + buf[o+2] * inv
            buf[o+3] = a + buf[o+3] * inv
    out = bytearray(size * size * 4)
    for i in range(size * size):
        al = buf[i*4+3]
        if al > 0:
            for c in range(3):
                out[i*4+c] = min(255, int(buf[i*4+c] / al * 255 + 0.5))
        out[i*4+3] = min(255, int(al * 255 + 0.5))
    return out

# -- generate -------------------------------------------------------------------
# Paths are from the repository root, wherever this is run from.
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
os.makedirs('src/icons', exist_ok=True)
for size in (16, 48, 128):
    name = f'src/icons/icon{size}.png'
    write_png(name, render(size), size)
    print(f'  {name}')

# The store icon is a listing field, uploaded by hand in the dashboard: 96px of
# artwork centred in a transparent 128px frame, because the console rounds and
# shadows the outer 16px itself. A full bleed icon dropped in there gets clipped.
art, pad = render(96), 16
store = bytearray(128 * 128 * 4)
for y in range(96):
    o = ((y + pad) * 128 + pad) * 4
    store[o:o + 96 * 4] = art[y * 96 * 4:(y + 1) * 96 * 4]
os.makedirs('screenshots', exist_ok=True)
write_png('screenshots/store-icon.png', store, 128)
print('  screenshots/store-icon.png')
print('Done.')
