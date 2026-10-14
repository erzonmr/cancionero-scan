# Cancionero Scan — MVP

[![CI](https://github.com/erzonmr/cancionero-scan/actions/workflows/ci.yml/badge.svg)](https://github.com/erzonmr/cancionero-scan/actions/workflows/ci.yml)

App móvil (Android / iOS) para **escanear canciones de un cancionero con la cámara**, **quitar automáticamente los acordes** y **guardar solo la letra en la nube**, sincronizada entre todos tus dispositivos.

- Cámara o galería → **editor de imagen** (girar, recortar, marcar zonas a ignorar)
- OCR en el dispositivo (Google ML Kit, gratis y sin API key)
- Filtro de acordes (notación americana `G Am D/F#` y latina `Sol Lam Re/Fa#`)
- Revisión y corrección de la letra antes de guardar
- Almacenamiento **100 % en la nube** (Supabase: Postgres + Storage)
- **Sincronización en tiempo real** entre dispositivos + manejo de conflictos

## Inicio rápido

```bash
npm ci
copy .env.example .env      # y pega la URL y la key de Supabase
npm run build:dev           # genera el APK de desarrollo en la nube (EAS)
npm start                   # servidor de desarrollo
```

Antes, ejecuta `supabase/migrations/0001_init.sql` en tu proyecto Supabase.

## Despliegue

```bash
npm run check               # typecheck + pruebas (también corre en CI)
npm run build:apk           # APK para instalar sin tienda
npm run build:aab           # .aab para Google Play
npm run submit:android      # enviar a Google Play (track internal)
```

Configuración única (EAS, variables de entorno, identificador de la app) y checklist por versión: [`docs/07-compilar-apk.md`](docs/07-compilar-apk.md). Cambios: [`CHANGELOG.md`](CHANGELOG.md).

> ⚠️ No funciona en **Expo Go**: el OCR usa un módulo nativo. Necesitas un *development build* (ver `docs/02-instalacion-windows.md`).

## Documentación

Toda la documentación está en [`/docs`](docs/README.md).
