import { File } from 'expo-file-system';

/** Lee un archivo local (`file://…`) para subirlo a Storage. En la web: `fileBytes.web.ts`. */
export function readFileBytes(uri: string): Promise<ArrayBuffer> {
  return new File(uri).arrayBuffer();
}
