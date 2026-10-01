import { useAuth } from '../providers/AuthProvider';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Platform, Text, View } from 'react-native';
import { Brand, Button, Notice, Screen, styles } from './ui';
import { theme } from '../theme';
import type { PropsWithChildren } from 'react';

// Reload on tab focus and when returning to the app, without retaining another account's data.
export function useProductData<T>(load: () => Promise<T>) {
  const { session } = useAuth();
  const scope = session?.user.id ?? null;
  const owner = useRef(scope);
  const pending = useRef(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const active = useRef(false);
  const hasData = useRef(false);
  const refresh = useCallback(async () => {
    if (owner.current !== scope) {
      owner.current = scope; hasData.current = false; setData(null);
    }
    const current = ++generation.current;
    pending.current++;
    const initialLoad = !hasData.current;
    if (initialLoad) setLoading(true);
    setError(null);
    try {
      const value = await load();
      if (active.current && current === generation.current) {
        hasData.current = true;
        setData(value);
      }
    } catch (cause) {
      if (active.current && current === generation.current) {
        if (initialLoad) setData(null);
        setError(cause instanceof Error ? cause.message : 'Please try again.');
      }
    } finally {
      pending.current--;
      if (active.current && current === generation.current && initialLoad) setLoading(false);
    }
  }, [load, scope]);
  const mutate = useCallback((value: T) => {
    // A local mutation is newer than any refresh already in flight.
    // Invalidate those requests so stale server reads cannot overwrite immediate UI state.
    generation.current++;
    hasData.current = true;
    setData(value);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => {
    active.current = true; void refresh();
    const timer = setInterval(() => {
      if (pending.current === 0 && (Platform.OS === 'web' ? document.visibilityState === 'visible' : AppState.currentState === 'active')) void refresh();
    }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', visible);
    return () => { active.current = false; generation.current++; clearInterval(timer); subscription.remove(); if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visible); };
  }, [refresh]));
  return { data: owner.current === scope ? data : null, error: owner.current === scope ? error : null, loading: owner.current !== scope || loading, refresh, mutate };
}
export function ProductScreen({ title, question, children }: PropsWithChildren<{ title: string; question: string }>) {
  return <Screen><Brand/><Text style={styles.eyebrow}>{title}</Text><Text style={styles.title}>{question}</Text>{children}</Screen>;
}
export function LoadState({ loading, error, refresh }: { loading: boolean; error: string | null; refresh: () => Promise<void> }) {
  return loading ? <Text style={styles.body}>A moment for you…</Text> : error ? <><Notice>{error}</Notice><Button label="Try again" onPress={() => { void refresh(); }}/></> : null;
}
// Anonymous, interchangeable growth. No per-person or event metadata enters this component.
export function GardenGrowth({ count }: { count: number }) {
  return <View accessible accessibilityLabel={count ? `${count} shared moments grown` : 'Your garden is ready to grow'} style={{ minHeight: 220, borderRadius: 28, backgroundColor: theme.colors.sageLight, padding: 24, justifyContent: 'flex-end', overflow: 'hidden' }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 12 }}>
      {Array.from({ length: Math.min(count, 28) }, (_, i) => <View key={i} style={{ width: 28, height: 64 + (i % 3) * 16, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ width: 22, height: 28, borderRadius: 14, backgroundColor: i % 3 === 0 ? theme.colors.coral : i % 3 === 1 ? '#D7B989' : '#A7B799', marginBottom: -2 }}/>
        <View style={{ width: 2, height: 30 + (i % 3) * 16, backgroundColor: theme.colors.sage }}/>
        <View style={{ position: 'absolute', bottom: 15, left: 14, width: 16, height: 8, borderTopRightRadius: 14, borderBottomLeftRadius: 14, backgroundColor: theme.colors.sage }}/>
      </View>)}
      {!count && <Text style={[styles.body, { textAlign: 'center', paddingBottom: 28 }]}>A little space for what grows between you.</Text>}
    </View>
    <View style={{ height: 5, borderRadius: 3, backgroundColor: '#C9C0AC', marginTop: 5 }}/>
  </View>;
}
