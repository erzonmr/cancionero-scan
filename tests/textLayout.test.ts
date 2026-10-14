/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { linesToText, OcrLine } from '../src/lib/textLayout';

const L = (text: string, x: number, y: number, w = 200, h = 20): OcrLine => ({ text, frame: { x, y, width: w, height: h } });

test('une fragmentos del mismo renglón y ordena de arriba abajo', () => {
  const lines = [L('Señor', 10, 52), L('Em', 300, 20, 30), L('G', 10, 21, 20), L('Santo es el', 220, 50)];
  assert.equal(linesToText(lines), 'G Em\nSeñor Santo es el');
});

test('detecta separación de estrofas por hueco vertical', () => {
  const lines = [L('uno', 0, 0), L('dos', 0, 25), L('tres', 0, 90)];
  assert.equal(linesToText(lines), 'uno\ndos\n\ntres');
});

test('no parte estrofas por el espacio normal letra → acordes con rectángulos ajustados (Tesseract)', () => {
  // Renglones de 30 px; acordes a 8 px de su letra; letra a 38 px de los acordes
  // siguientes (más que la altura del renglón); entre estrofas, 98 px.
  const lines = [
    L('G C G', 0, 0, 200, 30),
    L('Señor mi Dios', 0, 38, 300, 30),
    L('G D D7', 0, 106, 200, 30),
    L('el firmamento', 0, 144, 300, 30),
    L('Em D G', 0, 212, 200, 30),
    L('y ver brillar', 0, 250, 300, 30),
    L('G C G', 0, 378, 200, 30),
    L('Mi corazón', 0, 416, 300, 30),
  ];
  assert.equal(
    linesToText(lines),
    'G C G\nSeñor mi Dios\nG D D7\nel firmamento\nEm D G\ny ver brillar\n\nG C G\nMi corazón',
  );
});

test('detecta estrofas en una página solo de letra con muchos renglones', () => {
  const lines = [0, 30, 60, 90, 150, 180, 210].map((y, i) => L(`renglón ${i + 1}`, 0, y));
  assert.equal(linesToText(lines), 'renglón 1\nrenglón 2\nrenglón 3\nrenglón 4\n\nrenglón 5\nrenglón 6\nrenglón 7');
});

test('ignora líneas dentro de zonas marcadas', () => {
  const lines = [L('Página 34', 0, 0), L('Letra', 0, 30)];
  assert.equal(linesToText(lines, [{ x: 0, y: 0, width: 300, height: 22 }]), 'Letra');
});
