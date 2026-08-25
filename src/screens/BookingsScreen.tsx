import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Path } from "react-native-svg";
import { FirebaseService, StorageService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, TicketCard, TicketData } from "@/components/common";

// Exact Sort Descending Header Icon from screenshot
const HeaderSortIcon = ({ color = "#ffffff", size = 22 }: { color?: string; size?: number }) => (
  <FontAwesome5 name="sort-amount-down-alt" size={size} color={color} />
);

const TabTicketIcon = ({ color, isSelected, tab }: { color: string; isSelected: boolean; tab: string }) => {
  // Define fill colors based on tab
  const getFillColor = () => {
    if (!isSelected) return 'none';
    switch (tab) {
      case "Upcoming": return "#fcb76d";
      case "Completed": return "#68cf96";
      case "Cancelled": return "#f98383";
      default: return "#69a5ff";
    }
  };

  const outlineColor = isSelected ? "#1a1a1a" : "#8da0b3";
  const backOutlineColor = "#8da0b3"; // Always grey for the back ticket

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Back Ticket */}
      <Path
        d="M 8.5 5 H 19.5 A 1.5 1.5 0 0 1 21 6.5 V 8 A 2 2 0 0 0 21 12 V 13.5 A 1.5 1.5 0 0 1 19.5 15 H 8.5 A 1.5 1.5 0 0 1 7 13.5 V 6.5 A 1.5 1.5 0 0 1 8.5 5 Z"
        stroke={backOutlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Front Ticket */}
      <Path
        d="M 4.5 9 H 15.5 A 1.5 1.5 0 0 1 17 10.5 V 12 A 2 2 0 0 0 17 16 V 17.5 A 1.5 1.5 0 0 1 15.5 19 H 4.5 A 1.5 1.5 0 0 1 3 17.5 V 10.5 A 1.5 1.5 0 0 1 4.5 9 Z"
        fill={getFillColor()}
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Lines (Only Front Ticket) */}
      <Path
        d="M 6.5 12.5 H 9.5 M 6.5 15.5 H 12.5"
        stroke={outlineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const BookingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<
    "Upcoming" | "Completed" | "Cancelled" | "All"
  >("Upcoming");
  const [upcomingList, setUpcomingList] = useState<TicketData[]>([]);
  const [completedList, setCompletedList] = useState<TicketData[]>([]);
  const [cancelledList, setCancelledList] = useState<TicketData[]>([]);

  useEffect(() => {
    if (user?.uid) {
      // Real-time Firestore listener for tickets
      const unsubscribe = FirebaseService.listenToTickets(
        user.uid,
        (snapshot: any) => {
          const upcoming: TicketData[] = [];
          const completed: TicketData[] = [];
          const cancelled: TicketData[] = [];
          snapshot.forEach((doc: any) => {
            const data = { id: doc.id, ...doc.data() } as TicketData;
            if (data.status === "upcoming") {
              upcoming.push(data);
            } else if (data.status === "completed") {
              completed.push(data);
            } else if (data.status === "cancelled") {
              cancelled.push(data);
            }
          });
          setUpcomingList(upcoming);
          setCompletedList(completed);
          setCancelledList(cancelled);
        },
      );
      return () => unsubscribe();
    } else {
      // Local storage fallback
      let isCancelled = false;
      StorageService.getBookedTickets().then((tickets: TicketData[]) => {
        if (isCancelled) return;
        if (tickets && Array.isArray(tickets)) {
          const upcoming = tickets.filter((t) => t.status === "upcoming");
          const completed = tickets.filter((t) => t.status === "completed");
          const cancelledTickets = tickets.filter((t) => t.status === "cancelled");
          setUpcomingList(upcoming);
          setCompletedList(completed);
          setCancelledList(cancelledTickets);
        } else {
          setUpcomingList([]);
          setCompletedList([]);
          setCancelledList([]);
        }
      });
      return () => { isCancelled = true; };
    }
  }, [user?.uid]);

  const getFilterActiveColor = (tab: string) => {
    switch (tab) {
      case "Upcoming":
        return "#fa9846";
      case "Completed":
        return "#2ea566";
      case "Cancelled":
        return "#ef4444";
      default:
        return "#0066ff";
    }
  };

  const openTicket = (t: TicketData) => {
    navigation.navigate("Ticket", { ticket: t });
  };

  // FIX M4: useMemo prevents SectionList re-rendering all items on every state change
  const sections = useMemo(() => {
    const s: any[] = [];
    if (filter === "Upcoming" || filter === "All") {
      s.push({
        title: `Upcoming (${upcomingList.length})`,
        color: "#e59344",
        icon: "ticket-outline",
        emptyText: "No upcoming bookings found",
        data: upcomingList,
        status: "upcoming",
      });
    }
    if (filter === "Completed" || filter === "All") {
      s.push({
        title: `Completed (${completedList.length})`,
        color: "#2ea566",
        icon: "checkmark-done-circle-outline",
        emptyText: "No completed bookings yet",
        data: completedList,
        status: "completed",
      });
    }
    if (filter === "Cancelled" || filter === "All") {
      s.push({
        // FIX H2: show real cancelled tickets, not hardcoded 0
        title: `Cancelled (${cancelledList.length})`,
        color: "#ef4444",
        icon: "close-circle-outline",
        emptyText: "No cancelled bookings found",
        data: cancelledList,
        status: "cancelled",
      });
    }
    return s;
  }, [filter, upcomingList, completedList, cancelledList]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader
        title="My Bookings"
        variant="blue"
        // FIX M3: use goBack() instead of navigate("HomeTab") to preserve stack history
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity activeOpacity={0.8}>
            <HeaderSortIcon color="#ffffff" size={24} />
          </TouchableOpacity>
        }
      />

      <View style={styles.mainWrapper}>
        <SectionList
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          sections={sections}
          keyExtractor={(item: any, index) => `${item.status}-${item.id}-${index}`}
          renderSectionHeader={({ section }: any) => (
            <View style={styles.sectionHeader}>
              <View style={styles.headerSpacer} />
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {section.title}
              </Text>
              <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7} onPress={() => {
                // Trigger a re-fetch by toggling — Firestore listener auto-updates
              }}>
                <Ionicons name="sync-outline" size={19} color="#8da0b3" />
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item, section }: any) => (
            <TicketCard
              ticket={item}
              status={section.status}
              onOpen={() => openTicket(item)}
              onBookAgain={() =>
                navigation.navigate("Unreserved", {
                  source: item.source,
                  dest: item.dest,
                })
              }
            />
          )}
          renderSectionFooter={({ section }: any) => {
            if (section.data.length === 0) {
              return (
                <View style={[styles.emptyContainer, { marginBottom: 24 }]}>
                  <Ionicons name={section.icon} size={44} color="#cbd5e1" />
                  <Text style={styles.emptyText}>{section.emptyText}</Text>
                </View>
              );
            }
            return <View style={{ height: 16 }} />;
          }}
          stickySectionHeadersEnabled={false}
        />

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
                        fontFamily: isSelected ? "Montserrat_700Bold" : "Montserrat_500Medium",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0066ff" },
  mainWrapper: { flex: 1, backgroundColor: "#ffffff" },
  scrollView: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 20 },
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
    backgroundColor: "#e7f6fd",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: "#d1eaf7",
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
    borderRadius: 16,
    marginHorizontal: 3,
  },
  filterTabActive: {
    backgroundColor: "#fcfcfc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
