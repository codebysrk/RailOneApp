import React from 'react';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { StatusBar as ExpoStatusBar, StatusBarStyle } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';

export interface FocusAwareStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content';
  translucent?: boolean;
}

/**
 * Calculates whether a given hex color is light or dark to auto-set icon contrast.
 */
const isColorLight = (hexColor?: string): boolean => {
  if (!hexColor) return true;
  const cleanHex = hexColor.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  return true;
};

export const FocusAwareStatusBar: React.FC<FocusAwareStatusBarProps> = ({
  backgroundColor = '#ffffff',
  barStyle,
  translucent = false,
}) => {
  const isFocused = useIsFocused();

  if (!isFocused) {
    return null;
  }

  const isLight = isColorLight(backgroundColor);
  const resolvedBarStyle = barStyle || (isLight ? 'dark-content' : 'light-content');
  const expoStyle: StatusBarStyle = isLight ? 'dark' : 'light';

  return (
    <>
      <ExpoStatusBar style={expoStyle} />
      {Platform.OS === 'android' && (
        <RNStatusBar
          barStyle={resolvedBarStyle}
          backgroundColor={backgroundColor}
          translucent={translucent}
        />
      )}
    </>
  );
};
