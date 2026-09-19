import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { parseAuthCallback } from '../features/auth/callback';

// This is compiled into local development builds only when explicitly enabled.
// Never use it for a production build or for ordinary customer sign-in.
export const isDevelopmentPasswordSignInEnabled = process.env.EXPO_PUBLIC_ENABLE_DEV_PASSWORD_SIGN_IN === 'true';

type AuthContextValue = {
  session: Session | null; loading: boolean; error: string | null;
  sendMagicLink: (email: string) => Promise<void>; signInWithTestPassword: (email: string, password: string) => Promise<void>; setTestPassword: (password: string) => Promise<void>; signOut: () => Promise<void>;
  clearError: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remember handled codes only in memory; never log URLs/tokens or put them in errors.
  const inFlight = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    const client = supabase;
    if (!client) { setLoading(false); return; }
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    function acceptLink(url: string): Promise<void> {
      const prior = inFlight.current.get(url);
      if (prior) return prior;
      const action = (async () => {
        const callback = parseAuthCallback(url);
        if (!callback) return;
        if (active) { setLoading(true); setError(null); }
        try {
          if (callback.error) throw new Error(callback.error);
          const { data, error: authError } = await client!.auth.exchangeCodeForSession(callback.code!);
          if (authError || !data.session) throw new Error('Please request a new sign-in link and open it in the same browser or app.');
          if (active) setSession(data.session);
        } catch (cause) {
          if (active) setError(cause instanceof Error ? cause.message : 'We could not finish signing you in. Please try again.');
        } finally {
          if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState({}, '', '/auth/callback');
          if (active) setLoading(false);
        }
      })();
      inFlight.current.set(url, action);
      return action;
    }
    const links = Linking.addEventListener('url', ({ url }) => { void acceptLink(url); });
    void (async () => {
      try {
        const initialUrl = Platform.OS === 'web' ? window.location.href : await Linking.getInitialURL();
        // Restore storage first; the PKCE verifier uses the same durable storage adapter.
        const { data, error: restoreError } = await client.auth.getSession();
        if (restoreError) throw restoreError;
        if (active) setSession(data.session);
        if (initialUrl) await acceptLink(initialUrl);
      } catch {
        if (active) setError('Your sign-in could not be restored. Please check your connection and try again.');
      } finally { if (active) setLoading(false); }
    })();
    const refresh = (state: string) => {
      if (state === 'active') client.auth.startAutoRefresh(); else client.auth.stopAutoRefresh();
    };
    if (Platform.OS !== 'web') refresh(AppState.currentState);
    const appState = Platform.OS !== 'web' ? AppState.addEventListener('change', refresh) : null;
    return () => { active = false; subscription.unsubscribe(); links.remove(); appState?.remove(); if (Platform.OS !== 'web') client.auth.stopAutoRefresh(); };
  }, []);

  async function sendMagicLink(email: string) {
    if (!supabase) throw new Error('Sign-in is not available just yet. Please try again later.');
    const redirect = Platform.OS === 'web'
      ? `${window.location.origin}/auth/callback`
      : process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_URL || 'sameside://auth/callback';
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirect } });
    if (authError) throw new Error(authError.status === 429
      ? 'Please wait a moment before requesting another link.'
      : 'We could not send your link. Please check your email address and connection, then try again.');
  }
  async function signInWithTestPassword(email: string, password: string) {
    if (!isDevelopmentPasswordSignInEnabled) throw new Error('Test sign-in is not enabled in this build.');
    if (!supabase) throw new Error('Sign-in is not available just yet. Please try again later.');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.session) throw new Error('We could not sign in with those test credentials.');
    setSession(data.session);
  }
  async function setTestPassword(password: string) {
    if (!isDevelopmentPasswordSignInEnabled) throw new Error('Test password setup is not enabled in this build.');
    if (!supabase) throw new Error('Sign-in is not available just yet. Please try again later.');
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) throw new Error('We could not save that test password. Please try another one.');
  }
  async function signOut() {
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signOut({ scope: 'local' });
    if (authError) throw new Error('We could not sign you out. Please try again.');
    setSession(null); setError(null); inFlight.current.clear();
  }
  return <AuthContext.Provider value={{ session, loading, error, sendMagicLink, signInWithTestPassword, setTestPassword, signOut, clearError: () => setError(null) }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
