import { File } from 'expo-file-system';
import { SCANS_BUCKET, supabase } from './supabase';

export interface Song {
  id: string;
  user_id: string;
  title: string;
  lyrics: string;
  original_text: string | null;
  image_path: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/** Se lanza cuando otro dispositivo modificó la canción antes de guardar. */
export class ConflictError extends Error {
  constructor(public latest: Song | null) {
    super('La canción fue modificada en otro dispositivo.');
    this.name = 'ConflictError';
  }
}

/** Lo que necesita la biblioteca: sin `original_text`, que puede ser largo y solo se usa al abrir una canción. */
export type SongSummary = Omit<Song, 'original_text'>;

const LIST_COLUMNS = 'id,user_id,title,lyrics,image_path,version,created_at,updated_at';
const COLUMNS = `${LIST_COLUMNS},original_text`;

export async function listSongs(): Promise<SongSummary[]> {
  const { data, error } = await supabase.from('songs').select(LIST_COLUMNS).order('updated_at', { ascending: false });
  if (error) throw error;
  return data as SongSummary[];
}

export async function getSong(id: string): Promise<Song | null> {
  const { data, error } = await supabase.from('songs').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Song | null;
}

async function uploadScan(userId: string, songId: string, imageUri: string): Promise<string> {
  const path = `${userId}/${songId}.jpg`;
  const bytes = await new File(imageUri).arrayBuffer();
  const { error } = await supabase.storage
    .from(SCANS_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/**
 * Crea la canción en la nube: 1) inserta la fila, 2) sube la imagen a Storage,
 * 3) guarda la ruta de la imagen. Si la subida falla, la canción queda guardada
 * igual (la letra es lo importante) y se informa el error.
 */
export async function createSong(input: {
  title: string;
  lyrics: string;
  originalText: string;
  imageUri?: string;
}): Promise<{ song: Song; imageError?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

  const { data, error } = await supabase
    .from('songs')
    .insert({ title: input.title.trim() || 'Sin título', lyrics: input.lyrics, original_text: input.originalText })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  let song = data as Song;

  if (!input.imageUri) return { song };
  try {
    const path = await uploadScan(auth.user.id, song.id, input.imageUri);
    const upd = await supabase.from('songs').update({ image_path: path }).eq('id', song.id).select(COLUMNS).single();
    if (upd.error) throw upd.error;
    song = upd.data as Song;
    return { song };
  } catch (e) {
    return { song, imageError: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Guarda cambios con control de concurrencia optimista: solo actualiza si la
 * versión en la nube sigue siendo la que el usuario editó. Si no, ConflictError.
 */
export async function updateSong(id: string, changes: { title: string; lyrics: string }, expectedVersion: number) {
  const { data, error } = await supabase
    .from('songs')
    .update({ title: changes.title.trim() || 'Sin título', lyrics: changes.lyrics })
    .eq('id', id)
    .eq('version', expectedVersion)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ConflictError(await getSong(id));
  return data as Song;
}

/**
 * Elimina primero la foto y después la fila. Si la foto no se puede borrar se
 * aborta, para no dejar archivos huérfanos ocupando espacio en Storage (borrar
 * una ruta que ya no existe no es un error, así que reintentar es seguro).
 */
export async function deleteSong(song: Song): Promise<void> {
  if (song.image_path) {
    const { error } = await supabase.storage.from(SCANS_BUCKET).remove([song.image_path]);
    if (error) throw error;
  }
  const { error } = await supabase.from('songs').delete().eq('id', song.id);
  if (error) throw error;
}

/** URL firmada temporal (1 h) para ver la imagen original; el bucket es privado. */
export async function getScanUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(SCANS_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
