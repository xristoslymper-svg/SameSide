import { Redirect, Tabs } from 'expo-router';
import { Platform, Text, useWindowDimensions } from 'react-native';
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

  const shellWidth = Math.min(Math.max(width - 32, 280), 402);
  // Browsers usually report a zero safe-area inset. Leave enough real space below
  // the floating bar for its rounded edge and shadow to remain visible.
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 18 : 10);
  const barBottom = safeBottom + 6;
  const barHeight = 68;

  return (
    <Tabs
      key={session.user.id}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.sage,
        tabBarInactiveTintColor: theme.colors.mutedSoft,
        tabBarStyle: {
          position: 'absolute',
          width: shellWidth,
          left: (width - shellWidth) / 2,
          bottom: barBottom,
          height: barHeight,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          backgroundColor: 'rgba(255,252,247,0.975)',
          borderWidth: 1,
          borderColor: theme.colors.line,
          borderRadius: 34,
          shadowColor: theme.colors.ink,
          shadowOpacity: 0.12,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
          overflow: 'visible',
        },
        tabBarItemStyle: { paddingTop: 2, paddingBottom: 2, borderRadius: 24 },
        tabBarIconStyle: { marginBottom: 1 },
        tabBarLabelStyle: { fontSize: 10.5, lineHeight: 14, fontWeight: '700', marginTop: 2, marginBottom: 1 },
        sceneStyle: { backgroundColor: theme.colors.background, paddingBottom: barHeight + barBottom + 18 },
      }}
    >
      <Tabs.Screen name="today" options={{title:'Today',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?20:19,lineHeight:21,fontWeight:focused?'700':'500'}}>⌂</Text>}}/>
      <Tabs.Screen name="garden" options={{title:'Garden',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?21:20,lineHeight:21}}>✤</Text>}}/>
      <Tabs.Screen name="roots" options={{title:'Roots',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?20:19,lineHeight:21,fontWeight:focused?'700':'500'}}>◎</Text>}}/>
      <Tabs.Screen name="diary" options={{href:null}}/>
    </Tabs>
  );
}
