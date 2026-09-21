import { Image, StyleSheet, View } from 'react-native';

const background = require('../assets/sunset_hands_over_a_dreamy_valley.png');

export function OpeningMedia() {
  return (
    <View pointerEvents="none" accessibilityLabel="Two people holding hands at sunset" style={local.frame}>
      <Image source={background} resizeMode="stretch" style={local.image} />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '29%',
          background: 'linear-gradient(to bottom, rgba(231,222,210,0) 0%, rgba(231,222,210,0.10) 35%, rgba(46,57,49,0.22) 100%)',
          pointerEvents: 'none',
        }}
      />
      <View style={local.topVeil} />
    </View>
  );
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '26%', backgroundColor: 'rgba(248,243,235,0.035)' },
});
