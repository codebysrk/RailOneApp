import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@/theme/colors";
import { spacing, elevation } from "@/theme/spacing";
import { AppHeader, SegmentedControl } from "@/components/common";
import { FirebaseService, StorageService, StationModel } from "@/services";

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
  }, []);

  const loadRecentSearches = async () => {
    const list = await StorageService.getRecentSearches();
    if (list && list.length > 0) {
      setRecentSearches(list);
    } else {
      setRecentSearches([
        { fromCode: "MRA", fromName: "MORENA", toCode: "DBA", toName: "DABRA" },
        {
          fromCode: "NDLS",
          fromName: "NEW DELHI",
          toCode: "MRA",
          toName: "MORENA",
        },
        {
          fromCode: "NZM",
          fromName: "H NIZAMUDDIN",
          toCode: "GWL",
          toName: "GWALIOR",
        },
      ]);
    }
  };

  const loadStations = async (q: string) => {
    const list = await FirebaseService.searchStations(q);
    setStations(list);
  };

  const handleSelectStation = (stn: StationModel) => {
    const label = `${stn.code} - ${stn.name}`;
    const opposing = pickingTarget === "source" ? dest : source;
    const opposingCode = opposing ? opposing.split(" - ")[0]?.trim() : "";

    if (
      opposing &&
      (stn.code === opposingCode ||
        label.toUpperCase() === opposing.toUpperCase())
    ) {
      Alert.alert(
        "Same Station Selected",
        `Source and Destination cannot be the same station (${stn.code} - ${stn.name}). Please select a different station.`,
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
    if (!source.trim() || !dest.trim()) {
      Alert.alert(
        "Selection Required",
        "Please select both Source and Destination stations to proceed.",
      );
      return;
    }
    const srcCode = source.split(" - ")[0]?.trim();
    const dstCode = dest.split(" - ")[0]?.trim();
    if (
      srcCode === dstCode ||
      source.trim().toUpperCase() === dest.trim().toUpperCase()
    ) {
      Alert.alert(
        "Invalid Route",
        "Source and Destination stations cannot be the same. Please select different stations to proceed.",
      );
      return;
    }
    navigation.navigate("BookingConfig", { source, dest });
  };

  const openPicker = (target: "source" | "dest") => {
    setPickingTarget(target);
    setPickerVisible(true);
    loadStations("");
  };

  const handleSwapStations = () => {
    if (source || dest) {
      const temp = source;
      setSource(dest);
      setDest(temp);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="Unreserved E-Ticket"
        variant="light"
        onClose={() => navigation.goBack()}
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
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={location === "outside" ? colors.white : "#94a3b8"}
                    style={styles.infoIcon}
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
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={location === "at" ? colors.white : "#94a3b8"}
                    style={styles.infoIcon}
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
                      {source || "Select Source Station"}
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
                    <MaterialIcons name="swap-vert" size={24} color="#0066ff" />
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
                      {dest || "Select Destination Station"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleProceedToBook}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Book Ticket</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleProceedToBook}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>
                  Check Upcoming Trains
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.recentTitle}>Recent Searches</Text>
        <ScrollView
          horizontal
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
      </ScrollView>

      {/* Station Selector Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
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
                onChangeText={(text) => {
                  setSearchQuery(text);
                  loadStations(text);
                }}
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
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1, backgroundColor: "#f4f5f9" },
  content: { padding: 10, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    // ...elevation.sm,
    marginTop: 5,
    marginBottom: 55,
  },

  subTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  subTabActive: { backgroundColor: "#0066ff" },
  subTabInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  subTabText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12.5,
    flexShrink: 1,
  },
  subTabTextActive: { color: colors.white },
  subTabTextInactive: { color: "#9ca3af" },

  inputSection: { marginBottom: 16 },
  inputRow: { marginVertical: 1 },
  inputLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12.5,
    color: "#0ea5e9",
    marginBottom: 2,
  },
  inputField: { flexDirection: "row", alignItems: "center", height: 26 },
  inputText: {
    fontFamily: "Montserrat_600SemiBold",
    marginLeft: 10,
    fontSize: 14,
    color: "#111827",
    letterSpacing: 0.1,
    flex: 1,
    textTransform: "uppercase",
  },
  inputPlaceholder: {
    color: "#9ca3af",
    fontFamily: "Montserrat_400Regular",
    textTransform: "none",
  },

  dividerWrapper: {
    height: 14,
    justifyContent: "center",
    position: "relative",
  },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginRight: 40 },
  swapBtn: {
    position: "absolute",
    right: 0,
    backgroundColor: "#bfdbfe",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.sm,
  },

  primaryBtn: {
    backgroundColor: "#0066ff",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: "Montserrat_600SemiBold",
    color: colors.white,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#0066ff",
  },
  secondaryBtnText: {
    fontFamily: "Montserrat_600SemiBold",
    color: "#0066ff",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  recentTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
    color: "#1e293b",
    marginBottom: 10,
    marginLeft: 4,
  },
  recentScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  recentCard: {
    backgroundColor: "#e0f2fe",
    width: 150,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  recentText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 10.5,
    color: "#334155",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // Modal Styles
  modalSafe: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleWrapper: { flex: 1, alignItems: "center" },
  modalTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: "#1e3a8a",
  },
  modalSpacer: { width: 44 },

  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  modalTargetLabel: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
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
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: "#334155",
  },

  recentSearchesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  recentSearchesLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13.5,
    color: "#1e3a8a",
    marginLeft: 8,
  },

  stationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  stationTextCol: { flex: 1, paddingRight: 16 },
  stationItemName: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#334155",
    textTransform: "uppercase",
  },
  stationItemSub: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginTop: 2,
  },
  stationListContent: { paddingBottom: 24 },

  infoIcon: { marginLeft: 6 },
  compareIcon: {
    marginVertical: 4,
    transform: [{ scaleX: -1 }, { rotate: "-45deg" }], // 👈 Flipped + Tilted
  },
  flipHorizontal: {
    transform: [{ scaleX: -1 }],
  },
});
