import { Ticket } from './ticket';

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
};

export type BottomTabParamList = {
  HomeTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
  MenuTab: undefined;
};

