import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Brand } from './ui';
import { AccountMenu } from './AccountMenu';

export function AppHeader() {
 return <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
  <Pressable accessibilityRole="button" accessibilityLabel="Same Side — Today" onPress={() => router.navigate('/today')} style={({pressed})=>({ minHeight: 44, justifyContent: 'center', opacity: pressed ? .72 : 1 })}><Brand/></Pressable>
  <AccountMenu/>
 </View>;
}
