import { router } from 'expo-router';
import { isDemo, demoToken } from '../src/lib/demo';
import { useInvitation } from '../src/providers/InvitationProvider';
import { useEffect, useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';
import { Botanical, Button, Notice, styles } from '../src/components/ui';
import { FlowScreen } from '../src/components/onboarding';
import { useAuth } from '../src/providers/AuthProvider';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { createInvite, getRelationshipState, invitationUrl, saveDisplayName } from '../src/features/relationships';
import { theme } from '../src/theme';

export default function InvitePartnerScreen() {
  const { session } = useAuth();
  const { setInvitation } = useInvitation();
  const { save, busy: saving } = useOnboarding();
  const [name, setName] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !link || joined || isDemo) return;
    let active = true;
    async function check() {
      try {
        const relationship = await getRelationshipState(session!.user.id);
        if (active && relationship?.memberCount === 2) setJoined(true);
      } catch {}
    }
    void check();
    const timer = setInterval(() => { void check(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [session, link, joined]);

  async function makeInvite() {
    if (!session || busy) return;
    setBusy(true); setError(null); setCopied(false); setJoined(false);
    try {
      const relationship = await getRelationshipState(session.user.id);
      if (!relationship) { await save({ step: 'path' }); return; }
      if (relationship.memberCount >= 2 || relationship.role === 'member_b') { await save({ step: 'done' }); return; }
      await saveDisplayName(session.user.id, name);
      setLink(invitationUrl(await createInvite()));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function copy() {
    if (!link) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) { await navigator.clipboard.writeText(link); setCopied(true); }
      else { await Share.share({ message: `Join me on Same Side: ${link}`, url: link }); setCopied(true); }
    } catch { setError('We could not share the link. You can select and copy it below.'); }
  }
  return <FlowScreen><Botanical/><Text style={styles.eyebrow}>Begin together</Text><Text style={styles.title}>{joined?'You’re connected':'Invite your partner'}</Text>
    <Text style={styles.body}>{joined?'You now share one Routine and one garden. Your daily moves still stay private.':"You'll each get your own private actions. Neither of you sees what the other gets."}</Text>
    {isDemo ? <View style={styles.card}><Text style={styles.body}>Demo invitation: simulate your partner joining here. No real invitation is sent.</Text><Button label="Simulate partner joining" onPress={() => { void setInvitation(demoToken, 'Alex').then(() => router.replace('/invite/resume')); }}/></View> : joined ? <View style={styles.card}><Text style={styles.cardTitle}>Same side, different moves.</Text><Text style={styles.body}>Their move is theirs. Yours is yours. Every completed move quietly helps the same flower grow.</Text></View> : !link ? <View style={styles.card}><Text style={styles.cardTitle}>What should they call you?</Text>
      <TextInput accessibilityLabel="Your first name" style={styles.input} value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={theme.colors.muted} maxLength={80} autoCapitalize="words"/>
      <Button label="Invite my partner" busy={busy} disabled={!name.trim()} onPress={() => { void makeInvite(); }}/></View>
    : <View style={styles.card}><Text style={styles.cardTitle}>{copied ? 'Invite sent' : 'Your invitation is ready'}</Text>
      {copied && <Text style={styles.body}>They can join whenever they're ready. This screen will update when they do.</Text>}<Text selectable style={styles.small}>{link}</Text>
      <Button label={copied ? 'Copy link again' : Platform.OS === 'web' ? 'Copy invitation link' : 'Share invitation link'} onPress={() => { void copy(); }}/></View>}
    {error && <Notice>{error}</Notice>}
    <Button label={joined?'Continue to Same Side':copied?'Continue while they join':'Continue without inviting'} secondary={!joined} disabled={saving || busy} onPress={() => { void save({ step: 'done' }); }}/>
  </FlowScreen>;
}
