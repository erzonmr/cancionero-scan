import { useMemo, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NormRect, ScanImage } from '../lib/imageTools';
import { colors } from '../theme';

export type EditMode = 'crop' | 'zones';

interface Props {
  image: ScanImage;
  mode: EditMode;
  crop: NormRect; // normalizado respecto a la imagen completa
  zones: NormRect[]; // normalizadas respecto a la imagen completa
  onCropChange: (r: NormRect) => void;
  onZonesChange: (z: NormRect[]) => void;
}

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Drag =
  | { kind: 'corner'; corner: Corner; start: NormRect }
  | { kind: 'move'; start: NormRect }
  | { kind: 'zone'; x0: number; y0: number }
  | null;

const MIN = 0.05; // tamaño mínimo del recorte (5 % de la imagen)
const HANDLE = 28; // radio de toque de las esquinas, en px de pantalla
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Editor visual de la imagen escaneada.
 *  - Modo "Recortar": arrastra las esquinas o mueve el marco completo.
 *  - Modo "Ignorar zonas": dibuja rectángulos sobre lo que el OCR no debe leer
 *    (números de página, acordes de otra canción, la mano, etc.). Toca la × para borrar.
 * Todas las coordenadas se manejan normalizadas (0..1) para ser independientes
 * del tamaño de pantalla.
 */
