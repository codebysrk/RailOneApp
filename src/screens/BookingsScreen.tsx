import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { FirebaseService, StorageService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, TicketCard, TicketData } from "@/components/common";

const DEFAULT_UPCOMING: TicketData[] = [
  {
    id: "up-1",
    pnr: "2160978001",
    train: "12279 (TAJ EXPRESS)",
    date: "Sat, 29 Aug 26",
    source: "MORENA",
    dest: "HAZRAT NIZAMUDDIN JN",
    duration: "4h:8m",
    status: "upcoming",
    moduleType: "RESERVED",
  },
  {
    id: "up-2",
    pnr: "2261626145",
    train: "12279 (TAJ EXPRESS)",
    date: "Sat, 29 Aug 26",
    source: "MORENA",
    dest: "HAZRAT NIZAMUDDIN JN",
    duration: "4h:7m",
    status: "upcoming",
    moduleType: "RESERVED",
  },
];

const DEFAULT_COMPLETED: TicketData[] = [
  {
    id: "comp-1",
    pnr: "6835493350",
    train: "20423 (PATALKOT SF EXP)",
    date: "Thu, 30 Jul 26",
    source: "CHHINDWARA JN.",
    dest: "GWALIOR JN.",
    duration: "12h:41m",
    status: "completed",
    moduleType: "RESERVED",
  },
  {
    id: "comp-2",
    pnr: "2841446468",
    train: "12280 (TAJ EXPRESS)",
    date: "Sun, 9 Aug 26",
    source: "HAZRAT NIZAMUDDIN JN",
    dest: "MORENA",
    duration: "4h:10m",
    status: "completed",
    moduleType: "RESERVED",
  },
];

