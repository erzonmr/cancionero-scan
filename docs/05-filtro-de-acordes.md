# 5. Filtro de acordes

Código: `src/lib/textLayout.ts` (armado de renglones) y `src/lib/chordFilter.ts` (filtro). Ambos son TypeScript puro y tienen pruebas en `tests/`.

## Paso A — Reconstruir renglones (`textLayout.ts`)

El OCR no entrega el texto "como se ve": los acordes separados por mucho espacio suelen llegar como líneas sueltas y en desorden. Por eso:

1. **Zonas ignoradas**: se descarta toda línea cuyo rectángulo quede cubierto en más del 50 % por una zona marcada por el usuario.
2. **Agrupar renglones**: dos líneas pertenecen al mismo renglón visual si se solapan verticalmente más de la mitad de la altura de la más baja.
3. **Ordenar**: renglones de arriba abajo; dentro del renglón, de izquierda a derecha.
4. **Estrofas**: se inserta una línea en blanco si el espacio vertical entre dos renglones supera **a la vez**:
   - 0,9 × la altura mediana de renglón, y
   - 1,5 × el hueco típico de la página (percentil 75 de todos los huecos), solo si la página tiene al menos 5 renglones.

   La segunda condición se añadió para Tesseract (versión web), que ajusta los rectángulos al texto mucho más que ML Kit: el espacio normal entre una letra y el siguiente renglón de acordes llegaba a superar la altura del renglón y cada par acordes/letra quedaba como una estrofa aparte. Se usa el percentil 75 porque en páginas con acordes los huecos alternan entre pequeños (acordes → letra) y normales (letra → acordes).

> Las estrofas se detectan **antes** de quitar acordes: entre un renglón de acordes y su letra el hueco es pequeño, entre estrofas es grande.

## Paso B — Clasificar y quitar (`chordFilter.ts`)

Cada renglón se clasifica como `chords`, `instrumental`, `lyrics` o `blank`. Se eliminan `chords` e `instrumental`.

### Qué es un acorde

```
Raíz        Alteración   Calidad / extensiones (repetibles)                  Bajo
[A-G]        # b ♯ ♭     m min maj M dim aug sus add ° º ø + - dígitos ( ) # b   /[A-G o Do..Si][#b]
Do Re Mi Fa Sol La Si
```

Ejemplos válidos: `G`, `Am`, `C#m7`, `Bb`, `Dsus4`, `Cadd9`, `Gmaj7`, `E7(9)`, `D/F#`, `Em7b5`, `A°`, `Do`, `Rem`, `Fa#m`, `Sib`, `Sol/Si`, `N.C.`.

Antes de evaluar se limpian signos que el OCR pega: `G,` `(Am)` `|D` `[C]`.

**Notación latina solo con mayúscula inicial** (`La`, `Mi`, `Si`), porque en minúscula son palabras muy frecuentes en las letras ("la", "mi", "si").

### Reglas de renglón

| Regla | Ejemplo | Resultado |
|-------|---------|-----------|
| Todos los tokens significativos son acordes | `G    D    Em   C` | se quita |
| Tokens neutros no cuentan: barras, `x2`, `/`, `-`, `%` | `\| G / / \| D / / \| x2` | se quita |
| Etiqueta instrumental + acordes | `Intro: G D Em C`, `Interludio: Do Sol` | se quita |
| Tolerancia OCR: ≥3 acordes, ≥75 % acordes y el resto ≤3 letras | `G  D  Ern  C  G` ("Em" mal leído) | se quita |
| Hay palabras normales | `Mi Dios es grande`, `Si Dios es por nosotros` | se conserva |
| Etiquetas de sección | `Coro:`, `Estrofa 2` | se conservan |

Además, en los renglones de letra se quitan **acordes en línea** estilo ChordPro (`[G]Santo es el [D]Señor` → `Santo es el Señor`) sin tocar corchetes que no son acordes (`[Coro]`).

Al final se colapsan líneas en blanco repetidas (máx. una entre estrofas).

## Casos difíciles conocidos

| Caso | Comportamiento | Mitigación |
|------|----------------|------------|
| Renglón de letra de una sola palabra que coincide con acorde (`Sol`, `A`) | Se quita | Revisar en la pantalla de revisión; el texto original está disponible |
| Acordes **dentro** del mismo renglón que la letra, sin corchetes | Se conservan como palabras | Usar zonas a ignorar o corregir a mano |
| Cifrado con números romanos / grados (`I IV V`) | No se detecta | Agregar al regex si tu cancionero lo usa |
| Acordes escritos a mano | El OCR los lee mal | La regla de tolerancia ayuda parcialmente |

## Cómo ajustarlo

- **Agregar una etiqueta instrumental**: `INSTRUMENTAL_LABEL_RE`.
- **Aceptar otra calidad de acorde**: `QUAL`.
- **Más o menos tolerancia a errores OCR**: el bloque "Tolerancia a errores de OCR" en `classifyLine`.
- **Sensibilidad de estrofas**: parámetros `gapFactor` y `rhythmFactor` de `rowsToText` (más bajos = más líneas en blanco).

Después de cualquier cambio:

```powershell
npm test
```

Agrega un caso de prueba con el renglón real de tu cancionero que falló; así no se rompe en el futuro.
