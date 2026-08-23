import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { FirebaseService, StorageService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { AppHeader, PillGroup, Stepper } from '@/components/common';
import { calculateFare, TrainType } from '@/services/FareEngine';

const trainTypeOptions = [
  { id: 'MAIL/EXP', label: 'MAIL/EXP' },
  { id: 'SUPERFAST', label: 'SUPERFAST' },
  { id: 'OTHERS', label: 'OTHERS', hasDropdown: true },
];

const ticketTypeOptions = [
  { id: 'JOURNEY', label: 'JOURNEY' },
];

const classOptions = [
  { id: 'SECOND', label: 'SECOND' },
];

export const BookingConfigScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, refreshProfile } = useAuth();

  const sourceParam = route.params?.source || 'MRA - MORENA';
  const destParam = route.params?.dest || 'NDLS - NEW DELHI';

  const srcParts = sourceParam.split(' - ');
  const srcCode = srcParts[0]?.trim() || 'MRA';
  const srcName = srcParts[1]?.trim() || srcParts[0]?.trim() || 'MORENA';

  const dstParts = destParam.split(' - ');
  const dstCode = dstParts[0]?.trim() || 'NDLS';
  const dstName = dstParts[1]?.trim() || dstParts[0]?.trim() || 'NEW DELHI';

  const [trainType, setTrainType] = useState('MAIL/EXP');
  const [ticketType, setTicketType] = useState('JOURNEY');
  const [adults, setAdults] = useState(1);
  const [child, setChild] = useState(0);
  const [classType, setClassType] = useState('SECOND');
  const [concession, setConcession] = useState(false);

  // Manual base fare override via double tap
  const [customBaseFare, setCustomBaseFare] = useState<number | null>(null);
  const [typedFareInput, setTypedFareInput] = useState<string>('');
  const [isEditingFare, setIsEditingFare] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);

  const trainKey: TrainType = trainType === 'SUPERFAST' ? 'SUPERFAST' : 'MAIL_EXP';
  const defaultSingleAdultFare = calculateFare(trainKey, 1, 0);
  const activeBaseFare = customBaseFare !== null ? customBaseFare : defaultSingleAdultFare;

  // Dynamically calculate total fare based on active base fare, adults, and children
  const rawPassengerFare = (adults * activeBaseFare) + Math.round(child * 0.5 * activeBaseFare);
  const totalFare = concession ? Math.round(rawPassengerFare * 0.5) : rawPassengerFare;

  const handleFareDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 350;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      setTypedFareInput(totalFare.toFixed(0));
      setIsEditingFare(true);
    } else {
      setLastTap(now);
    }
  };

  const handleSaveCustomFare = (inputVal: string) => {
    setIsEditingFare(false);
    const num = parseFloat(inputVal);
    if (!isNaN(num) && num > 0) {
      const passengerMultiplier = (adults + (child * 0.5)) * (concession ? 0.5 : 1);
      const derivedBaseFare = passengerMultiplier > 0 ? num / passengerMultiplier : num;
      setCustomBaseFare(derivedBaseFare);
    } else if (inputVal.trim() === '') {
      setCustomBaseFare(null); // reset to default engine calculation
    }
  };

  const handleBookNow = async () => {
    // Calculate route via junctions
    let computedVia = 'TKD';
    if ((srcCode === 'MRA' || srcCode === 'GWL') && (dstCode === 'NDLS' || dstCode === 'NZM' || dstCode === 'DLI')) {
      computedVia = 'TKD';
    } else if ((srcCode === 'NDLS' || srcCode === 'NZM') && (dstCode === 'MRA' || dstCode === 'GWL')) {
      computedVia = 'TKD';
    } else if (srcCode === 'NDLS' && (dstCode === 'BPL' || dstCode === 'RKMP')) {
      computedVia = 'TKD, GWL, JHS';
    } else if (srcCode === 'NDLS' && dstCode === 'HWH') {
      computedVia = 'TKD, CNB, PRYJ';
    } else if (srcCode === 'NDLS' && dstCode === 'MMCT') {
      computedVia = 'TKD, KOTA, BRC';
    }

    const now = new Date();
    const validTillDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateFormatted = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const fullDateTime = `${dateFormatted}, ${timeFormatted}`;

    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear();

    const validDay = validTillDate.getDate().toString().padStart(2, '0');
    const validMonth = (validTillDate.getMonth() + 1).toString().padStart(2, '0');
    const validYear = validTillDate.getFullYear();

    const bookedOnStr = `${currentDay}/${currentMonth}/${currentYear} ${timeFormatted}`;
    const validTillStr = `${validDay}/${validMonth}/${validYear} ${timeFormatted}`;

    const computedDistance = Math.floor(totalFare * 4.5) + ' km';
    const computedRNumber = 'R' + Math.floor(10000 + Math.random() * 90000);
    const computedIrCode = 'IR:' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'C1ZR';

    const newTicket = {
      id: Date.now().toString(),
      pnr: '21' + Math.floor(10000000 + Math.random() * 90000000),
      ticketId: 'XMSQEB' + Math.floor(1000 + Math.random() * 9000),
      train: '12279 (TAJ EXPRESS)',
      date: fullDateTime,
      bookingDateTime: fullDateTime,
      bookedOn: bookedOnStr,
      validTill: validTillStr,
      source: srcName,
      dest: dstName,
      sourceCode: srcCode,
      destCode: dstCode,
      via: computedVia,
      duration: '4h:8m',
      distance: computedDistance,
      rNumber: computedRNumber,
      irCode: computedIrCode,
      fare: totalFare.toFixed(2),
      passengers: `${adults} Adult, ${child} Child`,
      classType: classType,
      trainType: trainType,
      status: 'upcoming' as const,
      moduleType: 'UNRESERVED' as const,
    };
    // Save to Firestore if logged in with atomic wallet deduction, else fallback to local storage
    try {
      if (user?.uid) {
        await FirebaseService.saveTicket(user.uid, newTicket, true);
        await refreshProfile();
      } else {
        await StorageService.saveBookedTicket(newTicket);
      }
    } catch {
      await StorageService.saveBookedTicket(newTicket);
    }
    navigation.navigate('Ticket', { ticket: newTicket, fromBooking: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Unreserved Journey"
        subtitle="E-Ticket"
        variant="blue"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station Row */}
        <View style={styles.stationRow}>
          <View style={styles.stationCol}>
            <Text style={styles.stationName}>{srcName}</Text>
            <Text style={styles.stationCode}>{srcCode}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
          <View style={[styles.stationCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.stationName}>{dstName}</Text>
            <Text style={styles.stationCode}>{dstCode}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Train Type */}
          <PillGroup
            label="Train Type"
            options={trainTypeOptions}
            selectedId={trainType}
            onSelect={setTrainType}
          />

          {/* Ticket Type */}
          <PillGroup
            label="Ticket Type"
            options={ticketTypeOptions}
            selectedId={ticketType}
            onSelect={setTicketType}
          />

          {/* Stepper Counters */}
          <Stepper
            label="Adult"
            value={adults}
            min={1}
            max={4}
            onChange={setAdults}
          />

          <Stepper
            label="Child"
            value={child}
            min={0}
            max={4}
            onChange={setChild}
            helperText="Aged between 5 and 12 years on the day of Travel"
          />

          {/* Class */}
          <PillGroup
            label="Class"
            options={classOptions}
            selectedId={classType}
            onSelect={setClassType}
          />

          {/* Concession */}
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setConcession(!concession)}>
            <Ionicons
              name={concession ? 'radio-button-on' : 'radio-button-off'}
              size={24}
              color={concession ? colors.brandBlue : '#64748b'}
            />
            <Text style={styles.checkboxLabel}>Avail Concession</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.fareRow}>
          <View style={styles.fareLeft}>
            <Ionicons name="ticket" size={26} color="#0066ff" />
            <Text style={styles.fareLabel}>Fare</Text>
          </View>
          <TouchableOpacity
            style={styles.fareRight}
            onPress={handleFareDoubleTap}
            activeOpacity={0.8}
          >
            {isEditingFare ? (
              <View style={styles.fareEditRow}>
                <Text style={styles.fareAmount}>₹ </Text>
                <TextInput
                  style={styles.fareInput}
                  value={typedFareInput}
                  onChangeText={setTypedFareInput}
                  keyboardType="numeric"
                  autoFocus
                  onBlur={() => handleSaveCustomFare(typedFareInput)}
                  onSubmitEditing={() => handleSaveCustomFare(typedFareInput)}
                  selectTextOnFocus
                />
              </View>
            ) : (
              <Text style={styles.fareAmount}>₹ {totalFare.toFixed(0)}</Text>
            )}
            <View style={styles.fareBadge}>
              <Text style={styles.fareBadgeText}>Fare Breakup</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.bookBtnContainer}>
          <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow} activeOpacity={0.8}>
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: 20 },
  stationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  stationCol: { flex: 1 },
  stationName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  stationCode: { fontSize: 12, color: '#64748b', marginTop: 1 },

  formContainer: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#64748b', fontWeight: '400' },

  footer: {
    backgroundColor: '#ffffff',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fareLeft: { flexDirection: 'row', alignItems: 'center' },
  fareLabel: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginLeft: 10 },
  fareRight: { alignItems: 'flex-end' },
  fareAmount: { fontSize: 15.5, fontWeight: '700', color: '#1e293b' },
  fareEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0066ff',
    paddingBottom: 1,
  },
  fareInput: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1e293b',
    padding: 0,
    minWidth: 36,
    textAlign: 'center',
  },
  fareBadge: { borderWidth: 1, borderColor: '#64748b', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, marginTop: 3 },
  fareBadgeText: { fontSize: 9, color: '#64748b', fontWeight: '500' },
  bookBtnContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  bookBtn: { backgroundColor: '#0066ff', paddingVertical: 13, borderRadius: 24, alignItems: 'center' },
  bookBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
