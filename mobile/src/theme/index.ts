import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F8F3EB',
    backgroundElevated: '#FBF7F0',
    card: '#FFFDF9',
    cardWarm: '#F4EFE6',
    ink: '#2F4336',
    inkSoft: '#4E5C52',
    muted: '#817A71',
    mutedSoft: '#A39A8F',
    line: '#E8E0D5',
    lineStrong: '#D9D0C3',
    sage: '#3F624C',
    sageMid: '#728A76',
    sageLight: '#E7ECE3',
    sageWash: '#F1F4ED',
    rose: '#F2DDD6',
    coral: '#D49B8E',
    sand: '#EEE6D9',
    error: '#A94F45',
    white: '#FFFFFF',
    black: '#1F2722',
  },
  fonts: {
    heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 44 },
  radius: { small: 14, input: 16, button: 18, card: 24, large: 30, pill: 999 },
  shadow: {
    card: {
      shadowColor: '#253A2D',
      shadowOpacity: 0.07,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
      elevation: 2,
    },
    floating: {
      shadowColor: '#253A2D',
      shadowOpacity: 0.10,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
  },
} as const;
