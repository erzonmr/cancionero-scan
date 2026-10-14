import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyLine, isChordToken, removeChords, stripInlineChords } from '../src/lib/chordFilter';

test('reconoce acordes en notación americana', () => {
  for (const c of ['G', 'Am', 'C#m', 'Bb', 'F#m7', 'Dsus4', 'Cadd9', 'Gmaj7', 'E7(9)', 'D/F#', 'Bdim', 'A°', 'Em7b5', 'G,', '(Am)', 'N.C.']) {
    assert.equal(isChordToken(c), true, c);
  }
});

test('reconoce acordes en notación latina', () => {
  for (const c of ['Do', 'Rem', 'Mi7', 'Fa#m', 'Sol', 'La7', 'Sib', 'Do/Mi', 'Solmaj7', 'Re/Fa#']) {
    assert.equal(isChordToken(c), true, c);
  }
});

test('no confunde palabras con acordes', () => {
  for (const w of ['Dios', 'Señor', 'amor', 'mi', 'la', 'de', 'Solo', 'Reina', 'Mismo', 'Bad', 'Gloria', 'Aleluya', 'Cristo']) {
    assert.equal(isChordToken(w), false, w);
  }
});

test('clasifica renglones', () => {
  assert.equal(classifyLine('G        D        Em      C'), 'chords');
  assert.equal(classifyLine('Do   Sol/Si   Lam   Fa'), 'chords');
  assert.equal(classifyLine('| G  /  /  | D  /  / |  x2'), 'chords');
  assert.equal(classifyLine('Intro: G D Em C'), 'instrumental');
  assert.equal(classifyLine('Santo, santo es el Señor'), 'lyrics');
  assert.equal(classifyLine('Mi Dios es grande'), 'lyrics');
  assert.equal(classifyLine('La luz de mi vida'), 'lyrics');
  assert.equal(classifyLine('Si Dios es por nosotros'), 'lyrics');
  assert.equal(classifyLine('Coro:'), 'lyrics');
  assert.equal(classifyLine('Final de los tiempos'), 'lyrics');
  assert.equal(classifyLine(''), 'blank');
});

test('tolera errores típicos del OCR en renglones de acordes', () => {
  // "Em" leído como "Ern"
  assert.equal(classifyLine('G   D   Ern   C   G'), 'chords');
});

test('quita acordes en línea estilo ChordPro y respeta otras etiquetas', () => {
  assert.equal(stripInlineChords('[G]Santo es el [D/F#]Señor'), 'Santo es el Señor');
  assert.equal(stripInlineChords('[Coro] Cantaré'), '[Coro] Cantaré');
});

test('canción completa: quita acordes y conserva estrofas', () => {
  const input = [
    'Intro: G  C  D',
    '',
    'G              C',
    'Cuán grande es Él',
    'D             G',
    'Cuán grande es Él',
    '',
    'Coro:',
    'Em        C',
    'Mi corazón entona',
    'G/B     D',
    'la canción',
  ].join('\n');
  const { lyrics, removedLines } = removeChords(input);
  assert.equal(lyrics, 'Cuán grande es Él\nCuán grande es Él\n\nCoro:\nMi corazón entona\nla canción');
  assert.equal(removedLines, 5);
});
