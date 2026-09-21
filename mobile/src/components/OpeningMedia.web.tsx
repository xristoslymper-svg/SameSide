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
        style={{
          position: 'absolute',
          left: 0,
          top: '-18%',
          width: '100%',
          height: '118%',
          objectFit: 'cover',
          objectPosition: '50% 50%',
          display: 'block',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          background: 'linear-gradient(to bottom, rgba(231,222,210,0) 0%, rgba(231,222,210,0.16) 28%, rgba(46,57,49,0.26) 100%)',
          pointerEvents: 'none',
        }}
      />
      <View style={local.topVeil} />
    </View>
  );
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '28%', backgroundColor: 'rgba(248,243,235,0.04)' },
});
