import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F7F2EA', card: '#FFFDF8', ink: '#39483C', muted: '#7F776D',
    line: '#E8DFD3', sage: '#667A68', sageLight: '#E4EAE0', rose: '#F2DED8',
    coral: '#C78378', error: '#9B463E', white: '#FFFFFF',
  },
  fonts: { heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) },
  radius: { card: 28, button: 18, input: 16 },
} as const;
