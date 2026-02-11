import { useGameStore, selectRecentEvents } from '../../game-engine/useGameStore';
import type { MarketEventType } from '../../utils/types';

const EVENT_STYLES: Record<
  MarketEventType,
  { color: string; border: string; icon: string }
> = {
  earnings_surprise: { color: 'text-emerald-400', border: '#34d399', icon: '\u25B2' },
  earnings_miss: { color: 'text-rose-400', border: '#fb7185', icon: '\u25BC' },
  sec_halt: { color: 'text-amber-400', border: '#fbbf24', icon: '\u26A0' },
  dilution: { color: 'text-rose-400', border: '#fb7185', icon: '\u25BC' },
  short_squeeze: { color: 'text-emerald-400', border: '#34d399', icon: '\u26A1' },
  insider_buying: { color: 'text-cyan-400', border: '#22d3ee', icon: '\u25C6' },
  fda_approval: { color: 'text-emerald-400', border: '#34d399', icon: '\u2714' },
  contract_win: { color: 'text-cyan-400', border: '#22d3ee', icon: '\u2605' },
  offering_announced: { color: 'text-orange-400', border: '#fb923c', icon: '\u25CB' },
  reddit_momentum: { color: 'text-purple-400', border: '#c084fc', icon: '\u25C7' },
};

function formatEventType(type: MarketEventType): string {
  return type.replace(/_/g, ' ').toUpperCase();
}

export function NewsTicker() {
  const events = useGameStore(selectRecentEvents(50));

  const visibleEvents = [...events].reverse();

  if (visibleEvents.length === 0) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
        <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-2">
          MARKET NEWS
        </div>
        <div className="text-[11px] text-slate-600 text-center py-3 tracking-[0.15em]">
          AWAITING MARKET DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-500 tracking-[0.15em]">
          MARKET NEWS
        </span>
        <span className="text-[9px] text-slate-600">
          {visibleEvents.length} events
        </span>
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {visibleEvents.map((event) => {
          const style = EVENT_STYLES[event.type] ?? {
            color: 'text-slate-400',
            border: '#64748b',
            icon: '\u25CF',
          };
          const impactPct = ((event.priceImpact - 1) * 100).toFixed(1);
          const isPositive = event.priceImpact >= 1;

          return (
            <div
              key={event.id}
              className="rounded px-2 py-1.5 bg-slate-900/40 border-l-2"
              style={{ borderLeftColor: style.border }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className={`${style.color} text-[10px]`}>
                    {style.icon}
                  </span>
                  <span
                    className={`${style.color} text-[9px] font-bold tracking-wider`}
                  >
                    {formatEventType(event.type)}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold ${
                    isPositive ? 'text-[#00ff88]' : 'text-[#ff3366]'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {impactPct}%
                </span>
              </div>
              <div className="text-[11px] text-slate-200 font-semibold leading-tight">
                {event.title}
              </div>
              <div className="text-[9px] text-slate-500 leading-tight mt-0.5">
                {event.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
