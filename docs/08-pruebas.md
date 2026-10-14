# 8. Pruebas y calidad

## Automáticas

```powershell
npm test           # node:test + tsx
npm run typecheck  # tsc --noEmit
```

| Archivo | Qué cubre |
|---------|-----------|
| `tests/chordFilter.test.ts` | Acordes americanos y latinos, palabras que NO son acordes ("Dios", "mi", "Solo", "Reina"), clasificación de renglones, renglones instrumentales, tolerancia OCR, acordes en línea, canción completa con estrofas |
| `tests/textLayout.test.ts` | Unión de fragmentos del mismo renglón, orden, detección de estrofas, zonas ignoradas |

Estado al entregar el MVP: **10/10 pruebas pasan**, typecheck sin errores y el bundle de Android compila (`npx expo export --platform android`).

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
