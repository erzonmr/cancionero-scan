import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { EditMode, ImageEditor } from '../src/components/ImageEditor';
import { removeChords } from '../src/lib/chordFilter';
import { cropImage, NormRect, rotateImage, ScanImage } from '../src/lib/imageTools';
import { recognizeLines } from '../src/lib/ocr';
import { linesToText } from '../src/lib/textLayout';
import { scanSession } from '../src/state/scanSession';
import { colors } from '../src/theme';

const FULL: NormRect = { x: 0, y: 0, width: 1, height: 1 };
const INITIAL_CROP: NormRect = { x: 0.04, y: 0.04, width: 0.92, height: 0.92 };

export default function EditImage() {
  const [image, setImage] = useState<ScanImage | null>(scanSession.getImage());
  const [mode, setMode] = useState<EditMode>('crop');
  const [crop, setCrop] = useState<NormRect>(INITIAL_CROP);
  const [zones, setZones] = useState<NormRect[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  if (!image) {
    return (
      <View style={[styles.root, { justifyContent: 'center', padding: 24 }]}>
        <Text style={styles.help}>No hay imagen para editar.</Text>
        <Button title="Escanear" onPress={() => router.replace('/scan')} />
      </View>
    );
  }

  async function rotate(deg: 90 | -90) {
    if (!image) return;
    setBusy('Girando…');
    try {
      const rotated = await rotateImage(image, deg);
      setImage(rotated);
      scanSession.setImage(rotated);
      setCrop(INITIAL_CROP); // al girar, el recorte y las zonas dejan de coincidir
      setZones([]);
    } finally {
      setBusy(null);
    }
  }

  async function process() {
    if (!image) return;
    try {
      setBusy('Recortando…');
      const { image: cropped, zonesPx } = await cropImage(image, crop, zones);
      setBusy('Leyendo texto…');
      const { lines } = await recognizeLines(cropped.uri);
      if (lines.length === 0) {
        Alert.alert('No se encontró texto', 'Intenta con mejor luz o acerca más la cámara.');
        return;
      }
      setBusy('Quitando acordes…');
      const originalText = linesToText(lines, zonesPx);
      const { lyrics, removedLines } = removeChords(originalText);
      scanSession.setResult({ image: cropped, originalText, lyrics, removedLines });
      router.push('/review');
    } catch (e) {
      Alert.alert('Error al procesar', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.tabs}>
        {(['crop', 'zones'] as EditMode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabActive]}>
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === 'crop' ? 'Recortar' : `Ignorar zonas${zones.length ? ` (${zones.length})` : ''}`}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.help}>
        {mode === 'crop'
          ? 'Arrastra las esquinas para dejar solo la canción.'
          : 'Dibuja rectángulos sobre lo que no se debe leer. Toca × para borrar.'}
      </Text>

      <ImageEditor
        image={image}
        mode={mode}
        crop={crop}
        zones={zones}
        onCropChange={setCrop}
        onZonesChange={setZones}
      />

      <View style={styles.tools}>
        <Button title="↺" variant="secondary" onPress={() => rotate(-90)} disabled={!!busy} style={styles.small} />
        <Button title="↻" variant="secondary" onPress={() => rotate(90)} disabled={!!busy} style={styles.small} />
        <Button
          title="Todo"
          variant="secondary"
          onPress={() => setCrop(FULL)}
          disabled={!!busy || mode !== 'crop'}
          style={styles.small}
        />
        <Button title={busy ?? 'Procesar'} onPress={process} loading={!!busy} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', margin: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface2 },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  help: { color: colors.muted, textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  tools: { flexDirection: 'row', gap: 8, padding: 12 },
  small: { paddingHorizontal: 14 },
});
