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
  priceHistory: number[];
  volatility: number;
  sector: string;
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

export interface MarketEvent {
  id: string;
  type: 'boom' | 'crash' | 'news' | 'earnings' | 'rumor';
  title: string;
  description: string;
  affectedStockIds: string[];
  priceImpact: number; // multiplier, e.g. 1.1 = +10%, 0.85 = -15%
  timestamp: number;
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
