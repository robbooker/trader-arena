import type { Stock } from '../../utils/types';

interface StockTickerProps {
  stocks: Stock[];
  onSelect: (stock: Stock) => void;
  selectedId?: string | null;
}

export function StockTicker({ stocks, onSelect, selectedId }: StockTickerProps) {
  if (stocks.length === 0) {
    return (
      <div className="bg-[#0d1117] border border-slate-800 rounded p-3 font-mono text-[10px] text-slate-600 tracking-[0.2em] text-center">
        NO INSTRUMENTS
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {stocks.map((stock) => {
        const change = stock.price - stock.previousClose;
        const changePct = stock.previousClose
          ? (change / stock.previousClose) * 100
          : 0;
        const up = change >= 0;
        const isSelected = stock.id === selectedId;

        return (
          <button
            key={stock.id}
            onClick={() => onSelect(stock)}
            className={`flex items-center justify-between p-2 rounded border transition-colors text-left font-mono ${
              isSelected
                ? 'bg-slate-800 border-[#00ff88]/30'
                : 'bg-[#0d1117] border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white">{stock.ticker}</span>
              <span className="text-[9px] text-slate-600">{stock.sector}</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-white font-bold">
                ${stock.price.toFixed(2)}
              </div>
              <div
                className={`text-[9px] font-bold ${
                  up ? 'text-[#00ff88]' : 'text-[#ff3366]'
                }`}
              >
                {up ? '+' : ''}{changePct.toFixed(1)}%
              </div>
            </div>
            {stock.halted && (
              <span className="absolute right-1 top-0.5 text-[7px] font-bold text-amber-400">
                HALT
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
