// Market simulation engine — public API
export {
  useGameStore,
  selectStocks,
  selectStockByTicker,
  selectStockById,
  selectEvents,
  selectRecentEvents,
  selectTick,
  selectPhase,
  selectPlayers,
  selectPlayerById,
  selectIsRunning,
  selectSessionProgress,
} from './useGameStore';
export type { GameStore } from './useGameStore';

export {
  TICK_INTERVAL_MS,
  SESSION_LENGTH_TICKS,
} from './marketEngine';

export type { PriceUpdate } from './priceEngine';

// Scoring
export {
  calculatePlayerScore,
  calculateLevel,
  getLevelConfig,
  ALL_BADGES,
  LEVEL_CONFIGS,
} from './scoring';
export type { PlayerScore, Badge, BadgeId, LevelConfig } from './scoring';

// Challenges
export {
  evaluateChallenges,
  CHALLENGES,
  getChallengeById,
  analyzeClosedTrades,
} from './challenges';
export type { ChallengeProgress, ChallengeDefinition, ChallengeId } from './challenges';
