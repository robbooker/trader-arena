import type { Player, Stock, Trade } from '../utils/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChallengeId = 'short-the-top' | 'catch-the-knife' | 'scalp-master';

export interface ChallengeDefinition {
  id: ChallengeId;
  name: string;
  description: string;
  reward: number;
}

export interface ChallengeProgress {
  challengeId: ChallengeId;
  playerId: string;
  completed: boolean;
  progress: number; // 0–1
  completedAt: number | null;
}

export interface ClosedTrade {
  stockId: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profitable: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARABOLIC_RISE = 0.30;
const CAPITULATION_DROP = 0.25;
const RECENT_TICKS = 5;
const SCALP_STREAK = 10;
const KNIFE_BOTTOM_TOLERANCE = 0.05;

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'short-the-top',
    name: 'Short the Top',
    description: 'Sell a stock that has gone parabolic (30%+ rise in 5 ticks)',
    reward: 500,
  },
  {
    id: 'catch-the-knife',
    name: 'Catch the Knife',
    description: 'Buy a capitulating stock near its bottom',
    reward: 500,
  },
  {
    id: 'scalp-master',
    name: 'Scalp Master',
    description: 'Complete 10 consecutive profitable trades',
    reward: 750,
  },
];

// ---------------------------------------------------------------------------
// FIFO trade analyzer (shared with scoring.ts)
// ---------------------------------------------------------------------------

export function analyzeClosedTrades(trades: Trade[]): ClosedTrade[] {
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  // FIFO queue per stock: each entry is { price, remainingQty }
  const openBuys: Record<string, { price: number; remaining: number }[]> = {};
  const closed: ClosedTrade[] = [];

  for (const trade of sorted) {
    if (trade.type === 'buy') {
      const queue = openBuys[trade.stockId] ?? [];
      queue.push({ price: trade.price, remaining: trade.quantity });
      openBuys[trade.stockId] = queue;
    } else {
      // Sell – match against earliest buys (FIFO)
      const queue = openBuys[trade.stockId] ?? [];
      let remaining = trade.quantity;

      while (remaining > 0 && queue.length > 0) {
        const front = queue[0];
        const filled = Math.min(remaining, front.remaining);

        closed.push({
          stockId: trade.stockId,
          buyPrice: front.price,
          sellPrice: trade.price,
          quantity: filled,
          profitable: trade.price > front.price,
        });

        front.remaining -= filled;
        remaining -= filled;

        if (front.remaining <= 0) {
          queue.shift();
        }
      }
    }
  }

  return closed;
}

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function getRecentPrices(stock: Stock): number[] {
  return stock.priceHistory.slice(-RECENT_TICKS);
}

function isParabolicStock(stock: Stock): boolean {
  const recent = getRecentPrices(stock);
  if (recent.length < 2) return false;
  const start = recent[0];
  const end = recent[recent.length - 1];
  return start > 0 && (end - start) / start >= PARABOLIC_RISE;
}

function isCapitulatingStock(stock: Stock): boolean {
  const recent = getRecentPrices(stock);
  if (recent.length < 2) return false;
  const start = recent[0];
  const end = recent[recent.length - 1];
  return start > 0 && (start - end) / start >= CAPITULATION_DROP;
}

function isNearBottom(buyPrice: number, stock: Stock): boolean {
  const recent = getRecentPrices(stock);
  if (recent.length === 0) return false;
  const min = Math.min(...recent);
  return min > 0 && Math.abs(buyPrice - min) / min <= KNIFE_BOTTOM_TOLERANCE;
}

function getConsecutiveProfitableStreak(
  trades: Trade[],
  _stocks: Stock[],
): number {
  const closedTrades = analyzeClosedTrades(trades);
  if (closedTrades.length === 0) return 0;

  // Walk from the end to count the current streak
  let streak = 0;
  for (let i = closedTrades.length - 1; i >= 0; i--) {
    if (closedTrades[i].profitable) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function evaluateChallenges(
  player: Player,
  stocks: Stock[],
): ChallengeProgress[] {
  const stockMap = new Map(stocks.map((s) => [s.id, s]));
  const now = Date.now();

  // Short the Top: any sell on a parabolic stock
  const shortTheTop: ChallengeProgress = (() => {
    const sells = player.tradeHistory.filter((t) => t.type === 'sell');
    const completed = sells.some((t) => {
      const stock = stockMap.get(t.stockId);
      return stock && isParabolicStock(stock);
    });
    return {
      challengeId: 'short-the-top' as ChallengeId,
      playerId: player.id,
      completed,
      progress: completed ? 1 : 0,
      completedAt: completed ? now : null,
    };
  })();

  // Catch the Knife: any buy on a capitulating stock near its bottom
  const catchTheKnife: ChallengeProgress = (() => {
    const buys = player.tradeHistory.filter((t) => t.type === 'buy');
    const completed = buys.some((t) => {
      const stock = stockMap.get(t.stockId);
      return stock && isCapitulatingStock(stock) && isNearBottom(t.price, stock);
    });
    return {
      challengeId: 'catch-the-knife' as ChallengeId,
      playerId: player.id,
      completed,
      progress: completed ? 1 : 0,
      completedAt: completed ? now : null,
    };
  })();

  // Scalp Master: consecutive profitable streak
  const scalpMaster: ChallengeProgress = (() => {
    const streak = getConsecutiveProfitableStreak(player.tradeHistory, stocks);
    const progress = Math.min(streak / SCALP_STREAK, 1);
    return {
      challengeId: 'scalp-master' as ChallengeId,
      playerId: player.id,
      completed: streak >= SCALP_STREAK,
      progress,
      completedAt: streak >= SCALP_STREAK ? now : null,
    };
  })();

  return [shortTheTop, catchTheKnife, scalpMaster];
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

export function getChallengeById(id: ChallengeId): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export function getTotalChallengeBonus(progresses: ChallengeProgress[]): number {
  return progresses.reduce((sum, p) => {
    if (!p.completed) return sum;
    const def = getChallengeById(p.challengeId);
    return sum + (def?.reward ?? 0);
  }, 0);
}
