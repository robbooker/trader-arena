import {
  useGameStore,
  selectPhase,
  selectIsRunning,
  selectSessionProgress,
  selectTick,
} from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';
import type { GamePhase } from '../../utils/types';

const PHASE_CONFIG: Record<
  GamePhase,
  { label: string; color: string; dot: string }
> = {
  lobby: { label: 'LOBBY', color: 'text-slate-400', dot: 'bg-slate-500' },
  trading: {
    label: 'LIVE',
    color: 'text-[#00ff88]',
    dot: 'bg-[#00ff88] animate-pulse',
  },
  event: { label: 'EVENT', color: 'text-amber-400', dot: 'bg-amber-400' },
  results: { label: 'RESULTS', color: 'text-cyan-400', dot: 'bg-cyan-400' },
};

export function HUD() {
  const phase = useGameStore(selectPhase);
  const { round, maxRounds, players } = useGameStore();
  const isRunning = useGameStore(selectIsRunning);
  const progress = useGameStore(selectSessionProgress);
  const tick = useGameStore(selectTick);

  const player = players[0];
  const cfg = PHASE_CONFIG[phase];

  return (
    <header className="bg-[#0a0e17] border-b border-slate-800 px-4 py-2 flex items-center justify-between font-mono select-none">
      {/* Left: Branding + Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[#00ff88] font-bold text-sm tracking-wider">
            TRADER
          </span>
          <span className="text-amber-400 font-bold text-sm tracking-wider">
            ARENA
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-bold tracking-[0.15em] ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        {isRunning && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-[9px] text-slate-600">
              TICK {tick}
            </span>
          </>
        )}
      </div>

      {/* Center: Round + Progress */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="text-slate-500">
          RND{' '}
          <span className="text-white font-bold">{round}</span>
          <span className="text-slate-700">/{maxRounds}</span>
        </div>
        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#00ff88] to-cyan-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <span className="text-slate-600 text-[9px] w-8 text-right">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* Right: Player stats */}
      <div className="flex items-center gap-4 text-[10px]">
        {player && (
          <>
            <div className="text-slate-500">
              CASH{' '}
              <span className="text-cyan-400 font-bold">
                {formatCurrency(player.cash)}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="text-slate-500">
              TOTAL{' '}
              <span className="text-white font-bold">
                {formatCurrency(player.totalValue)}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
