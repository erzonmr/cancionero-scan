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

function percentile75(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(0.75 * (s.length - 1))];
}

/** A partir de cuántos huecos se usa también el hueco típico de la página. */
const MIN_GAPS_FOR_PAGE_RHYTHM = 4;

/**
 * Une los renglones en texto. Un hueco vertical se interpreta como separación de
 * estrofas si supera a la vez:
 *  - `gapFactor` × la altura típica de renglón, y
 *  - `rhythmFactor` × el hueco típico de la página (percentil 75 de los huecos).
 * La segunda condición importa cuando el OCR ajusta mucho los rectángulos al texto
 * (Tesseract): el espacio normal entre una letra y el siguiente renglón de acordes
 * llega a superar la altura del renglón, pero es el hueco "de siempre" de la página.
 * Se usa el percentil 75 porque en páginas con acordes los huecos alternan entre
 * pequeños (acordes → letra) y normales (letra → acordes).
 */
export function rowsToText(rows: Row[], gapFactor = 0.9, rhythmFactor = 1.5): string {
  if (rows.length === 0) return '';
  const h = median(rows.map((r) => r.bottom - r.top)) || 1;
  const gaps = rows.slice(1).map((r, i) => r.top - rows[i].bottom);
  const threshold =
    gaps.length >= MIN_GAPS_FOR_PAGE_RHYTHM
      ? Math.max(gapFactor * h, rhythmFactor * percentile75(gaps))
      : gapFactor * h;
  const out: string[] = [rows[0].text];
  for (let i = 1; i < rows.length; i++) {
    if (gaps[i - 1] > threshold) out.push('');
    out.push(rows[i].text);
  }
  return out.join('\n');
}

export function linesToText(lines: OcrLine[], zones: Rect[] = []): string {
  return rowsToText(groupIntoRows(removeIgnoredLines(lines, zones)));
}
