import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';

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
  const isCompleted = status === 'completed';
  
  // Exact color calibration from screenshots
  const borderColor = isUpcoming ? '#f39c42' : isCompleted ? '#2ea566' : '#ef4444';
  const dashedColor = isUpcoming ? '#f39c42' : isCompleted ? '#2ea566' : '#ef4444';

  const badgeText = ticket.moduleType === 'UNRESERVED' ? 'Unreserved' 
                  : ticket.moduleType === 'PLATFORM' ? 'Platform' 
                  : 'Reserved';

  return (
    <View style={[styles.ticketCard, { borderColor }]}>
      {/* Top Section */}
      <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={styles.ticketTop}>
        {/* Row 1: Badge & PNR */}
        <View style={styles.ticketHeaderRow}>
          <View style={styles.badgeReserved}>
            <Text style={styles.badgeReservedText}>{badgeText}</Text>
          </View>
          <Text style={styles.pnrContainer}>
            <Text style={styles.pnrLabel}>PNR: </Text>
            <Text style={styles.pnrValue}>{ticket.pnr}</Text>
          </Text>
        </View>

        {/* Row 2: Train No & Journey Date */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Train No.</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{ticket.train}</Text>
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Journey Date</Text>
            <Text style={styles.infoValue}>{ticket.date}</Text>
          </View>
        </View>

        {/* Row 3: Route & Duration */}
        <View style={styles.routeRow}>
          <Text style={styles.routeStationLeft} numberOfLines={1}>
            {ticket.source}
          </Text>
          <View style={styles.routeDuration}>
            <Text style={styles.durationText}>
              {ticket.duration ? `—${ticket.duration}—` : '—4h:8m—'}
            </Text>
          </View>
          <Text style={styles.routeStationRight} numberOfLines={2}>
            {ticket.dest}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Perforation / Notched Divider */}
      <View style={styles.dividerContainer}>
        {/* Left Cutout */}
        <View style={[styles.cutout, styles.cutoutLeft, { borderColor }]} />
        {/* Dashed Line */}
        <View style={[styles.dashedLine, { borderColor: dashedColor }]} />
        {/* Right Cutout */}
        <View style={[styles.cutout, styles.cutoutRight, { borderColor }]} />
      </View>

      {/* Bottom Actions Section */}
      <View style={styles.ticketBottom}>
        <TouchableOpacity style={styles.actionBtn} onPress={onBookAgain || onOpen} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>Book Again</Text>
        </TouchableOpacity>
        <View style={styles.verticalDivider} />
        <TouchableOpacity style={styles.actionBtn} onPress={onOpen} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ticketTop: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeReserved: {
    backgroundColor: '#c7f1f6',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 7,
  },
  badgeReservedText: {
    color: '#0097a7',
    fontSize: 13,
    fontWeight: '700',
  },
  pnrContainer: {
    fontSize: 14,
  },
  pnrLabel: {
    color: '#64748b',
    fontWeight: '700',
  },
  pnrValue: {
    color: '#1e293b',
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '400',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13.5,
    color: '#1e293b',
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  routeStationLeft: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textTransform: 'uppercase',
  },
  routeDuration: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  durationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  routeStationRight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  dividerContainer: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginVertical: -12,
    zIndex: 5,
  },
  dashedLine: {
    flex: 1,
    height: 0,
    borderWidth: 0.8,
    borderStyle: 'dashed',
    marginHorizontal: 12,
  },
  cutout: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    position: 'absolute',
    borderWidth: 1.2,
    zIndex: 6,
  },
  cutoutLeft: {
    left: -13,
  },
  cutoutRight: {
    right: -13,
  },
  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#ffffff',
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
    height: 18,
    backgroundColor: '#e2e8f0',
  },
});

