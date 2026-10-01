import { AccountMenu } from '../../src/components/AccountMenu';
import { Brand } from '../../src/components/ui';
import { useEffect, useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Botanical, Button, Loading, Notice, Screen, styles } from '../../src/components/onboarding-ui';
import { useInvitation } from '../../src/providers/InvitationProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { acceptInvite, getRelationshipState, getRoutineActivationState } from '../../src/features/relationships';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ResumeInvitationScreen() {
  const { token, name, clearToken } = useInvitation();
  const { session, loading: authLoading, signOut } = useAuth();
  const { save, busy: saving } = useOnboarding();
  const started = useRef(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!token || !session || started.current) return;
    started.current = true;
    void (async () => {
      const relationshipId = await acceptInvite(token);
      const state = await getRelationshipState(session.user.id);
      if (!state || state.relationshipId !== relationshipId || state.memberCount !== 2) throw new Error('We could not confirm your pairing yet. Please try again.');
      setJoined(true);
    })().catch(cause => setError(cause instanceof Error ? cause.message : 'Please try again.'));
  }, [token, session, retry]);
  async function finish() {
    try {
      const activation = await getRoutineActivationState();
      const saved = await save(activation.myReady
        ? { path: 'routine', step: 'done' }
        : { path: 'routine', focus: [], step: 'personalize' });
      if (!saved) return;
      await clearToken();
      router.replace(activation.myReady ? '/welcome' : '/personalize');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
  }
  async function leave() {
    await clearToken();
    router.replace('/welcome');
  }
  async function switchAccount() {
    try { await signOut(); router.replace('/sign-in'); }
    catch { setError('We could not sign you out. Please try again.'); }
  }
  if (!token) return <Redirect href="/welcome"/>;
  if (authLoading) return <Loading/>;
  if (!session) return <Redirect href="/sign-in"/>;
  if (!joined && !error) return <Loading/>;
  return <Screen><Brand/><Botanical/>{joined ? <>
    <Text style={styles.eyebrow}>THE ROUTINE</Text><Text style={styles.title}>You’re in</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>{name ? `You joined ${name}` : 'You’re connected'}</Text><Text style={styles.body}>You’ve joined The Routine. Answer a few quick questions so Same Side can shape the daily Moves for both of you.</Text></View>
    {error && <Notice>{error}</Notice>}<Button label="Finish my setup" busy={saving} onPress={() => { void finish(); }}/>
  </> : <><AccountMenu/><Text style={styles.title}>We couldn’t join you</Text><Text style={styles.small}>Signed in as {session.user.email}</Text><Notice>{error}</Notice><Button label="Try again" onPress={() => { started.current = false; setError(null); setRetry(value => value + 1); }}/><Button label="Use a different account" secondary onPress={() => { void switchAccount(); }}/><Button label="Leave invitation" secondary onPress={() => { void leave(); }}/></>}</Screen>;
}
