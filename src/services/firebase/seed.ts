import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from './config';

export interface StationModel {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  isPopular: boolean;
}

export interface TrainModel {
  trainNumber: string;
  trainName: string;
  fromCode: string;
  toCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  type: string;
  runsOn: string[];
}

export const INITIAL_STATIONS: StationModel[] = [
  { code: 'NDLS', name: 'NEW DELHI', city: 'Delhi', state: 'Delhi', zone: 'NR', isPopular: true },
  { code: 'NZM', name: 'HAZRAT NIZAMUDDIN JN', city: 'Delhi', state: 'Delhi', zone: 'NR', isPopular: true },
  { code: 'DLI', name: 'OLD DELHI JN', city: 'Delhi', state: 'Delhi', zone: 'NR', isPopular: true },
  { code: 'MRA', name: 'MORENA', city: 'Morena', state: 'Madhya Pradesh', zone: 'NCR', isPopular: true },
  { code: 'GWL', name: 'GWALIOR JN', city: 'Gwalior', state: 'Madhya Pradesh', zone: 'NCR', isPopular: true },
  { code: 'AGC', name: 'AGRA CANTT', city: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', isPopular: true },
  { code: 'AF', name: 'AGRA FORT', city: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', isPopular: false },
  { code: 'MTJ', name: 'MATHURA JN', city: 'Mathura', state: 'Uttar Pradesh', zone: 'NCR', isPopular: true },
  { code: 'BPL', name: 'BHOPAL JN', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', isPopular: true },
  { code: 'RKMP', name: 'RANI KAMLAPATI', city: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', isPopular: true },
  { code: 'JHS', name: 'VIRANGANA LAKSHMIBAI (JHANSI)', city: 'Jhansi', state: 'Uttar Pradesh', zone: 'NCR', isPopular: true },
  { code: 'CNB', name: 'KANPUR CENTRAL', city: 'Kanpur', state: 'Uttar Pradesh', zone: 'NCR', isPopular: true },
  { code: 'LKO', name: 'LUCKNOW CHARBAGH', city: 'Lucknow', state: 'Uttar Pradesh', zone: 'NR', isPopular: true },
  { code: 'BSB', name: 'VARANASI JN', city: 'Varanasi', state: 'Uttar Pradesh', zone: 'NR', isPopular: true },
  { code: 'PRYJ', name: 'PRAYAGRAJ JN', city: 'Prayagraj', state: 'Uttar Pradesh', zone: 'NCR', isPopular: true },
  { code: 'CSTM', name: 'CHHATRAPATI SHIVAJI MAHARAJ TERMINUS', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', isPopular: true },
  { code: 'MMCT', name: 'MUMBAI CENTRAL', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', isPopular: true },
  { code: 'LTT', name: 'LOKMANYA TILAK TERMINUS', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', isPopular: true },
  { code: 'HWH', name: 'HOWRAH JN', city: 'Kolkata', state: 'West Bengal', zone: 'ER', isPopular: true },
  { code: 'SDAH', name: 'SEALDAH', city: 'Kolkata', state: 'West Bengal', zone: 'ER', isPopular: true },
  { code: 'MAS', name: 'CHENNAI CENTRAL', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', isPopular: true },
  { code: 'SBC', name: 'KSR BENGALURU', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', isPopular: true },
  { code: 'HYB', name: 'HYDERABAD DECCAN', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', isPopular: true },
  { code: 'SC', name: 'SECUNDERABAD JN', city: 'Hyderabad', state: 'Telangana', zone: 'SCR', isPopular: true },
  { code: 'ADI', name: 'AHMEDABAD JN', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR', isPopular: true },
  { code: 'JP', name: 'JAIPUR JN', city: 'Jaipur', state: 'Rajasthan', zone: 'NWR', isPopular: true },
  { code: 'PNBE', name: 'PATNA JN', city: 'Patna', state: 'Bihar', zone: 'ECR', isPopular: true },
];

export const INITIAL_TRAINS: TrainModel[] = [
  {
    trainNumber: '12279',
    trainName: 'TAJ EXPRESS',
    fromCode: 'GWL',
    toCode: 'NZM',
    departureTime: '15:20',
    arrivalTime: '21:35',
    duration: '6h 15m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
  {
    trainNumber: '12280',
    trainName: 'TAJ EXPRESS',
    fromCode: 'NZM',
    toCode: 'GWL',
    departureTime: '06:55',
    arrivalTime: '13:20',
    duration: '6h 25m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
  {
    trainNumber: '20423',
    trainName: 'PATALKOT SF EXP',
    fromCode: 'CWA',
    toCode: 'GWL',
    departureTime: '18:00',
    arrivalTime: '06:41',
    duration: '12h 41m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
  {
    trainNumber: '12002',
    trainName: 'BHOPAL SHATABDI',
    fromCode: 'NDLS',
    toCode: 'RKMP',
    departureTime: '06:00',
    arrivalTime: '14:40',
    duration: '8h 40m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
  {
    trainNumber: '12952',
    trainName: 'MUMBAI RAJDHANI',
    fromCode: 'NDLS',
    toCode: 'MMCT',
    departureTime: '16:55',
    arrivalTime: '08:35',
    duration: '15h 40m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
  {
    trainNumber: '12302',
    trainName: 'HOWRAH RAJDHANI',
    fromCode: 'NDLS',
    toCode: 'HWH',
    departureTime: '16:50',
    arrivalTime: '09:55',
    duration: '17h 05m',
    type: 'SUPERFAST',
    runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  },
];

export const DatabaseSeedService = {
  seedMastersIfEmpty: async () => {
    try {
      const checkDoc = await getDoc(doc(db, 'system', 'seed_flag'));
      if (checkDoc.exists() && checkDoc.data()?.seeded) {
        return;
      }

      const batch = writeBatch(db);

      INITIAL_STATIONS.forEach((station) => {
        const stationRef = doc(db, 'stations', station.code);
        batch.set(stationRef, station);
      });

      INITIAL_TRAINS.forEach((train) => {
        const trainRef = doc(db, 'trains', train.trainNumber);
        batch.set(trainRef, train);
      });

      const flagRef = doc(db, 'system', 'seed_flag');
      batch.set(flagRef, { seeded: true, seededAt: new Date().toISOString() });

      await batch.commit();
      console.log('✅ Firestore Master Stations & Trains auto-seeded successfully.');
    } catch (error) {
      console.warn('⚠️ Firestore Seed check/execution note:', error);
    }
  },
};