// Exact Sort Descending Header Icon from screenshot
const HeaderSortIcon = ({ color = "#ffffff", size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6H13M4 12H11M4 18H8" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Path d="M17 5V19M17 19L13.5 15.5M17 19L20.5 15.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Exact Ticket Tab Icon from screenshot
const TabTicketIcon = ({ color, isSelected, tab }: { color: string; isSelected: boolean; tab: string }) => {
  if (tab === "All" && isSelected) {
    return (
      <Svg width={24} height={18} viewBox="0 0 24 18" fill="none">
        <Path
          d="M2 3.5C2 2.67 2.67 2 3.5 2H20.5C21.33 2 22 2.67 22 3.5V6.5C20.9 6.5 20 7.4 20 8.5C20 9.6 20.9 10.5 22 10.5V14.5C22 15.33 21.33 16 20.5 16H3.5C2.67 16 2 15.33 2 14.5V10.5C3.1 10.5 4 9.6 4 8.5C4 7.4 3.1 6.5 2 6.5V3.5Z"
          fill="#1e293b"
          stroke="#1e293b"
          strokeWidth={1.5}
        />
        <Path d="M14 6H19M14 10H17" stroke="#0066ff" strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={24} height={18} viewBox="0 0 24 18" fill="none">
      <Path
        d="M2 3.5C2 2.67 2.67 2 3.5 2H20.5C21.33 2 22 2.67 22 3.5V6.5C20.9 6.5 20 7.4 20 8.5C20 9.6 20.9 10.5 22 10.5V14.5C22 15.33 21.33 16 20.5 16H3.5C2.67 16 2 15.33 2 14.5V10.5C3.1 10.5 4 9.6 4 8.5C4 7.4 3.1 6.5 2 6.5V3.5Z"
        fill={isSelected ? (tab === "Upcoming" ? "#f39c42" : tab === "Completed" ? "#2ea566" : tab === "Cancelled" ? "#ef4444" : "#1e293b") : "none"}
        stroke={color}
        strokeWidth={1.7}
      />
      {isSelected ? (
        <Path d="M8 2V16" stroke="#ffffff" strokeWidth={1.2} strokeDasharray="2 2" />
      ) : (
        <Path d="M8 2V16M13 6H18M13 10H16" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      )}
    </Svg>
  );
};

export const BookingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<
    "Upcoming" | "Completed" | "Cancelled" | "All"
  >("Upcoming");
  const [upcomingList, setUpcomingList] = useState<TicketData[]>(DEFAULT_UPCOMING);
  const [completedList, setCompletedList] = useState<TicketData[]>(DEFAULT_COMPLETED);

  useEffect(() => {
    if (user?.uid) {
      // Real-time Firestore listener for tickets
      const unsubscribe = FirebaseService.listenToTickets(
        user.uid,
        (snapshot: any) => {
          const upcoming: TicketData[] = [];
          const completed: TicketData[] = [];
          snapshot.forEach((doc: any) => {
            const data = { id: doc.id, ...doc.data() } as TicketData;
            if (data.status === "upcoming") {
              upcoming.push(data);
            } else if (data.status === "completed" || data.status === "cancelled") {
              completed.push(data);
            }
          });
          if (upcoming.length > 0) setUpcomingList(upcoming);
          if (completed.length > 0) setCompletedList(completed);
        },
      );
      return () => unsubscribe();
    } else {
      // Local storage fallback
      StorageService.getBookedTickets().then((tickets: TicketData[]) => {
        if (tickets && tickets.length > 0) {
          const upcoming = tickets.filter((t) => t.status === "upcoming");
          const completed = tickets.filter(
            (t) => t.status === "completed" || t.status === "cancelled",
          );
          if (upcoming.length > 0) setUpcomingList(upcoming);
          if (completed.length > 0) setCompletedList(completed);
        }
      });
    }
  }, [user?.uid]);

  const getFilterActiveColor = (tab: string) => {
    switch (tab) {
      case "Upcoming":
        return "#e59344";
      case "Completed":
        return "#2ea566";
      case "Cancelled":
        return "#ef4444";
      default:
        return "#1e293b";
    }
  };

  const openTicket = (t: TicketData) => {
    navigation.navigate("Ticket", { ticket: t });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        title="My Bookings"
        variant="blue"
        onBack={() => navigation.navigate("HomeTab")}
        rightComponent={
          <TouchableOpacity activeOpacity={0.8}>
            <HeaderSortIcon color="#ffffff" size={22} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {(filter === "Upcoming" || filter === "All") && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerSpacer} />
              <Text style={[styles.sectionTitle, { color: "#e59344" }]}>
                Upcoming ({upcomingList.length})
              </Text>
              <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7}>
                <Ionicons name="sync-outline" size={19} color="#8da0b3" />
              </TouchableOpacity>
            </View>
            {upcomingList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={44} color="#cbd5e1" />
                <Text style={styles.emptyText}>No upcoming bookings found</Text>
              </View>
            ) : (
              upcomingList.map((t, idx) => (
                <TicketCard
                  key={`upcoming-${t.id}-${idx}`}
                  ticket={t}
                  status="upcoming"
                  onOpen={() => openTicket(t)}
                />
              ))
            )}
          </View>
        )}

        {(filter === "Completed" || filter === "All") && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerSpacer} />
              <Text style={[styles.sectionTitle, { color: "#2ea566" }]}>
                Completed ({completedList.length})
              </Text>
              <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7}>
                <Ionicons name="sync-outline" size={19} color="#8da0b3" />
              </TouchableOpacity>
            </View>
            {completedList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={44} color="#cbd5e1" />
                <Text style={styles.emptyText}>No completed bookings yet</Text>
              </View>
            ) : (
              completedList.map((t, idx) => (
                <TicketCard
                  key={`completed-${t.id}-${idx}`}
                  ticket={t}
                  status="completed"
                  onOpen={() => openTicket(t)}
                />
              ))
            )}
          </View>
        )}

        {filter === "Cancelled" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerSpacer} />
              <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>
                Cancelled (0)
              </Text>
              <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7}>
                <Ionicons name="sync-outline" size={19} color="#8da0b3" />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyContainer}>
              <Ionicons name="close-circle-outline" size={44} color="#cbd5e1" />
              <Text style={styles.emptyText}>No cancelled bookings found</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Filter Navigation Bar */}
      <View style={styles.filterBarWrapper}>
        <View style={styles.filterBar}>
          {(["Upcoming", "Completed", "Cancelled", "All"] as const).map(
            (tab) => {
              const isSelected = filter === tab;
              const activeColor = getFilterActiveColor(tab);
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.filterTab,
                    isSelected && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(tab)}
                  activeOpacity={0.8}
                >
                  <TabTicketIcon
                    tab={tab}
                    isSelected={isSelected}
                    color={isSelected ? activeColor : "#8da0b3"}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: isSelected ? activeColor : "#8da0b3",
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 90 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerSpacer: {
    width: 24,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    textAlign: "center",
  },
  refreshBtn: {
    width: 24,
    alignItems: "flex-end",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },

  filterBarWrapper: {
    backgroundColor: "#e8f4fd",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#c5e1f7",
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
    marginHorizontal: 3,
  },
  filterTabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 11.5,
    marginTop: 4,
  },
});
