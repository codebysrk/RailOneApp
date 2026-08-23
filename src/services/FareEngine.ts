export const STATIONS = [
  { code: 'NDLS', name: 'NEW DELHI' },
  { code: 'NZM',  name: 'HAZRAT NIZAMUDDIN' },
  { code: 'MAS',  name: 'CHENNAI CENTRAL' },
  { code: 'SBC',  name: 'BANGALORE CITY' },
  { code: 'CSTM', name: 'CHHATRAPATI SHIVAJI MAHARAJ TERMINUS' },
  { code: 'HWH',  name: 'HOWRAH JUNCTION' },
  { code: 'LKO',  name: 'LUCKNOW NR' },
  { code: 'JP',   name: 'JAIPUR JUNCTION' },
  { code: 'BPL',  name: 'BHOPAL JUNCTION' },
  { code: 'ADI',  name: 'AHMEDABAD JUNCTION' },
];

export const POPULAR_CODES = ['NDLS','NZM','MAS','SBC','CSTM','HWH','LKO','JP','BPL','ADI'];

export const FARE_CONFIG = {
  TRAIN_TYPES: {
    ORDINARY:  { label: 'ORDINARY',  adult: 70,  child: 35 },
    MAIL_EXP:  { label: 'MAIL/EXP',  adult: 110, child: 55 },
    SUPERFAST: { label: 'SUPERFAST', adult: 125, child: 65 },
    SPECIAL:   { label: 'SPECIAL',   adult: 140, child: 70 },
  },
  WALLET_BALANCE: 100.0,
};

export type TrainType = keyof typeof FARE_CONFIG.TRAIN_TYPES;

export const calculateFare = (
  trainType: TrainType,
  adultCount: number,
  childCount: number
): number => {
  const config = FARE_CONFIG.TRAIN_TYPES[trainType] || FARE_CONFIG.TRAIN_TYPES.MAIL_EXP;
  return (config.adult * adultCount) + (config.child * childCount);
};

export const generateTicketId = () => {
  return 'UT' + Date.now().toString(36).toUpperCase().slice(-8);
};

export const getTravelDate = (isNextDay: boolean = false) => {
  const now = new Date();
  if (isNextDay) now.setDate(now.getDate() + 1);
  return now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

