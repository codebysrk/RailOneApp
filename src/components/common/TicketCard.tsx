import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Svg, { Line } from "react-native-svg";

export interface TicketData {
  id: string;
  pnr: string;
  ticketId?: string;
  train: string;
  date: string;
  source: string;
  dest: string;
  duration?: string;
  distance?: string;
  fare?: string;
  passengers?: string;
  classType?: string;
  trainType?: string;
  status?: "upcoming" | "completed" | "cancelled";
  moduleType?: "RESERVED" | "UNRESERVED" | "PLATFORM";
}

interface TicketCardProps {
  ticket: TicketData;
  status: "upcoming" | "completed" | "cancelled";
  onOpen?: () => void;
  onBookAgain?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  status,
  onOpen,
  onBookAgain,
}) => {
  const isUpcoming = status === "upcoming";
  const isCompleted = status === "completed";

  const badgeText =
    ticket.moduleType === "UNRESERVED"
      ? "Unreserved"
      : ticket.moduleType === "PLATFORM"
        ? "Platform"
        : "Reserved";

  const borderColor = isUpcoming
    ? "#eda36b"
    : isCompleted
      ? "#6ae7ab"
      : "#f4c2c2";
  const dashedColor = isUpcoming
    ? "rgb(244, 195, 157)"
    : isCompleted
      ? "rgb(197, 224, 211)"
      : "rgb(244, 194, 194)";

  const trainSpaceIndex = ticket.train.indexOf(" ");
  const trainNo =
    trainSpaceIndex !== -1
      ? ticket.train.substring(0, trainSpaceIndex)
      : ticket.train;
  const trainName =
    trainSpaceIndex !== -1 ? ticket.train.substring(trainSpaceIndex) : "";

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* Top Section */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onOpen}
        style={styles.topSection}
      >
        {/* Row 1: Badge & Identifier (UTS No for Unreserved, PNR for Reserved) */}
        <View style={styles.row1}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
          {ticket.moduleType === "UNRESERVED" || ticket.moduleType === "PLATFORM" || !ticket.pnr ? (
            <Text style={styles.pnrContainer}>
              <Text style={styles.pnrLabel}>UTS No: </Text>
              <Text style={styles.pnrValue}>{ticket.ticketId || ticket.id || "---"}</Text>
            </Text>
          ) : (
            <Text style={styles.pnrContainer}>
              <Text style={styles.pnrLabel}>PNR: </Text>
              <Text style={styles.pnrValue}>{ticket.pnr}</Text>
            </Text>
          )}
        </View>

        {/* Row 2: Train No & Journey Date */}
        <View style={styles.row2}>
          <View>
            <Text style={styles.infoLabel}>Train No.</Text>
            <Text style={styles.infoValue}>
              {trainNo}
              <Text style={styles.trainName}>{trainName}</Text>
            </Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.infoLabel}>Journey Date</Text>
            <Text style={styles.infoValue}>{ticket.date}</Text>
          </View>
        </View>

        {/* Row 3: Route & Duration */}
        <View style={styles.row3}>
          <View style={styles.flex1}>
            <Text style={styles.stationText}>{ticket.source}</Text>
          </View>
          <View style={styles.durationContainer}>
            <View style={styles.durationLine} />
            <Text style={styles.durationText}>
              {ticket.duration || "4h:8m"}
            </Text>
            <View style={styles.durationLine} />
          </View>
          <View style={[styles.flex1, styles.rightAlign]}>
            <Text style={[styles.stationText, styles.stationTextRight]}>
              {ticket.dest}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Divider Section */}
      <View style={styles.dividerSection}>
        {/* Dashed line using SVG to guarantee it renders perfectly on Android */}
        <View style={styles.dashedSvgContainer}>
          <Svg height="2" width="100%">
            <Line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke={dashedColor}
              strokeWidth="1.4"
              strokeDasharray="2, 2"
            />
          </Svg>
        </View>

        {/* Left Cutout */}
        <View style={styles.cutoutLeftContainer}>
          <View
            style={[
              styles.cutoutCircle,
              styles.cutoutCircleLeft,
              { borderColor },
            ]}
          />
        </View>

        {/* Right Cutout */}
        <View style={styles.cutoutRightContainer}>
          <View style={[styles.cutoutCircle, { borderColor }]} />
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onBookAgain || onOpen}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>Book Again</Text>
        </TouchableOpacity>
        <View style={styles.verticalDivider} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onOpen}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f7f8f9",
    borderWidth: 1,
    borderRadius: 13,
    marginBottom: 12,
  },
  topSection: {
    padding: 14,
    paddingBottom: 16,
  },
  row1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#dcf4f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    color: "#0f8c9e",
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.2,
  },
  pnrContainer: {
    fontSize: 12,
  },
  pnrLabel: {
    color: "#8e8e8e",
    fontFamily: "Montserrat_400Regular",
    letterSpacing: 0.2,
  },
  pnrValue: {
    color: "#1a1a1a",
    fontFamily: "Montserrat_700Bold",
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  infoLabel: {
    fontSize: 10.5,
    color: "#a0a0a0",
    marginBottom: 2,
    fontFamily: "Montserrat_400Regular",
  },
  infoValue: {
    fontSize: 12,
    color: "#2a2a2a",
    fontFamily: "Montserrat_700Bold",
  },
  trainName: {
    fontFamily: "Montserrat_400Regular",
  },
  row3: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flex1: {
    flex: 1,
  },
  stationText: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: "#2a2a2a",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  stationTextRight: {
    textAlign: "right",
    maxWidth: 100,
    lineHeight: 15,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  durationLine: {
    width: 22,
    height: 1,
    backgroundColor: "#d5d5d5",
    marginHorizontal: 4,
  },
  durationText: {
    fontSize: 10.5,
    color: "#b5b5b5",
    fontFamily: "Montserrat_400Regular",
  },
  dividerSection: {
    position: "relative",
    width: "100%",
    height: 0,
    zIndex: 10,
  },
  dashedSvgContainer: {
    position: "absolute",
    top: -1,
    left: 17, // Adjusted for 30px cutouts
    right: 17,
  },
  cutoutLeftContainer: {
    position: "absolute",
    left: -1.5,
    top: -15,
    width: 15,
    height: 30,
    overflow: "hidden",
  },
  cutoutRightContainer: {
    position: "absolute",
    right: -1.5,
    top: -15,
    width: 15,
    height: 30,
    overflow: "hidden",
  },
  cutoutCircle: {
    width: 30,
    height: 30,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
  },
  cutoutCircleLeft: {
    marginLeft: -15,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionBtnText: {
    color: "#1b62cc",
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
  },
  verticalDivider: {
    width: 1.5,
    height: 15,
    backgroundColor: "#d0d0d0",
  },
});
