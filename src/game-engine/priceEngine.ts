import type { Stock } from '../utils/types';

// --- Random helpers ---

function gaussianRandom(): number {
  // Box-Muller transform for normal distribution
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Configuration ---

const MOMENTUM_DECAY = 0.92; // momentum carries ~92% per tick
const MOMENTUM_SENSITIVITY = 0.4; // how much new returns feed into momentum
const MEAN_REVERSION_STRENGTH = 0.002; // pull toward VWAP-ish anchor
const MEAN_REVERSION_WINDOW = 60; // ticks to compute anchor price
const MIN_PRICE = 0.01; // penny floor

// Micro-cap characteristics
const PARABOLIC_THRESHOLD = 0.15; // momentum level that triggers parabolic behavior
const PARABOLIC_VOLATILITY_MULT = 2.5; // vol expansion during parabolic moves
const CRASH_PROBABILITY_BASE = 0.003; // base chance of sudden reversal per tick
const CRASH_MOMENTUM_FACTOR = 8; // how much momentum increases crash odds

// --- Price computation ---

export function computeNextPrice(stock: Stock, tick: number): PriceUpdate {
  if (stock.halted) {
    return {
      price: stock.price,
      momentum: stock.momentum,
      catalystMultiplier: stock.catalystMultiplier,
      catalystDecay: stock.catalystDecay,
      volume: 0,
    };
  }

  // Decay catalyst effect
  let catalystMult = stock.catalystMultiplier;
  let catalystDec = stock.catalystDecay;
  if (catalystMult !== 1) {
    catalystMult = 1 + (catalystMult - 1) * (1 - catalystDec);
    if (Math.abs(catalystMult - 1) < 0.001) {
      catalystMult = 1;
      catalystDec = 0;
    }
  }

  // Base random walk
  const baseReturn = gaussianRandom() * stock.volatility;

  // Momentum component
  let momentum = stock.momentum * MOMENTUM_DECAY + baseReturn * MOMENTUM_SENSITIVITY;

  // Detect parabolic state
  const isParabolic = Math.abs(momentum) > PARABOLIC_THRESHOLD;
  const volMultiplier = isParabolic ? PARABOLIC_VOLATILITY_MULT : 1;

  // Check for sudden reversal (micro-cap crash/squeeze failure)
  const crashOdds = CRASH_PROBABILITY_BASE + Math.abs(momentum) * CRASH_MOMENTUM_FACTOR * CRASH_PROBABILITY_BASE;
  const didCrash = isParabolic && Math.random() < crashOdds;
  if (didCrash) {
    // Violent reversal — flip momentum hard
    momentum = -momentum * (0.6 + Math.random() * 0.4);
  }

  // Mean reversion toward recent anchor
  const anchorPrice = computeAnchor(stock.priceHistory);
  const reversionPull = (anchorPrice - stock.price) / stock.price * MEAN_REVERSION_STRENGTH;

  // Combine all components
  const totalReturn =
    baseReturn * volMultiplier * catalystMult +
    momentum * 0.3 +
    reversionPull;

  // Apply to price
  let newPrice = stock.price * (1 + totalReturn);
  newPrice = Math.max(MIN_PRICE, newPrice);

  // Round to cents (or sub-penny for < $1)
  newPrice = newPrice >= 1
    ? Math.round(newPrice * 100) / 100
    : Math.round(newPrice * 10000) / 10000;

  // Simulated volume — higher during volatile moves, parabolic runs
  const baseVolume = stock.float.floatShares * 0.002; // ~0.2% of float per tick baseline
  const volFactor = 1 + Math.abs(totalReturn) * 40;
  const parabolicVolBoost = isParabolic ? 3 : 1;
  const catalystVolBoost = catalystMult !== 1 ? 2 : 1;
  const tickVolume = Math.floor(
    baseVolume * volFactor * parabolicVolBoost * catalystVolBoost * (0.5 + Math.random())
  );

  // Clamp momentum
  momentum = clamp(momentum, -0.5, 0.5);

  // Time-of-day volume shaping (U-shaped: high at open/close, low midday)
  // Tick 0 = market open, tick 389 = market close (6.5hr * 60min)
  const sessionTick = tick % 390;
  const timeOfDayMult = computeTimeOfDayVolume(sessionTick);

  return {
    price: newPrice,
    momentum,
    catalystMultiplier: catalystMult,
    catalystDecay: catalystDec,
    volume: Math.floor(tickVolume * timeOfDayMult),
  };
}

function computeAnchor(priceHistory: number[]): number {
  const window = priceHistory.slice(-MEAN_REVERSION_WINDOW);
  if (window.length === 0) return 0;
  return window.reduce((sum, p) => sum + p, 0) / window.length;
}

function computeTimeOfDayVolume(sessionTick: number): number {
  // U-shaped curve: high volume first/last 30 min, low midday
  const normalized = sessionTick / 389; // 0 to 1
  // Parabola: y = 4(x-0.5)^2 + 0.5, scaled to [0.5, 1.5]
  return 0.5 + 4 * (normalized - 0.5) ** 2;
}

export function applyPriceUpdate(stock: Stock, update: PriceUpdate): Stock {
  const newHistory = [...stock.priceHistory, update.price];
  // Keep last 500 ticks of history
  if (newHistory.length > 500) newHistory.shift();

  const newVolumeHistory = [...stock.volume.history, update.volume];
  if (newVolumeHistory.length > 60) newVolumeHistory.shift();

  const avgVolume = newVolumeHistory.length > 0
    ? newVolumeHistory.reduce((s, v) => s + v, 0) / newVolumeHistory.length
    : update.volume;

  const newDayVolume = stock.float.dayVolume + update.volume;

  return {
    ...stock,
    price: update.price,
    high: Math.max(stock.high, update.price),
    low: Math.min(stock.low, update.price),
    priceHistory: newHistory,
    momentum: update.momentum,
    catalystMultiplier: update.catalystMultiplier,
    catalystDecay: update.catalystDecay,
    volume: {
      current: update.volume,
      average: avgVolume,
      history: newVolumeHistory,
      relativeVolume: avgVolume > 0 ? update.volume / avgVolume : 1,
    },
    float: {
      ...stock.float,
      dayVolume: newDayVolume,
      floatRotation: newDayVolume / stock.float.floatShares,
    },
  };
}

export interface PriceUpdate {
  price: number;
  momentum: number;
  catalystMultiplier: number;
  catalystDecay: number;
  volume: number;
}
