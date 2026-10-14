import type { OcrLine } from './textLayout';

/**
 * Convierte el resultado de Tesseract.js (bloques → párrafos → líneas, con
 * `bbox` en esquinas x0/y0/x1/y1) al mismo formato que entrega ML Kit, para que
 * `textLayout` y `chordFilter` funcionen igual en la web y en el teléfono.
 * Función pura: se prueba con Node sin descargar el motor de OCR.
 */

interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface TesseractPageLike {
  blocks: { paragraphs: { lines: { text: string; confidence: number; bbox: Bbox }[] }[] }[] | null;
}

/**
 * Por debajo de esta confianza (0–100) la "línea" suele ser ruido: manchas,
 * el borde de la página o la sombra del lomo. Un renglón real de letra o de
 * acordes, aunque tenga errores, casi siempre supera 30.
 */
export const MIN_LINE_CONFIDENCE = 30;

export function tesseractPageToLines(page: TesseractPageLike, minConfidence = MIN_LINE_CONFIDENCE): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const text = line.text.trim();
        if (!text || line.confidence < minConfidence) continue;
        const { x0, y0, x1, y1 } = line.bbox;
        lines.push({ text, frame: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
      }
    }
  }
  return lines;
}
