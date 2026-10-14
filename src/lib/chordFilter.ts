/**
 * Filtro de acordes.
 *
 * Recibe texto ya ordenado por renglones (salida del OCR) y elimina:
 *  1. Renglones que solo contienen acordes (notación americana o latina).
 *  2. Renglones instrumentales del tipo "Intro: G D Em C".
 *  3. Acordes en línea entre corchetes, estilo ChordPro: "[G]Santo es el [D]Señor".
 *
 * Conserva la estructura de estrofas (líneas en blanco) y etiquetas como "Coro:".
 * Es una función pura: no depende de React Native, por eso se prueba con Node.
 */

const ACC = '(?:#|b|♯|♭)?';
const EN = '[A-G]';
const LAT = '(?:Do|Re|Mi|Fa|Sol|La|Si)';
// Sufijos de calidad/extensión: m, maj7, sus4, add9, dim, aug, °, 7M, (9), b5, #11, -, +
const QUAL = '(?:maj|min|dim|aug|sus|add|m|M|°|º|ø|\\+|-|\\d|\\(|\\)|#|b|♯|♭)*';
const BASS = `(?:\\/(?:${EN}|${LAT})${ACC})?`;

const CHORD_RE = new RegExp(`^(?:${EN}|${LAT})${ACC}${QUAL}${BASS}$`);
const NO_CHORD_RE = /^N\.?C\.?$/;

/** Tokens que no aportan nada: barras de compás, repeticiones (x2), guiones, puntos. */
const NEUTRAL_RE = /^(?:[|/\\\-–—_.·•:*%~]+|\(?x\s?\d+\)?|\(?\d+\s?x\)?)$/i;

/** Etiquetas que suelen preceder a renglones solo instrumentales. */
const INSTRUMENTAL_LABEL_RE =
  /^(?:intro|introducci[oó]n|interludio|instrumental|solo|final|outro|riff|tag|turnaround)\s*:?$/i;

/** Limpia puntuación que el OCR suele pegar a los acordes: "G," "(Am)" "|D". */
function cleanToken(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^[|[(]+/, '').replace(/[|\]),;:.]+$/, '');
  return t;
}

export function isChordToken(raw: string): boolean {
  const t = cleanToken(raw);
  if (!t) return false;
  return CHORD_RE.test(t) || NO_CHORD_RE.test(t);
}

export function isNeutralToken(raw: string): boolean {
  return NEUTRAL_RE.test(raw.trim());
}

export type LineKind = 'chords' | 'instrumental' | 'lyrics' | 'blank';

export function classifyLine(line: string): LineKind {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'blank';

  let rest = tokens;
  let hasLabel = false;
  if (INSTRUMENTAL_LABEL_RE.test(tokens[0]) || /^(?:intro|interludio|solo|final|outro):/i.test(tokens[0])) {
    hasLabel = true;
    // "Intro:G" pegado → separar
    const glued = tokens[0].split(':')[1];
    rest = glued ? [glued, ...tokens.slice(1)] : tokens.slice(1);
  }

  const meaningful = rest.filter((t) => !isNeutralToken(t));
  if (meaningful.length === 0) return hasLabel ? 'lyrics' : 'chords'; // "||  /  /" → ruido de compás

  const chords = meaningful.filter(isChordToken).length;
  const others = meaningful.length - chords;

  if (chords > 0 && others === 0) return hasLabel ? 'instrumental' : 'chords';

  // Tolerancia a errores de OCR: renglón largo, casi todo acordes y lo demás basura corta
  // (p. ej. "Em" leído como "Ern"). Exige al menos 3 acordes para no tocar letras normales.
  if (chords >= 3 && chords / meaningful.length >= 0.75) {
    const junkIsShort = meaningful.filter((t) => !isChordToken(t)).every((t) => cleanToken(t).length <= 3);
    if (junkIsShort) return hasLabel ? 'instrumental' : 'chords';
  }
  return 'lyrics';
}

/** Quita acordes en línea "[G]" y "[Do#m]" sin tocar otros corchetes como "[Coro]". */
export function stripInlineChords(line: string): string {
  return line
    .replace(/\[([^\]\n]{1,12})\]/g, (whole, inner: string) => (isChordToken(inner) ? '' : whole))
    .replace(/[ \t]{2,}/g, ' ')
    .trimEnd();
}

export interface FilterResult {
  lyrics: string;
  removedLines: number;
}

export function removeChords(text: string): FilterResult {
  const out: string[] = [];
  let removed = 0;
  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const kind = classifyLine(rawLine);
    if (kind === 'chords' || kind === 'instrumental') {
      removed++;
      continue;
    }
    out.push(kind === 'blank' ? '' : stripInlineChords(rawLine).trim());
  }
  const lyrics = out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // máx. una línea en blanco entre estrofas
    .trim();
  return { lyrics, removedLines: removed };
}
