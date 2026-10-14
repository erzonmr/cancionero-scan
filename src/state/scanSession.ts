import type { ScanImage } from '../lib/imageTools';

/**
 * Estado temporal del escaneo en curso (vive solo en memoria mientras se pasa
 * de una pantalla a otra; no se persiste en el dispositivo).
 */
export interface ScanResult {
  image: ScanImage; // imagen ya recortada que se subirá a la nube
  originalText: string; // texto OCR completo (con acordes), por si se quiere revisar
  lyrics: string; // texto sin acordes
  removedLines: number;
}

let currentImage: ScanImage | null = null;
let currentResult: ScanResult | null = null;

export const scanSession = {
  setImage(img: ScanImage) {
    currentImage = img;
    currentResult = null;
  },
  getImage: () => currentImage,
  setResult(r: ScanResult) {
    currentResult = r;
  },
  getResult: () => currentResult,
  clear() {
    currentImage = null;
    currentResult = null;
  },
};
