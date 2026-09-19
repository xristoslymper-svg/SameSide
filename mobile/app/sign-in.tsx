import { isDemo } from '../src/lib/demo';
import { DemoSignIn } from '../src/components/DemoControls';
import { useState } from 'react';
import { Redirect } from 'expo-router';
import { useOnboarding } from '../src/providers/OnboardingProvider';
import { FlowScreen } from '../src/components/onboarding';
import { Text, TextInput, View } from 'react-native';
import { Brand, Button, Notice, Screen, styles } from '../src/components/ui';
import { isDevelopmentPasswordSignInEnabled, useAuth } from '../src/providers/AuthProvider';
import { useInvitation } from '../src/providers/InvitationProvider';
import { isConfigured } from '../src/lib/supabase';
import { theme } from '../src/theme';

export default function SignInScreen() {
  const { destination, save, busy: saving } = useOnboarding();
  const { token, name } = useInvitation();
  const { session, sendMagicLink, signInWithTestPassword, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (session) return <Redirect href={token ? '/invite/resume' : destination}/>;
  if (isDemo) return <DemoSignIn/>;
  async function submit() {
    if (busy) return;
    clearError(); setError(null);
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError('Please enter a valid email address.'); return; }
    setBusy(true);
    try { await sendMagicLink(address); setSentTo(address); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function submitTestLogin() {
    if (busy) return;
    clearError(); setError(null);
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || !password) { setError('Enter the test email and password.'); return; }
    setBusy(true);
    try { await signInWithTestPassword(address, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const content = <>
    {token && <Brand/>}
    <View style={{ gap: 14 }}><Text style={styles.title}>{token ? `Join ${name || 'your partner'} on Same Side` : 'A small step\ncloser'}</Text>
      <Text style={styles.body}>{token ? 'Sign in to create your private space' : 'Save your place with a private sign-in link'}</Text></View>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{sentTo ? 'A little note for you' : 'Your private space'}</Text>
      <Text style={styles.cardTitle}>{sentTo ? 'Check your email' : 'Begin with a small step'}</Text>
      {sentTo ? <><Text style={styles.body}>Your sign-in link is on its way to {sentTo}.</Text>
        <Text style={styles.small}>Open the link in this same browser or app to continue securely. If your email opens another browser, copy the link and paste it into this same private or incognito window.</Text>
        <Button label="Use another email" secondary onPress={() => { setSentTo(null); setError(null); }}/></>
      : <><Text style={styles.small}>Sign in or create your account with an email link. No password needed.</Text>
        <Text style={styles.label}>Email address</Text>
        <TextInput accessibilityLabel="Email address" style={styles.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={theme.colors.muted} keyboardType="email-address"
          autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
          editable={!busy} returnKeyType="go" onSubmitEditing={() => { void submit(); }}/>
        <Button label="Email me a sign-in link" onPress={() => { void submit(); }} busy={busy} disabled={!isConfigured}/></>}
      {!sentTo && isDevelopmentPasswordSignInEnabled && <View style={{ gap: 10 }}>
        <Text style={styles.eyebrow}>Local testing only</Text>
        <TextInput accessibilityLabel="Test password" style={styles.input} value={password} onChangeText={setPassword}
          placeholder="Test password" placeholderTextColor={theme.colors.muted} secureTextEntry editable={!busy}
          autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="password"/>
        <Button label="Test sign in" secondary onPress={() => { void submitTestLogin(); }} busy={busy} disabled={!isConfigured}/>
      </View>}
      {!isConfigured && <Notice>Sign-in is not available just yet. Please try again later.</Notice>}
      {(error || authError) && <Notice>{error || authError}</Notice>}
    </View><Text style={[styles.small, { textAlign: 'center' }]}>Small gestures. A little more connection.</Text>
  {!token && <Button label="Back to starting mode" secondary disabled={busy || saving} onPress={() => { void save({ step: 'mode' }); }}/>}</>;
  return token ? <Screen>{content}</Screen> : <FlowScreen>{content}</FlowScreen>;
}
