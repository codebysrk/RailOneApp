import React, { useState, useEffect, useRef } from "react";
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
  Easing,
  BackHandler,
  AppState,
} from "react-native";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from '@/components/common';
import { colors } from '@/theme/colors';
import { spacing, elevation } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';

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

  // Outgoing number: slides down from 0 to +50 and fades out
  const outgoingTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });
  const outgoingOpacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.3, 0],
  });

  // Incoming number: slides from top -50 to 0 and fades in
  const incomingTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
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

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const currentDateTime = `${dateFormatted}, ${timeFormatted}`;

  const pnr = ticketData?.pnr || '---';
  const ticketId = ticketData?.ticketId || '---';
  const source = ticketData?.source || '---';
  const dest = ticketData?.dest || '---';
  const fare = ticketData?.fare || '0.00';
  let bookingDate = ticketData?.bookingDateTime || ticketData?.date || currentDateTime;
  if (bookingDate && !bookingDate.includes(":")) {
    bookingDate = `${bookingDate}, ${timeFormatted}`;
  }

  const userMobile = user?.mobile || ticketData?.userMobile || '---';
  const userName = user?.name || ticketData?.userName || 'Passenger';

  const TOTAL_DURATION = 300; // 5 minutes window
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const [isActive, setIsActive] = useState(isFocused && appState.current === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      setIsActive(isFocused && appState.current === 'active');
    });
    return () => subscription.remove();
  }, [isFocused]);

  useEffect(() => {
    setIsActive(isFocused && appState.current === 'active');
  }, [isFocused]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (timeLeft === 0) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    }
  }, [timeLeft, navigation]);

  useEffect(() => {
    if (timeLeft === TOTAL_DURATION) {
      progressAnim.setValue(0);
    } else {
      Animated.timing(progressAnim, {
        toValue: 1 - timeLeft / TOTAL_DURATION,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, progressAnim, TOTAL_DURATION]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Back Navigation Handler
  const handleBack = () => {
    if (fromBooking) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
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
        routes: [{ name: "Main" }],
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [fromBooking, navigation]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  // Formatted timestamps & metadata (24 Hours Ticket Validity)
  const validDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const currentDay = now.getDate().toString().padStart(2, "0");
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMin = now.getMinutes().toString().padStart(2, "0");

  const validDay = validDate.getDate().toString().padStart(2, "0");
  const validMonth = (validDate.getMonth() + 1).toString().padStart(2, "0");
  const validYear = validDate.getFullYear();
  const validHour = validDate.getHours().toString().padStart(2, "0");
  const validMin = validDate.getMinutes().toString().padStart(2, "0");

  const defaultBookedNumeric = `${currentDay}/${currentMonth}/${currentYear} ${currentHour}:${currentMin}`;
  const defaultValidTillNumeric = `${validDay}/${validMonth}/${validYear} ${validHour}:${validMin}`;

  const bookedNumeric = ticketData?.bookedOn || defaultBookedNumeric;
  const validTillNumeric = ticketData?.validTill || defaultValidTillNumeric;
  const rNumber = ticketData?.rNumber || ('R' + Math.floor(10000 + Math.random() * 90000));
  const irCode = ticketData?.irCode || ('IR:' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'C1ZR');
  const via = ticketData?.via || 'TKD';
  const distance = ticketData?.distance || '---';

  // Feedback State
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
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
      Alert.alert(
        "Feedback",
        "Please provide a star rating or comments before submitting.",
      );
      return;
    }
    setFeedbackSubmitted(true);
    Alert.alert(
      "Thank You!",
      "Your rating and feedback have been recorded successfully.",
    );
  };

  const qrSecurityDigest = [
    `CRIS//IR-UTS//VER-4.8.2`,
    `PNR:${pnr}`,
    `TK:${ticketId}`,
    `TRN:${ticketData?.train || '12279-TAJ-EXP'}`,
    `SRC:${source}`,
    `DST:${dest}`,
    `VIA:${via}`,
    `DIST:${distance}`,
    `DATE:${bookingDate}`,
    `EXP:${validTillNumeric}`,
    `FARE:${fare}`,
    `PAX:${ticketData?.passengers || '1A0C'}`,
    `CLS:${ticketData?.classType || '2S'}`,
    `TYP:${ticketData?.trainType || 'SF'}`,
    `RNUM:${rNumber}`,
    `IRCD:${irCode}`,
    `MOB:${userMobile}`,
    `SIG:8F932D17B32E4E90B8A11928374650AC7E8B91A2`,
    `SEC:CRIS-ENCRYPTED`,
  ].join('//');

  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    qrSecurityDigest
  )}&ecc=M&margin=1`;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <AppHeader
        title="Booking Details"
        subtitle={`Mobile: ${userMobile}`}
        variant="blue"
        onBack={handleBack}
        rightAction={{
          icon: "share-social-outline",
          onPress: onShare,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Thank You {userName}, Happy Journey !
            </Text>
          </View>

          {/* ─── 1. Main Pixel-Perfect Ticket Card ────────────────────── */}
          <View style={styles.ticketShadow}>
            <View style={styles.ticketCardWrapper}>
              {/* Top Cyan Accent Ribbon */}
              <View style={styles.cyanRibbon} />

              {/* Dynamic Dark Banner */}
              <View style={styles.darkBanner}>
                {/* Left Vertical Column */}
                <View style={styles.verticalColLeft}>
                  <Text style={styles.verticalTextEnglish}>
                    INDIAN RAILWAYS
                  </Text>
                </View>

                <View style={styles.verticalDashedSeparator} />

                {/* Center Countdown Content */}
                <View style={styles.centerBannerContent}>
                  <Text style={styles.previewCloseText}>
                    Dynamic preview will close in
                  </Text>

                  <View style={styles.timerRow}>
                    <ReverseSlidingBlock value={minutes} />
                    <Text style={styles.timerColon}>:</Text>
                    <ReverseSlidingBlock value={seconds} />
                  </View>

                  <Text style={styles.bookingDateLabel}>
                    Ticket Booking Date & Time
                  </Text>

                  <Text style={styles.bookingDateValue}>{bookingDate}</Text>

                  <Text style={styles.rNumberText}>{rNumber}</Text>

                  <Text style={styles.nonTransferableText}>
                    Ticket is Non-Transferable
                  </Text>
                </View>

                <View style={styles.verticalDashedSeparator} />

                {/* Right Vertical Column */}
                <View style={styles.verticalColRight}>
                  <Text style={styles.verticalTextHindi}>भारतीय रेल</Text>
                </View>
              </View>

              {/* Dynamic Cyan Ribbon Progress Bar at Bottom of Dark Section */}
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[styles.progressBarFill, { width: progressWidth }]}
                />
              </View>

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
                    <Text style={styles.gridValueRight}>
                      {ticketData?.passengers || "1 Adult, 0 Child"}
                    </Text>
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
                    <Text style={styles.gridValueRight}>
                      {validTillNumeric}
                    </Text>
                  </View>
                </View>

                {/* Row 5: Class | Type | Fare */}
                <View style={styles.fareInfoBlock}>
                  <Text style={styles.fareSummaryText}>
                    {ticketData?.classType || "SECOND"} |{" "}
                    {ticketData?.trainType || "ORDINARY"} | JOURNEY | ₹{fare}
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
                  *Valid for start of journey within 24 hours or until departure
                  of the first train.
                </Text>
              </View>

              {/* Bottom Cyan Accent Ribbon */}
              <View style={styles.cyanRibbon} />
            </View>
          </View>

          {/* Warning Note */}
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Note: This ticket is non refundable. Ticket is stored locally on
              the device, Please do not change your handset or perform factory
              reset.
            </Text>
          </View>

          {/* Book Connecting Journey Button */}
          <TouchableOpacity style={styles.connectingBtn} activeOpacity={0.8}>
            <Text style={styles.connectingBtnText}>
              Book Connecting Journey
            </Text>
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
              This ticket is booked on a personal user ID.{"\n"}
              It's sale/purchase is an offence u/s 143 of the{"\n"}
              Railways Act, 1989
            </Text>

            <Text style={styles.infoParagraph}>
              For enquiry and integrated railway helpline.{"\n"}
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
                        name={rating >= star ? "star" : "star-outline"}
                        size={28}
                        color={rating >= star ? "#f59e0b" : "#6b655c"}
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
                  <Text style={styles.charCounter}>
                    {description.length}/200
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (rating > 0 || description.length > 0) &&
                      styles.submitBtnActive,
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
  container: { flex: 1, backgroundColor: "#0066ff" },
  scrollView: { flex: 1, backgroundColor: "#f2f2f2" },
  scrollContent: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 24 },
  greetingContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: -12,
    marginTop: -6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    zIndex: 10,
  },
  greetingText: {
    fontSize: 12,
    color: "#404040",
    textAlign: "left",
    fontWeight: "400",
  },
  ticketShadow: {
    marginBottom: 5,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketCardWrapper: { borderRadius: 12, overflow: "hidden" },
  cyanRibbon: { height: 12, backgroundColor: "rgb(0, 190, 204)" },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#adadad",
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "rgb(0, 190, 204)" },
  darkBanner: {
    backgroundColor: "#111722",
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  verticalColLeft: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalTextEnglish: {
    color: "#a0aab8",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    transform: [{ rotate: "-90deg" }],
    width: 140,
    textAlign: "center",
  },
  verticalColRight: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalTextHindi: {
    color: "#a0aab8",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.5,
    transform: [{ rotate: "-90deg" }],
    width: 140,
    textAlign: "center",
  },
  verticalDashedSeparator: {
    width: 1,
    height: "88%",
    borderWidth: 0.5,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  centerBannerContent: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
  previewCloseText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  odometerBlock: {
    width: 58,
    height: 46,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  odometerAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
  },
  timerColon: {
    color: "#ff2020",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
    marginHorizontal: 2,
    textAlign: "center",
  },
  timerDigital: {
    color: "#ff2020",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1,
    lineHeight: 48,
    textAlign: "center",
  },
  bookingDateLabel: {
    color: "#a0aab8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  bookingDateValue: {
    color: "#ff9800",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 24,
    marginTop: 2,
  },
  rNumberText: {
    color: "#a0aab8",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  nonTransferableText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  ticketBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ticketTypeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
    letterSpacing: 0.2,
  },
  ticketIdText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  stnNameLeft: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
    letterSpacing: 0.2,
  },
  distanceText: {
    fontSize: 11,
    color: "#555555",
    marginHorizontal: 2,
    fontWeight: "500",
  },
  stnNameRight: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
    textAlign: "right",
    letterSpacing: 0.2,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  gridColLeft: { flex: 1 },
  gridColRight: { flex: 1, alignItems: "flex-end" },
  gridLabel: { fontSize: 11, color: "#666666", fontWeight: "500" },
  gridLabelRight: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "500",
    textAlign: "right",
  },
  gridValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#333333",
    marginTop: 1,
  },
  gridValueRight: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#333333",
    textAlign: "right",
    marginTop: 1,
  },
  fareInfoBlock: { marginVertical: 3, marginTop: 6 },
  fareSummaryText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#555555",
    letterSpacing: 0.2,
  },
  irCodeText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#555555",
    marginTop: 2,
  },
  tearWrapper: {
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  tearDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.5,
    borderColor: "#cccccc",
    borderStyle: "dashed",
  },
  tearCutout: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f2f2f2",
    position: "absolute",
    top: -7,
  },
  tearCutoutLeft: { left: -27 },
  tearCutoutRight: { right: -27 },
  validityNote: {
    fontSize: 10,
    color: "#555555",
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginVertical: 6,
  },
  warningText: {
    color: "#ef4444",
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: "center",
  },
  connectingBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0066ff",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  connectingBtnText: { color: "#0066ff", fontSize: 14, fontWeight: "600" },
  qrSection: { paddingVertical: 16, alignItems: "center" },
  qrImage: { width: 230, height: 230 },
  sectionDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: -12,
    marginVertical: 6,
  },
  infoSection: { paddingVertical: 16 },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  infoParagraph: {
    fontSize: 13,
    color: "#4a4742",
    lineHeight: 18,
    marginBottom: 10,
  },
  ratingSection: { paddingVertical: 16 },
  experienceTitle: { fontSize: 14, fontWeight: "700", color: "#222222" },
  ratingLabel: { fontSize: 13, color: "#4a4742", marginVertical: 8 },
  starsRow: { flexDirection: "row", alignItems: "center" },
  starBtn: { marginRight: 12, padding: 2 },
  textareaContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#9e968a",
    borderRadius: 8,
    height: 100,
    padding: 8,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  textareaInput: {
    flex: 1,
    fontSize: 13,
    color: "#222222",
    textAlignVertical: "top",
  },
  charCounter: { fontSize: 11, color: "#6e685f", textAlign: "right" },
  submitBtn: {
    marginTop: 12,
    backgroundColor: "#e4e4e4",
    borderRadius: 20,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnActive: { backgroundColor: "#aba192" },
  submitBtnText: { fontSize: 14, fontWeight: "600", color: "#524b43" },
});
