import type { BadgeId } from '../../game-engine/scoring';
import { ALL_BADGES } from '../../game-engine/scoring';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalScore: number;
  level: number;
  badges: BadgeId[];
  rank: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const RANK_COLORS: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

const RANK_LABELS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function BadgeIcons({ badges }: { badges: BadgeId[] }) {
  const maxVisible = 3;
  const visible = badges.slice(0, maxVisible);
  const overflow = badges.length - maxVisible;

  return (
    <span className="flex items-center gap-0.5">
      {visible.map((id) => {
        const badge = ALL_BADGES.find((b) => b.id === id);
        return (
          <span key={id} title={badge?.name}>
            {badge?.icon ?? '?'}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="text-[10px] text-slate-500">+{overflow}</span>
      )}
    </span>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColor = RANK_COLORS[entry.rank] ?? 'text-slate-400';
  const rankLabel = RANK_LABELS[entry.rank];

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 rounded">
      <div className="flex items-center gap-3">
        <span className={`w-6 text-center text-sm font-bold ${rankColor}`}>
          {rankLabel ?? `#${entry.rank}`}
        </span>
        <span className="text-sm font-semibold text-slate-200">
          {entry.playerName}
        </span>
        <span className="text-[10px] text-indigo-400 font-mono uppercase">
          Lv.{entry.level}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <BadgeIcons badges={entry.badges} />
        <span className="text-sm font-mono font-bold text-slate-100 w-16 text-right">
          {Math.round(entry.totalScore)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-500">
        No scores yet
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
        Leaderboard
      </div>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.playerId} entry={entry} />
        ))}
      </div>
    </div>
  );
}
