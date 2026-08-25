import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface PillOption {
  id: string;
  label: string;
  hasDropdown?: boolean;
}

interface PillGroupProps {
  options: PillOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}

export const PillGroup: React.FC<PillGroupProps> = ({
  options,
  selectedId,
  onSelect,
  label,
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.pillBtn,
                isSelected ? styles.pillBtnActive : styles.pillBtnInactive,
                opt.hasDropdown && { flexDirection: 'row' },
              ]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive,
                  opt.hasDropdown && { marginRight: 4 },
                ]}
              >
                {opt.label}
              </Text>
              {opt.hasDropdown && (
                <Ionicons name="chevron-down" size={16} color={isSelected ? colors.white : '#0066ff'} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    marginBottom: 6,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#0066ff',
    borderWidth: 1,
    borderColor: '#0066ff',
  },
  pillBtnInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.white,
  },
  pillTextInactive: {
    color: '#64748b',
  },
});

