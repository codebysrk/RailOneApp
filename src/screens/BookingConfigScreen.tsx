import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { FirebaseService, StorageService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { AppAlert } from '@/context/AlertContext';
import { AppHeader } from '@/components/common';
import { calculateFare, TrainType } from '@/services/FareEngine';
import { RailwayDistanceEngine } from '@/services/RailwayDistanceEngine';
import { triggerHaptic } from '@/utils/haptics';

const FareTicketIcon = ({ size = 30, color = "#0066ff" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size * 0.72} viewBox="0 0 32 23" fill="none">
    <Path
      d="M 2 3.5 C 2 2.4 2.9 1.5 4 1.5 H 10 C 10 3.1 11.35 4.5 13 4.5 C 14.65 4.5 16 3.1 16 1.5 H 28 C 29.1 1.5 30 2.4 30 3.5 V 8.5 C 28.35 8.5 27 9.85 27 11.5 C 27 13.15 28.35 14.5 30 14.5 V 19.5 C 30 20.6 29.1 21.5 28 21.5 H 16 C 16 19.9 14.65 18.5 13 18.5 C 11.35 18.5 10 19.9 10 21.5 H 4 C 2.9 21.5 2 20.6 2 19.5 V 14.5 C 3.65 14.5 5 13.15 5 11.5 C 5 9.85 3.65 8.5 2 8.5 Z"
      fill={color}
    />
    <Path
      d="M 7 7.5 H 23 M 7 11.5 H 23 M 7 15.5 H 23"
      stroke="#ffffff"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

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

  const [customBaseFare, setCustomBaseFare] = useState<number | null>(null);
  const [typedFareInput, setTypedFareInput] = useState<string>('');
  const [isEditingFare, setIsEditingFare] = useState(false);
  // FIX M6: useRef for lastTap prevents stale closure on rapid double-taps
  const lastTapRef = useRef<number>(0);
  // FIX C5: prevent double-booking on rapid taps
  const isBookingRef = useRef(false);
  const [isBooking, setIsBooking] = useState(false);

  const trainKey: TrainType = trainType === 'SUPERFAST' ? 'SUPERFAST' : 'MAIL_EXP';
  const defaultSingleAdultFare = calculateFare(trainKey, 1, 0);
  const activeBaseFare = customBaseFare !== null ? customBaseFare : defaultSingleAdultFare;

  const rawPassengerFare = (adults * activeBaseFare) + Math.round(child * 0.5 * activeBaseFare);
  const totalFare = concession ? Math.round(rawPassengerFare * 0.5) : rawPassengerFare;

  const handleFareDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 350;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      setTypedFareInput(totalFare.toFixed(0));
      setIsEditingFare(true);
    } else {
      lastTapRef.current = now;
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
      setCustomBaseFare(null);
    }
  };

  const handleBookNow = async () => {
    // FIX C5: prevent double-booking on rapid taps
    if (isBookingRef.current) return;
    isBookingRef.current = true;
    setIsBooking(true);

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
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMin = now.getMinutes().toString().padStart(2, '0');
    const currentSec = now.getSeconds().toString().padStart(2, '0');
    const timeFormatted = `${currentHour}:${currentMin}`;
    const timeWithSeconds = `${currentHour}:${currentMin}:${currentSec}`;

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = DAYS[now.getDay()];
    const monthName = MONTHS[now.getMonth()];
    const year2Digit = String(currentYear).slice(-2);

    // Canonical Journey Date in required format: "Day, DD Mon YY" (e.g. "Tue, 25 Aug 26")
    const canonicalJourneyDate = `${dayName}, ${currentDay} ${monthName} ${year2Digit}`;
    const fullDateTime = `${currentDay} ${monthName} ${currentYear}, ${timeFormatted}`;

    const bookedOnStr = `${currentDay}/${currentMonth}/${currentYear} ${timeWithSeconds}`;
    const validTillStr = `${currentDay}/${currentMonth}/${currentYear} 23:59`;

    const routeInfo = RailwayDistanceEngine.getRailwayDistance(srcCode, dstCode, computedVia);
    const computedDistance = routeInfo.distance.formatted;
    const computedRNumber = 'R' + Math.floor(10000 + Math.random() * 90000);
    const computedIrCode = 'IR:' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'C1ZR';
    const generatedTicketId = 'XMSQEB' + Math.floor(1000 + Math.random() * 9000);
    const bookingIdStr = 'BK_' + Date.now();

    const newTicket = {
      id: bookingIdStr,
      bookingId: bookingIdStr,
      pnr: '',
      ticketId: generatedTicketId,
      train: 'Unreserved Express',
      date: canonicalJourneyDate,
      journeyDate: canonicalJourneyDate,
      bookingDateTime: fullDateTime,
      userId: user?.uid,
      sourceStation: { code: srcCode, name: srcName },
      destStation: { code: dstCode, name: dstName },
      adults: adults,
      children: child,
      journeyType: 'JOURNEY',
      bookedOn: bookedOnStr,
      validTill: validTillStr,
      createdAt: now.toISOString(),
      source: srcName,
      dest: dstName,
      sourceCode: srcCode,
      destCode: dstCode,
      via: computedVia,
      duration: '---',
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

    try {
      if (user?.uid) {
        await FirebaseService.saveTicket(user.uid, newTicket, true);
        await refreshProfile();
      } else {
        await StorageService.saveBookedTicket(newTicket);
      }
      triggerHaptic('success');
      navigation.navigate('Ticket', { ticket: newTicket, fromBooking: true });
    } catch (err: any) {
      // FIX C5: surface error to user (including insufficient wallet balance)
      const msg = err?.message || 'Booking failed. Please try again.';
      AppAlert.show('Booking Failed', msg, undefined, 'error');
    } finally {
      isBookingRef.current = false;
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Unreserved Journey"
        subtitle="E-Ticket"
        variant="blue"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mainWrapper}>
            <View style={styles.stationRow}>
              <View style={styles.stationCol}>
                <Text style={styles.stationName} numberOfLines={1}>{srcName}</Text>
                <Text style={styles.stationCode}>{srcCode}</Text>
              </View>
              <View style={styles.arrowWrapper}>
                <MaterialIcons name="arrow-right-alt" size={24} color="#94a3b8" />
              </View>
              <View style={[styles.stationCol, styles.stationColRight]}>
                <Text style={[styles.stationName, styles.stationNameRight]} numberOfLines={1}>{dstName}</Text>
                <Text style={[styles.stationCode, styles.stationCodeRight]}>{dstCode}</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View>
                <Text style={styles.sectionLabel}>Train Type</Text>
                <View style={styles.trainPillsRow}>
                  {trainTypeOptions.map((opt, idx) => {
                    const isSelected = trainType === opt.id;
                    const isLast = idx === trainTypeOptions.length - 1;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.trainPill,
                          isLast && styles.pillLast,
                          isSelected ? styles.pillActive : styles.pillInactive,
                          opt.hasDropdown && styles.pillWithDropdown,
                        ]}
                        onPress={() => setTrainType(opt.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            isSelected ? styles.pillTextActive : styles.pillTextInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {opt.label}
                        </Text>
                        {opt.hasDropdown && (
                          <Ionicons
                            name="chevron-down"
                            size={15}
                            color={isSelected ? '#ffffff' : '#0066ff'}
                            style={styles.dropdownIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={styles.sectionLabel}>Ticket Type</Text>
                <View style={styles.pillsRow}>
                  {ticketTypeOptions.map((opt) => {
                    const isSelected = ticketType === opt.id;
                    return (
                      <TouchableOpacity key={opt.id} style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]} onPress={() => setTicketType(opt.id)} activeOpacity={0.8}>
                        <Text style={[styles.pillText, isSelected ? styles.pillTextActive : styles.pillTextInactive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.stepperCard}>
                <Text style={styles.stepperLabel}>Adult</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity onPress={() => adults > 1 && setAdults(adults - 1)} disabled={adults <= 1}><Ionicons name="remove" size={24} color="#0066ff" /></TouchableOpacity>
                  <View style={styles.stepperBadge}><Text style={styles.stepperBadgeText}>{adults}</Text></View>
                  <TouchableOpacity onPress={() => adults < 4 && setAdults(adults + 1)} disabled={adults >= 4}><Ionicons name="add" size={24} color="#0066ff" /></TouchableOpacity>
                </View>
              </View>

              <View style={[styles.stepperCard, styles.childStepperCard]}>
                <Text style={styles.stepperLabel}>Child</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity onPress={() => child > 0 && setChild(child - 1)} disabled={child <= 0}><Ionicons name="remove" size={24} color="#0066ff" /></TouchableOpacity>
                  <View style={styles.stepperBadge}><Text style={styles.stepperBadgeText}>{child}</Text></View>
                  <TouchableOpacity onPress={() => child < 4 && setChild(child + 1)} disabled={child >= 4}><Ionicons name="add" size={24} color="#0066ff" /></TouchableOpacity>
                </View>
              </View>
              <Text style={styles.helperText}>Aged between 5 and 12 years on the day of Travel</Text>

              <View>
                <Text style={styles.sectionLabel}>Class</Text>
                <View style={styles.pillsRow}>
                  {classOptions.map((opt) => {
                    const isSelected = classType === opt.id;
                    return (
                      <TouchableOpacity key={opt.id} style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]} onPress={() => setClassType(opt.id)} activeOpacity={0.8}>
                        <Text style={[styles.pillText, isSelected ? styles.pillTextActive : styles.pillTextInactive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.concessionRow} onPress={() => setConcession(!concession)} activeOpacity={0.8}>
                <View style={[styles.radioCircle, concession && styles.radioCircleActive]}>{concession && <View style={styles.radioInnerDot} />}</View>
                <Text style={styles.concessionLabel}>Avail Concession</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.fareRow}>
                <View style={styles.fareLeft}>
                  <FareTicketIcon size={30} color="#0066ff" />
                  <Text style={styles.fareTitle}>Fare</Text>
                </View>
                <TouchableOpacity style={styles.fareRight} onPress={handleFareDoubleTap} activeOpacity={0.8}>
                  {isEditingFare ? (
                    <View style={styles.fareEditRow}>
                      <Text style={styles.fareAmountText}>₹ </Text>
                      <TextInput style={styles.fareInput} value={typedFareInput} onChangeText={setTypedFareInput} keyboardType="numeric" autoFocus onBlur={() => handleSaveCustomFare(typedFareInput)} onSubmitEditing={() => handleSaveCustomFare(typedFareInput)} selectTextOnFocus />
                    </View>
                  ) : (
                    <Text style={styles.fareAmountText}>₹ {totalFare.toFixed(0)}</Text>
                  )}
                  <View style={styles.fareBadge}><Text style={styles.fareBadgeText}>Fare Breakup</Text></View>
                </TouchableOpacity>
              </View>

              <View style={styles.bookBtnWrapper}>
                <TouchableOpacity
                  style={[styles.bookBtn, isBooking && { opacity: 0.7 }]}
                  onPress={handleBookNow}
                  activeOpacity={0.85}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066ff',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  stationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f6f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stationCol: {
    flex: 1,
  },
  stationColRight: {
    alignItems: 'flex-end',
  },
  stationName: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#13304b',
    textTransform: 'uppercase',
  },
  stationNameRight: {
    textAlign: 'right',
  },
  stationCode: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: '#5f6f82',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stationCodeRight: {
    textAlign: 'right',
  },
  arrowWrapper: {
    paddingHorizontal: 12,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#4a5568',
    marginBottom: 6,
    marginTop: 2,
  },
  trainPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainPill: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  pillLast: {
    marginRight: 0,
  },
  pillActive: {
    backgroundColor: '#0066ff',
  },
  pillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#c9d7e3',
  },
  pillWithDropdown: {
    flexDirection: 'row',
    paddingRight: 12,
  },
  dropdownIcon: {
    marginLeft: 6,
  },
  pillText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  pillTextActive: {
    fontFamily: 'Montserrat_500Medium',
    color: '#ffffff',
  },
  pillTextInactive: {
    fontFamily: 'Montserrat_400Regular',
    color: '#5f6f82',
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cde7f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  childStepperCard: {
    marginBottom: 2,
  },
  stepperLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 14,
  },
  stepperBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginTop: 1,
    marginBottom: 8,
  },
  concessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioCircleActive: {
    borderColor: '#0066ff',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066ff',
  },
  concessionLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#475569',
    marginLeft: 10,
  },
  footer: {
    backgroundColor: '#ffffff',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f6f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#13304b',
    marginLeft: 14,
  },
  fareRight: {
    alignItems: 'flex-end',
  },
  fareAmountText: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#13304b',
  },
  fareEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0066ff',
    paddingBottom: 1,
  },
  fareInput: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#13304b',
    padding: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  fareBadge: {
    borderWidth: 1,
    borderColor: '#5f6f82',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
    backgroundColor: '#f0f6f9',
  },
  fareBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#5f6f82',
  },
  bookBtnWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  bookBtn: {
    backgroundColor: '#0066ff',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.2,
  },
});
