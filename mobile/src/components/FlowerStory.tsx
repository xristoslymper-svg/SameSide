import { Modal, Text } from 'react-native';
import { Button, Screen, styles } from './ui';
import { BotanicalFlower } from './BotanicalFlower';
import { findFlower, type FlowerId } from '../features/flowers';

export function FlowerStory({ flower, close }: { flower: FlowerId | null; close: () => void }) {
 const definition = findFlower(flower);
 if (!definition) return null;
 return <Modal visible animationType="fade" onRequestClose={close}><Screen>
  <Button label="Close flower story" secondary onPress={close}/>
  <Text style={styles.eyebrow}>The story of your flower</Text>
  <Text style={styles.title}>{definition.name}</Text><Text style={styles.small}>{definition.botanical}</Text>
  <BotanicalFlower flower={definition.id}/><Text style={styles.cardTitle}>{definition.meaning}</Text>
  <Text style={styles.body}>{definition.story}</Text>
 </Screen></Modal>;
}
