# 9. Limitaciones del MVP y roadmap

## Limitaciones conocidas

- **App nativa:** no funciona en Expo Go (módulo nativo de OCR); requiere development build. La versión web no tiene esta limitación.
- **OCR web algo menos preciso que ML Kit.** Tesseract puede confundir acordes en fotos borrosas (p. ej. `C` → `Cc`); ese renglón no se reconoce como acordes y hay que borrarlo en la revisión. La primera vez descarga ~10 MB.
- **Diálogos en la web**: son los del navegador (`window.confirm`), solo con *Aceptar* / *Cancelar*. Cuando las opciones son otras (conflicto de edición), el mensaje explica qué hace cada botón.
- **Registro abierto**: cualquiera con la URL puede crear una cuenta (aunque nunca ve tus datos). Desactiva los registros en Supabase cuando tengas las cuentas que necesitas ([10-version-web.md](10-version-web.md)).
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
| ⏳ **Siguiente** | **Transcripción con IA de visión (Claude)** como motor principal, con Tesseract de respaldo | Decidido el 2026-10-13 porque Tesseract no da buenos resultados con fotos reales. Plan completo: [11-plan-ocr-ia.md](11-plan-ocr-ia.md) |
| Alta | **Detección de bordes y corrección de perspectiva** | Web: OpenCV.js o jscanify. Nativo: `react-native-document-scanner-plugin` |
| Alta | **Setlists / listas para el culto** | Tabla `setlists` + `setlist_songs (position)` |
| Media | **Cancioneros compartidos** con el equipo de alabanza | Tabla `songbooks` + `songbook_members (role)`; ajustar RLS |
| Media | Opción "no guardar la foto" para ahorrar espacio | Columna booleana en ajustes |
| Media | Modo presentación / proyección (pantalla completa, desplazamiento automático) | |
| Media | Exportar a `.txt` / `.pdf` / ChordPro (letra sola) | expo-sharing + expo-print |
| Media | Modo sin conexión para **leer** canciones ya guardadas | Caché de la lista en IndexedDB |
| Baja | Diálogos propios en web en lugar de `window.confirm` | Componente modal con botones con nombre |
| Baja | Historial de versiones de cada canción | Tabla `song_revisions` llenada por trigger |
| Baja | Búsqueda de texto completo en el servidor | `tsvector` + índice GIN en `lyrics` |
