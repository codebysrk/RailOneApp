import { Ticket } from '@/types/ticket';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Unreserved: undefined;
  BookingConfig: {
    source?: { code: string; name: string };
    dest?: { code: string; name: string };
    paperless?: boolean;
  };
  Ticket: {
    ticket: Ticket;
    fromBooking?: boolean;
  };
  Notification: undefined;
};

export type BottomTabParamList = {
  HomeTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
  MenuTab: undefined;
};

