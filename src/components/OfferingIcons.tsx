import React from 'react';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, G, Defs, Mask } from 'react-native-svg';

export const SearchTrainsIcon = ({ color = '#f472b6', size = 31 }: { color?: string; size?: number }) => (
  <FontAwesome5 name="route" size={size} color={color} />
);

export const PNRStatusIcon = ({ color = '#0b5c1f', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 800 400" fill="none">
    <Defs>
      <Mask id="pnr_cut">
        <Rect width="800" height="400" fill="white" />
        <Circle cx="0" cy="200" r="90" fill="black" />
        <Circle cx="800" cy="200" r="90" fill="black" />
        <Rect x="120" y="40" width="20" height="70" rx="10" fill="black" />
        <Rect x="120" y="130" width="20" height="70" rx="10" fill="black" />
        <Rect x="120" y="220" width="20" height="70" rx="10" fill="black" />
        <Rect x="120" y="310" width="20" height="50" rx="10" fill="black" />
        <Rect x="220" y="110" width="460" height="40" rx="20" fill="black" />
        <Rect x="220" y="190" width="460" height="40" rx="20" fill="black" />
        <Rect x="220" y="270" width="460" height="40" rx="20" fill="black" />
      </Mask>
    </Defs>
    <Rect x="0" y="0" width="800" height="400" rx="40" fill={color} mask="url(#pnr_cut)" />
  </Svg>
);

export const CoachPositionIcon = ({ color = '#3b82f6', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M4 15.5V8a2 2 0 0 1 2-2h8.5c1.1 0 2.1.4 2.8 1.2l3.5 3.5c.7.7 1.2 1.8 1.2 2.8v2a2 2 0 0 1-2 2H4zM6 8v3h4V8H6zm6 0v3h4V8h-4zm-8 9h16v1.5H4V17z"
    />
  </Svg>
);

export const TrackYourTrainIcon = ({ color = '#eab308', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Train Front Outline */}
    <Path
      d="M9 11C9 8.23858 11.2386 6 14 6H22C24.7614 6 27 8.23858 27 11V23C27 25.2091 25.2091 27 23 27H13C10.7909 27 9 25.2091 9 23V11Z"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Windshield */}
    <Path
      d="M12 11C12 10.4477 12.4477 10 13 10H23C23.5523 10 24 10.4477 24 11V15C24 15.5523 23.5523 16 23 16H13C12.4477 16 12 15.5523 12 15V11Z"
      fill={color}
    />
    {/* Headlights */}
    <Circle cx="13.5" cy="21" r="1.6" fill={color} />
    <Circle cx="22.5" cy="21" r="1.6" fill={color} />
    {/* Front track legs */}
    <Path d="M12 27L9 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M24 27L27 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const OrderFoodIcon = ({ color = '#33385d', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="670 620 680 680" fill="none">
    <Path
      fill={color}
      d="M919.939 925.114C941.109 925.114 961.955 927.467 982.481 932.174C1003.01 936.876 1021.93 944.359 1039.25 954.625C1056.57 964.885 1071.44 978.036 1083.84 994.076C1096.24 1010.11 1104.79 1029.25 1109.49 1051.49C1110.78 1057.47 1109.51 1062.82 1105.69 1067.52C1101.87 1072.23 1096.94 1074.58 1090.89 1074.58H748.343C742.298 1074.58 737.361 1072.23 733.543 1067.52C729.724 1062.82 728.457 1057.47 729.742 1051.49C734.444 1029.25 742.996 1010.11 755.398 994.076C767.8 978.036 782.664 964.885 799.98 954.625C817.3 944.359 836.334 936.876 857.072 932.174C877.814 927.467 898.768 925.114 919.939 925.114ZM746.418 1159.26C740.539 1159.26 735.432 1157.08 731.104 1152.73C726.771 1148.38 724.607 1143.24 724.607 1137.33C724.607 1131.42 726.771 1126.32 731.104 1122.05C735.432 1117.77 740.539 1115.63 746.418 1115.63H1092.82C1098.7 1115.63 1103.8 1117.81 1108.13 1122.16C1112.46 1126.51 1114.63 1131.64 1114.63 1137.56C1114.63 1143.47 1112.46 1148.56 1108.13 1152.84C1103.8 1157.11 1098.7 1159.26 1092.82 1159.26H746.418ZM746.418 1243.93C740.539 1243.93 735.432 1241.76 731.104 1237.4C726.771 1233.05 724.607 1227.92 724.607 1222.01C724.607 1216.09 726.771 1211 731.104 1206.72C735.432 1202.45 740.539 1200.31 746.418 1200.31H1092.82C1098.7 1200.31 1103.8 1202.49 1108.13 1206.84C1112.46 1211.19 1114.63 1216.32 1114.63 1222.23C1114.63 1228.14 1112.46 1233.24 1108.13 1237.51C1103.8 1241.79 1098.7 1243.93 1092.82 1243.93H746.418ZM1153.12 1243.93V1067.52C1153.12 1022.43 1138.04 983.463 1107.89 950.63C1077.74 917.797 1040.43 896.888 995.956 887.908L987.616 816.065C986.759 810.078 988.287 805.052 992.196 800.99C996.105 796.928 1001 794.895 1006.86 794.895H1116.55V698.672C1116.55 693.221 1118.41 688.65 1122.12 684.962C1125.83 681.274 1130.43 679.431 1135.91 679.431C1141.39 679.431 1145.95 681.274 1149.59 684.962C1153.22 688.65 1155.04 693.221 1155.04 698.672V794.895H1267.94C1273.93 794.895 1278.74 796.982 1282.38 801.147C1286.01 805.318 1287.4 810.29 1286.55 816.065L1243.56 1226.61C1242.89 1231.42 1240.69 1235.51 1236.96 1238.88C1233.24 1242.25 1229.03 1243.93 1224.32 1243.93H1153.12Z"
    />
  </Svg>
);

export const FileRefundIcon = ({ color = '#374151', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Base Ticket */}
    <Path
      d="M7 11C7 9.89543 7.89543 9 9 9H27C28.1046 9 29 9.89543 29 11V14C27.8954 14 27 14.8954 27 16C27 17.1046 27.8954 18 29 18V21C29 22.1046 28.1046 23 27 23H9C7.89543 23 7 22.1046 7 21V18C8.10457 18 9 17.1046 9 16C9 14.8954 8.10457 14 7 14V11Z"
      fill={color}
    />
    {/* Cancellation Cross Circle Badge */}
    <Circle cx="22" cy="12" r="4.5" fill="#ffffff" stroke={color} strokeWidth="1.5" />
    <Path d="M20.2 10.2L23.8 13.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M23.8 10.2L20.2 13.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const RailMadadIcon = ({ color = '#f43f5e', size = 31 }: { color?: string; size?: number }) => (
  <MaterialIcons name="handshake" size={size} color={color} />
);

export const GoToWavesIcon = ({ color = '#ffffff', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 338 365" fill="none">
    <Path fill={color} d="M164 29L122 281L117 278L86 177H38L91 344H151L164 257V29Z" />
    <Path fill={color} d="M175 28V257L187 343H248L301 176H253L223 276L217 281L175 28Z" />
  </Svg>
);

