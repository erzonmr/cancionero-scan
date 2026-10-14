# 9. Limitaciones del MVP y roadmap

## Limitaciones conocidas

- **No funciona en Expo Go** (módulo nativo de OCR); requiere development build.
- **Requiere internet para guardar.** No hay cola offline (por diseño: nube, no local).
- **Una página por canción.** Canciones que ocupan dos páginas se guardan como dos escaneos o se pega el texto a mano al editar.
- **Sin corrección de perspectiva** automática: si la foto está muy inclinada, el OCR baja de calidad. El recorte es rectangular.
- **OCR alfabeto latino** (español, inglés, portugués). Letra manuscrita: resultados pobres.
- El filtro puede quitar un renglón de letra de **una sola palabra** que coincida con un acorde ("Sol"). El texto original queda guardado.
- Sin compartir cancioneros entre cuentas distintas.
- **El escaneo en curso vive solo en memoria.** Si Android cierra la app mientras está en segundo plano (p. ej. al abrir la galería en un teléfono con poca RAM), se pierde ese escaneo y hay que repetirlo. Lo ya guardado en la nube no se ve afectado.
- **Tema solo oscuro** (`userInterfaceStyle: "dark"`): la app no sigue el modo claro del sistema.
- `@react-native-ml-kit/text-recognition` no está marcado como probado en la Nueva Arquitectura en React Native Directory. Funciona mediante la capa de compatibilidad; se excluyó de ese aviso de `expo-doctor` en `package.json`. Vigilarlo al actualizar el SDK.

## Siguientes pasos sugeridos

| Prioridad | Mejora | Notas técnicas |
|-----------|--------|----------------|
| Alta | Escaneo de **varias páginas** por canción | Array de imágenes en Storage, concatenar textos |
| Alta | **Detección de bordes y corrección de perspectiva** | `react-native-document-scanner-plugin` (usa el escáner nativo de Google/Apple) |
| Alta | **Setlists / listas para el culto** | Tabla `setlists` + `setlist_songs (position)` |
| Media | **Cancioneros compartidos** con el equipo de alabanza | Tabla `songbooks` + `songbook_members (role)`; ajustar RLS |
| Media | Opción "no guardar la foto" para ahorrar espacio | Columna booleana en ajustes |
| Media | Modo presentación / proyección (pantalla completa, desplazamiento automático) | |
| Media | Exportar a `.txt` / `.pdf` / ChordPro (letra sola) | expo-sharing + expo-print |
| Baja | OCR en la nube como respaldo (Google Vision vía Edge Function) | Para fotos difíciles; requiere facturación |
| Baja | Historial de versiones de cada canción | Tabla `song_revisions` llenada por trigger |
| Baja | Búsqueda de texto completo en el servidor | `tsvector` + índice GIN en `lyrics` |
