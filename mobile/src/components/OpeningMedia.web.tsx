import { StyleSheet, View } from 'react-native';
import h0 from '../assets/openingHands0';
import h1 from '../assets/openingHands1';
import h2 from '../assets/openingHands2';
import h3 from '../assets/openingHands3';
import h4 from '../assets/openingHands4';
import h5 from '../assets/openingHands5';

const backgroundUrl = `data:image/webp;base64,${h0}${h1}${h2}${h3}${h4}${h5}`;

export function OpeningMedia() {
  return (
    <View pointerEvents="none" accessibilityLabel="Two people holding hands at sunset" style={local.frame}>
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
      />
      <View style={local.topVeil} />
      <View style={local.bottomVeil} />
    </View>
  );
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '43%', backgroundColor: 'rgba(248,243,235,0.08)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', backgroundColor: 'rgba(26,36,29,0.10)' },
});
