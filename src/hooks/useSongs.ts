import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { listSongs, SongSummary } from '../lib/songs';
import { supabase } from '../lib/supabase';

export type SyncStatus = 'conectando' | 'sincronizado' | 'sin conexión';

function applyChange(list: SongSummary[], payload: RealtimePostgresChangesPayload<SongSummary>): SongSummary[] {
  if (payload.eventType === 'DELETE') {
    const id = (payload.old as Partial<SongSummary>).id;
    return list.filter((s) => s.id !== id);
  }
  const row = payload.new as SongSummary;
  const exists = list.findIndex((s) => s.id === row.id);
  let next: SongSummary[];
  if (exists >= 0) {
    // Ignorar eventos atrasados (versión menor a la que ya tenemos).
    if (list[exists].version > row.version) return list;
    next = [...list];
    next[exists] = row;
  } else {
    next = [row, ...list];
  }
  return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * Lista de canciones sincronizada en tiempo real:
 *  - carga inicial desde Supabase,
 *  - suscripción a INSERT/UPDATE/DELETE (Supabase Realtime; RLS filtra por usuario),
 *  - recarga completa al reconectar o al volver la app a primer plano,
 *    para recuperar cambios hechos mientras se estaba desconectado.
 */
export function useSongs() {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('conectando');
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listSongs();
      if (mounted.current) {
        setSongs(data);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const channel = supabase
      .channel('songs-sync')
      .on<SongSummary>('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, (payload) =>
        setSongs((prev) => applyChange(prev, payload)),
      )
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          setStatus('sincronizado');
          refresh(); // por si hubo cambios mientras estábamos desconectados
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          setStatus('sin conexión');
        }
      });

    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refresh();
    });

    return () => {
      mounted.current = false;
      appSub.remove();
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { songs, loading, error, status, refresh };
}
