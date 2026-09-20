import { useEffect, useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Botanical, Brand, Button, Loading, Notice, Screen, styles } from '../../src/components/ui';
import { useInvitation } from '../../src/providers/InvitationProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { acceptInvite, getRelationshipState } from '../../src/features/relationships';
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
    const saved = await save({ path: 'routine', step: 'done' });
    if (!saved) return;
    await clearToken();
    router.replace('/welcome');
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
    <Text style={styles.eyebrow}>Together, privately</Text><Text style={styles.title}>You're on the same side</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>{name ? `You joined ${name}` : 'You’re connected'}</Text><Text style={styles.body}>You now share one Routine and one garden. Your daily moves, completions and private reflections still stay yours.</Text></View>
    <Button label="Go to Same Side" busy={saving} onPress={() => { void finish(); }}/>
  </> : <><Text style={styles.title}>We couldn’t join you</Text><Text style={styles.small}>Signed in as {session.user.email}</Text><Notice>{error}</Notice><Button label="Try again" onPress={() => { started.current = false; setError(null); setRetry(value => value + 1); }}/><Button label="Use a different account" secondary onPress={() => { void switchAccount(); }}/><Button label="Leave invitation" secondary onPress={() => { void leave(); }}/></>}</Screen>;
}
