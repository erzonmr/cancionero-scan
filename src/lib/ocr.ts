import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import type { OcrLine } from './textLayout';

/**
 * OCR en el dispositivo con Google ML Kit (gratis, sin API key, funciona sin internet).
 * Devuelve cada línea con su rectángulo en píxeles de la imagen recibida.
 */
export async function recognizeLines(imageUri: string): Promise<{ lines: OcrLine[]; rawText: string }> {
  const result = await TextRecognition.recognize(imageUri, TextRecognitionScript.LATIN);
  const lines: OcrLine[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      if (!line.frame) continue;
      lines.push({
        text: line.text,
        frame: { x: line.frame.left, y: line.frame.top, width: line.frame.width, height: line.frame.height },
      });
    }
  }
  return { lines, rawText: result.text };
}
