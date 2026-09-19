import { DemoEntry } from './DemoControls';
import { isDemo } from '../lib/demo';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Button, Notice, styles } from './ui';
import { isDevelopmentPasswordSignInEnabled, useAuth } from '../providers/AuthProvider';
import { theme } from '../theme';

export function AccountMenu() {
  const { session, signOut, setTestPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function act(kind: 'password' | 'signout') {
    if (busy) return;
    if (kind === 'password' && password.length < 12) { setError('Use at least 12 characters.'); return; }
    setBusy(true); setError(null);
    try {
      if (kind === 'signout') { await signOut(); setOpen(false); router.replace('/'); }
      else { await setTestPassword(password); setPassword(''); setError('Test password saved.'); }
    } catch { setError('We couldn’t make that change. Please try again.'); }
    finally { setBusy(false); }
  }
  return <><Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => setOpen(true)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={styles.small}>Account</Text></Pressable>
    {open && <Modal visible transparent animationType="fade" onRequestClose={() => { setOpen(false); setPassword(''); }}>
      <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: 24 }}><View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 440, alignSelf: 'center' }]}>
        <DemoEntry/><Text style={styles.cardTitle}>Your account</Text><Text style={styles.small}>{session?.user.email}</Text>
        {isDevelopmentPasswordSignInEnabled && !isDemo && <><Text style={styles.eyebrow}>Local testing only</Text><Text style={styles.body}>Set a test password</Text><TextInput accessibilityLabel="New test password" style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="At least 12 characters" placeholderTextColor={theme.colors.muted} value={password} onChangeText={setPassword}/><Button label="Save test password" secondary busy={busy} onPress={() => { void act('password'); }}/></>}
        {error && <Notice>{error}</Notice>}<Button label="Sign out" secondary busy={busy} onPress={() => { void act('signout'); }}/>
        <Button label="Close" secondary onPress={() => { setOpen(false); setPassword(''); setError(null); }}/>
      </View></View>
    </Modal>}</>;
}
