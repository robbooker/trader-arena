import type { OrderBook, OrderBookLevel, Stock } from '../utils/types';

const BOOK_DEPTH = 8; // levels each side
const BASE_SIZE_FRACTION = 0.0005; // base order size as fraction of float
const SPREAD_VOLATILITY_FACTOR = 0.3; // how much volatility widens spread

/**
 * Generate a simulated order book snapshot for a stock.
 * Micro-cap books are thin, with wide spreads and lumpy size.
 */
export function generateOrderBook(stock: Stock): OrderBook {
  const price = stock.price;
  if (price <= 0) {
    return { bids: [], asks: [], spread: 0, spreadPercent: 0 };
  }

  // Spread is wider for more volatile / lower priced stocks
  const baseSpread = price < 1 ? 0.005 : 0.01;
  const volatilitySpread = stock.volatility * SPREAD_VOLATILITY_FACTOR * price;
  const halfSpread = (baseSpread + volatilitySpread) / 2;

  // Tick size
  const tickSize = price >= 1 ? 0.01 : 0.0001;

  const bestBid = roundToTick(price - halfSpread, tickSize);
  const bestAsk = roundToTick(price + halfSpread, tickSize);

  const baseSize = Math.floor(stock.float.floatShares * BASE_SIZE_FRACTION);

  // Generate bid levels (descending from best bid)
  const bids: OrderBookLevel[] = [];
  for (let i = 0; i < BOOK_DEPTH; i++) {
    const levelPrice = roundToTick(bestBid - i * tickSize * randomInt(1, 4), tickSize);
    if (levelPrice <= 0) break;

    // Size tends to increase away from the spread (thicker support deeper)
    const depthMultiplier = 1 + i * 0.3;
    // Add randomness — micro-cap books are lumpy
    const size = Math.floor(baseSize * depthMultiplier * (0.3 + Math.random() * 1.4));

    bids.push({ price: levelPrice, size });
  }

  // Generate ask levels (ascending from best ask)
  const asks: OrderBookLevel[] = [];
  for (let i = 0; i < BOOK_DEPTH; i++) {
    const levelPrice = roundToTick(bestAsk + i * tickSize * randomInt(1, 4), tickSize);

    // Resistance walls — occasional big seller sitting on the ask
    const isWall = Math.random() < 0.12;
    const depthMultiplier = 1 + i * 0.25;
    const wallMultiplier = isWall ? (3 + Math.random() * 5) : 1;
    const size = Math.floor(baseSize * depthMultiplier * wallMultiplier * (0.3 + Math.random() * 1.4));

    asks.push({ price: levelPrice, size });
  }

  const spread = bestAsk - bestBid;
  const spreadPercent = (spread / price) * 100;

  return {
    bids,
    asks,
    spread: Math.round(spread * 10000) / 10000,
    spreadPercent: Math.round(spreadPercent * 100) / 100,
  };
}

/**
 * Adjust order book based on momentum — thin out the side being
 * eaten by aggressive orders.
 */
export function skewOrderBook(book: OrderBook, momentum: number): OrderBook {
  if (Math.abs(momentum) < 0.02) return book;

  const bullish = momentum > 0;
  const skewFactor = Math.min(Math.abs(momentum) * 3, 0.8); // up to 80% thinning

  const thinSide = (levels: OrderBookLevel[]): OrderBookLevel[] =>
    levels.map((level) => ({
      ...level,
      size: Math.max(100, Math.floor(level.size * (1 - skewFactor))),
    }));

  const thickenSide = (levels: OrderBookLevel[]): OrderBookLevel[] =>
    levels.map((level) => ({
      ...level,
      size: Math.floor(level.size * (1 + skewFactor * 0.5)),
    }));

  return {
    ...book,
    asks: bullish ? thinSide(book.asks) : thickenSide(book.asks),
    bids: bullish ? thickenSide(book.bids) : thinSide(book.bids),
  };
}

function roundToTick(value: number, tickSize: number): number {
  return Math.round(value / tickSize) * tickSize;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
