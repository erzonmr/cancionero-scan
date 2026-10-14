# 8. Pruebas y calidad

## Automáticas

```powershell
npm test           # node:test + tsx
npm run typecheck  # tsc --noEmit
npm run check      # las dos anteriores
npm run doctor     # expo-doctor
```

El CI de GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) ejecuta en cada push a `main` y en cada pull request: `npm ci`, typecheck, pruebas, `expo-doctor` y un bundle de Android (`npx expo export --platform android`) con variables de Supabase ficticias.

| Archivo | Qué cubre |
|---------|-----------|
| `tests/chordFilter.test.ts` | Acordes americanos y latinos, palabras que NO son acordes ("Dios", "mi", "Solo", "Reina"), clasificación de renglones, renglones instrumentales, tolerancia OCR, acordes en línea, canción completa con estrofas |
| `tests/textLayout.test.ts` | Unión de fragmentos del mismo renglón, orden, detección de estrofas, zonas ignoradas |

Último estado verificado (v0.2.0, 2026-10-13):

- **10/10 pruebas** pasan y typecheck sin errores (TypeScript 6.0).
- `expo-doctor`: **21/21** comprobaciones.
- El bundle de Android compila (`npx expo export --platform android`).
- `npx expo prebuild --platform android` genera el proyecto nativo con iconos y splash sin errores.

Las correcciones de sincronización de la v0.2.0 (borrado remoto con la canción abierta, conflicto con canción eliminada, borrado de foto) **solo se pueden comprobar en dispositivos reales**: son las pruebas manuales 8 y 11–14.

## Manuales (antes de cada versión)

| # | Prueba | Esperado |
|---|--------|----------|
| 1 | Crear cuenta, cerrar sesión, entrar | Llega a la biblioteca; la sesión persiste al reabrir |
| 2 | Escanear con cámara una página con acordes encima de la letra | La revisión muestra solo letra, con estrofas separadas |
| 3 | Importar desde galería una foto girada | ↻ la endereza; el OCR funciona |
| 4 | Marcar como zona el número de página y la canción vecina | No aparecen en el texto |
| 5 | Guardar | Aparece en la biblioteca; fila en `songs` y foto en Storage |
| 6 | Dos teléfonos con la misma cuenta: guardar en uno | Aparece en el otro en 1–2 s sin recargar |
| 7 | Editar la misma canción en ambos y guardar en los dos | El segundo ve "Conflicto de edición" |
| 8 | Eliminar en un teléfono con la canción abierta en el otro | El otro muestra "Canción eliminada" y vuelve |
| 9 | Modo avión → guardar | Error claro; al volver la señal, reintentar funciona |
| 10 | Buscar "senor" | Encuentra "Señor" |
| 11 | Abrir la misma canción en dos teléfonos; en A pulsar **Editar**; en B eliminarla; en A pulsar **Guardar** | A sigue en el editor con un aviso de que se eliminó; al **Guardar**, *Guardar como nueva* crea una canción nueva con el texto editado |
| 12 | Modo avión → eliminar una canción con foto | Error "No se pudo eliminar"; la canción sigue en la lista. Al volver la señal, eliminar funciona y la foto desaparece de Storage |
| 13 | Con la canción abierta (sin editar) en A, eliminarla en B | A muestra "Canción eliminada" y vuelve a la biblioteca |
| 14 | Eliminar una canción en el propio teléfono | Vuelve a la biblioteca **sin** mostrar "Se eliminó desde otro dispositivo" |
