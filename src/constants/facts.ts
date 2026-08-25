export interface FactItem {
  id: string;
  img: any;
  text: string;
}

export const APP_FACTS: FactItem[] = [
  { id: '1', img: require('../../assets/images/fact-old-train.webp'), text: 'First ever passenger train was run between Bori Bandar to Thane on April 16, 1853.' },
  { id: '2', img: require('../../assets/images/fact-chenab-bridge.webp'), text: 'Chenab Railway Bridge in Dharot, Jammu & Kashmir is the World\'s highest Railway Bridge.' },
  { id: '3', img: require('../../assets/images/fact-noney-bridge.webp'), text: 'Noney Bridge is going to be world\'s tallest railway bridge pier at a height of 141 meters.' },
  { id: '4', img: require('../../assets/images/fact-electrified-network.webp'), text: 'Indian Railways is on track to achieve 100% electrification of Broad Gauge network.' },
  { id: '5', img: require('../../assets/images/fact-gorakhpur-platform.webp'), text: 'Gorakhpur Railway Station in Uttar Pradesh has one of the world\'s longest platforms at 1,366 meters.' },
];

