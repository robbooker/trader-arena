import type { Stock } from '../utils/types';
import { generateId } from '../utils/helpers';

interface StockSeed {
  ticker: string;
  name: string;
  price: number;
  volatility: number;
  sector: string;
  floatShares: number;
  totalShares: number;
  shortInterestPct: number; // as fraction of float
}

const STOCK_SEEDS: StockSeed[] = [
  {
    ticker: 'NXRA',
    name: 'Nexara Therapeutics',
    price: 3.42,
    volatility: 0.06,
    sector: 'Healthcare',
    floatShares: 8_500_000,
    totalShares: 24_000_000,
    shortInterestPct: 0.32,
  },
  {
    ticker: 'VLTX',
    name: 'VoltX Energy Corp',
    price: 1.87,
    volatility: 0.08,
    sector: 'Energy',
    floatShares: 5_200_000,
    totalShares: 18_000_000,
    shortInterestPct: 0.18,
  },
  {
    ticker: 'CRDL',
    name: 'Cordell AI Systems',
    price: 7.15,
    volatility: 0.05,
    sector: 'Technology',
    floatShares: 12_000_000,
    totalShares: 35_000_000,
    shortInterestPct: 0.22,
  },
  {
    ticker: 'MBRA',
    name: 'Mombra Financial',
    price: 0.84,
    volatility: 0.10,
    sector: 'Finance',
    floatShares: 3_800_000,
    totalShares: 15_000_000,
    shortInterestPct: 0.41,
  },
  {
    ticker: 'PLSR',
    name: 'Pulsar Brands Inc',
    price: 4.58,
    volatility: 0.04,
    sector: 'Consumer',
    floatShares: 6_700_000,
    totalShares: 20_000_000,
    shortInterestPct: 0.14,
  },
];

export function createInitialStocks(): Stock[] {
  return STOCK_SEEDS.map((seed) => ({
    id: generateId(),
    ticker: seed.ticker,
    name: seed.name,
    price: seed.price,
    previousClose: seed.price,
    open: seed.price,
    high: seed.price,
    low: seed.price,
    priceHistory: [seed.price],
    volatility: seed.volatility,
    sector: seed.sector,
    float: {
      totalShares: seed.totalShares,
      floatShares: seed.floatShares,
      shortInterest: Math.floor(seed.floatShares * seed.shortInterestPct),
      dayVolume: 0,
      floatRotation: 0,
    },
    volume: {
      current: 0,
      average: 0,
      history: [],
      relativeVolume: 1,
    },
    orderBook: {
      bids: [],
      asks: [],
      spread: 0,
      spreadPercent: 0,
    },
    halted: false,
    haltTicksRemaining: 0,
    momentum: 0,
    catalystMultiplier: 1,
    catalystDecay: 0,
  }));
}
