import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { errorMessage, notify } from '../src/lib/dialog';
import { normalizeImage } from '../src/lib/imageTools';
import { scanSession } from '../src/state/scanSession';
import { colors } from '../src/theme';

/**
 * Escanear en la web (PWA). En lugar de un visor de cámara en vivo se usa la
 * cámara nativa del teléfono (`<input capture>`): da la foto a resolución
 * completa, con enfoque y flash del sistema, que es lo que más mejora el OCR.
 * En Android/iOS nativo se usa `scan.tsx` (expo-camera).
 */
export default function ScanWeb() {
  const [busy, setBusy] = useState(false);

  async function pick(source: 'camera' | 'gallery') {
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, cameraType: ImagePicker.CameraType.back })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled || !res.assets[0]) return;
    setBusy(true);
    try {
      const a = res.assets[0];
      const img = await normalizeImage(a.uri, a.width, a.height);
      scanSession.setImage(img);
      router.replace('/edit-image');
    } catch (e) {
      notify('No se pudo abrir la imagen', errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Escanear canción</Text>
        <Text style={styles.tips}>
          • Buena luz, sin sombras de la mano ni del teléfono.{'\n'}• La página lo más plana y derecha posible.{'\n'}• Encuadra
          solo una canción; lo demás se puede recortar después.
        </Text>
        {busy ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <Button title="📷  Tomar foto" onPress={() => pick('camera')} />
            <Button title="🖼  Elegir de la galería" variant="secondary" onPress={() => pick('gallery')} />
            <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 20 },
  card: { gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  tips: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 8 },
});
