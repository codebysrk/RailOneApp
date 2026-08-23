import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  helperText?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  label,
  value,
  min = 0,
  max = 10,
  onChange,
  helperText,
}) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleDecrement} disabled={value <= min}>
            <Ionicons name="remove" size={24} color={value <= min ? '#cbd5e1' : colors.brandBlue} />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.value}>{value}</Text>
          </View>
          <TouchableOpacity onPress={handleIncrement} disabled={value >= max}>
            <Ionicons name="add" size={24} color={value >= max ? '#cbd5e1' : colors.brandBlue} />
          </TouchableOpacity>
        </View>
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  value: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});

