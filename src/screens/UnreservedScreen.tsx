import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/theme/colors";
import { spacing, elevation } from "@/theme/spacing";
import { AppAlert } from "@/context/AlertContext";
import { AppHeader, SegmentedControl } from "@/components/common";
import { FirebaseService, StorageService, StationModel } from "@/services";
import { triggerHaptic } from "@/utils/haptics";

const SideTrainIcon = ({
  size = 20,
  color = "#7a828e",
  flipHorizontal = false,
}: {
  size?: number;
  color?: string;
  flipHorizontal?: boolean;
}) => (
  <View style={flipHorizontal ? styles.flipHorizontal : undefined}>
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M15 12.5 1 12.5l0 1 1 0 0 1 1 0 0 -1 2.5 0 0 1 1 0 0 -1 2.5 0 0 1 1 0 0 -1 2.5 0 0 1 1 0 0 -1 1.5 0 0 -1z"
        fill={color}
        strokeWidth={0.5}
      />
      <Path
        d="M4 8H1v-1h3v-1H1v-1h3a1.00105 1.00105 0 0 1 1 1v1a1.00105 1.00105 0 0 1 -1 1Z"
        fill={color}
        strokeWidth={0.5}
      />
      <Path
        d="m14.275 7.11525 -4.29 -3.9324A4.48875 4.48875 0 0 0 6.9441 2H1v1h5v2a1.00115 1.00115 0 0 0 1 1h4.57825l2.02085 1.85255A1.23615 1.23615 0 0 1 12.76365 10H1v1h11.76365a2.2363 2.2363 0 0 0 1.51125 -3.885ZM7 5V3.0027A3.4887 3.4887 0 0 1 9.3091 3.92L10.4873 5Z"
        fill={color}
        strokeWidth={0.5}
      />
    </Svg>
  </View>
);

const mainTabs = [
  { id: "normal", label: "Normal" },
  { id: "season", label: "Season" },
];

