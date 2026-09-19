import 'react-native-url-polyfill/auto';
import { isDemo, demoFetch } from './demo';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { sessionStorage } from './storage';

const url = isDemo ? 'https://demo.supabase.co' : process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = isDemo ? 'sb_publishable_demo_local_only' : process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
// Public environment variables are bundled into the app. Accept only publishable keys.
export const isConfigured = Boolean(url && /^https:\/\//.test(url) && key?.startsWith('sb_publishable_'));
export const supabase = isConfigured ? createClient(url!, key!, {
  ...(isDemo ? { global: { fetch: demoFetch } } : {}),
  auth: {
    ...(isDemo ? { storageKey: 'same-side.demo.auth' } : {}),
    storage: sessionStorage, persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: false, flowType: 'pkce',
    ...(Platform.OS !== 'web' ? { lock: processLock } : {}),
  },
}) : null;
