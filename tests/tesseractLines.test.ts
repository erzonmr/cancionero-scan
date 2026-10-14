/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tesseractPageToLines } from '../src/lib/tesseractLines';

const line = (text: string, confidence: number, x0: number, y0: number, x1: number, y1: number) => ({
  text,
  confidence,
  bbox: { x0, y0, x1, y1 },
});

test('convierte las líneas de Tesseract al formato de ML Kit (x, y, ancho, alto)', () => {
  const page = {
    blocks: [
      { paragraphs: [{ lines: [line('G  C  G\n', 91, 10, 20, 210, 50), line('Señor mi Dios\n', 88, 10, 58, 400, 92)] }] },
      { paragraphs: [{ lines: [line('Coro:\n', 95, 10, 150, 90, 180)] }] },
    ],
  };
  assert.deepEqual(tesseractPageToLines(page), [
    { text: 'G  C  G', frame: { x: 10, y: 20, width: 200, height: 30 } },
    { text: 'Señor mi Dios', frame: { x: 10, y: 58, width: 390, height: 34 } },
    { text: 'Coro:', frame: { x: 10, y: 150, width: 80, height: 30 } },
  ]);
});

test('descarta líneas vacías y de baja confianza (ruido, sombras)', () => {
  const page = {
    blocks: [{ paragraphs: [{ lines: [line('  \n', 90, 0, 0, 5, 5), line('~ ,. |', 12, 0, 10, 50, 20), line('Letra', 80, 0, 30, 60, 50)] }] }],
  };
  assert.deepEqual(
    tesseractPageToLines(page).map((l) => l.text),
    ['Letra'],
  );
});

test('página sin bloques', () => {
  assert.deepEqual(tesseractPageToLines({ blocks: null }), []);
});
