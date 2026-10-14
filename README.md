# Cancionero Scan

[![CI](https://github.com/erzonmr/cancionero-scan/actions/workflows/ci.yml/badge.svg)](https://github.com/erzonmr/cancionero-scan/actions/workflows/ci.yml)

App para **escanear canciones de un cancionero con la cámara del teléfono**, **quitar automáticamente los acordes** y **guardar solo la letra en la nube**, sincronizada entre todos tus dispositivos.

**👉 Úsala en: https://cancionero-erzon.vercel.app**. Ábrela en el navegador del teléfono e instálala con *Agregar a pantalla principal*. No hace falta APK ni tienda.

- Cámara o galería → **editor de imagen** (girar, recortar, marcar zonas a ignorar)
- OCR gratis y sin API key: **Tesseract.js** en el navegador (versión web) o **Google ML Kit** (app nativa opcional)
- Filtro de acordes (notación americana `G Am D/F#` y latina `Sol Lam Re/Fa#`)
- Revisión y corrección de la letra antes de guardar
- Almacenamiento **100 % en la nube** (Supabase: Postgres + Storage)
- **Sincronización en tiempo real** entre dispositivos + manejo de conflictos

## Desarrollo rápido (web)

```bash
npm ci
copy .env.example .env      # URL y publishable key de Supabase
npm run web                 # abre la app en el navegador, con recarga instantánea
```

## Publicar

**Push o merge a `main` = nueva versión en producción** (Vercel, configurado en `vercel.json`). Cada pull request recibe su propia URL de vista previa. Detalles, configuración de Supabase y cómo funciona la versión web: [`docs/10-version-web.md`](docs/10-version-web.md).

```bash
npm run check               # typecheck + pruebas (también corre en CI)
npm run build:web           # build local en dist/, para revisarla
```

## App nativa (opcional)

El mismo código compila como app de Android/iOS con EAS (`npm run build:apk`). No es necesaria para usar la app: [`docs/07-compilar-apk.md`](docs/07-compilar-apk.md).

## Documentación

Toda la documentación está en [`/docs`](docs/README.md). Cambios: [`CHANGELOG.md`](CHANGELOG.md).
