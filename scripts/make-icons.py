"""Genera todos los iconos de Cancionero Scan: una hoja con renglones de letra,
un marco de escaneo y una nota musical, con los colores de src/theme.ts.

Uso (desde la raíz del proyecto; requiere Pillow: pip install pillow):
    python scripts/make-icons.py

Escribe:
    assets/        icon, adaptive-icon, splash-icon, favicon   (app nativa / Expo)
    public/icons/  icon-192, icon-512, maskable-512, apple-touch-icon   (PWA)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

BG = (15, 17, 21, 255)       # colors.bg
AMBER = (226, 168, 58, 255)  # colors.primary
PAPER = (242, 243, 245, 255) # colors.text
INK = (26, 20, 6, 255)       # colors.primaryText
S = 4  # supersampling


def glyph(size: int, scale: float) -> Image.Image:
    """Dibuja el símbolo centrado, ocupando `scale` del lado."""
    big = size * S
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = big * scale / 100  # unidad: 1/100 del área del símbolo
    ox = oy = (big - big * scale) / 2

    def P(x, y):
        return (ox + x * u, oy + y * u)

    # Marco de escaneo (esquinas)
    w = 5 * u
    L = 22
    for (cx, cy, dx, dy) in [(0, 0, 1, 1), (100, 0, -1, 1), (0, 100, 1, -1), (100, 100, -1, -1)]:
        d.line([P(cx, cy + dy * L), P(cx, cy), P(cx + dx * L, cy)], fill=AMBER, width=int(w), joint="curve")
    # Hoja
    d.rounded_rectangle([P(18, 12), P(82, 88)], radius=6 * u, fill=PAPER)
    # Renglones de letra
    for i, y in enumerate([28, 40, 52, 64, 76]):
        right = 66 if i % 2 else 72
        if i >= 2:
            right = 46  # deja espacio a la nota
        d.rounded_rectangle([P(28, y - 2.2), P(right, y + 2.2)], radius=2.2 * u, fill=INK)
    # Nota musical
    d.ellipse([P(52, 64), P(66, 76)], fill=AMBER)
    d.rectangle([P(62.5, 42), P(66, 70)], fill=AMBER)
    d.polygon([P(66, 42), P(76, 47), P(76, 53), P(66, 48)], fill=AMBER)
    return img.resize((size, size), Image.LANCZOS)


def solid(size: int, scale: float) -> Image.Image:
    """Símbolo sobre fondo opaco (iconos que el sistema no recorta)."""
    img = Image.new("RGBA", (size, size), BG)
    img.alpha_composite(glyph(size, scale))
    return img


def main(root: Path) -> None:
    assets = root / "assets"
    pwa = root / "public" / "icons"
    assets.mkdir(parents=True, exist_ok=True)
    pwa.mkdir(parents=True, exist_ok=True)

    solid(1024, 0.74).convert("RGB").save(assets / "icon.png")
    # Android adaptive: el sistema recorta a círculo/squircle; zona segura ~66 %
    glyph(1024, 0.56).save(assets / "adaptive-icon.png")
    glyph(1024, 0.80).save(assets / "splash-icon.png")
    solid(48, 0.80).save(assets / "favicon.png")

    solid(192, 0.74).convert("RGB").save(pwa / "icon-192.png")
    solid(512, 0.74).convert("RGB").save(pwa / "icon-512.png")
    # "maskable": el launcher puede recortarlo en círculo (zona segura = 80 % del diámetro)
    solid(512, 0.56).convert("RGB").save(pwa / "maskable-512.png")
    solid(180, 0.74).convert("RGB").save(pwa / "apple-touch-icon.png")


if __name__ == "__main__":
    main(Path(__file__).resolve().parent.parent)
