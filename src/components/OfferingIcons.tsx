import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export const SearchTrainsIcon = ({ color = '#f472b6', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Route S-curve path */}
    <Path
      d="M10 28C10 28 14 28 17 25C20 22 17 18 20 15C23 12 27 12 27 12"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Start point pin */}
    <Circle cx="9" cy="28" r="4.5" fill={color} />
    <Circle cx="9" cy="28" r="2" fill="#ffffff" />
    {/* End point pin */}
    <Path
      d="M27 7C24.5 7 22.5 9 22.5 11.5C22.5 14.8 27 19.5 27 19.5C27 19.5 31.5 14.8 31.5 11.5C31.5 9 29.5 7 27 7Z"
      fill={color}
    />
    <Circle cx="27" cy="11.5" r="1.8" fill="#ffffff" />
  </Svg>
);

export const PNRStatusIcon = ({ color = '#22c55e', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Ticket with side notches */}
    <Path
      d="M5 11C5 9.89543 5.89543 9 7 9H29C30.1046 9 31 9.89543 31 11V14.5C29.6193 14.5 28.5 15.6193 28.5 17C28.5 18.3807 29.6193 19.5 31 19.5V23C31 24.1046 30.1046 25 29 25H7C5.89543 25 5 24.1046 5 23V19.5C6.38071 19.5 7.5 18.3807 7.5 17C7.5 15.6193 6.38071 14.5 5 14.5V11Z"
      fill={color}
    />
    {/* 3 inner white stripes */}
    <Rect x="12" y="12.5" width="12" height="2" rx="1" fill="#ffffff" />
    <Rect x="12" y="16" width="12" height="2" rx="1" fill="#ffffff" />
    <Rect x="12" y="19.5" width="12" height="2" rx="1" fill="#ffffff" />
  </Svg>
);

export const CoachPositionIcon = ({ color = '#3b82f6', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Streamlined train engine body */}
    <Path
      d="M5 23.5H31V21C31 16 27.5 13 22 13H11C7 13 5 16 5 20V23.5Z"
      fill={color}
    />
    {/* Front curve slope */}
    <Path
      d="M5 20C5 16 8 13.5 13 13.5H23C28 13.5 31 16.5 31 21V23.5H5V20Z"
      fill={color}
    />
    {/* Windshield / Windows */}
    <Path
      d="M8.5 16.5C8.5 15.5 9.5 15 11 15H15.5V18.5H8.5V16.5Z"
      fill="#ffffff"
    />
    <Rect x="17.5" y="15" width="4.5" height="3.5" rx="0.5" fill="#ffffff" />
    <Rect x="23.5" y="15" width="4.5" height="3.5" rx="0.5" fill="#ffffff" />
    {/* Headlight */}
    <Circle cx="8" cy="21.5" r="1.2" fill="#ffffff" />
    {/* Lower track rails */}
    <Rect x="4" y="25" width="28" height="2" rx="1" fill={color} />
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

export const OrderFoodIcon = ({ color = '#5b5ea6', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Beverage Cup & Straw */}
    <Path d="M22 6L25 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path
      d="M20 12H27.5L26 26H21.5L20 12Z"
      fill={color}
    />
    {/* Burger Top Bun */}
    <Path
      d="M6 18C6 14.5 9 12 13.5 12C17.5 12 19 14.5 19 18H6Z"
      fill={color}
    />
    {/* Burger Patty & Layers */}
    <Rect x="5" y="19.5" width="15" height="2" rx="1" fill={color} />
    <Rect x="5" y="23" width="15" height="2" rx="1" fill={color} />
    {/* Bottom Bun */}
    <Path
      d="M6 26.5C6 27.5 7.5 28.5 13.5 28.5C19.5 28.5 20 27.5 20 26.5H6Z"
      fill={color}
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

export const RailMadadIcon = ({ color = '#f43f5e', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Stylized Interlocking Handshake at 45 degree angle */}
    <G transform="rotate(-45 18 18)">
      <Rect x="7" y="13" width="10" height="10" rx="3" fill={color} />
      <Rect x="19" y="13" width="10" height="10" rx="3" fill={color} />
      <Path
        d="M13 11C13 9.89543 13.8954 9 15 9H21C22.1046 9 23 9.89543 23 11V15H13V11Z"
        fill={color}
      />
      <Path
        d="M13 21H23V25C23 26.1046 22.1046 27 21 27H15C13.8954 27 13 26.1046 13 25V21Z"
        fill={color}
      />
      {/* 4 Gripping Finger Notches */}
      <Rect x="13.5" y="14" width="2" height="8" rx="1" fill="#ffffff" />
      <Rect x="17" y="14" width="2" height="8" rx="1" fill="#ffffff" />
      <Rect x="20.5" y="14" width="2" height="8" rx="1" fill="#ffffff" />
    </G>
  </Svg>
);

export const GoToWavesIcon = ({ color = '#ffffff', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Center Spire */}
    <Path d="M18 4L20 18H16L18 4Z" fill={color} />
    {/* Left Wing */}
    <Path d="M11 13L14.5 27H11L7 17.5L11 13Z" fill={color} />
    {/* Center Left Stem */}
    <Path d="M14.5 17L17 27H14.5L13 20L14.5 17Z" fill={color} />
    {/* Center Right Stem */}
    <Path d="M21.5 17L19 27H21.5L23 20L21.5 17Z" fill={color} />
    {/* Right Wing */}
    <Path d="M25 13L21.5 27H25L29 17.5L25 13Z" fill={color} />
  </Svg>
);

