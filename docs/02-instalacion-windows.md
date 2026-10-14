# 2. Instalación en Windows

## Requisitos

| Herramienta | Versión | Notas |
|-------------|---------|-------|
| Node.js | 20 LTS o 22 LTS | https://nodejs.org |
| Git | cualquiera | opcional pero recomendado |
| Cuenta Expo | gratis | https://expo.dev/signup — para compilar en la nube |
| Cuenta Supabase | gratis | https://supabase.com |
| Celular Android | Android 8+ | O emulador de Android Studio |

> **Importante:** esta app **no corre en Expo Go** porque el OCR (ML Kit) es un módulo nativo. Se usa un **development build**: un APK propio que funciona igual que Expo Go pero incluye ML Kit. Se compila una sola vez y luego el código JS se recarga en caliente.

## Pasos

### 1. Descomprimir e instalar dependencias

```powershell
cd C:\proyectos
# descomprime cancionero-scan.zip aquí
cd cancionero-scan
npm install
```

### 2. Configurar Supabase

Sigue [03-supabase.md](03-supabase.md) y luego:

```powershell
copy .env.example .env
notepad .env
```

Pega `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Instalar EAS CLI e iniciar sesión

```powershell
npm install -g eas-cli
eas login
eas init          # vincula el proyecto a tu cuenta Expo (agrega projectId a app.json)
```

### 4. Compilar el development build (una sola vez)

```powershell
npm run build:dev
```

Tarda ~10–15 min en los servidores de Expo. Al terminar te da un enlace/QR: ábrelo en el celular e instala el APK (acepta "instalar apps de origen desconocido").

> Vuelve a compilar el build **solo** si agregas/actualizas una librería nativa o cambias `app.json`. Los cambios en archivos `.ts/.tsx` no lo requieren.

### 5. Ejecutar

```powershell
npm start
```

Abre la app instalada en el celular (mismo Wi-Fi que el PC) y escanea el QR, o escribe la URL que muestra la terminal. Si la red de tu iglesia/casa bloquea la conexión, usa:

```powershell
npx expo start --dev-client --tunnel
```

## Alternativa: compilar localmente (sin EAS)

Requiere **Android Studio** (SDK 35+, JDK 17) y variable `ANDROID_HOME`:

```powershell
npx expo prebuild --platform android
npm run android
```

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm start` | Servidor de desarrollo |
| `npm test` | Pruebas del filtro de acordes y del armado de renglones |
| `npm run typecheck` | Verificación de tipos TypeScript |
| `npm run build:dev` | APK de desarrollo (EAS) |
| `npm run build:apk` | APK de prueba para instalar/distribuir (EAS) |

## Problemas frecuentes

| Síntoma | Causa / solución |
|---------|------------------|
| `The package '@react-native-ml-kit/text-recognition' doesn't seem to be linked` | Estás en Expo Go o en un build viejo. Instala el development build (paso 4). |
| `Faltan EXPO_PUBLIC_SUPABASE_URL...` | No existe `.env` o le faltan variables. Reinicia `npm start` tras editarlo. |
| La app no conecta al PC | Usa `--tunnel` o desactiva temporalmente el firewall de Windows para Node. |
| "Invalid login credentials" | Confirma el correo (Supabase envía un enlace) o desactiva la confirmación (ver doc 3). |
