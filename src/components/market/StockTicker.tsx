import type { Stock } from '../../utils/types';

interface StockTickerProps {
  stocks: Stock[];
  onSelect: (stock: Stock) => void;
}

export function StockTicker({ stocks, onSelect }: StockTickerProps) {
  if (stocks.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-500">
        No stocks available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {stocks.map((stock) => (
        <button
          key={stock.id}
          onClick={() => onSelect(stock)}
          className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700 transition-colors text-left"
        >
          <div>
            <span className="font-bold">{stock.ticker}</span>
            <span className="ml-2 text-slate-400 text-sm">{stock.name}</span>
          </div>
          <span className="font-mono">${stock.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
