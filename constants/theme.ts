// constants/theme.ts
import { Platform } from 'react-native';

export const Colors = {
  primary: '#DDA131',      // Amber - buttons, accents
  secondary: '#02153A',    // Navy Blue - headers, text
  background: '#FFFFFF',
  text: '#02153A',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#E0E0E0',
  muted: '#757575',
  white: '#FFFFFF',
  inputBackground: '#F5F5F5',
};

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});