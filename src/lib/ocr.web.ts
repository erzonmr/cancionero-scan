import { createWorker, type Worker } from 'tesseract.js';
import { tesseractPageToLines } from './tesseractLines';
import type { OcrLine } from './textLayout';

/**
 * OCR en el navegador con Tesseract.js (WebAssembly; gratis, sin API key).
 * Metro usa este archivo en la web y `ocr.ts` (ML Kit) en Android/iOS.
 *
 * La primera vez descarga el motor y los datos de español + inglés (~10 MB)
 * desde el CDN de jsDelivr; después quedan en la caché del navegador (IndexedDB).
 * El worker se crea una sola vez y se reutiliza entre escaneos.
 */

export type OcrProgress = (label: string) => void;

// Estados que emite el worker de Tesseract.js v7.
const STATUS_LABELS: Record<string, string> = {
  'initializing tesseract': 'Cargando el motor de OCR',
  'loading language traineddata': 'Cargando idiomas (la 1.ª vez se descargan)',
  'initializing api': 'Preparando OCR',
  'recognizing text': 'Leyendo texto',
};

let onProgress: OcrProgress | undefined;
let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  workerPromise ??= createWorker(['spa', 'eng'], undefined, {
    logger: (m) => {
      const label = STATUS_LABELS[m.status];
      if (label && onProgress) onProgress(`${label}… ${Math.round(m.progress * 100)} %`);
    },
  }).catch((e) => {
    workerPromise = null; // permitir reintentar (p. ej. si falló la descarga por falta de red)
    throw e;
  });
  return workerPromise;
}

export async function recognizeLines(
  imageUri: string,
  progress?: OcrProgress,
): Promise<{ lines: OcrLine[]; rawText: string }> {
  onProgress = progress;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imageUri, {}, { text: true, blocks: true });
    return { lines: tesseractPageToLines(data), rawText: data.text };
  } finally {
    onProgress = undefined;
  }
}
