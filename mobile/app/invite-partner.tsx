import { Brand } from '../src/components/ui';
import { isDemo, simulateDemoPartnerJoin } from '../src/lib/demo';
import { useEffect, useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';
import { Botanical, Button, Notice, Screen, styles } from '../src/components/onboarding-ui';
import { useAuth } from '../src/providers/AuthProvider';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { createInvite, getRelationshipState, getRoutineActivationState, invitationUrl, previewInvite, revokeInvites, saveDisplayName } from '../src/features/relationships';
import { theme } from '../src/theme';
import { sessionStorage } from '../src/lib/storage';

export default function InvitePartnerScreen() {
  const { session } = useAuth();
  const { save, busy: saving } = useOnboarding();
  const [name, setName] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || isDemo) return;
    let active = true;
    const key = `same-side.outgoing-invite.${session.user.id}`;
    void sessionStorage.getItem(key).then(async stored => {
      if (!active || !stored) return;
      try {
        const token = stored.split('/invite/').pop() ?? '';
        const preview = await previewInvite(token);
        if (!active) return;
        if (preview.state === 'ready') setLink(stored);
        else await sessionStorage.removeItem(key);
      } catch {}
    });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!session || joined && ready || isDemo) return;
    let active = true;
    async function check() {
      try {
        const [relationship, activation] = await Promise.all([
          getRelationshipState(session!.user.id),
          getRoutineActivationState(),
        ]);
        if (!active) return;
        const hasJoined = (relationship?.memberCount ?? 1) === 2;
        setJoined(hasJoined);
        setReady(activation.activated);
        if (hasJoined) {
          setLink(null);
          await sessionStorage.removeItem(`same-side.outgoing-invite.${session!.user.id}`);
        }
      } catch {}
    }
    void check();
    const timer = setInterval(() => { void check(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [session, joined, ready]);

  // This screen is also an in-product management surface. When Today explicitly
  // sends member_a here, completed onboarding must not immediately redirect back.
  // Do not gate this authenticated utility screen on onboarding destination.
  // Completed users legitimately return here from Today to create/manage an invite.

  async function makeInvite() {
    if (!session || busy) return;
    setBusy(true); setError(null); setCopied(false);
    try {
      const relationship = await getRelationshipState(session.user.id);
      if (!relationship) { setError('We could not find your relationship. Please return to Today and try again.'); return; }
      if (relationship.memberCount >= 2) { setJoined(true); setError('Your partner has already joined this relationship.'); return; }
      if (relationship.role === 'member_b') { setError('Only the person who started this relationship can create an invitation.'); return; }
      await saveDisplayName(session.user.id, name);
      const nextLink = invitationUrl(await createInvite());
      setLink(nextLink);
      await sessionStorage.setItem(`same-side.outgoing-invite.${session.user.id}`, nextLink);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function copy() {
    if (!link) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link); setCopied(true);
      } else {
        await Share.share({ message: `Join me in The Routine on Same Side: ${link}`, url: link });
        setCopied(true);
      }
    } catch {
      setError('We could not share the link. You can select and copy it below.');
    }
  }

  async function cancelInvite(){
    if(busy)return;
    setBusy(true);setError(null);
    try{await revokeInvites();if(session)await sessionStorage.removeItem(`same-side.outgoing-invite.${session.user.id}`);setLink(null);setCopied(false);}
    catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}
    finally{setBusy(false);}
  }

  return <Screen>
    <Brand/>
    <Botanical/>
    <Text style={styles.eyebrow}>THE ROUTINE</Text>
    <Text style={styles.title}>{ready?'You’re both ready':joined?'Your partner joined':'Invite your partner'}</Text>
    <Text style={styles.body}>
      {ready
        ? 'The Routine is ready to begin for both of you.'
        : joined
          ? 'They’re in. Your first day begins when they finish their personalization.'
          : 'Your setup is ready. Day 1 begins once your partner joins and completes their setup.'}
    </Text>

    {isDemo ? <View style={styles.card}>
      <Text style={styles.body}>Demo invitation: simulate your partner joining and completing their setup. No real invitation is sent.</Text>
      <Button label="Simulate partner joining" onPress={() => { if (simulateDemoPartnerJoin()) void save({ step: 'done' }); else setError('Finish your setup and choose a flower before simulating your partner.'); }}/>
    </View> : joined ? <View style={styles.card}>
      <Text style={styles.cardTitle}>{ready?'The Routine starts now':'One last step for them'}</Text>
      <Text style={styles.body}>{ready?'You can both open Today and see your first Move.':'They’ll answer the same personalization questions you did. Then Day 1 unlocks for both of you.'}</Text>
    </View> : !link ? <View style={styles.card}>
      <Text style={styles.cardTitle}>What should they call you?</Text>
      <TextInput accessibilityLabel="Your first name" style={styles.input} value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={theme.colors.muted} maxLength={80} autoCapitalize="words"/>
      <Button label="Create invitation" busy={busy} disabled={!name.trim()} onPress={() => { void makeInvite(); }}/>
    </View> : <View style={styles.card}>
      <Text style={styles.cardTitle}>{copied ? 'Invitation copied' : 'Your invitation is ready'}</Text>
      <Text style={styles.body}>Send this to your partner. The Routine will wait until they join and finish their setup.</Text>
      <Text selectable style={styles.small}>{link}</Text>
      <Button label={copied ? 'Copy link again' : Platform.OS === 'web' ? 'Copy invitation link' : 'Share invitation link'} onPress={() => { void copy(); }}/>
      <Button label="Create a new link" secondary disabled={busy} onPress={()=>{void makeInvite();}}/>
      <Button label="Cancel invitation" secondary disabled={busy} onPress={()=>{void cancelInvite();}}/>
    </View>}

    {error && <Notice>{error}</Notice>}
    {(joined || link) && <Button label={ready?'See today’s Move':'Continue to Same Side'} secondary={!ready} disabled={saving || busy} onPress={() => { void save({ step: 'done' }); }}/>}
  </Screen>;
}
