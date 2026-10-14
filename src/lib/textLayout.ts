/**
 * Reconstrucción del texto a partir de las líneas que devuelve el OCR.
 *
 * El OCR entrega líneas con su rectángulo (en píxeles de la imagen) pero no
 * garantiza el orden ni que un renglón visual venga en una sola línea: los
 * acordes muy separados suelen llegar como varias "líneas" sueltas. Aquí:
 *   1. Se descartan las líneas que caen dentro de las zonas a ignorar.
 *   2. Se agrupan en renglones visuales por su posición vertical.
 *   3. Se ordenan de arriba abajo y de izquierda a derecha.
 *   4. Se insertan líneas en blanco donde hay un salto vertical grande (estrofas).
 * Función pura, sin dependencias de React Native.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrLine {
  text: string;
  frame: Rect;
}

export interface Row {
  text: string;
  top: number;
  bottom: number;
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Una línea se ignora si más de la mitad de su área cae dentro de alguna zona. */
export function removeIgnoredLines(lines: OcrLine[], zones: Rect[]): OcrLine[] {
  if (zones.length === 0) return lines;
  return lines.filter((l) => {
    const area = Math.max(1, l.frame.width * l.frame.height);
    const covered = zones.reduce((acc, z) => acc + overlapArea(l.frame, z), 0);
    return covered / area <= 0.5;
  });
}

export function groupIntoRows(lines: OcrLine[]): Row[] {
  const sorted = [...lines]
    .filter((l) => l.text.trim().length > 0)
    .sort((a, b) => a.frame.y + a.frame.height / 2 - (b.frame.y + b.frame.height / 2));

  const rows: { items: OcrLine[]; top: number; bottom: number }[] = [];
  for (const line of sorted) {
    const top = line.frame.y;
    const bottom = line.frame.y + line.frame.height;
    const row = rows.find((r) => {
      const overlap = Math.min(r.bottom, bottom) - Math.max(r.top, top);
      const minH = Math.min(r.bottom - r.top, bottom - top);
      return overlap > 0.5 * minH;
    });
    if (row) {
      row.items.push(line);
      row.top = Math.min(row.top, top);
      row.bottom = Math.max(row.bottom, bottom);
    } else {
      rows.push({ items: [line], top, bottom });
    }
  }

  return rows
    .sort((a, b) => a.top - b.top)
    .map((r) => ({
      text: r.items
        .sort((a, b) => a.frame.x - b.frame.x)
        .map((i) => i.text.trim())
        .join(' '),
      top: r.top,
      bottom: r.bottom,
    }));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Une los renglones en texto. Un hueco vertical mayor que `gapFactor` veces la
 * altura típica de renglón se interpreta como separación de estrofas.
 */
export function rowsToText(rows: Row[], gapFactor = 0.9): string {
  if (rows.length === 0) return '';
  const h = median(rows.map((r) => r.bottom - r.top)) || 1;
  const out: string[] = [rows[0].text];
  for (let i = 1; i < rows.length; i++) {
    const gap = rows[i].top - rows[i - 1].bottom;
    if (gap > gapFactor * h) out.push('');
    out.push(rows[i].text);
  }
  return out.join('\n');
}

export function linesToText(lines: OcrLine[], zones: Rect[] = []): string {
  return rowsToText(groupIntoRows(removeIgnoredLines(lines, zones)));
}
