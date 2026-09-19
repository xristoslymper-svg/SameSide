import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { router } from 'expo-router';
import { useAuth } from './AuthProvider';
import { sessionStorage } from '../lib/storage';
import { Brand, Button, Loading, Notice, Screen } from '../components/ui';
import { supabase } from '../lib/supabase';
import { getRelationshipState } from '../features/relationships';
import { useInvitation } from './InvitationProvider';

type Step = 'opening' | 'how' | 'mode' | 'auth' | 'path' | 'personalize' | 'flower' | 'invite' | 'done';
export type Intent = 'together' | 'solo';
export type Focus = 'fun' | 'affection' | 'conversation' | 'appreciation' | 'time' | 'novelty';
type Progress = { version: 1; step: Step; intent: Intent | null; path: 'routine' | null; focus: Focus[] };
const initial: Progress = { version: 1, step: 'opening', intent: null, path: null, focus: [] };
const routes = { opening: '/', how: '/how-it-works', mode: '/starting-mode', auth: '/sign-in', path: '/choose-path', personalize: '/personalize', flower: '/choose-flower', invite: '/invite-partner', done: '/welcome' } as const;
const draftKey = 'same-side.onboarding.v1.draft';
const userKey = (id: string) => 'same-side.onboarding.v1.' + id;
function parse(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Object.hasOwn(routes, value.step)
      || ![null, 'solo', 'together'].includes(value.intent)
      || ![null, 'routine'].includes(value.path)
      || !(Array.isArray(value.focus) || [null, 'attention', 'playfulness', 'time'].includes(value.focus))) return null;
    if (['personalize', 'flower', 'invite', 'done'].includes(value.step) && value.path !== 'routine') return null;

    const legacyMap: Record<string, Focus> = {
      attention: 'appreciation',
      playfulness: 'fun',
      time: 'time',
    };
    const focus: Focus[] = Array.isArray(value.focus)
      ? value.focus.filter((item: unknown): item is Focus =>
          ['fun', 'affection', 'conversation', 'appreciation', 'time', 'novelty'].includes(String(item)))
      : value.focus && legacyMap[value.focus]
        ? [legacyMap[value.focus]]
        : [];

    return { version: 1, step: value.step, intent: value.intent, path: value.path, focus: focus.slice(0, 3) };
  } catch { return null; }
}
type Value = { progress: Progress; destination: typeof routes[Step]; busy: boolean; error: string | null; save: (patch: Partial<Omit<Progress, 'version'>>) => Promise<boolean> };
const Context = createContext<Value | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { session, loading: authLoading } = useAuth();
  const { token } = useInvitation();
  const scope = session?.user.id ?? 'draft';
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoadError(false); setError(null);
    void (async () => {
      try {
        let next = parse(await sessionStorage.getItem(scope === 'draft' ? draftKey : userKey(scope)));
        if (scope !== 'draft') {
          // Adopt the pre-auth intent once, then keep each account's choices separate.
          if (!next) {
            const draft = parse(await sessionStorage.getItem(draftKey));
            next = { ...initial, intent: draft?.intent ?? null, step: 'path' };
            await sessionStorage.setItem(userKey(scope), JSON.stringify(next));
          }
          await sessionStorage.removeItem(draftKey);
          // Pending acceptance owns navigation. Otherwise resolve membership
          // before showing any account-specific onboarding screen.
          if (!token) {
            const relationship = await getRelationshipState(scope);
            if (relationship) {
              let unfinishedFlower = next?.step === 'flower' && relationship.role === 'member_a';
              if (unfinishedFlower) {
                const { data, error } = await supabase!.from('relationships').select('selected_flower').eq('id', relationship.relationshipId).single();
                if (error) throw error;
                unfinishedFlower = !data.selected_flower;
              }
              next = { ...(next ?? initial), path: 'routine', step: unfinishedFlower ? 'flower' : 'done' };
            } else if (!['path', 'personalize', 'flower'].includes(next.step)) {
              next = { ...next, step: 'path' };
            }
            await sessionStorage.setItem(userKey(scope), JSON.stringify(next));
          }
        }
        if (active) { setProgress(next ?? initial); setLoadedScope(scope); }
      } catch {
        if (active) { setLoadError(true); setError('We could not load your account and relationship. Please try again.'); }
      }
    })();
    return () => { active = false; };
  }, [scope, authLoading, retry, token]);

  async function save(patch: Partial<Omit<Progress, 'version'>>) {
    if (saving.current) return false;
    saving.current = true; setBusy(true); setError(null);
    const next = { ...progress, ...patch };
    try {
      // Persist before navigation or launching authentication, including on native.
      await sessionStorage.setItem(scope === 'draft' ? draftKey : userKey(scope), JSON.stringify(next));
      setProgress(next);
      if (next.step !== progress.step) router.replace(routes[next.step]);
      return true;
    } catch { setError('We could not save your place. Please try again before continuing.'); return false; }
    finally { saving.current = false; setBusy(false); }
  }
  if (loadError) return <Screen><Brand/><Notice>{error}</Notice><Button label="Try again" onPress={() => setRetry(value => value + 1)}/></Screen>;
  if (authLoading || loadedScope !== scope) return <Loading/>;
  return <Context.Provider value={{ progress, destination: routes[progress.step], busy, error, save }}>{children}</Context.Provider>;
}
export function useOnboarding() {
  const value = useContext(Context);
  if (!value) throw new Error('OnboardingProvider is missing');
  return value;
}
