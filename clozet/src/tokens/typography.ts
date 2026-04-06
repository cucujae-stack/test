import {TextStyle} from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: {fontSize: 28, fontWeight: 'bold', lineHeight: 34},
  h2: {fontSize: 22, fontWeight: 'bold', lineHeight: 28},
  h3: {fontSize: 18, fontWeight: '600', lineHeight: 24},
  body: {fontSize: 16, fontWeight: 'normal', lineHeight: 22},
  caption: {fontSize: 12, fontWeight: 'normal', lineHeight: 16},
} as const;
