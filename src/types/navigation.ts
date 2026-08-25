import { Ticket } from '@/types/ticket';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  // FIX M1: Unreserved now accepts optional source/dest string params
  Unreserved: { source?: string; dest?: string } | undefined;
  // FIX M2: BookingConfig takes string params (matching actual usage)
  BookingConfig: {
    source: string;
    dest: string;
  };
  Ticket: {
    ticket: Ticket;
    fromBooking?: boolean;
  };
  Notification: undefined;
  Language: undefined;
};

export type BottomTabParamList = {
  HomeTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
  MenuTab: undefined;
};
