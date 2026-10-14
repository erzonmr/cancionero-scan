import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env (ver docs/03-supabase.md).',
  );
}

/**
 * Cliente único de Supabase.
 * AsyncStorage solo guarda el token de sesión (para no pedir login cada vez);
 * las canciones y las imágenes viven exclusivamente en la nube.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // En la web, el enlace de confirmación del correo vuelve a la app con la sesión en la URL
    // (#access_token=…): leerla deja al usuario dentro sin volver a escribir la contraseña.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Refrescar el token solo mientras la app está en primer plano (recomendación oficial para RN).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export const SCANS_BUCKET = 'scans';
