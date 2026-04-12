#!/usr/bin/env python3
"""Generate PNG icons for Carrier Pigeon. Requires only Python stdlib."""
import struct, zlib, math, os

# ── PNG writer ────────────────────────────────────────────────────────────────
def write_png(path, pixels, size):
    def row(y):
        return b'\x00' + bytes(c for px in pixels[y] for c in px)
    raw = b''.join(row(y) for y in range(size))
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))

# ── SDF primitives ────────────────────────────────────────────────────────────
def sdf_rounded_box(px, py, size, radius):
    """Signed distance to rounded square [0,size]². Negative = inside."""
    h = size / 2
    qx = abs(px - h) - h + radius
    qy = abs(py - h) - h + radius
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - radius

def sdf_circle(px, py, cx, cy, r):
    return math.hypot(px - cx, py - cy) - r

def coverage(sdf, aa=0.75):
    """SDF → opacity [0,1] with anti-aliased edge."""
    return max(0.0, min(1.0, (-sdf + aa * 0.5) / aa))

def blend(fg, bg, a):
    """Alpha-composite fg (RGBA) over bg (RGBA) with alpha a in [0,1]."""
    ia = 1.0 - a
    return (
        int(fg[0]*a + bg[0]*ia),
        int(fg[1]*a + bg[1]*ia),
        int(fg[2]*a + bg[2]*ia),
        min(255, int(fg[3]*a + bg[3]*ia)),
    )

# ── Icon design ───────────────────────────────────────────────────────────────
BG  = (99, 102, 241, 255)   # indigo-500
DOT = (255, 255, 255, 255)  # white
CLEAR = (0, 0, 0, 0)

def dot_positions(size, large):
    m = size * 0.25           # margin from edge to dot centre
    if large:
        # 2-column × 3-row dice-6 layout
        x1, x2 = m, size - m
        y1, y2, y3 = m, size * 0.5, size - m
        return [(x1,y1),(x2,y1),(x1,y2),(x2,y2),(x1,y3),(x2,y3)]
    else:
        # 16 px: 2×2 grid keeps things readable
        x1, x2 = m, size - m
        y1, y2 = m, size - m
        return [(x1,y1),(x2,y1),(x1,y2),(x2,y2)]

def render(size):
    radius = size * 0.22
    large  = size >= 32
    dot_r  = size * (0.082 if large else 0.13)
    dots   = dot_positions(size, large)

    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            bg_a = coverage(sdf_rounded_box(px, py, size, radius))
            if bg_a <= 0.0:
                row.append(CLEAR)
                continue
            dot_a = max(coverage(sdf_circle(px, py, cx, cy, dot_r)) for cx, cy in dots)
            color = blend(DOT, BG, dot_a)          # dot over background
            color = color[:3] + (int(color[3] * bg_a),)  # clip to rounded shape
            row.append(color)
        pixels.append(row)
    return pixels

# ── Generate ──────────────────────────────────────────────────────────────────
os.makedirs('icons', exist_ok=True)
for size, name in [(16, 'icons/icon16.png'), (48, 'icons/icon48.png'), (128, 'icons/icon128.png')]:
    write_png(name, render(size), size)
    print(f'  {name}')
print('Done.')
