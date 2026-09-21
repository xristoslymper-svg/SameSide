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

  const shellWidth = Math.min(width, 430);
  const safeBottom = Math.max(insets.bottom, 9);

  return (
    <Tabs
      key={session.user.id}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.sage,
        tabBarInactiveTintColor: '#9B9287',
        tabBarStyle: {
          position: 'absolute',
          width: shellWidth,
          left: (width - shellWidth) / 2,
          bottom: 0,
          height: 64 + safeBottom,
          paddingTop: 7,
          paddingBottom: safeBottom,
          paddingHorizontal: 18,
          backgroundColor: 'rgba(255,253,249,0.985)',
          borderTopWidth: 1,
          borderTopColor: theme.colors.line,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          shadowColor: '#283A2F',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -5 },
          elevation: 8,
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', marginTop: 2, marginBottom: 0 },
        sceneStyle: { backgroundColor: theme.colors.background, paddingBottom: 73 + safeBottom },
      }}
    >
      <Tabs.Screen name="today" options={{title:'Today',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?20:19,lineHeight:21,fontWeight:focused?'700':'500'}}>⌂</Text>}}/>
      <Tabs.Screen name="garden" options={{title:'Garden',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?21:20,lineHeight:21}}>✤</Text>}}/>
      <Tabs.Screen name="roots" options={{title:'Roots',tabBarIcon:({color,focused})=><Text style={{color,fontSize:focused?20:19,lineHeight:21,fontWeight:focused?'700':'500'}}>◎</Text>}}/>
      <Tabs.Screen name="diary" options={{href:null}}/>
    </Tabs>
  );
}
