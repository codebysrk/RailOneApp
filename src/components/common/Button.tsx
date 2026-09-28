import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled 
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        disabled && styles.disabled,
        Platform.OS === 'ios' && pressed && { opacity: 0.8 },
        style
      ]} 
      onPress={onPress}
      disabled={disabled}
      android_ripple={{
        color: isPrimary ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 102, 255, 0.14)',
        borderless: false,
      }}
    >
      <Text style={[
        styles.text,
        isPrimary && styles.textPrimary,
        isOutline && styles.textOutline,
        disabled && styles.textDisabled,
        textStyle
      ]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.brandBlue,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brandBlue,
  },
  disabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.brandBlue,
  },
  textDisabled: {
    color: '#888',
  }
});

