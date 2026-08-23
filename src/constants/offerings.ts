import { colors } from '../theme/colors';

export interface OfferingItem {
  id: string;
  title: string;
  icon: string;
  bg: string;
  color: string;
}

export const APP_OFFERINGS: OfferingItem[] = [
  { id: '1', title: 'Search\nTrains', icon: 'search', bg: '#ffe4ed', color: '#ff66a3' },
  { id: '2', title: 'PNR\nStatus', icon: 'ticket', bg: '#e0ffe0', color: '#22a042' },
  { id: '3', title: 'Coach\nPosition', icon: 'train', bg: '#e0f2fe', color: '#2563eb' },
  { id: '4', title: 'Track Your\nTrain', icon: 'location', bg: '#fffbeb', color: '#d97706' },
  { id: '5', title: 'Order\nFood', icon: 'fast-food', bg: '#e0e7ff', color: '#4f46e5' },
  { id: '6', title: 'File\nRefund', icon: 'cash', bg: '#f1f5f9', color: '#475569' },
  { id: '7', title: 'Rail\nMadad', icon: 'help-buoy', bg: '#ffe4e6', color: '#e11d48' },
  { id: '8', title: 'Go To\nWAVES', icon: 'radio', bg: '#64748b', color: colors.white },
];

