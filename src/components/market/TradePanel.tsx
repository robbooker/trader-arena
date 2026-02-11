import type { Stock } from '../../utils/types';

interface TradePanelProps {
  stock: Stock | null;
}

export function TradePanel({ stock }: TradePanelProps) {
  if (!stock) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-500">
        Select a stock to trade
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="font-semibold mb-3">Trade {stock.ticker}</h3>
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded font-semibold transition-colors">
          Buy
        </button>
        <button className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded font-semibold transition-colors">
          Sell
        </button>
      </div>
    </div>
  );
}
