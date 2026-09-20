import { Modal, Image, Text, View } from 'react-native';
import { Brand, Button, Screen, styles } from './ui';
import type { PhysicalGardenState } from '../features/product';

export function RealGarden({ visible, close, state }: { visible: boolean; close: () => void; state?: PhysicalGardenState }) {
 if (!visible) return null;
 const status=state?.status??'growing';
 const title=status==='photo_ready'?'A little update from the garden':status==='planted'?'Your flower has been planted':status==='ready_to_plant'?'Your bloom is ready for the real garden':'Something real begins.';
 const body=status==='photo_ready'?'Your digital flower became part of a real Same Side planting. This update comes from the garden where your cohort was planted.':status==='planted'?'Your chosen species is now part of the Same Side Garden. We’ll share an update when there’s something to see.':status==='ready_to_plant'?'Your flower has bloomed here. It’s now ready to be included in the next Same Side planting.':'The flower you’re growing here doesn’t end on your screen. When it blooms, we’ll plant the same species in the physical Same Side Garden.';
 return <Modal visible={visible} animationType="slide" onRequestClose={close}><Screen><Brand/>
  <Button label="Close garden story" secondary onPress={close}/>
  <Text style={styles.eyebrow}>From your screen to our garden</Text>
  <Text style={styles.title}>{title}</Text>
  <Text style={styles.body}>{body}</Text>
  <Image accessibilityLabel="Illustrative test garden" source={require('../../assets/test-garden.png')} style={{ width: '100%', aspectRatio: 1.5, borderRadius: 12 }} resizeMode="cover"/>
  <Text style={styles.small}>Illustrative prototype image · not a photo of your individual flower.</Text>
  {state?.batch&&<View style={styles.card}><Text style={styles.eyebrow}>Planting batch</Text><Text style={styles.cardTitle}>{state.batch}</Text>{state.plantedAt&&<Text style={styles.small}>Planted {new Date(state.plantedAt).toLocaleDateString()}</Text>}</View>}
  <Text style={styles.cardTitle}>One digital flower. One real flower.</Text>
  <Text style={styles.body}>{status==='photo_ready'?'Your garden update is part of a shared planting, not an individually tracked plant.':status==='planted'?'Grown from the little things. We’ll keep the promise visible as the real garden develops.':'Grown from the little things. When there’s something real to share, you’ll see the next step here.'}</Text>
 </Screen></Modal>;
}
