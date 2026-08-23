export interface OfferingItem {
  id: string;
  title: string;
  type: 'search' | 'pnr' | 'coach' | 'track' | 'food' | 'refund' | 'madad' | 'waves';
  bg: string;
  color: string;
}

export const APP_OFFERINGS: OfferingItem[] = [
  { id: '1', title: 'Search\nTrains', type: 'search', bg: '#fdf0f4', color: '#f472b6' },
  { id: '2', title: 'PNR\nStatus', type: 'pnr', bg: '#f0fdf4', color: '#22c55e' },
  { id: '3', title: 'Coach\nPosition', type: 'coach', bg: '#f0f9ff', color: '#3b82f6' },
  { id: '4', title: 'Track Your\nTrain', type: 'track', bg: '#fefce8', color: '#eab308' },
  { id: '5', title: 'Order\nFood', type: 'food', bg: '#eef2ff', color: '#5b5ea6' },
  { id: '6', title: 'File\nRefund', type: 'refund', bg: '#f1f5f9', color: '#374151' },
  { id: '7', title: 'Rail\nMadad', type: 'madad', bg: '#fff1f2', color: '#f43f5e' },
  { id: '8', title: 'Go To\nWAVES', type: 'waves', bg: '#5e6178', color: '#ffffff' },
];
