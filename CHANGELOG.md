# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones según `version` en `app.json`.

## [Sin publicar]

### Planificado
- Transcripción con IA de visión en lugar de Tesseract: ver [`docs/11-plan-ocr-ia.md`](docs/11-plan-ocr-ia.md).

## [0.3.1] — 2026-10-13

### Corregido
- Web: el enlace de confirmación del correo inicia sesión automáticamente (`detectSessionInUrl` en web) y el registro pide volver a la misma app (`emailRedirectTo`). Requiere la Site URL de Supabase apuntando a la app.

## [0.3.0] — 2026-10-13

La app pasa a usarse principalmente como **PWA** (web instalable) publicada en Vercel: https://cancionero-erzon.vercel.app. La app nativa sigue compilando con el mismo código.

### Añadido
- Versión web con **Tesseract.js** como OCR en el navegador (`ocr.web.ts`) y `tesseractLines.ts` para convertir su resultado al formato de ML Kit.
- Pantalla de escaneo web (`scan.web.tsx`) con la cámara nativa del teléfono.
- `dialog.ts` (`notify` / `ask`): diálogos que funcionan en web, donde `Alert.alert` no hace nada.
- PWA: `public/index.html`, `manifest.json`, service worker (`sw.js`) e iconos; `scripts/make-icons.py` genera todos los iconos.
- `vercel.json`; proyecto Vercel enlazado a GitHub (`main` → producción, PR → vista previa).
- Proyecto Supabase `cancionero-scan` con la migración aplicada.
- Scripts `web` y `build:web`; el CI compila también la web y valida los JSON de configuración.
- Documento [`docs/10-version-web.md`](docs/10-version-web.md) y pruebas manuales W1–W8.

### Cambiado
- Detección de estrofas: además de la altura del renglón se usa el hueco típico de la página. Con Tesseract cada par acordes/letra quedaba como una estrofa aparte.
- Compartir en web copia la letra al portapapeles si el navegador no soporta compartir.
- `react-dom`, `react-native-reanimated`, `react-native-web` y `react-native-worklets` con rangos fijados a las versiones del SDK.

## [0.2.0] — 2026-10-13

Preparación para despliegue y correcciones de sincronización.

### Corregido
- **Borrado remoto no detectado con la canción abierta.** La pantalla de canción escuchaba los DELETE con un filtro por `id`, pero Supabase Realtime no filtra los DELETE, así que el aviso "Canción eliminada" nunca aparecía. Ahora escucha los DELETE sin filtro y compara el id. Si el usuario está editando, no se cierra la pantalla: se muestra un aviso para no perder lo escrito.
- **Conflicto con una canción eliminada.** Si otro dispositivo la borraba mientras se editaba, "Sobrescribir con los míos" no hacía nada. Ahora se ofrece *Descartar* o *Guardar como nueva*, sin perder lo escrito.
- **Fotos huérfanas en Storage.** Al eliminar una canción se ignoraba el error al borrar la foto. Ahora se borra primero la foto y, si falla, se cancela la eliminación.
- **`package-lock.json` desincronizado con `package.json`.** `npm ci` (y por tanto EAS Build) fallaba. Lock regenerado.
- Dependencias opcionales de `expo-router` (`react-dom`, `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`) se instalaban en versiones incompatibles con el SDK 57; ahora están fijadas a las versiones del SDK.

### Cambiado
- La biblioteca ya no descarga `original_text` de todas las canciones (solo se pide al abrir una).
- TypeScript 5.9 → 6.0 (versión esperada por el SDK 57); `@types/node` declarado explícitamente para las pruebas.
- `app.json`: eliminado `newArchEnabled` (ya no es una opción válida: la Nueva Arquitectura es obligatoria); tema fijo oscuro con `expo-system-ui`.
- `eas.json`: `appVersionSource: remote` con `autoIncrement` en `preview` y `production` (EAS gestiona el `versionCode`); perfil `submit` hacia el track *internal* de Google Play como borrador.

### Añadido
- Icono, icono adaptable de Android, splash (`expo-splash-screen`) y favicon en `assets/`.
- CI en GitHub Actions: typecheck, pruebas, `expo-doctor` y bundle de Android.
- Scripts `check`, `doctor`, `build:aab` y `submit:android`.
- Documentación de despliegue (`docs/07-compilar-apk.md`) con configuración única y checklist por versión; nuevas pruebas manuales 11–14.

## [0.1.0]

MVP inicial: escaneo con cámara o galería, editor de imagen, OCR en el dispositivo, filtro de acordes, revisión, almacenamiento en Supabase y sincronización en tiempo real.
