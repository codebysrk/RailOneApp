export interface OfferingItem {
  id: string;
  title: string;
  type: 'search' | 'pnr' | 'coach' | 'track' | 'food' | 'refund' | 'madad' | 'waves';
  bg: string;
  color: string;
}

export const APP_OFFERINGS: OfferingItem[] = [
  { id: '1', title: 'Search\nTrains', type: 'search', bg: '#fef0f2', color: '#ec4899' },
  { id: '2', title: 'PNR\nStatus', type: 'pnr', bg: '#ebfae9', color: '#16a34a' },
  { id: '3', title: 'Coach\nPosition', type: 'coach', bg: '#e8f7ff', color: '#2563eb' },
  { id: '4', title: 'Track Your\nTrain', type: 'track', bg: '#fef7e1', color: '#f59e0b' },
  { id: '5', title: 'Order\nFood', type: 'food', bg: '#e0e5fe', color: '#4338ca' },
  { id: '6', title: 'File\nRefund', type: 'refund', bg: '#ebeef2', color: '#334155' },
  { id: '7', title: 'Rail\nMadad', type: 'madad', bg: '#fde9ea', color: '#ef4444' },
  { id: '8', title: 'Go To\nWAVES', type: 'waves', bg: '#5d5f78', color: '#ffffff' },
];
