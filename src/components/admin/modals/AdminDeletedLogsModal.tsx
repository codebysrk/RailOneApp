import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminDeletedLogsModalProps {
  visible: boolean;
  onClose: () => void;
  deletedLogs: any[];
  onClearAllLogs: () => void;
  onToggleAuthRemoved: (log: any) => void;
  onDeleteSingleLog: (log: any) => void;
  onShareOrCopyUid: (log: any) => void;
}

export const AdminDeletedLogsModal: React.FC<AdminDeletedLogsModalProps> = ({
  visible,
  onClose,
  deletedLogs,
  onClearAllLogs,
  onToggleAuthRemoved,
  onDeleteSingleLog,
  onShareOrCopyUid,
}) => {
  const keyExtractor = React.useCallback((item: any) => item.id || item.uid, []);

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const isAuthRemoved = item.firebaseAuthStatus === 'auth_removed';
      return (
        <View style={styles.logCard}>
          <View style={styles.logCardHeader}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.logNameText}>{item.name || 'Unnamed'}</Text>
              <Text style={styles.logEmailText}>{item.email || 'No email'}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.authStatusBadge,
                  isAuthRemoved ? styles.authStatusBadgeDone : styles.authStatusBadgePending,
                  { flexDirection: 'row', alignItems: 'center' },
                ]}
                onPress={() => onToggleAuthRemoved(item)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isAuthRemoved ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={10}
                  color={isAuthRemoved ? '#15803d' : '#b45309'}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.authStatusBadgeText,
                    isAuthRemoved ? styles.authStatusBadgeDoneText : styles.authStatusBadgePendingText,
                  ]}
                >
                  {isAuthRemoved ? 'Auth Removed' : 'Auth Pending'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteSingleLogBtn}
                onPress={() => onDeleteSingleLog(item)}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={12} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* UID Row */}
          <View style={styles.uidContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.uidLabel}>FIREBASE AUTH UID:</Text>
              <Text style={styles.uidValueText} numberOfLines={1} selectable>
                {item.userId || item.uid || item.id}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.uidCopyBtn}
              onPress={() => onShareOrCopyUid(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="copy-outline" size={13} color="#0066ff" style={{ marginRight: 3 }} />
              <Text style={styles.uidCopyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Meta Information */}
          <View style={styles.logFooterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={11} color="#64748b" style={{ marginRight: 3 }} />
              <Text style={styles.logMetaDetail}>
                {item.deletedAt
                  ? (item.deletedAt.toDate
                      ? item.deletedAt.toDate().toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date(item.deletedAt).toLocaleString('en-IN'))
                  : 'Recent'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="user" size={11} color="#64748b" style={{ marginRight: 3 }} />
              <Text style={styles.logMetaDetail}>
                By: {item.deletedByAdminEmail ? item.deletedByAdminEmail.split('@')[0] : (item.deletedByRole || 'Admin')}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [onToggleAuthRemoved, onDeleteSingleLog, onShareOrCopyUid]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.logsModalBox}>
          <View style={styles.userTicketsModalHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="shield" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={styles.userTicketsModalTitle}>Deleted Users Logs</Text>
              </View>
              <Text style={styles.userTicketsModalSub}>
                Audit records for manual Firebase Console Auth deletion
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {deletedLogs.length > 0 && (
                <TouchableOpacity
                  style={styles.clearLogsBtn}
                  onPress={onClearAllLogs}
                  activeOpacity={0.8}
                >
                  <Feather name="trash" size={11} color="#b91c1c" style={{ marginRight: 3 }} />
                  <Text style={styles.clearLogsBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={deletedLogs}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Feather name="shield" size={36} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No deleted users logged</Text>
                <Text style={styles.emptySubtitle}>All registered accounts are currently active in Firestore.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logsModalBox: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  userTicketsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  userTicketsModalTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  userTicketsModalSub: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  clearLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  clearLogsBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  logCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logNameText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  logEmailText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  authStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  authStatusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  authStatusBadgePendingText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#b45309',
  },
  authStatusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  authStatusBadgeDoneText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#15803d',
  },
  authStatusBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
  },
  deleteSingleLogBtn: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  uidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
  },
  uidLabel: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#94a3b8',
  },
  uidValueText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0f172a',
  },
  uidCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
  },
  uidCopyBtnText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  logFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logMetaDetail: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
});

