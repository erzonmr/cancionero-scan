# 6. Sincronización y almacenamiento en la nube

## Dónde vive cada dato

| Dato | Dónde | Local en el teléfono |
|------|-------|----------------------|
| Letra, título, texto OCR | Supabase Postgres (`songs`) | No |
| Foto escaneada | Supabase Storage (`scans/<user_id>/<song_id>.jpg`, privado) | No (solo temporal durante el escaneo) |
| Sesión | Token JWT en AsyncStorage | Sí, solo el token |

## Cómo se sincroniza

`src/hooks/useSongs.ts`:

1. **Carga inicial** de todas las canciones del usuario. La lista no descarga `original_text` (el texto OCR con acordes, que puede ser largo): solo se pide al abrir una canción.
2. **Suscripción Realtime** a `postgres_changes` (INSERT, UPDATE, DELETE) sobre `songs`. Supabase aplica RLS, así que cada usuario solo recibe eventos de sus filas.
3. Cada evento se aplica a la lista en memoria; se descartan eventos con `version` menor a la que ya se tiene (llegan desordenados a veces).
4. **Reconexión**: al quedar `SUBSCRIBED` de nuevo, o cuando la app vuelve a primer plano, se recarga la lista completa. Así se recuperan cambios hechos mientras el teléfono estaba sin internet o en segundo plano.

`app/song/[id].tsx` se suscribe además a la canción abierta, de modo que si la editas en la tablet, el teléfono la actualiza al instante:

- **UPDATE** con filtro `id=eq.<id>`: solo llegan cambios de esa canción.
- **DELETE sin filtro**: Supabase Realtime **no aplica filtros a los eventos DELETE**, así que la pantalla escucha todos los borrados del usuario y compara `old.id` con la canción abierta. Con RLS activo, `old` solo trae la clave primaria, que es justo lo que se necesita. Cuando el borrado lo hace el propio dispositivo, se ignora el evento para no mostrar el aviso de "eliminada desde otro dispositivo".
- Si llega un DELETE **mientras editas**, no se cierra la pantalla (perderías lo escrito): aparece un aviso y, al guardar, se ofrece *Guardar como nueva*. *Cancelar* vuelve a la biblioteca.

## Conflictos de edición

Cada UPDATE incrementa `version` (trigger en la base de datos). Al guardar se envía:

```sql
update songs set ... where id = :id and version = :versionQueEditaste
```

- Si afecta 1 fila → guardado.
- Si afecta 0 filas → otro dispositivo guardó antes → la app muestra **"Conflicto de edición"** con dos opciones: *Descartar mis cambios* o *Sobrescribir con los míos*.
- Si afecta 0 filas **y la canción ya no existe** (se eliminó en otro dispositivo mientras editabas) → aviso **"Canción eliminada"** con *Descartar* o *Guardar como nueva*, que crea una canción nueva con tu título, tu letra y el texto OCR original (sin la foto, que ya se borró).
- Si mientras editas llega un cambio remoto, aparece un aviso amarillo y tu texto no se reemplaza.

## Eliminación

`deleteSong` borra **primero la foto** de Storage y **después** la fila. Si la foto no se puede borrar (sin conexión, error del servidor), se cancela la operación y se muestra el error: así nunca quedan fotos huérfanas ocupando espacio. Reintentar es seguro porque borrar una ruta que ya no existe no da error.

## Sin conexión

El MVP **requiere internet para guardar** (requisito: nube, no local). Sin conexión:
- El escaneo, la edición de imagen y el OCR funcionan (son en el dispositivo).
- Al pulsar *Guardar en la nube* se muestra el error y puedes reintentar cuando vuelva la señal sin perder el texto (sigues en la pantalla de revisión).

## Seguridad

- **RLS** en `songs` y en `storage.objects`: un usuario no puede leer ni modificar datos de otro aunque tenga la anon key.
- El trigger impide cambiar `user_id` y `created_at` en un UPDATE.
- Las fotos se ven con **URL firmadas** que expiran en 1 hora.
