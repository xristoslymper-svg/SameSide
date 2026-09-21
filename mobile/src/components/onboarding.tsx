import type { PropsWithChildren } from 'react';
import { Redirect, usePathname } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useOnboarding } from '../providers/OnboardingProvider';
import { useInvitation } from '../providers/InvitationProvider';
import { useAuth } from '../providers/AuthProvider';
import { Brand, Notice, Screen, styles } from './ui';
import { theme } from '../theme';

export function FlowScreen({ children, immersive = false }: PropsWithChildren<{ immersive?: boolean }>) {
  const { destination, error } = useOnboarding();
  const { token } = useInvitation();
  const { session } = useAuth();
  const pathname = usePathname();
  if (token) return <Redirect href={session ? '/invite/resume' : '/sign-in'}/>;
  if (pathname !== destination) return <Redirect href={destination}/>;
  return <Screen compact={immersive}>{!immersive && <Brand/>}{children}{error && <Notice>{error}</Notice>}</Screen>;
}
export function Choice({ title, description, selected, disabled, compact = false, onPress }: {
  title: string; description?: string; selected: boolean; disabled?: boolean; compact?: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ checked: selected, disabled }} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.card, compact && { paddingVertical: 14, paddingHorizontal: 17, borderRadius: 18, gap: 7 }, { borderColor: selected ? theme.colors.sage : theme.colors.line, backgroundColor: selected ? theme.colors.sageWash : theme.colors.card, opacity: pressed || disabled ? 0.72 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
    <Text style={[styles.cardTitle, compact && { fontSize: 18, lineHeight: 23 }]}>{title}</Text>{description && <Text style={[styles.body, compact && { fontSize: 14, lineHeight: 21 }]}>{description}</Text>}
  </Pressable>;
}
