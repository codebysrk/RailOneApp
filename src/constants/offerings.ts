export interface OfferingItem {
  id: string;
  title: string;
  type: 'search' | 'pnr' | 'coach' | 'track' | 'food' | 'refund' | 'madad' | 'waves';
  bg: string;
  color: string;
}

export const APP_OFFERINGS: OfferingItem[] = [
  { id: '1', title: 'Search\nTrains', type: 'search', bg: '#fff0f3', color: '#f472b6' },
  { id: '2', title: 'PNR\nStatus', type: 'pnr', bg: '#ebfbee', color: '#22c55e' },
  { id: '3', title: 'Coach\nPosition', type: 'coach', bg: '#e1f8fc', color: '#0284c7' },
  { id: '4', title: 'Track Your\nTrain', type: 'track', bg: '#fff7e6', color: '#f59e0b' },
  { id: '5', title: 'Order\nFood', type: 'food', bg: '#ece7fd', color: '#7c3aed' },
  { id: '6', title: 'Cancel\nTicket', type: 'refund', bg: '#edf0f3', color: '#475569' },
  { id: '7', title: 'Rail\nMadad', type: 'madad', bg: '#ffeaec', color: '#f43f5e' },
  { id: '8', title: 'Go To\nWAVES', type: 'waves', bg: '#636782', color: '#ffffff' },
];
