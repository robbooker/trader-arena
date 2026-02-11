import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GamePhase, Stock, MarketEvent, Trade, Player } from '../utils/types';
import { MAX_ROUNDS, STARTING_CASH } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { createInitialStocks } from './stocks';
import {
  createEngineState,
  executeTick,
  applyTickResult,
  TICK_INTERVAL_MS,
  SESSION_LENGTH_TICKS,
} from './marketEngine';
import type { EngineState } from './marketEngine';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface MarketState {
  // Game meta
  phase: GamePhase;
  round: number;
  maxRounds: number;

  // Market data
  tick: number;
  stocks: Stock[];
  events: MarketEvent[];
  tickSpeed: number;

  // Players
  players: Player[];

  // Internal engine state (not for UI consumption)
  _engine: EngineState | null;
  _intervalId: ReturnType<typeof setInterval> | null;
}

interface MarketActions {
  // Lifecycle
  initGame: () => void;
  startTrading: () => void;
  pauseTrading: () => void;
  resumeTrading: () => void;
  stopTrading: () => void;
  setPhase: (phase: GamePhase) => void;
  nextRound: () => void;
  reset: () => void;
  setTickSpeed: (ms: number) => void;

  // Trading
  executeTrade: (playerId: string, stockId: string, type: 'buy' | 'sell', quantity: number) => Trade | null;
  addPlayer: (name: string) => Player;

  // Manual tick (for testing / step-through)
  manualTick: () => void;
}

