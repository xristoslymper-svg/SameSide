import { Image, StyleSheet, View } from 'react-native';

const background = require('../assets/sunset_hands_over_a_dreamy_valley.png');

export function OpeningMedia() {
  return <View pointerEvents="none" style={local.frame} accessibilityLabel="Two people holding hands at sunset">
    <Image source={background} resizeMode="stretch" style={local.baseImage}/>
    <Image source={background} resizeMode="stretch" style={local.liftedImage}/>
    <View style={local.topVeil}/>
    <View style={local.bottomVeil}/>
  </View>;
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  baseImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  liftedImage: { position: 'absolute', left: 0, right: 0, top: 0, width: '100%', height: '84%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '26%', backgroundColor: 'rgba(248,243,235,0.035)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '31%', backgroundColor: 'rgba(26,36,29,0.16)' },
});
