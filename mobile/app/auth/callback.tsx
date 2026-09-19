import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { Brand, Button, Notice, Screen, styles } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';

import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { useInvitation } from '../../src/providers/InvitationProvider';

export default function AuthCallbackScreen() {
  const { destination, save, busy, error: saveError } = useOnboarding();
  const { token } = useInvitation();
  const { session, error, clearError } = useAuth();
  if (session) return <Redirect href={token ? '/invite/resume' : destination}/>;
  return <Screen><Brand/><Text style={styles.title}>Let’s try that again.</Text>
    <Notice>{error || 'Please request a new sign-in link in this browser or app.'}</Notice>
    {saveError && <Notice>{saveError}</Notice>}
<Button label="Back to sign in" busy={busy} onPress={() => { void save({ step: 'auth' }).then(saved => { if (saved) { clearError(); router.replace('/sign-in'); } }); }}/>
  </Screen>;
}
