# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones según `version` en `app.json`.

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
