import type { Player, Stock } from '../utils/types';
import { STARTING_CASH } from '../utils/constants';
import { analyzeClosedTrades, getTotalChallengeBonus } from './challenges';
import type { ChallengeProgress, ClosedTrade } from './challenges';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeId =
  | 'diamond-hands'
  | 'paper-hands'
  | 'the-big-short'
  | 'first-blood'
  | 'diversified'
  | 'speed-demon';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
}

export interface PlayerScore {
  playerId: string;
  pnl: number;
  pnlScore: number;
  maxDrawdown: number;
  riskScore: number;
  winRate: number;
  accuracyScore: number;
  roundsUsed: number;
  speedScore: number;
  challengeBonus: number;
  totalScore: number;
  level: number;
  badges: BadgeId[];
}

export interface LevelConfig {
  level: number;
  label: string;
  volatilityMultiplier: number;
  tickSpeedMultiplier: number;
  blackSwanChance: number;
}

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export const ALL_BADGES: Badge[] = [
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    description: 'Held through 20%+ drawdown and recovered to profit',
    icon: '💎',
  },
  {
    id: 'paper-hands',
    name: 'Paper Hands',
    description: 'Sold within 3% drawdown of buy price',
    icon: '🧻',
  },
  {
    id: 'the-big-short',
    name: 'The Big Short',
    description: '50%+ of starting cash earned from short sells',
    icon: '📉',
  },
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Completed first profitable trade',
    icon: '🩸',
  },
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Held positions in 3+ sectors simultaneously',
    icon: '🌐',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Finished in under half the max rounds',
    icon: '⚡',
  },
];

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const PNL_SCALE = 35;
const RISK_WEIGHT = 25;
const ACCURACY_WEIGHT = 25;
const SPEED_WEIGHT = 15;

// ---------------------------------------------------------------------------
// Level system
// ---------------------------------------------------------------------------

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, label: 'Intern', volatilityMultiplier: 1.0, tickSpeedMultiplier: 1.0, blackSwanChance: 0 },
  { level: 2, label: 'Analyst', volatilityMultiplier: 1.2, tickSpeedMultiplier: 0.9, blackSwanChance: 0.05 },
  { level: 3, label: 'Associate', volatilityMultiplier: 1.4, tickSpeedMultiplier: 0.8, blackSwanChance: 0.10 },
  { level: 4, label: 'VP', volatilityMultiplier: 1.7, tickSpeedMultiplier: 0.7, blackSwanChance: 0.15 },
  { level: 5, label: 'Director', volatilityMultiplier: 2.0, tickSpeedMultiplier: 0.6, blackSwanChance: 0.20 },
  { level: 6, label: 'Managing Dir', volatilityMultiplier: 2.5, tickSpeedMultiplier: 0.5, blackSwanChance: 0.30 },
];

export function calculateLevel(totalScore: number): number {
  return Math.min(Math.floor(totalScore / 500) + 1, 6);
}

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[Math.min(Math.max(level, 1), 6) - 1];
}

// ---------------------------------------------------------------------------
// Max drawdown
// ---------------------------------------------------------------------------

export function calculateMaxDrawdown(player: Player, stocks: Stock[]): number {
  const trades = [...player.tradeHistory].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  if (trades.length === 0) return 0;

  const stockMap = new Map(stocks.map((s) => [s.id, s]));

  // Simulate equity at each trade point
  let cash = STARTING_CASH;
  const holdings: Record<string, number> = {};
  let peak = STARTING_CASH;
  let maxDd = 0;

  for (const trade of trades) {
    const cost = trade.price * trade.quantity;
    if (trade.type === 'buy') {
      cash -= cost;
      holdings[trade.stockId] = (holdings[trade.stockId] ?? 0) + trade.quantity;
    } else {
      cash += cost;
      holdings[trade.stockId] = (holdings[trade.stockId] ?? 0) - trade.quantity;
      if (holdings[trade.stockId] <= 0) delete holdings[trade.stockId];
    }

    // Compute equity using trade-time prices (approximate with current stock price)
    let equity = cash;
    for (const [stockId, qty] of Object.entries(holdings)) {
      const stock = stockMap.get(stockId);
      const price = stock?.price ?? 0;
      equity += price * qty;
    }

    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }

  return maxDd;
}

// ---------------------------------------------------------------------------
// Badge evaluation
// ---------------------------------------------------------------------------

