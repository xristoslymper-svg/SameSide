import { Image, StyleSheet, View } from 'react-native';
import h0 from '../assets/openingHands0';
import h1 from '../assets/openingHands1';
import h2 from '../assets/openingHands2';
import h3 from '../assets/openingHands3';
import h4 from '../assets/openingHands4';
import h5 from '../assets/openingHands5';

const background = { uri: `data:image/webp;base64,${h0}${h1}${h2}${h3}${h4}${h5}` };

export function OpeningMedia() {
  return <View pointerEvents="none" style={local.frame} accessibilityLabel="Two people holding hands at sunset">
    <Image source={background} resizeMode="cover" style={local.photo}/>
    <View style={local.topVeil}/>
    <View style={local.bottomVeil}/>
  </View>;
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '43%', backgroundColor: 'rgba(248,243,235,0.08)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', backgroundColor: 'rgba(26,36,29,0.10)' },
});
