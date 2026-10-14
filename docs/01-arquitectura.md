# 1. Arquitectura

## Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| App | **Expo SDK 57** + React Native 0.86 + TypeScript + **react-native-web** | Un solo código: **PWA en el navegador** (uso principal, publicada en Vercel) y app nativa Android/iOS opcional |
| Navegación | **expo-router** (rutas por archivos, `Stack.Protected` para el login) | Simple y declarativo |
| Cámara | Web: cámara nativa del teléfono vía **expo-image-picker** (`<input capture>`). Nativo: **expo-camera** (`CameraView`) | En web, la cámara del sistema da fotos a resolución completa |
| Edición de imagen | **expo-image-manipulator** (girar, recortar) + editor táctil propio (`PanResponder`) | Sin librerías extra |
| OCR | Web: **Tesseract.js** (WebAssembly). Nativo: **Google ML Kit** (`@react-native-ml-kit/text-recognition`) | Ambos gratis, sin API key y devuelven la posición de cada línea; Metro elige `ocr.web.ts` u `ocr.ts` según la plataforma |
| Backend | **Supabase**: Auth + Postgres + Storage + Realtime | Nube gestionada, plan gratuito, sincronización en tiempo real lista |
| Hosting web | **Vercel** (estático, `vercel.json`) | Despliegue automático en cada push a `main`; vista previa por pull request |

## Diagrama

```
 ┌──────────────── Dispositivo ─────────────────┐            ┌────────── Supabase ──────────┐
 │                                              │            │                              │
 │ Cámara/Galería                               │            │  Auth (email + contraseña)   │
 │     │ normalizeImage (EXIF, máx 2400px)      │            │                              │
 │     ▼                                        │  insert/   │  Postgres: public.songs      │
 │ Editor: girar · recortar · zonas a ignorar   │  update ──►│   RLS por user_id            │
 │     │ cropImage                              │            │   trigger version/updated_at │
 │     ▼                                        │  upload ──►│  Storage: bucket privado     │
 │ ML Kit OCR ──► líneas + rectángulos          │            │   scans/<user_id>/<id>.jpg   │
 │     ▼                                        │            │                              │
 │ textLayout: quitar zonas, agrupar renglones, │  ◄──────── │  Realtime (postgres_changes) │
 │             detectar estrofas                │  eventos   │                              │
 │     ▼                                        │            └──────────────────────────────┘
 │ chordFilter: quitar renglones de acordes     │
 │     ▼                                        │
 │ Revisión (editable) ──► Guardar en la nube   │
 └──────────────────────────────────────────────┘
```

## Decisiones clave

1. **OCR en el dispositivo y no en un servidor.** ML Kit (nativo) y Tesseract.js (web) son gratuitos y no requieren claves ni facturación. Además entrega el rectángulo de cada línea, que es lo que permite (a) ignorar zonas marcadas por el usuario y (b) reconstruir los renglones visuales donde están los acordes.
2. **Las zonas a ignorar no "pintan" la imagen**: se guardan como rectángulos y se descartan las líneas del OCR que caen dentro (>50 % de su área). La foto guardada en la nube queda intacta (recortada) para consulta.
3. **El filtro de acordes es código puro (sin React Native)**: `src/lib/chordFilter.ts` y `src/lib/textLayout.ts` se prueban con Node en milisegundos.
4. **"Nube, no local"**: las canciones y fotos solo existen en Supabase. Lo único que se guarda en el teléfono es el **token de sesión** (para no pedir contraseña cada vez) y archivos temporales de la cámara que el sistema limpia.
5. **Concurrencia optimista** con la columna `version`: si dos dispositivos editan la misma canción, el segundo en guardar recibe un aviso de conflicto en lugar de pisar los cambios en silencio.

## Estructura de carpetas

```
cancionero-scan/
├── app/                      # Pantallas (expo-router)
│   ├── _layout.tsx           # Stack + protección por sesión
│   ├── login.tsx             # Entrar / crear cuenta
│   ├── index.tsx             # Biblioteca: lista, búsqueda, estado de sincronización
│   ├── scan.tsx              # Cámara / galería (nativo)
│   ├── scan.web.tsx          # Cámara del teléfono / galería (web)
│   ├── edit-image.tsx        # Girar, recortar, zonas a ignorar → procesar
│   ├── review.tsx            # Revisar letra sin acordes → guardar en la nube
│   └── song/[id].tsx         # Ver, editar, compartir, borrar, ver foto original
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── ImageEditor.tsx   # Editor táctil de recorte y zonas
│   ├── hooks/
│   │   ├── useSession.tsx    # Estado de autenticación
│   │   └── useSongs.ts       # Lista + sincronización Realtime
│   ├── lib/
│   │   ├── supabase.ts       # Cliente
│   │   ├── dialog.ts         # notify / ask: diálogos para web y nativo
│   │   ├── fileBytes(.web).ts # Leer la foto para subirla
│   │   ├── songs.ts          # CRUD + Storage + control de versión
│   │   ├── ocr.ts            # ML Kit (nativo)
│   │   ├── ocr.web.ts        # Tesseract.js (web)
│   │   ├── tesseractLines.ts # Resultado de Tesseract → formato de ML Kit (puro)
│   │   ├── imageTools.ts     # Normalizar, girar, recortar
│   │   ├── textLayout.ts     # Líneas OCR → texto con renglones y estrofas (puro)
│   │   └── chordFilter.ts    # Quitar acordes (puro)
│   ├── state/scanSession.ts  # Escaneo en curso (memoria)
│   └── theme.ts
├── assets/                   # Icono, icono adaptable, splash, favicon
├── public/                   # PWA: index.html, manifest.json, sw.js, icons/
├── scripts/make-icons.py     # Genera todos los iconos
├── supabase/migrations/0001_init.sql
├── tests/                    # Pruebas con node:test + tsx
├── docs/                     # Esta documentación
├── .github/workflows/ci.yml  # CI: typecheck, pruebas, expo-doctor, bundle Android
├── app.json  eas.json  vercel.json  package.json  tsconfig.json  .env.example  CHANGELOG.md
```

## Modelo de datos

Tabla `public.songs`:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | |
| `user_id` | uuid → auth.users | Dueño; por defecto `auth.uid()` |
| `title` | text | |
| `lyrics` | text | Letra sin acordes (lo que se muestra y edita) |
| `original_text` | text | Texto OCR completo con acordes (respaldo para re-filtrar) |
| `image_path` | text | `scans/<user_id>/<song_id>.jpg` |
| `version` | int | Se incrementa en cada UPDATE (trigger) |
| `created_at`, `updated_at` | timestamptz | `updated_at` lo pone el trigger |
