import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  Animated,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { spacing, elevation } from '../../../theme/spacing';
import { useAuth } from '../../../context/AuthContext';

// ─── Reverse Sliding Counter (Odometer Block) ───────────────────
const ReverseSlidingBlock = ({ value }: { value: string }) => {
  const [currentVal, setCurrentVal] = useState(value);
  const [prevVal, setPrevVal] = useState<string | null>(null);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== currentVal) {
      setPrevVal(currentVal);
      setCurrentVal(value);
      anim.setValue(0);

      Animated.timing(anim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start(() => {
        setPrevVal(null);
      });
    }
  }, [value, currentVal, anim]);

  // Outgoing number: slides down from 0 to +44 and fades out
  const outgoingTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 44],
  });
  const outgoingOpacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.3, 0],
  });

  // Incoming number: slides from top -44 to 0 and fades in
  const incomingTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-44, 0],
  });
  const incomingOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <View style={styles.odometerBlock}>
      {prevVal !== null && (
        <Animated.Text
          style={[
            styles.timerDigital,
            styles.odometerAbsolute,
            {
              transform: [{ translateY: outgoingTranslateY }],
              opacity: outgoingOpacity,
            },
          ]}
        >
          {prevVal}
        </Animated.Text>
      )}
      <Animated.Text
        style={[
          styles.timerDigital,
          prevVal !== null && styles.odometerAbsolute,
          prevVal !== null && {
            transform: [{ translateY: incomingTranslateY }],
            opacity: incomingOpacity,
          },
        ]}
      >
        {currentVal}
      </Animated.Text>
    </View>
  );
};

