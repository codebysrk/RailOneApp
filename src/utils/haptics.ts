import { Vibration, Platform } from 'react-native';

export const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    switch (type) {
      case 'light':
        Vibration.vibrate(12);
        break;
      case 'medium':
        Vibration.vibrate(28);
        break;
      case 'success':
        Vibration.vibrate([0, 25, 50, 25]);
        break;
      default:
        Vibration.vibrate(15);
    }
  } catch {}
};
