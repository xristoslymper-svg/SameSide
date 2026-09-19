import { Modal, Image, Text } from 'react-native';
import { Brand, Button, Screen, styles } from './ui';

export function RealGarden({ visible, close }: { visible: boolean; close: () => void }) {
 if (!visible) return null;
 return <Modal visible={visible} animationType="slide" onRequestClose={close}><Screen><Brand/>
  <Button label="Close garden story" secondary onPress={close}/>
  <Text style={styles.eyebrow}>From your screen to our garden</Text>
  <Text style={styles.title}>Something real begins.</Text>
  <Text style={styles.body}>The flower you’re growing here doesn’t end on your screen. When it blooms, we’ll plant the same species in the physical Same Side Garden.</Text>
  <Image accessibilityLabel="Illustrative test garden" source={require('../../assets/test-garden.png')} style={{ width: '100%', aspectRatio: 1.5, borderRadius: 12 }} resizeMode="cover"/>
  <Text style={styles.small}>Illustrative prototype image · not a photo of your flower or the physical Same Side Garden.</Text>
  <Text style={styles.cardTitle}>One digital flower. One real flower.</Text>
  <Text style={styles.body}>Grown from the little things. When there’s something to see, we’ll share a photo from the garden.</Text>
 </Screen></Modal>;
}
