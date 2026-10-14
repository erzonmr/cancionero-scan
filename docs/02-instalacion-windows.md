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

### 1. Clonar e instalar dependencias

```powershell
cd C:\proyectos
git clone https://github.com/erzonmr/cancionero-scan.git
cd cancionero-scan
npm ci
```

Usa `npm ci` (instala exactamente lo que dice `package-lock.json`, igual que EAS y el CI). `npm install` solo cuando agregues o actualices una dependencia; en ese caso usa `npx expo install <paquete>` para que elija la versión compatible con el SDK, y haz commit del `package-lock.json` resultante.

> **Evita carpetas sincronizadas (OneDrive, Dropbox, Google Drive).** `node_modules` tiene decenas de miles de archivos: la sincronización se vuelve lenta y puede bloquear archivos durante `npm ci` o el build (errores `EPERM`/`EBUSY`). Si el proyecto ya está en OneDrive, muévelo a una carpeta local como `C:\proyectos`, o excluye `node_modules` de la sincronización.

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
| `npm run check` | Typecheck + pruebas (lo mismo que el CI) |
| `npm run doctor` | `expo-doctor`: configuración y versiones de dependencias |
| `npm run build:dev` | APK de desarrollo (EAS) |
| `npm run build:apk` | APK de prueba para instalar/distribuir (EAS) |
| `npm run build:aab` | `.aab` para Google Play (EAS) |
| `npm run submit:android` | Envía el último `.aab` a Google Play |

## Problemas frecuentes

| Síntoma | Causa / solución |
|---------|------------------|
| `The package '@react-native-ml-kit/text-recognition' doesn't seem to be linked` | Estás en Expo Go o en un build viejo. Instala el development build (paso 4). |
| `Faltan EXPO_PUBLIC_SUPABASE_URL...` | No existe `.env` o le faltan variables. Reinicia `npm start` tras editarlo. |
| La app no conecta al PC | Usa `--tunnel` o desactiva temporalmente el firewall de Windows para Node. |
| "Invalid login credentials" | Confirma el correo (Supabase envía un enlace) o desactiva la confirmación (ver doc 3). |
| `npm ci` falla con *package.json and package-lock.json are not in sync* | Alguien editó `package.json` sin regenerar el lock. Ejecuta `npm install`, verifica con `npm run doctor` y haz commit de ambos archivos. EAS Build falla por la misma causa. |
| `EPERM` / `EBUSY` al instalar | Carpeta sincronizada con OneDrive u otro servicio; ver el aviso del paso 1. |
