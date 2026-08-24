import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { FocusAwareStatusBar } from '@/components/common/FocusAwareStatusBar';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'blue' | 'light';
  backgroundColor?: string;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  rightComponent?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  variant = 'blue',
  backgroundColor,
  onBack,
  onClose,
  rightAction,
  rightComponent,
}) => {
  const isBlue = variant === 'blue';
  const headerBg = backgroundColor || (isBlue ? '#0066ff' : '#ffffff');
  const textColor = isBlue ? colors.white : colors.textHeading;
  const iconColor = isBlue ? colors.white : colors.brandBlue;
  const circleBorderColor = isBlue ? 'rgba(255,255,255,0.4)' : '#bfdbfe';

  return (
    <>
      <FocusAwareStatusBar backgroundColor={headerBg} />
      <View style={[styles.header, isBlue ? styles.blueHeader : styles.lightHeader, backgroundColor ? { backgroundColor } : null]}>
      {onBack && (
        <TouchableOpacity style={[styles.circleBtn, { borderColor: circleBorderColor }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={iconColor} />
        </TouchableOpacity>
      )}

      {onClose && !onBack && <View style={styles.spacer38} />}

      <View style={[styles.titleWrapper, !onBack && !onClose && styles.titleCentered]}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: isBlue ? 'rgba(255,255,255,0.85)' : colors.textLight }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      {onClose && (
        <TouchableOpacity style={[styles.circleBtn, { borderColor: circleBorderColor }]} onPress={onClose}>
          <Ionicons name="close" size={20} color={iconColor} />
        </TouchableOpacity>
      )}

      {rightAction && (
        <TouchableOpacity style={styles.rightActionBtn} onPress={rightAction.onPress}>
          <Ionicons name={rightAction.icon} size={22} color={iconColor} />
        </TouchableOpacity>
      )}

      {rightComponent && (
        <View style={styles.rightActionBtn}>
          {rightComponent}
        </View>
      )}

      {!onClose && !rightAction && !rightComponent && (onBack ? <View style={styles.spacer38} /> : null)}
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  blueHeader: {
    backgroundColor: '#0066ff',
  },
  lightHeader: {
    backgroundColor: '#ffffff',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer38: {
    width: 38,
  },
  titleWrapper: {
    flex: 1,
    marginLeft: spacing.md,
  },
  titleCentered: {
    marginLeft: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 1,
  },
  rightActionBtn: {
    padding: 6,
  },
});

