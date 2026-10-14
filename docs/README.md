# Documentación — Cancionero Scan

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [Arquitectura](01-arquitectura.md) | Stack, diagrama, decisiones técnicas y estructura de carpetas |
| 2 | [Instalación en Windows](02-instalacion-windows.md) | Requisitos, instalación, ejecutar en tu celular |
| 3 | [Configurar Supabase](03-supabase.md) | Crear proyecto, ejecutar el SQL, claves, autenticación |
| 4 | [Flujo de uso](04-flujo-de-uso.md) | Escanear, editar imagen, revisar, guardar, editar |
| 5 | [Filtro de acordes](05-filtro-de-acordes.md) | Cómo se detectan y quitan los acordes; cómo ajustarlo |
| 6 | [Sincronización](06-sincronizacion.md) | Tiempo real, reconexión, conflictos, seguridad |
| 7 | [Compilar y desplegar](07-compilar-apk.md) | Configuración única, checklist por versión, APK, Play Store, iOS, iconos |
| 8 | [Pruebas y calidad](08-pruebas.md) | Tests automáticos, CI y lista de pruebas manuales |
| 9 | [Limitaciones y roadmap](09-roadmap.md) | Qué no hace el MVP y siguientes pasos |

## Resumen en una línea

**Foto → (girar / recortar / zonas a ignorar) → OCR en el dispositivo → reconstrucción de renglones → filtro de acordes → revisión → Supabase (Postgres + Storage) → Realtime a todos tus dispositivos.**

Historial de cambios: [`CHANGELOG.md`](../CHANGELOG.md).
