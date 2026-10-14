# 7. Compilar y desplegar

Todo se compila en la nube con **EAS Build**, así que funciona desde Windows sin Android Studio ni Mac.

| Perfil (`eas.json`) | Comando | Resultado | Para qué |
|---------------------|---------|-----------|----------|
| `development` | `npm run build:dev` | `.apk` con dev client | Desarrollar: el JS se carga desde tu PC |
| `preview` | `npm run build:apk` | `.apk` instalable | Probar con el equipo / distribuir sin tienda |
| `production` | `npm run build:aab` | `.aab` | Subir a Google Play |

## 1. Configuración única (una sola vez)

### 1.1 Supabase

1. Ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor (ver [03-supabase.md](03-supabase.md)).
2. En producción configura un **SMTP propio** en *Authentication → Emails*; el de Supabase tiene un límite muy bajo de correos por hora y los usuarios no recibirían el enlace de confirmación.

### 1.2 Expo / EAS

```powershell
npm install -g eas-cli
eas login
eas init        # crea el proyecto en expo.dev y agrega extra.eas.projectId a app.json → haz commit de ese cambio
```

### 1.3 Variables de entorno de los builds (obligatorio)

`.env` **no se sube** (está en `.gitignore`). El development build no lo necesita (toma el JS de tu PC), pero el APK de prueba y el de producción **sí**: sin ellas la app se cierra al abrir con el error *Faltan EXPO_PUBLIC_SUPABASE_URL*.

```powershell
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://TU-PROYECTO.supabase.co --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value TU_KEY --environment preview --environment production --visibility plaintext
```

(O en expo.dev → tu proyecto → **Environment variables**.) `eas.json` ya asigna cada perfil a su entorno. Ambas claves son públicas por diseño: la seguridad la dan las políticas RLS, no el secreto de la key.

### 1.4 Identificador de la app

`android.package` e `ios.bundleIdentifier` son `com.cancionero.scan`. **Cámbialos por uno propio** (p. ej. `com.tuiglesia.cancionero`) antes del primer envío a Play Store: después no se pueden cambiar.

## 2. Antes de cada versión

```powershell
npm run check      # typecheck + pruebas
npm run doctor     # expo-doctor: configuración y versiones de dependencias
```

GitHub Actions ejecuta lo mismo (más un bundle de Android) en cada push y pull request: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). No publiques si el CI está en rojo.

Luego:

1. Sube `version` en `app.json` (versión visible, p. ej. `0.2.0` → `0.3.0`) y anota los cambios en [`CHANGELOG.md`](../CHANGELOG.md).
2. Haz las [pruebas manuales](08-pruebas.md#manuales-antes-de-cada-versión) con un APK `preview`.
3. Compila y publica (secciones 3 y 4).

### Versionado

`eas.json` usa `"appVersionSource": "remote"` y `autoIncrement` en `preview` y `production`: **EAS lleva el `versionCode` de Android** (el número interno que Play Store exige que siempre suba) y lo incrementa solo en cada build. Tú solo cambias `version` en `app.json`.

Si en algún momento necesitas fijarlo a mano: `eas build:version:set -p android`.

## 3. APK de prueba (sin tienda)

```powershell
npm run build:apk
```

EAS entrega un enlace de descarga del `.apk`. Compártelo con el equipo de alabanza; cada uno lo instala (acepta "instalar apps de origen desconocido") y crea su cuenta.

## 4. Google Play

Requisitos: cuenta de **Google Play Console** (pago único) y la app creada en la consola con el mismo `android.package`.

```powershell
npm run build:aab          # eas build -p android --profile production
npm run submit:android     # eas submit -p android --profile production
```

- El **primer** `.aab` hay que subirlo **a mano** en Play Console (requisito de Google). Desde el segundo, `submit:android` lo sube solo.
- Para el envío automático EAS necesita una **clave de cuenta de servicio** de Google (JSON). Se configura una vez con `eas credentials` → Android → *Google Service Account*. No la guardes en el repositorio.
- `eas.json` envía al track **internal** como **borrador**: revisas y promueves a producción desde Play Console.
- Play Store pide además política de privacidad (la app guarda correo, letras y fotos en Supabase) y el formulario de *Seguridad de los datos*.

## 5. iOS

```powershell
eas build -p ios --profile preview
```

Requiere cuenta Apple Developer (anual). Desde Windows funciona porque EAS compila en Mac en la nube. Cambia `ios.bundleIdentifier` en `app.json`. `ITSAppUsesNonExemptEncryption: false` ya está declarado (solo HTTPS estándar), así que App Store Connect no pregunta por cifrado en cada envío.

## 6. Iconos y pantalla de inicio

| Archivo | Uso |
|---------|-----|
| `assets/icon.png` (1024×1024) | Icono de iOS y respaldo de Android |
| `assets/adaptive-icon.png` | Primer plano del icono adaptable de Android (fondo `#0f1115`) |
| `assets/splash-icon.png` | Pantalla de inicio (plugin `expo-splash-screen`) |
| `assets/favicon.png` | Web |

Para reemplazarlos basta con sobrescribir los PNG con el mismo tamaño. Cambiar iconos o `app.json` requiere un build nuevo; no llega por recarga de JS.
