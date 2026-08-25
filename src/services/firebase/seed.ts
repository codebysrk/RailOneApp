import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { ALL_INDIAN_STATIONS, StationModel, generateStationKeywords } from '@/constants/stations';
import { VERIFIED_RAILWAY_SECTIONS, RailwaySection } from '@/constants/railwaySections';

export { StationModel, RailwaySection };

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

export const INITIAL_STATIONS: StationModel[] = ALL_INDIAN_STATIONS.map((s) => ({
  ...s,
  keywords: generateStationKeywords(s),
}));
export const INITIAL_SECTIONS: RailwaySection[] = VERIFIED_RAILWAY_SECTIONS;

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

      INITIAL_SECTIONS.forEach((section) => {
        const sectionRef = doc(db, 'railway_sections', section.id);
        batch.set(sectionRef, section);
      });

      INITIAL_TRAINS.forEach((train) => {
        const trainRef = doc(db, 'trains', train.trainNumber);
        batch.set(trainRef, train);
      });

      const flagRef = doc(db, 'system', 'seed_flag');
      batch.set(flagRef, { seeded: true, seededAt: new Date().toISOString() });

      await batch.commit();
      console.log('✅ Firestore Master Stations, Railway Sections & Trains auto-seeded successfully.');
    } catch (error) {
      console.warn('⚠️ Firestore Seed check/execution note:', error);
    }
  },
};

