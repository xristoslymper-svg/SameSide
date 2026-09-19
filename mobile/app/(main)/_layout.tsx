import { Redirect, Tabs } from 'expo-router';
import { Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/providers/AuthProvider';
import { useInvitation } from '../../src/providers/InvitationProvider';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { theme } from '../../src/theme';

export default function ProductLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const { token } = useInvitation();
  const { destination } = useOnboarding();

  if (!session) return <Redirect href={token ? '/sign-in' : '/'}/>;
  if (token) return <Redirect href="/invite/resume"/>;
  if (destination !== '/welcome') return <Redirect href={destination}/>;

  // Match the original HTML prototype:
  // the app shell was max 430px wide, while screen content had 22px inner padding.
  const shellWidth = Math.min(width, 430);
  const bottom = 0;
  const safeBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      key={session.user.id}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: '#999287',

        tabBarStyle: {
          position: 'absolute',
          width: shellWidth,
          left: (width - shellWidth) / 2,
          bottom,
          height: 68 + safeBottom,
          paddingTop: 8,
          paddingBottom: safeBottom,

          backgroundColor: 'rgba(247,242,234,0.98)',
          borderTopWidth: 1,
          borderTopColor: theme.colors.line,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,

          shadowOpacity: 0,
          elevation: 0,
        },

        tabBarItemStyle: {
          paddingTop: 1,
        },

        tabBarIconStyle: {
          marginTop: 1,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 1,
          marginBottom: 0,
        },

        sceneStyle: {
          backgroundColor: theme.colors.background,
          paddingBottom: 78 + safeBottom,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 21, lineHeight: 22 }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 21, lineHeight: 22 }}>✿</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="roots"
        options={{
          title: 'Roots',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 21, lineHeight: 22 }}>◎</Text>
          ),
        }}
      />
    </Tabs>
  );
}
