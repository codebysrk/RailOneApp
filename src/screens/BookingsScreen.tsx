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
import { colors } from "@/theme/colors";
import { spacing, elevation } from "@/theme/spacing";
import { FirebaseService, StorageService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { AppHeader, TicketCard, TicketData } from "@/components/common";

export const BookingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<
    "Upcoming" | "Completed" | "Cancelled" | "All"
  >("Upcoming");
  const [upcomingList, setUpcomingList] = useState<TicketData[]>([]);
  const [completedList, setCompletedList] = useState<TicketData[]>([]);

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
          setUpcomingList(upcoming);
          setCompletedList(completed);
        },
      );
      return () => unsubscribe();
    } else {
      // Local storage fallback for unauthenticated users
      StorageService.getBookedTickets().then((tickets: TicketData[]) => {
        const upcoming = tickets.filter((t) => t.status === "upcoming");
        const completed = tickets.filter(
          (t) => t.status === "completed" || t.status === "cancelled",
        );
        setUpcomingList(upcoming);
        setCompletedList(completed);
      });
    }
  }, [user?.uid]);

  const getFilterColor = (tab: string) => {
    if (filter !== tab) return "#94a3b8";
    switch (tab) {
      case "Upcoming":
        return "#f59e0b";
      case "Completed":
        return "#10b981";
      case "Cancelled":
        return "#ef4444";
      default:
        return "#0066ff";
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
        rightAction={{
          icon: "swap-vertical",
          onPress: () => {},
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {(filter === "Upcoming" || filter === "All") && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: "#f59e0b" }]}>
                Upcoming ({upcomingList.length})
              </Text>
              <Ionicons name="sync-outline" size={20} color="#64748b" />
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
              <Text style={[styles.sectionTitle, { color: "#10b981" }]}>
                Completed ({completedList.length})
              </Text>
              <Ionicons name="sync-outline" size={20} color="#64748b" />
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
      </ScrollView>

      {/* Bottom Filter Bar */}
      <View style={styles.filterBarWrapper}>
        <View style={styles.filterBar}>
          {(["Upcoming", "Completed", "Cancelled", "All"] as const).map(
            (tab) => {
              const isSelected = filter === tab;
              const activeColor = getFilterColor(tab);
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
                  <Ionicons
                    name={isSelected ? "ticket" : "ticket-outline"}
                    size={22}
                    color={isSelected ? activeColor : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      {
                        color: isSelected ? activeColor : "#64748b",
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: spacing.md, paddingBottom: 90 },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },

  filterBarWrapper: {
    backgroundColor: "#e6f3fd",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#d0e7fb",
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    ...elevation.sm,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },
  filterTabActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 11,
    marginTop: 4,
  },
});
