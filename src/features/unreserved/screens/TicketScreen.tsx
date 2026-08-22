import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { spacing, elevation } from '../../../theme/spacing';
import { useAuth } from '../../../context/AuthContext';

export const TicketScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const ticketData = route.params?.ticket;

  const pnr = ticketData?.pnr || '2160978001';
  const ticketId = ticketData?.ticketId || 'XMSQEB4004';
  const source = ticketData?.source || 'MORENA';
  const dest = ticketData?.dest || 'HAZRAT NIZAMUDDIN JN';
  const fare = ticketData?.fare || '120.00';
  const bookingDate = ticketData?.date || '10 Mar 2026, 07:37';

  const userMobile = user?.mobile || '—';
  const userName = user?.name || 'Passenger';

  const [timeLeft, setTimeLeft] = useState(285);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const onShare = async () => {
    try {
      await Share.share({
        message: `UTS Journey Ticket: ${source} to ${dest}. PNR: ${pnr}. Ticket ID: ${ticketId}. Fare: ₹${fare}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader
        title="Booking Details"
        subtitle={`Mobile: ${userMobile}`}
        variant="blue"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'share-social-outline',
          onPress: onShare,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greetingText}>Thank You {userName}, Happy Journey !</Text>

        {/* Main Ticket Card */}
        <View style={styles.ticketCardWrapper}>
          {/* Top Cyan Ribbon */}
          <View style={styles.cyanRibbon} />

          {/* Dynamic Top Dark Banner */}
          <View style={styles.darkBanner}>
            {/* Left Vertical Text */}
            <View style={styles.verticalTextCol}>
              <Text style={styles.verticalText}>INDIAN RAILWAYS</Text>
            </View>

            <View style={styles.verticalDashedLine} />

            {/* Center Dynamic Content */}
            <View style={styles.centerBannerContent}>
              <Text style={styles.previewCloseText}>Dynamic preview will close in</Text>
              <Text style={styles.timerDigital}>{minutes}:{seconds}</Text>
              
              <Text style={styles.bookingDateLabel}>Ticket Booking Date & Time</Text>
              <Text style={styles.bookingDateValue}>{bookingDate}</Text>
              
              <Text style={styles.rNumberText}>R13491</Text>
              <Text style={styles.nonTransferableText}>Ticket is Non-Transferable</Text>
            </View>

            <View style={styles.verticalDashedLine} />

            {/* Right Vertical Text */}
            <View style={styles.verticalTextCol}>
              <Text style={styles.verticalTextHindi}>भारतीय रेल</Text>
            </View>
          </View>

          {/* Middle Ticket Details */}
          <View style={styles.ticketBody}>
            <View style={styles.rowBetween}>
              <Text style={styles.ticketTypeTitle}>Journey Ticket</Text>
              <Text style={styles.ticketIdText}>{ticketId}</Text>
            </View>

            {/* Station Route */}
            <View style={styles.routeRow}>
              <Text style={styles.stnNameLeft}>{source}</Text>
              <Text style={styles.distanceText}>—268 km—</Text>
              <Text style={styles.stnNameRight}>{dest}</Text>
            </View>

            {/* Via & Passenger */}
            <View style={styles.detailsGrid}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Via</Text>
                <Text style={styles.gridValue}>TKD</Text>
              </View>
              <View style={[styles.gridCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.gridLabel}>Passenger</Text>
                <Text style={styles.gridValue}>{ticketData?.passengers || '1 Adult, 0 Child'}</Text>
              </View>
            </View>

            {/* Booked on & Valid Till */}
            <View style={styles.detailsGrid}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Booked on</Text>
                <Text style={styles.gridValue}>{bookingDate}</Text>
              </View>
              <View style={[styles.gridCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.gridLabel}>*Valid Till</Text>
                <Text style={styles.gridValue}>10/03/2026 23:59</Text>
              </View>
            </View>

            {/* Class & Fare */}
            <View style={styles.fareInfoBlock}>
              <Text style={styles.fareSummaryText}>{ticketData?.classType || 'SECOND'} | {ticketData?.trainType || 'SUPERFAST'} | JOURNEY | ₹{fare}</Text>
              <Text style={styles.irCodeText}>IR:23AAAGM0289C1ZR</Text>
            </View>

            {/* Tear Cutout Line */}
            <View style={styles.tearWrapper}>
              <View style={[styles.tearCutout, styles.tearCutoutLeft]} />
              <View style={styles.tearDashedLine} />
              <View style={[styles.tearCutout, styles.tearCutoutRight]} />
            </View>

            <Text style={styles.validityNote}>
              *Valid for start of journey by 10/03/2026 or until departure of first train
            </Text>
          </View>

          {/* Bottom Cyan Ribbon */}
          <View style={styles.cyanRibbon} />
        </View>

        {/* Warning Note */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Note: This ticket is non refundable. Ticket is stored locally on the device, Please do not change your handset or perform factory reset.
          </Text>
        </View>

        {/* Book Connecting Journey Button */}
        <TouchableOpacity style={styles.connectingBtn} activeOpacity={0.8}>
          <Text style={styles.connectingBtnText}>Book Connecting Journey</Text>
        </TouchableOpacity>

        {/* Dense UTS QR Code Section */}
        <View style={styles.qrSectionCard}>
          <View style={styles.qrHeaderRow}>
            <Ionicons name="qr-code" size={18} color="#0066ff" style={{ marginRight: 6 }} />
            <Text style={styles.qrHeaderText}>UTS SECURE TICKET MATRIX</Text>
          </View>
          <View style={styles.qrFrame}>
            <Image 
              source={{
                uri: `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                  `CRIS//IR-UTS//VER-4.8.2//PNR:${pnr}//TK:${ticketId}//TRN:${ticketData?.train || '12279-TAJ-EXP'}//FROM:${source}//TO:${dest}//DATE:${bookingDate}//FARE:${fare}//PAX:${ticketData?.passengers || '1A0C'}//CLS:${ticketData?.classType || '2S'}//TYP:${ticketData?.trainType || 'SF'}//MOB:${userMobile}//CRIS_SIG:9AF83E1C0D724B91823C5E0A72B81F94CD039EA6182B40D5//SHA256:7e8b91a2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc//SEC:CRIS-ENCRYPTED-AES256`
                )}&ecc=H&margin=1`
              }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.qrFooterText}>Scan by TTE / ATVM / UTS Handheld Terminal</Text>
        </View>

        {/* Do You Know Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Do you know?</Text>
          <Text style={styles.infoText}>IR recovers only 57% of cost of travel on an average.</Text>
          <Text style={styles.infoText}>
            This ticket is booked on a personal user ID. It's sale/purchase is an offence u/s 143 of the Railways Act, 1989
          </Text>
          <Text style={styles.infoText}>
            For enquiry and integrated railway helpline. please dial 139.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: spacing.md, paddingBottom: 40 },
  greetingText: { fontSize: 13, color: '#64748b', marginBottom: spacing.md, textAlign: 'center' },

  ticketCardWrapper: { 
    backgroundColor: colors.white, 
    borderRadius: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    ...elevation.md,
    marginBottom: spacing.md
  },
  cyanRibbon: { height: 14, backgroundColor: '#06b6d4' },

  darkBanner: { 
    backgroundColor: '#0f172a', 
    flexDirection: 'row', 
    paddingVertical: 12, 
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  verticalTextCol: { width: 38, alignItems: 'center', justifyContent: 'center' },
  verticalText: { 
    color: '#e2e8f0', 
    fontSize: 14, 
    fontWeight: 'bold', 
    letterSpacing: 1.5,
    transform: [{ rotate: '-90deg' }],
    width: 140,
    textAlign: 'center'
  },
  verticalTextHindi: { 
    color: '#e2e8f0', 
    fontSize: 19, 
    fontWeight: 'bold', 
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
    width: 140,
    textAlign: 'center'
  },
  verticalDashedLine: { width: 1, height: '88%', borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  centerBannerContent: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  previewCloseText: { color: colors.white, fontSize: 13, fontWeight: '500' },
  timerDigital: { color: '#ef4444', fontSize: 36, fontWeight: '900', letterSpacing: 2, marginVertical: 2 },
  bookingDateLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  bookingDateValue: { color: '#f59e0b', fontSize: 17, fontWeight: 'bold', marginTop: 1 },
  rNumberText: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  nonTransferableText: { color: colors.white, fontSize: 11, marginTop: 2 },

  ticketBody: { padding: spacing.md, backgroundColor: '#ffffff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ticketTypeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  ticketIdText: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },

  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  stnNameLeft: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  distanceText: { fontSize: 12, color: '#64748b', marginHorizontal: 8 },
  stnNameRight: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', flex: 1, textAlign: 'right' },

  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  gridCol: { flex: 1 },
  gridLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  gridValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },

  fareInfoBlock: { marginTop: 8, marginBottom: 12 },
  fareSummaryText: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  irCodeText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  tearWrapper: { height: 20, flexDirection: 'row', alignItems: 'center', position: 'relative', marginVertical: 6 },
  tearDashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed' },
  tearCutout: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f8fafc', position: 'absolute', top: -1 },
  tearCutoutLeft: { left: -26 },
  tearCutoutRight: { right: -26 },

  validityNote: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 6 },

  warningCard: { 
    backgroundColor: '#fef2f2', 
    borderRadius: 12, 
    padding: spacing.md, 
    borderWidth: 1, 
    borderColor: '#fecaca', 
    marginBottom: spacing.md 
  },
  warningText: { color: '#ef4444', fontSize: 12, lineHeight: 17, textAlign: 'center' },

  connectingBtn: { 
    backgroundColor: colors.white, 
    paddingVertical: 12, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#0066ff', 
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  connectingBtnText: { color: '#0066ff', fontSize: 14, fontWeight: '600' },

  qrSectionCard: { 
    backgroundColor: colors.white, 
    borderRadius: 16, 
    padding: spacing.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginBottom: spacing.lg,
    ...elevation.sm
  },
  qrHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qrHeaderText: { fontSize: 13, fontWeight: '800', color: '#1e293b', letterSpacing: 0.8 },
  qrFrame: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qrImage: { width: 250, height: 250 },
  qrFooterText: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 10, textAlign: 'center' },

  infoSection: { paddingHorizontal: 4, marginBottom: spacing.xl },
  infoSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#065f46', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 12 }
});
