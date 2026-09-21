import { Image, StyleSheet, View } from 'react-native';

const poster = require('../../assets/opening-poster.png');

export function OpeningMedia() {
  return <View pointerEvents="none" style={local.frame} accessibilityLabel="A couple overlooking the landscape together">
    <Image source={poster} resizeMode="cover" style={local.poster}/>
    <View style={local.topVeil}/>
    <View style={local.bottomVeil}/>
  </View>;
}

const local = StyleSheet.create({
  frame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#E7DED2' },
  poster: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '34%', backgroundColor: 'rgba(248,243,235,0.20)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '31%', backgroundColor: 'rgba(32,43,35,0.07)' },
});
