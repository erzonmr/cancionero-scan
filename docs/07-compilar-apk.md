# 7. Compilar y distribuir

## APK de prueba (instalar en varios celulares)

```powershell
npm run build:apk        # eas build -p android --profile preview
```

EAS entrega un enlace de descarga del `.apk`. Compártelo con el equipo de alabanza; cada uno lo instala y crea su cuenta (o usan la misma cuenta para compartir el cancionero).

### Variables de entorno para builds (obligatorio)

`.env` **no se sube** a EAS (está en `.gitignore`). El development build no lo necesita (toma el JS de tu PC), pero el APK de prueba y el de producción sí. Regístralas una vez:

```powershell
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://TU-PROYECTO.supabase.co --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value TU_KEY --environment preview --environment production --visibility plaintext
```

(O en expo.dev → tu proyecto → **Environment variables**.) `eas.json` ya asigna cada perfil a su entorno.

## Play Store

```powershell
eas build -p android --profile production   # genera .aab
eas submit -p android
```

Necesitas una cuenta de Google Play Console (pago único). Cambia `android.package` en `app.json` por un identificador propio antes del primer envío; luego no se puede cambiar.

## iOS

```powershell
eas build -p ios --profile preview
```

Requiere cuenta Apple Developer (anual). Desde Windows funciona porque EAS compila en Mac en la nube. Cambia `ios.bundleIdentifier` en `app.json`.

## Versionado

Sube `version` en `app.json` (y `android.versionCode` cuando publiques en Play Store) en cada versión.
