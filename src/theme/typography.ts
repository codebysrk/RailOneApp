import { Platform } from 'react-native';

export const typography = {
  family: {
    regular: Platform.select({ ios: 'Roboto-Regular', android: 'Roboto_400Regular', default: 'sans-serif' }),
    medium: Platform.select({ ios: 'Roboto-Medium', android: 'Roboto_500Medium', default: 'sans-serif-medium' }),
    bold: Platform.select({ ios: 'Roboto-Bold', android: 'Roboto_700Bold', default: 'sans-serif' }),
    black: Platform.select({ ios: 'Roboto-Black', android: 'Roboto_900Black', default: 'sans-serif' }),
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    heavy: '900' as const,
  },
};


