export type TicketStatus = 'upcoming' | 'completed' | 'cancelled';
export type ClassType = 'SECOND' | 'FIRST' | 'AC_CHAIR';
export type TrainType = 'ORDINARY' | 'MAIL_EXP' | 'SUPERFAST';

export interface Ticket {
  id: string;
  pnr: string;
  ticketId?: string;
  train: string;
  date: string;
  source: string;
  dest: string;
  sourceCode?: string;
  destCode?: string;
  duration?: string;
  fare?: string;
  passengers?: string;
  classType?: string;
  trainType?: string;
  via?: string;
  distance?: string;
  rNumber?: string;
  irCode?: string;
  status: TicketStatus;
  createdAt?: string;
}

export interface Station {
  code: string;
  name: string;
  city?: string;
}

export interface BookingPayload {
  source: Station;
  dest: Station;
  adults: number;
  child: number;
  classType: ClassType;
  trainType: TrainType;
  concession: boolean;
  paperless: boolean;
}

