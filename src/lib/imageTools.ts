import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Rect } from './textLayout';

export interface ScanImage {
  uri: string;
  width: number;
  height: number;
}

/** Rectángulo normalizado (0..1) respecto al ancho/alto de la imagen. */
export type NormRect = Rect;

const MAX_SIDE = 2400; // suficiente para OCR y mantiene los archivos livianos

async function render(ctx: ReturnType<typeof ImageManipulator.manipulate>): Promise<ScanImage> {
  const ref = await ctx.renderAsync();
  const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Aplica la orientación EXIF y limita el tamaño. Llamar justo después de capturar/importar. */
export async function normalizeImage(uri: string, width: number, height: number): Promise<ScanImage> {
  const ctx = ImageManipulator.manipulate(uri);
  const longest = Math.max(width, height);
  if (longest > MAX_SIDE) {
    if (width >= height) ctx.resize({ width: MAX_SIDE });
    else ctx.resize({ height: MAX_SIDE });
  }
  return render(ctx);
}

export async function rotateImage(img: ScanImage, degrees: 90 | -90 | 180): Promise<ScanImage> {
  return render(ImageManipulator.manipulate(img.uri).rotate(degrees));
}

export function normToPx(r: NormRect, img: { width: number; height: number }): Rect {
  return {
    x: Math.round(r.x * img.width),
    y: Math.round(r.y * img.height),
    width: Math.round(r.width * img.width),
    height: Math.round(r.height * img.height),
  };
}

/** Recorta la imagen y devuelve las zonas a ignorar convertidas a píxeles de la imagen recortada. */
export async function cropImage(
  img: ScanImage,
  crop: NormRect,
  ignoreZones: NormRect[],
): Promise<{ image: ScanImage; zonesPx: Rect[] }> {
  const c = normToPx(crop, img);
  c.width = Math.max(1, Math.min(c.width, img.width - c.x));
  c.height = Math.max(1, Math.min(c.height, img.height - c.y));
  const isFull = c.x === 0 && c.y === 0 && c.width === img.width && c.height === img.height;
  const image = isFull
    ? img
    : await render(
        ImageManipulator.manipulate(img.uri).crop({ originX: c.x, originY: c.y, width: c.width, height: c.height }),
      );
  // La imagen recortada puede diferir en 1px por redondeo: escalar por si acaso.
  const sx = image.width / c.width;
  const sy = image.height / c.height;
  const zonesPx = ignoreZones.map((z) => {
    const p = normToPx(z, img);
    return { x: (p.x - c.x) * sx, y: (p.y - c.y) * sy, width: p.width * sx, height: p.height * sy };
  });
  return { image, zonesPx };
}