export const TicketScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const ticketData = route.params?.ticket;
  const fromBooking = route.params?.fromBooking;

  const pnr = ticketData?.pnr || '2160978001';
  const ticketId = ticketData?.ticketId || 'XMJTEFH005';
  const source = ticketData?.source || 'RAJA-KI-MANDI';
  const dest = ticketData?.dest || 'AGRA CANTT';
  const fare = ticketData?.fare || '10.00';
  const bookingDate = ticketData?.date || '14 Aug 2026, 14:01';

  const userMobile = user?.mobile || '9584113861';
  const userName = user?.name || 'Passenger';

  const [timeLeft, setTimeLeft] = useState(268);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Back Navigation Handler
  const handleBack = () => {
    if (fromBooking) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else {
      navigation.goBack();
    }
  };

  // Hardware Android Back Button Handler
  useEffect(() => {
    if (!fromBooking) return;
    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [fromBooking, navigation]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  // Formatted timestamps & metadata
  const bookedNumeric = '14/08/2026 14:01';
  const validTillNumeric = '14/08/2026 17:01';
  const rNumber = ticketData?.rNumber || 'R15594';
  const irCode = ticketData?.irCode || 'IR:09AAAGM0289C1ZH';
  const via = ticketData?.via || '---';
  const distance = ticketData?.distance || '4 km';

  // Feedback State
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const onShare = async () => {
    try {
      await Share.share({
        message: `UTS Journey Ticket: ${source} to ${dest}. PNR: ${pnr}. Ticket ID: ${ticketId}. Fare: ₹${fare}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitFeedback = () => {
    if (rating === 0 && !description.trim()) {
      Alert.alert('Feedback', 'Please provide a star rating or comments before submitting.');
      return;
    }
    setFeedbackSubmitted(true);
    Alert.alert('Thank You!', 'Your rating and feedback have been recorded successfully.');
  };

  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    `CRIS//IR-UTS//VER-4.8.2//PNR:${pnr}//TK:${ticketId}//TRN:${ticketData?.train || '12279-TAJ-EXP'}//FROM:${source}//TO:${dest}//DATE:${bookingDate}//FARE:${fare}//PAX:${ticketData?.passengers || '1A0C'}//CLS:${ticketData?.classType || '2S'}//TYP:${ticketData?.trainType || 'SF'}//MOB:${userMobile}//CRIS_SIG:9AF83E1C0D724B91823C5E0A72B81F94CD039EA6182B40D5//SHA256:7e8b91a2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc//SEC:CRIS-ENCRYPTED-AES256`
  )}&ecc=H&margin=1`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <AppHeader
        title="Booking Details"
        subtitle={`Mobile: ${userMobile}`}
        variant="blue"
        onBack={handleBack}
        rightAction={{
          icon: 'share-social-outline',
          onPress: onShare,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.greetingText}>Thank You {userName}, Happy Journey !</Text>

          {/* ─── 1. Main Pixel-Perfect Ticket Card ────────────────────── */}
          <View style={styles.ticketCardWrapper}>
            {/* Top Purple Accent Ribbon */}
            <View style={styles.purpleRibbon} />

            {/* Dynamic Dark Banner */}
            <View style={styles.darkBanner}>
              {/* Left Vertical Column */}
              <View style={styles.verticalColLeft}>
                <Text style={styles.verticalTextEnglish}>INDIAN RAILWAYS</Text>
              </View>

              <View style={styles.verticalDashedSeparator} />

              {/* Center Countdown Content */}
              <View style={styles.centerBannerContent}>
                <Text style={styles.previewCloseText}>Dynamic preview will close in</Text>

                <View style={styles.timerRow}>
                  <ReverseSlidingBlock value={minutes} />
                  <Text style={styles.timerColon}>:</Text>
                  <ReverseSlidingBlock value={seconds} />
                </View>

                <Text style={styles.bookingDateLabel}>Ticket Booking Date & Time</Text>

                <Text style={styles.bookingDateValue}>{bookingDate}</Text>

                <Text style={styles.rNumberText}>{rNumber}</Text>

                <Text style={styles.nonTransferableText}>Ticket is Non-Transferable</Text>
              </View>

              <View style={styles.verticalDashedSeparator} />

              {/* Right Vertical Column */}
              <View style={styles.verticalColRight}>
                <Text style={styles.verticalTextHindi}>भारतीय रेल</Text>
              </View>
            </View>

            {/* Purple Accent Ribbon below Top Dark Section */}
            <View style={styles.purpleRibbon} />

            {/* Ticket Body (Warm Off-White Cream Paper Section) */}
            <View style={styles.ticketBody}>
              {/* Row 1: Journey Ticket & Reference ID */}
              <View style={styles.rowBetween}>
                <Text style={styles.ticketTypeTitle}>Journey Ticket</Text>
                <Text style={styles.ticketIdText}>{ticketId}</Text>
              </View>

              {/* Row 2: Route & Distance */}
              <View style={styles.routeRow}>
                <Text style={styles.stnNameLeft}>{source}</Text>
                <Text style={styles.distanceText}>—{distance}—</Text>
                <Text style={styles.stnNameRight}>{dest}</Text>
              </View>

              {/* Row 3: Via & Passenger */}
              <View style={styles.detailsGrid}>
                <View style={styles.gridColLeft}>
                  <Text style={styles.gridLabel}>Via</Text>
                  <Text style={styles.gridValue}>{via}</Text>
                </View>
                <View style={styles.gridColRight}>
                  <Text style={styles.gridLabelRight}>Passenger</Text>
                  <Text style={styles.gridValueRight}>{ticketData?.passengers || '1 Adult, 0 Child'}</Text>
                </View>
              </View>

              {/* Row 4: Booked on & Valid Till */}
              <View style={styles.detailsGrid}>
                <View style={styles.gridColLeft}>
                  <Text style={styles.gridLabel}>Booked on</Text>
                  <Text style={styles.gridValue}>{bookedNumeric}</Text>
                </View>
                <View style={styles.gridColRight}>
                  <Text style={styles.gridLabelRight}>*Valid Till</Text>
                  <Text style={styles.gridValueRight}>{validTillNumeric}</Text>
                </View>
              </View>

              {/* Row 5: Class | Type | Fare */}
              <View style={styles.fareInfoBlock}>
                <Text style={styles.fareSummaryText}>
                  {ticketData?.classType || 'SECOND'} | {ticketData?.trainType || 'ORDINARY'} | JOURNEY | ₹{fare}
                </Text>
                <Text style={styles.irCodeText}>{irCode}</Text>
              </View>

              {/* Perforation Notch Cutout Line */}
              <View style={styles.tearWrapper}>
                <View style={[styles.tearCutout, styles.tearCutoutLeft]} />
                <View style={styles.tearDashedLine} />
                <View style={[styles.tearCutout, styles.tearCutoutRight]} />
              </View>

              {/* Row 6: Validity Disclaimer */}
              <Text style={styles.validityNote}>
                *Valid for start of journey within 3 hour or until departure of the first train.
              </Text>
            </View>

            {/* Bottom Purple Accent Ribbon */}
            <View style={styles.purpleRibbon} />
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

          {/* Full-width Divider */}
          <View style={styles.sectionDivider} />

          {/* ─── 2. Dense QR Code Section ────────────────────────────── */}
          <View style={styles.qrSection}>
            <Image
              source={{ uri: qrUri }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Full-width Divider */}
          <View style={styles.sectionDivider} />

          {/* ─── 3. "Do you know?" Section ───────────────────────────── */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Do you know?</Text>

            <Text style={styles.infoParagraph}>
              IR recovers only 57% of cost of travel on an average.
            </Text>

            <Text style={styles.infoParagraph}>
              This ticket is booked on a personal user ID.{'\n'}
              It's sale/purchase is an offence u/s 143 of the{'\n'}
              Railways Act, 1989
            </Text>

            <Text style={styles.infoParagraph}>
              For enquiry and integrated railway helpline.{'\n'}
              please dial 139.
            </Text>
          </View>

          {/* ─── 4. Rating & Experience Section (Disappears once submitted) ── */}
          {!feedbackSubmitted && (
            <>
              {/* Full-width Divider */}
              <View style={styles.sectionDivider} />

              <View style={styles.ratingSection}>
                <Text style={styles.experienceTitle}>
                  How was your ticket booking experience ?
                </Text>

                <Text style={styles.ratingLabel}>Your Rating</Text>

                {/* 5 Outlined Stars */}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={rating >= star ? 'star' : 'star-outline'}
                        size={28}
                        color={rating >= star ? '#f59e0b' : '#6b655c'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description Textarea Box */}
                <View style={styles.textareaContainer}>
                  <TextInput
                    style={styles.textareaInput}
                    placeholder="Description"
                    placeholderTextColor="#7a746b"
                    multiline
                    maxLength={200}
                    value={description}
                    onChangeText={setDescription}
                  />
                  <Text style={styles.charCounter}>{description.length}/200</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (rating > 0 || description.length > 0) && styles.submitBtnActive,
                  ]}
                  onPress={handleSubmitFeedback}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066ff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  greetingText: {
    fontSize: 13,
    color: '#555555',
    marginBottom: 10,
    fontWeight: '500',
  },

  // ─── Ticket Card Wrapper ─────────────────────────────────────
  ticketCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: spacing.sm,
  },
  purpleRibbon: {
    height: 7,
    backgroundColor: '#8378b8',
  },

  // ─── Top Dark Section (Dynamic Preview) ──────────────────────
  darkBanner: {
    backgroundColor: '#111722',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalColLeft: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalTextEnglish: {
    color: '#707f93',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
    width: 140,
    textAlign: 'center',
  },
  verticalColRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalTextHindi: {
    color: '#707f93',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    transform: [{ rotate: '-90deg' }],
    width: 140,
    textAlign: 'center',
  },
  verticalDashedSeparator: {
    width: 1,
    height: '88%',
    borderWidth: 1,
    borderColor: '#253243',
    borderStyle: 'dashed',
  },

  centerBannerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  previewCloseText: {
    color: '#ede9e2',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  odometerBlock: {
    width: 58,
    height: 42,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  odometerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
  },
  timerColon: {
    color: '#ff2020',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    marginHorizontal: 1,
    paddingBottom: 2,
    textAlign: 'center',
  },
  timerDigital: {
    color: '#ff2020',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 44,
    textAlign: 'center',
  },
  bookingDateLabel: {
    color: '#7b8798',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 5,
  },
  bookingDateValue: {
    color: '#f5600d',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 1,
    lineHeight: 27,
  },
  rNumberText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 5,
  },
  nonTransferableText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 2,
  },

  // ─── Lower Paper Section (Ticket Information) ────────────────
  ticketBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f5f4f0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    letterSpacing: 0.2,
  },
  ticketIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 0.5,
  },

  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  stnNameLeft: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1c2434',
    flex: 1,
    letterSpacing: 0.2,
  },
  distanceText: {
    fontSize: 13.5,
    color: '#555555',
    marginHorizontal: 4,
    fontWeight: '500',
  },
  stnNameRight: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1c2434',
    flex: 1,
    textAlign: 'right',
    letterSpacing: 0.2,
  },

  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
  },
  gridColLeft: { flex: 1 },
  gridColRight: { flex: 1, alignItems: 'flex-end' },
  gridLabel: { fontSize: 13, color: '#666666', fontWeight: '500', marginBottom: 2 },
  gridLabelRight: { fontSize: 13, color: '#666666', fontWeight: '500', marginBottom: 2, textAlign: 'right' },
  gridValue: { fontSize: 14.5, fontWeight: '700', color: '#111111' },
  gridValueRight: { fontSize: 14.5, fontWeight: '700', color: '#111111', textAlign: 'right' },

  fareInfoBlock: {
    marginTop: 6,
    marginBottom: 6,
  },
  fareSummaryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2a2a2a',
    letterSpacing: 0.2,
  },
  irCodeText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2a2a2a',
    marginTop: 3,
    marginBottom: 8,
  },

  // ─── Perforation Notch Cutout Line ───────────────────────────
  tearWrapper: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  tearDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#c2bcaf',
    borderStyle: 'dashed',
  },
  tearCutout: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: -1,
  },
  tearCutoutLeft: { left: -29 },
  tearCutoutRight: { right: -29 },

  validityNote: {
    fontSize: 11.5,
    color: '#4a453e',
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 6,
  },

  // ─── Warning Card ────────────────────────────────────────────
  warningCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: spacing.sm,
  },
  warningText: { color: '#ef4444', fontSize: 11.5, lineHeight: 16, textAlign: 'center' },

  // ─── Connecting Journey Button ───────────────────────────────
  connectingBtn: {
    backgroundColor: colors.white,
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0066ff',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  connectingBtnText: { color: '#0066ff', fontSize: 14, fontWeight: '600' },

  // ─── Dense QR Code Section ───────────────────────────────────
  qrSection: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 215,
    height: 215,
  },

  // ─── Full-width Divider ──────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: '#c8bfb2',
    marginHorizontal: -12,
    marginVertical: 4,
  },

  // ─── "Do you know?" Section ──────────────────────────────────
  infoSection: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  infoTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },
  infoParagraph: {
    fontSize: 13.5,
    color: '#4a4742',
    lineHeight: 19.5,
    marginBottom: 14,
    fontWeight: '400',
  },

  // ─── Rating Section ──────────────────────────────────────────
  ratingSection: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#4a4742',
    marginTop: 14,
    marginBottom: 12,
    fontWeight: '400',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    marginRight: 14,
    padding: 2,
  },

  // ─── Textarea Box ────────────────────────────────────────────
  textareaContainer: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#9e968a',
    borderRadius: 8,
    height: 116,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  textareaInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#222222',
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    fontSize: 12,
    color: '#6e685f',
    textAlign: 'right',
  },

  // ─── Submit Button ───────────────────────────────────────────
  submitBtn: {
    marginTop: 18,
    marginBottom: 12,
    backgroundColor: '#e4e4e4',
    borderRadius: 24,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#aba192',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#524b43',
  },
});
