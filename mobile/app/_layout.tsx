import { View } from 'react-native';
import { DemoControls } from '../src/components/DemoControls';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { Loading } from '../src/components/ui';
import { OnboardingProvider } from '../src/providers/OnboardingProvider';
import { InvitationProvider } from '../src/providers/InvitationProvider';
import { theme } from '../src/theme';

function Navigation() {
  const { session, loading } = useAuth();
  if (loading) return <Loading/>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
    <Stack.Screen name="index"/>
    <Stack.Screen name="auth/callback"/>
    <Stack.Screen name="how-it-works"/><Stack.Screen name="starting-mode"/><Stack.Screen name="sign-in"/>
    <Stack.Screen name="invite/[token]"/>
    <Stack.Protected guard={Boolean(session)}><Stack.Screen name="choose-path"/><Stack.Screen name="personalize"/><Stack.Screen name="choose-flower"/><Stack.Screen name="invite-partner"/><Stack.Screen name="invite/resume"/><Stack.Screen name="welcome"/><Stack.Screen name="(main)"/></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><InvitationProvider><OnboardingProvider><StatusBar style="dark"/><View style={{flex:1}}><DemoControls/><Navigation/></View></OnboardingProvider></InvitationProvider></AuthProvider></SafeAreaProvider>;
}
