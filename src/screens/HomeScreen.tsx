import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { colors } from '@/theme/colors';
import { spacing, elevation } from '@/theme/spacing';
import { FirebaseService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import {
  APP_OFFERINGS as offerings,
  APP_FACTS as facts,
} from "@/constants";
import {
  SearchTrainsIcon,
  PNRStatusIcon,
  CoachPositionIcon,
  TrackYourTrainIcon,
  OrderFoodIcon,
  FileRefundIcon,
  RailMadadIcon,
  GoToWavesIcon,
} from "@/components/OfferingIcons";

const { width } = Dimensions.get("window");
const JP_CARD_WIDTH = (width - 32 - 20) / 3;
const OFFERING_CARD_SIZE = (width - 32 - 36) / 4;

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [upcomingList, setUpcomingList] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = FirebaseService.listenToTickets(
      user.uid,
      (snapshot: any) => {
        const tickets: any[] = [];
        snapshot.forEach((doc: any) => {
          const data = { id: doc.id, ...doc.data() };
          if (data.status === "upcoming") tickets.push(data);
        });
        setUpcomingList(tickets);
      },
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const renderOfferingIcon = (type: string, color: string) => {
    switch (type) {
      case "search":
        return <SearchTrainsIcon color={color} size={30} />;
      case "pnr":
        return <PNRStatusIcon color={color} size={30} />;
      case "coach":
        return <CoachPositionIcon color={color} size={30} />;
      case "track":
        return <TrackYourTrainIcon color={color} size={30} />;
      case "food":
        return <OrderFoodIcon color={color} size={30} />;
      case "refund":
        return <FileRefundIcon color={color} size={30} />;
      case "madad":
        return <RailMadadIcon color={color} size={30} />;
      case "waves":
        return <GoToWavesIcon color={color} size={30} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ─── Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconCircle} activeOpacity={0.7}>
          <Text style={styles.langTextTop}>A</Text>
          <Text style={styles.langTextBottom}>अ</Text>
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/brand-logo.webp")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={[styles.headerIconCircle, { borderColor: "#e2e8f0" }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Notification")}
        >
          <Ionicons name="notifications-outline" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── User Greeting ───────────────────────────────────────── */}
        <Text style={styles.greeting}>
          Hi, {user?.name ? user.name.split(" ")[0] : "User"}!
        </Text>

        {/* ─── 1. Journey Planner ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Journey Planner</Text>
        <View style={styles.journeyPlanner}>
          <TouchableOpacity style={styles.jpItem} activeOpacity={0.85}>
            <View style={styles.jpImageWrapper}>
              <Image
                source={require("../../assets/images/one.webp")}
                style={styles.jpImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.jpText}>Reserved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.jpItem}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Unreserved")}
          >
            <View style={styles.jpImageWrapper}>
              <Image
                source={require("../../assets/images/two.webp")}
                style={styles.jpImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.jpText}>Unreserved</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.jpItem} activeOpacity={0.85}>
            <View style={styles.jpImageWrapper}>
              <Image
                source={require("../../assets/images/three.webp")}
                style={styles.jpImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.jpText}>Platform</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 2. More Offerings ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>More Offerings</Text>
        <View style={styles.grid}>
          {offerings.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                {renderOfferingIcon(item.type, item.color)}
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 3. Upcoming Journey ─────────────────────────────────── */}
        {upcomingList.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Upcoming Journey</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.upcomingScroll}
              contentContainerStyle={styles.upcomingScrollContent}
            >
              {upcomingList.map((journey: any, idx: number) => {
                const trainNum = journey.train
                  ? journey.train.split(" ")[0]
                  : "";
                const gradId = `ticketGrad-${journey.id}-${idx}`;
                return (
                  <TouchableOpacity
                    key={`journey-${journey.id}-${idx}`}
                    style={styles.upcomingCardWrapper}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate("Ticket", { ticket: journey })
                    }
                  >
                    {/* SVG Gradient Background */}
                    <Svg
                      height="100%"
                      width="100%"
                      style={StyleSheet.absoluteFill}
                    >
                      <Defs>
                        <SvgLinearGradient
                          id={gradId}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <Stop offset="0%" stopColor="#3b2d71" />
                          <Stop offset="25%" stopColor="#543b8c" />
                          <Stop offset="50%" stopColor="#754da7" />
                          <Stop offset="75%" stopColor="#935ec2" />
                          <Stop offset="100%" stopColor="#aa6ccf" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect
                        width="100%"
                        height="100%"
                        fill={`url(#${gradId})`}
                        rx={20}
                        ry={20}
                      />
                    </Svg>

                    <View style={styles.upcomingCardInner}>
                      {/* Ticket Icon absolute positioned at top right */}
                      <Ionicons
                        name="ticket"
                        size={20}
                        color="#a8f3b0"
                        style={styles.cardTicketIcon}
                      />

                      {/* Top Semicircle Cutout */}
                      <View style={[styles.cardNotch, styles.cardNotchTop]} />

                      {/* Top Row: Date & Train Number */}
                      <View style={styles.upcomingCardTop}>
                        <Text style={styles.upcomingDate}>{journey.date}</Text>
                        <Text style={styles.trainNumText}>{trainNum}</Text>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Middle Row: Stations */}
                      <View style={styles.upcomingRouteRow}>
                        <Text
                          style={styles.upcomingStationLeft}
                          numberOfLines={1}
                        >
                          {journey.source}
                        </Text>
                        <Text
                          style={styles.upcomingStationRight}
                          numberOfLines={1}
                        >
                          {journey.dest}
                        </Text>
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Bottom Row: Reserved Badge & Action Pills */}
                      <View style={styles.upcomingCardBottom}>
                        <Text style={styles.reservedBadgeText}>Reserved</Text>
                        <View style={styles.upcomingBtnsRow}>
                          <TouchableOpacity
                            style={styles.cardBtnPill}
                            onPress={() => navigation.navigate("Unreserved")}
                          >
                            <Text style={styles.cardBtnText}>Book Again</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cardBtnPill}
                            onPress={() =>
                              navigation.navigate("Ticket", { ticket: journey })
                            }
                          >
                            <Text style={styles.cardBtnText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Bottom Semicircle Cutout */}
                      <View
                        style={[styles.cardNotch, styles.cardNotchBottom]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── 4. Do You Know? ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Do You know?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.factsContainer}
          contentContainerStyle={styles.factsContentContainer}
        >
          {facts.map((fact: any) => (
            <View key={fact.id} style={styles.factCard}>
              <Image
                source={fact.img}
                style={styles.factImg}
                resizeMode="cover"
              />
              <Text style={styles.factText}>{fact.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ─── 5. Connect With Us ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          Follow Us On Social Media Platforms
        </Text>
        <View style={styles.socialSection}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800&auto=format&fit=crop",
            }}
            style={styles.socialBanner}
            imageStyle={styles.socialBannerImg}
          >
            <View style={styles.socialOverlay} />
            <View style={styles.socialIconsRow}>
              <View
                style={[styles.socialIconBtn, { backgroundColor: "#000000" }]}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </View>
              <View
                style={[styles.socialIconBtn, { backgroundColor: "#1877f2" }]}
              >
                <Ionicons name="logo-facebook" size={18} color="#ffffff" />
              </View>
              <View
                style={[styles.socialIconBtn, { backgroundColor: "#e1306c" }]}
              >
                <Ionicons name="logo-instagram" size={18} color="#ffffff" />
              </View>
              <View
                style={[styles.socialIconBtn, { backgroundColor: "#ff0000" }]}
              >
                <Ionicons name="logo-youtube" size={18} color="#ffffff" />
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 68,
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.2,
    borderColor: "#e9e9e9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  langTextTop: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0066ff",
    lineHeight: 12,
    marginRight: 6,
  },
  langTextBottom: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0066ff",
    lineHeight: 14,
    marginLeft: 6,
    marginTop: -4,
  },
  logo: {
    height: 34,
    width: 130,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#16274e",
    marginTop: 14,
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // ─── Journey Planner ─────────────────────────────────────────
  journeyPlanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jpItem: {
    width: JP_CARD_WIDTH,
    alignItems: "center",
  },
  jpImageWrapper: {
    width: JP_CARD_WIDTH,
    height: JP_CARD_WIDTH * 0.78,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    ...elevation.sm,
  },
  jpImage: {
    width: "100%",
    height: "100%",
  },
  jpText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1e3a8a",
    textAlign: "center",
    marginTop: 5,
    letterSpacing: 0.1,
  },

  // ─── More Offerings ──────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: OFFERING_CARD_SIZE,
    alignItems: "center",
    marginBottom: 14,
  },
  iconWrapper: {
    width: OFFERING_CARD_SIZE,
    height: OFFERING_CARD_SIZE,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15.5,
  },

  // ─── Upcoming Journey ────────────────────────────────────────
  upcomingSection: {
    marginTop: 4,
  },
  upcomingScroll: {
    marginHorizontal: -16,
  },
  upcomingScrollContent: {
    paddingHorizontal: 16,
  },
  upcomingCardWrapper: {
    width: width * 0.88,
    borderRadius: 20,
    marginRight: 14,
    overflow: "hidden",
    ...elevation.sm,
  },
  upcomingCardInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  cardTicketIcon: {
    position: "absolute",
    top: 14,
    right: 16,
    opacity: 0.9,
  },
  cardNotch: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    right: 76,
  },
  cardNotchTop: { top: -12 },
  cardNotchBottom: { bottom: -12 },
  upcomingCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  upcomingDate: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "400",
  },
  trainNumText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 12,
  },
  upcomingRouteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingStationLeft: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
  },
  upcomingStationRight: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "right",
  },
  upcomingCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reservedBadgeText: {
    color: "#a8f3b0",
    fontSize: 14,
    fontWeight: "700",
  },
  upcomingBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardBtnPill: {
    borderWidth: 1.2,
    borderColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "transparent",
  },
  cardBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
  },

  // ─── Do You Know ─────────────────────────────────────────────
  factsContainer: {
    marginHorizontal: -16,
  },
  factsContentContainer: {
    paddingHorizontal: 16,
  },
  factCard: {
    width: 148,
    marginRight: 12,
  },
  factImg: {
    width: 148,
    height: 110,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: "#f1f5f9",
  },
  factText: {
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16,
    fontWeight: "500",
  },

  // ─── Social Media Section ────────────────────────────────────
  socialSection: {
    height: 150,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
  },
  socialBanner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  socialBannerImg: {
    borderRadius: 18,
  },
  socialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.32)",
    borderRadius: 18,
  },
  socialIconsRow: {
    flexDirection: "row",
    zIndex: 1,
  },
  socialIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
});
