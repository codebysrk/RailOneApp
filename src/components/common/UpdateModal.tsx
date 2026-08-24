import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { ReleaseInfo, UpdateService } from '@/services';

interface UpdateModalProps {
  visible: boolean;
  releaseInfo: ReleaseInfo | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  releaseInfo,
  onClose,
}) => {
  if (!releaseInfo) return null;

  const handleUpdateNow = () => {
    UpdateService.openUpdateUrl(releaseInfo.downloadUrl);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          {/* Header Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-download" size={36} color="#0066ff" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Update Available! 🎉</Text>
          <Text style={styles.subtitle}>
            A new version of RailOne is ready to install with improvements and new features.
          </Text>

          {/* Version Pill Info */}
          <View style={styles.versionRow}>
            <View style={styles.versionBadgeOld}>
              <Text style={styles.versionTextOld}>v{releaseInfo.currentVersion}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#94a3b8" style={styles.arrowIcon} />
            <View style={styles.versionBadgeNew}>
              <Text style={styles.versionTextNew}>v{releaseInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Release Notes Changelog */}
          <View style={styles.changelogBox}>
            <Text style={styles.changelogTitle}>What's New:</Text>
            <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.changelogContent}>
                {releaseInfo.releaseNotes || 'Bug fixes, performance improvements, and UI enhancements.'}
              </Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={handleUpdateNow}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={20} color="#ffffff" style={styles.downloadIcon} />
            <Text style={styles.updateBtnText}>Download & Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.laterBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  versionBadgeOld: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionTextOld: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
  },
  versionBadgeNew: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionTextNew: {
    fontSize: 13,
    color: '#0066ff',
    fontWeight: '700',
  },
  changelogBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    maxHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  changelogTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  changelogScroll: {
    maxHeight: 80,
  },
  changelogContent: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  updateBtn: {
    backgroundColor: '#0066ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  laterBtnText: {
    color: '#94a3b8',
    fontSize: 13.5,
    fontWeight: '600',
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  downloadIcon: {
    marginRight: 6,
  },
});