function evaluateBadges(
  player: Player,
  stocks: Stock[],
  closedTrades: ClosedTrade[],
  maxDrawdown: number,
  roundsUsed: number,
  maxRounds: number,
): BadgeId[] {
  const badges: BadgeId[] = [];
  const stockMap = new Map(stocks.map((s) => [s.id, s]));

  // First Blood: any profitable closed trade
  if (closedTrades.some((t) => t.profitable)) {
    badges.push('first-blood');
  }

  // Diamond Hands: held through 20%+ drawdown and portfolio is now profitable
  if (maxDrawdown >= 0.20 && player.totalValue > STARTING_CASH) {
    badges.push('diamond-hands');
  }

  // Paper Hands: sold within 3% drawdown of buy price
  if (closedTrades.some((t) => {
    const loss = (t.buyPrice - t.sellPrice) / t.buyPrice;
    return loss > 0 && loss <= 0.03;
  })) {
    badges.push('paper-hands');
  }

  // The Big Short: 50%+ of starting cash earned from sells exceeding held qty
  // Since we don't track short sells separately, approximate:
  // sells where player had 0 held before (no matching buy in FIFO = short sell)
  const shortProfits = closedTrades
    .filter((t) => t.sellPrice > t.buyPrice)
    .reduce((sum, t) => sum + (t.sellPrice - t.buyPrice) * t.quantity, 0);
  // Use total sell profits as proxy since the game checks held < qty for shorts
  if (shortProfits >= STARTING_CASH * 0.5) {
    badges.push('the-big-short');
  }

  // Diversified: held positions in 3+ sectors simultaneously
  // Check current portfolio
  const heldSectors = new Set<string>();
  for (const stockId of Object.keys(player.portfolio)) {
    const stock = stockMap.get(stockId);
    if (stock && (player.portfolio[stockId] ?? 0) > 0) {
      heldSectors.add(stock.sector);
    }
  }
  if (heldSectors.size >= 3) {
    badges.push('diversified');
  }

  // Speed Demon: finished in under half the max rounds
  if (roundsUsed > 0 && roundsUsed < maxRounds / 2) {
    badges.push('speed-demon');
  }

  return badges;
}

// ---------------------------------------------------------------------------
// Sub-score calculations
// ---------------------------------------------------------------------------

function calculatePnlScore(pnl: number): number {
  return (pnl / 100) * PNL_SCALE;
}

function calculateRiskScore(maxDrawdown: number): number {
  return Math.max(0, 100 - maxDrawdown * 200) * (RISK_WEIGHT / 100);
}

function calculateAccuracyScore(winRate: number): number {
  return winRate * 200 * (ACCURACY_WEIGHT / 100);
}

function calculateSpeedScore(roundsUsed: number, maxRounds: number): number {
  if (maxRounds <= 1) return SPEED_WEIGHT * 2;
  const ratio = 1 - (roundsUsed - 1) / (maxRounds - 1);
  return ratio * 200 * (SPEED_WEIGHT / 100);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calculatePlayerScore(
  player: Player,
  stocks: Stock[],
  roundsUsed: number,
  maxRounds: number,
  challengeProgresses: ChallengeProgress[],
): PlayerScore {
  const closedTrades = analyzeClosedTrades(player.tradeHistory);
  const pnl = player.totalValue - STARTING_CASH;
  const maxDrawdown = calculateMaxDrawdown(player, stocks);

  const wins = closedTrades.filter((t) => t.profitable).length;
  const winRate = closedTrades.length > 0 ? wins / closedTrades.length : 0;

  const pnlScore = calculatePnlScore(pnl);
  const riskScore = calculateRiskScore(maxDrawdown);
  const accuracyScore = calculateAccuracyScore(winRate);
  const speedScore = calculateSpeedScore(roundsUsed, maxRounds);
  const challengeBonus = getTotalChallengeBonus(challengeProgresses);

  const totalScore = Math.max(
    0,
    pnlScore + riskScore + accuracyScore + speedScore + challengeBonus,
  );

  const level = calculateLevel(totalScore);
  const badges = evaluateBadges(
    player,
    stocks,
    closedTrades,
    maxDrawdown,
    roundsUsed,
    maxRounds,
  );

  return {
    playerId: player.id,
    pnl,
    pnlScore,
    maxDrawdown,
    riskScore,
    winRate,
    accuracyScore,
    roundsUsed,
    speedScore,
    challengeBonus,
    totalScore,
    level,
    badges,
  };
}
