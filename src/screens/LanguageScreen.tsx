import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FocusAwareStatusBar } from '@/components/common';
import { StorageService } from '@/services';

interface LanguageOption {
  id: string;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
];

export const LanguageScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedLang, setSelectedLang] = useState<string>('en');

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      if (lang) setSelectedLang(lang);
    });
  }, []);

  const handleSelectLanguage = (langId: string) => {
    setSelectedLang(langId);
    StorageService.saveLanguage(langId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FocusAwareStatusBar backgroundColor="#eef2fa" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Close language selection"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#3045b5" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Select Language</Text>

        {/* Empty Spacer to center the title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Language Options List */}
      <View style={styles.optionsList}>
        {LANGUAGE_OPTIONS.map((item) => {
          const isSelected = selectedLang === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.optionRow}
              onPress={() => handleSelectLanguage(item.id)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={item.label}
            >
              {/* Radio Button */}
              <View style={styles.radioOuterCircle}>
                {isSelected && <View style={styles.radioInnerDot} />}
              </View>

              {/* Language Name */}
              <Text style={styles.optionLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#5568d3',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#0e2468',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 38,
  },
  optionsList: {
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  radioOuterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a1a1a',
  },
  optionLabel: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
    color: '#1a1a1a',
    marginLeft: 16,
    letterSpacing: 0.2,
  },
});
