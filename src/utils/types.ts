export interface Player {
  id: string;
  name: string;
  cash: number;
  portfolio: Record<string, number>; // stockId -> quantity
  totalValue: number;
  tradeHistory: Trade[];
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  priceHistory: number[];
  volatility: number;
  sector: string;
  float: StockFloat;
  volume: VolumeProfile;
  orderBook: OrderBook;
  halted: boolean;
  haltTicksRemaining: number;
  momentum: number; // running momentum factor [-1, 1]
  catalystMultiplier: number; // active catalyst effect
  catalystDecay: number; // how fast catalyst wears off
}

export interface StockFloat {
  totalShares: number;
  floatShares: number; // freely tradeable shares
  shortInterest: number; // shares sold short
  dayVolume: number; // cumulative volume this session
  floatRotation: number; // dayVolume / floatShares
}

export interface VolumeProfile {
  current: number; // volume this tick
  average: number; // rolling average volume per tick
  history: number[]; // recent tick volumes
  relativeVolume: number; // current vs average (RVOL)
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderBookLevel[]; // sorted descending by price
  asks: OrderBookLevel[]; // sorted ascending by price
  spread: number;
  spreadPercent: number;
}

export interface Trade {
  id: string;
  playerId: string;
  stockId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

export type MarketEventType =
  | 'earnings_surprise'
  | 'earnings_miss'
  | 'sec_halt'
  | 'dilution'
  | 'short_squeeze'
  | 'insider_buying'
  | 'fda_approval'
  | 'contract_win'
  | 'offering_announced'
  | 'reddit_momentum';

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  title: string;
  description: string;
  affectedStockIds: string[];
  priceImpact: number; // multiplier, e.g. 1.1 = +10%, 0.85 = -15%
  volumeImpact: number; // volume multiplier
  duration: number; // how many ticks the effect lasts
  timestamp: number;
  tick: number;
}

export type GamePhase = 'lobby' | 'trading' | 'event' | 'results';

export interface GameState {
  phase: GamePhase;
  round: number;
  maxRounds: number;
  players: Player[];
  stocks: Stock[];
  events: MarketEvent[];
  currentEventIndex: number;
  tickSpeed: number; // ms between price updates
}

export interface MarketTickData {
  tick: number;
  timestamp: number;
  stocks: Stock[];
  events: MarketEvent[];
}
