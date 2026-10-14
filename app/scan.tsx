import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { errorMessage, notify } from '../src/lib/dialog';
import { normalizeImage } from '../src/lib/imageTools';
import { scanSession } from '../src/state/scanSession';
import { colors } from '../src/theme';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);

  async function proceed(uri: string, width: number, height: number) {
    const img = await normalizeImage(uri, width, height);
    scanSession.setImage(img);
    router.replace('/edit-image');
  }

  async function capture() {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.9 });
      await proceed(photo.uri, photo.width, photo.height);
    } catch (e) {
      notify('No se pudo tomar la foto', errorMessage(e));
      setBusy(false);
    }
  }

  async function pickFromGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled || !res.assets[0]) return;
    setBusy(true);
    try {
      const a = res.assets[0];
      await proceed(a.uri, a.width, a.height);
    } catch (e) {
      notify('No se pudo abrir la imagen', errorMessage(e));
      setBusy(false);
    }
  }

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.msg}>Necesitamos permiso para usar la cámara.</Text>
        <Button title="Dar permiso" onPress={requestPermission} />
        <Button title="Elegir de la galería" variant="secondary" onPress={pickFromGallery} />
        <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} />
      <View pointerEvents="none" style={styles.guide} />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.topText}>Cancelar</Text>
          </Pressable>
          <Text style={styles.hint}>Encuadra una canción</Text>
          <Pressable onPress={() => setTorch((t) => !t)} hitSlop={12}>
            <Text style={styles.topText}>{torch ? 'Luz ON' : 'Luz OFF'}</Text>
          </Pressable>
        </View>
        <View style={styles.bottomBar}>
          <Pressable onPress={pickFromGallery} style={styles.side} disabled={busy}>
            <Text style={styles.topText}>Galería</Text>
          </Pressable>
          <Pressable onPress={capture} style={styles.shutter} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.primaryText} /> : <View style={styles.shutterInner} />}
          </Pressable>
          <View style={styles.side} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.bg },
  msg: { color: colors.text, fontSize: 16, textAlign: 'center', marginBottom: 8 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  guide: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '14%',
    bottom: '20%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  topText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hint: { color: 'rgba(255,255,255,0.8)' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 24 },
  side: { width: 70, alignItems: 'center' },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: colors.primaryText },
});
