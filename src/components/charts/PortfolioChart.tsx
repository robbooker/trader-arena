import type { Player } from '../../utils/types';
import { useGameStore } from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';

interface PortfolioChartProps {
  player: Player | null;
}

const COLORS = [
  '#00ff88',
  '#ff3366',
  '#00bfff',
  '#f59e0b',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#fb923c',
];

export function PortfolioChart({ player }: PortfolioChartProps) {
  const stocks = useGameStore((s) => s.stocks);

  if (!player) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono text-[10px] text-slate-600 tracking-[0.2em] text-center">
        NO PLAYER DATA
      </div>
    );
  }

  const positions = Object.entries(player.portfolio)
    .filter(([, qty]) => qty !== 0)
    .map(([stockId, qty]) => {
      const stock = stocks.find((s) => s.id === stockId);
      const value = stock ? stock.price * Math.abs(qty) : 0;
      return {
        stockId,
        qty,
        ticker: stock?.ticker ?? '???',
        value,
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalInvested = positions.reduce((sum, p) => sum + p.value, 0);
  const totalValue = player.cash + totalInvested;

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
      <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-2">
        ALLOCATION
      </div>

      {/* Stacked bar */}
      <div className="h-3 flex rounded-sm overflow-hidden mb-3 bg-slate-900">
        {totalValue > 0 && (
          <>
            <div
              className="h-full"
              style={{
                width: `${(player.cash / totalValue) * 100}%`,
                backgroundColor: '#22d3ee33',
              }}
            />
            {positions.map((pos, i) => (
              <div
                key={pos.stockId}
                className="h-full"
                style={{
                  width: `${(pos.value / totalValue) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length] + '55',
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#22d3ee33' }} />
            <span className="text-slate-500">CASH</span>
          </span>
          <span className="text-cyan-400">{formatCurrency(player.cash)}</span>
        </div>
        {positions.map((pos, i) => (
          <div key={pos.stockId} className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: COLORS[i % COLORS.length] + '55' }}
              />
              <span className="text-slate-400">{pos.ticker}</span>
              <span className="text-slate-600">
                {pos.qty > 0 ? '' : 'S '}&times;{Math.abs(pos.qty)}
              </span>
            </span>
            <span style={{ color: COLORS[i % COLORS.length] }}>
              {formatCurrency(pos.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
        <span className="text-slate-500">TOTAL</span>
        <span className="text-white font-bold">
          {formatCurrency(totalValue)}
        </span>
      </div>
    </div>
  );
}
