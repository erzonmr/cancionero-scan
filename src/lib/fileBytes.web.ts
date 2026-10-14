/** En el navegador las imágenes son URLs `blob:` o `data:`; `fetch` las lee directamente. */
export async function readFileBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return res.arrayBuffer();
}
