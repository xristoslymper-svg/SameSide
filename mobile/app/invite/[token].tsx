import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Botanical, Brand, Button, Loading, Notice, Screen, styles } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { useInvitation } from '../../src/providers/InvitationProvider';
import { previewInvite, type InvitePreview } from '../../src/features/relationships';

const unavailable: Record<string, string> = { invalid: 'This invitation link is not valid.', expired: 'This invitation has expired. Ask your partner for a new one.', revoked: 'This invitation is no longer available.', accepted: 'This invitation has already been used.', full: 'This relationship already has two people.', unavailable: 'This invitation is no longer available.' };
export default function InvitationScreen() {
  const value = useLocalSearchParams<{ token: string }>().token;
  const token = Array.isArray(value) ? value[0] : value;
  const { session, signOut } = useAuth();
  const { setInvitation } = useInvitation();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; void (async () => { try { const next = await previewInvite(token ?? ''); if (active) setPreview(next); } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Please try again.'); } })(); return () => { active = false; }; }, [token]);
  async function join() {
    if (!token || busy) return;
    setBusy(true); setError(null);
    try {
      await setInvitation(token, preview?.name ?? null);
      router.replace(session ? '/invite/resume' : '/sign-in');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function switchAccount() {
    setBusy(true); setError(null);
    try {
      await setInvitation(token, preview?.name ?? null);
      await signOut();
      router.replace('/sign-in');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  if (!preview && !error) return <Loading/>;
  const name = preview?.name || 'Your partner';
  return <Screen><Brand/><Botanical/>{preview?.state === 'ready' ? <>
    <Text style={styles.eyebrow}>An invitation for you</Text><Text style={styles.title}>{name} invited you</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Different moves. Same side.</Text>
      <Text style={styles.body}>You'll each get your own private actions. Neither of you sees what the other gets. What you create together grows in the same garden.</Text></View>
    {session && <Text style={styles.small}>Joining as {session.user.email}</Text>}
    {error && <Notice>{error}</Notice>}<Button label={`Join ${name}`} busy={busy} onPress={() => { void join(); }}/>
    {session && <Button label="Use a different account" secondary disabled={busy} onPress={() => { void switchAccount(); }}/ >}
  </> : <><Text style={styles.title}>This invitation can’t be used</Text><Notice>{error || unavailable[preview?.state ?? 'invalid']}</Notice></>}</Screen>;
}
