import { Alert, Platform } from 'react-native';

/**
 * Diálogos que funcionan en Android/iOS y en la web.
 * En react-native-web `Alert.alert` no hace nada, así que en el navegador se usan
 * `window.alert` / `window.confirm` (nativos del navegador, bloqueantes pero fiables).
 */

const isWeb = Platform.OS === 'web';

/** Mensaje informativo con un solo botón. */
export function notify(title: string, message?: string): void {
  if (isWeb) window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Texto de un error desconocido, para mostrarlo al usuario. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface AskOptions {
  confirm: string; // botón que resuelve `true`
  cancel?: string; // botón que resuelve `false` (por defecto "Cancelar")
  destructive?: boolean; // el botón `confirm` es destructivo (rojo en iOS)
  /** false = en Android no se puede cerrar tocando fuera; obliga a elegir. */
  cancelable?: boolean;
}

/**
 * Pregunta con dos opciones. Resuelve `true` si se elige `confirm`.
 * En la web el diálogo del navegador solo tiene "Aceptar" y "Cancelar": si los
 * textos son otros, se explica qué hace cada botón al final del mensaje.
 */
export function ask(title: string, message: string, opts: AskOptions): Promise<boolean> {
  const cancel = opts.cancel ?? 'Cancelar';
  if (isWeb) {
    const legend = cancel === 'Cancelar' ? '' : `\n\nAceptar: ${opts.confirm}\nCancelar: ${cancel}`;
    return Promise.resolve(window.confirm(`${title}\n\n${message}${legend}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: opts.destructive ? 'cancel' : 'default', onPress: () => resolve(false) },
        { text: opts.confirm, style: opts.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: opts.cancelable ?? true, onDismiss: () => resolve(false) },
    );
  });
}
