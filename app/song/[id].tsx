import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { ConflictError, createSong, deleteSong, getScanUrl, getSong, Song, updateSong } from '../../src/lib/songs';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme';

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const [remoteDeleted, setRemoteDeleted] = useState(false);
  const editingRef = useRef(false);
  editingRef.current = editing;
  const songRef = useRef<Song | null>(null);
  songRef.current = song;
  const deletingRef = useRef(false); // true mientras ESTE dispositivo elimina la canción

  const load = useCallback(async () => {
    const s = await getSong(id);
    setSong(s);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    // Escuchar cambios de esta canción hechos desde otros dispositivos.
    const channel = supabase
      .channel(`song-${id}`)
      .on<Song>('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'songs', filter: `id=eq.${id}` }, (p) => {
        const incoming = p.new as Song;
        const cur = songRef.current;
        if (cur && incoming.version <= cur.version) return; // evento viejo o eco de mi propio guardado
        if (editingRef.current) setRemoteChanged(true); // no pisar lo que el usuario está escribiendo
        else setSong(incoming);
      })
      // Realtime no aplica filtros a los DELETE: se escuchan todos (RLS ya limita a los del
      // usuario) y se compara el id. Con RLS, `old` solo trae la clave primaria.
      .on<Song>('postgres_changes', { event: 'DELETE', schema: 'public', table: 'songs' }, (p) => {
        if ((p.old as Partial<Song>).id !== id || deletingRef.current) return;
        if (editingRef.current) return setRemoteDeleted(true); // no sacar al usuario con cambios sin guardar
        Alert.alert('Canción eliminada', 'Se eliminó desde otro dispositivo.');
        router.back();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  function startEdit() {
    if (!song) return;
    setTitle(song.title);
    setLyrics(song.lyrics);
    setRemoteChanged(false);
    setRemoteDeleted(false);
    setEditing(true);
  }

  async function save() {
    if (!song) return;
    setSaving(true);
    try {
      const updated = await updateSong(song.id, { title, lyrics }, song.version);
      setSong(updated);
      setEditing(false);
      setRemoteChanged(false);
    } catch (e) {
      if (e instanceof ConflictError && !e.latest) {
        // Se eliminó en otro dispositivo mientras se editaba: no perder lo escrito.
        Alert.alert('Canción eliminada', 'Se eliminó desde otro dispositivo mientras la editabas.', [
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
          {
            text: 'Guardar como nueva',
            onPress: async () => {
              try {
                const { song: created } = await createSong({ title, lyrics, originalText: song.original_text ?? '' });
                router.replace(`/song/${created.id}`);
              } catch (err) {
                Alert.alert('No se pudo guardar', err instanceof Error ? err.message : String(err));
              }
            },
          },
        ]);
      } else if (e instanceof ConflictError) {
        const latest = e.latest;
        Alert.alert(
          'Conflicto de edición',
          'Esta canción cambió en otro dispositivo mientras la editabas.',
          [
            { text: 'Descartar mis cambios', style: 'destructive', onPress: () => { setSong(latest); setEditing(false); } },
            {
              text: 'Sobrescribir con los míos',
              onPress: async () => {
                if (!latest) return; // no ocurre: el caso sin `latest` se maneja arriba
                try {
                  setSong(await updateSong(latest.id, { title, lyrics }, latest.version));
                  setEditing(false);
                } catch (err) {
                  Alert.alert('Error', err instanceof Error ? err.message : String(err));
                }
              },
            },
          ],
        );
      } else {
        Alert.alert('No se pudo guardar', e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!song) return;
    Alert.alert('Eliminar canción', `¿Eliminar "${song.title}" de la nube? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          deletingRef.current = true;
          try {
            await deleteSong(song);
            router.back();
          } catch (e) {
            deletingRef.current = false;
            Alert.alert('No se pudo eliminar', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  }

  async function toggleImage() {
    if (imageUrl) return setImageUrl(null);
    if (!song?.image_path) return;
    const url = await getScanUrl(song.image_path);
    if (url) setImageUrl(url);
    else Alert.alert('Imagen no disponible');
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} color={colors.primary} />;
  if (!song) {
    return (
      <View style={[styles.root, { justifyContent: 'center', padding: 24 }]}>
        <Text style={styles.muted}>La canción no existe o fue eliminada.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: editing ? 'Editando' : song.title,
          headerRight: () =>
            editing ? null : (
              <Pressable onPress={startEdit} hitSlop={10}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Editar</Text>
              </Pressable>
            ),
        }}
      />
      {editing ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
            {remoteDeleted ? (
              <Text style={styles.warning}>
                Esta canción se eliminó en otro dispositivo. Al guardar podrás conservarla como canción nueva.
              </Text>
            ) : remoteChanged && (
              <Text style={styles.warning}>
                Esta canción se modificó en otro dispositivo. Al guardar podrás elegir qué versión conservar.
              </Text>
            )}
            <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} />
            <TextInput
              style={styles.lyricsInput}
              value={lyrics}
              onChangeText={setLyrics}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
          <View style={styles.actions}>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => (remoteDeleted ? router.back() : setEditing(false))}
              disabled={saving}
            />
            <Button title="Guardar" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </KeyboardAvoidingView>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={[styles.lyrics, { fontSize, lineHeight: fontSize * 1.45 }]} selectable>
              {song.lyrics}
            </Text>
            {imageUrl && <Image source={{ uri: imageUrl }} style={styles.scan} resizeMode="contain" />}
            <Text style={styles.footer}>
              Versión {song.version} · actualizado {new Date(song.updated_at).toLocaleString()}
            </Text>
          </ScrollView>
          <View style={styles.actions}>
            <Button title="A−" variant="secondary" onPress={() => setFontSize((f) => Math.max(14, f - 2))} />
            <Button title="A+" variant="secondary" onPress={() => setFontSize((f) => Math.min(40, f + 2))} />
            {song.image_path && (
              <Button title={imageUrl ? 'Ocultar foto' : 'Ver foto'} variant="secondary" onPress={toggleImage} />
            )}
            <Button
              title="Compartir"
              variant="secondary"
              onPress={() => Share.share({ title: song.title, message: `${song.title}\n\n${song.lyrics}` })}
            />
            <Button title="🗑" variant="danger" onPress={confirmDelete} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  muted: { color: colors.muted, textAlign: 'center' },
  lyrics: { color: colors.text },
  scan: { width: '100%', height: 480, marginTop: 24, borderRadius: 8 },
  footer: { color: colors.muted, fontSize: 12, marginTop: 24 },
  warning: { color: colors.primaryText, backgroundColor: colors.primary, padding: 10, borderRadius: 10 },
  titleInput: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  lyricsInput: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    minHeight: 360,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
});
