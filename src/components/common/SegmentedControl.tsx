import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, elevation } from '@/theme/spacing';

export interface SegmentItem {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  items: SegmentItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  items,
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.segmentBtn, isSelected && styles.segmentActive]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...elevation.sm,
  },
  segmentText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textMain,
  },
  segmentTextActive: {
    color: colors.brandBlue,
  },
});

