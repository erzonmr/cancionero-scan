# Documentación — Cancionero Scan

> **¿Empiezas?** Lee primero [10 · Versión web](10-version-web.md): es como se usa y se publica la app. La app nativa (doc 7) es opcional.

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [Arquitectura](01-arquitectura.md) | Stack, diagrama, decisiones técnicas y estructura de carpetas |
| 2 | [Instalación en Windows](02-instalacion-windows.md) | Requisitos, instalación, ejecutar en tu celular |
| 3 | [Configurar Supabase](03-supabase.md) | Crear proyecto, ejecutar el SQL, claves, autenticación |
| 4 | [Flujo de uso](04-flujo-de-uso.md) | Escanear, editar imagen, revisar, guardar, editar |
| 5 | [Filtro de acordes](05-filtro-de-acordes.md) | Cómo se detectan y quitan los acordes; cómo ajustarlo |
| 6 | [Sincronización](06-sincronizacion.md) | Tiempo real, reconexión, conflictos, seguridad |
| 7 | [App nativa (opcional)](07-compilar-apk.md) | Compilar APK / Play Store / iOS con EAS, checklist por versión, iconos |
| 8 | [Pruebas y calidad](08-pruebas.md) | Tests automáticos, CI y lista de pruebas manuales |
| 9 | [Limitaciones y roadmap](09-roadmap.md) | Qué no hace el MVP y siguientes pasos |
| 10 | [**Versión web (PWA)**](10-version-web.md) | **Forma principal de uso**: instalar en el teléfono, publicar en Vercel, configuración de Supabase, OCR en el navegador |

## Resumen en una línea

**Foto → (girar / recortar / zonas a ignorar) → OCR (Tesseract.js en web / ML Kit en nativo) → reconstrucción de renglones → filtro de acordes → revisión → Supabase (Postgres + Storage) → Realtime a todos tus dispositivos.**

Historial de cambios: [`CHANGELOG.md`](../CHANGELOG.md).