export const UnreservedScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [tab, setTab] = useState<"normal" | "season">("normal");
  const [location, setLocation] = useState<"outside" | "at">("outside");
  const [source, setSource] = useState(route.params?.source || "");
  const [dest, setDest] = useState(route.params?.dest || "");
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Station Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<"source" | "dest">(
    "source",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState<StationModel[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (route.params?.source) {
      setSource(route.params.source);
    }
    if (route.params?.dest) {
      setDest(route.params.dest);
    }
  }, [route.params?.source, route.params?.dest]);

  useEffect(() => {
    loadRecentSearches();
    loadStations("");
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const loadRecentSearches = async () => {
    const list = await StorageService.getRecentSearches();
    setRecentSearches(list || []);
  };

  const loadStations = async (q: string) => {
    const list = await FirebaseService.searchStations(q);
    setStations(list);
  };

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      loadStations(text);
    }, 150);
  };

  const handleSelectStation = (stn: StationModel) => {
    triggerHaptic('light');

    const label = `${stn.code} - ${stn.name}`;
    const opposing = pickingTarget === "source" ? dest : source;
    const opposingCode = opposing ? opposing.split(" - ")[0]?.trim() : "";

    if (
      opposing &&
      (stn.code === opposingCode ||
        label.toUpperCase() === opposing.toUpperCase())
    ) {
      AppAlert.show(
        "Same Station Selected",
        `Source and Destination cannot be the same station (${stn.code} - ${stn.name}). Please select a different station.`,
        undefined,
        "warning"
      );
      return;
    }

    if (pickingTarget === "source") {
      setSource(label);
    } else {
      setDest(label);
    }
    setPickerVisible(false);
    setSearchQuery("");
  };

  const handleProceedToBook = () => {
    triggerHaptic('medium');

    if (!source.trim() || !dest.trim()) {
      AppAlert.show(
        "Selection Required",
        "Please select both Source and Destination stations to proceed.",
        undefined,
        "warning"
      );
      return;
    }
    const srcParts = source.split(" - ");
    const dstParts = dest.split(" - ");
    const srcCode = srcParts[0]?.trim();
    const srcName = srcParts[1]?.trim() || srcCode;
    const dstCode = dstParts[0]?.trim();
    const dstName = dstParts[1]?.trim() || dstCode;

    if (
      srcCode === dstCode ||
      source.trim().toUpperCase() === dest.trim().toUpperCase()
    ) {
      AppAlert.show(
        "Invalid Route",
        "Source and Destination stations cannot be the same. Please select different stations to proceed.",
        undefined,
        "warning"
      );
      return;
    }

    if (srcCode && dstCode) {
      StorageService.saveRecentSearch(
        { code: srcCode, name: srcName },
        { code: dstCode, name: dstName }
      ).then(() => {
        loadRecentSearches();
      });
    }

    navigation.navigate("BookingConfig", { source, dest });
  };

  const openPicker = (target: "source" | "dest") => {
    setPickingTarget(target);
    setPickerVisible(true);
    loadStations("");
  };

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [rotated, setRotated] = useState(false);

  const handleSwapStations = () => {
    triggerHaptic('medium');

    const toValue = rotated ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setRotated(!rotated);

    if (source || dest) {
      const temp = source;
      setSource(dest);
      setDest(temp);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="Unreserved E-Ticket"
        variant="light"
        titleCenter
        titleBold
        height={54}
        containerStyle={{ paddingBottom: 4 }}
        rightAction={{
          icon: "close",
          color: "#0066ff",
          borderColor: "#53a7e470",
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <SegmentedControl
            items={mainTabs}
            selectedId={tab}
            onSelect={(id) => setTab(id as any)}
          />

          {tab === "normal" && (
            <View>
              <View style={styles.subTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.subTabBtn,
                    location === "outside"
                      ? styles.subTabActive
                      : styles.subTabInactive,
                  ]}
                  onPress={() => setLocation("outside")}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      location === "outside"
                        ? styles.subTabTextActive
                        : styles.subTabTextInactive,
                    ]}
                  >
                    Outside Station
                  </Text>
                  <MaterialIcons
                    name="info-outline"
                    size={15}
                    color={location === "outside" ? colors.white : "#94a3b8"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.subTabBtn,
                    location === "at"
                      ? styles.subTabActive
                      : styles.subTabInactive,
                  ]}
                  onPress={() => setLocation("at")}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      location === "at"
                        ? styles.subTabTextActive
                        : styles.subTabTextInactive,
                    ]}
                  >
                    At Station
                  </Text>
                  <MaterialIcons
                    name="info-outline"
                    size={15}
                    color={location === "at" ? colors.white : "#94a3b8"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <TouchableOpacity
                  style={styles.inputRow}
                  onPress={() => openPicker("source")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inputLabel}>From</Text>
                  <View style={styles.inputField}>
                    <SideTrainIcon
                      color={source ? "#7a828e" : "#94a3b8"}
                      size={22}
                    />
                    <Text
                      style={[
                        styles.inputText,
                        !source && styles.inputPlaceholder,
                      ]}
                    >
                      {source || "Source"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.dividerWrapper}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={handleSwapStations}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <MaterialIcons name="swap-vert" size={24} color="#0066ff" />
                    </Animated.View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.inputRow}
                  onPress={() => openPicker("dest")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inputLabel}>To</Text>
                  <View style={styles.inputField}>
                    <SideTrainIcon
                      color={dest ? "#7a828e" : "#94a3b8"}
                      size={22}
                      flipHorizontal
                    />
                    <Text
                      style={[
                        styles.inputText,
                        !dest && styles.inputPlaceholder,
                      ]}
                    >
                      {dest || "Destination"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleProceedToBook}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Proceed To Book</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  AppAlert.show(
                    "Coming Soon",
                    "Live train schedule and tracking will be available in an upcoming update.",
                    undefined,
                    "info"
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>
                  Check Upcoming Trains
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === "season" && (
            <View style={styles.seasonContainer}>
              <View style={styles.seasonIconWrap}>
                <Ionicons name="calendar-outline" size={40} color="#0066ff" />
              </View>
              <Text style={styles.seasonTitle}>Season Ticket (Monthly / Quarterly)</Text>
              <Text style={styles.seasonSubtitle}>
                Issue and renew monthly & quarterly suburban railway season tickets.
              </Text>
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonBadgeText}>Feature Coming Soon</Text>
              </View>
            </View>
          )}
        </View>

        {recentSearches && recentSearches.length > 0 ? (
          <>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.recentScroll}
            >
              {recentSearches.map((item, index) => (
                <TouchableOpacity
                  key={`${item.fromCode}-${item.toCode}-${index}`}
                  style={styles.recentCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSource(`${item.fromCode} - ${item.fromName}`);
                    setDest(`${item.toCode} - ${item.toName}`);
                  }}
                >
                  <Text style={styles.recentText}>
                    {`${item.fromName}, ${item.fromCode}`}
                  </Text>
                  <View style={styles.compareIcon}>
                    <MaterialIcons name="route" size={16} color="#007bff" />
                  </View>
                  <Text style={styles.recentText}>
                    {`${item.toName}, ${item.toCode}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>

      {/* Station Selector Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0066ff" />
              </TouchableOpacity>
              <View style={styles.modalTitleWrapper}>
                <Text style={styles.modalTitle}>Search Station</Text>
              </View>
              <View style={styles.modalSpacer} />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalTargetLabel}>
                {pickingTarget === "source" ? "Source" : "Destination"}
              </Text>

              <View style={styles.modalSearchBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#64748b"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Select Station"
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={handleSearchTextChange}
                  autoFocus
                />
                <MaterialIcons name="mic" size={24} color="#64748b" />
              </View>

              <View style={styles.recentSearchesHeader}>
                <Ionicons name="time-outline" size={16} color="#1e3a8a" />
                <Text style={styles.recentSearchesLabel}>
                  Recent Station Searches
                </Text>
              </View>

              <FlatList
                data={stations}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={Platform.OS === 'android'}
                initialNumToRender={10}
                maxToRenderPerBatch={12}
                windowSize={5}
                ListEmptyComponent={
                  <View style={styles.emptyListWrap}>
                    <Ionicons name="search-outline" size={38} color="#94a3b8" />
                    <Text style={styles.emptyListText}>
                      {searchQuery ? `No station found matching "${searchQuery}"` : "No stations available"}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.stationItem}
                    onPress={() => handleSelectStation(item)}
                  >
                    <View style={styles.stationTextCol}>
                      <Text
                        style={styles.stationItemName}
                      >{`${item.name} - ${item.code}`}</Text>
                      <Text style={styles.stationItemSub}>
                        {item.state || "MADHYA PRADESH"}
                      </Text>
                    </View>
                    <Feather name="arrow-up-right" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.stationListContent}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1, backgroundColor: "#f4f5f9" },
  content: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: 395,
    marginTop: 4,
    marginBottom: 20,
    ...elevation.sm,
  },

  subTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 22,
    marginHorizontal: 3,
  },
  subTabActive: { backgroundColor: "#0066ff" },
  subTabInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  subTabText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
  },
  subTabTextActive: { color: colors.white },
  subTabTextInactive: { color: "#9ca3af" },

  inputSection: { marginBottom: 20 },
  inputRow: { marginVertical: 3 },
  inputLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11.5,
    color: "#0ea5e9",
    marginBottom: 4,
  },
  inputField: { flexDirection: "row", alignItems: "center", height: 34 },
  inputText: {
    fontFamily: "Montserrat_500Medium",
    marginLeft: 10,
    fontSize: 13,
    color: "#111827",
    letterSpacing: 0.1,
    flex: 1,
    textTransform: "uppercase",
  },
  inputPlaceholder: {
    color: "#9ca3af",
    fontFamily: "Montserrat_600SemiBold",
    textTransform: "none",
  },

  dividerWrapper: {
    height: 26,
    justifyContent: "center",
    position: "relative",
  },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginRight: 42 },
  swapBtn: {
    position: "absolute",
    right: 0,
    backgroundColor: "#bfdbfe",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.sm,
  },

  primaryBtn: {
    backgroundColor: "#0066ff",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    fontFamily: "Montserrat_500Medium",
    color: colors.white,
    fontSize: 13.5,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: colors.white,
    paddingVertical: 13,
    borderRadius: 28,
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#0066ff",
  },
  secondaryBtnText: {
    fontFamily: "Montserrat_500Medium",
    color: "#0066ff",
    fontSize: 13.5,
    letterSpacing: 0.3,
  },

  recentTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    color: "#1e293b",
    marginTop: 35,
    marginBottom: 12,
    marginLeft: 4,
  },
  recentScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recentCard: {
    backgroundColor: "#e0f2fe",
    width: 140,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  recentText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 9.5,
    color: "#334155",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // Modal Styles
  modalSafe: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleWrapper: { flex: 1, alignItems: "center" },
  modalTitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    color: "#1e3a8a",
  },
  modalSpacer: { width: 40 },

  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  modalTargetLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14.5,
    color: "#1e3a8a",
    marginBottom: 12,
  },

  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#2dd4bf",
  },
  searchIcon: { marginRight: 10 },
  modalSearchInput: {
    flex: 1,
    fontFamily: "Montserrat_400Regular",
    fontSize: 13.5,
    color: "#334155",
  },

  recentSearchesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  recentSearchesLabel: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    color: "#1e3a8a",
    marginLeft: 8,
  },

  stationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  stationTextCol: { flex: 1, paddingRight: 16 },
  stationItemName: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: "#334155",
    textTransform: "uppercase",
  },
  stationItemSub: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginTop: 2,
  },
  stationListContent: { paddingBottom: 24 },

  infoIcon: {
    marginLeft: 2,
  },
  compareIcon: {
    marginVertical: 4,
    transform: [{ scaleX: -1 }, { rotate: "-45deg" }], // 👈 Flipped + Tilted
  },
  flipHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  seasonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  seasonIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  seasonTitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 6,
  },
  seasonSubtitle: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 11.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
    maxWidth: 280,
  },
  seasonBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  seasonBadgeText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: "#0284c7",
  },
  emptyListWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyListText: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
  },
});
