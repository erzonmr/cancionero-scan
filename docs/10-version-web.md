# 10. Versión web (PWA) — forma principal de uso

Cancionero Scan se usa principalmente como **app web instalable (PWA)**: se abre en el navegador del teléfono, se instala con "Agregar a pantalla principal" y funciona como una app más, sin APK, sin tienda y sin builds en la nube. Cada cambio que se sube a `main` se publica solo.

La app nativa (`.apk`) sigue siendo posible con el mismo código ([07-compilar-apk.md](07-compilar-apk.md)), pero es opcional.

## Dónde está

| | |
|---|---|
| **App** | **https://cancionero-erzon.vercel.app** — Vercel, proyecto `cancionero-scan` (equipo *Erzon's projects*) |
| **Base de datos** | Supabase, proyecto `cancionero-scan` (`rtvqztntgnuzcbgnnomm`, región us-east-1, plan gratuito) |
| **Código** | GitHub `erzonmr/cancionero-scan`, rama `main` → producción; cada pull request → URL de vista previa |

## Instalar en el teléfono

**Android (Chrome):** abre la URL → menú ⋮ → **Instalar app** (o *Agregar a pantalla principal*).
**iPhone (Safari):** abre la URL → botón Compartir → **Agregar a pantalla de inicio**.

La primera vez que escaneas, la app descarga el motor de OCR y los idiomas (~10 MB, una sola vez; después quedan en la caché del navegador).

## Desarrollar

```powershell
npm ci
npm run web          # abre la app en el navegador con recarga instantánea
```

Usa el mismo `.env` que la app nativa (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

Para probar en el **teléfono** durante el desarrollo, la cámara del navegador exige HTTPS. Lo más simple es subir la rama y abrir la **URL de vista previa** que Vercel comenta en el pull request.

## Publicar

No hay que hacer nada especial: **push (o merge) a `main` = nueva versión en producción.** Vercel ejecuta `npm ci` y `npm run build:web` (configurado en [`vercel.json`](../vercel.json)) con las variables de entorno del proyecto.

Los teléfonos que ya tienen la app instalada reciben la versión nueva la **siguiente vez que la abren** (el service worker pide siempre el `index.html` a la red primero).

Build local, para revisar el resultado:

```powershell
npm run build:web    # genera dist/ (usa --clear para no arrastrar variables de una build anterior)
npx serve -s dist    # sirve dist/ en http://localhost:3000
```

### Variables de entorno en Vercel

`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` ya están creadas para *Production*, *Preview* y *Development* (Vercel → proyecto → *Settings → Environment Variables*). Si cambias de proyecto de Supabase, actualízalas y **vuelve a desplegar**: se incrustan en el JS durante la build.

## Configuración de Supabase pendiente (hazlo una vez)

En el panel de Supabase → proyecto `cancionero-scan` → **Authentication**:

1. **URL Configuration → Site URL**: pon `https://cancionero-erzon.vercel.app`. El enlace del correo de confirmación de cuenta lleva ahí (por defecto apunta a `localhost`).
2. **Sign In / Providers → Email**: como es una app personal, puedes desactivar **Confirm email** para no depender del correo.
3. **Después de crear tu cuenta** (y las de quien quieras invitar): desactiva **Allow new users to sign up**. La URL es pública; sin esto, cualquiera que la encuentre podría crear una cuenta y subir fotos a tu Storage. Tus datos están protegidos por RLS de todas formas: otra cuenta nunca ve tus canciones.

## Cómo funciona por dentro

| Pieza | En la web | En Android/iOS |
|-------|-----------|----------------|
| OCR | **Tesseract.js** (WebAssembly, en el navegador) — `src/lib/ocr.web.ts` | Google ML Kit — `src/lib/ocr.ts` |
| Cámara | Cámara nativa del teléfono vía `<input capture>` — `app/scan.web.tsx` | `expo-camera` con visor propio — `app/scan.tsx` |
| Diálogos | `window.alert` / `window.confirm` — `src/lib/dialog.ts` | `Alert.alert` |
| Leer la foto para subirla | `fetch(blob:)` — `src/lib/fileBytes.web.ts` | `expo-file-system` — `src/lib/fileBytes.ts` |

Metro elige automáticamente el archivo `.web.ts(x)` al compilar para la web. El resto del código (filtro de acordes, armado de renglones, Supabase, pantallas) es el mismo.

- **Tesseract.js** carga el worker, el núcleo WASM y los idiomas `spa` + `eng` desde el CDN de jsDelivr, y los guarda en IndexedDB. `src/lib/tesseractLines.ts` convierte su resultado (bloques → párrafos → líneas con `bbox`) al formato de ML Kit, así `textLayout` y `chordFilter` no cambian.
- **Por qué la cámara nativa y no un visor en vivo:** el `<input capture>` abre la app de cámara del sistema, con resolución completa, enfoque y flash. Un visor con `getUserMedia` entrega fotogramas de vídeo de menor resolución, y eso empeora mucho el OCR.
- **Diálogos:** en react-native-web `Alert.alert` no hace nada. `dialog.ts` usa los del navegador. Como esos solo tienen "Aceptar" y "Cancelar", cuando las opciones son otras se explica al final del mensaje qué hace cada botón (p. ej. en un conflicto de edición).
- **Service worker** (`public/sw.js`): red primero para abrir la app, caché para los archivos con hash. No guarda canciones: viven en Supabase. Solo se registra en producción (no en `localhost`).

## Calidad del OCR en la web

Tesseract es **algo menos preciso que ML Kit** con fotos de teléfono. Medido con una página de prueba (acordes sobre la letra, foto ligeramente desenfocada y girada): lee bien toda la letra y los acordes en ~2 s en Chrome, pero confundió una vez `C` con `Cc`, y ese renglón de acordes no se quitó. La pantalla de revisión permite corregirlo antes de guardar.

Para mejores resultados: buena luz pareja, página plana, foto de frente y recortar solo la canción. Si la calidad no alcanza con tus cancioneros, el siguiente paso previsto es un OCR en la nube como respaldo ([09-roadmap.md](09-roadmap.md)).
