import { useGameStore } from '../../game-engine/useGameStore';
import { formatCurrency } from '../../utils/helpers';
import type { Trade } from '../../utils/types';

interface PortfolioViewProps {
  playerId?: string;
}

function getAvgCost(trades: Trade[], stockId: string): number {
  let longCost = 0;
  let longQty = 0;
  let shortCost = 0;
  let shortQty = 0;

  for (const t of trades) {
    if (t.stockId !== stockId) continue;
    if (t.type === 'buy') {
      longCost += t.price * t.quantity;
      longQty += t.quantity;
    } else if (t.type === 'sell') {
      const avg = longQty > 0 ? longCost / longQty : 0;
      longCost -= avg * Math.min(t.quantity, longQty);
      longQty = Math.max(0, longQty - t.quantity);
    } else if (t.type === 'short') {
      shortCost += t.price * t.quantity;
      shortQty += t.quantity;
    } else if (t.type === 'cover') {
      const avg = shortQty > 0 ? shortCost / shortQty : 0;
      shortCost -= avg * Math.min(t.quantity, shortQty);
      shortQty = Math.max(0, shortQty - t.quantity);
    }
  }

  if (shortQty > 0) return shortCost / shortQty;
  return longQty > 0 ? longCost / longQty : 0;
}

export function PortfolioView({ playerId }: PortfolioViewProps) {
  const players = useGameStore((s) => s.players);
  const stocks = useGameStore((s) => s.stocks);
  const player = players.find((p) => p.id === playerId) ?? players[0];

  if (!player) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono text-[10px] text-slate-600 tracking-[0.2em] text-center">
        NO PORTFOLIO DATA
      </div>
    );
  }

  const positions = Object.entries(player.portfolio)
    .filter(([, qty]) => qty !== 0)
    .map(([stockId, qty]) => {
      const stock = stocks.find((s) => s.id === stockId);
      const avgCost = getAvgCost(player.tradeHistory, stockId);
      const mktPrice = stock?.price ?? 0;
      const mktValue = mktPrice * Math.abs(qty);
      const pnl = (mktPrice - avgCost) * qty;
      const pnlPct = avgCost > 0 ? ((mktPrice - avgCost) / avgCost) * 100 : 0;
      return {
        stockId,
        ticker: stock?.ticker ?? '???',
        qty,
        avgCost,
        mktPrice,
        mktValue,
        pnl,
        pnlPct,
      };
    })
    .sort((a, b) => Math.abs(b.mktValue) - Math.abs(a.mktValue));

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded font-mono">
      <div className="px-3 pt-3 pb-1.5 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 tracking-[0.15em]">
          POSITIONS
        </span>
        <span className="text-[9px] text-slate-600">
          {positions.length} open
        </span>
      </div>

      {positions.length === 0 ? (
        <div className="text-[11px] text-slate-600 text-center py-5 tracking-[0.15em]">
          NO OPEN POSITIONS
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-600 border-b border-slate-800">
                <th className="text-left px-3 py-1 font-normal">SYM</th>
                <th className="text-right px-2 py-1 font-normal">QTY</th>
                <th className="text-right px-2 py-1 font-normal">AVG</th>
                <th className="text-right px-2 py-1 font-normal">MKT</th>
                <th className="text-right px-2 py-1 font-normal">VALUE</th>
                <th className="text-right px-3 py-1 font-normal">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr
                  key={pos.stockId}
                  className="border-b border-slate-800/50 hover:bg-slate-800/20"
                >
                  <td className="px-3 py-1.5">
                    <span className="text-white font-bold">{pos.ticker}</span>
                    {pos.qty < 0 && (
                      <span className="ml-1 text-[8px] text-orange-400 font-bold">
                        SHORT
                      </span>
                    )}
                  </td>
                  <td
                    className={`text-right px-2 py-1.5 ${
                      pos.qty >= 0 ? 'text-slate-300' : 'text-orange-400'
                    }`}
                  >
                    {pos.qty.toLocaleString()}
                  </td>
                  <td className="text-right px-2 py-1.5 text-slate-500">
                    {pos.avgCost.toFixed(2)}
                  </td>
                  <td className="text-right px-2 py-1.5 text-amber-400">
                    {pos.mktPrice.toFixed(2)}
                  </td>
                  <td className="text-right px-2 py-1.5 text-slate-300">
                    {formatCurrency(pos.mktValue)}
                  </td>
                  <td
                    className={`text-right px-3 py-1.5 ${
                      pos.pnl >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'
                    }`}
                  >
                    <div>
                      {pos.pnl >= 0 ? '+' : ''}
                      {formatCurrency(pos.pnl)}
                    </div>
                    <div className="text-[8px] opacity-70">
                      {pos.pnlPct >= 0 ? '+' : ''}
                      {pos.pnlPct.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
