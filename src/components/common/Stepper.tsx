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
    marginTop: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
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
    marginHorizontal: 16,
  },
  value: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 6,
  },
});

