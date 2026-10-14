import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { useSongs } from '../src/hooks/useSongs';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme';

const STATUS_COLOR = { sincronizado: colors.ok, conectando: colors.primary, 'sin conexión': colors.danger } as const;

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Library() {
  const { songs, loading, error, status, refresh } = useSongs();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return songs;
    return songs.filter((s) => normalize(s.title).includes(q) || normalize(s.lyrics).includes(q));
  }, [songs, query]);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => supabase.auth.signOut()} hitSlop={10}>
              <Text style={{ color: colors.muted }}>Salir</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
        <Text style={styles.statusText}>
          {status === 'sincronizado' ? 'Sincronizado con la nube' : status === 'conectando' ? 'Conectando…' : 'Sin conexión'}
        </Text>
        <Text style={styles.count}>{songs.length} canciones</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por título o letra"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ? `Error: ${error}` : query ? 'Sin resultados.' : 'Aún no hay canciones. Escanea la primera página.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => router.push(`/song/${item.id}`)}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemPreview} numberOfLines={2}>
                {item.lyrics.replace(/\n+/g, ' · ')}
              </Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.fab}>
        <Button title="＋ Escanear canción" onPress={() => router.push('/scan')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: colors.muted, flex: 1 },
  count: { color: colors.muted },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    minHeight: 46,
    marginBottom: 8,
  },
  item: { paddingVertical: 14, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  itemTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  itemPreview: { color: colors.muted, marginTop: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', left: 16, right: 16, bottom: 24 },
});
