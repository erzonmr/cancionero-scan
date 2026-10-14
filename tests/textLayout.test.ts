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

test('ignora líneas dentro de zonas marcadas', () => {
  const lines = [L('Página 34', 0, 0), L('Letra', 0, 30)];
  assert.equal(linesToText(lines, [{ x: 0, y: 0, width: 300, height: 22 }]), 'Letra');
});
