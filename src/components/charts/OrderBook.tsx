import type { Stock } from '../../utils/types';

interface OrderBookProps {
  stock: Stock | null;
  maxLevels?: number;
}

export function OrderBook({ stock, maxLevels = 12 }: OrderBookProps) {
  if (!stock) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono text-xs text-slate-600 tracking-[0.2em] text-center">
        NO DATA
      </div>
    );
  }

  const { orderBook, halted } = stock;
  const asks = orderBook.asks.slice(0, maxLevels).reverse(); // show worst ask on top
  const bids = orderBook.bids.slice(0, maxLevels);

  // Cumulative totals for depth bars
  let askCumulative = 0;
  const askLevels = [...asks].reverse().map((lvl) => {
    askCumulative += lvl.size;
    return { ...lvl, total: askCumulative };
  });
  askLevels.reverse();

  let bidCumulative = 0;
  const bidLevels = bids.map((lvl) => {
    bidCumulative += lvl.size;
    return { ...lvl, total: bidCumulative };
  });

  const maxTotal = Math.max(
    askLevels[0]?.total ?? 1,
    bidLevels[bidLevels.length - 1]?.total ?? 1,
  );

  return (
    <div className="bg-[#0d1117] border border-slate-800 rounded font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
        <span className="text-[10px] text-slate-500 tracking-[0.15em]">
          ORDER BOOK
        </span>
        {halted && (
          <span className="text-[9px] font-bold text-amber-400 animate-pulse">
            HALTED
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-[9px] text-slate-600 border-b border-slate-800/50">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>

      {/* Asks */}
      <div className="flex flex-col">
        {askLevels.map((lvl, i) => (
          <div
            key={`ask-${i}`}
            className="relative grid grid-cols-3 px-3 py-[2px] text-[11px]"
          >
            <div
              className="absolute inset-y-0 right-0 bg-rose-500/8"
              style={{ width: `${(lvl.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-rose-400">
              {lvl.price.toFixed(2)}
            </span>
            <span className="relative text-right text-slate-400">
              {lvl.size.toLocaleString()}
            </span>
            <span className="relative text-right text-slate-600">
              {lvl.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="flex items-center justify-between px-3 py-1 border-y border-slate-800 bg-slate-900/60 text-[10px]">
        <span className="text-amber-400 font-bold">
          {orderBook.spread.toFixed(2)}
        </span>
        <span className="text-slate-500">
          SPREAD {orderBook.spreadPercent.toFixed(3)}%
        </span>
      </div>

      {/* Bids */}
      <div className="flex flex-col">
        {bidLevels.map((lvl, i) => (
          <div
            key={`bid-${i}`}
            className="relative grid grid-cols-3 px-3 py-[2px] text-[11px]"
          >
            <div
              className="absolute inset-y-0 right-0 bg-emerald-500/8"
              style={{ width: `${(lvl.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-emerald-400">
              {lvl.price.toFixed(2)}
            </span>
            <span className="relative text-right text-slate-400">
              {lvl.size.toLocaleString()}
            </span>
            <span className="relative text-right text-slate-600">
              {lvl.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 border-t border-slate-800 text-[9px] text-slate-500">
        <div>
          VOL{' '}
          <span className="text-cyan-400">
            {stock.volume.current.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          RVOL{' '}
          <span
            className={
              stock.volume.relativeVolume >= 2
                ? 'text-amber-400'
                : 'text-slate-400'
            }
          >
            {stock.volume.relativeVolume.toFixed(1)}x
          </span>
        </div>
        <div className="text-right">
          SI{' '}
          <span className="text-orange-400">
            {(
              (stock.float.shortInterest / stock.float.floatShares) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
      </div>
    </div>
  );
}
