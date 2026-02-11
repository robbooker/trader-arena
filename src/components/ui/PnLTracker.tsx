import { useGameStore } from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';
import type { Player, Stock, Trade } from '../../utils/types';

interface PnLTrackerProps {
  playerId?: string;
}

function calculateAvgCostBasis(
  trades: Trade[],
  stockId: string,
): number {
  let cost = 0;
  let qty = 0;
  for (const t of trades) {
    if (t.stockId !== stockId) continue;
    if (t.type === 'buy') {
      cost += t.price * t.quantity;
      qty += t.quantity;
    } else {
      const avg = qty > 0 ? cost / qty : 0;
      cost -= avg * Math.min(t.quantity, qty);
      qty = Math.max(0, qty - t.quantity);
    }
  }
  return qty > 0 ? cost / qty : 0;
}

function computePnL(player: Player, stocks: Stock[]) {
  let unrealized = 0;
  let realized = 0;

  // Per-stock P&L
  const stockIds = new Set([
    ...Object.keys(player.portfolio),
    ...player.tradeHistory.map((t) => t.stockId),
  ]);

  for (const stockId of stockIds) {
    const stock = stocks.find((s) => s.id === stockId);
    const qty = player.portfolio[stockId] ?? 0;
    const trades = player.tradeHistory.filter((t) => t.stockId === stockId);
    const avgCost = calculateAvgCostBasis(trades, stockId);

    // Unrealized: open positions
    if (qty !== 0 && stock) {
      unrealized += (stock.price - avgCost) * qty;
    }

    // Realized: sold shares
    let runningQty = 0;
    let runningCost = 0;
    for (const t of trades) {
      if (t.type === 'buy') {
        runningCost += t.price * t.quantity;
        runningQty += t.quantity;
      } else {
        const avg = runningQty > 0 ? runningCost / runningQty : 0;
        realized += (t.price - avg) * t.quantity;
        runningCost -= avg * Math.min(t.quantity, runningQty);
        runningQty = Math.max(0, runningQty - t.quantity);
      }
    }
  }

  return { unrealized, realized, total: unrealized + realized };
}

function PnLValue({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const color = value >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]';
  const sign = value >= 0 ? '+' : '';
  const cls = size === 'lg' ? `text-xl font-bold ${color}` : `text-[13px] font-semibold ${color}`;
  return <span className={cls}>{sign}{formatCurrency(value)}</span>;
}

export function PnLTracker({ playerId }: PnLTrackerProps) {
  const players = useGameStore((s) => s.players);
  const stocks = useGameStore((s) => s.stocks);
  const player = players.find((p) => p.id === playerId) ?? players[0];

  if (!player) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono text-[10px] text-slate-600 tracking-[0.2em] text-center">
        NO PLAYER DATA
      </div>
    );
  }

  const { unrealized, realized, total } = computePnL(player, stocks);
  const openPositions = Object.values(player.portfolio).filter(
    (q) => q !== 0,
  ).length;

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono">
      <div className="text-[10px] text-slate-500 tracking-[0.15em] mb-2">
        P&amp;L
      </div>

      <div className="space-y-2">
        {/* Total P&L */}
        <div className="text-center pb-2 border-b border-slate-800">
          <div className="text-[9px] text-slate-600 mb-0.5">TOTAL P&amp;L</div>
          <PnLValue value={total} size="lg" />
        </div>

        {/* Unrealized */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[9px] text-slate-600">UNREALIZED</div>
            <PnLValue value={unrealized} />
          </div>
          <div
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              unrealized >= 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {openPositions} pos
          </div>
        </div>

        {/* Realized */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[9px] text-slate-600">REALIZED</div>
            <PnLValue value={realized} />
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {player.tradeHistory.length} trades
          </div>
        </div>

        {/* Account summary */}
        <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500">CASH</span>
            <span className="text-cyan-400">
              {formatCurrency(player.cash)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">PORTFOLIO</span>
            <span className="text-white">
              {formatCurrency(player.totalValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
