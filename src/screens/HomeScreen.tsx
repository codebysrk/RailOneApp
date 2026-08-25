import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Linking,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
  Path,
} from "react-native-svg";
import { colors } from "@/theme/colors";
import { spacing, elevation } from "@/theme/spacing";
import { FirebaseService, UpdateService, ReleaseInfo } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { UpdateModal, FocusAwareStatusBar } from "@/components/common";
import { formatUpcomingDate } from "@/utils/date";
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
import { APP_OFFERINGS as offerings, APP_FACTS as facts } from "@/constants";

const LanguageSvgIcon = ({ size = 21, color = "#0066ff" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M21.05566,12h-2a1,1,0,0,0,0,2v2H17.8714a2.96481,2.96481,0,0,0,.18426-1A2.99955,2.99955,0,0,0,12.458,13.50049a.99992.99992,0,1,0,1.73242.999A1.0009,1.0009,0,0,1,15.05566,14a1,1,0,0,1,0,2,1,1,0,0,0,0,2,1,1,0,1,1,0,2,1.0009,1.0009,0,0,1-.86523-.49951.99992.99992,0,1,0-1.73242.999A2.99955,2.99955,0,0,0,18.05566,19a2.96481,2.96481,0,0,0-.18426-1h1.18426v3a1,1,0,0,0,2,0V14a1,1,0,1,0,0-2ZM9.08594,11.24268a.99963.99963,0,1,0,1.93945-.48536L9.26855,3.72754a2.28044,2.28044,0,0,0-4.4248,0L3.08594,10.75732a.99963.99963,0,1,0,1.93945.48536L5.58618,9H8.52545ZM6.0863,7l.6969-2.78711a.29222.29222,0,0,1,.5459,0L8.02563,7Zm7.96936,0h1a1.001,1.001,0,0,1,1,1V9a1,1,0,0,0,2,0V8a3.00328,3.00328,0,0,0-3-3h-1a1,1,0,0,0,0,2Zm-4,9h-1a1.001,1.001,0,0,1-1-1V14a1,1,0,0,0-2,0v1a3.00328,3.00328,0,0,0,3,3h1a1,1,0,0,0,0-2Z"
    />
  </Svg>
);

export const HomeScreen = () => {
  const { width } = useWindowDimensions();
  const jpGap = 14; // Increased gap between the 3 cards
  const jpCardWidth = (width - 20 - (jpGap * 2)) / 3;
  const jpCardHeight = jpCardWidth * 0.86; // Slightly taller card height
  const upcomingCardWidth = Math.min((width - 20) * 0.82, 330);

  // ─── Customizable "Do You Know?" Card Dimensions ─────────────
  const factCardWidth = 148; // Set any width in pixels (e.g. 140, 160, 180)
  const factCardHeight = 130; // Set any height in pixels (e.g. 148 for 1:1 square, 110 for landscape)
  const factCardRadius = 10; // Corner roundness
  const factImageResizeMode = "stretch" as const; // "stretch" to stretch image to exact card width & height

  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [upcomingList, setUpcomingList] = useState<any[]>([]);
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Check for GitHub Release OTA update on launch
    UpdateService.checkForUpdate().then((info) => {
      if (info && info.updateAvailable) {
        setUpdateInfo(info);
        setShowUpdateModal(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = FirebaseService.listenToTickets(
      user.uid,
      (snapshot: any) => {
        const tickets: any[] = [];
        snapshot.forEach((doc: any) => {
          const data = { id: doc.id, ...doc.data() };
          // Only show 'Reserved' tickets in the HomeScreen upcoming section
          if (
            data.status === "upcoming" &&
            data.moduleType !== "UNRESERVED" &&
            data.moduleType !== "PLATFORM"
          ) {
            tickets.push(data);
          }
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
        return <PNRStatusIcon color={color} size={31} />;
      case "coach":
        return <CoachPositionIcon color={color} size={30} bgColor="#e3f8fe" />;
      case "track":
        return <TrackYourTrainIcon color={color} size={30} />;
      case "food":
        return <OrderFoodIcon color={color} size={30} />;
      case "refund":
        return <FileRefundIcon color={color} size={30} bgColor="#eaeaea" />;
      case "madad":
        return <RailMadadIcon color={color} size={30} />;
      case "waves":
        return <GoToWavesIcon color={color} size={30} />;
      default:
        return null;
    }
  };

  const openSocialUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn("Could not open URL:", url, e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FocusAwareStatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      {/* ─── Top Header (Fixed at Top) ────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconCircle}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Language")}
          accessibilityLabel="Select Language"
          accessibilityRole="button"
        >
          <LanguageSvgIcon size={24} color="#0066ff" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/railone-logo.webp")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.headerIconCircle}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Notification")}
        >
          <Ionicons name="notifications-outline" size={23} color="#475569" />
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
        <FlatList
          horizontal
          scrollEnabled={false}
          data={[
            {
              id: "reserved",
              title: "Reserved",
              image: require("../../assets/images/journey-reserved.webp"),
              tintStyle: styles.jpGreenTint,
              action: () => {},
            },
            {
              id: "unreserved",
              title: "Unreserved",
              image: require("../../assets/images/journey-unreserved.webp"),
              tintStyle: styles.jpPinkTint,
              action: () => navigation.navigate("Unreserved"),
            },
            {
              id: "platform",
              title: "Platform",
              image: require("../../assets/images/journey-platform.webp"),
              tintStyle: styles.jpYellowTint,
              action: () => {},
            },
          ]}
          keyExtractor={(item) => item.id}
          style={styles.journeyPlanner}
          contentContainerStyle={styles.journeyPlannerContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.jpItem, { width: jpCardWidth }]}
              activeOpacity={0.85}
              onPress={item.action}
            >
              <View
                style={[
                  styles.jpImageWrapper,
                  { width: jpCardWidth, height: jpCardHeight },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.jpImage}
                  resizeMode="cover"
                  blurRadius={1.2}
                />
                <View style={item.tintStyle} />
              </View>
              <Text style={styles.jpText}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ─── 2. More Offerings ───────────────────────────────────── */}
        <Text style={[styles.sectionTitle, styles.moreOfferingsTitle]}>
          More Offerings
        </Text>
        <FlatList
          data={offerings}
          numColumns={4}
          scrollEnabled={false}
          keyExtractor={(item: any) => `offering-${item.id}`}
          style={styles.gridList}
          contentContainerStyle={styles.gridListContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity style={styles.gridItem} activeOpacity={0.75}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: item.bg },
                ]}
              >
                {renderOfferingIcon(item.type, item.color)}
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ─── 3. Upcoming Journey ─────────────────────────────────── */}
        {upcomingList.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={[styles.sectionTitle, styles.upcomingSectionTitle]}>
              Upcoming Journey
            </Text>
            <FlatList
              horizontal
              data={upcomingList}
              keyExtractor={(item: any, idx: number) =>
                `journey-${item.id}-${idx}`
              }
              showsHorizontalScrollIndicator={false}
              snapToInterval={upcomingCardWidth + 12}
              decelerationRate="fast"
              style={styles.upcomingCarousel}
              contentContainerStyle={styles.upcomingCarouselContent}
              renderItem={({
                item: journey,
                index: idx,
              }: {
                item: any;
                index: number;
              }) => {
                const trainNum = journey.train
                  ? journey.train.split(" ")[0]
                  : "";
                const gradId = `ticketGrad-${journey.id}-${idx}`;
                return (
                  <TouchableOpacity
                    style={[
                      styles.upcomingCardWrapper,
                      { width: upcomingCardWidth },
                    ]}
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
                          <Stop offset="0%" stopColor="#513e86" />
                          <Stop offset="30%" stopColor="#694aa1" />
                          <Stop offset="65%" stopColor="#9462c7" />
                          <Stop offset="100%" stopColor="#b97be2" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect
                        width="100%"
                        height="100%"
                        fill={`url(#${gradId})`}
                        rx={18}
                        ry={18}
                      />
                    </Svg>

                    <View style={styles.upcomingCardInner}>
                      {/* Ticket Icon absolute positioned at top right */}
                      <Ionicons
                        name="ticket"
                        size={15}
                        color="#a8f3b0"
                        style={styles.cardTicketIcon}
                      />

                      {/* Top Semicircle Cutout */}
                      <View style={[styles.cardNotch, styles.cardNotchTop]} />

                      {/* Top Row: Date & Train Number */}
                      <View style={styles.upcomingCardTop}>
                        <Text style={styles.upcomingDate}>
                          {formatUpcomingDate(journey.date)}
                        </Text>
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
                        <Text style={styles.reservedBadgeText}>
                          {journey.moduleType === "UNRESERVED"
                            ? "Unreserved"
                            : journey.moduleType === "PLATFORM"
                              ? "Platform"
                              : "Reserved"}
                        </Text>
                        <View style={styles.upcomingBtnsRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              navigation.navigate("Unreserved", {
                                source: journey.source,
                                dest: journey.dest,
                              })
                            }
                          >
                            <LinearGradient
                              colors={[
                                "#b97fe0",
                                "#a16dd1",
                                "#845ab8",
                                "#63479b",
                                "#493780",
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.cardBtnGradient}
                            >
                              <Text style={styles.cardBtnText}>Book Again</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              navigation.navigate("Ticket", { ticket: journey })
                            }
                          >
                            <LinearGradient
                              colors={[
                                "#b97fe0",
                                "#a16dd1",
                                "#845ab8",
                                "#63479b",
                                "#493780",
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.cardBtnGradient}
                            >
                              <Text style={styles.cardBtnText}>
                                View Details
                              </Text>
                            </LinearGradient>
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
              }}
            />
          </View>
        )}

        {/* ─── 4. Do You Know? ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Do You know?</Text>
        <FlatList
          horizontal
          data={facts}
          keyExtractor={(item: any) => `fact-${item.id}`}
          showsHorizontalScrollIndicator={false}
          style={styles.factsContainer}
          contentContainerStyle={styles.factsContentContainer}
          renderItem={({ item: fact }: { item: any }) => (
            <View style={[styles.factCard, { width: factCardWidth }]}>
              <Image
                source={fact.img}
                style={[
                  styles.factImg,
                  {
                    width: factCardWidth,
                    height: factCardHeight,
                    borderRadius: factCardRadius,
                  },
                ]}
                resizeMode={factImageResizeMode}
              />
              <Text style={styles.factText}>{fact.text}</Text>
            </View>
          )}
        />

        {/* ─── 5. Connect With Us ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          Follow Us On Social Media Platforms
        </Text>
        <View style={styles.socialSection}>
          <ImageBackground
            source={require("../../assets/images/railone-social-banner.webp")}
            style={styles.socialBanner}
            imageStyle={styles.socialBannerImg}
          >
            <View style={styles.socialOverlay} />
            <View style={styles.socialIconsRow}>
              {/* X (Twitter) */}
              <TouchableOpacity
                style={[styles.socialIconBtn, styles.socialIconBtnX]}
                activeOpacity={0.75}
                onPress={() => openSocialUrl("https://x.com/IRCTCofficial")}
              >
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    fill="#ffffff"
                  />
                </Svg>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={[styles.socialIconBtn, styles.socialIconBtnFb]}
                activeOpacity={0.75}
                onPress={() =>
                  openSocialUrl("https://www.facebook.com/IRCTCofficial")
                }
              >
                <Ionicons name="logo-facebook" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  openSocialUrl("https://www.instagram.com/irctc.official")
                }
              >
                <LinearGradient
                  colors={[
                    "#f09433",
                    "#e6683c",
                    "#dc2743",
                    "#cc2366",
                    "#bc1888",
                  ]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.socialIconBtn}
                >
                  <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* YouTube */}
              <TouchableOpacity
                style={[styles.socialIconBtn, styles.socialIconBtnYt]}
                activeOpacity={0.75}
                onPress={() =>
                  openSocialUrl("https://www.youtube.com/c/IRCTCOFFICIAL")
                }
              >
                <Ionicons name="logo-youtube" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* OTA In-App Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        releaseInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
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
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    // shadowColor: "#0f172a",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.09,
    // shadowRadius: 8,
    // elevation: 4,
    zIndex: 20,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  langTextTop: {
    fontFamily: "Montserrat_800ExtraBold",
    fontSize: 11,
    color: "#0066ff",
    lineHeight: 11,
    marginRight: 6,
  },
  langTextBottom: {
    fontFamily: "Montserrat_800ExtraBold",
    fontSize: 13,
    color: "#0066ff",
    lineHeight: 13,
    marginLeft: 6,
    marginTop: -3,
  },
  logo: {
    height: 32,
    width: 124,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: -28,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 36,
    paddingBottom: 36,
  },
  greeting: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    color: "#0f172a",
    letterSpacing: -0.2,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
    color: "#16274e",
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Journey Planner ─────────────────────────────────────────
  journeyPlanner: {
    marginBottom: 14,
  },
  journeyPlannerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jpItem: {
    alignItems: "center",
  },
  jpImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    ...elevation.sm,
  },
  jpImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  jpGreenTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(34, 197, 94, 0.22)",
    borderRadius: 16,
  },
  jpPinkTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(244, 114, 182, 0.22)",
    borderRadius: 16,
  },
  jpYellowTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(234, 179, 8, 0.24)",
    borderRadius: 16,
  },
  jpText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12.5,
    color: "#363636",
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.4,
  },

  // ─── More Offerings ──────────────────────────────────────────
  moreOfferingsTitle: {
    marginBottom: 16,
  },
  gridList: {
    marginBottom: 2,
  },
  gridListContent: {
    paddingBottom: 0,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 40,
  },
  gridItem: {
    width: 66, // 👈 More Offerings Card WIDTH (Aap yahan badal sakte hain)
    alignItems: "center",
  },
  iconWrapper: {
    width: 66, // 👈 More Offerings Card WIDTH (Aap yahan badal sakte hain)
    height: 62, // 👈 More Offerings Card HEIGHT (Aap yahan badal sakte hain)
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  gridTitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: "#233258",
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: 0.1,
    width: 78,
  },

  // ─── Upcoming Journey ────────────────────────────────────────
  upcomingSection: {
    marginTop: -8, // 👈 ONLY Upcoming Journey ke upar ka gap kam karta hai
    marginBottom: 20, // 👈 ONLY Upcoming Journey ke neeche ka gap badhata hai
  },
  upcomingSectionTitle: {
    marginBottom: 18, // 👈 Heading title ke neeche ka gap (Aap yahan adjust kar sakte hain)
  },
  upcomingCarousel: {
    marginHorizontal: -10,
  },
  upcomingCarouselContent: {
    paddingHorizontal: 10,
  },
  upcomingCardWrapper: {
    flexDirection: "column",
    borderRadius: 18,
    marginRight: 12,
    overflow: "hidden",
  },
  upcomingCardInner: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingTop: 24,
    paddingBottom: 15,
    position: "relative",
  },
  cardTicketIcon: {
    position: "absolute",
    top: 10,
    right: 14,
    transform: [{ rotate: "225deg" }, { scale: 1.2 }],
    opacity: 0.95,
  },
  cardNotch: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    right: 55,
  },
  cardNotchTop: { top: -10 },
  cardNotchBottom: { bottom: -10 },
  upcomingCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    paddingBottom: 1,
  },
  upcomingDate: {
    fontFamily: "Montserrat_400Regular",
    color: "#ffffff",
    fontSize: 9,
  },
  trainNumText: {
    fontFamily: "Montserrat_600SemiBold",
    color: colors.white,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginVertical: 5,
  },
  upcomingRouteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    gap: 8,
  },
  upcomingStationLeft: {
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255,255,255,0.95)",
    fontSize: 9,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  upcomingStationRight: {
    fontFamily: "Montserrat_400Regular",
    color: "rgba(255,255,255,0.95)",
    fontSize: 9,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "right",
  },
  upcomingCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 3,
  },
  reservedBadgeText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#a8f3b0",
    fontSize: 10.5,
  },
  upcomingBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardBtnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  cardBtnText: {
    fontFamily: "Montserrat_400Regular",
    color: colors.white,
    fontSize: 9,
    letterSpacing: 0.1,
  },

  // ─── Do You Know ─────────────────────────────────────────────
  factsContainer: {
    marginHorizontal: -10,
    marginBottom: 20,
  },
  factsContentContainer: {
    paddingHorizontal: 10,
  },
  factCard: {
    width: 148,
    marginRight: 12,
  },
  factImg: {
    width: 148,
    height: 148,
    borderRadius: 16,
    marginBottom: 7,
    backgroundColor: "#f1f5f9",
  },
  factText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11.5,
    color: "#475569",
    lineHeight: 16,
  },

  // ─── Social Media Section ────────────────────────────────────
  socialSection: {
    height: 165,
    borderRadius: 10, // 👈 Yahan jo bhi radius denge (e.g. 10, 16, 20), wo poori image aur card par apply hoga
    overflow: "hidden",
  },
  socialBanner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  socialBannerImg: {
    width: "100%",
    height: "100%",
  },
  socialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  socialIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    gap: 12,
  },
  socialIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  socialIconBtnX: {
    backgroundColor: "#000000",
  },
  socialIconBtnFb: {
    backgroundColor: "#1877f2",
  },
  socialIconBtnYt: {
    backgroundColor: "#ff0000",
  },
});
