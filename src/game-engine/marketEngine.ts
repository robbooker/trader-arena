import type { Stock, MarketEvent } from '../utils/types';
import { computeNextPrice, applyPriceUpdate } from './priceEngine';
import { maybeGenerateEvent, getEventHaltDuration, isHaltEvent } from './eventEngine';
import { generateOrderBook, skewOrderBook } from './orderBook';

export const TICK_INTERVAL_MS = 200; // 200ms real time = 1 simulated minute
export const SESSION_LENGTH_TICKS = 390; // 6.5 hours of trading

export interface TickResult {
  stocks: Stock[];
  newEvents: MarketEvent[];
  tick: number;
  sessionComplete: boolean;
}

export interface EngineState {
  tick: number;
  stocks: Stock[];
  events: MarketEvent[];
  lastEventTicks: Map<string, number>;
  running: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
}

export function createEngineState(stocks: Stock[]): EngineState {
  return {
    tick: 0,
    stocks,
    events: [],
    lastEventTicks: new Map(),
    running: false,
    intervalId: null,
  };
}

/**
 * Execute a single market tick. Pure function — takes state in, returns new state.
 */
export function executeTick(state: EngineState): TickResult {
  const tick = state.tick + 1;
  const newEvents: MarketEvent[] = [];

  // 1. Check for new events
  const event = maybeGenerateEvent(state.stocks, tick, state.lastEventTicks);
  if (event) {
    newEvents.push(event);
  }

  // 2. Update each stock
  const updatedStocks = state.stocks.map((stock) => {
    let s = { ...stock };

    // Handle halt countdown
    if (s.halted) {
      s.haltTicksRemaining -= 1;
      if (s.haltTicksRemaining <= 0) {
        s.halted = false;
        s.haltTicksRemaining = 0;
      } else {
        // Still halted — update order book to empty, skip price update
        s.orderBook = { bids: [], asks: [], spread: 0, spreadPercent: 0 };
        return s;
      }
    }

    // Apply any new event effects to this stock
    for (const evt of newEvents) {
      if (evt.affectedStockIds.includes(s.id)) {
        // Apply catalyst
        s.catalystMultiplier = evt.priceImpact;
        s.catalystDecay = 1 / evt.duration; // linear decay over duration

        // Apply halt if applicable
        if (isHaltEvent(evt.type)) {
          s.halted = true;
          s.haltTicksRemaining = getEventHaltDuration(evt);
          s.orderBook = { bids: [], asks: [], spread: 0, spreadPercent: 0 };
          return s;
        }
      }
    }

    // Compute new price
    const priceUpdate = computeNextPrice(s, tick);
    s = applyPriceUpdate(s, priceUpdate);

    // Regenerate order book
    const book = generateOrderBook(s);
    s.orderBook = skewOrderBook(book, s.momentum);

    return s;
  });

  return {
    stocks: updatedStocks,
    newEvents,
    tick,
    sessionComplete: tick >= SESSION_LENGTH_TICKS,
  };
}

/**
 * Apply a tick result back to the engine state.
 */
export function applyTickResult(state: EngineState, result: TickResult): EngineState {
  const lastEventTicks = new Map(state.lastEventTicks);
  for (const event of result.newEvents) {
    for (const stockId of event.affectedStockIds) {
      lastEventTicks.set(stockId, result.tick);
    }
  }

  return {
    ...state,
    tick: result.tick,
    stocks: result.stocks,
    events: [...state.events, ...result.newEvents],
    lastEventTicks,
  };
}
