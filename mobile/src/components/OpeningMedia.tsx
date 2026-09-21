import { createElement } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

const poster = require('../../assets/opening-poster.png');
const film = require('../../assets/flower-bloom.mp4');

export function OpeningMedia() {
  if (Platform.OS === 'web') {
    const uri = (asset: unknown) => typeof asset === 'string' ? asset : (asset as { uri?: string; default?: string })?.uri ?? (asset as { default?: string })?.default;
    const posterUri = uri(poster);
    const filmUri = uri(film);
    return <View style={local.frame} accessibilityLabel="A flower growing and blooming">
      {createElement('video', {
        autoPlay: true, muted: true, loop: true, playsInline: true, preload: 'auto', poster: posterUri,
        src: filmUri, style: local.video,
      })}
      <View pointerEvents="none" style={local.topVeil}/><View pointerEvents="none" style={local.bottomVeil}/>
    </View>;
  }
  return <View style={local.frame} accessibilityLabel="A flower growing and blooming">
    <Image source={poster} resizeMode="cover" style={local.poster}/><View pointerEvents="none" style={local.topVeil}/><View pointerEvents="none" style={local.bottomVeil}/>
  </View>;
}

const local = StyleSheet.create({
  frame: { height: 500, width: '100%', borderRadius: 32, overflow: 'hidden', backgroundColor: '#E7DED2', position: 'relative' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  poster: { width: '100%', height: '100%' },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: 135, backgroundColor: 'rgba(248,243,235,0.16)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 175, backgroundColor: 'rgba(33,45,37,0.10)' },
});
