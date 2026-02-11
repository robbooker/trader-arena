import { useMemo } from 'react';
import { useGameStore } from '../../game-engine/useGameStore';
import {
  calculatePlayerScore,
  evaluateChallenges,
  ALL_BADGES,
  CHALLENGES,
  LEVEL_CONFIGS,
} from '../../game-engine';
import type { PlayerScore } from '../../game-engine';
import { formatCurrency } from '../../utils/helpers';
import { STARTING_CASH } from '../../utils/constants';

interface ResultsScreenProps {
  playerId: string;
  onNextRound: () => void;
  onNewGame: () => void;
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-500">{label}</span>
        <span className="text-white font-bold">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00ff88] to-cyan-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsScreen({ playerId, onNextRound, onNewGame }: ResultsScreenProps) {
  const players = useGameStore((s) => s.players);
  const stocks = useGameStore((s) => s.stocks);
  const round = useGameStore((s) => s.round);
  const maxRounds = useGameStore((s) => s.maxRounds);

  const player = players.find((p) => p.id === playerId) ?? players[0];

  const score: PlayerScore | null = useMemo(() => {
    if (!player) return null;
    const challengeProgress = evaluateChallenges(player, stocks);
    return calculatePlayerScore(player, stocks, round, maxRounds, challengeProgress);
  }, [player, stocks, round, maxRounds]);

  const challengeProgress = useMemo(() => {
    if (!player) return [];
    return evaluateChallenges(player, stocks);
  }, [player, stocks]);

  if (!player || !score) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e17] text-slate-500 font-mono">
        NO RESULTS DATA
      </div>
    );
  }

  const levelConfig = LEVEL_CONFIGS[Math.min(score.level, 6) - 1];
  const pnl = player.totalValue - STARTING_CASH;
  const pnlPct = (pnl / STARTING_CASH) * 100;
  const canNextRound = round < maxRounds;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e17] select-none p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-[10px] text-slate-500 font-mono tracking-[0.2em]">
            ROUND {round} COMPLETE
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {Math.round(score.totalScore)}
            <span className="text-[14px] text-slate-500 ml-2">PTS</span>
          </div>
          <div className="text-sm font-mono">
            <span className="text-indigo-400">Lv.{score.level}</span>
            <span className="text-slate-600 mx-2">&middot;</span>
            <span className="text-slate-400">{levelConfig.label}</span>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-center mb-4">
            <div className="text-[9px] text-slate-600 tracking-[0.2em] mb-1">TOTAL P&L</div>
            <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              <span className="text-[12px] ml-2 opacity-70">
                ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
            <div>
              <div className="text-slate-600 mb-0.5">FINAL VALUE</div>
              <div className="text-white font-bold">{formatCurrency(player.totalValue)}</div>
            </div>
            <div>
              <div className="text-slate-600 mb-0.5">WIN RATE</div>
              <div className="text-amber-400 font-bold">{(score.winRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-slate-600 mb-0.5">MAX DRAWDOWN</div>
              <div className="text-rose-400 font-bold">{(score.maxDrawdown * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono space-y-3">
          <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-1">SCORE BREAKDOWN</div>
          <ScoreBar label="P&L SCORE" value={score.pnlScore} max={70} />
          <ScoreBar label="RISK MANAGEMENT" value={score.riskScore} max={25} />
          <ScoreBar label="ACCURACY" value={score.accuracyScore} max={50} />
          <ScoreBar label="SPEED" value={score.speedScore} max={30} />
          {score.challengeBonus > 0 && (
            <ScoreBar label="CHALLENGE BONUS" value={score.challengeBonus} max={1750} />
          )}
        </div>

        {/* Challenges */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-3">CHALLENGES</div>
          <div className="space-y-2">
            {CHALLENGES.map((challenge) => {
              const progress = challengeProgress.find((p) => p.challengeId === challenge.id);
              const completed = progress?.completed ?? false;
              const pct = (progress?.progress ?? 0) * 100;
              return (
                <div
                  key={challenge.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    completed
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-slate-900/50'
                  }`}
                >
                  <div>
                    <div className={`text-[11px] font-bold ${completed ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {completed ? '\u2714 ' : ''}{challenge.name}
                    </div>
                    <div className="text-[9px] text-slate-600">{challenge.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-bold ${completed ? 'text-emerald-400' : 'text-slate-600'}`}>
                      +{challenge.reward}
                    </div>
                    {!completed && pct > 0 && (
                      <div className="text-[9px] text-slate-600">{pct.toFixed(0)}%</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        {score.badges.length > 0 && (
          <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono">
            <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-3">
              BADGES EARNED ({score.badges.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {score.badges.map((badgeId) => {
                const badge = ALL_BADGES.find((b) => b.id === badgeId);
                if (!badge) return null;
                return (
                  <div
                    key={badgeId}
                    className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1"
                  >
                    <span>{badge.icon}</span>
                    <span className="text-[10px] text-indigo-300 font-bold">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {canNextRound ? (
            <button
              onClick={onNextRound}
              className="flex-1 py-3 bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-mono font-bold text-sm tracking-wider rounded-lg transition-colors"
            >
              NEXT ROUND
            </button>
          ) : (
            <div className="flex-1 py-3 text-center text-amber-400 font-mono text-sm font-bold bg-amber-400/10 rounded-lg">
              ALL ROUNDS COMPLETE
            </div>
          )}
          <button
            onClick={onNewGame}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-sm tracking-wider rounded-lg transition-colors"
          >
            NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
}
