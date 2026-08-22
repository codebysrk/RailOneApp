import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, elevation } from '../../theme/spacing';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightAction}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.brandBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    ...elevation.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  }
});

