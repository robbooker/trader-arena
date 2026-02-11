import { create } from 'zustand';
import type { GameState, GamePhase } from '../utils/types';
import { MAX_ROUNDS, DEFAULT_TICK_SPEED } from '../utils/constants';

interface GameActions {
  setPhase: (phase: GamePhase) => void;
  nextRound: () => void;
  reset: () => void;
}

const initialState: GameState = {
  phase: 'lobby',
  round: 1,
  maxRounds: MAX_ROUNDS,
  players: [],
  stocks: [],
  events: [],
  currentEventIndex: 0,
  tickSpeed: DEFAULT_TICK_SPEED,
};

export const useGameStore = create<GameState & GameActions>()((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  nextRound: () =>
    set((state) => ({
      round: Math.min(state.round + 1, state.maxRounds),
    })),

  reset: () => set(initialState),
}));