export function ImageEditor({ image, mode, crop, zones, onCropChange, onZonesChange }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [draft, setDraft] = useState<NormRect | null>(null);

  // Tamaño mostrado de la imagen (ajuste "contain") dentro del contenedor.
  const disp = useMemo(() => {
    if (!box.w || !box.h) return { w: 0, h: 0, left: 0, top: 0 };
    const s = Math.min(box.w / image.width, box.h / image.height);
    const w = image.width * s;
    const h = image.height * s;
    return { w, h, left: (box.w - w) / 2, top: (box.h - h) / 2 };
  }, [box, image.width, image.height]);

  // Refs para que el PanResponder (creado una vez) vea siempre los valores actuales.
  const latest = useRef({ mode, crop, zones, disp, onCropChange, onZonesChange });
  latest.current = { mode, crop, zones, disp, onCropChange, onZonesChange };
  const drag = useRef<Drag>(null);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { mode: m, crop: c, disp: d } = latest.current;
          if (!d.w) return;
          const nx = clamp(e.nativeEvent.locationX / d.w, 0, 1);
          const ny = clamp(e.nativeEvent.locationY / d.h, 0, 1);
          if (m === 'zones') {
            drag.current = { kind: 'zone', x0: nx, y0: ny };
            setDraft({ x: nx, y: ny, width: 0, height: 0 });
            return;
          }
          const corners: Record<Corner, [number, number]> = {
            tl: [c.x, c.y],
            tr: [c.x + c.width, c.y],
            bl: [c.x, c.y + c.height],
            br: [c.x + c.width, c.y + c.height],
          };
          const hit = (Object.keys(corners) as Corner[]).find((k) => {
            const [cx, cy] = corners[k];
            return Math.hypot((cx - nx) * d.w, (cy - ny) * d.h) < HANDLE;
          });
          if (hit) drag.current = { kind: 'corner', corner: hit, start: c };
          else if (nx > c.x && nx < c.x + c.width && ny > c.y && ny < c.y + c.height)
            drag.current = { kind: 'move', start: c };
          else drag.current = null;
        },
        onPanResponderMove: (_e, g) => {
          const { disp: d, onCropChange: setCrop } = latest.current;
          const cur = drag.current;
          if (!cur || !d.w) return;
          const dx = g.dx / d.w;
          const dy = g.dy / d.h;

          if (cur.kind === 'zone') {
            const x1 = clamp(cur.x0 + dx, 0, 1);
            const y1 = clamp(cur.y0 + dy, 0, 1);
            setDraft({
              x: Math.min(cur.x0, x1),
              y: Math.min(cur.y0, y1),
              width: Math.abs(x1 - cur.x0),
              height: Math.abs(y1 - cur.y0),
            });
            return;
          }
          const s = cur.start;
          if (cur.kind === 'move') {
            setCrop({
              ...s,
              x: clamp(s.x + dx, 0, 1 - s.width),
              y: clamp(s.y + dy, 0, 1 - s.height),
            });
            return;
          }
          let left = s.x;
          let top = s.y;
          let right = s.x + s.width;
          let bottom = s.y + s.height;
          if (cur.corner === 'tl' || cur.corner === 'bl') left = clamp(s.x + dx, 0, right - MIN);
          if (cur.corner === 'tr' || cur.corner === 'br') right = clamp(right + dx, left + MIN, 1);
          if (cur.corner === 'tl' || cur.corner === 'tr') top = clamp(s.y + dy, 0, bottom - MIN);
          if (cur.corner === 'bl' || cur.corner === 'br') bottom = clamp(bottom + dy, top + MIN, 1);
          setCrop({ x: left, y: top, width: right - left, height: bottom - top });
        },
        onPanResponderRelease: (_e, g) => {
          const cur = drag.current;
          drag.current = null;
          if (cur?.kind !== 'zone') return;
          const { disp: d, zones: z, onZonesChange: setZones } = latest.current;
          setDraft(null);
          const w = Math.abs(g.dx / d.w);
          const h = Math.abs(g.dy / d.h);
          if (w < 0.02 || h < 0.01) return; // toque accidental
          const x1 = clamp(cur.x0 + g.dx / d.w, 0, 1);
          const y1 = clamp(cur.y0 + g.dy / d.h, 0, 1);
          setZones([
            ...z,
            {
              x: Math.min(cur.x0, x1),
              y: Math.min(cur.y0, y1),
              width: Math.abs(x1 - cur.x0),
              height: Math.abs(y1 - cur.y0),
            },
          ]);
        },
        onPanResponderTerminate: () => {
          drag.current = null;
          setDraft(null);
        },
      }),
    [],
  );

  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const px = (r: NormRect) => ({ left: r.x * disp.w, top: r.y * disp.h, width: r.width * disp.w, height: r.height * disp.h });
  const c = px(crop);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {disp.w > 0 && (
        <View style={{ position: 'absolute', left: disp.left, top: disp.top, width: disp.w, height: disp.h }}>
          <Image source={{ uri: image.uri }} style={{ width: disp.w, height: disp.h }} resizeMode="stretch" />

          {/* Capa de gestos: los hijos no reciben toques para que locationX/Y sean relativos a esta capa */}
          <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
            {/* Oscurecer fuera del recorte */}
            <View pointerEvents="none" style={[styles.dim, { left: 0, top: 0, width: disp.w, height: c.top }]} />
            <View pointerEvents="none" style={[styles.dim, { left: 0, top: c.top + c.height, width: disp.w, height: disp.h - c.top - c.height }]} />
            <View pointerEvents="none" style={[styles.dim, { left: 0, top: c.top, width: c.left, height: c.height }]} />
            <View pointerEvents="none" style={[styles.dim, { left: c.left + c.width, top: c.top, width: disp.w - c.left - c.width, height: c.height }]} />

            {zones.map((z, i) => (
              <View key={i} pointerEvents="none" style={[styles.zone, px(z)]} />
            ))}
            {draft && <View pointerEvents="none" style={[styles.zone, px(draft)]} />}

            <View pointerEvents="none" style={[styles.crop, c, mode === 'zones' && { opacity: 0.5 }]}>
              {mode === 'crop' &&
                (['tl', 'tr', 'bl', 'br'] as Corner[]).map((k) => (
                  <View
                    key={k}
                    style={[
                      styles.handle,
                      k.includes('t') ? { top: -9 } : { bottom: -9 },
                      k.includes('l') ? { left: -9 } : { right: -9 },
                    ]}
                  />
                ))}
            </View>
          </View>

          {/* Botones para borrar zonas: por encima de la capa de gestos */}
          {mode === 'zones' &&
            zones.map((z, i) => {
              const r = px(z);
              return (
                <Pressable
                  key={`del-${i}`}
                  hitSlop={10}
                  onPress={() => onZonesChange(zones.filter((_, j) => j !== i))}
                  style={[styles.del, { left: r.left + r.width - 13, top: r.top - 13 }]}
                >
                  <Text style={styles.delText}>×</Text>
                </Pressable>
              );
            })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  crop: { position: 'absolute', borderWidth: 2, borderColor: colors.primary },
  handle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  zone: { position: 'absolute', backgroundColor: colors.zone, borderWidth: 1, borderColor: colors.danger },
  del: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
});
