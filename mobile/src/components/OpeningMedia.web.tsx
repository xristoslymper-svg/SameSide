import { Image, StyleSheet, View } from 'react-native';

const background = require('../../assets/opening-couple.jpg');

export function OpeningMedia() {
  return (
    <View
      pointerEvents="none"
      accessibilityLabel="A couple sitting together in a field looking across the landscape"
      style={local.frame}
    >
      <Image source={background} resizeMode="cover" style={local.photo} />
      <View style={local.topVeil} />
      <View style={local.bottomVeil} />
    </View>
  );
}

const local = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#E7DED2',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '43%',
    backgroundColor: 'rgba(248,243,235,0.08)',
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
    backgroundColor: 'rgba(26,36,29,0.10)',
  },
});
