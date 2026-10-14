import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { removeChords } from '../src/lib/chordFilter';
import { errorMessage, notify } from '../src/lib/dialog';
import { createSong } from '../src/lib/songs';
import { scanSession } from '../src/state/scanSession';
import { colors } from '../src/theme';

/** Sugerencia de título: primer renglón no vacío que no sea una etiqueta tipo "Coro:". */
function suggestTitle(lyrics: string): string {
  const first = lyrics.split('\n').map((l) => l.trim()).find((l) => l && !/^(coro|estrofa|verso|puente)\b/i.test(l));
  return (first ?? '').slice(0, 60);
}

export default function Review() {
  const result = scanSession.getResult();
  const [title, setTitle] = useState(() => (result ? suggestTitle(result.lyrics) : ''));
  const [lyrics, setLyrics] = useState(result?.lyrics ?? '');
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!result) {
    return (
      <View style={[styles.root, { justifyContent: 'center', padding: 24 }]}>
        <Text style={styles.meta}>No hay un escaneo en curso.</Text>
        <Button title="Ir al inicio" onPress={() => router.replace('/')} />
      </View>
    );
  }
  const scan = result;

  async function save() {
    if (!lyrics.trim()) return notify('Letra vacía', 'No hay texto para guardar.');
    setSaving(true);
    try {
      const { song, imageError } = await createSong({
        title,
        lyrics,
        originalText: scan.originalText,
        imageUri: scan.image.uri,
      });
      scanSession.clear();
      if (imageError) notify('Letra guardada', `La imagen no se pudo subir: ${imageError}`);
      router.dismissAll();
      router.push(`/song/${song.id}`);
    } catch (e) {
      notify('No se pudo guardar en la nube', errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.meta}>
            Se quitaron {scan.removedLines} renglones de acordes. Revisa y corrige la letra antes de guardar.
          </Text>
          <TextInput
            style={styles.title}
            value={title}
            onChangeText={setTitle}
            placeholder="Título de la canción"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.lyrics}
            value={lyrics}
            onChangeText={setLyrics}
            multiline
            textAlignVertical="top"
            placeholder="Letra"
            placeholderTextColor={colors.muted}
          />
          <Pressable onPress={() => setShowOriginal((v) => !v)}>
            <Text style={styles.link}>{showOriginal ? 'Ocultar' : 'Ver'} texto original del OCR (con acordes)</Text>
          </Pressable>
          {showOriginal && (
            <View style={styles.original}>
              <Text style={styles.originalText} selectable>
                {scan.originalText}
              </Text>
              <Button
                title="Volver a filtrar desde el original"
                variant="secondary"
                onPress={() => setLyrics(removeChords(scan.originalText).lyrics)}
              />
            </View>
          )}
        </ScrollView>
        <View style={styles.actions}>
          <Button title="Repetir" variant="secondary" onPress={() => router.back()} disabled={saving} />
          <Button title="Guardar en la nube" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  meta: { color: colors.muted },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  lyrics: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    minHeight: 320,
  },
  link: { color: colors.primary, paddingVertical: 6 },
  original: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 10 },
  originalText: { color: colors.muted, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, padding: 12 },
});
