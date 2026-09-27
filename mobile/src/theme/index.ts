import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F6F1E9',
    backgroundElevated: '#FAF6EF',
    card: '#FFFCF7',
    cardWarm: '#F1EADF',
    ink: '#263A2F',
    inkSoft: '#46564C',
    muted: '#776F66',
    mutedSoft: '#9A9187',
    line: '#E4DACC',
    lineStrong: '#D2C5B5',
    sage: '#355844',
    sageMid: '#718773',
    sageLight: '#DDE6DC',
    sageWash: '#EDF2EC',
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
  radius: { small: 14, input: 16, button: 18, card: 24, large: 30, pill: 999 },
  shadow: {
    card: {
      shadowColor: '#20372A',
      shadowOpacity: 0.055,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2,
    },
    floating: {
      shadowColor: '#20372A',
      shadowOpacity: 0.11,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
  },
} as const;
