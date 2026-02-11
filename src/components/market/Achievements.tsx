import type { Badge, BadgeId } from '../../game-engine/scoring';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BadgeCard({
  badge,
  earned,
}: {
  badge: Badge;
  earned: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        earned
          ? 'border-indigo-500 bg-slate-800'
          : 'border-slate-700 bg-slate-800/50 opacity-40'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{earned ? badge.icon : '🔒'}</span>
        <span
          className={`text-sm font-semibold ${
            earned ? 'text-slate-100' : 'text-slate-400'
          }`}
        >
          {badge.name}
        </span>
      </div>
      <p
        className={`text-xs ${
          earned ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {badge.description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AchievementsProps {
  earnedBadges: BadgeId[];
  allBadges: Badge[];
}

export function Achievements({ earnedBadges, allBadges }: AchievementsProps) {
  const earnedSet = new Set(earnedBadges);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
        Achievements ({earnedBadges.length}/{allBadges.length})
      </div>
      <div className="grid grid-cols-2 gap-2">
        {allBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earnedSet.has(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}
