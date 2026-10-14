# 3. Configurar Supabase

## 1. Crear el proyecto

1. Entra a https://supabase.com/dashboard → **New project**.
2. Región sugerida para Colombia: **East US (North Virginia)** (`us-east-1`), la de menor latencia.
3. Guarda la contraseña de la base de datos.

## 2. Ejecutar el esquema

1. Dashboard → **SQL Editor** → **New query**.
2. Pega el contenido completo de `supabase/migrations/0001_init.sql` → **Run**.

Esto crea:

- Tabla `public.songs` con índices.
- Trigger que actualiza `updated_at` e incrementa `version` en cada edición.
- **RLS**: cada usuario solo puede leer/escribir sus canciones.
- Publicación **Realtime** de la tabla `songs`.
- Bucket privado **`scans`** (máx. 10 MB por imagen, solo JPG/PNG) con políticas por carpeta `<user_id>/`.

El script es idempotente: puedes ejecutarlo más de una vez sin romper nada.

### Con Supabase CLI (opcional)

```powershell
npx supabase login
npx supabase link --project-ref TU_REF
npx supabase db push
```

## 3. Claves para la app

Dashboard → **Project Settings → API** (o **API Keys**):

| Variable en `.env` | Valor |
|--------------------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `anon` key o la nueva **publishable key** (`sb_publishable_...`) |

> Nunca pongas la `service_role` / secret key en la app. La seguridad la garantiza RLS.

## 4. Autenticación

Dashboard → **Authentication → Providers → Email**: habilitado por defecto.

- **Confirm email**: si está activo, al crear la cuenta llega un correo de confirmación. Para pruebas puedes desactivarlo.
- Para producción configura un SMTP propio (el de Supabase tiene límite bajo de envíos).

## 5. Verificar

1. Crea una cuenta desde la app y escanea una canción.
2. Dashboard → **Table Editor → songs**: debe aparecer la fila.
3. Dashboard → **Storage → scans**: carpeta con tu `user_id` y la foto.

## Plan gratuito: límites relevantes

Los límites cambian con el tiempo; revisa https://supabase.com/pricing. Como referencia para dimensionar: una canción ocupa ~2–5 KB de texto y ~300–800 KB de imagen JPG. El almacenamiento de imágenes es lo que más crece; si se vuelve un problema, ver la opción de "no guardar foto" en el roadmap.

Ten en cuenta que los proyectos gratuitos **se pausan tras un periodo sin actividad**; se reactivan desde el dashboard.
