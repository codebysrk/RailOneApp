import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FocusAwareStatusBar } from '@/components/common/FocusAwareStatusBar';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'blue' | 'light' | 'soft' | 'custom';
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  circleBorderColor?: string;
  onBack?: () => void;
  onClose?: () => void;
  titleCenter?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    size?: number;
    color?: string;
    borderless?: boolean;
  };
  rightComponent?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  variant = 'blue',
  backgroundColor,
  textColor,
  iconColor,
  circleBorderColor,
  onBack,
  onClose,
  titleCenter = false,
  rightAction,
  rightComponent,
}) => {
  let defaultBg = '#0066ff';
  let defaultTextColor = '#ffffff';
  let defaultSubColor = 'rgba(255,255,255,0.85)';
  let defaultIconColor = '#ffffff';
  let defaultBorderColor = 'rgba(255,255,255,0.45)';
  let defaultCircleBg = 'transparent';
  let barStyle: 'light-content' | 'dark-content' = 'light-content';

  if (variant === 'light') {
    defaultBg = '#ffffff';
    defaultTextColor = '#13304b';
    defaultSubColor = '#5f6f82';
    defaultIconColor = '#0066ff';
    defaultBorderColor = '#c9d7e3';
    defaultCircleBg = '#ffffff';
    barStyle = 'dark-content';
  } else if (variant === 'soft') {
    defaultBg = '#eef2fa';
    defaultTextColor = '#0e2468';
    defaultSubColor = '#64748b';
    defaultIconColor = '#3045b5';
    defaultBorderColor = '#5568d3';
    defaultCircleBg = '#ffffff';
    barStyle = 'dark-content';
  }

  const finalBg = backgroundColor || defaultBg;
  const finalTextColor = textColor || defaultTextColor;
  const finalIconColor = iconColor || defaultIconColor;
  const finalBorderColor = circleBorderColor || defaultBorderColor;

  const hasLeft = Boolean(onBack || onClose);
  const hasRight = Boolean(rightAction || rightComponent);

  return (
    <>
      <FocusAwareStatusBar backgroundColor={finalBg} barStyle={barStyle} />
      <View style={[styles.header, { backgroundColor: finalBg }]}>
        {/* Left Action (Back or Close Button) */}
        {onBack ? (
          <TouchableOpacity
            style={[
              styles.circleBtn,
              { borderColor: finalBorderColor, backgroundColor: defaultCircleBg },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={finalIconColor} />
          </TouchableOpacity>
        ) : onClose ? (
          <TouchableOpacity
            style={[
              styles.circleBtn,
              { borderColor: finalBorderColor, backgroundColor: defaultCircleBg },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={finalIconColor} />
          </TouchableOpacity>
        ) : (
          hasRight && <View style={styles.spacer38} />
        )}

        {/* Center / Left Title Section */}
        <View
          style={[
            styles.titleWrapper,
            (titleCenter || (!hasLeft && !hasRight)) && styles.titleCentered,
            hasLeft && !titleCenter && styles.titleLeftAligned,
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: finalTextColor },
              titleCenter && styles.textAlignCenter,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: defaultSubColor },
                titleCenter && styles.textAlignCenter,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right Action */}
        {rightComponent ? (
          <View style={styles.rightWrap}>{rightComponent}</View>
        ) : rightAction ? (
          <TouchableOpacity
            style={[
              styles.circleBtn,
              rightAction.borderless
                ? styles.noBorder
                : { borderColor: finalBorderColor, backgroundColor: defaultCircleBg },
            ]}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Ionicons
              name={rightAction.icon}
              size={rightAction.size || 20}
              color={rightAction.color || finalIconColor}
            />
          </TouchableOpacity>
        ) : (
          hasLeft && <View style={styles.spacer38} />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  noBorder: {
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  spacer38: {
    width: 38,
    height: 38,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLeftAligned: {
    marginLeft: 14,
  },
  titleCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textAlignCenter: {
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  rightWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
