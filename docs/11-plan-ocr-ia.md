# 11. Plan pendiente: transcripción con IA de visión

> **Estado: PENDIENTE.** Decidido el 2026-10-13, todavía sin implementar. Retomar desde [Antes de empezar](#1-antes-de-empezar-lo-prepara-el-usuario).

## Por qué

Con fotos reales del cancionero, los resultados de Tesseract.js (el OCR actual de la versión web) **no son satisfactorios**. Se compararon cuatro caminos (afinar Tesseract, OCR en la nube, IA de visión, corrección de perspectiva) y se eligió **IA de visión (Claude)** como motor principal:

- **Entiende la página** en lugar de leer carácter a carácter: distingue acordes de letra por su posición, respeta las estrofas, ignora números de página y encabezados, y tolera fotos algo torcidas o curvadas.
- **Devuelve la letra ya limpia**, sin depender de la heurística de `chordFilter.ts`, que falla cuando el OCR lee mal un acorde (p. ej. `C` → `Cc`).
- **Extra casi gratis:** puede devolver también la canción **con acordes en formato ChordPro**, que hoy se pierde.

**Tesseract se mantiene como respaldo** gratuito y sin conexión: si la IA falla (sin red, sin saldo, error del servicio), el escaneo sigue funcionando como hasta ahora.

## 1. Antes de empezar (lo prepara el usuario)

- [ ] **Clave de API de Anthropic** con saldo prepagado (https://platform.claude.com → *API Keys*). Se guarda solo como secreto de Supabase, nunca en el código ni en la app.
- [ ] **2–3 fotos reales** del cancionero, incluida al menos una "difícil" (torcida, con poca luz o con la página curvada). Guardarlas en `samples/` (carpeta excluida de git: son fotos personales).
- [ ] Decir **qué fallaba** con Tesseract (palabras mal leídas / acordes que quedan o letra que desaparece / renglones desordenados), para comprobar que la IA lo resuelve.

## 2. Arquitectura

```
App (web o nativa)                     Supabase                              Anthropic
──────────────────                     ────────                              ─────────
foto recortada                         Edge Function `transcribe`
 + zonas ignoradas pintadas  ──JWT──►   1. verifica la sesión (verify_jwt)
 (JPEG, lado mayor ≤ 1568 px)           2. límite de uso por usuario  ──────►  Messages API
                                        3. llama a Claude con la imagen         (modelo con visión)
◄── { title, lyrics, chordpro } ───     4. valida y devuelve JSON     ◄──────
     │
     └─ si falla → Tesseract (ocr.web.ts / ocr.ts) como hoy
```

### Edge Function `supabase/functions/transcribe/index.ts`

- Deno + SDK oficial `@anthropic-ai/sdk` (importado como `npm:@anthropic-ai/sdk`).
- **Autenticación:** `verify_jwt = true` (el valor por defecto): solo usuarios con sesión pueden llamarla, para que nadie con la URL gaste el saldo.
- **Límite de uso:** tabla `ai_usage (user_id, day, count)` con RLS; rechazar a partir de N escaneos por día (p. ej. 50). Protege el saldo ante un bucle o un error.
- **Secreto:** `supabase secrets set ANTHROPIC_API_KEY=...` (o en el panel: *Edge Functions → Secrets*).
- **Petición a Claude:**
  - Imagen en base64 como bloque `image` (`media_type: "image/jpeg"`) seguido del texto con las instrucciones.
  - **Salida estructurada** (`output_config.format` con un esquema JSON) para recibir siempre `{ title, lyrics, chordpro, warnings }`. Nada de parsear texto libre.
  - Instrucciones clave: devolver la letra **sin acordes**; conservar estrofas y etiquetas (Coro, Estrofa); no inventar ni corregir la letra (si algo es ilegible, marcarlo `[?]` y avisarlo en `warnings`); ignorar números de página y texto ajeno a la canción.
  - `effort` bajo o medio: es transcripción, no razonamiento complejo. Medirlo con las fotos de prueba.
  - Con Claude Opus 5.5, incluir los *fallbacks* del lado del servidor (`fallbacks: "default"`) y comprobar `stop_reason` antes de leer el contenido.
- **Respuestas de error claras** (sin saldo, límite diario, imagen inválida) para que la app decida si usar el respaldo.

### Cambios en la app

| Archivo | Cambio |
|---------|--------|
| `src/lib/aiTranscribe.ts` (nuevo) | `transcribeWithAI(image)` → `supabase.functions.invoke('transcribe', …)`; devuelve `{ title, lyrics, chordpro }` o lanza error |
| `src/lib/imageTools.ts` | Reducir a lado mayor ≤ 1568 px antes de enviar (menos tokens, mismo resultado) y **pintar en blanco las zonas ignoradas** (Claude no ve las coordenadas: hay que borrarlas de la imagen) |
| `app/edit-image.tsx` | `process()`: IA primero; si falla, Tesseract + `chordFilter` como hoy, avisando *"Se usó el OCR local"* |
| `app/review.tsx` | Usar el título sugerido por la IA; guardar el ChordPro en `original_text` (columna ya existente, hoy guarda el OCR con acordes) |
| `src/state/scanSession.ts` | Añadir `engine: 'ai' | 'local'` al resultado, para mostrar con qué motor se procesó |
| `supabase/migrations/0002_ai_usage.sql` (nuevo) | Tabla `ai_usage` + RLS |

Se mantiene sin cambios: Supabase como almacenamiento, sincronización, edición, la PWA y la app nativa (la Edge Function sirve igual para ambas).

## 3. Modelo y costo

Valores de referencia (precios de la API de Anthropic consultados el 2026-10-13). Una foto de ~1500 px son unos 1.600 tokens de imagen; con instrucciones y respuesta, unos 2.000 de entrada y entre 600 y 1.500 de salida.

| Modelo | Id | Precio (entrada / salida por millón de tokens) | Costo aprox. por canción |
|--------|----|-----------------------------------------------|--------------------------|
| **Claude Opus 5.5** (el más capaz) | `claude-opus-5-5` | $4 / $20 | 2–4 centavos de dólar |
| **Claude Haiku 5.5** (el más barato) | `claude-haiku-5-5` | $0,10 / $0,50 | < 0,2 centavos |

**Decisión pendiente:** elegir el modelo después de la prueba comparativa (paso 4). Opus 5.5 es la opción por defecto. Si Haiku 5.5 da el mismo resultado con tus fotos, su costo es unas 20 veces menor. Confirmar los precios vigentes antes de decidir.

## 4. Pasos de implementación

1. [ ] **Prueba comparativa** (antes de escribir la app). Con las fotos de `samples/`, comparar Tesseract actual vs. Claude Opus 5.5 vs. Claude Haiku 5.5: texto obtenido, errores, tiempo y costo real (`usage` de la respuesta). Requiere la clave y el permiso del usuario, porque gasta unos centavos. Guardar los resultados en este documento.
2. [ ] Migración `0002_ai_usage.sql` (tabla + RLS) y aplicarla en el proyecto `cancionero-scan`.
3. [ ] Edge Function `transcribe` + secreto `ANTHROPIC_API_KEY`; desplegarla y probarla con `curl` y un JWT de prueba.
4. [ ] `imageTools`: redimensionar a ≤ 1568 px y pintar las zonas ignoradas.
5. [ ] `aiTranscribe.ts` + integración en `edit-image.tsx` con respaldo a Tesseract.
6. [ ] `review.tsx`: título de la IA, ChordPro en `original_text`, aviso del motor usado.
7. [ ] Pruebas: unitarias para la validación de la respuesta y el respaldo; manuales con las fotos de muestra en el teléfono (web) y, si se usa, en la app nativa.
8. [ ] Documentar: actualizar docs 01, 05, 06, 08, 10 y el CHANGELOG; marcar este plan como hecho.

## 5. Riesgos y decisiones abiertas

- **Privacidad:** las fotos se envían a Anthropic para transcribirlas. Para un cancionero personal es aceptable, pero queda anotado.
- **Sin conexión:** la IA necesita red; el respaldo de Tesseract cubre ese caso.
- **Saldo agotado:** la función devuelve un error claro y la app usa Tesseract; considerar un aviso en la app.
- **Letras con derechos de autor:** la IA transcribe lo que hay en la foto del cancionero del propio usuario para su uso personal, igual que el OCR actual.
- **Abierto:** ¿mostrar el ChordPro en la app (p. ej. un botón "Ver con acordes")? En el primer paso solo se guarda.
