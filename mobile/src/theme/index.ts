import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F7F4EC',
    backgroundElevated: '#FBF9F3',
    card: '#FFFDF8',
    cardWarm: '#F0EFE5',
    ink: '#273E32',
    inkSoft: '#46564C',
    muted: '#687063',
    mutedSoft: '#73786C',
    line: '#E4E5DA',
    lineStrong: '#C9CFBF',
    sage: '#315842',
    sageMid: '#667B65',
    sageLight: '#DDE6DC',
    sageWash: '#EAF0E4',
    rose: '#EEDBD4',
    coral: '#C98F82',
    sand: '#E9DECF',
    champagne: '#B89B68',
    error: '#9D4E45',
    white: '#FFFFFF',
    black: '#1D2821',
  },
  fonts: {
    heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 },
  radius: { small: 12, input: 13, button: 13, card: 20, large: 24, pill: 999 },
  shadow: {
    card: {
      shadowColor: '#20372A',
      shadowOpacity: 0.025,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 1,
    },
    floating: {
      shadowColor: '#20372A',
      shadowOpacity: 0.07,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
  },
} as const;
