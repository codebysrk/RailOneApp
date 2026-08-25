export interface OfferingItem {
  id: string;
  title: string;
  type: 'search' | 'pnr' | 'coach' | 'track' | 'food' | 'refund' | 'madad' | 'waves';
  bg: string;
  color: string;
}

export const APP_OFFERINGS: OfferingItem[] = [
  { id: '1', title: 'Search\nTrains', type: 'search', bg: '#ffefef', color: '#f472b6' },
  { id: '2', title: 'PNR\nStatus', type: 'pnr', bg: '#ebfae9', color: '#3c8e3e' },
  { id: '3', title: 'Coach\nPosition', type: 'coach', bg: '#e3f8fe', color: '#2f66c2' },
  { id: '4', title: 'Track Your\nTrain', type: 'track', bg: '#fef6e9', color: '#e59a1b' },
  { id: '5', title: 'Order\nFood', type: 'food', bg: '#deddfc', color: '#5856d6' },
  { id: '6', title: 'File\nRefund', type: 'refund', bg: '#eaeaea', color: '#474747' },
  { id: '7', title: 'Rail\nMadad', type: 'madad', bg: '#f7dfdf', color: '#f37371' },
  { id: '8', title: 'Go To\nWAVES', type: 'waves', bg: '#686884', color: '#ffffff' },
];
