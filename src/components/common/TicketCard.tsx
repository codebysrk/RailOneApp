import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export interface TicketData {
  id: string;
  pnr: string;
  ticketId?: string;
  train: string;
  date: string;
  source: string;
  dest: string;
  duration?: string;
  fare?: string;
  passengers?: string;
  classType?: string;
  trainType?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  moduleType?: 'RESERVED' | 'UNRESERVED' | 'PLATFORM';
}

interface TicketCardProps {
  ticket: TicketData;
  status: 'upcoming' | 'completed' | 'cancelled';
  onOpen?: () => void;
  onBookAgain?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  status,
  onOpen,
  onBookAgain,
}) => {
  const isUpcoming = status === 'upcoming';
  const borderColor = isUpcoming ? '#f59e0b' : status === 'completed' ? '#10b981' : '#ef4444';

  const badgeText = ticket.moduleType === 'UNRESERVED' ? 'Unreserved' 
                  : ticket.moduleType === 'PLATFORM' ? 'Platform' 
                  : 'Reserved';

  return (
    <TouchableOpacity
      style={[styles.ticketCard, { borderColor }]}
      activeOpacity={0.9}
      onPress={onOpen}
    >
      {/* Top Section */}
      <View style={styles.ticketTop}>
        <View style={styles.ticketHeaderRow}>
          <View style={styles.badgeReserved}>
            <Text style={styles.badgeReservedText}>{badgeText}</Text>
          </View>
          <Text style={styles.pnrText}>
            <Text style={{ color: '#64748b' }}>PNR: </Text>
            {ticket.pnr}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Train No.</Text>
            <Text style={styles.infoValue}>{ticket.train}</Text>
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Journey Date</Text>
            <Text style={styles.infoValue}>{ticket.date}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <Text style={[styles.routeStation, { flex: 1 }]}>{ticket.source}</Text>
          <View style={styles.routeDuration}>
            <View style={styles.lineHalf} />
            <Text style={styles.durationText}>{ticket.duration || '4h:8m'}</Text>
            <View style={styles.lineHalf} />
          </View>
          <Text style={[styles.routeStation, { flex: 1, textAlign: 'right' }]}>{ticket.dest}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.cutout, styles.cutoutLeft, { borderColor }]} />
        <View style={[styles.dashedLine, { borderColor }]} />
        <View style={[styles.cutout, styles.cutoutRight, { borderColor }]} />
      </View>

      {/* Bottom Section */}
      <View style={styles.ticketBottom}>
        <TouchableOpacity style={styles.actionBtn} onPress={onBookAgain || onOpen}>
          <Text style={styles.actionBtnText}>Book Again</Text>
        </TouchableOpacity>
        <View style={styles.verticalDivider} />
        <TouchableOpacity style={styles.actionBtn} onPress={onOpen}>
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: spacing.md,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeReserved: {
    backgroundColor: '#cffafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeReservedText: {
    color: '#0891b2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pnrText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeStation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  routeDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  lineHalf: {
    width: 20,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  durationText: {
    fontSize: 11,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  dividerContainer: {
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    position: 'absolute',
    top: -10,
    borderWidth: 1,
  },
  cutoutLeft: {
    left: -11,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  cutoutRight: {
    right: -11,
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  ticketBottom: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#0066ff',
    fontSize: 15,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
});