export type GameStore = MarketState & MarketActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: MarketState = {
  phase: 'lobby',
  round: 1,
  maxRounds: MAX_ROUNDS,
  tick: 0,
  stocks: [],
  events: [],
  tickSpeed: TICK_INTERVAL_MS,
  players: [],
  _engine: null,
  _intervalId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ------ Lifecycle ------

    initGame: () => {
      const stocks = createInitialStocks();
      const engine = createEngineState(stocks);
      set({
        stocks,
        _engine: engine,
        phase: 'lobby',
        tick: 0,
        events: [],
        round: 1,
      });
    },

    startTrading: () => {
      const state = get();
      if (state._intervalId) return; // already running

      let engine = state._engine;
      if (!engine) {
        const stocks = createInitialStocks();
        engine = createEngineState(stocks);
      }

      const intervalId = setInterval(() => {
        const current = get();
        if (!current._engine) return;

        const result = executeTick(current._engine);
        const nextEngine = applyTickResult(current._engine, result);

        set({
          _engine: nextEngine,
          tick: result.tick,
          stocks: result.stocks,
          events: nextEngine.events,
        });

        // Check session end
        if (result.sessionComplete) {
          get().stopTrading();
          set({ phase: 'results' });
        }
      }, state.tickSpeed);

      set({
        _engine: engine,
        _intervalId: intervalId,
        phase: 'trading',
      });
    },

    pauseTrading: () => {
      const { _intervalId } = get();
      if (_intervalId) {
        clearInterval(_intervalId);
        set({ _intervalId: null });
      }
    },

    resumeTrading: () => {
      const state = get();
      if (state._intervalId || !state._engine) return;

      const intervalId = setInterval(() => {
        const current = get();
        if (!current._engine) return;

        const result = executeTick(current._engine);
        const nextEngine = applyTickResult(current._engine, result);

        set({
          _engine: nextEngine,
          tick: result.tick,
          stocks: result.stocks,
          events: nextEngine.events,
        });

        if (result.sessionComplete) {
          get().stopTrading();
          set({ phase: 'results' });
        }
      }, state.tickSpeed);

      set({ _intervalId: intervalId });
    },

    stopTrading: () => {
      const { _intervalId } = get();
      if (_intervalId) {
        clearInterval(_intervalId);
        set({ _intervalId: null });
      }
    },

    setPhase: (phase) => set({ phase }),

    nextRound: () => {
      const state = get();
      if (state.round >= state.maxRounds) return;

      // Reset stocks for new round
      const stocks = createInitialStocks();
      const engine = createEngineState(stocks);
      set({
        round: state.round + 1,
        stocks,
        _engine: engine,
        tick: 0,
        events: [],
        phase: 'lobby',
      });
    },

    reset: () => {
      const { _intervalId } = get();
      if (_intervalId) clearInterval(_intervalId);
      set({ ...initialState });
    },

    setTickSpeed: (ms) => {
      const state = get();
      set({ tickSpeed: ms });

      // Restart interval if running
      if (state._intervalId) {
        clearInterval(state._intervalId);
        const intervalId = setInterval(() => {
          const current = get();
          if (!current._engine) return;

          const result = executeTick(current._engine);
          const nextEngine = applyTickResult(current._engine, result);

          set({
            _engine: nextEngine,
            tick: result.tick,
            stocks: result.stocks,
            events: nextEngine.events,
          });

          if (result.sessionComplete) {
            get().stopTrading();
            set({ phase: 'results' });
          }
        }, ms);
        set({ _intervalId: intervalId });
      }
    },

    // ------ Trading ------

    executeTrade: (playerId, stockId, type, quantity) => {
      const state = get();
      const player = state.players.find((p) => p.id === playerId);
      const stock = state.stocks.find((s) => s.id === stockId);
      if (!player || !stock || stock.halted) return null;

      // Price from order book
      const fillPrice = type === 'buy'
        ? (stock.orderBook.asks[0]?.price ?? stock.price)
        : (stock.orderBook.bids[0]?.price ?? stock.price);

      const totalCost = fillPrice * quantity;

      if (type === 'buy') {
        if (player.cash < totalCost) return null;
      } else {
        const held = player.portfolio[stockId] ?? 0;
        if (held < quantity) return null;
      }

      const trade: Trade = {
        id: generateId(),
        playerId,
        stockId,
        type,
        quantity,
        price: fillPrice,
        timestamp: Date.now(),
      };

      // Update player
      const updatedPlayers = state.players.map((p) => {
        if (p.id !== playerId) return p;
        const newCash = type === 'buy'
          ? p.cash - totalCost
          : p.cash + totalCost;
        const newPortfolio = { ...p.portfolio };
        const currentHolding = newPortfolio[stockId] ?? 0;
        newPortfolio[stockId] = type === 'buy'
          ? currentHolding + quantity
          : currentHolding - quantity;

        // Clean up zero positions
        if (newPortfolio[stockId] === 0) {
          delete newPortfolio[stockId];
        }

        // Recalculate total value
        let portfolioValue = 0;
        for (const [sid, qty] of Object.entries(newPortfolio)) {
          const s = state.stocks.find((st) => st.id === sid);
          if (s) portfolioValue += s.price * qty;
        }

        return {
          ...p,
          cash: newCash,
          portfolio: newPortfolio,
          totalValue: newCash + portfolioValue,
          tradeHistory: [...p.tradeHistory, trade],
        };
      });

      set({ players: updatedPlayers });
      return trade;
    },

    addPlayer: (name) => {
      const player: Player = {
        id: generateId(),
        name,
        cash: STARTING_CASH,
        portfolio: {},
        totalValue: STARTING_CASH,
        tradeHistory: [],
      };
      set((state) => ({ players: [...state.players, player] }));
      return player;
    },

    // ------ Debug / step ------

    manualTick: () => {
      const state = get();
      if (!state._engine) return;

      const result = executeTick(state._engine);
      const nextEngine = applyTickResult(state._engine, result);

      set({
        _engine: nextEngine,
        tick: result.tick,
        stocks: result.stocks,
        events: nextEngine.events,
      });
    },
  })),
);

// ---------------------------------------------------------------------------
// Selectors — for efficient UI subscriptions
// ---------------------------------------------------------------------------

export const selectStocks = (state: GameStore) => state.stocks;
export const selectStockByTicker = (ticker: string) => (state: GameStore) =>
  state.stocks.find((s) => s.ticker === ticker);
export const selectStockById = (id: string) => (state: GameStore) =>
  state.stocks.find((s) => s.id === id);
export const selectEvents = (state: GameStore) => state.events;
export const selectRecentEvents = (n: number) => (state: GameStore) =>
  state.events.slice(-n);
export const selectTick = (state: GameStore) => state.tick;
export const selectPhase = (state: GameStore) => state.phase;
export const selectPlayers = (state: GameStore) => state.players;
export const selectPlayerById = (id: string) => (state: GameStore) =>
  state.players.find((p) => p.id === id);
export const selectIsRunning = (state: GameStore) => state._intervalId !== null;
export const selectSessionProgress = (state: GameStore) =>
  state.tick / SESSION_LENGTH_TICKS;
