import { StyleSheet, View } from 'react-native';

const backgroundUrl = 'https://images.unsplash.com/photo-1761206532410-f0042edbeb9b?auto=format&fit=crop&w=2000&q=85';

export function OpeningMedia() {
  return (
    <View
      pointerEvents="none"
      accessibilityLabel="A couple sitting together in a field at sunset"
      style={local.frame}
    >
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
        }}
      />
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
