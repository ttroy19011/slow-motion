# 生成 81x81 底部 Tab 图标（无第三方依赖）
import os
import struct
import zlib

ROOT = os.path.join(os.path.dirname(__file__), "..", "miniprogram", "assets")
SIZE = 81
MUTED = (138, 132, 122, 255)
ACCENT = (63, 91, 77, 255)


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, pixels):
    raw = b""
    for row in pixels:
        raw += b"\x00"
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))
    ihdr = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(data)


def blank():
    return [[(0, 0, 0, 0) for _ in range(SIZE)] for _ in range(SIZE)]


def set_px(px, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        px[y][x] = color


def fill_circle(px, cx, cy, radius, color):
    r2 = radius * radius
    for y in range(int(cy - radius), int(cy + radius) + 1):
        for x in range(int(cx - radius), int(cx + radius) + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                set_px(px, x, y, color)


def fill_rect(px, x0, y0, x1, y1, color):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            set_px(px, x, y, color)


def fill_triangle(px, a, b, c, color):
    xs = [a[0], b[0], c[0]]
    ys = [a[1], b[1], c[1]]
    for y in range(min(ys), max(ys) + 1):
        for x in range(min(xs), max(xs) + 1):
            if inside(x, y, a, b, c):
                set_px(px, x, y, color)


def edge(p, q, r):
    return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])


def inside(x, y, a, b, c):
    p = (x, y)
    b1 = edge(a, b, p) < 1
    b2 = edge(b, c, p) < 1
    b3 = edge(c, a, p) < 1
    return b1 == b2 == b3


def icon_home(color):
    px = blank()
    fill_triangle(px, (40, 16), (16, 40), (64, 40), color)
    fill_rect(px, 24, 40, 56, 64, color)
    fill_rect(px, 36, 48, 45, 64, (0, 0, 0, 0))
    return px


def icon_social(color):
    px = blank()
    fill_circle(px, 30, 28, 8, color)
    fill_circle(px, 51, 30, 7, color)
    fill_circle(px, 30, 58, 16, color)
    fill_circle(px, 53, 58, 13, color)
    fill_rect(px, 0, 66, 80, 80, (0, 0, 0, 0))
    return px


def icon_profile(color):
    px = blank()
    fill_circle(px, 40, 28, 10, color)
    fill_circle(px, 40, 62, 18, color)
    fill_rect(px, 0, 68, 80, 80, (0, 0, 0, 0))
    return px


def main():
    mapping = {
        "tab-home.png": icon_home(MUTED),
        "tab-home-active.png": icon_home(ACCENT),
        "tab-social.png": icon_social(MUTED),
        "tab-social-active.png": icon_social(ACCENT),
        "tab-profile.png": icon_profile(MUTED),
        "tab-profile-active.png": icon_profile(ACCENT),
    }
    for name, pixels in mapping.items():
        write_png(os.path.join(ROOT, name), pixels)
    print("icons written to", os.path.abspath(ROOT))


if __name__ == "__main__":
    main()
