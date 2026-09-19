import type { PropsWithChildren } from 'react';
import { Redirect, usePathname } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useOnboarding } from '../providers/OnboardingProvider';
import { useInvitation } from '../providers/InvitationProvider';
import { useAuth } from '../providers/AuthProvider';
import { Brand, Notice, Screen, styles } from './ui';
import { theme } from '../theme';

export function FlowScreen({ children }: PropsWithChildren) {
  const { destination, error } = useOnboarding();
  const { token } = useInvitation();
  const { session } = useAuth();
  const pathname = usePathname();
  if (token) return <Redirect href={session ? '/invite/resume' : '/sign-in'}/>;
  if (pathname !== destination) return <Redirect href={destination}/>;
  return <Screen><Brand/>{children}{error && <Notice>{error}</Notice>}</Screen>;
}
export function Choice({ title, description, selected, disabled, onPress }: {
  title: string; description?: string; selected: boolean; disabled?: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ checked: selected, disabled }} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.card, { borderColor: selected ? theme.colors.sage : theme.colors.line, backgroundColor: selected ? theme.colors.sageLight : theme.colors.card, opacity: pressed || disabled ? 0.7 : 1 }]}>
    <Text style={styles.cardTitle}>{title}</Text>{description && <Text style={styles.body}>{description}</Text>}
  </Pressable>;
}
